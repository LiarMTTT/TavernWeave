# Message content pages

Use this reference for letters, journals, forums, dossiers, task panels, and similar
interfaces whose changing content comes from a message. A page displaying MVU state
instead follows [MVU status-bar design](mvu-statusbar-design.md). An interface may
use both sources when the adopted design assigns each displayed fact an owner;
do not turn an ordinary message page into a variable application without a need.

## Design from the author's intent

Apply the shared [frontend design quality standard](../../consult-tavernweave-library/references/frontend-design-quality.md).
Actively search the web and inspect relevant design references before settling a
new visual direction. Use what was actually observed to develop a distinctive,
appropriate composition; a copied gallery layout or a generic panel with a changed
accent color does not satisfy that standard. If access is unavailable, record the
limitation rather than claiming that references were inspected.

The Agent translates the author's wish into a workable design. Infer ordinary
implementation details within the delegated scope, explain the important design
choices, and show the proposed layout visually. One well-developed proposal is
sufficient. Do not require a questionnaire, manufacture alternatives, or ask again
for a design already approved. Ask only when an unresolved decision changes the
author's intended experience or authority.

Establish what the reader should notice first and what the page lets them do.
Read existing source before choosing its message boundary, mount path, or visual
language. Determine when the page appears and whether normal prose remains outside
it. A small restyle should reuse the existing protocol unless changing it is needed
and within scope. The [optional worksheet](../assets/templates/message-content-ui.md)
is an Agent working aid, not a form the author must complete.

## Choose the smallest content protocol

For a letter or journal that needs only typographic treatment, preserve the text
inside one agreed boundary. Do not invent date, signature, title, or metadata
fields solely to fill a design. Add structure when a fixed layout, repeated item,
or interaction actually needs stable fields.

For structured content, define the outer boundary, fixed fields, and any repeated
item. Give each optional field a missing-value meaning. Record item ordering and
the empty-list behavior. Prefer the shallowest format that expresses the content;
use the project's existing format when suitable instead of requiring XML-like
tags everywhere. Names must not collide with the preset, another page, or reserved
reasoning/output markers in the actual card.

Maintain a single mapping from each content field to its parser and visible use.
Specify required fields, malformed input, duplicate boundaries, and any permitted
escaping. The parser must preserve text that contains delimiter-like characters
according to that protocol; a permissive regex is not proof that nested or repeated
structures are unambiguous. Do not recover missing content from another message,
an invented example, or an old render without an explicitly adopted source rule.

Separate three artifacts:

| Artifact | Purpose | Keep out |
| --- | --- | --- |
| Authoring worksheet | Record intent, design decisions, field mapping, implementation and evidence | It is not automatically model-visible |
| Runtime output rule | Tell the receiving model when to produce which content in the agreed format | Design rationale, parser code, CSS, installation notes and review instructions |
| UI and mounting source | Read the declared source, parse it and render the page | New story facts, hidden state authority or unrelated write operations |

An authoring format skeleton may use clearly marked placeholders that explain what
belongs in each slot. Compile the
actual runtime rule so required structure and replacement semantics are explicit;
do not send unresolved worksheet blanks or mock story values as finished content.
If the card already provides the needed output rule, reuse it rather than adding a
duplicate worldbook entry. Synthetic parser fixtures remain test material.

## Connect generation, mounting and rendering

Trace the runtime rule's activation and recipient, the generated source text, the
mounting transformation, and the parser's output. Use the builder's
[worldbook policy](../../tavern-card-builder/references/lorebook-and-prompts.md)
for entry settings. A keyword must be available before generation if it activates
the rule; a page generated later cannot retroactively activate its own instruction.
Do not impose universal D0 placement or numeric order ranges.

For a raw-message parser, read the intended message and swipe through the verified
runtime, then extract the agreed content. Avoid sending the same region through
macro/regex formatting again unintentionally. If formatted host content is part of
the adopted design, audit that specific path; this is not a universal ban on host
formatting APIs or regex capture groups. Record whether regex only mounts the UI
or also transforms content, including display/prompt scope and behavior while a
message is incomplete. Preserve prose outside the agreed boundary.

Use `sillytavern-api-reference` for exact calls and execution-context exposure.
Do not freeze a workshop API expression, global framework, or initialization
wrapper into the TW contract. Keep dynamic content inert under the owning UI
skill's rendering rules. A source field must not become a script, event handler,
arbitrary URL, or command merely because it came from the model.

## Design interactions and visual states

State whether a control changes only the current view or creates a real player
message. Tabs and filters do not imply permission to send. For an authorized send,
define the actual text or its derivation, make the action understandable, prevent
duplicate submission, and expose failure. Verify message creation separately from
generation so a retry does not duplicate a message that was already created.
Use the normal, verified turn flow; never execute a command carried in page data.

Choose resources from the project's legitimate delivery paths. Record provenance
and fallback without requiring every image to be uploaded to a new image host.
Do not invent URLs or assume a local path is reachable by players. Design the page
for its actual message container. Show how the layout changes on a narrow screen,
and use the shared quality standard to remove decorative captions or redundant
English text. Preserve author-selected language and useful labels.

Distinguish loading, a page absent by design, an expected boundary missing, empty
content, and malformed content. Add resource or send failures only when those
capabilities are used. Do not insert sample content to make an empty screenshot
look finished. Record what an unfinished streamed region displays and how the final
message replaces it; a streaming redesign is not implied by ordinary beautification.

## Review and handoff

Check the field mapping against the final output rule and maintained UI source.
Select cases that exercise this page: surrounding prose, absent or incomplete
boundaries, repeated items, missing fields, long CJK text, and delimiter-like or
HTML-like text. Include repeated clicks when the page sends messages. These are
targeted cases, not a requirement to build a new generic test application.

The regex runner proves only its declared stages; it does not prove parser or UI
behavior. Inspect the rendered candidate when possible and record the actual
viewport and revision. Hand the exact artifact and remaining cases to
`sillytavern-runtime-debug` for authorized host execution. Static completeness,
browser appearance, host delivery, and author acceptance remain separate evidence.
