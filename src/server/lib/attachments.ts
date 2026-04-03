/**
 * Attachment helpers for storage error normalization and multimodal conversion.
 */
import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubmissionAttachment } from "../../shared/types.js";

const execFileAsync = promisify(execFile);
export const attachmentBucket = "submission-attachments";

export const attachmentLimits = {
  maxFiles: 3,
  maxFileSizeBytes: 5_000_000,
  pdfMaxPages: 3,
} as const;

type AttachmentContentPart = {
  type: "input_image";
  image_url: string;
  detail: "low";
};

export type ResolvedAttachmentInlineData = {
  mimeType: string;
  data: string;
};

/**
 * Converts raw storage failures into clearer product-level messages.
 */
export function normalizeAttachmentStorageError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.toLowerCase().includes("bucket not found")) {
    return new Error(
      `Supabase Storage bucket '${attachmentBucket}' was not found. Create that bucket before uploading or evaluating attachments.`,
    );
  }
  if (message.toLowerCase().includes("row-level security")) {
    return new Error(
      `Supabase RLS blocked access to bucket '${attachmentBucket}'. Add storage object policies for that bucket before uploading or evaluating attachments.`,
    );
  }

  return error instanceof Error ? error : new Error(message);
}

/**
 * Rasterizes a PDF into PNG pages so it can be forwarded as image input.
 */
async function renderPdfPages(pdfBuffer: Buffer): Promise<Buffer[]> {
  const workingDir = await mkdtemp(path.join(tmpdir(), "ai-judge-pdf-"));
  const inputPath = path.join(workingDir, "attachment.pdf");
  const outputPrefix = path.join(workingDir, "page");

  try {
    await writeFile(inputPath, pdfBuffer);
    await execFileAsync("pdftoppm", [
      "-png",
      "-f",
      "1",
      "-l",
      String(attachmentLimits.pdfMaxPages),
      inputPath,
      outputPrefix,
    ]);

    const outputFiles = (await readdir(workingDir))
      .filter((file) => file.startsWith("page-") && file.endsWith(".png"))
      .sort();

    return Promise.all(outputFiles.map((file) => readFile(path.join(workingDir, file))));
  } finally {
    await rm(workingDir, { recursive: true, force: true });
  }
}

/**
 * Downloads attachments from storage and converts them into provider-agnostic
 * inline image payloads.
 */
export async function resolveAttachmentInlineData(
  supabase: SupabaseClient,
  attachments: SubmissionAttachment[],
): Promise<ResolvedAttachmentInlineData[]> {
  const eligibleAttachments = attachments
    .filter((attachment) => (attachment.fileSize ?? 0) <= attachmentLimits.maxFileSizeBytes)
    .slice(0, attachmentLimits.maxFiles);

  const parts: ResolvedAttachmentInlineData[] = [];

  for (const attachment of eligibleAttachments) {
    const { data, error } = await supabase.storage.from(attachmentBucket).download(attachment.storagePath);
    if (error || !data) {
      throw normalizeAttachmentStorageError(error ?? new Error(`Attachment ${attachment.fileName} could not be downloaded.`));
    }

    const bytes = Buffer.from(await data.arrayBuffer());

    if (attachment.mimeType === "application/pdf") {
      const pages = await renderPdfPages(bytes);
      for (const page of pages) {
        parts.push({
          mimeType: "image/png",
          data: page.toString("base64"),
        });
      }
      continue;
    }

    parts.push({
      mimeType: attachment.mimeType,
      data: bytes.toString("base64"),
    });
  }

  return parts;
}

/**
 * Converts eligible attachments into OpenAI image parts.
 */
export async function resolveAttachmentContentParts(
  supabase: SupabaseClient,
  attachments: SubmissionAttachment[],
): Promise<AttachmentContentPart[]> {
  const parts = await resolveAttachmentInlineData(supabase, attachments);
  return parts.map((part) => ({
    type: "input_image",
    image_url: `data:${part.mimeType};base64,${part.data}`,
    detail: "low",
  }));
}
