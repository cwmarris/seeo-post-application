# seeo Post Application

STEEP AI Post Composer and analytics UI for seeo.ai founder LinkedIn workflows.

## Setup

```bash
npm install
cp .env.example .env
# Add OPENAI_API_KEY from https://platform.openai.com/api-keys (ChatGPT/OpenAI billing account)
npm run dev
```

## OpenAI Visual Generator

Post Composer → **seeo Visual Generator** calls the [OpenAI Images API](https://platform.openai.com/docs/guides/images) via a **dev-only Vite proxy** so your API key never ships in the client bundle.

| Variable | Where | Purpose |
|----------|--------|---------|
| `OPENAI_API_KEY` | Server / `.env` | Required for image generation in dev |
| `OPENAI_IMAGE_MODEL` | Server / `.env` | Default `gpt-image-1` |
| `VITE_IMAGE_API_BASE_URL` | Client | Production: origin of your proxy serving `POST /api/openai/images` |

**Production:** static `vite build` output has no proxy. Deploy a small serverless route (or API gateway) that forwards to `https://api.openai.com/v1/images/generations` with the same JSON body as `server/openaiImages.ts`, then set `VITE_IMAGE_API_BASE_URL`.

**Security:** Do not set `VITE_OPENAI_API_KEY`. Keys belong server-side only.

## Post draft generation (autoresearch)

See [docs/AUTORESEARCH.md](./docs/AUTORESEARCH.md). The Python stub is not connected to the React app yet.

```bash
python3 scripts/autoresearch_generate.py \
  --topic "Forklift pedestrian safety" \
  --audience "warehouse operations leaders" \
  --author "Craig Marris"
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server + OpenAI image proxy |
| `npm run build` | Production build |
| `npm run test` | Vitest |
| `npm run lint` | ESLint |
