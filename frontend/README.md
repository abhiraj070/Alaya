# Alaya frontend

Next.js client for authentication, chat, profile settings, and knowledge uploads. Memory Universe remains a separate [Vite frontend](../memory-universe/README.md); both use the same FastAPI backend and HTTP-only session cookies.

## Run

Start the main backend on port 8000, then run from this directory:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Local defaults work without a frontend environment file. Optional settings are in [`.env.example`](.env.example): `BACKEND_URL` controls the `/api` proxy, and `NEXT_PUBLIC_MEMORY_UNIVERSE_URL` controls links to the 3D client. Keep `localhost` or `127.0.0.1` consistent across apps so their cookies share a hostname.

`NEXT_PUBLIC_API_URL` can override the browser API base for a separate API origin. `NEXT_DIST_DIR` optionally isolates a concurrent development/build directory; keep it dedicated to Next.js.

## Structure

- `app/`: landing, authentication, workspace, and profile routes; global styles.
- `components/app/`: the original workspace presentation, shared sidebar chat list, chat, and knowledge forms/cards.
- `components/auth/`: sign-in/register forms and their background.
- `components/profile/`: the existing account-delete confirmation, retained with the current profile page.
- `components/ui/`: avatar, wordmark, and theme controls. Confirmation dialogs retain their original markup and share focus/keyboard behavior through `lib/use-dialog.js`.
- `components/landing/`, `components/layout/`: public site sections and navigation.
- `lib/api.js`: cookie-authenticated requests, multipart uploads, and one streaming decoder for sends/edits.
- `lib/auth-context.js`, `lib/user-store.js`: authentication actions and a cached display profile. Tokens and passwords are not persisted by the client.
- `lib/chat-data.js`, `lib/knowledge-data.js`: response normalization, filtering, and file validation.
- `lib/use-knowledge-base.js`: data loading, upload drafts, queue submission, and deletion behind the original knowledge base interface.
- `lib/knowledge-presentation.js`: the original date and badge styling helpers.
- `lib/use-local-storage.js`: optional UI preferences; pinned chats are scoped to the user.

The workspace requires sign-in and loads existing conversations. It creates a conversation only when the user chooses **New chat**. Failed requests show errors; they do not create guest conversations or fabricate assistant replies. Deletions update the UI only after the server succeeds.

Knowledge uploads report queue acceptance and display saved upload records. The list reloads when the panel opens and after a submission. Deleting an upload record removes its history entry; the current backend keeps its indexed knowledge. Registration sends the name, username, and password supported by the backend.

## Checks

```sh
npm test
npm run lint
npm run build
```

The Node tests cover the transport, streaming, response normalization, upload validation, and profile store without connecting to the backend. Live authorization and background processing belong to the backend.
