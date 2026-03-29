# AI Judge

React 19 + TypeScript take-home implementation for the Besimple AI AI Judge challenge. The app imports submission JSON, persists data in Supabase, lets users manage judge definitions and queue assignments, runs real OpenAI evaluations server-side, and shows filtered results with pass-rate stats.

## Stack

- React 19 + Vite + React Router
- Express API server
- Supabase for persistence
- OpenAI Responses API for judge execution
- Vitest for parser/aggregate tests

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase and OpenAI credentials.
2. Ensure your Supabase project already has the required tables, policies, and RPC configured.
3. Install dependencies with `pnpm install`.
4. Start the app with `pnpm dev`.
5. Open `http://localhost:5173`.

The Vite frontend runs on port `5173` and proxies API calls to the Express server on port `8787`.

This project intentionally uses the Supabase anon key with permissive public policies because the take-home app has no auth flow. That is acceptable for a demo submission, but it is not production-safe.

## Core flow

1. Import a challenge JSON file on the Queues page.
2. Create one or more judges on the Judges page.
3. Open a queue and assign judges to each question template.
4. Run AI Judges from the queue detail page.
5. Review pass/fail/inconclusive results on the Results page.

## API summary

- `POST /api/import-submissions`
- `GET /api/queues`
- `GET /api/queues/:queueId`
- `PUT /api/queues/:queueId/assignments`
- `POST /api/queues/:queueId/run`
- `GET /api/judges`
- `POST /api/judges`
- `PATCH /api/judges/:judgeId`
- `GET /api/results`

## Trade-offs

- The provider interface is in place, but only OpenAI is fully implemented to keep the submission focused and reliable.
- Authentication is intentionally omitted because the prompt does not require multi-user access control.
- Supabase is configured with open anon policies so the app can operate without auth or a service-role key.
- The evaluation runner executes inline on the API server for simplicity; moving it to a background job or Supabase Edge Function would be the next hardening step.
- File attachment forwarding and prompt-field selection are omitted in this version.

## Tests

- `pnpm test`

## Time Spent

- Approx. 6-8 hours depending on Supabase environment setup and demo prep.
