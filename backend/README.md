# Backend setup

Shared FastAPI backend for Alaya and Memory Universe. For architecture, flows, and endpoints, see the [root backend guide](../README.md#2-backend).

## 1. Install dependencies

You need Python compatible with `requirements.txt` (the Docker image uses Python 3.12), PostgreSQL with pgvector, Redis, and OpenAI, TypeSafe, and Cloudinary credentials.

From the repository root, using PowerShell:

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

On macOS/Linux, create the environment with `python3 -m venv venv` and activate it with `source venv/bin/activate`. The combined frontend dev command expects `backend/venv/Scripts/python.exe` on Windows; adjust its `dev:worker` script if your environment path differs.

## 2. Configure the environment

Create `backend/.env`:

```dotenv
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/alaya
SECRET_KEY=replace-with-a-long-random-secret
OPENAI_API_KEY=your-openai-api-key
MODEL=your-openai-chat-model
TYPESAFE_API_KEY=your-typesafe-api-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
REDIS_HOST=localhost
REDIS_PORT=6379
ALAYA_ACCESS_TOKEN=
```

Use your actual database credentials and a model available to your OpenAI account. `ALAYA_ACCESS_TOKEN` must be present because the settings schema requires it; it can be empty for normal startup. Access/refresh lifetimes default to seven/30 days; optionally set `ACCESS_TOKEN_EXPIRE_MINUTES` and `REFRESH_TOKEN_EXPIRE_DAYS`. Keep `.env` out of Git.

## 3. Prepare PostgreSQL and Redis

With PostgreSQL running and pgvector installed, create the database and apply migrations. Run from `backend/`:

```sh
createdb alaya
psql alaya -c 'CREATE EXTENSION IF NOT EXISTS vector;'
alembic upgrade head
```

These database commands use your local PostgreSQL connection defaults; supply matching connection credentials if needed.

Start Redis through your local service manager or Docker:

```sh
docker run --name alaya-redis --rm -p 6379:6379 redis:7
```

## 4. Start the API and worker

Start the API from `backend/` with the virtual environment activated:

```sh
uvicorn app.main:app --reload --port 8000
```

In another terminal, run from the repository root after installing both clients' dependencies:

```sh
cd frontend
npm run dev
```

This starts the Alaya frontend, Memory Universe, and the ARQ worker together. See the [frontend setup guide](../frontend/README.md) for installation commands and service ports. Keep PostgreSQL and Redis running separately.

If you need to run only the worker manually, use a separate terminal in `backend/` with the virtual environment activated:

```sh
arq app.core_tasks.arq_worker.worker.WorkerSettings
```

Do not start this manual worker when `frontend`'s `npm run dev` is already running it.

The worker is required for text, image, and document indexing. API and worker must share `temp_files/` because document jobs use local file paths. Restart both after changing `.env`.

Open [API docs](http://localhost:8000/docs), then start the [frontend](../frontend/README.md). Run `python -m compileall app alembic` for a syntax check. For running the full stack in containers, see the [root setup guide](../README.md#setup-and-configuration), including Compose environment-file configuration.

## Local MCP server

From `backend/` with the virtual environment activated, run `python -m app.mcpserver.server` to start the stdio MCP server. It runs separately from FastAPI.

The `update_user_settings` tool accepts `access_token` plus optional `name` and `username` updates. It changes only the authenticated account and returns only its ID, name, and username. Username conflicts return tool errors.

All tools require `access_token`, an Alaya access JWT (raw token or `Bearer <token>`). The shared decoder verifies its HS256 signature, expiry, access-token type, and positive integer `user_id`. The MCP server extracts the `phone_number` claim and looks up the account using its unique phone number. It also checks that the matched account belongs to the signed `user_id`, preventing access if a phone number is reassigned. Login now includes `phone_number` in access tokens. Older tokens, or tokens issued before a phone-number change, require a fresh login for MCP. Accounts need a phone number to use MCP. Existing HTTP routes continue to use the shared user-ID decoder. Expired, malformed, incorrectly signed, refresh, and unknown-account tokens are rejected.

Non-null phone numbers are stored uniquely as `+` followed by country code and digits. Spaces, parentheses, dots, and hyphens are removed; `00` becomes `+`. Local 10-digit numbers (or an initial `0` plus 10 digits) default to India (`+91`); a 12-digit number beginning with `91` is also accepted. Other countries require an explicit `+` or `00` country-code prefix. For example, `98765 43210`, `09876543210`, and `+91-98765-43210` all become `+919876543210`. Signup, profile updates, ORM assignments, issued JWT claims, and MCP claim lookup apply the same normalization. Duplicate signups return `409` with `Phone number already taken`. Existing accounts without a phone number remain supported.

| Tool | Description |
| --- | --- |
| `get_uploaded_data` | List the user's uploaded text, images, and documents. |
| `delete_uploaded_data` | Delete the user's upload specified by `upload_id` and its associated knowledge. |
| `ask_alaya` | Return an answer, or use `exact_chunks=true` to return the original retrieval payload without answer generation. |
| `store_text_in_alaya` | Queue `text_content` for knowledge processing with an optional `tag`. |
| `store_image_in_alaya` | Upload an image from local `file_path` and queue it for knowledge processing. |
| `store_docs_in_alaya` | Upload a document from local `file_path` and queue it for extraction and knowledge processing. |

For `ask_alaya`, pass an existing `chat_id` to continue a conversation or omit it to create a new chat. Upload paths must be readable on the machine running the MCP server. Images use the existing PNG/JPEG/WEBP validation and 2 MB limit. Storage tools require Redis and the ARQ worker; document uploads use the same shared temporary directory as the API and worker. Their success responses confirm queueing, while processing continues in the worker.

The server currently uses local stdio transport. The MCP client supplies the access JWT for each call; never log or share it. Keep local file access restricted to trusted clients.

The MCP prompt `get_alaya_knowledge_prompt` accepts `access_token`, `question`, and an optional string `chat_id`. It instructs Argon's LLM to call `ask_alaya` with the question and `exact_chunks=true`; Alaya handles exact chunk preservation. Exact mode bypasses answer generation and returns `retrieved_chunks` containing the full retrieval payload plus `response`, its JSON rendering. Original text, ordering, and metadata are preserved; retrieval failures return errors rather than generated fallback answers. Empty retrieval returns `[]`. Normal calls default to `exact_chunks=false` and continue generating answers.

The client must select/apply the prompt; rendering it does not execute the tool. Alaya preserves every chunk returned by retrieval, but retrieval does not guarantee every matching record in the database or the original uploaded file contents. Any later rewriting by Argon's client is outside Alaya's exact-chunk handling.

Logout increments the account token version, invalidating all existing access tokens for that account in HTTP and MCP. New logins and Universe tokens use the current version. Document uploads accept PDF, DOCX, TXT, MD, CSV, XLSX, and PPTX up to 15 MB; images retain their 2 MB limit. Queue failures attempt to remove the upload record and any local/cloud files. AI streams are paced in chunks of up to 16 characters with a 40 ms delay and provide a fallback or interruption message if streaming fails.

`POST /api/user/refresh_access_token` accepts the refresh-token cookie or JSON `{"refresh_token": "..."}`. It validates the signature, expiry, token type, saved token, and session version, then returns `access_token` and sets its HTTP-only cookie. The frontend automatically refreshes and retries a request once after an expired or missing access token; simultaneous requests share the refresh call. MCP clients can use the JSON endpoint and retry their tool call with the returned access token. Logout also invalidates refresh tokens.

Image and document uploads now save their Cloudinary public ID and resource type. Deleting an upload removes the cloud file before deleting its database record; a cloud failure preserves the record for retry. Legacy standard Cloudinary upload URLs can also be resolved safely. Text uploads only require database deletion.
