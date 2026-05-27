# Grounded Context (Production)

Post Composer **Grounded Context & Files** persists uploads and paste-to-save documents in Convex, scoped by an anonymous browser session id (`localStorage`).

## Architecture

```mermaid
flowchart LR
  UI[GroundedDataPanel] --> Hook[useGroundedDocuments]
  Hook --> Convex[(Convex DB)]
  Hook --> Merge[buildGroundedTextFromSelection]
  Merge --> Draft[generateDraftWithFallback]
  Merge --> Images[ImageGenerator prompt]
  Draft --> API[Vercel / Vite OpenAI routes]
```

| Layer | Responsibility |
|-------|----------------|
| `GroundedDataPanel` | Upload TXT/CSV, select docs, manual editor, delete |
| `useGroundedDocuments` | Session id, Convex queries/mutations, selection state |
| `buildGroundedTextFromSelection` | Merges selected docs + manual paste for prompts |
| `convex/groundedDocuments` | `listBySession`, `createFromText`, `remove` |
| OpenAI routes | Unchanged; receive merged `groundedText` in JSON body |

## Supported files

- **TXT / CSV** — read in the browser, stored as `textContent` (max 512KB, 200k chars server-side).
- **PDF** — not enabled in v1 (client rejects; add a Convex `"use node"` action later for extraction).

## Security

- No Convex deploy keys or OpenAI keys in the client.
- Documents are isolated by `sessionId` (random UUID in `localStorage`).
- Server validates mime type, size, and max 50 documents per session.

## Local setup

```bash
npm install
npx convex dev          # login, create project, writes .env.local with CONVEX_DEPLOYMENT
```

Add to `.env` (or `.env.local` — Vite loads both patterns; restart dev server after edits):

```bash
VITE_CONVEX_URL=https://<your-dev-deployment>.convex.cloud
```

Run app + Convex:

```bash
npm run convex:dev -- --start 'npm run dev -- --host 127.0.0.1 --port 5173'
# or two terminals: npx convex dev && npm run dev
```

## Production

1. `npx convex deploy` — production Convex deployment.
2. Convex dashboard → **Settings** → copy **Production** deployment URL → Vercel env `VITE_CONVEX_URL`.
3. Vercel: existing `OPENAI_API_KEY` and optional `VITE_*_API_BASE_URL` unchanged.

After schema changes, run `npx convex deploy` before shipping the frontend.
