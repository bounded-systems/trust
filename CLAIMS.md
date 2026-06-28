# Claims Ledger

Every security/trust claim Bounded Systems makes about itself, graded against
running code. Evidence is given as `repo/path · symbol` so you can `grep` and
check it. Open work is linked to its bead id.

**Grades:** ✅ Enforced · 🟡 Partial · 🔴 Gap · 📐 Design-only · ⚙️ By design
(see [README](./README.md#how-claims-are-graded)).

> This ledger is itself a set of claims. It is graded by the same instrument it
> describes (`prx/docs/claims-audit-instrument-v0.md`). If a row drifts from the
> code, that is a defect — please [report it](./SECURITY.md).

*Calibrated 2026-06-26 against the local poly-repo working tree.*

---

## 1. Capability model (object-capability / ocap)

| # | Claim | Grade | Evidence | Notes |
|---|---|---|---|---|
| 1.1 | Authority can only be **narrowed** as it is handed onward, never widened. | ✅ Enforced (model) | `guest-room` attenuation; `dotgithub/knowledge/ocap-doors.md` | Core ocap invariant (Miller/E lineage). |
| 1.2 | A door is a single unit of authority — you hold a socket to a brokered service, never the keys behind it. | ✅ Enforced (model) | `dotgithub/knowledge/ocap-doors.md` | Sockets/fd-passing mechanism itself is 🟡 (row 1.3). |
| 1.3 | Sockets / fd-passing as the unforgeable-capability mechanism. | 🟡 Partial | `dotgithub/docs/positioning.md:57` | Lives in the `bellhop` broker layer; seam-to-`prx` not yet settled. |
| 1.4 | Credentials are held as references, not values — callers get an `authorize()` capability, never the token. | ✅ Enforced (in-process) | `auth/keymaker.ts · createServiceKeymaker` | **Scope is honest:** this is an in-process *discipline* guarantee, not isolation — in-process code can still read the closure. Isolation is a layered profile (Lima microVM under `--vm`; SES/Deno/WASI are the upgrade paths). |
| 1.5 | A minted credential expires — use after TTL fails closed. | ✅ Enforced | `auth/keymaker.ts · authorize` → `CredentialExpiredError` | Runtime TTL check. |

## 2. Policy enforcement

| # | Claim | Grade | Evidence | Notes |
|---|---|---|---|---|
| 2.1 | The policy guard **fails closed**: an unknown tool/state/role is denied, never allowed by fallthrough. | ✅ Enforced | `policy/src/index.ts:480 · checkPolicy` (`allowList ? allowList.includes(sub) : false`) | Sibling predicate returns explicit `unknown-tool` reason. |
| 2.2 | Policy is data: allowlists keyed by tool × state × role; decisions are pure lookups, no ambient authority. | ✅ Enforced | `policy/src/index.ts · POLICY_TABLE` | Table-driven, deterministic. |
| 2.3 | An agent cannot perform an action its role doesn't own (keeper owns git writes, forge owns gh writes, orchestrator owns nothing). | ✅ Enforced | `prx/.../agents/policy_guard.ts · decideAgentToolCall`; `prx/.../test/agents/policy_guard.test.ts` | Wired as a PreToolUse hook (`prx/.claude/hooks/policy-guard.ts`) — exits non-zero to deny on every command. |
| 2.4 | Ownership claims in the feature specs match runtime enforcement. | ✅ Enforced | `prx/.../test/agents/capability_feature.test.ts` ("FAITHFUL: a role owns a write iff the predicate allows it") | Faithfulness test compares spec to `isFeasibleForRole`. |
| 2.5 | Policy guard fails closed on **unparseable** policed commands (not just unknown ones). | ✅ Enforced | `prx/.../agents/policy_guard.ts · decideAgentToolCall` / `parsePolicedCommand` | A policed-tool head with no parseable verb fails closed (policy roles + orchestrator); value-taking options (`git -C`, `gh -R`) no longer let a value masquerade as the verb. prx#760 (bead `prx-w1v`, closed). |

## 3. Capability seams (single access points)

| # | Claim | Grade | Evidence | Notes |
|---|---|---|---|---|
| 3.1 | Each domain has exactly **one** sanctioned access point (subprocess, env, host, fs, secrets, git, gh…), enforced by tests — no upward deps, no ambient authority. | ✅ Enforced | 23 packages via the shared [`@bounded-systems/seam-check`](https://github.com/bounded-systems/seam-check) harness (`cas`, `proc`, `env`, `host`, `fs`, `auth`, `git`, `policy`, …) | Zero-tolerance: `assertSeam` reports `{imports:[], ambient:[]}` or throws — no upward deps, no `child_process`/`process.env` outside the allowlist. |
| 3.2 | Seam coverage is **complete** — nothing escapes the net. | ✅ Enforced | 23 packages adopt [`@bounded-systems/seam-check`](https://github.com/bounded-systems/seam-check); bead `prx-5yp` | The hand-rolled, copy-pasted extractability tests were replaced by one shared importable harness — the allowlist a package passes *is* its declared claim. No real prod escapes surfaced; several seams (`host`, `env`, `auth`, `repo-root`, `installer`) **gained** ambient checks they previously lacked. The org-level coverage meta-test (`assertAllPackagesChecked`) ships in the package as the remaining structural guarantee against a *new* uncovered package. |
| 3.3 | No agent mutates git ambiently (bypassing the prx seam). | ✅ Enforced | `prx/.../audit/invariants.ts · assertNoAmbientGit` (I-AUD4) | Baseline: zero ambient-git violations. |

## 4. Provenance & attestation

| # | Claim | Grade | Evidence | Notes |
|---|---|---|---|---|
| 4.1 | Bytes are addressed by their SHA-256 digest; authority lives in the digest, not in who produced the bytes. | ✅ Enforced | `cas/README.md · BlobStore`; verifier re-hashes on read | Zero-dependency substrate (`node:crypto` only). |
| 4.2 | A derivation's identity is content-addressed — any manifest change changes its id. | ✅ Enforced | `anchored-chain` · canonical manifest digest | Deterministic, key-order independent. |
| 4.3 | Derivations are signed (Ed25519) and projected to in-toto statements wrapped in DSSE envelopes. | ✅ Enforced | `anchored-chain/README.md`; pure core, `node:crypto` + `cas` only | Format is emitted correctly. |
| 4.4 | Attestations are verifiable by **off-the-shelf** in-toto/DSSE tooling. | ✅ Enforced | `anchored-chain/src/__tests__/dsse-interop.test.ts` (bead `prx-5lcd`) | A real envelope is verified with an **independent** ed25519 implementation (`@noble/ed25519`, not `node:crypto`) and a DSSE PAE reimplemented from the spec (not our code): it accepts the genuine envelope, rejects a tampered payload, and validates the in-toto Statement v1 shape. (A full external-binary check via `cosign`/`in-toto-verify` is a heavier future add; the format interop is now proven in CI.) |
| 4.5 | in-toto / SLSA conformance. | 🟡 Partial (kinship only) | `dotgithub/docs/positioning.md:63` | **Deliberately not badged.** We claim "in-toto–style / SLSA-style," never a level, until exact formats/levels are met. |
| 4.6 | Every surface read (`file`, `grep`, `files`) is content-addressed and anchored, so what an agent saw is verifiable after the fact. | ✅ Enforced | `scout/README.md`; depends on `anchored-chain`/`cas` | Provenance detects surface drift. |
| 4.7 | The provenance stamp uses `SOURCE_DATE_EPOCH`, never wall-clock — re-runs are byte-identical. | ✅ Enforced | `synoptic-github/README.md:56` | Determinism vector closed. |

## 5. Supply-chain (published packages)

| # | Claim | Grade | Evidence | Notes |
|---|---|---|---|---|
| 5.1 | All published `@bounded-systems` packages enable npm **build provenance**. | ✅ Enforced | 24/24 first-party `package.json` with `"provenance": true`; remaining matches are vendored `node_modules` | `grep -rlE '"provenance":[[:space:]]*true' --include=package.json . \| grep -v node_modules` |
| 5.2 | Packages publish to JSR via **tokenless OIDC** (no long-lived credentials). | ✅ Enforced | 34 × `publish-jsr.yml` with `permissions: id-token: write` | GitHub OIDC exchanged for publish rights. |

## 6. Pipeline verification (the honest gaps)

| # | Claim | Grade | Evidence | Notes |
|---|---|---|---|---|
| 6.1 | git-writes are signed **and verified against their owner**. | 🟡 Partial | `prx` provenance signing; `PRX_REQUIRE_SIGNED_DERIVATIONS` | Ownership is now verified on the live merge gate (row 6.2). Residual gap: verification is still **opt-in and fail-open** by default (git effects only) — making it default-on is the remaining work. |
| 6.2 | A privileged effect not produced by its owning actor fails verification. | ✅ Enforced | `prx/.../provenance/merge-guard.ts · projectProvenanceAxis` → `verifyEffectOwnership` | Wired into the live merge gate (`canEnterReadyToMerge`): under enforcement, a signature-valid effect whose producer doesn't own it fails closed (`unsigned`). prx#759 (bead `prx-6s8`, closed). Non-effect / non-role producers pass through. |
| 6.3 | Caveat / attenuation enforcement is by interposition (proxy), not string compare. | 🔴 Gap | bead `prx-yweb` | Open design work. |

## 7. Operator hygiene

| # | Claim | Grade | Evidence | Notes |
|---|---|---|---|---|
| 7.1 | Keeper/executor git commits are signed by default. | 🟡 Mechanism enforced; activation pending | `git/src/index.ts` (`PRX_COMMIT_SIGNING_KEY` → SSH-sign commit/tag/commit-tree); `git/src/__tests__/signing.test.ts` | The seam now signs with **our own file-based ed25519 key**, headlessly — never the operator's 1Password agent (which hangs non-interactively). Integration-tested with a real `ssh-keygen` key: the keeper's `commit-tree` lands a genuine SSH signature, unsigned without the key (safe fallback). "By default" becomes true once `PRX_COMMIT_SIGNING_KEY` points at the project key (`github_signing_key`) in the keeper/worktree provisioning — the remaining operational step (bead `prx-e7cl`). The Ed25519 provenance chain stays the primary integrity layer. |

## 8. Semantic git

| # | Claim | Grade | Evidence | Notes |
|---|---|---|---|---|
| 8.1 | AST-level semantic merge / format enforcement. | 📐 Design-only | `git-ast/README.md` (parsing/serialization are placeholders) | Not yet a working tool. Matches the GitAI-prep note: design-only. |

---

## Open calibration work

The meta-claim — *"the public claims match live enforcement"* — is itself tracked:

- `prx-suz` — Claims calibration: close the gap between repo claims and live enforcement (+ periodic claims audit).
- `prx-99s` — Re-tier STATUS value props + soften README tagline to match live enforcement.
- ~~`prx-6s8` — Wire `verifyEffectOwnership` into the merge-guard path~~ ✅ done ([prx#759](https://github.com/bounded-systems/prx/pull/759)). Residual: make signed verification **default-on** (row 6.1) — still opt-in / fail-open.
- `prx-5yp` — Close the ~13 silent seam violations (`node:fs`/`node:os` outside fs/host) or baseline them explicitly.
- `prx-w1v` — policy_guard: fail closed on unparseable policed commands + adversarial parser tests.
- `prx-e7cl` — Keeper/worktree commits unsigned by default — decide on signing by default.

When one of these closes, its row above moves grade — and that movement is the
point of keeping the ledger public.
