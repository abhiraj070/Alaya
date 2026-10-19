from pathlib import Path
import httpx
from app.env_config.settings import get_settings

settings = get_settings()

def main():
    base_url = "http://localhost:8000"
    chat_id = 1
    token = settings.ALAYA_ACCESS_TOKEN

    if not token:
        raise ValueError("Set ALAYA_ACCESS_TOKEN first.")

    queries = (
        Path(__file__)
        .with_name("user_test_queries.txt")
        .read_text(encoding="utf-8")
        .splitlines()
    )

    url = f"{base_url}/api/messages/new_messages/{chat_id}"

    with httpx.Client(timeout=300) as client:
        for line in queries:
            query = line.strip()

            if not query:
                continue

            response = client.post(
                url,
                json={
                    "message_content": query,
                },
                headers={
                    "Authorization": f"Bearer {token}",
                },
            )

            print(f"\nQuery: {query}")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            print("Response time:", response.elapsed.total_seconds(), "seconds")

if __name__ == "__main__":
    main()
