import type { InspectEntry } from "./types";

const ROOT = "/Users/maharshi12/ai-judge";

function file(path: string) {
  return `${ROOT}/${path}`;
}

export const inspectEntries: Record<string, InspectEntry> = {
  "nav.queues": {
    id: "nav.queues",
    label: "Queues nav link",
    summary: "Navigates to the staged import and queue landing page.",
    references: [
      { kind: "frontend", file: file("src/client/App.tsx"), line: 27, text: "Navbar link renders the Queues route entry." },
      { kind: "frontend", file: file("src/client/App.tsx"), line: 44, text: "Route table mounts the queue landing page for '/'." },
    ],
  },
  "nav.judges": {
    id: "nav.judges",
    label: "Judges nav link",
    summary: "Navigates to reusable judge management.",
    references: [
      { kind: "frontend", file: file("src/client/App.tsx"), line: 30, text: "Navbar link renders the Judges route entry." },
      { kind: "frontend", file: file("src/client/App.tsx"), line: 46, text: "Route table mounts the judge management page." },
    ],
  },
  "nav.results": {
    id: "nav.results",
    label: "Results nav link",
    summary: "Navigates to evaluation results and deletion controls.",
    references: [
      { kind: "frontend", file: file("src/client/App.tsx"), line: 33, text: "Navbar link renders the Results route entry." },
      { kind: "frontend", file: file("src/client/App.tsx"), line: 47, text: "Route table mounts the results page." },
    ],
  },
  "nav.analytics": {
    id: "nav.analytics",
    label: "Analytics nav link",
    summary: "Navigates to the analytics dashboard.",
    references: [
      { kind: "frontend", file: file("src/client/App.tsx"), line: 36, text: "Navbar link renders the Analytics route entry." },
      { kind: "frontend", file: file("src/client/App.tsx"), line: 48, text: "Route table lazy-loads the analytics page." },
    ],
  },
  "nav.inspect-toggle": {
    id: "nav.inspect-toggle",
    label: "Inspect mode toggle",
    summary: "Enables or disables source-inspect hover mode across the app.",
    references: [
      { kind: "frontend", file: file("src/client/App.tsx"), line: 32, text: "App shell reads inspect mode state from the provider." },
      { kind: "frontend", file: file("src/client/App.tsx"), line: 58, text: "Navbar toggle flips inspect mode on and off." },
      { kind: "frontend", file: file("src/client/inspect/InspectModeProvider.tsx"), line: 34, text: "Provider persists and clears the active inspect state." },
    ],
  },
  "queues.add-json-entry": {
    id: "queues.add-json-entry",
    label: "Add JSON entry",
    summary: "Opens the hidden file picker for staged batch imports.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 221, text: "Button triggers the hidden JSON file input." },
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 230, text: "Hidden file input hands selected JSON to handleAddEntry." },
      { kind: "shared", file: file("src/shared/parser.ts"), line: 26, text: "Shared parser validates and normalizes imported submission JSON." },
    ],
  },
  "queues.import-staged-batch": {
    id: "queues.import-staged-batch",
    label: "Import staged batch",
    summary: "Persists all staged entries and then navigates to an affected queue.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 162, text: "handleImportBatch assembles payloads and uploads attachments." },
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 224, text: "Primary button starts the staged batch import flow." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 155, text: "Client API posts the staged import batch to the backend." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 125, text: "Express route receives and validates staged batch imports." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 355, text: "Attachment metadata insert persists uploaded files for imported submissions." },
    ],
  },
  "queues.remove-entry": {
    id: "queues.remove-entry",
    label: "Remove staged entry",
    summary: "Removes one staged import entry from the batch workspace.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 123, text: "removeEntry updates local staged-import state." },
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 274, text: "Button removes the current staged entry card." },
    ],
  },
  "queues.staged-add-attachments": {
    id: "queues.staged-add-attachments",
    label: "Stage attachments",
    summary: "Opens the attachment picker for a staged import entry.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 141, text: "Attachment selection appends files into the staged entry state." },
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 340, text: "Button-styled label opens the hidden attachment input." },
    ],
  },
  "queues.open-queue": {
    id: "queues.open-queue",
    label: "Open queue",
    summary: "Navigates from the queue table into queue setup for a specific queue.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 418, text: "Queue row link navigates to that queue’s detail page." },
      { kind: "frontend", file: file("src/client/App.tsx"), line: 76, text: "Route table mounts the queue detail page for '/queues/:queueId'." },
    ],
  },
  "queues.stage-imports-card": {
    id: "queues.stage-imports-card",
    label: "Stage imports workspace",
    summary: "Main queue-import workspace for staging JSON entries and attachments before import.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 221, text: "Stage imports card renders the batch import workspace." },
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 162, text: "Import flow assembles staged entries and posts them when the user confirms." },
    ],
  },
  "queues.stage-summary-stats": {
    id: "queues.stage-summary-stats",
    label: "Staged import stats",
    summary: "Displays derived counts for staged queues, submissions, attachments, and new entries.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 63, text: "batchSummary computes staged import counts from the current local state." },
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 242, text: "Stats block renders the staged import summary totals." },
    ],
  },
  "queues.staged-entry-card": {
    id: "queues.staged-entry-card",
    label: "Staged entry card",
    summary: "Shows one staged JSON entry, its target queue configuration, and attachment mapping controls.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 258, text: "Each staged entry maps to a rendered card with queue targeting and attachments." },
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 117, text: "updateEntry applies immutable edits to a staged import entry." },
    ],
  },
  "queues.queues-card": {
    id: "queues.queues-card",
    label: "Queues list card",
    summary: "Shows the imported queue summaries below the staging workspace.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 401, text: "Queues card renders the current queue summary list." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 51, text: "Client API fetches queue summaries from the backend." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 238, text: "Queues route returns queue summaries for the page." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 218, text: "Database layer loads queue summary rows." },
    ],
  },
  "queues.queues-table": {
    id: "queues.queues-table",
    label: "Queues table",
    summary: "Displays the current queue summaries in tabular form.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueuesPage.tsx"), line: 406, text: "Table renders queue summary rows for the page." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 51, text: "Client API fetches queue summaries from the backend." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 238, text: "Queues route returns queue summaries for the page." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 218, text: "Database layer loads queue summary rows." },
    ],
  },
  "queue.save-setup": {
    id: "queue.save-setup",
    label: "Save setup",
    summary: "Saves queue question-to-judge assignments and prompt field settings.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 136, text: "handleSaveAssignments serializes the draft assignment state." },
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 330, text: "Button invokes the queue setup save handler." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 71, text: "Client API sends assignment replacement payloads." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 254, text: "Express route validates and stores queue assignments." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 488, text: "Database layer replaces judge assignments for the queue." },
    ],
  },
  "queue.run-queue": {
    id: "queue.run-queue",
    label: "Run queue",
    summary: "Starts evaluation execution for the selected queue questions.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 152, text: "handleRun triggers the queue execution request." },
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 333, text: "Primary button starts the queue run." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 79, text: "Client API posts the queue run request." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 264, text: "Express route calls the evaluation runner for the queue." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 553, text: "Database layer loads run context and related submissions." },
    ],
  },
  "queue.create-or-edit-judges": {
    id: "queue.create-or-edit-judges",
    label: "Create or edit judges",
    summary: "Navigates from queue setup into reusable judge management.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 358, text: "Link preserves the queue return path while opening judge management." },
      { kind: "frontend", file: file("src/client/App.tsx"), line: 46, text: "App route mounts the Judges page when the link is followed." },
    ],
  },
  "queue.append-submissions": {
    id: "queue.append-submissions",
    label: "Append submissions",
    summary: "Adds more submissions and mapped attachments into the current queue.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 238, text: "handleAppendSubmissions imports the file and then uploads attachments." },
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 385, text: "Button starts the append-to-queue workflow." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 160, text: "Client API uploads the queue JSON append request." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 155, text: "Express route appends submissions into an existing queue." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 234, text: "Queue detail persistence depends on the queue data load path." },
    ],
  },
  "queue.view-results": {
    id: "queue.view-results",
    label: "View results",
    summary: "Navigates from queue setup into the evaluation results page.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 366, text: "Link jumps from queue setup to the shared results page." },
      { kind: "frontend", file: file("src/client/App.tsx"), line: 78, text: "Route table mounts the results page for '/results'." },
    ],
  },
  "queue.open-affected-queue": {
    id: "queue.open-affected-queue",
    label: "Open affected queue",
    summary: "Navigates to another queue updated by the same import batch.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 375, text: "Affected-queue links let the user jump to other updated queues." },
      { kind: "frontend", file: file("src/client/App.tsx"), line: 76, text: "Route table mounts the queue detail page for '/queues/:queueId'." },
    ],
  },
  "queue.choose-json": {
    id: "queue.choose-json",
    label: "Choose queue JSON",
    summary: "Opens the JSON picker for appending more submissions into the current queue.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 186, text: "JSON file selection parses and normalizes append submissions." },
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 401, text: "Button-styled label opens the hidden queue JSON input." },
      { kind: "shared", file: file("src/shared/parser.ts"), line: 26, text: "Shared parser validates and normalizes imported submission JSON." },
    ],
  },
  "queue.add-attachments": {
    id: "queue.add-attachments",
    label: "Add queue attachments",
    summary: "Opens the attachment picker for files that will be mapped to appended submissions.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 214, text: "Attachment selection adds pending files to the append workflow." },
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 405, text: "Button-styled label opens the hidden attachment input." },
    ],
  },
  "queue.select-all-questions": {
    id: "queue.select-all-questions",
    label: "Select all questions",
    summary: "Marks every question as selected for the next queue run.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 582, text: "Button selects every question template for the next run." },
    ],
  },
  "queue.summary-card": {
    id: "queue.summary-card",
    label: "Queue setup summary",
    summary: "Primary queue setup card showing queue counts, navigation links, and run status.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 336, text: "Queue setup summary card renders the top-level queue actions and status." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 52, text: "Client API fetches queue detail data for this page." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 246, text: "Queue detail route returns the data for one queue." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 234, text: "Database layer assembles queue detail data." },
    ],
  },
  "queue.summary-stats": {
    id: "queue.summary-stats",
    label: "Queue stats",
    summary: "Displays queue-level submission, question, and assignment counts.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 349, text: "Stats block renders queue totals inside the summary card." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 280, text: "Queue detail data includes the summary counts rendered here." },
    ],
  },
  "queue.step-add-submissions": {
    id: "queue.step-add-submissions",
    label: "Add submissions step",
    summary: "Step 1 for appending more submissions and optional attachments into the current queue.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 392, text: "Add submissions card renders append controls and previews." },
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 238, text: "Append handler imports the queue JSON and uploads mapped attachments." },
    ],
  },
  "queue.append-preview": {
    id: "queue.append-preview",
    label: "Append preview block",
    summary: "Shows the submissions or prompt content prepared for the append workflow.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 425, text: "Preview block renders the submissions selected for append." },
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 422, text: "Preview content is derived from parsed append submission options." },
    ],
  },
  "queue.step-assign-judges": {
    id: "queue.step-assign-judges",
    label: "Assign judges step",
    summary: "Step 2 for assigning judges and configuring assignment-specific prompt fields.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 471, text: "Assign judges card renders question-level judge setup and prompt configuration." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 52, text: "Queue detail data supplies the questions, submissions, and assignments shown here." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 246, text: "Queue detail route returns the data for this setup step." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 234, text: "Database layer assembles queue questions, assignments, and sample submissions." },
    ],
  },
  "queue.question-setup-card": {
    id: "queue.question-setup-card",
    label: "Question setup card",
    summary: "Shows one question’s judge assignments and prompt-field configuration.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 479, text: "Question setup card renders one question and its assignment controls." },
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 106, text: "Draft assignment state powers the question-level setup UI." },
    ],
  },
  "queue.assign-judge": {
    id: "queue.assign-judge",
    label: "Assign judge chip",
    summary: "Adds or removes a judge for one question in local draft setup state.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 115, text: "setSelectedJudges updates the selected judges for one question." },
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 488, text: "Judge chips render inside the question setup card." },
    ],
  },
  "queue.assignment-config-card": {
    id: "queue.assignment-config-card",
    label: "Assignment config card",
    summary: "Shows one judge assignment’s prompt settings and generated preview.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 517, text: "Assignment config card renders one judge-specific prompt configuration." },
      { kind: "frontend", file: file("src/client/lib/api.ts"), line: 194, text: "Prompt preview builder derives the preview shown for each assignment." },
    ],
  },
  "queue.toggle-prompt-field": {
    id: "queue.toggle-prompt-field",
    label: "Prompt field toggle",
    summary: "Enables or disables one prompt field for a specific judge assignment in local draft state.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 168, text: "updatePromptField mutates one prompt field in draft assignment state." },
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 530, text: "Toggle rows render the prompt field checkboxes for each assignment." },
    ],
  },
  "queue.prompt-preview": {
    id: "queue.prompt-preview",
    label: "Prompt preview panel",
    summary: "Shows the generated user and system prompt preview for one assignment.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 551, text: "Preview blocks render the generated user and system prompt content." },
      { kind: "frontend", file: file("src/client/lib/api.ts"), line: 194, text: "Prompt preview builder derives the preview payload shown here." },
      { kind: "shared", file: file("src/shared/prompt.ts"), line: 73, text: "Shared prompt builder assembles the preview text for the assignment." },
    ],
  },
  "queue.step-run-questions": {
    id: "queue.step-run-questions",
    label: "Choose questions to run step",
    summary: "Step 3 for choosing which questions will be included in the next queue run.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 584, text: "Run-questions card renders the selection controls for the next queue run." },
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 42, text: "Selected question ids are tracked locally for the next run only." },
    ],
  },
  "queue.toggle-run-question": {
    id: "queue.toggle-run-question",
    label: "Run question selector",
    summary: "Includes or excludes one question from the next queue run in local state.",
    references: [
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 596, text: "Run-question rows render the next-run selection controls." },
      { kind: "frontend", file: file("src/client/pages/QueueDetailPage.tsx"), line: 607, text: "Checkbox handler updates selectedQuestionIds for the next run." },
    ],
  },
  "judges.back-to-queue": {
    id: "judges.back-to-queue",
    label: "Back to queue setup",
    summary: "Returns from judge management back into the originating queue setup page.",
    references: [
      { kind: "frontend", file: file("src/client/pages/JudgesPage.tsx"), line: 120, text: "Link uses the saved returnTo query parameter." },
      { kind: "frontend", file: file("src/client/App.tsx"), line: 45, text: "Queue detail route receives the return navigation target." },
    ],
  },
  "judges.save": {
    id: "judges.save",
    label: "Save judge",
    summary: "Creates a new judge or updates the selected judge template.",
    references: [
      { kind: "frontend", file: file("src/client/pages/JudgesPage.tsx"), line: 65, text: "handleSubmit decides between create and update flows." },
      { kind: "frontend", file: file("src/client/pages/JudgesPage.tsx"), line: 160, text: "Form submit button saves the current judge form." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 54, text: "Client API creates new judges." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 59, text: "Client API updates existing judges." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 283, text: "Express route creates judge records." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 292, text: "Express route updates judge records." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 394, text: "Database layer inserts new judge templates." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 420, text: "Database layer updates an existing judge template." },
    ],
  },
  "judges.delete": {
    id: "judges.delete",
    label: "Delete judge",
    summary: "Deletes the selected judge and removes its queue assignments.",
    references: [
      { kind: "frontend", file: file("src/client/pages/JudgesPage.tsx"), line: 89, text: "handleDeleteJudge confirms and deletes the selected judge." },
      { kind: "frontend", file: file("src/client/pages/JudgesPage.tsx"), line: 168, text: "Danger button triggers the judge deletion flow." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 67, text: "Client API issues the judge deletion request." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 301, text: "Express route deletes the judge record." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 452, text: "Database layer removes the judge and cleans up assignments." },
    ],
  },
  "judges.select-card": {
    id: "judges.select-card",
    label: "Saved judge card",
    summary: "Loads a saved judge into the edit form.",
    references: [
      { kind: "frontend", file: file("src/client/pages/JudgesPage.tsx"), line: 185, text: "Judge card click hydrates the edit form from saved data." },
    ],
  },
  "judges.reset": {
    id: "judges.reset",
    label: "Reset judge form",
    summary: "Clears the current judge edit form back to the default empty state.",
    references: [
      { kind: "frontend", file: file("src/client/pages/JudgesPage.tsx"), line: 168, text: "Reset button restores the blank judge form state." },
      { kind: "frontend", file: file("src/client/pages/JudgesPage.tsx"), line: 22, text: "emptyForm defines the default cleared judge form values." },
    ],
  },
  "judges.form-card": {
    id: "judges.form-card",
    label: "Judge form card",
    summary: "Shows the judge create/edit form and its save/delete controls.",
    references: [
      { kind: "frontend", file: file("src/client/pages/JudgesPage.tsx"), line: 122, text: "Judge form card renders the create/edit form." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 53, text: "Judge form actions call the client judge APIs." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 275, text: "Judge routes handle list, create, update, and delete requests." },
    ],
  },
  "judges.saved-list-card": {
    id: "judges.saved-list-card",
    label: "Saved judges card",
    summary: "Lists the reusable saved judge templates for editing.",
    references: [
      { kind: "frontend", file: file("src/client/pages/JudgesPage.tsx"), line: 183, text: "Saved judges card renders the judge template list." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 53, text: "Client API loads saved judge records." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 275, text: "Judges route returns the saved judge list." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 385, text: "Database layer loads the saved judge templates." },
    ],
  },
  "results.filter-judges": {
    id: "results.filter-judges",
    label: "Results judge filters",
    summary: "Toggles the selected judge filters and reloads result rows.",
    references: [
      { kind: "frontend", file: file("src/client/pages/ResultsPage.tsx"), line: 57, text: "updateFilters applies the next filter state and reloads results." },
      { kind: "frontend", file: file("src/client/pages/ResultsPage.tsx"), line: 158, text: "Judge filter chips render inside the results filter panel." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 84, text: "Client API encodes the current results filter query string." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 309, text: "Express route reads results filters from the query string." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 690, text: "Database layer fetches filtered evaluation rows." },
    ],
  },
  "results.filter-questions": {
    id: "results.filter-questions",
    label: "Results question filters",
    summary: "Toggles question filters and reloads matching evaluation rows.",
    references: [
      { kind: "frontend", file: file("src/client/pages/ResultsPage.tsx"), line: 57, text: "updateFilters applies the next filter state and reloads results." },
      { kind: "frontend", file: file("src/client/pages/ResultsPage.tsx"), line: 166, text: "Question filter chips render inside the results filter panel." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 84, text: "Client API encodes the current results filter query string." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 309, text: "Express route reads results filters from the query string." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 690, text: "Database layer fetches filtered evaluation rows." },
    ],
  },
  "results.filter-verdicts": {
    id: "results.filter-verdicts",
    label: "Results verdict filters",
    summary: "Toggles verdict filters and reloads matching evaluation rows.",
    references: [
      { kind: "frontend", file: file("src/client/pages/ResultsPage.tsx"), line: 57, text: "updateFilters applies the next filter state and reloads results." },
      { kind: "frontend", file: file("src/client/pages/ResultsPage.tsx"), line: 174, text: "Verdict chips render inside the results filter panel." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 84, text: "Client API encodes the current results filter query string." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 309, text: "Express route reads results filters from the query string." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 690, text: "Database layer fetches filtered evaluation rows." },
    ],
  },
  "results.clear-visible": {
    id: "results.clear-visible",
    label: "Clear visible",
    summary: "Deletes all currently visible evaluation rows for the active filters.",
    references: [
      { kind: "frontend", file: file("src/client/pages/ResultsPage.tsx"), line: 102, text: "handleClearVisible confirms and clears the visible rows." },
      { kind: "frontend", file: file("src/client/pages/ResultsPage.tsx"), line: 187, text: "Toolbar button starts the bulk delete flow." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 124, text: "Client API sends bulk deletion filters." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 369, text: "Express route deletes evaluations matching the active filters." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 730, text: "Database layer deletes evaluation rows by filter set." },
    ],
  },
  "results.delete-row": {
    id: "results.delete-row",
    label: "Delete evaluation row",
    summary: "Deletes one evaluation record from the results table.",
    references: [
      { kind: "frontend", file: file("src/client/pages/ResultsPage.tsx"), line: 78, text: "handleDeleteRow confirms and deletes a single row." },
      { kind: "frontend", file: file("src/client/pages/ResultsPage.tsx"), line: 248, text: "Row-level delete button triggers the handler." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 118, text: "Client API issues the single-evaluation delete request." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 361, text: "Express route deletes one evaluation by id." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 719, text: "Database layer removes a single evaluation row." },
    ],
  },
  "results.summary-card": {
    id: "results.summary-card",
    label: "Results summary card",
    summary: "Shows aggregate pass-rate metrics for the current results view.",
    references: [
      { kind: "frontend", file: file("src/client/pages/ResultsPage.tsx"), line: 136, text: "Summary card renders aggregate metrics for the current result set." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 84, text: "Client API fetches the filtered results dataset." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 309, text: "Results route returns rows and aggregate filters." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 690, text: "Database layer loads the result dataset used for the summary." },
    ],
  },
  "results.filters-card": {
    id: "results.filters-card",
    label: "Results filters card",
    summary: "Shows the judge, question, and verdict filters for result rows.",
    references: [
      { kind: "frontend", file: file("src/client/pages/ResultsPage.tsx"), line: 155, text: "Filters card renders the available result filters." },
      { kind: "frontend", file: file("src/client/pages/ResultsPage.tsx"), line: 57, text: "Filter changes reload the result set." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 84, text: "Client API fetches results for the active filters." },
    ],
  },
  "results.table-card": {
    id: "results.table-card",
    label: "Evaluations table card",
    summary: "Shows the row-level evaluation table and bulk clear action.",
    references: [
      { kind: "frontend", file: file("src/client/pages/ResultsPage.tsx"), line: 184, text: "Evaluations card renders the row-level results table." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 84, text: "Client API fetches the rows shown in the table." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 309, text: "Results route returns the row-level evaluation dataset." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 690, text: "Database layer loads the evaluations shown in the table." },
    ],
  },
  "results.result-row": {
    id: "results.result-row",
    label: "Evaluation row",
    summary: "Shows one evaluation record inside the results table.",
    references: [
      { kind: "frontend", file: file("src/client/pages/ResultsPage.tsx"), line: 234, text: "ResultRow renders one evaluation record inside the table." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 84, text: "Rows come from the filtered results API response." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 690, text: "Database layer loads the evaluation rows rendered here." },
    ],
  },
  "analytics.queue-filter": {
    id: "analytics.queue-filter",
    label: "Analytics queue filter",
    summary: "Filters the analytics dashboard to one queue or all queues.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 133, text: "updateSearch writes the queue filter into the URL state." },
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 431, text: "Queue select control updates the dashboard filter." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 100, text: "Client API encodes analytics filters into the request query string." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 334, text: "Express route serves analytics using the request filters." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 708, text: "Database layer builds the filtered analytics dataset." },
    ],
  },
  "analytics.time-preset": {
    id: "analytics.time-preset",
    label: "Analytics time preset",
    summary: "Switches the dashboard time window and refreshes the charts.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 29, text: "Preset definitions provide the available time-window buttons." },
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 133, text: "updateSearch rewrites the date range query state." },
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 443, text: "Preset buttons update the active analytics window." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 100, text: "Client API sends the chosen analytics date filters." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 334, text: "Express route rebuilds analytics from the active date range." },
    ],
  },
  "analytics.filter-judges": {
    id: "analytics.filter-judges",
    label: "Analytics judge filters",
    summary: "Toggles judge filters and refreshes the dashboard data.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 133, text: "updateSearch applies chip filter selections into the URL." },
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 472, text: "Judge filter chips render inside analytics filters." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 100, text: "Client API encodes analytics filters into the query string." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 334, text: "Express route serves filtered analytics data." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 708, text: "Database layer aggregates analytics for the active filter set." },
    ],
  },
  "analytics.filter-questions": {
    id: "analytics.filter-questions",
    label: "Analytics question filters",
    summary: "Toggles question filters and refreshes the dashboard data.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 133, text: "updateSearch applies chip filter selections into the URL." },
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 480, text: "Question filter chips render inside analytics filters." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 100, text: "Client API encodes analytics filters into the query string." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 334, text: "Express route serves filtered analytics data." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 708, text: "Database layer aggregates analytics for the active filter set." },
    ],
  },
  "analytics.filter-verdicts": {
    id: "analytics.filter-verdicts",
    label: "Analytics verdict filters",
    summary: "Toggles verdict filters and refreshes the dashboard data.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 133, text: "updateSearch applies chip filter selections into the URL." },
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 488, text: "Verdict filter chips render inside analytics filters." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 100, text: "Client API encodes analytics filters into the query string." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 334, text: "Express route serves filtered analytics data." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 708, text: "Database layer aggregates analytics for the active filter set." },
    ],
  },
  "analytics.chart-judge-bar": {
    id: "analytics.chart-judge-bar",
    label: "Judge chart bar",
    summary: "Filters analytics to one judge from the pass-rate bar chart.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 288, text: "Judge bar chart renders pass-rate data by judge." },
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 302, text: "Bar click toggles the selected judge filter." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 100, text: "Client API encodes analytics filters into the query string." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 334, text: "Analytics route serves data for the active filters." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 708, text: "Database layer aggregates judge-level analytics." },
    ],
  },
  "analytics.chart-verdict-slice": {
    id: "analytics.chart-verdict-slice",
    label: "Verdict chart slice",
    summary: "Filters analytics to one verdict from the verdict distribution chart.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 338, text: "Verdict pie chart renders the current verdict distribution." },
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 348, text: "Slice click toggles the selected verdict filter." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 100, text: "Client API encodes analytics filters into the query string." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 334, text: "Analytics route serves data for the active filters." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 708, text: "Database layer aggregates verdict analytics." },
    ],
  },
  "analytics.chart-question-bar": {
    id: "analytics.chart-question-bar",
    label: "Question chart bar",
    summary: "Filters analytics to one question from the question pass-rate chart.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 370, text: "Question bar chart renders pass-rate data by question." },
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 381, text: "Bar click toggles the selected question filter." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 100, text: "Client API encodes analytics filters into the query string." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 334, text: "Analytics route serves data for the active filters." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 708, text: "Database layer aggregates question-level analytics." },
    ],
  },
  "analytics.expand-chart": {
    id: "analytics.expand-chart",
    label: "Expand analytics chart",
    summary: "Opens a larger modal view for an analytics chart card.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 279, text: "openExpanded stores the selected chart and focus target." },
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 524, text: "Chart card expand buttons open the larger chart modal." },
    ],
  },
  "analytics.close-expanded": {
    id: "analytics.close-expanded",
    label: "Close expanded chart",
    summary: "Closes the expanded analytics chart modal and returns focus to the prior trigger.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 591, text: "Close button dismisses the expanded analytics modal." },
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 227, text: "Modal effect restores focus to the last trigger after closing." },
    ],
  },
  "analytics.hero-card": {
    id: "analytics.hero-card",
    label: "Analytics hero card",
    summary: "Top analytics summary card introducing the dashboard and current total count.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 441, text: "Analytics hero card renders the dashboard summary header." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 100, text: "Client API fetches the analytics response used by this card." },
      { kind: "route", file: file("src/server/routes/index.ts"), line: 334, text: "Analytics route returns the aggregated dashboard data." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 708, text: "Database layer builds the analytics response shown here." },
    ],
  },
  "analytics.filters-card": {
    id: "analytics.filters-card",
    label: "Analytics filters card",
    summary: "Shows the queue, time, judge, question, and verdict filters for analytics.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 459, text: "Filters card renders all analytics filtering controls." },
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 133, text: "updateSearch rewrites the dashboard filter state in the URL." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 100, text: "Client API fetches analytics for the active filters." },
    ],
  },
  "analytics.overview-section": {
    id: "analytics.overview-section",
    label: "Analytics overview section",
    summary: "Shows the KPI cards and top two analytics charts.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 539, text: "Overview section renders KPI cards and primary charts." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 100, text: "Client API fetches the analytics response that powers this section." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 708, text: "Database layer builds the analytics data shown in this section." },
    ],
  },
  "analytics.kpi-card": {
    id: "analytics.kpi-card",
    label: "Analytics KPI card",
    summary: "Shows one aggregate analytics metric in the overview grid.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 637, text: "KpiCard renders one analytics summary metric." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 708, text: "Analytics summary data supplies the metric values shown here." },
    ],
  },
  "analytics.breakdowns-section": {
    id: "analytics.breakdowns-section",
    label: "Analytics breakdowns section",
    summary: "Shows the lower analytics charts for verdict mix and question performance.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 576, text: "Breakdowns section renders the secondary analytics charts." },
      { kind: "api", file: file("src/client/lib/api.ts"), line: 100, text: "Client API fetches the analytics response that powers this section." },
      { kind: "db", file: file("src/server/lib/database.ts"), line: 708, text: "Database layer builds the analytics data shown in this section." },
    ],
  },
  "analytics.chart-card": {
    id: "analytics.chart-card",
    label: "Analytics chart card",
    summary: "Container for an analytics chart, its title, and its expand action.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 650, text: "AnalyticsChartCard renders one chart container with its copy and controls." },
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 556, text: "Chart cards are used to lay out the analytics sections." },
    ],
  },
  "analytics.expanded-modal": {
    id: "analytics.expanded-modal",
    label: "Expanded analytics modal",
    summary: "Shows the full-size version of the selected analytics chart.",
    references: [
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 603, text: "Expanded analytics modal renders the selected chart in a dialog." },
      { kind: "frontend", file: file("src/client/pages/AnalyticsPage.tsx"), line: 283, text: "openExpanded selects which chart to render in the modal." },
    ],
  },
};

export function getInspectEntry(id: string) {
  return inspectEntries[id] ?? null;
}
