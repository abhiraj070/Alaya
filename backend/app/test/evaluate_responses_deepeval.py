import csv
from pathlib import Path

from deepeval.metrics import AnswerRelevancyMetric
from deepeval.test_case import LLMTestCase


BASE_DIR = Path(__file__).resolve().parent

INPUT_FILE = BASE_DIR / "response_test_results_4.csv"
OUTPUT_FILE = BASE_DIR / "deepeval_evaluation_results_4.csv"

QUESTION_COLUMN = "query"
RESPONSE_COLUMN = "response"


metric = AnswerRelevancyMetric(
    threshold=0.7,
    include_reason=True,
)

results = []

with INPUT_FILE.open("r", encoding="utf-8-sig", newline="") as file:
    reader = csv.DictReader(file)

    if not reader.fieldnames:
        raise ValueError("The input CSV has no column headers.")

    required_columns = {QUESTION_COLUMN, RESPONSE_COLUMN}
    missing_columns = required_columns - set(reader.fieldnames)

    if missing_columns:
        raise ValueError(
            f"Missing CSV columns: {missing_columns}. "
            f"Available columns: {reader.fieldnames}"
        )

    for index, row in enumerate(reader, start=1):
        question = row[QUESTION_COLUMN].strip()
        response = row[RESPONSE_COLUMN].strip()

        if not question or not response:
            results.append({
                "question_id": index,
                "question": question,
                "response": response,
                "relevance_score": "",
                "passed": False,
                "reason": "Question or response is empty",
            })
            continue

        test_case = LLMTestCase(
            input=question,
            actual_output=response,
        )

        try:
            metric.measure(test_case)

            score = metric.score
            reason = metric.reason or ""

            results.append({
                "question_id": index,
                "question": question,
                "response": response,
                "relevance_score": score,
                "passed": score >= 0.7,
                "reason": reason,
            })

            print(
                f"Question {index}: "
                f"Score={score:.2f}, "
                f"Passed={score >= 0.7}"
            )

        except Exception as exc:
            results.append({
                "question_id": index,
                "question": question,
                "response": response,
                "relevance_score": "",
                "passed": False,
                "reason": f"Evaluation error: {exc}",
            })

            print(f"Question {index}: Evaluation failed: {exc}")


with OUTPUT_FILE.open(
    "w",
    encoding="utf-8-sig",
    newline="",
) as file:
    fieldnames = [
        "question_id",
        "question",
        "response",
        "relevance_score",
        "passed",
        "reason",
    ]

    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(results)


print(f"\nEvaluation completed: {OUTPUT_FILE}")
print(f"Total questions evaluated: {len(results)}")