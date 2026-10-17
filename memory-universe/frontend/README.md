# Memory Universe frontend

React + Vite + React Three Fiber client. Run all npm commands from this directory.

See [the Memory Universe README](../README.md) for setup, architecture, data contracts, backend ownership, and checks.

- `npm ci`: install locked dependencies.
- `npm run dev`: start the development server at `http://localhost:5173`.
- `npm run build`: build to `dist/`.
- `npm run preview`: preview the production build.
- `npm run benchmark`: run the synthetic starfield performance benchmark.

Optional environment overrides are listed in [`.env.example`](.env.example). The WebSocket client connects to the backend's `/ws?client=universe` endpoint and treats upload messages as triggers for a REST refresh; initial loading does not depend on a successful socket connection. `VITE_WS_URL` optionally overrides the WebSocket URL.

The client reads `/api/universe/uploads` on entry and refresh. Every saved upload becomes a star, without waiting for embeddings or projection. The original 84-star demo is offered only after an authenticated query confirms there are no uploads. Authentication and network failures show errors instead of demo data. **Exit Demo** returns to live data; **Refresh** checks for real uploads.

`src/config.js` owns the link back to Alaya (`VITE_ALAYA_URL`). The interface includes search, hover previews, a detail drawer, demo document previews, and empty/error panels. The renderer owns its scene resources. Nearby records are ranked by display coordinates and sector; the distance badge reports display units rather than a semantic match percentage.

Inter is the global font, loaded from `public/fonts/InterVariable.woff2` through `src/styles/index.css` and preloaded in `index.html`. It is served locally with its license and requires no external font request.

The `npm test` script remains configured, but the current checkout has no `tests/` directory. Use the build and the manual checks in the parent README until regression tests are restored.
