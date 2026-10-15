# Memory Universe

The standalone 3D client for Alaya. Keep one backend, one database, and one coordinate model: Memory Universe uses the main `backend/` application. There is no separate Memory Universe backend, authentication service, or database setup.

## Run locally

1. Configure the main backend using the repository README. From `backend/`, install `requirements.txt`, run `alembic upgrade head`, and start `uvicorn app.main:app --reload --port 8000`. Start Redis and the existing ARQ worker as required by Alaya.
2. Log in through the Alaya frontend at `http://localhost:3000`. Use `localhost` consistently for the frontend, API, and universe so the session cookie is available.
3. From `memory-universe/frontend/`, run `npm ci` and `npm run dev`. Open `http://localhost:5173`.

No frontend environment file is required for local defaults. `.env.example` documents optional overrides. `/api` is proxied to the main backend. If an existing `.env` points `VITE_API_BASE_URL` at the old port 8001, remove that override or change it to the main backend.

`npm run build` creates `frontend/dist/`. In production, serve that build with `/api` routed to Alaya, or set `VITE_API_BASE_URL` at build time. `npm run preview` previews static assets only and requires a reachable API base URL for data.

## Sample demo

An empty universe offers the original demo introduction. Choose **Continue to Demo** to explore 84 sample stars across three sectors with search, filters, hover cards, knowledge details, related stars, and document page previews. **Explore Sample Demo Universe** is also available on the empty, sign-in, and connection-error panels, so the demo works without a running backend or an Alaya session.

The amber **DEMO** badge marks sample data. Demo details and document previews are local fixtures; **Realign** is disabled. **Refresh** checks the shared backend and switches to real knowledge when available, retaining the demo if the real universe is empty or unreachable. **Exit Demo** returns to the live universe and reloads it. No sample data is written to the backend.

## Structure

```text
memory-universe/frontend/src/
  App.jsx                    Connects the data hooks to the view
  UniverseView.jsx           Layout, selection, hover, search, and filters
  components/canvas/         Existing Three.js scene and camera controls
  components/navigation/     Search and filter controls
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
REST adapter -> data hook -> applyUniverseSnapshot(snapshot) -> display store -> 3D view
```

`applyUniverseSnapshot` accepts a complete snapshot shaped like `GET /api/universe/nodes`:

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

A future websocket adapter can call this same function. It replaces the displayed collection, preserves an existing selection, and clears a selection when its node disappears. It does not open a connection, merge deltas, or invent an event protocol. The current websocket implementation is unchanged. Detail loading remains a separate REST request; `UniverseView` receives its data through props and has no transport dependency.

## Existing REST endpoints

All routes use Alaya's existing authentication and scope data to the authenticated user.

- `GET /api/universe/nodes`: reads saved coordinates and summary metadata. It does not run projection or write to the database.
- `GET /api/universe/chunks/{knowledge_id}`: reads full chunk text and source lineage.
- `POST /api/universe/recompute`: calculates and commits coordinates before returning `status: "completed"`. The client then refreshes immediately. This is currently a synchronous operation handled in FastAPI's thread pool, not an ARQ job.

Use **Project** or **Realign** when knowledge has no coordinates. Small datasets use deterministic positions; larger datasets use UMAP and KMeans. Raw embeddings stay on the backend.

## Checks

From `memory-universe/frontend/`:

```sh
npm test
npm run build
npm run benchmark
```

From `backend/`, with its dependencies and settings available:

```sh
python -m unittest discover -s tests -p test_universe.py
python -m compileall -q app
```

The focused backend tests do not connect to PostgreSQL or Redis. The existing lineage integration tests require a configured database.
