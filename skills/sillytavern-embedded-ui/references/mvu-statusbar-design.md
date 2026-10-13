# MVU status-bar design

Use this reference to turn existing MVU state into a useful read-only status bar.
It applies to the MVU subsystem of an `mvu_zod` or `hybrid` card and to honestly
identified legacy capabilities. Rendering a status bar does not establish a Zod
schema, migrate a card, or prove that state was saved. Message-derived content
follows [message content pages](message-content-ui.md).

## Begin with the reading task

Apply the shared [frontend design quality standard](../../consult-tavernweave-library/references/frontend-design-quality.md).
Actively search the web and inspect design references relevant to this surface.
Translate the author's intent into a considered visual direction and show its
layout visually; do not copy a generic dashboard merely because it has progress
bars. A HUD needs an identity appropriate to the work and must remain quick to
read on repeated use. Report inaccessible reference material honestly.

The Agent develops the solution rather than handing the author a technical form.
Determine what the player needs to understand at a glance, then place less frequent
detail where it can be reached without obscuring that summary. A request such as
“click an avatar to see her state” needs a source for the avatar, the intended
selection behavior, and a clear empty case. Fill routine implementation choices
within the authorized design. One coherent proposal is enough; do not force a
choice of frameworks or repeat approval already given.

Use the [optional worksheet](../assets/templates/mvu-statusbar-design.md) only when
it helps maintain this mapping. Reuse an equivalent project record. A small repair
does not reopen every layout or schema decision.

## Verify the source before binding fields

Read the current variable design, schema, initialization, and existing consumers
where available. Re-read maintained files before implementation rather than
requiring the author to paste material the Agent can access. Resolve conflicts
through the existing source authority; do not simply prefer the newest-looking
value or silently repair a save.

For each displayed item, record its purpose, authoritative source, exact path and
scope, data shape, and presentation. Include a range or unit only when the existing
field design supplies one. Distinguish static copy, stored state, and a derived
view. A display calculation must not become a second stored variable or a new
writer. Return a genuinely missing gameplay field to the builder's
[variable design](../../tavern-card-builder/references/variable-systems.md).

An empty record or list does not reveal the structure of future items. Obtain the
shape from the schema or approved design. For dynamic content, identify real keys,
ordering, optional child fields, and the behavior when a selected item disappears.
Use stable identity for refreshes. An index is suitable only if the adopted list
semantics make it stable enough for that view.

Choose the full read path required by the verified API. Do not universally prepend
`stat_data.` when the actual reader already returns that subtree. Confirm the
target chat, message floor and swipe as applicable. Reading whichever scope happens
to contain a matching key is not an acceptable fallback.

## Preserve data meaning in the display

Define separate behavior for valid zero, `false`, an empty value, missing data,
`null`, and an invalid value according to the field contract. Do not use blanket
truthiness or numeric coercion that turns a missing value into a believable zero.
If a number is invalid, display an honest unavailable/invalid state; clamping a
progress fill must not silently rewrite the source or disguise an invalid value.

Use a progress indicator only when its range has meaning. Preserve an actual enum
label or show an unknown-value diagnostic rather than inventing its nearest stage.
Do not make a color or progress percentage imply a character's consent, knowledge,
or relationship status unless the approved state design explicitly owns that fact.

Read-only is a behavior boundary: refreshing, switching roles, or opening a panel
must not initialize variables, advance a stage, or normalize saved data. Existing
permission/knowledge rules determine what the player may see; the mere presence
of a field does not authorize exposing it. A requested state editor uses the
project's authorized write path as a separate capability, not a hidden side effect
of this display.

## Select an implementation that fits the project

Reuse the maintained stack when suitable. Native HTML can handle lists and tabs;
a framework may help with repeated structures or reactive views, but neither is
chosen solely from one feature. Do not import the workshop's build environment or
force a fixed JavaScript skeleton. Verify optional runtime globals and their
failure behavior in the exact execution context through `sillytavern-api-reference`.

Keep paths and formatting centralized. Separate transient view state from game
state, and preserve the active tab or expanded section across data updates when
practical. Reconcile a removed selection using the adopted UI rule rather than
selecting a different character silently. Persist UI preferences only when needed,
with a declared scope; they do not belong in MVU by default.

Initialize through the actual readiness path, read the intended floor, and refresh
from verified events. Make repeated binding safe and keep cleanup with its owner.
Do not add polling, global listeners, or a second state store merely because a
workshop example contains them. A deliberate refresh rereads state; it does not
trigger generation or initialize an absent save.

## Make the display complete

Arrange the core summary first, then detail groups that match the player's task.
Use typography and spacing to establish hierarchy without shrinking every label.
Avoid redundant English headings and decorative microcopy under the shared
quality rule. Keep useful units, functional labels, and the author's chosen prose.
Specify the narrow-container layout rather than writing only “responsive.”

Use legitimate project media sources with a fallback. Do not require new hosting
for valid embedded or runtime-provided assets, invent resource URLs, or assume
that a host avatar API exists. A resource failure must leave the state readable.

Define loading, not initialized, empty collection, partial/malformed data, read
failure, and stale state where applicable. Do not collapse all of them into blank
content. An error in one optional field should not erase unrelated valid state.
Expose recovery that actually exists; do not show a retry button with no behavior.

## Review and handoff

Trace each item from the field contract to its actual displayed value. Select
representative cases: zero and `false`, allowed empty values, missing data, an
unknown enum, long text, collection changes, and a removed selection. Check that
refreshes preserve appropriate view state and cause no game-state writes. Use
synthetic or authorized data; do not inject test values into a real save.

Reuse the project's existing checks and optional sandbox. Inspect the rendered
candidate where possible, including a narrow container and the actual failure
states. For authorized runtime work, hand the exact artifact to
`sillytavern-runtime-debug` with floor/scope, event, and lifecycle cases. Source
mapping, visual review, actual MVU refresh, persistence, and author acceptance each
need their own evidence; a successful screenshot cannot establish the others.
