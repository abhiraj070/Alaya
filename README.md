# Alaya

Alaya is a personal knowledge and conversational retrieval API. It lets each user store free-form facts, converts those facts into structured metadata and vector embeddings, and answers later questions using semantic search, deterministic PostgreSQL queries, or a combination of both.

The backend is built with FastAPI, PostgreSQL/pgvector, Redis, ARQ, SQLAlchemy, and OpenAI.

> **Project status:** Alaya is under active development. The core API and retrieval pipeline are present, but the checked-in Alembic revisions are currently empty and some production-hardening work is still outstanding. See [Current limitations](#current-limitations).

## What Alaya does

- Registers users and authenticates them with JWT access/refresh cookies.
- Creates and manages per-user chat sessions.
- Stores conversational messages and their embeddings.
- Accepts free-form knowledge such as purchases, preferences, events, and personal facts.
- Normalizes compound input into standalone facts.
- Extracts dynamic structured metadata from those facts.
- Creates knowledge embeddings asynchronously through an ARQ worker.
- Chooses semantic, SQL, or hybrid retrieval for each question.
- Streams an LLM-generated response back to the client.

## How the retrieval pipeline works

```text
Knowledge input
    -> normalize/split input
    -> extract structured metadata
    -> store in PostgreSQL
    -> enqueue embedding job in Redis
    -> ARQ worker creates pgvector embedding

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
| Authentication | JWT (HS256), Argon2 |
| LLM | OpenAI `gpt-4o-mini` |
| Embeddings | OpenAI `text-embedding-3-small` |

## Project structure

```text
alaya/
├── alembic/                     # Database migration environment and revisions
├── app/
│   ├── api/                     # User, chat, and message/knowledge endpoints
│   ├── auth/                    # JWT request dependency
│   ├── core_tasks/              # LLM, embeddings, retrieval, queue, and worker
│   │   └── system_prompts/      # Prompts used by the retrieval pipeline
│   ├── db/
│   │   ├── model/               # SQLAlchemy models
│   │   └── connect.py           # Engine and session setup
│   ├── env_config/              # Environment-backed settings
│   ├── schema/                  # Pydantic request/response models
│   └── main.py                  # FastAPI application entry point
├── alembic.ini
└── requirements.txt
```

## Prerequisites

- Python 3.9 or newer
- PostgreSQL with the [pgvector](https://github.com/pgvector/pgvector) extension available
- Redis
- An OpenAI API key

## Local setup

### 1. Create and activate a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

On Windows PowerShell, activate it with:

```powershell
.venv\Scripts\Activate.ps1
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
TYPESAFE_API_KEY=unused-placeholder
REDIS_HOST=localhost
REDIS_PORT=6379
```

`DATABASE_URL`, `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `OPENAI_API_KEY`, and `TYPESAFE_API_KEY` are currently required when the application imports its settings. `XAI_API_KEY` is optional and reserved for the configured Grok provider.

Do not commit `.env`; it is already excluded by `.gitignore`.

### 3. Initialize PostgreSQL

Create the database, then enable pgvector:

```bash
createdb alaya
psql alaya -c 'CREATE EXTENSION IF NOT EXISTS vector;'
```

The current Alembic revision files do not create the schema yet. For local development, load all models and create their tables directly:

```bash
python -c "from app.db.connect import Base, engine; import app.db.model.user, app.db.model.chat; Base.metadata.create_all(engine)"
```

Once real migrations are added, replace the direct table creation step with:

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
arq app.core_tasks.worker.WorkerSettings
```

The API is available at `http://127.0.0.1:8000`. Interactive documentation is available at:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## API overview

All routes are mounted under `/api`.

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
| `GET` | `/api/messages/get_messages/{chat_id}` | Not currently required | List messages in a chat |
| `PUT` | `/api/messages/update_message/{message_id}` | Not currently required | Edit a message |
| `DELETE` | `/api/messages/delete_message/{message_id}` | Not currently required | Delete a message |
| `POST` | `/api/messages/feed_knowledge` | Required | Store knowledge and enqueue its embeddings |

Protected routes accept either an `access_token` cookie or this header:

```http
Authorization: Bearer <access-token>
```

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
curl -X POST http://127.0.0.1:8000/api/chat/create_chat \
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

The worker must finish the queued knowledge embedding before that knowledge can appear in semantic search.

## Data model

- **User** owns chats, messages, and knowledge records. Passwords are hashed with Argon2 before insertion.
- **Chat** groups messages for one user.
- **Message** stores user/LLM content, its sender, owner, and creation time.
- **Knowledge** stores a normalized fact, its dynamic JSONB metadata, fact type, and owner.
- **Embedding** links a 1,536-dimensional vector to either a message or knowledge record.

Deleting a user cascades to chats and messages at the ORM level. Deleting a chat or message also removes its related messages or embeddings through configured relationships.

## Configuration notes

- CORS currently targets a local frontend at `http://localhost:3000`.
- The active chat provider is OpenAI. A Grok provider configuration exists in `app/core_tasks/chat_llm.py` but is not selected.
- Access and refresh tokens currently expire after 15 minutes and 30 days respectively; these durations are hard-coded in token generation even though matching environment settings exist.
- Login cookies use `secure=False` for local HTTP development. Production deployments should enable secure cookies and use HTTPS.

## Current limitations

- The two checked-in Alembic revisions contain no schema operations.
- Several user/chat/message management routes are not protected by JWT authentication or ownership checks.
- Usernames are not currently declared unique at the database level.
- Refresh-token rotation and a refresh endpoint are not implemented; the database refresh-token field is not populated during login.
- The request schemas contain some fields that are ignored by the handlers (for example, the supplied chat title and message user ID).
- Knowledge ingestion does not yet chunk large inputs.
- The final streaming function currently uses the SQL-planning prompt instead of the dedicated response prompt; generated output may therefore be incorrect until this is fixed.
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

- Add complete initial migrations, including pgvector extension setup.
- Enforce authentication and resource ownership on every private route.
- Implement refresh-token rotation and revocation.
- Persist assistant responses and complete conversational context handling.
- Add ingestion chunking, idempotency, and job-status tracking.
- Add unit/integration tests and Docker Compose for PostgreSQL, Redis, API, and worker.
- Add structured logging, retries, rate limits, and production deployment configuration.

