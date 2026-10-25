import sys
import json
import asyncio
import re
from pathlib import Path

import pandas as pd
from openai import AsyncOpenAI

BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_DIR))

from app.env_config.settings import get_settings

settings = get_settings()

BASE_DIR = Path(__file__).resolve().parent
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


def get_contexts(value):
    try:
        data = json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return []

    contexts = []

    def extract(item):
        if isinstance(item, dict):
            if isinstance(item.get("text_content"), str):
                contexts.append(item["text_content"])
            else:
                for v in item.values():
                    extract(v)
        elif isinstance(item, list):
            for v in item:
                extract(v)
        elif isinstance(item, str) and item.strip():
            contexts.append(item)

    extract(data)
    return list(dict.fromkeys(contexts))


async def main():
    from ragas.llms import llm_factory
    from ragas.metrics.collections import (
        ContextPrecision,
        ContextRecall,
        Faithfulness,
        FactualCorrectness,
    )

    benchmark = pd.read_csv(BASE_DIR / "response_test_results_5.csv")
    references = pd.read_csv(BASE_DIR / "reference_answers_updated.csv")

    def query_key(query):
        return re.sub(r"^\s*\d+[.)]\s*", "", query).strip()

    benchmark["query_key"] = benchmark["query"].map(query_key)
    references["query_key"] = references["query"].map(query_key)
    data = benchmark.merge(
        references[["query_key", "reference"]],
        on="query_key", how="left", validate="many_to_one",
    )

    missing = data["reference"].fillna("").str.strip().eq("")
    if missing.any():
        raise ValueError(
            "Queries with no reference answer:\n" + "\n".join(data.loc[missing, "query"])
        )

    llm = llm_factory(
        model=settings.MODEL,
        provider="openai",
        client=client,
    )

    metrics = {
        "context_precision": ContextPrecision(llm=llm),
        "context_recall": ContextRecall(llm=llm),
        "faithfulness": Faithfulness(llm=llm),
        "factual_correctness": FactualCorrectness(llm=llm, mode="f1"),
    }

    results = []

    for _, row in data.iterrows():
        contexts = get_contexts(row["retrieved_chunk"])

        result = {
            "query": row["query"],
            "response": row["response"],
            "reference": row["reference"],
            "retrieved_context_count": len(contexts),
        }

        for name, metric in metrics.items():
            try:
                if name == "context_precision":
                    if not contexts:
                        result[name] = None
                        continue

                    score = await metric.ascore(
                        user_input=row["query"],
                        reference=row["reference"],
                        retrieved_contexts=contexts,
                    )

                elif name == "context_recall":
                    if not contexts:
                        result[name] = None
                        continue

                    score = await metric.ascore(
                        user_input=row["query"],
                        reference=row["reference"],
                        retrieved_contexts=contexts,
                    )

                elif name == "faithfulness":
                    if not contexts:
                        result[name] = None
                        continue

                    score = await metric.ascore(
                        user_input=row["query"],
                        response=row["response"],
                        retrieved_contexts=contexts,
                    )

                else:
                    score = await metric.ascore(
                        response=row["response"],
                        reference=row["reference"],
                    )

                result[name] = score.value

            except Exception as e:
                print(f"{name} failed for '{row['query']}': {e}")
                result[name] = None

        results.append(result)

        pd.DataFrame(results).to_csv(
            BASE_DIR / "ragas_evaluation_results_3.csv",
            index=False,
        )

        print(f"Evaluated: {row['query']}")

    results_df = pd.DataFrame(results)

    results_df.select_dtypes(include="number").mean().to_csv(
        BASE_DIR / "ragas_summary_3.csv",
        header=["average_score"],
    )

    await client.close()
    print("Evaluation complete. Results saved to CSV.")


if __name__ == "__main__":
    asyncio.run(main())
