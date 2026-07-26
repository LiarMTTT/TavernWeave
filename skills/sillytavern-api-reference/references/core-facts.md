# Public Interoperability Index

This is an original navigation aid for SillyTavern ecosystem interoperability. It does not reproduce upstream source code, type declarations, command grammar, or license text.

The baselines below were retrieved on 2026-07-22. They are pinned so a reader can revisit the same public material; they are not assertions about the latest available versions. Match the installed versions first, and prefer the target runtime whenever it differs from a baseline.

## Pinned public baselines

| Surface | Navigation snapshot | Upstream boundary |
| --- | --- | --- |
| SillyTavern core | Version 1.18.0; [release page](https://github.com/SillyTavern/SillyTavern/releases/tag/1.18.0); [commit `8172dcd0ee672d3cd9a5e5f7af134f91a45cd2b8`](https://github.com/SillyTavern/SillyTavern/commit/8172dcd0ee672d3cd9a5e5f7af134f91a45cd2b8) | AGPL-3.0; see the [license at the pinned commit](https://github.com/SillyTavern/SillyTavern/blob/8172dcd0ee672d3cd9a5e5f7af134f91a45cd2b8/LICENSE) |
| JS-Slash-Runner / Tavern Helper | Version 4.8.19; [manifest](https://github.com/N0VI028/JS-Slash-Runner/blob/36d8889a99f1cf09d3d1f8aabd0eba33975dc64d/manifest.json); [commit `36d8889a99f1cf09d3d1f8aabd0eba33975dc64d`](https://github.com/N0VI028/JS-Slash-Runner/commit/36d8889a99f1cf09d3d1f8aabd0eba33975dc64d) | AFPL-9; upstream explicitly identifies the repository as non-open-source; see its [license at the pinned commit](https://github.com/N0VI028/JS-Slash-Runner/blob/36d8889a99f1cf09d3d1f8aabd0eba33975dc64d/LICENSE) |
| ST-Prompt-Template | Version 1.17.4.3; [manifest](https://github.com/zonde306/ST-Prompt-Template/blob/ada54bb22e3dab0a07e473d383b4c2fe40bc6573/manifest.json); [commit `ada54bb22e3dab0a07e473d383b4c2fe40bc6573`](https://github.com/zonde306/ST-Prompt-Template/commit/ada54bb22e3dab0a07e473d383b4c2fe40bc6573) | AGPL-3.0; see the [license at the pinned commit](https://github.com/zonde306/ST-Prompt-Template/blob/ada54bb22e3dab0a07e473d383b4c2fe40bc6573/LICENSE) |
| MagVarUpdate / MVU | Public beta snapshot at [commit `b42817925d0391c15fa242a8238d2bbe28eb6319`](https://github.com/MagicalAstrogy/MagVarUpdate/commit/b42817925d0391c15fa242a8238d2bbe28eb6319); the package version is not a reliable extension-release identifier | MIT; see the [license at the pinned commit](https://github.com/MagicalAstrogy/MagVarUpdate/blob/b42817925d0391c15fa242a8238d2bbe28eb6319/LICENSE) |

These projects remain independent upstream works. The links above identify where to navigate; they do not import their licensing terms into TavernWeave.

## Route by surface

| Need | Start with | Useful identifiers |
| --- | --- | --- |
| Host state, native events, rendering, macros, or STScript | Installed SillyTavern source, runtime help, and `window.SillyTavern.getContext()` | Native event constants, `/help`, command autocomplete, macro help |
| Messages, variables, generation, injection, worldbooks, or iframe utilities | Tavern Helper material matching the installed extension | `window.TavernHelper`, injected helper globals, `getTavernVersion`, `getTavernHelperVersion` |
| Prompt-time EJS behavior | Installed ST-Prompt-Template | Optional `window.EjsTemplate` surface and extension settings |
| Structured MVU state and update lifecycle | Installed MagVarUpdate plus matching helper declarations | Optional `window.Mvu`, `waitGlobalInitialized`, `Mvu.events`, `stat_data` |

Do not move a symbol from one row to another merely because two globals expose similar names. Top-window console availability also does not prove availability inside a message iframe, script iframe, prompt template, or STScript pipeline.

## Runtime delivery boundaries

Keep API ownership separate from delivery:

- Do not treat an API identifier as evidence of who provides a library or how it is
  delivered. Trace the card's actual script, import, manifest, and registration path.
- Treat a card-specific Zod schema as embedded card code when it is stored in the
  character's Tavern Helper scripts.
- Treat packaged domestic/global MVU Zod scripts as embedded card assets. Require
  every variant promised by the card and preserve the declared enabled-state policy.
- Treat MagVarUpdate bundles, schema-registration helpers, UI modules, and similar
  Git/CDN imports made by those scripts as remote runtime code. An HTTP response does
  not prove module execution.
- Keep Node, package-manager, compiler, and local Zod dependencies used only for
  building out of player installation instructions.

Re-resolve these facts against the installed runtime; the public baselines do not make
them universal guarantees.

## Verification loop

1. Detect the installed SillyTavern and extension versions where the current context exposes version helpers.
2. Inventory optional globals in the exact execution context that will run the code.
3. Use this index to choose the upstream project, then inspect the installed source or a public revision that actually matches the target.
4. Obtain exact parameter shapes, callback payloads, event values, and command syntax from that authority. Do not derive them from this index.
5. Record a public URL and revision for source-backed facts, or identify the installed file/help output used for runtime-backed facts.
6. Add a capability check and a clear failure path for optional integrations.
7. Close behavior in a real runtime; static source or declarations alone cannot establish timing, persistence, or iframe exposure.

## Compact symbol map

### Messages and swipes

- Route reads and writes through `getChatMessages` and `setChatMessages` when the installed Tavern Helper supports them.
- Decide explicitly whether alternate swipes are part of the read. Treat a negative message index as a depth-relative selector only after confirming the installed helper behavior.
- Update only the intended floor and swipe. Choose the smallest refresh scope that makes the change visible.
- Do not infer event order or saved-state timing from a declaration.

### Variables

- Route table access through `getVariables`, `replaceVariables`, `updateVariablesWith`, `insertOrAssignVariables`, `insertVariables`, and `deleteVariable` as available.
- Select chat, character, message, script, preset, global, or extension scope deliberately. Similar keys in different scopes are different state.
- Prefer updater or partial-merge helpers. Whole-table replacement can erase fields owned by another script.
- Treat `registerVariableSchema` as a validation or presentation facility unless the installed MVU runtime proves a stronger guarantee.

### Generation and prompt injection

- Route ordinary helper generation through `generate`; route an explicitly constructed prompt sequence through `generateRaw`.
- Neither helper should be assumed to create a normal chat turn or invoke MVU parsing as a side effect.
- Route managed prompt additions through `injectPrompts` and `uninjectPrompts`. Retain the disposer or IDs, and define cleanup across chat changes.
- Verify streaming, tools, structured output, custom connection settings, and prompt ordering against the installed helper before use.

### Events

- Route subscription and emission through the installed `eventOn`, `eventOnce`, ordering helpers, and emit helpers.
- Resolve event values through exported constants. Some ecosystem values intentionally retain historical spellings.
- Verify callback payloads and lifecycle order at the exact target revision. Avoid emitting host events whose contracts are not understood.
- Remove listeners when their owner can be re-rendered, reloaded, or destroyed.

### Worldbooks

- Route current entry work through `getWorldbook`, `replaceWorldbook`, `updateWorldbookWith`, `createWorldbookEntries`, and `deleteWorldbookEntries` when present.
- Prefer entry-level or updater operations so unrelated entries, unknown fields, and stable identities survive.
- Resolve character and chat bindings separately with the matching name helpers; do not create a chat worldbook when the character's primary worldbook is intended.
- Treat the older lorebook-entry helper family as legacy when the installed declarations mark it deprecated.

### MVU

- Wait for the `Mvu` global before access. Route structured reads, replacement, and parsing through the installed `Mvu` methods rather than editing rendered HTML.
- Preserve `stat_data` and other MVU-owned fields outside the intended mutation.
- Subscribe through `Mvu.events` constants, not copied string literals.
- Defensively handle a no-op parse result until the installed implementation establishes its exact return behavior.
- A generated reply, a message write, and an MVU update are separate lifecycle steps unless real-runtime evidence proves they are connected.

### Macros and STScript

- Use macro help to resolve name, variable, date/time, random-choice, and prompt-override macro families. Keep macros for substitution; write-capable macros can run again during preview, swipe, edit, or render.
- Use runtime command help or autocomplete for `/getvar`, `/setvar`, `/getglobalvar`, `/setglobalvar`, `/let`, `/var`, `/inject`, `/send`, `/trigger`, `/gen`, and `/genraw`.
- Preserve pipe values, named arguments, quoting, and closure boundaries exactly as the target runtime documents them.
- `/send` and generation are separate operations. Confirm the intended turn flow instead of assuming one triggers the other.

### Prompt templates

- Treat ST-Prompt-Template as a separate optional integration, not as a built-in Tavern Helper feature.
- Verify the installed EJS entry points, enabled features, evaluation context, and escaping behavior before writing a template.
- Keep prompt-template side effects explicit and avoid exposing secrets or private chat data through rendered output or logs.

## Facts that always remain runtime-sensitive

Re-resolve these instead of freezing them in TavernWeave:

- complete key sets on `window.SillyTavern`, `window.TavernHelper`, `window.EjsTemplate`, and `window.Mvu`;
- exact signatures, callback payloads, event values, and STScript grammar;
- macro repetition and side-effect timing;
- iframe exposure, render order, and private DOM selectors;
- optional variable scopes and extension capability flags;
- MVU no-op parsing, event order, and persistence timing;
- worldbook fields or helpers introduced after a pinned snapshot.

If a target fact cannot be matched to the runtime, label it unresolved and provide a minimal probe rather than a guessed runnable snippet.
