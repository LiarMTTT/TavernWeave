# UI extension contract

## Supported surface

This skill covers browser-side SillyTavern UI extensions. A project root contains
`manifest.json`; its `js` field names the browser entry module. Server plugins and
card-local Tavern Helper scripts have different trust and packaging boundaries.

## Manifest fields

The validator requires these TW release fields:

| Field | Contract |
| --- | --- |
| `display_name` | Non-empty user-facing string. |
| `js` | Safe relative `.js` or `.mjs` path that exists under the extension root. |
| `author` | Non-empty author or contact string. |
| `version` | Numeric semantic version such as `1.2.0`. |

It accepts and validates `loading_order`, `css`, `homePage`, `auto_update`,
`minimum_client_version`, `dependencies`, `i18n`, `hooks`, and
`generate_interceptor`. Unknown fields are preserved and reported, not removed.

`requires` and `optional` are deprecated Extras-module fields. Preserve them when an
existing extension still uses them, but report a migration warning. Do not silently
translate them into extension `dependencies`.

Paths must be relative, remain below the project root after resolution, and exist.
Locale paths must end in `.json`; CSS paths in `.css`.

## Lifecycle hooks

Supported manifest hook names are `install`, `update`, `delete`, `enable`, `disable`,
`activate`, and `clean`. Each value is a JavaScript identifier exported from the
entry module. Static export detection is a smoke check, not module execution.

Use `activate` only for synchronous setup required while the blocking loader is
active. Put asynchronous work behind later events or explicit user actions. Treat
hook timeouts and errors as non-blocking host behavior that still needs live tests.

## Runtime ownership

- Prefer `SillyTavern.getContext()` for stable host state and events.
- Namespace settings, storage keys, prompt IDs, DOM IDs, CSS, and logs.
- Merge settings defaults without replacing unknown user values.
- Pair listeners, timers, observers, DOM mounts, prompt injections, macros, tools,
  object URLs, workers, audio, and external runtimes with cleanup.
- Do not directly import internal host modules unless the project declares and tests
  the exact supported SillyTavern version range.

## Installation boundary

The scaffold and validators never call extension install/update/uninstall APIs and
never reload a page. Installation changes persistent host state and needs explicit
authorization plus rollback. After installation, verify manager visibility, enable
and disable, reload, chat switch, settings persistence, error handling, and cleanup.
