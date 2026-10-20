# Frontend setup

Next.js frontend for Alaya. For pages, features, and data flows, see the [root frontend guide](../README.md#3-frontend).

## 1. Install and run

Install Node.js/npm compatible with the checked-in Next.js version. Start the [backend](../backend/README.md) on port 8000; its worker and Redis are needed for upload indexing.

From the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open [Alaya](http://localhost:3000), then register or sign in. Use `localhost` consistently across services; mixing it with `127.0.0.1` prevents cookies from sharing a hostname.

## 2. Optional configuration

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

To use **Memory Universe**, start its [Vite client](../memory-universe/README.md) on port 5173, sign in to Alaya, and click the workspace button. Allow the new tab if blocked.

## 3. Build and check

Run from `frontend/`:

```sh
npm run lint
npm run build
npm start
```

`npm start` serves the production build. Check sign-in, chat, uploads, and processing notifications against the running backend. `npm test` currently targets missing test files in this checkout.
