# Memory Universe frontend

React + Vite + React Three Fiber client. Run all npm commands from this directory.

See [the Memory Universe README](../README.md) for setup, architecture, data contracts, backend ownership, and checks.

- `npm ci`: install locked dependencies.
- `npm run dev`: start the development server at `http://localhost:5173`.
- `npm test`: run contract, store, search, and source-link tests.
- `npm run build`: build to `dist/`.
- `npm run preview`: preview the production build.
- `npm run benchmark`: run the synthetic starfield performance benchmark.

Optional environment overrides are listed in [`.env.example`](.env.example). No websocket client is implemented here yet.

The client reads `/api/universe/uploads` on entry and refresh. Every saved upload becomes a star, without waiting for embeddings or projection. The original 84-star demo is offered only after an authenticated query confirms there are no uploads. Authentication and network failures show errors instead of demo data. **Exit Demo** returns to live data; **Refresh** checks for real uploads.

`src/config.js` owns the link back to Alaya (`VITE_ALAYA_URL`). The original filters, cards, hover previews, and empty/error panels are preserved. The renderer owns its scene resources. Nearby knowledge is ranked by display coordinates and sector; its distance badge reports display units rather than a semantic match percentage.
