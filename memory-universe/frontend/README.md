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

The original 84-star demo is available from the empty and error panels via **Explore Sample Demo Universe**. It includes local knowledge details and document previews and works without authentication or a running backend. **Exit Demo** returns to live data; **Refresh** checks for real memories.

`src/config.js` owns the link back to Alaya (`VITE_ALAYA_URL`). The original filters, cards, hover previews, and empty/error panels are preserved. The renderer owns its scene resources. Nearby knowledge is ranked by display coordinates and sector; its distance badge reports display units rather than a semantic match percentage.
