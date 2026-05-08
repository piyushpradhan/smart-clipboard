# Recall — Landing Page

Marketing site for [Recall](../). Published at
<https://piyushpradhan.github.io/recall/> via GitHub Pages.

Built with [Astro](https://astro.build) — static, no client-side JS by
default.

## Develop

```bash
npm install
npm run dev      # http://localhost:4321/recall/
```

## Build

```bash
npm run build    # writes static site to dist/
npm run preview  # serve the built site
```

## Deploy

Pushes to `main` that touch `landing/**` trigger
[`.github/workflows/landing.yml`](../.github/workflows/landing.yml), which
builds and publishes to GitHub Pages automatically.

## Structure

- `src/layouts/Layout.astro` — base HTML, theme variables, fonts
- `src/components/` — Nav, Hero, Features, Showcase, Download, Footer
- `src/pages/index.astro` — composes the page
- `public/media/` — screenshots and the hero demo recording (kept in sync
  with the app's `public/recordings/` and `public/screenshots/`)
