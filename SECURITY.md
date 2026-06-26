# Security Policy

We take the security of bounded-systems projects seriously. This repo also
publishes our full security posture — see **[CLAIMS.md](./CLAIMS.md)**.

## Reporting a vulnerability

**Do not open a public issue for security reports.** Use GitHub's private
vulnerability reporting:

1. Go to the affected repository's **Security** tab → **Report a vulnerability**.
2. Describe the issue, affected versions, and a reproduction if possible.

We aim to acknowledge reports within 3 business days and to provide a remediation
timeline after triage. Coordinated disclosure is appreciated; please give us a
reasonable window to ship a fix before any public disclosure.

## Reporting a miscalibrated claim

The [claims ledger](./CLAIMS.md) is itself a set of claims. If a row **overstates**
what the code enforces — an ✅ Enforced property you can show is not actually
enforced on a live path — that is a security-relevant defect. Report it the same
way as a vulnerability above. We would rather hear it from you than ship an
overclaim.

## Supported versions

Security fixes target the latest released version on each repository's default
branch unless otherwise noted in that repository's own `SECURITY.md`. This policy
inherits from and extends the org-level policy in `bounded-systems/dotgithub`.
