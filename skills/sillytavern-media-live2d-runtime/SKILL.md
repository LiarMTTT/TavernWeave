---
name: sillytavern-media-live2d-runtime
description: >-
  Validate and plan SillyTavern rolecard audio, image, video, multimodal, and Live2D
  assets with explicit provenance, preload, binding, capability, fallback, and
  lifecycle contracts. Use when Codex needs media manifests, Tavern Helper audio
  wiring, Live2D adapter boundaries, deterministic preload budgets, or real-host
  acceptance plans without downloading or executing remote media.
---

# SillyTavern Media and Live2D Runtime

Before changing media or lifecycle behavior, use `$consult-tavernweave-library` with the `sillytavern-media-live2d-runtime` route to load A0, media/Live2D guides, and only the relevant motion references. Do not let a library catalog imply a provider API or redistribution license.

Treat media as versioned runtime dependencies rather than decorative URLs. Validate
the inert contract first; keep network retrieval and rendering in explicit live gates.

## Inventory the runtime surface

Identify every audio, image, video, multimodal, Live2D model, motion, and expression
asset. Record stable ID, source type, owner, expected bytes/hash, preload policy,
lifetime, and fallback. Do not contact remote URLs during the static audit.

Read [media-manifest-contract.md](references/media-manifest-contract.md) for the data
shape. Read [audio-and-live2d-lifecycle.md](references/audio-and-live2d-lifecycle.md)
before writing bindings.

## Validate assets

Run:

```powershell
node scripts/validate-media-manifest.mjs --manifest media-manifest.json --root maintained-media-root
```

The validator checks local containment, file existence, declared bytes and SHA-256,
HTTPS remote sources, audio settings, Live2D provider metadata, and fallbacks. Remote
assets remain unverified until fetched by an authorized live workflow.

## Validate bindings

Run:

```powershell
node scripts/check-media-bindings.mjs --manifest media-manifest.json --bindings media-bindings.json
```

Use documented SillyTavern event names and `PAGEHIDE` for iframe teardown. Pair every
audio play and Live2D load with cleanup. Do not invent a universal Live2D API: declare
the provider global, version probe, adapter capability, and static fallback.

For Tavern Helper audio, use only the supported `bgm` and `ambient` channels and
partial settings updates. Preserve existing playlists/settings unless replacement is
explicitly requested.

## Plan preload under a budget

Run:

```powershell
node scripts/plan-media-preload.mjs --manifest media-manifest.json --budget preload-budget.json
```

Keep eager assets minimal, lazy-load optional media, and leave remote entries with
unknown size blocked from eager acceptance. The plan never fetches assets.

## Keep live acceptance open

Static gates cannot prove MIME/CORS delivery, browser autoplay permission, decoded
media duration, audio switching, image/video readiness, WebGL support, Live2D motion
or expression binding, chat-switch disposal, mobile memory, or reconnection behavior.
Route those checks to `sillytavern-runtime-debug` with the exact installed versions.

Use `sillytavern-rolecard-performance` for card-wide size and captured timing budgets;
use `sillytavern-component-update` when only the media controller script changes.

## Report

Report asset IDs and counts, verified local hashes, unverified remote dependencies,
preload totals, binding and cleanup results, provider capabilities, fallbacks, and
remaining real-host scenarios. Do not print media payloads or secret-bearing URLs.

## Resources

- [media-manifest-contract.md](references/media-manifest-contract.md): asset,
  provenance, audio, and Live2D schema.
- [audio-and-live2d-lifecycle.md](references/audio-and-live2d-lifecycle.md): binding,
  cleanup, capability, and live acceptance rules.
- `scripts/validate-media-manifest.mjs`: offline asset contract validator.
- `scripts/check-media-bindings.mjs`: event and cleanup validator.
- `scripts/plan-media-preload.mjs`: non-network preload budget planner.
