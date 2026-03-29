import express from "express";
import multer from "multer";
import path from "node:path";
import { z } from "zod";
import { coerceImportedSubmissionsToQueue, parseImportedSubmissions } from "../../shared/parser.js";
import { defaultPromptFieldConfig, promptFieldConfigSchema } from "../../shared/types.js";
import { Database } from "../lib/database.js";
import { attachmentBucket, attachmentLimits, normalizeAttachmentStorageError } from "../lib/attachments.js";
import { runEvaluationsForQueue } from "../lib/evaluationRunner.js";
import { getSupabaseClient } from "../lib/supabase.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
const database = new Database(getSupabaseClient());
const allowedAttachmentMimeTypes = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);

function normalizeAttachmentPersistenceError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.toLowerCase().includes("row-level security")) {
    if (message.includes("submission_attachments")) {
      return new Error(
        "Supabase RLS blocked insert into 'submission_attachments'. Apply the attachment table policies in supabase_bonus_features.sql.",
      );
    }
    if (message.includes("submissions")) {
      return new Error(
        "Supabase RLS blocked update on 'submissions'. Apply the submission update policies in supabase_bonus_features.sql.",
      );
    }
    return new Error(
      "Supabase RLS blocked attachment metadata persistence. Apply the attachment policies in supabase_bonus_features.sql.",
    );
  }

  return error instanceof Error ? error : new Error(message);
}

function sanitizeStorageFileName(originalName: string): string {
  const baseName = path.basename(originalName).normalize("NFKD");
  const extension = path.extname(baseName).toLowerCase();
  const stem = baseName.slice(0, baseName.length - extension.length) || baseName;

  const safeStem = stem
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "");

  const safeExtension = extension
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-zA-Z0-9.]+/g, "")
    .toLowerCase();

  const finalStem = safeStem || "attachment";
  const finalExtension = safeExtension.startsWith(".") ? safeExtension : safeExtension ? `.${safeExtension}` : "";
  return `${finalStem}${finalExtension || ".bin"}`;
}

const judgePayloadSchema = z.object({
  name: z.string().min(1),
  rubricPrompt: z.string().min(1),
  provider: z.string().min(1).default("openai"),
  model: z.string().min(1),
  active: z.boolean().default(true),
});

const assignmentPayloadSchema = z.object({
  assignments: z.array(
    z.object({
      questionTemplateId: z.string().min(1),
      assignments: z.array(
        z.object({
          judgeId: z.string().min(1),
          promptFieldConfig: promptFieldConfigSchema.default(defaultPromptFieldConfig),
        }),
      ),
    }),
  ),
});

const runPayloadSchema = z.object({
  questionTemplateIds: z.array(z.string().min(1)).optional(),
});

router.get("/health", (_request, response) => {
  response.json({ ok: true });
});

router.post("/import-submissions", upload.single("file"), async (request, response, next) => {
  try {
    const file = request.file;
    if (!file) {
      response.status(400).json({ error: "Expected a file upload under the 'file' field." });
      return;
    }

    const submissions = parseImportedSubmissions(file.buffer.toString("utf-8"));
    const result = await database.importSubmissions(submissions, file.originalname);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/queues/:queueId/import-submissions", upload.single("file"), async (request, response, next) => {
  try {
    const file = request.file;
    const queueId = String(request.params.queueId ?? "");
    if (!file) {
      response.status(400).json({ error: "Expected a file upload under the 'file' field." });
      return;
    }

    const parsedSubmissions = parseImportedSubmissions(file.buffer.toString("utf-8"));
    const submissions = coerceImportedSubmissionsToQueue(parsedSubmissions, queueId);
    const result = await database.importSubmissions(submissions, file.originalname, queueId);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/submissions/:submissionId/attachments", upload.array("attachments", 20), async (request, response, next) => {
  try {
    const submissionId = String(request.body.submissionId ?? "");
    if (!request.params.submissionId || !submissionId || request.params.submissionId !== submissionId) {
      response.status(400).json({ error: "submissionId must be provided and match the URL." });
      return;
    }
    if (!(await database.submissionExists(submissionId))) {
      response.status(404).json({ error: `Submission ${submissionId} was not found.` });
      return;
    }

    const attachments = (request.files as Express.Multer.File[] | undefined) ?? [];
    if (attachments.length === 0) {
      response.status(400).json({ error: "Upload at least one attachment." });
      return;
    }

    const uploadedAttachments: Array<{
      submissionId: string;
      fileName: string;
      storagePath: string;
      mimeType: string;
      fileSize: number;
    }> = [];

    for (const [index, attachment] of attachments.entries()) {
      if (!allowedAttachmentMimeTypes.has(attachment.mimetype)) {
        response.status(400).json({ error: `Unsupported attachment type for ${attachment.originalname}.` });
        return;
      }
      if (attachment.size > attachmentLimits.maxFileSizeBytes) {
        response.status(400).json({ error: `Attachment ${attachment.originalname} exceeds the 5 MB limit.` });
        return;
      }

      const safeFileName = sanitizeStorageFileName(attachment.originalname);
      const storagePath = `submissions/${submissionId}/${Date.now()}-${index}-${safeFileName}`;
      const { error: uploadError } = await getSupabaseClient().storage.from(attachmentBucket).upload(storagePath, attachment.buffer, {
        contentType: attachment.mimetype,
        upsert: true,
      });
      if (uploadError) {
        throw normalizeAttachmentStorageError(uploadError);
      }

      uploadedAttachments.push({
        submissionId,
        fileName: path.basename(attachment.originalname),
        storagePath,
        mimeType: attachment.mimetype,
        fileSize: attachment.size,
      });
    }

    try {
      response.status(201).json(await database.addSubmissionAttachments(uploadedAttachments));
    } catch (error) {
      throw normalizeAttachmentPersistenceError(error);
    }
  } catch (error) {
    next(error);
  }
});

router.get("/queues", async (_request, response, next) => {
  try {
    response.json(await database.listQueues());
  } catch (error) {
    next(error);
  }
});

router.get("/queues/:queueId", async (request, response, next) => {
  try {
    response.json(await database.getQueueDetail(request.params.queueId));
  } catch (error) {
    next(error);
  }
});

router.put("/queues/:queueId/assignments", async (request, response, next) => {
  try {
    const payload = assignmentPayloadSchema.parse(request.body);
    await database.replaceAssignments(request.params.queueId, payload.assignments);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/queues/:queueId/run", async (request, response, next) => {
  try {
    const payload = runPayloadSchema.parse(request.body ?? {});
    response.json(
      await runEvaluationsForQueue(request.params.queueId, { database }, { questionTemplateIds: payload.questionTemplateIds }),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/judges", async (_request, response, next) => {
  try {
    response.json(await database.listJudges());
  } catch (error) {
    next(error);
  }
});

router.post("/judges", async (request, response, next) => {
  try {
    const payload = judgePayloadSchema.parse(request.body);
    response.status(201).json(await database.createJudge(payload));
  } catch (error) {
    next(error);
  }
});

router.patch("/judges/:judgeId", async (request, response, next) => {
  try {
    const payload = judgePayloadSchema.partial().parse(request.body);
    response.json(await database.updateJudge(request.params.judgeId, payload));
  } catch (error) {
    next(error);
  }
});

router.get("/results", async (request, response, next) => {
  try {
    const judgeIds = request.query.judgeIds
      ? String(request.query.judgeIds).split(",").filter(Boolean)
      : undefined;
    const questionTemplateIds = request.query.questionTemplateIds
      ? String(request.query.questionTemplateIds).split(",").filter(Boolean)
      : undefined;
    const verdicts = request.query.verdicts
      ? String(request.query.verdicts).split(",").filter(Boolean)
      : undefined;

    response.json(
      await database.getResults({
        judgeIds,
        questionTemplateIds,
        verdicts,
        queueId: request.query.queueId ? String(request.query.queueId) : undefined,
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/analytics", async (request, response, next) => {
  try {
    const judgeIds = request.query.judgeIds
      ? String(request.query.judgeIds).split(",").filter(Boolean)
      : undefined;
    const questionTemplateIds = request.query.questionTemplateIds
      ? String(request.query.questionTemplateIds).split(",").filter(Boolean)
      : undefined;
    const verdicts = request.query.verdicts
      ? String(request.query.verdicts).split(",").filter(Boolean)
      : undefined;

    response.json(
      await database.getAnalytics({
        judgeIds,
        questionTemplateIds,
        verdicts,
        queueId: request.query.queueId ? String(request.query.queueId) : undefined,
        startAt: request.query.startAt ? String(request.query.startAt) : undefined,
        endAt: request.query.endAt ? String(request.query.endAt) : undefined,
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.delete("/results/:evaluationId", async (request, response, next) => {
  try {
    response.json(await database.deleteEvaluationById(request.params.evaluationId));
  } catch (error) {
    next(error);
  }
});

router.delete("/results", async (request, response, next) => {
  try {
    const judgeIds = request.query.judgeIds
      ? String(request.query.judgeIds).split(",").filter(Boolean)
      : undefined;
    const questionTemplateIds = request.query.questionTemplateIds
      ? String(request.query.questionTemplateIds).split(",").filter(Boolean)
      : undefined;
    const verdicts = request.query.verdicts
      ? String(request.query.verdicts).split(",").filter(Boolean)
      : undefined;

    response.json(
      await database.deleteEvaluations({
        judgeIds,
        questionTemplateIds,
        verdicts,
        queueId: request.query.queueId ? String(request.query.queueId) : undefined,
      }),
    );
  } catch (error) {
    next(error);
  }
});

export { router as apiRouter };
