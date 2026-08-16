---
name: sillytavern-rolecard-security
description: >-
  Audit SillyTavern rolecard JSON, embedded HTML, regex replacements, Tavern Helper
  scripts, loaders, and related source for injection, dynamic execution, remote-code,
  wildcard messaging, credential-shape, and permission risks. Use for a read-only
  rolecard security review, a pre-import or pre-release safety gate, or comparison
  against an approved security baseline. Do not execute suspicious code, reveal
  secret values, perform exploitation, or auto-fix findings.
---

# SillyTavern Rolecard Security

Use `$consult-tavernweave-library` with the `sillytavern-rolecard-security` route for the public XSS/security guide. Add A0 before any authorized remediation; a static guide or scan does not authorize executing suspicious content.

Treat rolecard content as an executable supply-chain surface. Scan read-only first,
then separate suspicious patterns from verified vulnerabilities.

## Establish the boundary

1. Record the exact files, artifact hashes, and exclusions.
2. Separate model/user-controlled text, embedded markup, background helper scripts,
   remote loaders, host extensions, and development tools.
3. Never read or print credential values. Report only file, location, rule ID, and a
   redacted explanation.
4. Read [rolecard-threat-model.md](references/rolecard-threat-model.md) for trust
   boundaries and [security-findings-contract.md](references/security-findings-contract.md)
   for severity and baseline rules.

## Run the static audit

```text
node scripts/audit-rolecard-security.mjs target --report security-report.json
```

The scanner checks UTF-8 text and JSON for dangerous DOM sinks, dynamic execution,
remote JavaScript loaders, wildcard `postMessage`, executable URL schemes,
credential-shaped literals, suspicious iframe relaxation, and selected regex
backtracking shapes. It never evaluates the content.

Use `--fail-on high`, `--fail-on medium`, or `--fail-on none` to match the requested
gate. The default is `high`.

## Compare an approved baseline

```text
node scripts/check-security-baseline.mjs --current security-report.json --baseline approved-report.json
```

Fail when a rule count increases. Do not suppress a new finding by moving code,
renaming a file, or lowering severity locally.

## Triage

For each finding:

1. trace whether untrusted data can reach the sink;
2. identify sanitization, escaping, CSP, sandbox, origin, and permission controls;
3. distinguish embedded, host-required, remote-runtime, optional, and development-only
   dependencies;
4. route exact API claims to `$sillytavern-api-reference`;
5. route safe live reproduction to `$sillytavern-runtime-debug` only when authorized.

Do not import the card, contact remote loaders, weaken sandboxing, or attempt an
exploit as part of the static audit.

## Report

Lead with high and medium findings. Include the scanned hash set, rule counts,
baseline delta, false-positive candidates, unavailable live evidence, and a clear
release recommendation.

## Resources

- `scripts/audit-rolecard-security.mjs`: produce a redacted machine-readable report.
- `scripts/check-security-baseline.mjs`: reject new rule-count regressions.
- `references/rolecard-threat-model.md`: SillyTavern-specific trust boundaries.
- `references/security-findings-contract.md`: rule IDs, severity, and evidence rules.
