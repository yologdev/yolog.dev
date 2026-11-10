# yolog.dev

The website for [yolog](https://github.com/yologdev/yolog): versioned, portable state infrastructure for AI agents.

- `build.mjs`: builds the landing page into `dist/`. The page is one file of HTML with inline styles; its copy lives in this script.
- `public/`: static files copied as they are: the favicon, and the 30-second video with its poster frame.
- `marketing/`: the explainer videos' source (HTML compositions rendered to MP4).
- `wrangler.jsonc`: the site is served by Cloudflare Workers static assets at [yolog.dev](https://yolog.dev).
- `src/worker.js`: the only code that runs: it answers Range requests for `/media/*`, which Safari needs to play the video.
- `public/analytics.js`: PostHog page analytics. It runs only on yolog.dev, not on local previews.
- `.github/workflows/deploy.yml`: deploys on every push to `main`, once the repository has the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

```sh
npm ci
npm run preview   # build and serve locally
npm run deploy    # build and deploy to Cloudflare
```

The docs live with the code, in the yolog repository, and are served at docs.yolog.dev.
