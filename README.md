# Abir's Academy

A fast, maintainable static GCSE maths learning hub built with original HTML, CSS, JavaScript and SVG.

## Architecture

- **GitHub is the source of truth.** Every content or design update is committed and pushed there.
- **Cloudflare Pages hosts the website.** Connect the repository once; each push to `main` triggers an automatic production deployment.
- **Cloudflare R2 stores archives or large owned assets.** R2 is not required for the page shell and is intentionally not exposed to browser-side credentials.
- **Custom domain later.** Add the IONOS-bought hostname under Cloudflare Pages → Custom domains, then apply the DNS records Cloudflare provides.

## Local preview

No build step is required. Start any static HTTP server in the project directory and open its local URL. For example:

```sh
npx serve .
```

Opening `index.html` directly also works for most checks, but a local server better matches production behaviour.

## Cloudflare Pages settings

- Framework preset: `None`
- Build command: leave blank
- Build output directory: `/`
- Production branch: `main`
- Project name: `abirsacademy`

The `_headers` file adds baseline security headers in production.

## Updating content

The resource cards are defined in the `resources` array near the top of `app.js`. Add, edit or remove an object there, verify the page locally, then commit and push. Cloudflare Pages will redeploy from GitHub automatically.

## R2 archive contents

Upload a folder or zip containing this repository state. `source-references/links.json` records the public sources used without redistributing their copyrighted content. Never upload deployment tokens, access keys, `.env` files, or local Git credentials.

## Rights and attribution

The site interface, copy, CSS, JavaScript, and SVG favicon in this repository are original. External resources are linked, credited, and remain on their publishers' websites. See `THIRD_PARTY_NOTICES.md` and `source-references/README.md`.
