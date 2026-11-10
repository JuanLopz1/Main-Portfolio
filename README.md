# Juan López · Portfolio

Static portfolio for [juanlopez.ca](https://juanlopez.ca). The build generates HTML and ships self-hosted fonts, CSS, screenshots, videos, and browser demos. Node 22 or later is required. The AMT browser demo uses the pinned Pyodide runtime. There are no environment variables.

## Run locally

```sh
npm ci
npm test
npm run build
npm start
```

Open `http://127.0.0.1:4173/`. The build regenerates `dist/`. Run it again after editing content or assets. The local server mirrors the site's security headers.

## Maintain the portfolio

- Update project summaries, credit, stack, status, and verified demo links in [`content/projects.mjs`](content/projects.mjs).
- Edit the page templates in [`scripts/templates.mjs`](scripts/templates.mjs) and styles in [`public/assets/site.css`](public/assets/site.css).
- Save approved screenshots in `public/assets/` as optimized WebP files. Set their real dimensions and useful alt text in the project metadata. Files under `public/` are deployed as-is.
- Set `demo` for a verified interactive demo or live site. Set `media` for a playable MP4 with a WebP poster, dimensions, and a caption that describes the actions shown.
- The share card lives at `public/assets/share.jpg`. Keep it at 1200 × 630 pixels if replacing it. The canonical and sitemap URLs come from the site metadata.

The hero screenshot shows the Address Migration Toolkit running the supplied Python parser and review rules on generated records. The Juan Bot screenshot is from the public chat's idle state. The CoTas screenshots show an isolated build populated with fictional records and sample artwork. The Delivery Cat video shows native gameplay with replacement sprite art in the recording. The playable edition uses the original C# game rules through WebAssembly. The ChooseAI video shows the Swing desktop interface with its bundled sample catalog. Client database files, accounts, and unpublished client media belong outside this repository.

## Address Migration Toolkit demo

Open `/demos/address-migration/`, load the sample or choose a synthetic CSV, run validation, and download the report. The original street parser and review rules run in a local Python worker. Use the format shown on the demo page. The input and output stay in tab memory. Reload or use Reset to clear the session. The demo accepts files up to 1 MB and 5,000 rows, detects duplicate IDs and addresses, and escapes spreadsheet formulas in report cells.

## Movement Unlimited scheduling demo

Open `/demos/movement-unlimited/` to book and cancel a session in a sample week. Try an occupied slot to see the scheduling conflict. Reset restores the sample schedule. This independent browser implementation uses fictional participants and keeps edits in tab memory.

## Publish

Push changes on a branch and check its Vercel preview in the existing `main-portfolio` project. The Git integration publishes `main` to `juanlopez.ca`. Confirm the source commit and Ready status, then test the public home, case studies, demo, and the résumé and bot links. Vercel builds with `npm run build` and serves `dist/`. The domain aliases are managed separately from source. A previous Ready deployment can be restored from the project dashboard.
