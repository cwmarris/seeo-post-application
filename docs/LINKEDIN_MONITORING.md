# LinkedIn post performance monitoring

## Audit (current codebase)

**Before this work:** The Dashboard showed aggregate counters (RL index, avg rating, scheduled count, likes+comments from in-app mock posts). There was **no** per-post impressions, engagement rate trends, or LinkedIn API integration.

**Now (MVP):** Dashboard includes a **Post performance** panel (`PostPerformancePanel.tsx`) with per-post mock metrics stored in `localStorage` (`seeo_post_performance_metrics`). Structure is ready for real API fields.

## LinkedIn API reality

| Capability | Typical access | Notes |
|------------|----------------|-------|
| Post as member | OAuth 2.0 (Marketing / Community APIs) | App review, scoped permissions |
| Organic post analytics | LinkedIn Marketing API / partner programs | Often requires company page + approved app |
| Impressions, clicks, engagement | Analytics endpoints on share/ugc posts | Not available from a static SPA without backend token exchange |
| Personal profile analytics | Limited vs Company Page | seeo founders may post as individuals — check latest LinkedIn developer docs |

**OAuth + posting (staging):** The app now ships LinkedIn OAuth and `POST /api/linkedin/post` with **`LINKEDIN_POST_MODE`** defaulting to **`dry_run`** (no live posts). Tokens are stored per browser session in Convex (`linkedinConnections`). See [LINKEDIN_API.md](./LINKEDIN_API.md).

**Analytics:** Live Marketing API analytics sync is still **not** implemented. Production monitoring still needs scheduled fetch of impressions/engagement after posts are published with `LINKEDIN_POST_MODE=live`.

## MVP architecture (implemented)

```
Published/scheduled posts (React state)
        ↓
syncMetricsForPosts()  — deterministic mock from post id + status
        ↓
localStorage + Dashboard panel
```

Mock fields align with common analytics shapes:

- `impressions`, `reactions`, `comments`, `shares`, `clicks`, `engagementRate`, `trend`, `source: 'mock'`

## Target architecture (real API)

```mermaid
flowchart LR
  subgraph client [Vite SPA]
    Dashboard[Post performance panel]
    Composer[Post Composer]
  end
  subgraph backend [Vercel API + Convex]
    OAuth[GET /api/linkedin/auth + callback]
    Post[POST /api/linkedin/post]
    Sync[Cron: fetch analytics - TODO]
    DB[(linkedinConnections + metrics)]
  end
  LinkedIn[LinkedIn Marketing API]
  Composer --> Post
  Post --> LinkedIn
  OAuth --> LinkedIn
  Dashboard -->|GET /api/metrics - TODO| Sync
  Sync --> LinkedIn
```

### Implemented (posting)

1. Register LinkedIn Developer app — see [LINKEDIN_API.md](./LINKEDIN_API.md).
2. Routes: `GET /api/linkedin/auth`, `GET /api/linkedin/callback`, `GET /api/linkedin/status`, `POST /api/linkedin/post`.
3. Set `LINKEDIN_POST_MODE=live` only when ready to create real posts.

### Remaining (analytics sync)

1. Add `POST /api/linkedin/sync` (or cron) to pull share/ugc analytics.
2. Map API response → `PostPerformanceMetrics` (set `source: 'linkedin'`).
3. Replace `generateMockMetrics` when `source === 'linkedin'` exists for `postId`.
4. Link scheduled posts: match `post.id` to LinkedIn `shareUrn` after publish (`postUrn` returned from live post).

## Mapping autoresearch metrics → post RL

| GPU autoresearch | Post monitoring + RL |
|------------------|----------------------|
| `val_bpb` | `engagementRate` or composite `scoreDraft` |
| keep if improved | Boost STEEP weight / keep draft variant |
| discard | Revert draft; deprioritize hook style |
| `results.tsv` | Experiment log + metrics time series (future) |

Use **live** engagement to nudge weights only after API sync exists; until then, human star ratings in the Composer remain the ground truth.

## Test locally

1. Open Dashboard — confirm **Post performance** lists published/scheduled posts with mock numbers.
2. Publish a new post from Composer — refresh metrics (re-open tab or navigate away/back) to see a new row.
3. Click **Queue** on a scheduled row — navigates to Scheduler tab.
