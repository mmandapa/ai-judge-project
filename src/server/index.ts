import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { getEnv } from "./lib/env.js";
import { apiRouter } from "./routes/index.js";

const app = express();
const env = getEnv();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/api", apiRouter);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: "Validation failed",
      details: error.flatten(),
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Unknown server error";
  response.status(500).json({ error: message });
});

app.listen(env.PORT, () => {
  console.log(`AI Judge API listening on http://localhost:${env.PORT}`);
});
