# AI Judge

Take-home implementation for the Besimple AI Judge challenge. This project imports submission JSON, groups work into queues, lets users assign one or more judges per question, runs real LLM evaluations server-side, persists results in Supabase, and includes bonus features like file attachments, prompt field selection, and an analytics dashboard with animated charts.

## What’s implemented

### Core requirements

- Queue-based submission import and persistence
- Judge creation and persistence
- Per-question judge assignment inside a queue
- `Run AI Judges` action on the queue page
- Real OpenAI provider calls during evaluation
- Persisted evaluation records with:
  - verdict
  - judge used
  - short reasoning
- Results page with filtering and row-level inspection

### Bonus / extra features implemented

- File attachments per submission, including images and PDFs
- Attachment forwarding to OpenAI when supported
- Assignment-level prompt field selection:
  - question text
  - question type
  - answer payload
  - submission ID
  - labeling task ID
  - attachments
- Staged batch import workspace:
  - stage multiple JSON entries before import
  - choose whether each entry creates a new queue or merges into an existing queue
  - map attachments per staged entry before import
- Queue setup flow with:
  - judge assignment
  - prompt-field controls
  - per-run question checkboxes
- Analytics dashboard with:
  - pass rate by judge
  - pass rate by question
  - verdict mix
  - evaluations over time
  - date and entity filters
  - animated and expandable charts

## Stack

- React 19 + Vite + React Router
- Express API server
- Supabase for persistence and storage
- OpenAI Responses API for evaluation execution
- Recharts for analytics visualizations
- Vitest for tests

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in the required values.

Expected environment variables are the app’s Supabase and OpenAI credentials, including:

- Supabase URL
- Supabase anon key
- OpenAI API key
- optional OpenAI base URL / model overrides if you are testing against a compatible endpoint

### 3. Apply Supabase schema

Set up the required Supabase tables, columns, and policies for the current implementation, including:

- `submission_attachments`
- `submissions.has_attachments`
- `evaluations.attachments_used`
- `judge_assignments.prompt_field_config`

### 4. Create / verify the Storage bucket

The app expects a Supabase Storage bucket named exactly:

`submission-attachments`

Because this submission does not include an auth flow, the Supabase project also needs permissive demo policies for the app to read and write these resources.

### 5. Optional PDF dependency

PDF attachment forwarding relies on a server-side `pdftoppm` binary for rasterization before sending pages to the model.

If you want PDF attachments to work end to end, make sure `pdftoppm` is available in the environment running the server.

### 6. Start the app

```bash
pnpm dev
```

Then open:

`http://localhost:5173`

The Vite frontend runs on port `5173` and proxies API requests to the Express server on port `8787`.

## Product flow

### 1. Stage imports

On the `Queues` page:

- add one or more JSON entries
- for each entry, choose whether it should:
  - create a new queue
  - merge into an existing queue
- optionally add and map attachments to submissions inside that entry

### 2. Import the staged batch

Import commits the full staged batch in one action. After import, the app routes into queue setup for one affected queue and links to any other queues touched in that batch.

### 3. Configure the queue

On the queue setup page:

- assign one or more judges per question
- configure prompt fields per `(question × judge assignment)`
- choose which questions to run for the current run only
- upload more submission attachments if needed

### 4. Run AI Judges

`Run queue` will:

1. iterate the submissions in that queue
2. look up the selected judges for each question
3. call the real provider for every `(question × judge)` pair
4. persist evaluation results in Supabase

### 5. Inspect outcomes

- `Results` is for row-level filtering and inspection
- `Analytics` is for aggregated charts and trends

## Prompt field selection

Prompt field selection is implemented at the assignment level, not the judge level.

That was a deliberate product decision:

- judges stay reusable templates
- prompt shape is specific to the queue/question context
- the user can see the evaluation context when deciding what the LLM should receive

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

## Scope cuts and decisions

These are the main scope cuts and product decisions behind the implementation:

- **Provider execution:** I implemented **OpenAI** as the only fully wired evaluation backend end-to-end. Adding multiple providers would require extra vendor setup, keys, and test spend, so I kept execution reliable and focused on the core workflow.
- **Prompt-field selection:** Prompt inclusion is configured **per judge assignment** (per queue/question/judge), so judge definitions stay reusable while the prompt context can vary by question.
- **Run execution model:** Evaluations run **inline from the API** (no separate worker process) to keep the take-home demo simple and debuggable.
- **Analytics charts:** The analytics dashboard uses **Recharts** because it’s React-friendly and makes it quick to render several chart types from the same aggregated metrics.

## Known operational requirements

- If attachment upload fails with a bucket error, create the `submission-attachments` bucket.
- If attachment upload fails with a row-level security error, verify the required storage and table policies exist in Supabase.
- If PDF attachments are uploaded but not forwarded correctly, verify that `pdftoppm` is installed where the server runs.

## Tests

```bash
pnpm test
pnpm build
```

## Time spent

Approximately 4 hours.
