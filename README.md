# Alaya

A personal knowledge platform for saving information, asking questions about it, and exploring saved memories in 3D.

1. [Overview: what Alaya is and how it works](#1-overview)
2. [Backend: flows, endpoints, technologies, and setup](#2-backend)
3. [Frontend: pages, features, architecture, and setup](#3-frontend)
4. [Memory Universe: stars, data, controls, and setup](#4-memory-universe)

## 1. Overview

### What is Alaya?

Alaya is a searchable personal memory. Save notes, images, receipts, and documents, then ask questions such as “How much did I spend on my laptop?” instead of hunting through files yourself.

### What does it do?

- Saves text, images, and documents in your account.
- Reads their contents and organizes useful facts for later retrieval.
- Answers questions using relevant saved information, including filters and calculations.
- Keeps conversations and upload history in a workspace.
- Shows saved uploads as interactive stars in **Memory Universe**.

### How does it work, in plain language?

When you save something, Alaya keeps the original and asks a background helper to read it. The helper breaks the content into manageable pieces, labels useful details such as dates and amounts, and creates a numerical fingerprint of each piece's meaning. When you ask a question, Alaya finds relevant pieces or calculates an answer from those details, then uses AI to explain the result.

The **frontend** is your everyday workspace, the **backend** stores and processes information, and **Memory Universe** is another way to browse saved uploads. Both interfaces share the same backend and database.

```text
Alaya workspace (port 3000)       Memory Universe (port 5173)
                    \             /
                   Shared FastAPI API (port 8000)
                       |              |
                  PostgreSQL      Redis queue
                 facts + vectors      |
                                  ARQ worker
                            extraction + AI processing
```

### Repository and documentation map

| Location | Responsibility | Local guide |
| --- | --- | --- |
| `backend/` | API, authentication, database, ingestion, retrieval | [Backend README](backend/README.md) |
| `frontend/` | Landing, sign-in, chat, uploads, profile | [Frontend README](frontend/README.md) |
| `memory-universe/frontend/` | Standalone 3D upload browser | [Memory Universe README](memory-universe/README.md), [client commands](memory-universe/frontend/README.md) |
| `backend/alembic/` | Database migrations | [Migration README](backend/alembic/README) |
| `docker-compose.yml` | Container services | Setup in section 2 below |

This root README is the complete project guide. Directory READMEs provide short entry points and commands for working in each part.

## 2. Backend

### Responsibility and structure

The backend authenticates users, manages chats and uploads, turns content into searchable knowledge, and answers questions. Slow ingestion runs in a separate worker so the API can acknowledge uploads before processing finishes.

```text
backend/
  app/
    main.py                 FastAPI app, CORS, Redis startup/shutdown
    api/                    User, chat, message, upload, and Universe routes
    auth/                   JWT verification
    schema/                 Pydantic request/response models
    db/                     SQLAlchemy engine, sessions, and models
    env_config/             Settings loaded from backend/.env
    utility/                Cloudinary helpers
    core_tasks/
      arq_worker/           Queue connection and ingestion jobs
      extraction/           Format-specific document readers
      chunking/             Recursive text splitting
      llm_setup/            Chat, vision, and embedding clients
      llm_calls/            Normalization, metadata, planning, and answers
      system_prompts/       AI instructions
      search/               Semantic, SQL, hybrid, similar-question retrieval
      projection/           Separate knowledge-coordinate pipeline
      redis_pubsub/         Worker-to-API status messages
      websocket/            Browser notification connection
    test/                   Evaluation scripts and recorded results
  alembic/                  Versioned database migrations
  requirements.txt          Pinned Python dependencies
```

### Technologies and how they are used

| Technology | Use in this project |
| --- | --- |
| Python, FastAPI, Uvicorn | Define HTTP/WebSocket routes and serve the application. |
| Pydantic, pydantic-settings | Validate API shapes and load configuration. |
| PostgreSQL, JSONB | Store accounts, chats, uploads, knowledge, and dynamic fact metadata. |
| SQLAlchemy, psycopg2 | Map Python models to tables and execute user-scoped queries. |
| pgvector | Store 1,536-dimensional embeddings and search by cosine distance. |
| Alembic | Create and evolve the database schema. |
| Redis, ARQ | Queue ingestion for the separate worker process. |
| Redis pub/sub, WebSockets | Forward job success/failure notifications to the workspace. |
| Argon2, PyJWT | Hash passwords and issue/verify HS256 access and refresh tokens. |
| OpenAI SDK | Normalize facts/questions, extract metadata, plan retrieval, read images, and stream answers. Chat uses required setting `MODEL`; vision currently uses `gpt-5.6-luna` in `chat_llm.py`. |
| OpenAI `text-embedding-3-small` | Create vectors for meaning-based retrieval. |
| TypeSafe SDK / JEV | Fallback classifier when OpenAI retrieval-strategy classification fails. |
| Cloudinary | Store original images/documents and return source URLs. |
| PyMuPDF, python-docx, pandas, openpyxl, python-pptx | Extract document text. |
| NumPy, UMAP, scikit-learn KMeans | Compute separate knowledge coordinates and clusters; the upload-based Universe does not consume these. |
| Docker Compose | Run database, Redis, migrations, API, worker, and both interfaces. |

The active AI provider is OpenAI; a Grok configuration exists but is not selected. Versions are recorded in [requirements.txt](backend/requirements.txt).

### Overall flows

#### Account and authentication

1. Registration saves the user and hashes the password with Argon2.
2. Login verifies the password, stores a refresh token, and sets HTTP-only access/refresh cookies.
3. Protected routes verify the access JWT and enforce the authenticated user's ownership.
4. Logout clears cookies and the stored refresh token. Account deletion also clears cookies.

Protected requests accept the `access_token` cookie or `Authorization: Bearer <access-token>`. The verifier also accepts a `token` query parameter, used by browser handoff and WebSockets. Access tokens default to seven days; refresh tokens default to 30 days. There is no refresh endpoint or token rotation yet; sign in again after access-token expiry.

#### Saving text, images, and documents

```text
Authenticated input -> save UploadedData source -> enqueue Redis job
  -> acknowledge queue acceptance
  -> ARQ worker extracts/normalizes content
  -> generate metadata and embeddings
  -> commit Knowledge + Embedding rows to PostgreSQL
  -> attempt separate knowledge projection
  -> publish status through Redis -> API -> workspace WebSocket
```

The source can appear in upload history and Memory Universe before indexing completes. Queue acceptance does not mean the content is ready for questions.

| Input | Processing |
| --- | --- |
| Text | Save text and optional tag. Split into 2,000-character pieces without overlap, normalize into standalone facts, extract metadata in batches of four facts, then embed them. |
| Image | Check PNG/JPEG/WEBP signatures and a 2 MB limit; upload to Cloudinary and remove the temporary image. Worker reads its URL using vision and creates knowledge, metadata, and an embedding. |
| Document | Save a local temporary file, upload the original to Cloudinary, save its source, and queue its local path. Worker extracts text, chunks it, creates metadata per chunk and embeddings for the chunk list, then deletes the local file. |

Document chunks target 1,000 characters and prepend up to 150 characters from the preceding chunk. The splitter tries paragraph, line, sentence, and smaller boundaries before character slicing. Later chunks can reach 1,150 characters; sizes count characters, not tokens. Knowledge retains source lineage, chunk index, and PDF page information where available. Generation has bounded retries; failed knowledge transactions roll back.

| Formats | Extracted content |
| --- | --- |
| PDF | Embedded page text with page markers; no scanned-page OCR. |
| DOCX | Paragraphs and table cells. |
| TXT, Markdown | UTF-8 text with replacement for invalid characters. |
| CSV | Non-empty values labeled with column names. |
| XLSX | Values grouped by sheet; formulas use cached values. |
| PPTX | Text-bearing shapes grouped by slide. |

The document API does not validate extension or size before queueing. Unsupported files or empty extracted text fail in the worker. API and worker must share `backend/temp_files/` because jobs receive local paths.

#### Asking and editing questions

```text
Question -> verify chat ownership -> save user message
  -> normalize and decide whether retrieval is needed
     |-- direct reply -> save and return reply
     `-- split into subquestions and choose strategies
          -> embed subquestions
          -> semantic / SQL / hybrid search
          -> optionally find a similar earlier question
          -> generate and stream answer -> save completed assistant reply
```

- **Semantic:** compare meaning using cosine distance; retrieve five nearest knowledge records.
- **SQL:** use a validated structured plan to filter or calculate over fact metadata. Supports lists, counts, sums, averages, minimums, maximums, and grouping.
- **Hybrid:** find semantic candidates first, then apply SQL filters/calculations to those candidates.

Normalization normally supplies strategies. Invalid strategies trigger OpenAI classification, followed by TypeSafe/JEV if needed. Independent subquestion retrievals have a concurrency limit of four. SQL plans are checked against known fields, operations, and filters rather than executed as arbitrary generated SQL.

Editing replaces the message content and embeddings and regenerates an answer. Replies normally stream as plain text. New-message query flag `include_usage=true` collects the answer and returns JSON containing response, usage, and retrieved chunks instead. A backend fallback reply exists for pipeline failures, though error handling still has limitations.

#### Processing notifications

Alaya connects to `/ws`. Workers publish on Redis channel `websocket_messages`; the API's native async Redis subscriber forwards payloads to the user's socket. The ARQ Redis pool handles queued jobs separately.

```json
{"status":"completed","message":"Data stored successfully"}
```

Failures use status `Failed`. Notifications are transient and are not replayed after reconnecting. The API tracks one socket per user in process memory. Browser origins allow `localhost` and `127.0.0.1` on ports 3000/3001; other supplied origins are rejected. Universe does not subscribe to this channel.

### All endpoints

These are all application routes declared in the current code. HTTP routes start with `/api`; `/ws` is separate. All application routes require authentication except registration and login. Protected routes enforce ownership or match the path user ID to the authenticated user.

#### Users

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/user/register` | Register with name, username, and password; public. |
| POST | `/api/user/login` | Verify credentials, set cookies, return profile; public. |
| GET | `/api/user/get_user/{user_id}` | Read own profile. |
| PUT | `/api/user/update_user/{user_id}` | Update name or username. |
| DELETE | `/api/user/delete_user/{user_id}` | Delete own account and clear cookies. |
| PUT | `/api/user/logout/{user_id}` | Clear stored refresh token and cookies. |

#### Chats

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/chat/create_chat` | Create an owned chat. |
| GET | `/api/chat/get_chats/{user_id}` | List own chats. |
| GET | `/api/chat/get_chat/{chat_id}` | Read one owned chat. |
| PUT | `/api/chat/update_chat/{chat_id}` | Rename a chat or generate a title from its first message. |
| DELETE | `/api/chat/delete_chat/{chat_id}` | Delete a chat and its messages. |

#### Messages and ingestion

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/messages/new_messages/{chat_id}` | Save question and return answer; optional `include_usage` query flag. |
| GET | `/api/messages/get_messages/{chat_id}` | List messages in creation order. |
| PUT | `/api/messages/update_message/{chat_id}/{message_id}` | Edit message, replace embeddings, regenerate answer. |
| DELETE | `/api/messages/delete_message/{message_id}` | Delete message and its embeddings. |
| POST | `/api/messages/feed_knowledge` | Queue text; `text_content` and optional `tag` are query parameters. |
| POST | `/api/messages/image_upload` | Queue image processing; multipart field `file`. |
| POST | `/api/messages/file_upload` | Queue document processing; multipart field `file`; HTTP 201 on acceptance. |

#### Uploads and Universe

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/uploaded_data/get_uploads/{user_id}` | List saved uploads, newest first. |
| DELETE | `/api/uploaded_data/delete_upload/{upload_id}` | Delete upload and linked indexed knowledge through ORM cascades. |
| GET | `/api/universe/token` | Issue access token for the standalone client. |
| GET | `/api/universe/uploads` | Read all owned uploads in ID order, including unprocessed records. |
| WebSocket | `/ws` | Receive processing notifications; cookie, bearer header, or `token` query authentication. |

Upload deletion cascades through linked knowledge to embeddings and coordinates. Legacy knowledge without upload lineage is not linked to that deletion. This route does not explicitly delete the original Cloudinary asset.

FastAPI also supplies public `GET /docs`, `/redoc`, `/openapi.json`, and `/docs/oauth2-redirect`. See [Swagger UI](http://localhost:8000/docs) for request/response schemas. There are no active Universe nodes, chunk-detail, or recompute routes.

### Data model

| Model | Stored information |
| --- | --- |
| `User` | Profile, Argon2 password hash, refresh token, ownership relationships. |
| `Chat` | Title, owner, creation and update times. |
| `Message` | User/assistant content, chat, owner, sender, timestamp. |
| `UploadedData` | Original text or Cloudinary URL, type (`text`, `img`, `docs`), tag, owner, timestamp. Feeds upload history and live Universe stars. |
| `Knowledge` | Normalized fact, image-derived text, or document chunk; JSONB metadata, type, owner, source upload, chunk index, optional page number. |
| `Embedding` | A 1,536-dimensional vector linked to a message or knowledge record, plus embedded text. |
| `KnowledgeCoordinate` | One persisted 3D position and cluster per knowledge chunk for the separate projection pipeline. |

Models live in [app/db/model](backend/app/db/model). Alembic owns schema changes.

### Setup and configuration

#### Prerequisites and environment

Install Python compatible with the pinned dependencies, Node.js/npm compatible with the frontend packages, PostgreSQL with pgvector, and Redis. The backend Docker image uses Python 3.12. OpenAI, TypeSafe, and Cloudinary credentials are required.

Create `backend/.env`; the settings loader resolves this path from the backend directory:

```dotenv
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/alaya
SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=10080
REFRESH_TOKEN_EXPIRE_DAYS=30
OPENAI_API_KEY=your-openai-api-key
MODEL=your-openai-chat-model
TYPESAFE_API_KEY=your-typesafe-api-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
REDIS_HOST=localhost
REDIS_PORT=6379
XAI_API_KEY=
ALAYA_ACCESS_TOKEN=
```

Database URL, secret key, OpenAI key, `MODEL`, TypeSafe key, and all three Cloudinary fields are required. `ALAYA_ACCESS_TOKEN` is also a required string in the current settings schema; an empty value satisfies that field for normal startup. `XAI_API_KEY` is optional. Keep credentials out of Git and restart backend processes after changing settings.

#### Docker Compose

The checked-in [Compose file](docker-compose.yml) currently sets `x-backend.env_file` to `./backend/.gitignore`. **Change that path to `./backend/.env` before running Compose.** Application settings belong in `.env`.

From the repository root:

```sh
docker compose up --build -d
docker compose ps -a
docker compose logs -f backend worker
```

Compose starts PostgreSQL/pgvector, Redis, a one-shot migration, API, worker, Next.js, and Universe served by Nginx. API/worker wait for migrations and Redis; interfaces wait for the API health check. Stop local servers using ports 3000, 5173, and 8000 first.

PostgreSQL and Redis stay on the internal network. Named volumes retain database/queue data and share `/app/temp_files` between API and worker. Compose overrides `DATABASE_URL` to use its own database; it does not copy host/remote records. Optional `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` come from the root `.env` or shell, defaulting to `postgres`, `postgres`, and `alaya`. Credentials interpolated into the URL must be URL-safe.

Open [Alaya](http://localhost:3000), [Memory Universe](http://localhost:5173), and [API docs](http://localhost:8000/docs). `docker compose down` stops services while retaining named volumes. `NEXT_PUBLIC_MEMORY_UNIVERSE_URL` can override the Universe link at build time; it must be reachable by the browser.

#### Local backend

From the repository root:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

On macOS/Linux, use `python3 -m venv .venv` and `source .venv/bin/activate`. Create the database, enable pgvector, and migrate from `backend/`:

```sh
createdb alaya
psql alaya -c 'CREATE EXTENSION IF NOT EXISTS vector;'
alembic upgrade head
```

Start Redis through your service manager or Docker:

```sh
docker run --name alaya-redis --rm -p 6379:6379 redis:7
```

In two separate terminals with the Python environment activated and working directory `backend/`:

```sh
uvicorn app.main:app --reload --port 8000
```

```sh
arq app.core_tasks.arq_worker.worker.WorkerSettings
```

Keep API and worker on the same filesystem, or share their temporary document directory. Start the interfaces using sections 3 and 4.

### Checks and current limits

Run `python -m compileall app alembic` from `backend/` for syntax validation. Scripts in `app/test/` evaluate responses using real services; they are not an isolated regression suite. There is no `backend/tests/` directory in this checkout.

For schema changes, run `alembic revision --autogenerate -m "describe the schema change"`, inspect the revision, then run `alembic upgrade head`.

- Usernames have no database-level uniqueness constraint; refresh-token rotation is not implemented.
- The message request's supplied user ID does not determine ownership; the access token does.
- Documents have no API size limit or pre-queue extension check, no scanned-PDF OCR, and request embeddings for the whole chunk list. Large jobs may exceed worker limits.
- Source records are committed before queueing; failures can leave visible uploads without indexed knowledge. There is no durable per-upload job-status record.
- Abrupt termination can leave temporary files behind. Pub/sub notifications and socket state are not durable.
- Login cookies use `secure=False` for local HTTP. HTTP CORS allows local ports 3000, 3001, and 5173; WebSockets allow 3000 and 3001. Deployment requires HTTPS, secure cookies, and appropriate origins.

## 3. Frontend

### Pages and features

The Next.js application in `frontend/` is the main interface for accounts, conversations, and managing source material.

| Page | Route | Features |
| --- | --- | --- |
| Landing | `/` | Product introduction, workflow examples, FAQ, sign-in/sign-up links. |
| Authentication | `/auth?mode=signin` or `/auth?mode=signup` | Sign in or register with name, username, and password. `/login` and `/signup` redirect here. |
| Workspace | `/app` | Conversations, message sending/editing/deletion, knowledge uploads, Memory Universe button. |
| Profile | `/profile` | Name/username editing, theme control, logout, account-deletion confirmation. |

The workspace sidebar supports conversation search, user-scoped pinned chats, rename/delete actions, resizing, and mobile navigation. Chat shows thinking/streaming states. The knowledge manager accepts documents, images, and tagged text, with drafts, previews, search, type filters, and deletion confirmations. Shared theme controls and dialogs support the surrounding interface.

### Technologies and structure

| Technology | Use |
| --- | --- |
| Next.js 16.4 App Router | Routes, layouts, API rewrites, redirects, standalone production server. |
| React 19.3 | Components, auth context, hooks, external-store subscriptions. |
| Tailwind CSS 4, global CSS | Layout, light/dark themes, responsive styling, motion. |
| Lucide React | Interface icons. |
| Fetch, Streams, AbortController, WebSocket | Authenticated requests, progressive answers, cancellation, processing notifications. |
| localStorage | Cached display profile and UI preferences, including user-scoped pins; not passwords or auth tokens. |

```text
frontend/
  app/                       Landing, auth, workspace, profile, layout, global CSS
  components/
    app/                     Shell, sidebar, chat, knowledge manager, notifications
    auth/                    Authentication forms and background
    profile/                 Account-deletion confirmation
    landing/                 Hero, workflow demonstrations, FAQ, calls to action
    layout/                  Public navigation and footer
    ui/                      Theme controls, avatar, wordmark
  lib/
    api.js                   Shared HTTP, uploads, streamed send/edit decoder
    auth-context.js          Login, registration, logout, profile actions
    user-store.js            Cached display-profile subscription
    chat-data.js             Chat/message normalization
    knowledge-data.js        Upload normalization, validation, filtering
    use-knowledge-base.js    Upload drafts, submissions, refresh, deletion
    knowledge-presentation.js Date and badge presentation helpers
    open-universe.js         New-tab authentication handoff
    use-dialog.js            Dialog focus and keyboard behavior
    use-local-storage.js     UI preferences
```

### How frontend flows work

**Authentication:** forms call `lib/api.js` with `credentials: "include"`. The backend sets HTTP-only cookies; only a display profile is cached locally. The workspace requires sign-in, while the API validates requests and enforces ownership.

**Conversations:** the workspace loads saved chats and creates a conversation when **New chat** is chosen. Selecting a chat loads messages. Sending/editing uses one streaming decoder to append text as it arrives. After completion, messages reload to reconcile saved content and server IDs. Requests are cancelled when their view is left; failures show errors. The frontend itself does not generate replacement assistant replies.

**Knowledge uploads:** the manager validates files, submits multipart data (or text/tag as query parameters), and reports queue acceptance. Saved uploads reload when the manager mounts and after submission. Worker completion/failure appears through WebSocket notifications. Search/type filters operate locally over loaded uploads. Confirmed deletion removes the server upload and linked knowledge before updating the list.

**Memory Universe handoff:** the button reserves a tab, requests a fresh token from `/api/universe/token`, and navigates to the configured Universe URL with `?token=...`. Authentication failures close the reserved tab and show an error. Popup blocking must allow the new tab. Universe performs its own REST reads after opening.

### Run and configure

Start the backend on port 8000, then run from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open [Alaya](http://localhost:3000). Defaults work without a frontend environment file. Optional overrides go in `frontend/.env.local`; see [.env.example](frontend/.env.example).

| Variable | Default / purpose |
| --- | --- |
| `BACKEND_URL` | `http://localhost:8000`; Next.js `/api` proxy target. |
| `NEXT_PUBLIC_API_URL` | Empty; use same-origin API proxy. Set for a separate API origin. |
| `NEXT_PUBLIC_WS_URL` | Optional full socket URL. Defaults to browser hostname on port 8000 at `/ws?client=app`, with a token when available. |
| `NEXT_PUBLIC_MEMORY_UNIVERSE_URL` | `http://localhost:5173`; Universe button destination. |
| `NEXT_DIST_DIR` | `.next`; optional dedicated build directory. |

Use `localhost` consistently; `127.0.0.1` is a different cookie hostname. Custom origins also need backend CORS/WebSocket configuration. Public settings are exposed to browser code and should contain no secrets.

### Checks and production build

Run `npm run lint` and `npm run build` from `frontend/`. Use `npm start` for the production server; Docker uses standalone output. The `npm test` script targets absent `tests/*.test.js` files and is not currently a working suite.

Manually check registration/login, chat creation/reload, streamed sends/edits, uploads and worker notifications, deletion, profile actions, and the Universe button. Backend authentication/ingestion limitations apply to this interface too.

## 4. Memory Universe

### Purpose and technologies

Memory Universe is the standalone 3D browser in `memory-universe/frontend/`. Saved uploads appear as stars that users can explore, inspect, and open as original documents or images. It shares Alaya's accounts, API, and database; it has no separate backend.

| Technology | Use |
| --- | --- |
| Vite 6, React 19 | Development server, static build, interactive panels. |
| Three.js, React Three Fiber | WebGL scene, stars, connections, dust, coordinate grid. |
| Drei | Orbit controls and supporting scene utilities. |
| React Three Postprocessing, postprocessing | Bloom and scene effects. |
| Tailwind CSS 4, Lucide React | Responsive overlays, styling, icons. |
| React external store and hooks | Separate snapshots, selection, filters, navigation, and loading. |
| Fetch, AbortController, sessionStorage | Authenticated REST reads, cancellation, per-tab token storage. |
| Nginx in Docker | Static hosting and API proxy. |

```text
memory-universe/frontend/
  src/
    App.jsx                    Connect data/detail hooks to the view
    UniverseView.jsx           Selection, hover, search, layout, dialogs
    api/                       HTTP client and upload endpoint adapter
    hooks/                     Loading, local details, reduced motion
    store/universeStore.js     Upload-to-star mapping and display state
    components/canvas/         Stars, connections, dust, grid, camera, effects
    components/navigation/     Header, search, facet controls
    components/universe/       Hover, details, demo/source/error panels
    components/ui/             Display primitives
    data/                      Demo fixtures and local detail/source adapters
    utils/                     Search, filters, proximity, colors, source links
    styles/                    Global styling and font registration
  public/fonts/                Local Inter font and license
  vite.config.js               Development server and proxy
  nginx.conf                   Container static hosting and API proxy
```

### Live data and authentication flow

```text
Alaya sign-in -> Universe button -> GET /api/universe/token
  -> new tab with token -> token saved in tab sessionStorage
  -> GET /api/universe/uploads (no HTTP caching)
  -> useUniverseData -> setUploadedData -> display store -> 3D view
```

The API client includes cookies and a bearer token when available. It reads uploads on entry, tab focus, and **Refresh**. Superseded requests are aborted so stale results cannot overwrite newer state. Universe does not open a WebSocket or receive push updates.

Each `UploadedData` record becomes **one star**, even before processing completes. Records contain ID, type, tag, source text/URL, owner, and creation time. The store derives titles, previews, sectors, coordinates, and source details. Details resolve locally from the loaded snapshot; upload IDs are not sent to a knowledge-chunk endpoint.

### Stars, search, and controls

| Feature | Behavior |
| --- | --- |
| Colors | Documents red, images blue, text yellow; hover/selection override colors temporarily. |
| Navigation | Orbit, pan, zoom; search and nearby-item actions move the camera to stars. **Reset View** restores the overview. |
| Hover/selection | Preview on hover; selection opens content, metadata, and source actions in a drawer. |
| Search | Local scored text search across titles, previews, source names, types, and sectors. |
| Filters | Source, sector, and knowledge type. Live sectors are Documents, Images, and Text. |
| Nearby items | Geometric distance with a preference for the same sector; badges report display units. |
| Appearance | Toggle grid and bloom; camera movement respects reduced-motion preferences. Inter is hosted locally. |
| Sources | Open real upload URLs; sample sources have local preview data. |

Live positions use a deterministic geometric layout derived from record order, total count, and IDs. Positions can shift when the collection changes. **Proximity and connection lines do not measure semantic similarity in this view.** Search uses upload display fields rather than querying extracted document chunks.

### Empty accounts, demo, and errors

A successful authenticated response with zero uploads offers the sample universe and introduction. The demo has **84 sample stars across three sectors**, local details/document previews, and an amber **Demo** badge. It writes no samples to the backend.

- **Explore Universe** rechecks the backend; real uploads take priority over the demo.
- **Refresh** replaces sample data whenever real uploads exist.
- **Exit Demo** clears demo state and reloads the live account, which may show an empty state.
- Authentication, connection, and invalid-response errors show errors and never authorize demo mode.

### Separate knowledge projection

The worker also attempts `project_user_knowledge` after ingestion. It uses deterministic fallback coordinates for fewer than five knowledge records, or UMAP and KMeans for larger collections, and saves one `KnowledgeCoordinate` per knowledge chunk.

The current upload-based client computes its own positions and does not read `knowledge_coordinates` or raw vectors. Projection failure does not prevent a saved upload becoming a star. Legacy nodes, chunk-detail, and recompute endpoints have been removed; current Universe routes are listed in section 2.

### Run and configure

Start the shared backend and main frontend, then run from the repository root:

```sh
cd memory-universe/frontend
npm ci
npm run dev
```

Sign in at [Alaya](http://localhost:3000) and click **Memory Universe** to open [the 3D client](http://localhost:5173). Keep hostnames consistent. Defaults need no environment file; optional settings go in `memory-universe/frontend/.env.local`. See [.env.example](memory-universe/frontend/.env.example).

| Variable | Default / purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Empty; use same-origin `/api` proxy. |
| `BACKEND_URL` | `http://localhost:8000`; Vite development proxy target. |
| `VITE_PORT` | `5173`; development port. |
| `VITE_ALAYA_URL` | `http://localhost:3000`; link back to Alaya. |

Run `npm run build` to produce `dist/`. Serve it with `/api` routed to Alaya, as in the Nginx container, or set `VITE_API_BASE_URL` at build time. `npm run preview` previews static assets and still needs API routing or a reachable API base. `VITE_*` values are public build-time settings.

### Checks and limitations

Run `npm run build` from `memory-universe/frontend/`. The `npm test` and `npm run benchmark` scripts target missing `tests/` and `benchmarks/benchmark.js` files in this checkout and currently provide no validation.

Manually verify that one saved upload produces one star, an empty authenticated account offers the demo, failures show errors, details open the correct source, filters/search work, and refresh/focus loads changed uploads. Showing saved uploads needs the API; indexing also needs the worker.

The client loads the full upload list without pagination and refreshes on entry, focus, or manual action. Coordinates, nearby suggestions, and search are display features; indexed knowledge and semantic retrieval remain backend responsibilities.
