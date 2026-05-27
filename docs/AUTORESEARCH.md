# Autoresearch vs post generation

## What exists today

- **`scripts/autoresearch_generate.py`** — CLI stub that outputs structured JSON (title, hook, outline, draft markdown). It does **not** call [karpathy/autoresearch](https://github.com/karpathy/autoresearch).
- **`.tmp_autoresearch/`** — Local clone of karpathy/autoresearch for reference only. It is GPU pretraining research, not LinkedIn copy generation. Excluded from git.

## Vite app integration

**Not wired.** Post Composer still uses `src/utils/postGenerator.ts` (template segments per founder) and does not invoke the Python script or any LLM API for drafts.

## Recommended next steps

1. **Short term** — Add an npm script, e.g. `npm run generate:draft -- --topic "..." --author "Craig Marris"`, that shells to `python3 scripts/autoresearch_generate.py`.
2. **Medium term** — Replace the stub with a hosted LLM (OpenAI Responses/Chat Completions) using founder voice prompts for:
   - Craig Marris (`craig`)
   - Dean Marris (`dean`)
   - Bede Cammock-Elliott (`bede`)
3. **UI** — In `PostComposerView`, optional “Import draft from CLI/API” that loads JSON into the draft editor.

Do **not** embed karpathy/autoresearch in this repo unless you explicitly want GPU training experiments.
