# Memory Universe

The standalone 3D client for Alaya. Keep one backend, one database, and one coordinate model: Memory Universe uses the main `backend/` application. There is no separate Memory Universe backend, authentication service, or database setup.

## Run locally

1. Configure the main backend using the repository README. From `backend/`, install `requirements.txt`, run `alembic upgrade head`, and start `uvicorn app.main:app --reload --port 8000`. Start Redis and the existing ARQ worker as required by Alaya.
2. From `memory-universe/frontend/`, run `npm ci` and `npm run dev` to start the 3D client at `http://localhost:5173`.
3. Start the Alaya frontend, sign in at `http://localhost:3000`, and click **Memory Universe**. The button requests a fresh token before opening a new tab. Use `localhost` consistently rather than mixing it with `127.0.0.1` for cookie-based sessions.

No frontend environment file is required for local defaults. `.env.example` documents optional overrides. `/api` is proxied to the main backend. If an existing `.env` points `VITE_API_BASE_URL` at the old port 8001, remove that override or change it to the main backend.

`npm run build` creates `frontend/dist/`. In production, serve that build with `/api` routed to Alaya, or set `VITE_API_BASE_URL` at build time. `npm run preview` previews static assets only and requires a reachable API base URL for data.

## Sample demo

An authenticated database query must confirm there are no uploads before sample data and the demo introduction appear. The demo contains 84 sample stars across three sectors, with local details and document previews. Choosing **Explore Universe** in the introduction rechecks the database, so an upload added while the introduction was open takes priority. Authentication and connection errors are shown as errors and never authorize demo mode.

The amber **Demo** badge marks sample data. **Refresh** checks the shared backend and replaces the demo whenever at least one upload exists. **Exit Demo** returns to the live universe and reloads it. No sample data is written to the backend.

## Structure

```text
memory-universe/frontend/src/
  App.jsx                    Connects the data hooks to the view
  UniverseView.jsx           Layout, selection, hover, search, and dialogs
  components/canvas/         Existing Three.js scene and camera controls
  components/navigation/     Header and search controls
  components/universe/       Hover, detail drawer, and load/error states
  components/ui/             Shared display primitives
  store/universeStore.js     Display snapshot, selection, filters, navigation
  hooks/                     REST request lifecycle and cancellation
  api/                       HTTP transport and universe endpoints
  data/                      Original demo fixtures and local detail/source adapter
  utils/                     Search, source links, and star appearance

backend/app/
  api/universe.py                         Authenticated universe REST routes
  schema/universe.py                      Response contracts
  db/model/universe.py                    KnowledgeCoordinate model
  core_tasks/projection/projection_service.py  Embeddings to display coordinates
```

`knowledge_coordinates` belongs to the main database and has one row per knowledge chunk. Knowledge and embeddings remain in `db/model/chat.py`; uploaded source records remain in `db/model/uploaded_data.py`. Moving the coordinate model does not change the schema or require a new migration. Alembic revision `6a82d2e030fe` already creates the table.

## Data flow and extension point

```text
GET /api/universe/uploads -> data hook -> setUploadedData(records) -> display store -> 3D view
```

Every click on Alaya's Memory Universe button requests a fresh access token and opens a new client, which reads the authenticated user's `uploaded_data` rows without HTTP caching. One upload produces one star, even before knowledge extraction, embeddings, or projection exist. Upload positions are deterministic display coordinates. Upload details use the upload's own source record; upload IDs are never passed to the knowledge chunk endpoint.

The store also retains `applyUniverseSnapshot`, accepting snapshots shaped like `GET /api/universe/nodes`, for projected knowledge consumers:

```js
applyUniverseSnapshot({
  nodes: [{
    id: 1, x: 0, y: 0, z: 0,
    title: 'A memory', preview: 'A short excerpt', knowledge_type: 'fact',
    cluster_id: 0, cluster_name: 'Sector 0',
    source_type: 'text', source_name: null, has_source: false,
    created_at: '2026-10-15T00:00:00Z',
  }],
  total_stars: 1,
  unprojected_count: 0,
});
```

Universe WebSocket upload messages invalidate the displayed data and trigger the same authenticated REST query. They do not write a second competing snapshot. Request cancellation prevents superseded reads from replacing newer results. `UniverseView` receives its data through props and has no transport dependency.

## Existing REST endpoints

All routes use Alaya's existing authentication and scope data to the authenticated user.

- `GET /api/universe/uploads`: reads every uploaded source for the authenticated user, including unprocessed uploads. This is the default universe's source of truth.
- `GET /api/universe/token`: issues the access token used when opening the standalone client.
- `GET /api/universe/nodes`: reads saved coordinates and summary metadata. It does not run projection or write to the database.
- `GET /api/universe/chunks/{knowledge_id}`: reads full chunk text and source lineage.
- `POST /api/universe/recompute`: calculates and commits coordinates before returning `status: "completed"`. The client then refreshes immediately. This is currently a synchronous operation handled in FastAPI's thread pool, not an ARQ job.

The projection endpoint is separate from the default upload view. It uses deterministic positions for small knowledge datasets and UMAP/KMeans for larger datasets. Raw embeddings stay on the backend. Running projection is not required to display uploaded records.

## Checks

From `memory-universe/frontend/`:

```sh
npm run build
npm run benchmark
```

From `backend/`:

```sh
python -m compileall -q app
```

The frontend's `npm test` script targets `tests/*.test.js`, but no test files are included in the current checkout; `backend/tests/` is also absent. For a manual check, verify one saved upload renders, an empty account loads the demo, and a failed request shows an error. The benchmark is synthetic and does not verify authentication or database access.
