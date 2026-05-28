# seeo Post Application — 10-minute setup

Quick checklist for **Grounded Context (Convex)** + **Vercel production**. No secrets in this file.

## Environment variables

| Variable | Local | Vercel Production | Notes |
|----------|-------|-------------------|--------|
| `VITE_CONVEX_URL` | Yes (`.env` or `.env.local`) | **Required** | Convex **Deployment URL** (ends in `.convex.cloud` for cloud; local dev may use `http://127.0.0.1:3210`) |
| `CONVEX_DEPLOYMENT` | Auto in `.env.local` | No | CLI only; written by `npx convex dev` |
| `VITE_CONVEX_SITE_URL` | Auto in `.env.local` | Only if you add HTTP actions later | Not used by grounded docs today |
| `CONVEX_DEPLOY_KEY` | Optional (CI only) | Optional (CI only) | Only if you run `convex deploy` from GitHub Actions / Vercel build — not required for the React client |
| `OPENAI_API_KEY` | `.env` | **Required** (server) | Unchanged; never `VITE_` prefix |
| `OPENAI_IMAGE_MODEL` | Optional | Optional | Default in code: `gpt-image-2` |
| `OPENAI_DRAFT_MODEL` | Optional | Optional | Default: `gpt-5.5` (API slug; not the ChatGPT product label) |
| `OPENAI_GROUNDED_IMAGE_MODEL` | Optional | Optional | Defaults to `OPENAI_DRAFT_MODEL` |
| `VITE_IMAGE_API_BASE_URL` | Usually unset locally | Set if static host ≠ API origin | Production image proxy |
| `VITE_DRAFT_API_BASE_URL` | Usually unset locally | Set if static host ≠ API origin | Production draft API |

**Convex dashboard:** no extra secrets for grounded documents (session-scoped by browser UUID).

---

## Local (first time)

Run in order in your terminal:

```bash
cd /Users/craigmarris/seeo_Post_Application
npm install
cp .env.example .env
# Edit .env: OPENAI_API_KEY=... (required for draft/images)

npx convex login          # browser OAuth — links machine to Convex account
npx convex dev            # creates/links project, writes .env.local, deploys convex/
```

In a **second terminal** (or use `--start`):

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

After `convex dev`, ensure the app sees Convex:

- Copy `VITE_CONVEX_URL` from `.env.local` into `.env` **or** rely on Vite loading `.env.local`.
- Restart Vite after any env change.
- Post Composer → Grounded Context should show **Convex-backed** (not “Convex not configured”).

**Optional one-liner** (Convex watches backend + starts Vite):

```bash
npm run convex:dev -- --start 'npm run dev -- --host 127.0.0.1 --port 5173'
```

---

## Production Convex

```bash
npx convex login          # if not already
npx convex deploy         # or: npm run convex:deploy
```

1. Open [Convex dashboard](https://dashboard.convex.dev) → your project → **Settings**.
2. Copy the **Production** deployment URL (not dev).
3. Add to Vercel (below).

Redeploy Convex after `convex/schema.ts` or function changes **before** shipping frontend.

---

## Vercel (Production environment)

Project → **Settings** → **Environment Variables** → Production:

| Name | Value source |
|------|----------------|
| `VITE_CONVEX_URL` | Convex dashboard → Production deployment URL |
| `OPENAI_API_KEY` | OpenAI platform (server-only) |
| `VITE_IMAGE_API_BASE_URL` | Your Vercel app URL (if using `/api/openai/images`) |
| `VITE_DRAFT_API_BASE_URL` | Your Vercel app URL (if using `/api/generate/draft`) |

Do **not** add `CONVEX_DEPLOYMENT` or deploy keys unless you automate `convex deploy` in CI.

Redeploy the Vercel project after changing env vars.

### Git-connected deploys (recommended)

Link the Vercel project to GitHub (`cwmarris/seeo-post-application`, production branch **`main`**). Pushes to `main` then build and promote production automatically. If only manual or CLI deploys run, GitHub `main` can be ahead of what users see at `https://seeo-post-application.vercel.app`.

**Manual production deploy** (when Git is not hooked up or you need to force a fresh build):

```bash
git checkout main && git pull origin main
vercel deploy --prod --yes
```

**Dashboard:** Project → **Deployments** → **Create Deployment** → branch **`main`** → disable **Use existing Build Cache** → deploy.

---

**Important:** `VITE_*` variables are embedded at **build** time. Adding or changing `VITE_CONVEX_URL` in the Vercel UI does nothing until you trigger a new production deployment.

Do **not** set `VITE_CONVEX_URL` to `http://127.0.0.1:3210` on Vercel — that only works on your laptop with `npx convex dev`. Use your `https://….convex.cloud` production URL. If a production build ever contained a localhost URL, the app now ignores it and falls back to session-only uploads until you fix the env var and redeploy.

---

## Still seeing “Supports PDF, CSV, or TXT (Simulated)”?

That UI was removed in commit `07b1576` (May 2026). If production still shows **Quick Context Presets** and no **Upload file** button, Vercel is serving an **old static bundle** — not the wrong app.

1. Confirm GitHub `main` is at or past `057863c` (multi-format uploads: PDF, DOCX, images).
2. Redeploy production (Git push to `main`, `vercel deploy --prod --yes`, or dashboard **Create Deployment** on `main` with build cache off).
3. Set **`VITE_CONVEX_URL`** to your `https://….convex.cloud` URL before redeploying.
4. Hard-refresh the browser (Cmd+Shift+R). Grounded Context should show **Upload file** and supported types including **.docx** (not legacy “Quick Context Presets”).

Production bundle check: load `assets/index-*.js` from the live site and search the file — expect **`Upload file`**, **`.docx`**, **`grounded-image`**; do **not** expect **`Quick Context Presets`**.

---

## Verify

- [ ] `convex/` exists with `groundedDocuments.ts`, `schema.ts`
- [ ] `npx convex dev` runs without errors
- [ ] UI badge: **Convex-backed**
- [ ] Upload a small `.txt` → appears in list; refresh page → still there
- [ ] Production: same with `VITE_CONVEX_URL` set on Vercel

More detail: [docs/GROUNDED_CONTEXT.md](./docs/GROUNDED_CONTEXT.md), [README.md](./README.md#grounded-context-production).
