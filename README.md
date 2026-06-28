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

We follow one rule from our own positioning notes: **kinship, not badges.** We say
"in-toto–style attestations" and "SLSA-style provenance," and we do *not* print a
SLSA level or "in-toto compliant" until the exact formats are emitted and the
exact levels are met. ([positioning.md](../dotgithub/docs/positioning.md))

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
| Signed-derivation **verification** in the pipeline | 🟡 Partial | Opt-in (`PRX_REQUIRE_SIGNED_DERIVATIONS`), git effects only, fail-open. |
| Effect-ownership verification on the live path | ✅ Enforced | Wired into the merge gate `projectProvenanceAxis`; a signed effect from a non-owning producer fails closed (prx#759). |
| Seam coverage completeness | ✅ Enforced | All 23 capability packages adopt the shared `@bounded-systems/seam-check` harness, and a scheduled org-level `seam-coverage` workflow fails CI on any *new* uncovered capability repo (`prx-5yp`). |
| Operator commit signing on by default | 🟡 Default-on in `main` | The direct keeper path signs by default with prx's OWN internal ed25519 key (not 1Password, not host/cloud); keeper fails closed on unsigned; key generated. Two steps to ✅: register the pubkey with GitHub + roll the build into the installed prx (`prx-e7cl`). |
| Semantic git (AST merge / format enforcement) | 📐 Design-only | `git-ast` parsing/serialization are placeholders. |

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
