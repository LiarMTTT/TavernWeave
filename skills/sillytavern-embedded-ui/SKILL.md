---
name: sillytavern-embedded-ui
description: Design, implement, or review framework-neutral embedded interfaces for SillyTavern rolecards, including opening pages, status bars, control centers, drawers, and popups. Use for HTML/CSS/JavaScript structure, interaction states, responsive behavior, accessibility, safe rendering, host-integration contracts, source-side real-time compilation loops, supporting checks, and defining the real-runtime handoff. Do not use as the primary skill to reproduce or close behavior in a live SillyTavern instance; hand that work to sillytavern-runtime-debug.
---

# SillyTavern Embedded UI

Before designing or changing an embedded interface, use `$consult-tavernweave-library` with the `sillytavern-embedded-ui` route. Read A0, the smallest matching UI/mobile guides, and selected design/motion references; every selection remains `proposed` until the project authority adopts it.

Build the smallest maintainable interface that fits the rolecard's actual lifecycle. Use semantic HTML, CSS, and JavaScript as the portable baseline. Adopt a framework only when the existing project already uses it or the interaction complexity clearly justifies it.

## Own the implementation boundary

Own embedded-UI design, source implementation or review, supporting validation, and the acceptance criteria handed to runtime testing. Do not operate a live SillyTavern session or claim runtime acceptance under this skill.

When behavior must be reproduced or accepted in the target runtime, hand the exact built artifact and the relevant checklist to `sillytavern-runtime-debug`. If that runtime pass finds a UI source defect, resume implementation here, rebuild, and return the new artifact revision for runtime closure.

## Identify the surface

Choose the surface before designing components:

| Surface | Primary job | Lifecycle |
| --- | --- | --- |
| Opening page | Configure one opening and submit a real player message | Ends after successful opening commit |
| Status bar / HUD | Show frequently read game state near messages | Recreated or refreshed with message/runtime lifecycle |
| Control center | Manage settings, packages, world data, and advanced actions | Usually long-lived and singleton |
| Popup / drawer / modal | Focus one detail or decision without losing surrounding state | Temporary, with explicit open and close behavior |

Do not turn a small set of alternate greetings into an application, or make a status bar carry control-center workflows.

## Inspect before designing

Read the existing HTML, CSS, JavaScript, data schema, regex/mount path, and runtime ownership. Record:

- where the UI is rendered: message body, Tavern Helper frame, nested frame, or host document;
- the trusted code boundary and all untrusted user/model/remote values;
- the state source and scope: draft, local UI settings, chat, message floor, worldbook, or MVU `stat_data`;
- lifecycle events that recreate the DOM;
- existing design tokens, selectors, and component patterns worth reusing;
- the smallest desktop and mobile containers the UI must support.

Review structure and state flow before polishing color or decoration.

## Keep state ownership explicit

Separate these concerns:

```text
data state       persisted game or configuration data
draft state      reversible, unconfirmed user input
UI state         active tab, open panel, focus, scroll, and transient errors
derived view     formatted values, counts, progress, and summaries
```

Do not persist tabs, accordions, or scroll positions into worldbooks or MVU unless they are intentionally part of gameplay. Do not write formal game variables on every draft edit. Preserve user-controlled view state across data refreshes when practical.

Use one builder for any content that appears in preview, validation, and final submission. Avoid parallel templates that can drift.

## Structure and styling

- Use semantic controls: real `button`, `input`, `select`, `textarea`, headings, lists, and dialogs where supported.
- Namespace IDs, storage keys, custom events, CSS variables, and classes per card or feature.
- Use stable `data-*` attributes for JavaScript bindings. Treat decorative classes as styling, not the business protocol.
- Prefer a small token layer for background, text, border, accent, spacing, radius, and type scale.
- Use `box-sizing: border-box`, `min-width: 0` on shrinking flex/grid children, and predictable internal scroll regions.
- Use fluid grids such as `repeat(auto-fit, minmax(...))`, wrapping controls, and `min()`/`max()`/`clamp()` constraints.
- Avoid fixed widths that exceed a narrow message container. Avoid `100vh` as the only height strategy on mobile.
- In an iframe, reason from the iframe or component container, not the host window. Use container measurements when the effective width is ambiguous.
- Keep operational surfaces dense but organized. Reserve hero-scale typography and spectacle for true opening moments.
- Avoid nested card borders and excessive blur. Provide a non-blur fallback when using `backdrop-filter`.

## Render defensive data

Treat all user, model, package, and remote content as untrusted.

- Prefer `textContent` and DOM construction for text values.
- If HTML is genuinely required, sanitize it with the trusted runtime sanitizer before insertion and do not mutate the sanitized string afterward.
- Escape all values interpolated into HTML attributes. Validate URL protocols and origins.
- Do not insert model output with `innerHTML`.
- Normalize unexpected `null`, arrays, objects, long strings, missing fields, and unknown enum values.
- Clamp progress values and sizes; provide fallback labels and colors.
- Let long CJK and unbroken text wrap, collapse, or scroll intentionally.
- Show malformed or unsupported data as a diagnostic state rather than silently hiding it.

For remote UI, prefer declarative HTML plus a trusted local binder. Enforce HTTPS or a trusted local source, timeout, size limit, integrity or release pinning, protocol version, required-node validation, and sanitization. Reject remote scripts, nested frames, base URL changes, and automatic forms unless a separately reviewed design requires them.

## Lifecycle and integration

- Initialize through the runtime's actual readiness path, not only `DOMContentLoaded`.
- Make binding idempotent. A compatible existing instance should be reused; an incompatible instance should be destroyed before replacement.
- Keep a single cleanup path for event disposers, observers, timers, fetch abort controllers, temporary DOM, body scroll locks, and shared globals.
- Capability-check parent-document access and wrap cross-frame access in `try/catch`.
- Wait for optional integrations such as MVU before reading their events or data.
- Read the intended message floor or persistence scope explicitly.
- Debounce event-driven refreshes and prevent concurrent renders.
- Prefer event delegation for dynamic lists. Avoid inline handlers that depend on module-scoped functions.
- Preserve unrelated user data and re-read after writes.

SillyTavern may namespace classes in static message HTML. Dynamic DOM added later may not receive the same transformation. Verify raw class tokens and computed styles in the real runtime; do not infer correctness from an offline preview.

## Use real-time compilation during implementation

When the user requests real-time editing, keep source implementation here and use
`sillytavern-card-pipeline` to discover and run the target project's existing watcher.
Do not invent a universal `watch` command, port, local server, or output mapping.

Before editing, record the maintained source, the exact development output consumed by
the card, and the current successful build marker. After each edit:

1. wait for a successful rebuild and stop on compiler errors;
2. hand the new output identity to `sillytavern-runtime-debug`;
3. verify that Tavern Helper reloaded the intended message or script iframe, or use the
   project's declared manual refresh/rebind fallback when live listening is unavailable;
4. inspect the resulting DOM, console, interaction, and data state before continuing.

A connected listener does not prove the newest source compiled, and a successful watch
build does not prove SillyTavern loaded it. Keep both receipts. Use the live loop to
shorten implementation feedback, then run the production build and hand its exact
artifact to the final runtime acceptance pass.

## Opening pages

Treat `first_mes` as a real assistant message that participates in context, swipes, edits, branches, export, macros, regexes, and rendering.

- Prefer native `first_mes` and `alternate_greetings` for a few fixed openings.
- For a custom wizard, keep the visible mount small and keep large UI markup out of model context.
- Isolate drafts by stable chat identity; validate and migrate stored drafts.
- Make preview read-only. Show the final player message and every persistent effect.
- Freeze the chat/draft context at confirmation and recheck it before writes and send.
- Snapshot mutable targets, make retry idempotent, and put irreversible actions last.
- Use the normal SillyTavern send path so a real user message and a real assistant reply are created.
- Preserve existing input text and leave the message available for manual send if automation fails.
- Mark the opening committed only after the real user message is confirmed.
- Exit the opening workflow after success; subsequent play returns to the normal multi-message flow.

## Status bars and HUDs

- Optimize for repeated scanning, not spectacle.
- Show useful loading, empty, unavailable, malformed-data, and stale states.
- Centralize variable paths and formatting. Never scatter schema paths through component code.
- Read `stat_data` from the intended floor and refresh from documented events.
- Keep filters, tabs, and mode switches quick to understand.
- Collapse, wrap, truncate with an accessible full-value affordance, or scroll long values intentionally.
- Preserve the active tab, scroll position, expanded sections, and user-selected map/view state across data refreshes.
- Prevent duplicate frames or mounts after swipe, edit, or rerender.
- Use a signature or focused update to avoid rerendering unchanged sections, but provide a deliberate forced refresh after user actions.

## Control centers

- Keep the main status and primary actions visible; do not bury them under settings.
- Separate entry control, shell geometry, content rendering, and data operations.
- Make the panel singleton and restore its entry after chat or host UI rebuilds.
- Isolate section render failures so one malformed field does not blank the whole panel.
- Explain offline, unauthenticated, dependency-missing, partial-success, and retry states.
- Preview worldbook, package, identity, or variable mutations before committing them.
- Do not use a control center as a hidden second source of truth for an opening-page transaction.

## Popups, drawers, and modals

- Mount overlays in a layer that is not clipped by an ancestor's `overflow`, `transform`, or filter. In non-framework code, a dedicated overlay root under the accessible document body is the equivalent of a portal.
- If host-document access is unavailable, use an in-panel absolute overlay with a deliberate scroll strategy.
- Constrain width and height to the actual container and provide an internal scrolling body.
- Move focus into the surface, keep focus within a true modal when appropriate, close with Escape, and return focus to the opener.
- Give the backdrop and close button unambiguous behavior; do not make destructive actions easy to dismiss accidentally.
- Preserve and restore any body scroll or cursor changes.
- Test nested confirmation flows, long content, the mobile keyboard, and reduced-height viewports.

## Accessibility gate

- Maintain logical heading order and DOM reading order.
- Give every control an accessible name and every field a visible label.
- Expose active tabs, expanded sections, selected values, busy state, and validation errors through appropriate ARIA state.
- Use `aria-live` for asynchronous status or errors when necessary.
- Keep keyboard navigation complete and focus visibly styled.
- Do not communicate state by color alone.
- Target touch controls around 44 by 44 CSS pixels where space permits.
- Respect `prefers-reduced-motion`; avoid essential information that exists only during animation.
- Check text contrast, 200% zoom/reflow, long CJK text, and screen-reader-friendly error association.

## Prepare the runtime handoff

Static linting, unit tests, and offline previews are supporting checks. Use them to prepare an implementation candidate, then hand the built artifact to `sillytavern-runtime-debug` for real-SillyTavern execution evidence and acceptance closure. Do not mark runtime cases as passed here unless citing a separate runtime-debug report for the same artifact revision.

Select the relevant runtime cases and include them in the handoff:

| Area | Runtime-debug evidence requested |
| --- | --- |
| Rendering | Fresh chat, each opening swipe, message edit, rerender, reload, and chat switch |
| States | Loading, empty, long data, malformed data, missing dependency, network failure, retry, and partial success |
| Interaction | Pointer, keyboard, focus return, repeated click, cancel, close, and input preservation |
| Layout | Wide desktop, narrow message container, approximately 320px width, short viewport, zoom, and mobile keyboard |
| Style | Computed display, size, overflow, stacking, transformed class names, dark/light context, and reduced motion |
| Data | Correct scope/floor, event refresh, persistence after reread, no unrelated mutation, and no duplicate commit |
| Security | User/model text remains inert; remote markup cannot execute business logic; no secrets appear in DOM or logs |

For an opening page, request this end-to-end runtime gate: open page, edit draft, refresh and restore, preview, confirm, create a real user message, receive a real assistant message, and observe the intended variable initialization. For a HUD or control center, request swipe/edit/chat-switch lifecycle checks and actual computed-style inspection.

## Deliverable

Report:

- the selected surface and state ownership;
- the smallest implementation or review findings;
- security and accessibility decisions;
- supporting checks and desktop or narrow-layout evidence;
- the exact built artifact identity and selected runtime handoff cases;
- known device, account, extension, or driver blockers for `sillytavern-runtime-debug`.
