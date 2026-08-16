---
name: sillytavern-runtime-debug
description: Reproduce, diagnose, collect execution evidence for, and close acceptance of rolecard behavior inside a real SillyTavern runtime using any capable browser driver. Use when the primary task requires live execution of imports, required regex/helper scripts, host extensions, Git/CDN or regional loaders, MVU/Zod capabilities, opening pages, status bars, control centers, iframes, real-time reload, console, responsive, or interaction checks that static previews cannot prove. Do not use as the primary skill for designing or implementing embedded UI source; hand those changes to sillytavern-embedded-ui, then resume runtime validation on the rebuilt artifact.
---

# SillyTavern Runtime Debug

Use `$consult-tavernweave-library` with the `sillytavern-runtime-debug` route for the relevant host and deployment guidance. Add A0 before any write or host mutation, and keep recalled guide advice separate from evidence captured in the named real SillyTavern instance.

Close runtime bugs with evidence from the real target SillyTavern instance. An offline HTML preview can support development, but it cannot establish import behavior, message rendering, extension injection, iframe access, event timing, persistence, or MVU updates.

## Own the runtime boundary

Own live reproduction, browser execution, direct runtime evidence, and acceptance closure. Do not own embedded-UI design or source implementation.

When a live pass identifies a UI source defect, report the minimal reproduction, failing layer, and required acceptance criteria to `sillytavern-embedded-ui`. After receiving a rebuilt artifact, verify its exact revision, re-import it as needed, and resume the same runtime matrix. Never close runtime acceptance from the UI skill's offline or static evidence alone.

## Use a driver capability contract

Use whichever available browser driver can safely provide the required capabilities: an in-app browser, an attached user browser, Playwright, WebDriver, or CDP. Do not bind the workflow to one product or tool prefix.

Before starting, confirm the driver can perform the operations the test needs:

- open or attach to the target SillyTavern page;
- inspect the top document and enumerate frames;
- collect console errors and warnings with frame context;
- evaluate read-only JavaScript in the top document and selected same-origin frames;
- inspect attributes, text, geometry, and computed styles;
- click, type, select, scroll, and press keys;
- change viewport size or emulate a narrow layout;
- capture screenshots when visual evidence adds value.

If a capability is absent, adapt the test or state the gap. Never pretend a screenshot proves console state or that top-frame evaluation proves iframe state.

## Verify the real-time development chain

When a project uses a source watcher plus Tavern Helper real-time editing, verify each
link separately:

```text
source edit -> successful rebuild -> expected development output changed
            -> listener connected -> intended iframe reloaded -> new behavior observed
```

Obtain the watcher command, output path, and rebuild receipt from
`sillytavern-card-pipeline`. Detect the listener control and connection state from the
installed Tavern Helper version; do not assume a settings label, URL, or port from a
different version. Then:

1. capture the current output identity and target iframe identity;
2. wait for a successful rebuild after the source edit;
3. observe the listener-triggered reload, or perform the declared manual
   refresh/rebind fallback;
4. confirm the rebuilt output is the one now executing using artifact identity,
   frame replacement, a project-provided revision marker, or another direct signal;
5. collect console, DOM, interaction, and data evidence from the reloaded runtime.

If compilation fails or the listener disconnects, the page may still be running the
previous successful artifact. Report that stale-artifact boundary instead of treating
the new source as tested. Live reload accelerates iteration but does not close release
acceptance: repeat the selected matrix against the exact production-built artifact,
with a fresh import, chat, or binding when the feature lifecycle requires it.

## Establish the test boundary

Record before reproduction:

- SillyTavern version and relevant extension versions;
- target character/card identity and artifact revision;
- declared primary card type, capability flags, runtime dependency ledger, and selected
  regional loader;
- current chat identity, selected opening swipe, and message count;
- browser, viewport, zoom, color scheme, and device class;
- whether the artifact was freshly imported or already present;
- which actions may mutate chat, worldbook, variables, settings, or account state.

Do not assume an installation path, port, launch configuration, account state, character file location, or iframe ID. Discover them from the active environment. Do not log API keys, cookies, authentication data, or private extension settings.

## Reproduce before changing anything

1. Start from the user's reported state when preservation matters.
2. Capture a minimal console baseline before the action.
3. Perform one reproducible action at a time.
4. Capture visible result, DOM state, computed style, frame state, and new console output.
5. Repeat once to distinguish deterministic failure from timing or stale-state behavior.

For import-sensitive code, verify the exact built artifact is loaded. Prefer the SillyTavern import UI or another user-authorized, reversible path. Do not overwrite files in an installation data directory as a default debugging technique.

When a new artifact or binding script should take effect, test a fresh chat unless the feature explicitly supports rebinding an existing one. Old message DOM, cached scripts, opening-page guards, and persisted settings can otherwise mask the result.

## Map the runtime

Build a small frame and ownership map instead of guessing selectors:

```text
top SillyTavern document
  -> chat message container and rendered message body
  -> message-owned iframe, if present
  -> long-lived Tavern Helper script iframe, if present
  -> card-created nested iframe, if present
  -> host-mounted control panel or popup, if present
```

For each frame, record its stable identifying evidence, origin, accessibility, owning message or script, and relevant globals. Prefer semantic or `data-*` selectors. Treat generated IDs, message indexes, and frame order as unstable.

Use guarded same-origin access:

```javascript
function readableFrame(frame) {
  try {
    return frame.contentWindow && frame.contentDocument
      ? frame.contentWindow
      : null;
  } catch {
    return null;
  }
}
```

If access is cross-origin, switch the driver into that frame when supported or use its documented bridge. Do not weaken sandboxing or security controls to make inspection convenient.

## Diagnose by layer

Follow the failing chain from earliest observable input to final UI:

```text
artifact/import
  -> card fields and regex
  -> message text and rendering
  -> Tavern Helper or extension frame
  -> optional global initialization
  -> variable/worldbook/message data
  -> DOM binding and event refresh
  -> layout, interaction, and persistence
```

### Import and artifact

- Confirm the imported character matches the expected name, version, and payload revision.
- Re-inventory character-local regexes and Tavern Helper scripts from the imported
  artifact. Confirm every required schema, loader, binding, worldbook, and host
  extension is present and enabled under the declared policy.
- Confirm a regional-alternative group has the intended member enabled and no
  unintended double activation.
- Use a new chat when testing first-message, alternate-greeting, or mount behavior.
- Distinguish a rebuild failure from a stale imported artifact.

### Runtime dependencies and remote loaders

- Probe every `host_required` extension or capability in the correct frame and scope.
  A packaged script is not proof that its host exists.
- Verify every packaged domestic/global MVU Zod script promised by the card and check
  that its enabled state matches the manifest or packed baseline. Then verify the
  selected script's remote module and the schema-registration helper actually execute
  in the Tavern Helper context. Do not silently install a package or substitute a
  different provider.
- For `remote_runtime`, capture the requested URL/ref, primary/fallback attempt,
  network failure, module exception, and expected readiness capability.
- Treat HTTP success as transport evidence only. Confirm the module executed and
  published the expected global, registration, DOM marker, event, or other readiness
  signal.
- For domestic/global or other `regional_alternative` loaders, test the selected
  member and its declared fallback. Do not enable both merely to make one pass.
- Keep `development_only` packages out of player setup and runtime failure reports.

### Console and exceptions

- Capture errors and warnings from the top document and relevant frames.
- Record the first causal error, not only downstream null-reference noise.
- Deduplicate repeated frame-hook output by message, stack, frame, and time.
- Preserve rejected promises, CSP failures, network errors, and syntax errors.

### DOM and style

- Inspect the actual target element, its ancestors, and its owning frame.
- Compare raw class tokens, stable attributes, computed display/position/size/overflow, and bounding rectangles.
- Check whether SillyTavern's message sanitization or class namespacing changed static content.
- Remember that DOM injected after the host sanitization pass may not receive the same class transformation as static message HTML.
- Test long text, empty data, hidden state, nested scrolling, and popup clipping.

### Runtime data

- Wait for optional globals through their documented initialization path.
- Read the precise intended scope: current message, latest message, chat, character, script, or global.
- For MVU, inspect `stat_data` on the intended message floor and observe lifecycle events instead of assuming a write completed.
- For worldbooks, re-read the target book and binding after a mutation; do not infer success from a toast.

### Interaction

- Test real pointer/keyboard actions, not only direct method calls.
- Verify focus movement, disabled states, duplicate submission guards, escape/close behavior, and input preservation.
- After chat switches, swipes, edits, or rerenders, verify that listeners and singleton mounts neither disappear nor duplicate.

## Use reversible runtime prototypes

A temporary DOM or JavaScript prototype may help isolate a cause. Keep it explicitly diagnostic:

- make the mutation small and reversible;
- record exactly what was injected or changed;
- do not write persistent user data unless the test requires it and the user authorized it;
- remove temporary IDs, listeners, styles, and values or reload the page;
- never count the prototype as the delivered fix.

After a source fix, rebuild and re-import the artifact, then reproduce from a clean runtime state with no prototype code present.

## Handle long actions and timeouts

Split long operations into action and observation phases:

1. initiate one action;
2. allow the driver call to return or time out;
3. poll a cheap, read-only marker such as chat identity, message count, mount presence, or readiness state;
4. determine success from the observed state, not solely from the original call's return status.

A driver timeout can occur after a side effect succeeded. Conversely, a resolved call does not prove rendering or persistence completed.

## Acceptance matrix

Select the rows relevant to the change and record pass/fail evidence:

| Dimension | Required evidence |
| --- | --- |
| Import | Expected artifact is selected and its scripts/regexes/bindings are present |
| Dependencies | Host capabilities, embedded requirements, remote execution, and regional selection match the ledger |
| Fresh chat | First message or opening mount appears without manual injection |
| Console | No new causal errors or unhandled rejections |
| DOM | Correct element count, ownership, attributes, and no duplicate mounts |
| Style | Computed dimensions, display, overflow, and class transformation are correct |
| Interaction | Click, keyboard, form, close, and repeat actions produce the intended state |
| Data | Correct floor/scope changed; re-read confirms persistence and unrelated data remains |
| Lifecycle | Reload, swipe, edit, chat switch, and rerender do not leak or lose behavior |
| Responsive | Narrow and wide viewports work; long CJK text and controls do not clip |
| Security | Untrusted text stays inert; no secret or private configuration is exposed |

Runtime work is complete only when the source-built artifact passes the selected real-SillyTavern checks. Keep offline tests in the report as supporting evidence, not as a substitute.

## Report

Return:

- the minimal reproduction;
- the failing layer and root cause, with direct evidence;
- versions, artifact identity, browser, and viewport;
- detected card type/capabilities plus embedded, host, remote, regional, optional, and
  development-only dependency status;
- the implementation handoff and rebuilt/imported artifact state, when a UI source change was required;
- checks that passed;
- checks still blocked by unavailable devices, accounts, extensions, or driver capabilities.
