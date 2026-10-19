from datetime import date
import json
from pathlib import Path
from typing import Any

from sqlalchemy import select, func
from sqlalchemy.orm import Session
from typesafe_sdk import AsyncTypeSafeClient, Choice

from app.core_tasks.llm_setup.chat_llm import client, MODEL, VISION_MODEL, get_completion_options
from app.db.model.chat import Chat, Message, Sender
from app.env_config.settings import get_settings

settings = get_settings()

normalization_prompt= (Path(__file__).resolve().parents[1] / "system_prompts" / "normalization_prompt.md").read_text(encoding="utf-8")
structure_knowledge= (Path(__file__).resolve().parents[1] / "system_prompts" / "structure_knowledge_metadeta.md").read_text(encoding="utf-8")
criteria= json.loads((Path(__file__).resolve().parents[1] / "system_prompts" / "criteria_decision.md").read_text(encoding="utf-8"))
instruction= (Path(__file__).resolve().parents[1] / "system_prompts" / "instruction_decision.md").read_text(encoding="utf-8")
retrieval_decision_prompt= (Path(__file__).resolve().parents[1] / "system_prompts" / "retrieval_decision.md").read_text(encoding="utf-8")
sql_retrieval_prompt= (Path(__file__).resolve().parents[1] / "system_prompts" / "sql_retrieval.md").read_text(encoding="utf-8")
response_prompt= (Path(__file__).resolve().parents[1] / "system_prompts" / "response_prompt.md").read_text(encoding="utf-8")
image_read_prompt=(Path(__file__).resolve().parents[1] / "system_prompts" / "read_image.md").read_text(encoding="utf-8")

async def send_prompt_to_normalize(user_query: str) -> str:
    current_date= date.today().isoformat()
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": f"{normalization_prompt}\nCurrent date: {current_date}"},
            {"role": "user", "content": user_query},
        ],
        **get_completion_options(MODEL, temperature=0.7),
    )
    return response.choices[0].message.content

async def send_prompt_to_standardise(user_queries: list[str]) -> str:
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": f"{structure_knowledge}"},
            {"role": "user", "content": json.dumps(user_queries)},
        ],
        **get_completion_options(MODEL, temperature=0.7),
    )
    return response.choices[0].message.content

async def send_prompt_to_read_image(image_url: str) -> str:
    response = await client.chat.completions.create(
        model=VISION_MODEL,
        messages=[
            {
                "role": "system",
                "content": image_read_prompt,
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url,
                        },
                    },
                ],
            },
        ],
        **get_completion_options(VISION_MODEL, temperature=0.7),
    )
    return response.choices[0].message.content




async def send_prompt_to_decide(user_queries: list[str]) -> list[str]:
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": retrieval_decision_prompt},
            {"role": "user", "content": json.dumps(user_queries)},
        ],
        **get_completion_options(MODEL),
    )
    strategies= json.loads(response.choices[0].message.content)["strategies"]
    if not isinstance(strategies, list) or len(strategies) != len(user_queries) or any(item not in criteria for item in strategies):
        raise ValueError("Invalid retrieval strategies")
    return strategies


async def decide_retrieval_strategy(user_queries: list[str]) -> list[str]:
    try:
        return await send_prompt_to_decide(user_queries)
    except Exception:
        pass

    strategies: list[str] = []

    async with AsyncTypeSafeClient(api_key=settings.TYPESAFE_API_KEY) as jev_client:
        for query in user_queries:
            response = await jev_client.system_one(
                state={"query": query},
                questions={
                    "retrieval_strategy": Choice(
                        instructions=instruction,
                        criteria=criteria,
                    )
                },
            )
            strategies.append(
                response.answers["retrieval_strategy"].choice
            )

    return strategies


async def send_prompt_to_plan(user_query: str, schema: dict) -> dict:
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": sql_retrieval_prompt},
            {"role": "user", "content": json.dumps({"query": user_query, "schema": schema})},
        ],
        **get_completion_options(MODEL),
    )
    return json.loads(response.choices[0].message.content)

async def send_prompt_for_response(data: list[dict[str,Any]], chat_id: int, user_id: int, db: Session):
    stream = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": response_prompt},
            {"role": "user", "content": json.dumps(data)},
        ],
        **get_completion_options(MODEL),
        stream=True
    )
    full_response=""
    async for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            full_response+=content
            yield content

    if full_response != "":
        db_message = Message(
            chat_id=chat_id,
            message_content=full_response,
            sent_by=Sender.LLM,
            user_id=user_id,
        )
        db.add(db_message)
        chat = db.execute(select(Chat).where(Chat.id == chat_id)).scalar_one_or_none()
        if chat:
            chat.updated_at = func.now()
        db.commit()

