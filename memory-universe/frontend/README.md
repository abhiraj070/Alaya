# Memory Universe frontend setup

For an explanation of Memory Universe and how it works, see the [parent README](../README.md).

## 1. Prepare the shared services

Install Node.js and npm compatible with the checked-in Vite package. Start:

- The [shared backend](../../backend/README.md) on port 8000, with its database and Redis available.
- The [Alaya frontend](../../frontend/README.md) on port 3000.

Run the backend worker when adding content that needs indexing. Displaying existing saved uploads does not require indexing to finish. No separate Universe backend or database is needed.

## 2. Install and start the client

From the repository root:

```sh
cd memory-universe/frontend
npm ci
npm run dev
```

Sign in at [Alaya](http://localhost:3000) and click **Memory Universe** to open the client at [localhost:5173](http://localhost:5173) with a fresh access token. Allow the new tab if your browser blocks it.

Use `localhost` consistently across services; `127.0.0.1` is a different cookie hostname. If the session expires, sign in again and reopen Universe through Alaya.

## 3. Optional configuration

Local defaults work without an environment file. To override them, create `memory-universe/frontend/.env.local` using [.env.example](.env.example):

```dotenv
VITE_API_BASE_URL=
BACKEND_URL=http://localhost:8000
VITE_PORT=5173
VITE_ALAYA_URL=http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Leave empty to use the same-origin `/api` proxy; set to a browser-reachable API origin when needed. |
| `BACKEND_URL` | Backend target for the Vite development proxy. |
| `VITE_PORT` | Development server port. |
| `VITE_ALAYA_URL` | Address used by the link back to Alaya. |

Restart the development server after changes. `VITE_*` values are exposed to the browser and must not contain secrets. If the Universe address changes, update `NEXT_PUBLIC_MEMORY_UNIVERSE_URL` in the main frontend. Custom browser origins also require the backend's HTTP CORS allowlist to be updated.

## 4. Build and preview

Run from `memory-universe/frontend/`:

```sh
npm run build
npm run preview
```

The build writes static files to `dist/`. Vite's development proxy is not part of the static build: production hosting must forward `/api` to Alaya, or you must set `VITE_API_BASE_URL` before building. The checked-in Nginx configuration provides that forwarding in the Compose stack. A local preview also needs API routing or a reachable API base configured at build time.

For the full container stack, follow the [root setup guide](../../README.md#setup-and-configuration), including its current Compose environment-file correction.

## 5. Verify the setup

Open Universe through a signed-in Alaya session. Confirm that saved uploads appear, **Refresh** works, and selecting a star shows its source details. An account with no uploads should offer the sample universe; a connection or authentication failure should show an error.

If loading fails, check that the backend is reachable and your token is current. `npm test` and `npm run benchmark` currently point to missing files in this checkout; use the build and manual checks above.
