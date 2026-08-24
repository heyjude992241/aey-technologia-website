# AEY Technologia Website

A cinematic, client-side 3D website built with React, Three.js, and Vite. The
project has no server, database, authentication, or ChatGPT Sites dependency.

## Local Development

Requirements:

- Node.js `>=22.13.0`
- pnpm `11.19.0`

```bash
pnpm install
pnpm dev
```

Open the localhost URL printed by Vite.

## Production Build

```bash
pnpm build
pnpm preview
```

The static production files are generated in `dist/`.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` enables Pages, builds, and
deploys the site whenever a commit is pushed to `main`. It automatically sets
Vite's base path to the repository name, so textures and bundled assets work
from a GitHub Pages project URL.
