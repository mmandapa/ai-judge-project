# AI Judge

React 19 + TypeScript take-home implementation for the Besimple AI AI Judge challenge. The app imports submission JSON, optionally maps attachments during import, supports per-submission file uploads later, persists data in Supabase, manages reusable judge definitions, lets each queue assignment control which fields reach the LLM prompt, runs real OpenAI evaluations server-side, and now includes a dedicated analytics dashboard with animated charts and live filterable rollups.

## Stack

- React 19 + Vite + React Router
- Express API server
- Supabase for persistence
- OpenAI Responses API for judge execution
- Vitest for parser/aggregate tests

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase and OpenAI credentials.
2. Ensure your Supabase project already has the required tables, policies, RPCs, and the additive schema in `supabase_bonus_features.sql`.
3. Install dependencies with `pnpm install`.
4. Start the app with `pnpm dev`.
5. Open `http://localhost:5173`.

The Vite frontend runs on port `5173` and proxies API calls to the Express server on port `8787`.

This project intentionally uses the Supabase anon key with permissive public policies because the take-home app has no auth flow. That is acceptable for a demo submission, but it is not production-safe.

## Attachment Setup

1. Run `supabase_bonus_features.sql`.
2. Verify the `submission-attachments` Storage bucket exists.
3. Verify the SQL created policies for:
   `submission_attachments`
   `submissions` update
   `storage.objects` in bucket `submission-attachments`
4. Restart the app if you changed `.env` or Supabase project configuration.

If attachment upload fails with a row-level security error, the missing piece is almost always one of those policies.

## Core flow

1. Stage one or more challenge JSON files on the Queues page.
2. For each staged entry, choose whether it should create a new queue or merge into an existing queue.
3. Optionally map screenshots or PDFs to the submissions inside each staged entry.
4. Import the whole batch at once, then land in queue setup for one of the affected queues.
5. In queue setup, assign one or more judges to each question template and choose which fields each judge assignment should send to the LLM.
6. Choose which questions to run for the current run, then start the queue.
7. Review pass/fail/inconclusive results on the Results page.
8. Open Analytics for animated pass-rate and trend dashboards by queue, judge, question, verdict, and date range.

## Prompt Field Selection

Each queue assignment can control which fields are sent to the LLM for that judge on that question:
- question text
- question type
- answer payload
- submission ID
- upstream labeling task ID
- attachments, when the provider supports multimodal input

Judges themselves stay reusable: name, rubric, provider, model, and active state are defined on the Judges page, while prompt-field selection happens in queue setup where the evaluation context is visible.

## API summary

- `POST /api/import-submissions`
- `POST /api/import-batch`
- `GET /api/queues`
- `GET /api/queues/:queueId`
- `POST /api/queues/:queueId/import-submissions`
- `POST /api/submissions/:submissionId/attachments`
- `PUT /api/queues/:queueId/assignments`
- `POST /api/queues/:queueId/run`
- `GET /api/judges`
- `POST /api/judges`
- `PATCH /api/judges/:judgeId`
- `GET /api/results`
- `GET /api/analytics`

## Trade-offs

- The provider interface is in place, but only OpenAI is fully implemented to keep the submission focused and reliable.
- Authentication is intentionally omitted because the prompt does not require multi-user access control.
- Supabase is configured with open anon policies so the app can operate without auth or a service-role key.
- The evaluation runner executes inline on the API server for simplicity; moving it to a background job or Supabase Edge Function would be the next hardening step.
- Attachments are forwarded only for providers that support multimodal input. OpenAI is implemented in this version.
- If uploads fail with a bucket error, create a Supabase Storage bucket named `submission-attachments`.
- If uploads fail with a row-level security error, apply the attachment policies in `supabase_bonus_features.sql`.
- PDF attachments rely on a server-side `pdftoppm` binary for rasterization before forwarding to the LLM.

## Tests

- `pnpm test`

## Time Spent

- Approx. 4 hours
