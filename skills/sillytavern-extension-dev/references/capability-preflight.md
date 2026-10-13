# Capability preflight

## Contract file

Use a versioned JSON contract:

```json
{
  "schemaVersion": 1,
  "minimum": {
    "sillytavern": "1.18.0",
    "tavernHelper": null
  },
  "requirements": [
    {
      "id": "host-context",
      "owner": "sillytavern",
      "symbol": "SillyTavern.getContext",
      "required": true,
      "fallback": null
    }
  ]
}
```

`owner` is `sillytavern`, `tavern-helper`, or `provider`. Required capabilities must
have a stable ID and a symbol. Optional capabilities require a non-empty fallback
that describes the disabled or reduced behavior.

## Captured snapshot

The checker consumes a snapshot captured from the intended installed environment:

```json
{
  "schemaVersion": 1,
  "capturedAt": "2026-08-08T00:00:00Z",
  "versions": {
    "sillytavern": "1.18.0",
    "tavernHelper": "4.8.19"
  },
  "symbols": ["SillyTavern.getContext"]
}
```

Do not let the offline checker execute arbitrary probe expressions. Capture symbol
names and versions in the real host, review the snapshot, then check it as inert
JSON. A missing required symbol blocks release; a missing optional symbol activates
its declared fallback.

Version comparison follows [Semantic Versioning 2.0.0](https://semver.org/): prereleases sort below the matching stable version, prerelease numeric identifiers compare numerically, and build metadata does not affect precedence. A minimum of `1.18.0` therefore rejects `1.18.0-beta.1`; if that exact prerelease is intentionally supported, declare the tested prerelease minimum. This numeric minimum check does not establish compatibility with every higher prerelease; capability and runtime checks remain required. Malformed versions are rejected, including leading zeroes in numeric core/prerelease components and empty identifiers. `null` means no declared minimum or no observed version; a required minimum still requires a valid observed version.

## Evidence limits

A passing snapshot proves only that declared versions and symbol names were observed.
It does not prove call signatures, event payloads, permissions, lifecycle timing, or
behavior. Route exact signatures to `sillytavern-api-reference` and behavior to a
real-runtime acceptance case.
