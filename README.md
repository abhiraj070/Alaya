# Alaya

Alaya is a personal knowledge and conversational retrieval API. It lets each user store free-form facts, converts those facts into structured metadata and vector embeddings, and answers later questions using semantic search, deterministic PostgreSQL queries, or a combination of both.

The backend is built with FastAPI, PostgreSQL/pgvector, Redis, ARQ, SQLAlchemy, and OpenAI.

> **Project status:** Alaya is under active development. Text and image ingestion pipelines are implemented, and document extraction is being added. The current checkout has API and worker startup blockers. See [Current limitations](#current-limitations) before running the setup commands.

## What Alaya does

- Registers users and authenticates them with JWT access/refresh cookies.
- Creates and manages per-user chat sessions.
- Stores conversational messages and their embeddings.
- Accepts free-form knowledge such as purchases, preferences, events, and personal facts.
- Normalizes compound input into standalone facts.
- Extracts dynamic structured metadata from those facts.
- Creates knowledge embeddings asynchronously through an ARQ worker.
- Reads uploaded images through an OpenAI vision model and stores the extracted knowledge.
- Includes local text extractors for PDF, DOCX, TXT, Markdown, CSV, XLSX, and PPTX files; the file-upload API is not yet connected.
- Reports background knowledge and image-processing status over WebSockets.
- Chooses semantic, SQL, or hybrid retrieval for each question.
- Streams an LLM-generated response back to the client.

## How the retrieval pipeline works

```text
Knowledge input
    -> enqueue raw text in Redis
    -> ARQ worker normalizes/splits input
    -> extract structured metadata and create embeddings
    -> commit knowledge and pgvector embeddings to PostgreSQL
    -> publish completion status through Redis pub/sub
    -> deliver status to the user's WebSocket connection

User question
    -> normalize/split question
    -> create question embeddings
    -> select retrieval strategy
       |-- semantic: nearest vectors
       |-- SQL: metadata filters/aggregations
       `-- hybrid: semantic candidates + SQL filtering
    -> assemble retrieved context
    -> stream generated answer
```

All knowledge and retrieval queries are scoped to the authenticated user.

## Technology stack

| Layer | Technology |
| --- | --- |
| API | FastAPI, Uvicorn |
| Validation | Pydantic |
| Database | PostgreSQL, SQLAlchemy |
| Vector search | pgvector (`vector(1536)`) |
| Migrations | Alembic |
| Queue | Redis, ARQ |
| Realtime notifications | WebSockets, Redis pub/sub |
| Authentication | JWT (HS256), Argon2 |
| LLM | OpenAI `gpt-4o-mini` |
| Image extraction | OpenAI vision model configured by `VISION_MODEL` |
| Embeddings | OpenAI `text-embedding-3-small` |
| Retrieval classification | JEV through the TypeSafe SDK |
| Image storage | Cloudinary |
| Document extraction | PyMuPDF, python-docx, pandas, openpyxl, python-pptx |

## Project structure

```text
alaya/
├── alembic/                     # Database migration environment and revisions
├── app/
│   ├── api/                     # User, chat, and message/knowledge endpoints
│   ├── auth/                    # JWT request dependency
│   ├── core_tasks/
│   │   ├── arq_worker/          # ARQ queue configuration and background jobs
│   │   ├── extraction/          # Local document and tabular text extractors
│   │   ├── llm_setup/           # Chat and embedding model clients
│   │   ├── redis_pubsub/        # Native Redis client and notification listener
│   │   ├── search/              # Semantic, SQL, and hybrid retrieval
│   │   ├── websocket/           # WebSocket endpoint and active connections
│   │   └── system_prompts/      # Prompts used by the retrieval pipeline
│   ├── db/
│   │   ├── model/               # SQLAlchemy models
│   │   └── connect.py           # Engine and session setup
│   ├── env_config/              # Environment-backed settings
│   ├── schema/                  # Pydantic request/response models
│   ├── utility/                 # Cloudinary upload and deletion helpers
│   └── main.py                  # FastAPI application entry point
├── alembic.ini
└── requirements.txt
```

## Prerequisites

- Python 3.10 or newer for the source syntax; the existing local environment uses Python 3.14. Check that the pinned dependencies support your chosen version.
- PostgreSQL with the [pgvector](https://github.com/pgvector/pgvector) extension available
- Redis
- An OpenAI API key
- A TypeSafe API key for retrieval-strategy classification
- Cloudinary credentials for image uploads (also required by settings at startup)

## Local setup

### 1. Create and activate a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

On Windows PowerShell, create and activate the environment with:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

### 2. Configure environment variables

Create a `.env` file in the repository root:

```dotenv
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/alaya
SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
OPENAI_API_KEY=your-openai-api-key
XAI_API_KEY=
TYPESAFE_API_KEY=your-typesafe-api-key
REDIS_HOST=localhost
REDIS_PORT=6379
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

`DATABASE_URL`, `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `OPENAI_API_KEY`, `TYPESAFE_API_KEY`, and the three `CLOUDINARY_*` values are currently required when the application imports its settings. `XAI_API_KEY` is optional and reserved for the configured Grok provider.

Do not commit `.env`; it is already excluded by `.gitignore`.

### 3. Initialize PostgreSQL

Create the database, then enable pgvector:

```bash
createdb alaya
psql alaya -c 'CREATE EXTENSION IF NOT EXISTS vector;'
```

Create the application schema with Alembic:

```bash
alembic upgrade head
```

### 4. Start Redis

Run Redis using your local service manager, or with Docker:

```bash
docker run --name alaya-redis --rm -p 6379:6379 redis:7
```

### 5. Start the API and worker

Use two terminals with the virtual environment activated.

API server:

```bash
uvicorn app.main:app --reload
```

ARQ worker:

```bash
arq app.core_tasks.arq_worker.worker.WorkerSettings
```

The API is available at `http://127.0.0.1:8000`. Interactive documentation is available at:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## API overview

HTTP routes are mounted under `/api`. The WebSocket endpoint is available separately at `/ws`. All chat routes require authentication; user registration and login are public.

### Users

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/user/register` | Register a user |
| `POST` | `/api/user/login` | Log in and set access/refresh cookies |
| `GET` | `/api/user/get_user/{user_id}` | Fetch one user |
| `GET` | `/api/user/get_users` | List users |
| `PUT` | `/api/user/update_user/{user_id}` | Update a user |
| `DELETE` | `/api/user/delete_user/{user_id}` | Delete a user |
| `PUT` | `/api/user/logout/{user_id}` | Clear authentication cookies |

### Chats

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/chat/create_chat` | Create a chat |
| `GET` | `/api/chat/get_chat/{chat_id}` | Fetch one chat |
| `GET` | `/api/chat/get_chats/{user_id}` | List a user's chats |
| `PUT` | `/api/chat/update_chat/{chat_id}` | Rename a chat |
| `DELETE` | `/api/chat/delete_chat/{chat_id}` | Delete a chat and its messages |

### Messages and knowledge

| Method | Route | Authentication | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/messages/new_messages/{chat_id}` | Required | Store a question, retrieve context, and stream a response |
| `GET` | `/api/messages/get_messages/{chat_id}` | Required | List messages in a chat |
| `PUT` | `/api/messages/update_message/{chat_id}/{message_id}` | Required | Edit a message and regenerate embeddings; response streaming needs an async fix |
| `DELETE` | `/api/messages/delete_message/{message_id}` | Required | Delete a message |
| `POST` | `/api/messages/feed_knowledge` | Required | Queue raw text for normalization, metadata extraction, and embedding |
| `POST` | `/api/messages/image_upload` | Required | Upload an image and enqueue background extraction and embedding |

Protected routes accept either an `access_token` cookie or this header:

```http
Authorization: Bearer <access-token>
```

### WebSocket notifications

Connect to the WebSocket endpoint with an access-token cookie or, for clients that support custom headers, an `Authorization: Bearer <access-token>` header. The authenticated token determines which user's notifications are delivered:

```text
ws://localhost:8000/ws
```

Browser connections are accepted only when the `Origin` header is exactly `http://localhost:3000`. Missing or different origins are rejected with WebSocket policy-violation code `1008`.

For browser clients, log in through `http://localhost:8000` so the cookie is available on the same host as the WebSocket. A `user_id` query parameter does not select the notification recipient.

The API process uses a native `redis.asyncio.Redis` client to subscribe to the Redis `websocket_messages` channel, while an ARQ pool handles queued jobs. After an ARQ knowledge or image job finishes, the worker publishes a status message and the API forwards it to the active socket for that user. Client messages are currently ignored; the connection is receive-only from the client's perspective.

Example server message:

```json
{
  "status": "completed",
  "message": "Data stored successfully"
}
```

Failed jobs use a `Failed` status with an explanatory message. Redis pub/sub notifications are transient, so messages published while the user is disconnected are not retained or replayed.

## Example workflow

Register and log in while saving the returned cookies:

```bash
curl -X POST http://127.0.0.1:8000/api/user/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","username":"ada","password":"correct-horse-battery-staple"}'

curl -c cookies.txt -X POST http://127.0.0.1:8000/api/user/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"ada","password":"correct-horse-battery-staple"}'
```

Create a chat (replace `1` with the registered user's ID):

```bash
curl -b cookies.txt -X POST http://127.0.0.1:8000/api/chat/create_chat \
  -H 'Content-Type: application/json' \
  -d '{"chat_title":"Personal memory","user_id":1}'
```

Feed knowledge. `text_content` is currently a query parameter:

```bash
curl -b cookies.txt -X POST \
  --get http://127.0.0.1:8000/api/messages/feed_knowledge \
  --data-urlencode 'text_content=I bought a laptop for 80000 INR on 2026-09-20'
```

Ask a question and receive a streamed plain-text response (replace the chat ID if needed):

```bash
curl -N -b cookies.txt -X POST \
  http://127.0.0.1:8000/api/messages/new_messages/1 \
  -H 'Content-Type: application/json' \
  -d '{"message_content":"How much did I spend on my laptop?","user_id":1}'
```

The endpoint returns `{"message":"Knowledge queued for processing"}`. The worker must finish processing before the knowledge is stored and available for retrieval.

Upload an image as multipart form data:

```bash
curl -b cookies.txt -X POST \
  http://127.0.0.1:8000/api/messages/image_upload \
  -F 'file=@receipt.png'
```

Images must be PNG, JPEG, or WEBP and no larger than 100 KB. The API checks the file signature, uploads to Cloudinary, and queues extraction and embedding. It returns `{"message":"Image queued for processing"}`; completion or failure arrives over the WebSocket. Temporary local files are removed after upload, and Cloudinary cleanup is attempted if enqueueing or processing fails.

## Document extraction in progress

`app/core_tasks/extraction/type_extractor.py` dispatches local file paths by extension:

| Formats | Extracted content |
| --- | --- |
| PDF | Embedded page text with page labels; no OCR for scanned pages |
| DOCX | Paragraphs and table cells |
| TXT, Markdown | UTF-8 text with replacement for invalid characters |
| CSV | Non-empty values labeled with their column names |
| XLSX | Cell values grouped by sheet; formulas use cached values |
| PPTX | Text-bearing shapes grouped by slide |

Unsupported extensions and files with no extractable text raise `ValueError`. These helpers accept local paths, not FastAPI `UploadFile` objects. `/api/messages/file_upload` is not registered because its declaration is missing the route decorator, and its handler and background job remain unfinished.

## Data model

- **User** owns chats, messages, and knowledge records. Passwords are hashed with Argon2 before insertion.
- **Chat** groups messages for one user.
- **Message** stores user/LLM content, its sender, owner, and creation time.
- **Knowledge** stores a normalized fact, its dynamic JSONB metadata, fact type, and owner.
- **Embedding** links a 1,536-dimensional vector to either a message or knowledge record.

Deleting a user cascades to chats and messages at the ORM level. Deleting a chat or message also removes its related messages or embeddings through configured relationships.

## Configuration notes

- CORS currently targets a local frontend at `http://localhost:3000`.
- The active chat provider is OpenAI. A Grok provider configuration exists in `app/core_tasks/llm_setup/chat_llm.py` but is not selected.
- Access and refresh tokens currently expire after 15 minutes and 30 days respectively; these durations are hard-coded in token generation even though matching environment settings exist.
- Login cookies use `secure=False` for local HTTP development. Production deployments should enable secure cookies and use HTTPS.
- WebSocket connections currently allow only the local frontend origin `http://localhost:3000`.

## Current limitations

- `app/api/messages.py` imports `get_queue` from `arqRedis_init.py`, but the dependency lives in `app/core_tasks/arq_worker/get_queue.py`; the import must be corrected before the API can start.
- The unfinished `create_file_embeddings` function in `app/core_tasks/arq_worker/worker.py` contains an empty `try` block and causes a syntax error, preventing the ARQ worker from starting.
- File ingestion is not available through the API yet; complete route registration, local file handling, enqueueing, and the file-processing worker before using it.
- The message-update handler calls the async retrieval function without awaiting it, so its streamed response is currently broken.
- Usernames are not currently declared unique at the database level.
- Refresh-token rotation and a refresh endpoint are not implemented; the database refresh-token field is not populated during login.
- The request schemas contain some fields that are ignored by the handlers (for example, the supplied chat title and message user ID).
- Knowledge ingestion does not yet chunk large inputs.
- Active WebSocket connections and Redis pub/sub notifications are not durable; reconnecting clients do not receive missed notifications.
- There is no automated test suite or containerized full-stack development environment yet.

These constraints make the current code suitable for local development and experimentation, not a production deployment.

## Development checks

Run a fast syntax check across the application and migration code:

```bash
python -m compileall app alembic
```

When changing the database models, create and inspect a real Alembic revision before applying it:

```bash
alembic revision --autogenerate -m "describe the schema change"
alembic upgrade head
```

## Roadmap ideas

- Implement refresh-token rotation and revocation.
- Persist assistant responses and complete conversational context handling.
- Add ingestion chunking, idempotency, and job-status tracking.
- Add unit/integration tests and Docker Compose for PostgreSQL, Redis, API, and worker.
- Add structured logging, retries, rate limits, and production deployment configuration.
