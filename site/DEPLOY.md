# Deploying trust.bounded.tools

The Trust Center site is a Cloudflare static-assets Worker, a sibling of the
`bounded-tools-site` worker on the same account. The canonical ledger is the
Markdown at the repo root (`CLAIMS.md`, `SECURITY.md`); this `site/` directory is
only the public doorway at `trust.bounded.tools`.

## Build

```sh
cd site
node build.mjs          # assembles dist/ from public/  (zero deps)
```

## Deploy (needs Cloudflare credentials)

These steps require Cloudflare dashboard / API access that is **not** available in
the agent environment, so they are a manual hand-off:

```sh
cd site
npx wrangler deploy     # or `wrangler deploy` if installed globally
```

This publishes the `bounded-tools-trust` worker to account
`a2ca40f474fa65ed8f751a3efdf74c01` (the same account as `bounded.tools`).

## Bind the custom domain

In the Cloudflare dashboard (or via `wrangler`):

1. **Workers & Pages → `bounded-tools-trust` → Settings → Domains & Routes →
   Add → Custom Domain**.
2. Enter `trust.bounded.tools`. Cloudflare creates the DNS record automatically
   because the `bounded.tools` zone is already on this account.

Tracked as bead **prx-iu7r**.

## Notes

- The landing page is intentionally dependency-free, hand-authored HTML — no
  brand submodule required. If you later want it to share the `@bounded-systems/brand`
  design system with `bounded.tools`, port the build pattern from
  `bounded.tools/build.mjs` (which copies the consumed brand assets into `dist/`).
- Keep the landing page a *doorway*: it must not re-list the full graded ledger,
  to avoid drifting from the canonical `CLAIMS.md`. Drift between this site and
  the code is exactly the failure mode the ledger exists to prevent.
