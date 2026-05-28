# Testing — Post Composer & draft quality

## What to do now (deploy checklist)

1. **Sync code**
   ```bash
   git pull origin main
   npm install
   ```

2. **Local environment** — copy `.env.example` → `.env` and set:
   ```bash
   OPENAI_API_KEY=sk-...          # required for OpenAI drafts + images in dev
   OPENAI_DRAFT_MODEL=gpt-5.5     # was gpt-4o-mini — use gpt-5.5 for flagship draft/improve
   # Optional: OPENAI_IMAGE_MODEL, OPENAI_GROUNDED_IMAGE_MODEL
   VITE_CONVEX_URL=https://...    # grounded context (Convex dashboard)
   ```
   Restart the dev server after any `.env` change (`npm run dev` only reads env at startup).

3. **Run automated checks locally**
   ```bash
   npm test              # full suite (67+ tests)
   npm run test:draft    # draft prompts, models, local template quality only
   npm run lint
   npm run build
   ```

4. **Manual draft QA** (see loop below) on `http://127.0.0.1:5173` with header badge showing OpenAI configured.

5. **Production (Vercel)** — deploy from latest `main` (commit `8a3706a` or newer):
   ```bash
   git pull origin main
   vercel deploy --prod
   ```
   - **Vercel → Settings → Environment Variables** (Production): update then redeploy if you change them:
     | Variable | Notes |
     |----------|--------|
     | `OPENAI_API_KEY` | Server-only; never `VITE_` prefix |
     | `OPENAI_DRAFT_MODEL` | Set to `gpt-5.5` (replace legacy `gpt-4o-mini`) |
     | `VITE_CONVEX_URL` | Production Convex deployment URL |
   - Leave `VITE_DRAFT_API_BASE_URL` / `VITE_IMAGE_API_BASE_URL` **unset** on Vercel so the app uses same-origin `/api/generate/draft` and `/api/openai/images`.
   - After deploy: **hard refresh** the browser (Cmd+Shift+R) so the new JS bundle loads.

---

## Manual QA loop — prompt feedback & rerun

Use this when tuning copy quality without changing code:

1. Open **Post Composer**.
2. Set **Author**, **Tone**, and **STEEP** lenses.
3. In **Generation instructions**, add angle, facts, CTA, or constraints (e.g. “Mention Auckland pilot; CTA book a demo”).
4. Choose **Target length** (Short / Medium / Long) — this is sent to the API and embedded in the system + user prompts.
5. Click **Generate Draft** — uses OpenAI when `/api/health` reports `openai.configured`, otherwise local templates.
6. Edit the draft in the text area if needed.
7. Fill **Revision guidance** (shown after a draft exists) — e.g. “Sharpen hook, cut para 2, stronger CTA.”
8. **Improve draft** — uses revision guidance only (not generation instructions); keeps the revision only if the autoresearch score improves (see `docs/AUTORESEARCH.md`).
9. Optional: enable **Auto-improve** to run that loop when feedback tags change.
10. Rate the draft and aspect feedback — updates RL banned words / weights for future generations.

**How prompt feedback works in the UI**

- **Generation instructions** — initial **Generate Draft** and **Regenerate** only.
- **Revision guidance** — appears once a draft exists; sent only to **Improve draft** / auto-improve as `revisionGuidance` (prominent block in the improve user prompt).
- **Aspect feedback** tags from rating are included on improve when selected.
- **Target length** applies to both generate and improve paths.
- Each click is one API round-trip (no chat thread).

**Verify production after deploy**

- Hard refresh (Cmd+Shift+R); header badge should show OpenAI configured when `OPENAI_API_KEY` is set on Vercel.
- Sidebar footer: **AI Telemetry** reflects `/api/health`; **RL LEARNING INDEX** is mean STEEP weight from `seeo_rl_state`; experiment count from autoresearch log.

---

## Automated draft tests (no live OpenAI)

| Command | Scope |
|---------|--------|
| `npm run test:draft` | `server/openaiDraft.test.ts`, `server/openaiModels.test.ts`, `src/utils/draftQuality.test.ts`, `src/utils/postGenerator.test.ts` |
| `npm test` | Entire Vitest suite |

**What unit tests cover**

- Prompt injection: `generationInstructions` (generate), `revisionGuidance` (improve only), and `targetLength` in system/user messages.
- Mock `fetch` to OpenAI: request body includes instructions and length bands.
- Length bands: short (550–850), medium (850–1,200), long (1,200–1,600) in prompts.
- Banned phrases listed in system prompt + RL list; local output run through `filterBannedPhrases`.
- Craig posts: preferred hashtags present, no `#CraigMarris`; milestone structure when topic/template demands it.
- `draftQuality.ts` helpers for band parsing and phrase detection (usable for future client warnings).

**What tests do not do**

- Call the real OpenAI API (no cost, no flake).
- Guarantee OpenAI responses hit character counts (only prompts + local template structure).

---

## Local vs production behavior

| | Local dev (`npm run dev`) | Production (Vercel) |
|--|---------------------------|---------------------|
| Draft API | Vite middleware `POST /api/generate/draft` | Serverless `api/generate/draft.ts` |
| OpenAI key | `.env` → `OPENAI_API_KEY` | Vercel env (server) |
| Draft model | `OPENAI_DRAFT_MODEL` in `.env` | Same in Vercel Production |
| Client draft URL | Same origin (no `VITE_DRAFT_API_BASE_URL`) | Same origin on Vercel |
| Fallback | Local `postGenerator` if API fails or key missing | Same |
