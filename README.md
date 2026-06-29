# Bounded Systems · Trust Center

> Trust you can **verify**, not trust you have to take on faith.

Most trust centers point at an auditor's attestation: *"a third party checked our
process once."* Bounded Systems is built the other way around. Its security
properties are **mechanisms in the code** — capability seams, policy tables that
fail closed, content-addressed provenance — so you don't have to trust a badge.
You can `grep` the claim and watch the test fail if it breaks.

This repo is the public projection of our internal **claims-calibration
instrument** (`prx/docs/claims-audit-instrument-v0.md`,
`dotgithub/docs/positioning.md`). Every public claim is graded against running
code, and the gaps are listed alongside the wins — because a ledger that only
shows wins isn't a ledger, it's marketing.

- **[CLAIMS.md](./CLAIMS.md)** — the full claims ledger (Enforced / Partial / Gap / Design-only, with evidence).
- **[SECURITY.md](./SECURITY.md)** — how to report a vulnerability.
- **Hosted:** [trust.bounded.tools](https://trust.bounded.tools) — live (Cloudflare Worker `bounded-tools-trust`; see [site/DEPLOY.md](./site/DEPLOY.md)).

## How claims are graded

| Grade | Meaning |
|---|---|
| ✅ **Enforced** | Property is checked on a user-exercised path, default-on, and fails the build/run if broken. |
| 🟡 **Partial** | A real check exists but is narrower than the prose — opt-in, one layer only, or tested as a pure function rather than on the live path. |
| 🔴 **Gap** | Intended behavior with no live enforcement (e.g. a pure function with no production call site), tracked as open work. |
| 📐 **Design-only** | Specced or scaffolded; not yet a working mechanism. |

We follow one rule from our own positioning notes: **kinship, not badges.** We
emit the *exact formats* — our attestations are now proven-conformant in-toto
Statement v1 + SLSA Provenance v1 documents (row 4.5, validated against the
published specs) — but we still do **not** print a SLSA *level* until the
build-integrity *requirements* of that level are met. Conformance on the format;
kinship on the level. ([positioning.md](../dotgithub/docs/positioning.md))

## Posture at a glance

What this is: a security-research codebase for **capability-secured, provenance-tracked
agent runtimes**. What it is **not** (yet): a SOC 2 / ISO 27001–attested vendor.
We don't process customer data, so a compliance portal would be form without
substance. Instead we publish the mechanisms below.

| Area | Grade | One-line |
|---|---|---|
| Capability model (ocap / narrow-only attenuation) | ✅ Enforced (model) | Authority can only be narrowed as it's passed onward — Miller/E lineage. |
| Policy guard fails **closed** | ✅ Enforced | Unknown tool/state/role **and unparseable policed commands** → denied; wired as a PreToolUse hook on every command. |
| Capability seams (single access points) | ✅ Enforced | 23 packages prove their seam claim via the shared `@bounded-systems/seam-check` harness — no upward deps / no ambient authority, zero-tolerance. |
| Supply-chain provenance (npm + JSR) | ✅ Enforced | All 24 published `@bounded-systems` packages set `provenance: true`; 34 JSR OIDC workflows. |
| Content-addressed signed provenance core | ✅ Enforced | Ed25519 over canonical manifests, projected to in-toto/DSSE (`anchored-chain`). |
| Off-the-shelf verifiability of attestations | ✅ Enforced | A real envelope verifies under an independent ed25519 impl (`@noble/ed25519`) + a spec-reimplemented DSSE PAE — not our verify code (`prx-5lcd`). |
| Signed-derivation **verification** in the pipeline | ✅ Enforced | Default-on / fail-closed at the merge-guard + publisher tier (prx#789); opt out with `PRX_REQUIRE_SIGNED_DERIVATIONS=0`. |
| Effect-ownership verification on the live path | ✅ Enforced | Wired into the merge gate `projectProvenanceAxis`; a signed effect from a non-owning producer fails closed (prx#759). |
| Seam coverage completeness | ✅ Enforced | 24 capability packages adopt the shared `@bounded-systems/seam-check` harness, and a scheduled org-level `seam-coverage` workflow fails CI on any *new* uncovered capability repo (`prx-5yp`, `prx-w2mf`). |
| Operator commit signing on by default | ✅ Enforced | The direct keeper path signs by default with prx's OWN internal ed25519 key (not 1Password, not host/cloud); keeper fails closed on unsigned. Deployed: key registered as a GitHub Signing Key + shipped in the installed `prx` v0.16.1. Verified end-to-end — a prx-signed commit reads **Verified** on GitHub (`prx-e7cl`). |
| Semantic git: canonical format enforcement (clean/smudge round-trip) | ✅ Enforced | `git-ast` parses + re-emits a deterministic, idempotent canonical form over Git's real `filter-process` protocol; fail-closed; proven against real `git` (cucumber claims) + CI. Rust and JSON both on `main` (#26, #27). |
| Semantic git: AST-level structural **merge** | ✅ Enforced | Real structural 3-way merge for JSON — different-key edits merge where a text merge conflicts. Backed **both ways**: *executable* (real `git merge`, PR #28) and *proven* (Mathlib-free **Lean** proof, CI-gated sorry-free, PR #30). Coverage additive (more languages, arrays). |
| Semantic git: structural **diff** | ✅ Enforced | `git-ast`'s diff driver reports JSON changes as object-key paths (added/removed/changed), order-independent; verified against real `git diff` (PR #31). Coverage additive (more languages, arrays). |
| Semantic git: **node identity** (move/rename tracking) | 🟡 Partial | `git-ast match` tracks a function through a rename/reorder/edit (exact, content-addressed; PR #32) *and* through a simultaneous rename-and-edit (fuzzy body similarity; PR #33). The hard core — **structural** fuzzy matching (GumTree tree-edit), binding/use-site identity, persistence — remains. |

See **[CLAIMS.md](./CLAIMS.md)** for evidence paths and the open beads behind each
row.

## Verify it yourself

Every Enforced row is a `grep` away. For example:

```sh
# Policy fails closed: unknown key → false, never a permissive fallthrough
grep -n 'allowList ? allowList.includes' policy/src/index.ts

# All published packages opt into npm build provenance
grep -rlE '"provenance":[[:space:]]*true' --include=package.json . | grep -v node_modules | wc -l

# Capability seams are test-enforced, not documented
find . -name extractability.test.ts -not -path '*/node_modules/*'
```

---

*Last calibrated: 2026-06-26. This ledger is itself a claim and is graded the same
way — if a row here drifts from the code, that's a bug, [report it](./SECURITY.md).*
