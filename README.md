# seeo Post Application

STEEP AI Post Composer and analytics UI for seeo.ai founder LinkedIn workflows.

## Setup

```bash
npm install
cp .env.example .env
# Add OPENAI_API_KEY from https://platform.openai.com/api-keys (ChatGPT/OpenAI billing account)
npm run dev -- --host 127.0.0.1 --port 5173
```

After editing `.env`, **restart** the dev server — Vite only reads env files at startup.

The app checks `/api/health` for `openai.configured` (the key never ships to the browser). Hover the header status badge if the key is missing or empty.

## OpenAI Visual Generator

Post Composer → **seeo Visual Generator** calls the [OpenAI Images API](https://platform.openai.com/docs/guides/images) via a **dev-only Vite proxy** so your API key never ships in the client bundle.

| Variable | Where | Purpose |
|----------|--------|---------|
| `OPENAI_API_KEY` | Server / `.env` | Required for image generation in dev |
| `OPENAI_IMAGE_MODEL` | Server / `.env` | Default `gpt-image-1` |
| `OPENAI_DRAFT_MODEL` | Server / `.env` | Default `gpt-5.5` for draft generate/improve (override e.g. `gpt-4.1` for lower cost) |
| `OPENAI_GROUNDED_IMAGE_MODEL` | Server / `.env` | Optional; defaults to draft model for image grounding |
| `VITE_IMAGE_API_BASE_URL` | Client | Production: origin of your proxy serving `POST /api/openai/images` |
| `VITE_DRAFT_API_BASE_URL` | Client | Production: origin serving `POST /api/generate/draft` |

**Production:** static `vite build` output has no proxy. Deploy a small serverless route (or API gateway) that forwards to `https://api.openai.com/v1/images/generations` with the same JSON body as `server/openaiImages.ts`, then set `VITE_IMAGE_API_BASE_URL`.

**Security:** Do not set `VITE_OPENAI_API_KEY`. Keys belong server-side only.

## Post draft improvement (autoresearch-inspired)

See [docs/AUTORESEARCH.md](./docs/AUTORESEARCH.md) — **not** the GPU submodule. In Post Composer: **Improve draft** runs a keep/discard loop using RL state (+ OpenAI when `OPENAI_API_KEY` is set).

LinkedIn analytics MVP: [docs/LINKEDIN_MONITORING.md](./docs/LINKEDIN_MONITORING.md).

## Grounded Context (Production)

Post Composer **Grounded Context & Files** uses [Convex](https://convex.dev) for real TXT/CSV uploads and paste-to-save documents (no simulated drops). See [docs/GROUNDED_CONTEXT.md](./docs/GROUNDED_CONTEXT.md).

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_CONVEX_URL` | Client (Vercel + `.env`) | Convex deployment URL from dashboard or `npx convex dev` |
| `CONVEX_DEPLOYMENT` | `.env.local` (auto) | Used by Convex CLI; not needed in Vercel frontend |

```bash
npx convex dev    # first-time: creates project, .env.local, deploys functions
npm run convex:deploy   # production backend
```

**Vercel:** set `VITE_CONVEX_URL` to your **production** Convex URL (Settings → Deployment URL). Keep `OPENAI_API_KEY` server-side as today.

**Convex dashboard:** no extra secrets required for grounded docs; optional `authorId` is reserved for future auth.

```bash
python3 scripts/autoresearch_generate.py \
  --topic "Forklift pedestrian safety" \
  --audience "warehouse operations leaders" \
  --author "Craig Marris"
```

## What to do now

Quick checklist: **git pull** → set `OPENAI_DRAFT_MODEL=gpt-5.5` in `.env` → `npm install` → `npm run test` → manual QA in Post Composer → **`vercel deploy --prod`** from `main` with `OPENAI_API_KEY` + `OPENAI_DRAFT_MODEL` on Vercel → hard refresh.

Full steps, manual draft QA loop, and `npm run test:draft`: **[TESTING.md](./TESTING.md)**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server + OpenAI image proxy |
| `npm run build` | Production build |
| `npm run test` | Vitest (full suite) |
| `npm run test:draft` | Draft prompts, models, and local template quality tests only |
| `npm run lint` | ESLint |
| `npm run convex:dev` | Convex dev deployment + codegen |
| `npm run convex:deploy` | Deploy Convex functions to production |
