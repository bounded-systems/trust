#!/usr/bin/env node
// Render the inter-repo contract claims into CLAIMS.md from the signed trellis
// status projection. Honest by construction: the grades come from trellis's
// LIVE checks (status.json), not hand-typed — if an edge goes red upstream, the
// claim here flips to a gap on the next run.
//
//   node scripts/render-contracts.mjs <status.json>
//
// The signature on status.json is verified in CI (`cosign verify-blob`) BEFORE
// this runs, so we only render a projection we can prove came from trellis CI.
// Zero dependencies (Node ESM), matching the site's build.mjs.

import { readFile, writeFile } from "node:fs/promises";

const START = "<!-- trellis:contracts:start -->";
const END = "<!-- trellis:contracts:end -->";
const GRADE = {
  pass: "✅ Enforced",
  fail: "🔴 Gap",
  declared: "📐 Design-only",
};

const statusPath = process.argv[2] ?? "status.json";
const status = JSON.parse(await readFile(statusPath, "utf8"));
const RAW = "https://raw.githubusercontent.com/bounded-systems/trellis/status";

const verified = status.types.filter((t) => t.verified);
const rows = verified
  .map((t, i) =>
    `| ${i + 1} | The \`${t.type}\` ${t.kind} contract is upheld end-to-end. | ${
      GRADE[t.result] ?? t.result
    } | \`trellis · checks.${t.type}\` · [signed status](${RAW}/status.json) | ${t.summary} |`
  )
  .join("\n");

const block = `${START}
_Generated from the **signed** [trellis](https://github.com/bounded-systems/trellis) status projection — ${status.summary.passing}/${status.summary.verified} verified contracts passing across ${status.summary.nodes} repos. Do **not** hand-edit: regenerated + signature-verified by \`.github/workflows/contracts.yml\`. Verify it yourself:_

\`\`\`sh
curl -sO ${RAW}/status.json
curl -sO ${RAW}/status.json.sigstore.json
cosign verify-blob --bundle status.json.sigstore.json \\
  --certificate-identity-regexp '^https://github.com/bounded-systems/trellis/' \\
  --certificate-oidc-issuer https://token.actions.githubusercontent.com status.json
\`\`\`

| # | Contract | Grade | Evidence | Notes |
|---|---|---|---|---|
${rows}
${END}`;

const claims = await readFile("CLAIMS.md", "utf8");
let updated;
if (claims.includes(START)) {
  updated = claims.replace(
    new RegExp(`${START}[\\s\\S]*?${END}`),
    block,
  );
} else {
  updated = `${claims.trimEnd()}\n\n## Inter-repo contracts (trellis lattice)\n\nEvery cross-repo contract trellis maps, graded by its live check. A relational\nwire/pin contract or a unary seam is 🔴 Gap the moment its check reds — the\nsame instrument that grades the rest of this ledger.\n\n${block}\n`;
}
await writeFile("CLAIMS.md", updated);
console.log(
  `rendered ${verified.length} contract claim(s) (${status.summary.passing} passing, ${status.summary.failing} gap)`,
);
