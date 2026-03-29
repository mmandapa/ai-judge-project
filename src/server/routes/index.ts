import express from "express";
import multer from "multer";
import { z } from "zod";
import { parseImportedSubmissions } from "../../shared/parser.js";
import { Database } from "../lib/database.js";
import { runEvaluationsForQueue } from "../lib/evaluationRunner.js";
import { getSupabaseClient } from "../lib/supabase.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
const database = new Database(getSupabaseClient());

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
      judgeIds: z.array(z.string().min(1)),
    }),
  ),
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
    response.json(await runEvaluationsForQueue(request.params.queueId, { database }));
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
