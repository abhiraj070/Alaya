# Backend setup

Shared FastAPI backend for Alaya and Memory Universe. For architecture, flows, and endpoints, see the [root backend guide](../README.md#2-backend).

## 1. Install dependencies

You need Python compatible with `requirements.txt` (the Docker image uses Python 3.12), PostgreSQL with pgvector, Redis, and OpenAI, TypeSafe, and Cloudinary credentials.

From the repository root, using PowerShell:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

On macOS/Linux, create the environment with `python3 -m venv .venv` and activate it with `source .venv/bin/activate`.

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

Use two terminals, both in `backend/` with the virtual environment activated.

API:

```sh
uvicorn app.main:app --reload --port 8000
```

Worker:

```sh
arq app.core_tasks.arq_worker.worker.WorkerSettings
```

The worker is required for text, image, and document indexing. API and worker must share `temp_files/` because document jobs use local file paths. Restart both after changing `.env`.

Open [API docs](http://localhost:8000/docs), then start the [frontend](../frontend/README.md). Run `python -m compileall app alembic` for a syntax check. For running the full stack in containers, see the [root setup guide](../README.md#setup-and-configuration), including its current Compose environment-file correction.
