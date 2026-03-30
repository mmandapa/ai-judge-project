/**
 * Regression coverage for JSON parsing and answer preview helpers.
 */
import { describe, expect, it } from "vitest";
import { buildAnswerPreview, coerceImportedSubmissionsToQueue, parseImportedSubmissions } from "../src/shared/parser";

const sample = JSON.stringify([
  {
    id: "sub_1",
    queueId: "queue_1",
    labelingTaskId: "task_1",
    createdAt: 1690000000000,
    questions: [
      {
        rev: 1,
        data: {
          id: "q_template_1",
          questionType: "single_choice_with_reasoning",
          questionText: "Is the sky blue?",
        },
      },
    ],
    answers: {
      q_template_1: {
        choice: "yes",
        reasoning: "Observed on a clear day.",
      },
    },
  },
]);

describe("parseImportedSubmissions", () => {
  it("parses valid challenge input", () => {
    const submissions = parseImportedSubmissions(sample);

    expect(submissions).toHaveLength(1);
    expect(submissions[0]?.queueId).toBe("queue_1");
    expect(submissions[0]?.questions[0]?.data.questionText).toBe("Is the sky blue?");
  });

  it("throws on malformed payloads", () => {
    expect(() =>
      parseImportedSubmissions(
        JSON.stringify([
          {
            id: "sub_1",
          },
        ]),
      ),
    ).toThrow();
  });

  it("can coerce imported submissions into a target queue", () => {
    const submissions = parseImportedSubmissions(sample);
    const normalized = coerceImportedSubmissionsToQueue(submissions, "queue_target");

    expect(normalized[0]?.queueId).toBe("queue_target");
    expect(submissions[0]?.queueId).toBe("queue_1");
  });
});

describe("buildAnswerPreview", () => {
  it("formats object answers for display", () => {
    expect(buildAnswerPreview({ choice: "yes" })).toBe('{"choice":"yes"}');
  });
});
