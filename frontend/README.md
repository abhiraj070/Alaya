# Frontend setup

Next.js frontend for Alaya. For pages, features, and data flows, see the [root frontend guide](../README.md#3-frontend).

## 1. First-time setup

Install Node.js/npm compatible with the checked-in packages. Follow the [backend setup guide](../backend/README.md) to install Python dependencies in `backend/venv`, configure `backend/.env`, and prepare PostgreSQL with pgvector and Redis.

From the repository root:

```sh
cd frontend
npm ci
npm --prefix ../memory-universe/frontend ci
```

## 2. Start development

Keep PostgreSQL and Redis running. Open two terminals from the repository root.

Terminal 1 — start the API:

```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Terminal 2 — start both interfaces and the worker:

```powershell
cd frontend
npm run dev
```

This starts Next.js at [localhost:3000](http://localhost:3000), Memory Universe at [localhost:5173](http://localhost:5173), and the ARQ worker through `concurrently`. Do not start another worker or Universe client separately. Ctrl+C in terminal 2 stops these three processes; the API and database services run separately.

The worker script uses `backend/venv/Scripts/python.exe` on Windows. If your environment has another name or you use macOS/Linux, update `dev:worker` in `package.json` to use its Python executable, keeping `cd ../backend` so temporary document paths resolve correctly.

For individual services, run from `frontend/`:

| Command | Starts |
| --- | --- |
| `npm run dev:frontend` | Next.js only |
| `npm run dev:universe` | Memory Universe only |
| `npm run dev:worker` | ARQ worker only |

Open [Alaya](http://localhost:3000), then register or sign in. Use `localhost` consistently across services; mixing it with `127.0.0.1` prevents cookies from sharing a hostname.

## 3. Optional configuration

Local defaults work without an environment file. To override them, create `frontend/.env.local` using [.env.example](.env.example):

```dotenv
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_MEMORY_UNIVERSE_URL=http://localhost:5173
```

- `BACKEND_URL`: target of the Next.js `/api` proxy.
- `NEXT_PUBLIC_API_URL`: leave empty to use that proxy; set only for a separate browser API origin.
- `NEXT_PUBLIC_MEMORY_UNIVERSE_URL`: browser address of the standalone 3D client.
- `NEXT_PUBLIC_WS_URL`: optional full WebSocket URL; otherwise notifications connect to the browser hostname on port 8000 at `/ws`.
- `NEXT_DIST_DIR`: optional build directory; defaults to `.next`.

Restart the dev server after changing configuration. Public values are included in browser code; keep secrets out of them. Custom browser origins also need backend CORS and WebSocket allowlist changes.

To use **Memory Universe**, sign in to Alaya and click the workspace button. Its [Vite client](../memory-universe/README.md) starts with `npm run dev`. Allow the new tab if blocked.

## 4. Build and check

Run from `frontend/`:

```sh
npm run lint
npm run build
npm start
```

`npm start` serves the production build. Check sign-in, chat, uploads, and processing notifications against the running backend. `npm test` currently targets missing test files in this checkout.
