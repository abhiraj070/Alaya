# Alaya

Alaya is a personal knowledge platform with a Next.js workspace, a standalone Memory Universe 3D client, and one shared FastAPI backend. It stores text, images, and documents, turns their content into structured knowledge and vector embeddings, and answers questions using semantic search, PostgreSQL queries, or a combination of both.

The backend is built with FastAPI, PostgreSQL/pgvector, Redis, ARQ, SQLAlchemy, and OpenAI.

The [Alaya frontend](frontend/README.md) and standalone [Memory Universe 3D client](memory-universe/README.md) use this same backend and database. Their setup and structure are documented in those directories.

> **Project status:** Alaya is under active development. Text, image, and document ingestion pipelines are implemented, including document chunking and background processing. See [Current limitations](#current-limitations) for outstanding work.

## What Alaya does

- Registers users and authenticates them with JWT access/refresh cookies.
- Creates and manages per-user chat sessions.
- Stores conversational messages and their embeddings.
- Accepts free-form knowledge such as purchases, preferences, events, and personal facts.
- Normalizes compound input into standalone facts.
- Extracts dynamic structured metadata from those facts.
- Creates knowledge embeddings asynchronously through an ARQ worker.
- Reads uploaded images through an OpenAI vision model and stores the extracted knowledge.
- Accepts PDF, DOCX, TXT, Markdown, CSV, XLSX, and PPTX uploads, extracts their text, and splits it into overlapping chunks.
- Stores each document chunk with its own structured metadata and embedding.
- Reports background text, image, and document-processing status over WebSockets.
- Chooses semantic, SQL, or hybrid retrieval for each question.
- Streams an LLM-generated response back to the client.
- Displays saved uploads as interactive stars in Memory Universe, including uploads that have not been processed yet.

## Memory Universe

Start the [3D client](memory-universe/README.md), sign in to Alaya, and click **Memory Universe** in the workspace. Each click requests a fresh access token and opens the standalone client. The client queries the authenticated user's `uploaded_data` records through `GET /api/universe/uploads`, without HTTP caching.

- Every saved upload becomes a star, even if there is only one record and no processed knowledge or embeddings exist.
- Documents are red, images are blue, and text entries are yellow; hover and selection highlights temporarily override these colors.
- A successful empty response loads the 84-star sample universe and its introduction. Real uploads always take priority, including when entering or refreshing the demo.
- Authentication and connection failures show an error; they never count as an empty database.
- WebSocket upload messages trigger the same REST refresh. Initial loading works independently of WebSocket delivery.

Upload positions are deterministic display coordinates. They do not require the separate knowledge projection pipeline or represent measured semantic similarity. Upload details retain their own source IDs; they are not looked up as knowledge chunk IDs.

## How the retrieval pipeline works

```text
Knowledge input
    -> enqueue raw text in Redis
    -> ARQ worker normalizes/splits input
    -> extract structured metadata and create embeddings
    -> commit knowledge and pgvector embeddings to PostgreSQL
    -> publish completion status through Redis pub/sub
    -> deliver status to the user's WebSocket connection

Document upload
    -> save file locally in temp_files/
    -> enqueue file path and authenticated user ID in Redis
    -> ARQ worker extracts text from the saved file
    -> recursively split text and add overlap
    -> extract structured metadata one chunk at a time
    -> create embeddings for the chunks
    -> commit knowledge and embeddings to PostgreSQL
    -> publish completion status through Redis pub/sub
    -> delete the local file when the worker exits

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
| Alaya frontend | Next.js, React, Tailwind CSS |
| Memory Universe | Vite, React Three Fiber, Three.js, Tailwind CSS |
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
| Uploaded file storage | Cloudinary |
| Document extraction | PyMuPDF, python-docx, pandas, openpyxl, python-pptx |

## Project structure

```text
Alaya/
├── backend/
│   ├── app/
│   │   ├── api/                # Users, chats, messages, uploads, and universe routes
│   │   ├── auth/               # JWT verification
│   │   ├── core_tasks/         # Ingestion, extraction, chunking, retrieval, projection,
│   │   │                      # ARQ jobs, Redis notifications, and WebSockets
│   │   ├── db/                 # SQLAlchemy models, engine, and sessions
│   │   ├── env_config/         # Environment-backed settings
│   │   ├── schema/             # Pydantic request/response models
│   │   ├── utility/            # Cloudinary helpers
│   │   └── main.py             # Shared FastAPI application
│   ├── alembic/                # Database migrations
│   ├── alembic.ini
│   └── requirements.txt
├── frontend/                   # Next.js Alaya workspace, auth, profile, and uploads
│   ├── app/
│   ├── components/
│   └── lib/
└── memory-universe/
    └── frontend/               # Standalone Vite 3D client
        ├── src/                # Scene, views, hooks, store, API, and demo fixtures
        └── public/fonts/       # Locally hosted Inter font and license
```

## Prerequisites

- Python 3.10 or newer for the source syntax; the existing local environment uses Python 3.14. Check that the pinned dependencies support your chosen version.
- PostgreSQL with the [pgvector](https://github.com/pgvector/pgvector) extension available
- Redis
- Node.js and npm for the two frontends; use a Node.js version supported by the checked-in Next.js and Vite versions.
- An OpenAI API key
- A TypeSafe API key for retrieval-strategy classification
- Cloudinary credentials for image and document uploads (also required by settings at startup)

## Local setup

### 1. Create and activate a virtual environment

Run backend setup commands from `backend/`:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

On Windows PowerShell, create and activate the environment with:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

### 2. Configure environment variables

Create `backend/.env`. The backend loads `.env` relative to its working directory:

```dotenv
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/alaya
SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=10080
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

`DATABASE_URL`, `SECRET_KEY`, `OPENAI_API_KEY`, `TYPESAFE_API_KEY`, and the three `CLOUDINARY_*` values are required when the application imports its settings. Token lifetimes default to 10,080 minutes (seven days) for access tokens and 30 days for refresh tokens. `XAI_API_KEY` is optional and reserved for the configured Grok provider.

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

Run the API and worker against the same local filesystem. Document jobs receive an absolute file path, so the worker must be able to read the API's `temp_files/` directory. Run both commands from `backend/` so they load the same `.env`.

The API is available at `http://127.0.0.1:8000`. Interactive documentation is available at:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

### 6. Start both frontends

In separate terminals, starting from the repository root:

```bash
cd frontend
npm ci
npm run dev
```

```bash
cd memory-universe/frontend
npm ci
npm run dev
```

Open Alaya at `http://localhost:3000`, register or sign in, then click **Memory Universe** to open `http://localhost:5173`. Allow the new tab if your browser blocks it. The API runs on port 8000; both clients use this same backend. Use `localhost` consistently rather than mixing it with `127.0.0.1` for cookie-based sessions.

The frontends proxy `/api` to the backend in development. Their optional settings are documented in [frontend/.env.example](frontend/.env.example) and [memory-universe/frontend/.env.example](memory-universe/frontend/.env.example). A separate backend on port 8001 is not required.

## API overview

HTTP routes are mounted under `/api`. The WebSocket endpoint is available separately at `/ws`. All chat routes require authentication; user registration and login are public.

### Users

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/user/register` | Register a user |
| `POST` | `/api/user/login` | Log in and set access/refresh cookies |
| `GET` | `/api/user/get_user/{user_id}` | Fetch one user |
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
| `PUT` | `/api/messages/update_message/{chat_id}/{message_id}` | Required | Edit a message, regenerate embeddings, and stream a response |
| `DELETE` | `/api/messages/delete_message/{message_id}` | Required | Delete a message |
| `POST` | `/api/messages/feed_knowledge` | Required | Queue raw text for normalization, metadata extraction, and embedding |
| `POST` | `/api/messages/image_upload` | Required | Upload an image and enqueue background extraction and embedding |
| `POST` | `/api/messages/file_upload` | Required | Save a document locally and enqueue extraction, chunking, and knowledge storage |

Protected routes accept either an `access_token` cookie or this header:

```http
Authorization: Bearer <access-token>
```

### Uploaded records and Memory Universe

All routes below require authentication and scope records to the authenticated user.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/uploaded_data/get_uploads/{user_id}` | List the user's saved uploads |
| `DELETE` | `/api/uploaded_data/delete_upload/{upload_id}` | Delete an owned upload record |
| `GET` | `/api/universe/token` | Issue an access token for opening Memory Universe |
| `GET` | `/api/universe/uploads` | Read every owned upload; default 3D view's source of truth |
| `GET` | `/api/universe/nodes` | Read processed knowledge with saved 3D coordinates |
| `GET` | `/api/universe/chunks/{knowledge_id}` | Read a processed knowledge chunk and its source lineage |
| `POST` | `/api/universe/recompute` | Calculate and commit coordinates for processed knowledge |

Deleting an upload history record does not currently delete its indexed knowledge. The default upload view does not depend on the projection endpoints.

### WebSocket notifications

Connect with an access-token cookie, an `Authorization: Bearer <access-token>` header where supported, or the `token` query parameter used by the standalone client. The authenticated token determines the user:

```text
ws://localhost:8000/ws?client=app
ws://localhost:8000/ws?client=universe&token=<access-token>
```

When a browser supplies an `Origin`, it must match the configured local allowlist: `http://localhost` or `http://127.0.0.1` on ports 3000, 3001, or 5173. Other supplied origins are rejected with policy-violation code `1008`. Missing origins are currently accepted after authentication.

Log in through the Alaya frontend. Cookies are shared across ports on the same hostname; `localhost` and `127.0.0.1` are different hosts. Alaya's Memory Universe button obtains a fresh token and passes it to the standalone client, which stores it in the tab's session storage and attaches it to REST requests. A `user_id` query parameter does not select the notification recipient.

The API process uses a native `redis.asyncio.Redis` client to subscribe to the Redis `websocket_messages` channel, while an ARQ pool handles queued jobs. After an ARQ job finishes, the worker publishes a status message and the API forwards it to the user's app socket. Universe connections receive an `uploaded_data` snapshot on connection. Client actions `open_universe` and `get_uploaded_data` request a fresh upload broadcast to that user's connected universe sockets; the universe client uses these messages to trigger its authoritative REST refresh.

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

The knowledge endpoint returns `{"message":"Knowledge queued for processing"}`. Wait for the worker to finish before querying the stored knowledge.

Ask a question and receive a streamed plain-text response (replace the chat ID if needed):

```bash
curl -N -b cookies.txt -X POST \
  http://127.0.0.1:8000/api/messages/new_messages/1 \
  -H 'Content-Type: application/json' \
  -d '{"message_content":"How much did I spend on my laptop?","user_id":1}'
```

Upload an image as multipart form data:

```bash
curl -b cookies.txt -X POST \
  http://127.0.0.1:8000/api/messages/image_upload \
  -F 'file=@receipt.png'
```

Images must be PNG, JPEG, or WEBP and no larger than 2 MB. The API checks the file signature, uploads to Cloudinary, and queues extraction and embedding. It returns `{"message":"Image queued for processing"}`; completion or failure arrives over the WebSocket. Temporary local files are removed after upload, and Cloudinary cleanup is attempted if enqueueing or processing fails.

## Document uploads and chunking

Upload a document as multipart form data:

```bash
curl -b cookies.txt -X POST \
  http://127.0.0.1:8000/api/messages/file_upload \
  -F 'file=@notes.pdf'
```

The API returns HTTP `201` with `{"message":"File queued for processing"}` after saving a temporary file, uploading the original to Cloudinary, persisting an `UploadedData` record, and queueing `create_file_embeddings`. The saved upload can appear in Memory Universe before extraction and embedding finish. Processing happens in the worker; completion or failure is reported over the WebSocket.

`app/core_tasks/extraction/extractor.py` dispatches local file paths by extension:

| Formats | Extracted content |
| --- | --- |
| PDF | Embedded page text with page labels; no OCR for scanned pages |
| DOCX | Paragraphs and table cells |
| TXT, Markdown | UTF-8 text with replacement for invalid characters |
| CSV | Non-empty values labeled with their column names |
| XLSX | Cell values grouped by sheet; formulas use cached values |
| PPTX | Text-bearing shapes grouped by slide |

The worker passes the saved file's path to `extract_text`. Unsupported extensions and files with no extractable text fail during background processing, after the upload has been accepted.

The recursive splitter uses a default chunk size of 1,000 characters and prepends up to 150 characters from the previous chunk. It tries paragraph, line, sentence, and smaller separators before falling back to character slicing. The first chunk has no overlap; later chunks can reach 1,150 characters after overlap is added. These sizes count characters, not tokens, and can be changed through the helper's arguments.

Metadata is extracted separately for each chunk, while embeddings are requested for the full chunk list. Each chunk becomes one `Knowledge` row and one linked `Embedding` row belonging to the authenticated user. The worker commits the document's rows together and rolls them back if processing fails. Metadata and embedding generation each allow two attempts.

The worker deletes the local file in its cleanup block after success or failure. If saving or queueing fails, the API attempts deletion immediately. Both `temp_files/` and `temp_img/` are excluded from Git.

## Data model

- **User** owns chats, messages, and knowledge records. Passwords are hashed with Argon2 before insertion.
- **Chat** groups messages for one user.
- **Message** stores user/LLM content, its sender, owner, and creation time.
- **Knowledge** stores a normalized text fact, extracted image content, or document chunk, together with its dynamic JSONB metadata, fact type, and owner.
- **UploadedData** stores the original text or uploaded file URL, content type, format tag, owner, and creation time. It is the default Memory Universe view's source of truth and can exist without any processed knowledge.
- **Embedding** links a 1,536-dimensional vector to either a message or knowledge record.
- **KnowledgeCoordinate** in `backend/app/db/model/universe.py` stores one saved 3D position per knowledge chunk in `knowledge_coordinates`.

Deleting a user cascades to chats and messages at the ORM level. Deleting a chat or message also removes its related messages or embeddings through configured relationships.

## Configuration notes

- CORS permits local Alaya and Universe origins on ports 3000, 3001, and 5173, using either `localhost` or `127.0.0.1`.
- The active chat provider is OpenAI. A Grok provider configuration exists in `app/core_tasks/llm_setup/chat_llm.py` but is not selected.
- Access and refresh token lifetimes use `ACCESS_TOKEN_EXPIRE_MINUTES` and `REFRESH_TOKEN_EXPIRE_DAYS`. Restart backend processes after changing settings.
- Login cookies use `secure=False` for local HTTP development. Production deployments should enable secure cookies and use HTTPS.
- Additional deployment origins must be configured in both the HTTP CORS and WebSocket origin allowlists.

## Current limitations

- Usernames are not currently declared unique at the database level.
- Login stores the refresh token, but a refresh endpoint and refresh-token rotation are not implemented. Sign in again when the access token expires.
- The request schemas contain some fields that are ignored by the handlers (for example, the supplied chat title and message user ID).
- Document uploads are chunked, but direct text ingestion through `feed_knowledge` does not yet chunk large inputs.
- Document uploads have no file-size limit or extension validation before queueing. Scanned PDFs require OCR, which is not implemented.
- Document jobs require a shared filesystem, request all embeddings in one batch, and use the default ARQ timeout. Very large documents may exceed processing limits.
- File cleanup depends on the worker's cleanup block running; an abrupt process termination can leave temporary files behind.
- Active WebSocket connections and Redis pub/sub notifications are not durable; reconnecting clients do not receive missed notifications.
- The current checkout has no `backend/tests/`, `frontend/tests/`, or `memory-universe/frontend/tests/` directories. Both frontend packages retain `npm test` scripts targeting missing files; they are not a working regression suite in this checkout.
- A containerized full-stack development environment is not included.

These constraints make the current code suitable for local development and experimentation, not a production deployment.

## Development checks

From `backend/`, run a fast syntax check across the application and migration code:

```bash
python -m compileall app alembic
```

From `frontend/`, run `npm run lint` and `npm run build`. From `memory-universe/frontend/`, run `npm run build` and optionally `npm run benchmark`. The benchmark uses synthetic data; it is not an end-to-end application test.

For a manual Universe check, open it from a signed-in Alaya session: at least one saved upload must show real stars; a confirmed empty upload list must show sample data; an authentication or connection failure must show an error. Upload processing and knowledge retrieval additionally require a running ARQ worker and configured external services.

When changing the database models, create and inspect a real Alembic revision before applying it:

```bash
alembic revision --autogenerate -m "describe the schema change"
alembic upgrade head
```

## Roadmap ideas

- Implement refresh-token rotation and revocation.
- Persist assistant responses and complete conversational context handling.
- Extend chunking to direct text ingestion and add upload limits, embedding batches, idempotency, and durable job-status tracking.
- Add unit/integration tests and Docker Compose for PostgreSQL, Redis, API, and worker.
- Add structured logging, retries, rate limits, and production deployment configuration.
