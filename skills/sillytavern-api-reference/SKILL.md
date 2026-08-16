---
name: sillytavern-api-reference
description: Verify exact SillyTavern, Tavern Helper / JS-Slash-Runner, STScript, macro, prompt-injection, worldbook, EJS, MVU, and runtime-library capabilities before implementing or reviewing rolecard automation. Use when a task depends on a function signature, event payload, slash-command grammar, variable scope, message-floor operation, generation option, runtime-symbol provider, Git/CDN loader, or version-sensitive extension capability.
---

# SillyTavern API Reference

Use `$consult-tavernweave-library` with the `sillytavern-api-reference` route for the smallest relevant ST guide set, then verify exact symbols against the identified target version. A guide route is navigation evidence, not a substitute for the installed runtime or pinned source. Add A0 only if the task becomes write-capable.

Treat this skill as an authority-routing procedure, not as a frozen copy of an evolving API. The public baselines in [references/core-facts.md](references/core-facts.md) are dated navigation snapshots, not claims about the latest release. The target runtime always wins.

## Resolve the runtime surface

Classify every requested operation before selecting an API:

| Surface | Use for | Primary authority |
| --- | --- | --- |
| SillyTavern core | Host context, native events, rendering, and extension APIs | Source and documentation for the installed SillyTavern release |
| Tavern Helper / JS-Slash-Runner | Message, variable, generation, injection, worldbook, and iframe helpers | Declarations and documentation matching the installed extension |
| STScript | Slash-command pipelines, closures, Quick Replies, and scoped variables | Command help from the running SillyTavern instance or matching command reference |
| Macros | Prompt-time substitution and simple variable access | Macro help from the running SillyTavern instance or matching macro reference |
| ST-Prompt-Template | EJS evaluation and prompt-template features | The installed extension version and its upstream documentation |
| MVU / MagVarUpdate | Structured `stat_data`, update parsing, replacement, and lifecycle events | The installed MVU global, matching declarations, and upstream source |

Do not transfer a symbol between surfaces merely because similarly named globals exist.

## Verification workflow

1. Capture the target versions and capabilities. In a Tavern Helper context, prefer `getTavernVersion()` and `getTavernHelperVersion()`. Probe optional integrations with `typeof`, `Object.keys`, or documented initialization helpers.
2. Identify whether each dependency is host-provided, embedded in the card, or loaded
   remotely. Do not infer an installation requirement from an imported helper or a
   global symbol.
3. Search the authority that matches those versions. Prefer runtime source or official versioned documentation, then matching declarations, then the public interoperability index in [references/core-facts.md](references/core-facts.md).
4. Copy the exact symbol spelling, parameter shape, return type, event constant, or command grammar. Never reconstruct it from memory.
   If the request omits the concrete symbol or installed version, stop before giving an exact value or signature. Ask for the hook and runtime identity; do not volunteer an example from a moving branch as though it answered the target-runtime question.
5. Record provenance beside version-sensitive work using this compact form:

   ```text
   symbol: updateWorldbookWith
   surface: Tavern Helper
   applies_to: detected extension version or declaration snapshot
   provenance: public upstream URL plus commit/path, or identified runtime source
   confidence: high | medium | low
   runtime_check: performed check, or reason it remains pending
   ```

6. Implement the narrowest supported API and add capability failure behavior. Do not silently fall back to private host DOM, deprecated APIs, or a different persistence scope.
7. Verify the call in the intended context. A browser console probe does not prove the same global exists inside a message iframe, script iframe, prompt template, or STScript pipeline.

## Confidence rules

- **High**: exact fact read from matching runtime source, official versioned documentation, or declarations corroborated in the target runtime.
- **Medium**: declaration-only, changelog-only, single-source, or version-adjacent fact. Add a capability probe or a real-runtime test.
- **Low**: inferred, conflicting, or unversioned fact. Do not implement from it; resolve the conflict first.

A moving branch name such as `main`, `release`, or `beta` is not a version identity. If it is useful only for navigation, label it as such. Any example containing an exact event value or callback signature must cite an immutable commit or matching installed source and must not be presented as the answer for a different or unidentified runtime.

Keep declaration truth separate from runtime truth. A declaration can establish spelling and a nominal type while leaving callback timing, lifecycle, side effects, or actual availability unverified.

## Implementation rules

- Prefer Tavern Helper wrappers when they provide the required operation. Use `window.SillyTavern.getContext()` only for core state or APIs not covered by the wrapper.
- Treat injected global functions and `window.TavernHelper` properties as two access forms of the same helper surface only after checking the installed version.
- Prefer the current `WorldbookEntry` API family: `getWorldbook`, `replaceWorldbook`, `updateWorldbookWith`, `createWorldbookEntries`, and `deleteWorldbookEntries`. Do not introduce deprecated lorebook-entry APIs into new code.
- Prefer updater functions or entry-level helpers over whole-object replacement. Preserve unknown fields, entry identity, unrelated user content, and the intended chat/character/global scope.
- Distinguish `generate` from `generateRaw`: the latter supplies its own ordered prompts. Neither should be assumed to create a normal chat turn or to run MVU parsing automatically.
- Treat message floors and swipes explicitly. Read with `include_swipes: true` when alternate pages matter, and choose the smallest `refresh` scope after writes.
- Wait for optional globals such as `Mvu` before use. Subscribe with exported event constants, especially where upstream string values contain historical spelling mistakes.
- Do not infer a provider, installation state, or delivery class from an API
  identifier alone. Trace the actual card script, import, manifest declaration, and
  runtime registration path.
- Treat packaged domestic/global MVU Zod scripts as card assets whose presence and
  enabled states must match the card contract. Treat the Git/CDN modules imported by
  those scripts as remote delivery. Do not replace this packaged loading path with a
  standalone Zod installation instruction.
- Treat a remote import as runtime delivery, not proof of installation or execution.
  Record its URL/ref, fallback, and readiness probe.
- Keep macros for substitution. A macro that writes variables may run during preview, swipe, or re-render; use an explicit transaction when timing matters.
- Preserve STScript pipe values, named-argument syntax, quoting, and closure delimiters exactly as documented. `/send` adds a message but does not itself trigger generation.
- Add cleanup for listeners, prompt injections, timers, and shared interfaces when their lifecycle can outlive the current operation.
- Never expose API keys, authentication data, extension settings, or private chat content in logs or examples.

## Resolve disagreements

When sources disagree:

1. Check that they describe the same surface and release.
2. Prefer the target runtime implementation over a guide or declaration.
3. Prefer a raw declaration or command/macro reference over a narrative summary for exact spelling.
4. Downgrade confidence and supply a minimal runtime probe when behavior is still unclear.
5. State the unresolved fact instead of presenting a guessed snippet as runnable.

## Output contract

For API-dependent answers or patches:

- name every runtime or extension dependency;
- state whether each dependency is host-provided, card-embedded, remote-loaded,
  optional, regional, or development-only;
- state the detected or assumed version;
- identify the exact authority used for each sensitive symbol;
- provide code for the correct execution context;
- label any capability probe or real-runtime check still required;
- avoid claiming that static inspection proves message creation, event timing, iframe access, or MVU persistence.

When the user has not supplied enough identity to resolve an exact API question, the correct output is a short evidence request plus a safe runtime probe plan. Do not pad that response with an unversioned exact signature.
