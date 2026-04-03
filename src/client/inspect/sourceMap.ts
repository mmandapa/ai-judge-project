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
};

export function getInspectEntry(id: string) {
  return inspectEntries[id] ?? null;
}
