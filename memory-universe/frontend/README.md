# Alaya Memory Universe — Standalone 3D Frontend Application

Memory Universe is an interactive 3D celestial visualization of the knowledge stored inside **Alaya**, an AI-powered personal knowledge assistant.

Each star in the universe represents an actual knowledge chunk stored in PostgreSQL, positioned in 3D space using UMAP dimensionality reduction derived from 1,536-dimensional embeddings.

---

## Architecture & Separation

Memory Universe is built as an independent, standalone client living in `memory-universe/` alongside the existing `frontend/` (Next.js) and `backend/` (FastAPI) applications.

- **Frontend Isolation**: Does not share code, pages, or build steps with the Next.js frontend.
- **Backend Reuse**: Directly consumes the existing Alaya FastAPI backend via authenticated `/api/universe` REST endpoints.
- **Authentication**: Relies on browser-managed HTTP-only JWT cookies via `credentials: 'include'`. Does not access or store sensitive tokens in `localStorage`.
- **Dimensionality Reduction**: Server-side UMAP (`umap-learn`) executes in background ARQ workers; raw high-dimensional embedding vectors are never transmitted to the browser.

---

## Technology Stack

- **Framework**: React 19 (Functional components, hooks, `useSyncExternalStore`)
- **Build Tooling**: Vite 6 (ESM, ultra-fast HMR, dev proxy)
- **3D Graphics Engine**: Three.js, React Three Fiber (`@react-three/fiber`), `@react-three/drei`
- **Styling**: Tailwind CSS v4 with custom dark cosmic theme tokens
- **Icons**: Lucide React
- **API Communication**: Native `fetch` client configured with `credentials: 'include'` and structured `ApiError`

---

## Directory Structure

```text
memory-universe/
├── public/
│   └── favicon.svg                  # Cosmic celestial favicon
├── src/
│   ├── api/
│   │   ├── client.js                # Core HTTP client with credentials: 'include'
│   │   └── universeApi.js           # Centralized /api/universe endpoints
│   ├── components/
│   │   ├── canvas/
│   │   │   └── UniverseCanvasPlaceholder.jsx # 3D space placeholder & telemetry
│   │   ├── navigation/
│   │   │   └── HeaderHUD.jsx        # Floating cosmic header HUD
│   │   ├── universe/
│   │   │   ├── EmptyState.jsx       # State for empty knowledge base
│   │   │   ├── ErrorState.jsx       # Auth (401) and network failure states
│   │   │   └── StatusBanner.jsx     # Recompute & unprojected chunk alert
│   │   └── ui/
│   │       ├── Badge.jsx            # Micro-pills for metrics and categories
│   │       ├── Button.jsx           # Cosmic buttons with loading states
│   │       ├── Card.jsx             # Glassmorphic dark surface panels
│   │       └── Spinner.jsx          # Ambient rotating ring spinner
│   ├── hooks/
│   │   └── useUniverseData.js       # Hook connecting components to store
│   ├── store/
│   │   └── universeStore.js         # Observable state store
│   ├── styles/
│   │   └── index.css                # Tailwind CSS v4 theme & custom utilities
│   ├── App.jsx                      # Main application layout and state orchestration
│   └── main.jsx                     # Vite React entry point
├── .env.example                     # Environment configuration reference
├── index.html                       # HTML5 entry with dark theme
├── package.json                     # Standalone dependencies and scripts
└── vite.config.js                   # Vite dev server and proxy configuration
```

---

## Environment Variables

Configure environment variables in `.env` (copied from `.env.example`):

| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `""` (empty) | Base URL for FastAPI backend. When left empty, Vite dev server proxies `/api` to `http://localhost:8000`. |
| `VITE_PORT` | `5173` | Vite development server port. |
| `VITE_WS_URL` | `ws://localhost:8000/ws` | WebSocket URL for background task notifications. |

---

## Development Scripts

Run the following commands inside `c:\Code\Projects\Alaya\memory-universe`:

```bash
# Start local development server (http://localhost:5173)
npm run dev

# Build production bundle to dist/
npm run build

# Preview production build locally
npm run preview
```

---

## API Endpoints Consumed

All endpoints require an authenticated user session (`VerifyJWT`):

1. **`GET /api/universe/nodes`**:
   - Fetches 3D coordinates `(x, y, z)`, titles, preview snippets, cluster IDs, and source metadata.
   - Raw embedding vectors are omitted.
2. **`GET /api/universe/chunk/{id}`**:
   - Fetches full chunk text, JSONB metadata, chunk position, and parent Cloudinary document details.
3. **`POST /api/universe/recompute`**:
   - Triggers an asynchronous ARQ worker recalculation of UMAP coordinates.
