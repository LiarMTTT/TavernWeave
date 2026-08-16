---
name: sillytavern-extension-dev
description: >-
  Scaffold, validate, review, and prepare browser-side SillyTavern UI extensions.
  Use when Codex needs to create or inspect an extension manifest, entry module,
  lifecycle hooks, settings namespace, capability contract, version preflight,
  or installation smoke plan without installing into a live SillyTavern instance.
---

# SillyTavern Extension Development

Before generating or editing an extension, use `$consult-tavernweave-library` with the `sillytavern-extension-dev` route to load A0 and the extension/workshop guides. The receipt does not replace exact installed-version capability checks or installation authorization.

Build browser-side UI extensions against an explicit host contract. Keep static
project validation separate from installation and real-runtime acceptance.

## Fix the extension boundary

Confirm that the target is a SillyTavern UI extension with `manifest.json` and a
browser entry module. Route other surfaces deliberately:

- Card-local Tavern Helper script: use `sillytavern-component-update`.
- STScript or exact API signature: use `sillytavern-api-reference`.
- Server plugin: stop and establish a separate Node/server security contract.
- Imported-runtime failure: use `sillytavern-runtime-debug`.

Do not install, update, reload, or enable an extension unless the user explicitly
authorizes mutation of that SillyTavern instance.

## Inspect before changing

Read `manifest.json`, package/module settings, the entry module, styles, locales,
build scripts, and existing tests. Preserve the extension ID, settings namespace,
public hooks, storage keys, and import format unless the requested change requires
a migration.

Read [extension-contract.md](references/extension-contract.md) for the manifest and
lifecycle contract. Read [capability-preflight.md](references/capability-preflight.md)
when the extension depends on version-sensitive host or Tavern Helper symbols.

## Scaffold only when needed

Create a dry-run plan first:

```powershell
node scripts/scaffold-extension.mjs --spec extension-spec.json --out staging
```

Add `--write` only after checking the resolved output root and planned files. The
scaffold is intentionally minimal: manifest, ES-module entry, optional stylesheet,
and capability contract. Merge it into an existing project instead of overwriting
unrelated files.

## Validate the project

Run:

```powershell
node scripts/validate-extension-manifest.mjs --root extension-directory
node scripts/check-extension-capabilities.mjs --contract capability-contract.json --snapshot installed-snapshot.json
```

Treat deprecated Extras fields as warnings, path escapes and missing entry files as
errors, and required missing capabilities as blockers. A captured snapshot is
evidence about one installed environment, not a universal API guarantee.

## Preserve lifecycle ownership

Use the manifest `activate` hook only for synchronous load-phase setup. Keep every
event listener, timer, prompt injection, macro, function tool, DOM mount, and media
handle paired with deterministic cleanup. Prefer `SillyTavern.getContext()` over
internal module imports. Namespace settings and DOM IDs with the stable extension ID.

## Keep acceptance open

Static gates can prove JSON shape, file presence, exports, path safety, capability
requirements, and syntax. They cannot prove extension-manager installation, page
reload behavior, actual event payloads, settings persistence, UI rendering, or
uninstall cleanup. Record those as live gates with the target versions.

## Report

State the extension surface, target versions, files created or changed, static gate
results, required capabilities, deprecated fields, and every remaining live gate.

## Resources

- [extension-contract.md](references/extension-contract.md): manifest, paths, hooks,
  settings, and cleanup rules.
- [capability-preflight.md](references/capability-preflight.md): snapshot schema and
  version-sensitive capability policy.
- `scripts/scaffold-extension.mjs`: dry-run-first minimal scaffold.
- `scripts/validate-extension-manifest.mjs`: manifest, path, and export validator.
- `scripts/check-extension-capabilities.mjs`: captured-version capability gate.
