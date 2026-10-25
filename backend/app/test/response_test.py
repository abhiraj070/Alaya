from pathlib import Path
import csv
import json
import httpx
from app.env_config.settings import get_settings

settings = get_settings()

def main():
    base_url = "http://localhost:8000"
    user_id = 1
    token = settings.ALAYA_ACCESS_TOKEN

    if not token:
        raise ValueError("Set ALAYA_ACCESS_TOKEN first.")

    queries = (
        Path(__file__)
        .with_name("user_test_queries.txt")
        .read_text(encoding="utf-8")
        .splitlines()
    )
    results = []

    with httpx.Client(timeout=300) as client:
        chat = client.post(
            f"{base_url}/api/chat/create_chat",
            json={"user_id": user_id, "chat_title": "Response test"},
            headers={"Authorization": f"Bearer {token}"},
        )
        chat.raise_for_status()
        chat_id = chat.json()["id"]
        url = f"{base_url}/api/messages/new_messages/{chat_id}"

        for line in queries:
            query = line.strip()
            if not query:
                continue
            response = client.post(
                url,
                params={"include_usage": "true"},
                json={
                    "message_content": query,
                    "user_id": user_id,
                },
                headers={
                    "Authorization": f"Bearer {token}",
                },
            )

            usage = {}
            retrieved_chunk = []
            response_text = response.text
            if response.is_success:
                data = response.json()
                response_text = data["response"]
                usage = data.get("usage") or {}
                retrieved_chunk = [
                    item.get("data", item)["text_content"]
                    for chunk in (data.get("retrieved chunk") or [])
                    if isinstance(chunk["results"], list)
                    for item in chunk["results"]
                    if "text_content" in item.get("data", item)
                ]
            result = {
                "chat_id": chat_id,
                "query": query,
                "status_code": response.status_code,
                "response": response_text,
                "retrieved_chunk": json.dumps(retrieved_chunk, ensure_ascii=False),
                "input_tokens": usage.get("input_tokens", "Not provided by API"),
                "output_tokens": usage.get("output_tokens", "Not provided by API"),
                "total_tokens": usage.get("total_tokens", "Not provided by API"),
                "response_time_seconds": response.elapsed.total_seconds(),
            }
            results.append(result)
            print(f"\nQuery: {query}")
            print(f"Status: {result['status_code']}")
            print(f"Response: {response_text}")
            print("Input tokens:", result["input_tokens"])
            print("Output tokens:", result["output_tokens"])
            print("Total tokens:", result["total_tokens"])
            print("Response time:", result["response_time_seconds"], "seconds")

    csv_path = Path(__file__).with_name(f"response_test_results_{chat_id}.csv")
    with csv_path.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=[
            "chat_id", "query", "status_code", "response", "retrieved_chunk", "input_tokens",
            "output_tokens", "total_tokens", "response_time_seconds",
        ])
        writer.writeheader()
        writer.writerows(results)
    print(f"\nCSV saved: {csv_path}")

if __name__ == "__main__":
    main()
