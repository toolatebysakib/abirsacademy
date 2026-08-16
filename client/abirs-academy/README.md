# Abir's Academy

A fast GCSE maths learning hub built with HTML, CSS, JavaScript, Cloudflare Pages Functions and R2-hosted PDF resources.

## Architecture

- **GitHub is the source of truth.** Every content or design update is committed and pushed there.
- **Cloudflare Pages hosts the website.** Connect the repository once; each push to `main` triggers an automatic production deployment.
- **Cloudflare Pages Functions power search and PDF delivery.** The browser receives paginated catalogue metadata and an allow-listed, same-origin PDF stream.
- **Cloudflare R2 stores the PDF resources.** R2 URLs remain server-side; no R2 credentials are present in browser code.
- **Custom domain later.** Add the IONOS-bought hostname under Cloudflare Pages → Custom domains, then apply the DNS records Cloudflare provides.

## Local preview

No build step is required. Use Wrangler so the static pages and `/api` Pages Functions both run locally:

```sh
npx wrangler pages dev .
```

If Wrangler or Node.js is unavailable, use the included Deno development server:

```sh
deno run --allow-read --allow-net dev-server.ts
```

The preview is available at `http://localhost:8788` by default. A basic static server can preview the homepage, but the resource catalogue and PDF Studio require the Pages Functions runtime.

Run the dependency-free regression checks with Deno:

```sh
deno run --allow-read tests/project_test.ts
```

## Cloudflare Pages settings

- Framework preset: `None`
- Build command: leave blank
- Build output directory: `/`
- Production branch: `main`
- Project name: `abirsacademy`

The `_headers` file adds baseline security headers in production.

## Updating content

The homepage resource cards are defined in the `resources` array near the top of `app.js`. The complete resource catalogue is defined in `functions/api/data.js`. Add, edit or remove a catalogue object there, then verify search, worksheet and solution links locally.

`library-v8.js` renders the paginated library. `pdf-studio.js` renders PDF pages, stores annotations locally and exports personalised copies. PDF.js and pdf-lib are pinned under `vendor/`; update `THIRD_PARTY_NOTICES.md` whenever those builds change.

Do not add or publish third-party worksheets unless their licence or a direct permission expressly permits redistribution.

## R2 archive contents

`source-references/links.json` records public source provenance. Never upload deployment tokens, access keys, `.env` files, or local Git credentials.

## Rights and attribution

The site interface, copy, CSS, JavaScript, and SVG favicon in this repository are original. See `THIRD_PARTY_NOTICES.md` and `source-references/README.md` for dependency and source attribution.
