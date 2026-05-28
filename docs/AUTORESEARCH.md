# Autoresearch vs seeo post improvement

## Two different things

| | **karpathy/autoresearch** (`vendor/autoresearch/`) | **seeo autoresearch loop** (this app) |
|---|---------------------------------------------------|----------------------------------------|
| Purpose | Autonomous GPU **LLM pretraining** research | Iterative **LinkedIn draft** improvement |
| Metric | `val_bpb` (validation bits per byte) — lower is better | Composite **quality score** 0–100 — higher is better |
| Keep/discard | Git reset if metric did not improve | Revert draft text if score did not improve |
| Runs on | CUDA GPU, `uv run train.py`, 5 min budget | Browser + optional OpenAI Chat API |
| Connected to UI? | **No** — reference submodule only | **Yes** — Post Composer + RL Optimizer |

Do **not** run `vendor/autoresearch/train.py` for LinkedIn copy. Submodule is included for the experiment-loop *pattern*, documented in `program.md` and `README.md`.

## What runs locally

### Always (no API key)

1. **Template draft generation** — `src/utils/postGenerator.ts` (founder voice segments + STEEP).
2. **Banned phrase filter** — `src/utils/rlEngine.ts` (`filterBannedPhrases`).
3. **Rating → RL weights** — star ratings and feedback tags update STEEP weights, hook style, emoji density.
4. **Autoresearch iteration (local path)** — `src/utils/autoresearchLoop.ts`:
   - `scoreDraft()` — banned hits, STEEP alignment, length, ratings prior.
   - `runImproveDraftIteration()` — local synonym pass, optional regen, empirical hook tweak.
   - Logs experiments to `localStorage` (`seeo_autoresearch_experiments`).
5. **Mock post performance** — `src/utils/postMetrics.ts` + Dashboard **Post performance** panel.
6. **CLI stub** — `scripts/autoresearch_generate.py` / `npm run generate:draft` (structured JSON only; not wired to React).

### With `OPENAI_API_KEY` in `.env` (dev)

- **Vite dev proxy** serves:
  - `POST /api/openai/images` → `server/openaiImages.ts`
  - `POST /api/generate/draft` → `server/openaiDraft.ts` (`mode: improve` | `generate`)
- Composer **Improve draft** prefers OpenAI when the proxy responds; falls back to local on error.

### Optional auto-improve (browser only)

- Checkbox: **Auto-improve every 30 min (tab open)** — `src/hooks/useAutoresearchAutoImprove.ts`
- This is **not** a server cron; closing the tab stops the loop.

## What is metaphorical adaptation

We borrow karpathy/autoresearch **process**, not **code**:

| autoresearch (GPU) | seeo (posts) |
|--------------------|--------------|
| Edit `train.py` hypothesis | Improve draft (LLM or local rules) |
| Run 5 min training | Score draft instantly |
| `grep val_bpb` | `scoreDraft()` |
| Log `results.tsv` | `localStorage` experiment log |
| `keep` → advance branch | `keep` → replace editor text |
| `discard` → `git reset` | `discard` → keep previous draft |
| Fixed time budget | Fixed iteration (one improve per click) |

## Submodule setup

```bash
git submodule update --init --recursive
# optional: git submodule update --remote --merge
```

Read `vendor/autoresearch/program.md` for the canonical loop (branch tag, `results.tsv`, never-stop policy). None of that runs inside the Vite app.

## Production (Vercel)

Static `vite build` output does not include the dev proxy.

1. Deploy API routes: `api/generate/draft.ts`, `api/openai/images.ts` (see `vercel.json`).
2. Set env: `OPENAI_API_KEY`, optional `OPENAI_DRAFT_MODEL` (default `gpt-4.1`), `OPENAI_IMAGE_MODEL`.
3. Client env (build time):
   - `VITE_DRAFT_API_BASE_URL` — origin for draft API (often same as app URL).
   - `VITE_IMAGE_API_BASE_URL` — origin for image API.

If unset in production, improve/generate uses **local-only** paths; images show configuration errors unless proxy URL is set.

## Test E2E locally

```bash
cp .env.example .env   # add OPENAI_API_KEY for LLM improve + images
npm install
npm run dev
```

1. **Composer** → Generate Draft → rate with stars / tags → **Train RL Model**.
2. **Improve draft** — note metric and keep/discard message; repeat and check **RL Optimizer → Autoresearch experiment log**.
3. Enable **Auto-improve every 30 min** only if you want long-running tab tests.
4. **Dashboard** → **Post performance** — mock impressions/engagement per published/scheduled post.
5. Optional: `npm run generate:draft -- --topic "Forklift safety" --audience "ops leaders" --author "Craig Marris"`

```bash
npm run test
npm run build
```

## Honest limits

- No connection to karpathy training runs or `val_bpb`.
- LinkedIn impressions/engagement are **simulated** until Marketing API integration (see `docs/LINKEDIN_MONITORING.md`).
- Image ratings are not yet a separate signal (post star ratings drive RL today).
