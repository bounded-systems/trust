#!/usr/bin/env node
// Assemble the trust.bounded.tools static site into dist/.
// Zero dependencies — the landing page is self-contained HTML in public/.
// The canonical, detailed ledger lives in the repo's CLAIMS.md (rendered by
// GitHub); this site is the doorway and links to it.
import { rm, mkdir, cp } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "dist");
const pub = join(root, "public");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(pub, dist, { recursive: true });

console.log("✓ built dist/  (run: wrangler deploy)");
