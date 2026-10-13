# MVU status-bar worksheet

Optional Agent working aid for [MVU status-bar design](../../references/mvu-statusbar-design.md).
Reuse existing records. The Agent fills relevant decisions from the current
sources and the author's intent; this is not a questionnaire or a second variable
ledger. Skip sections unrelated to a focused change.

## Reading task and design

- What the player must understand at a glance:
- Existing implementation and authorized change:
- References actually searched and visually inspected; useful observations:
- Chosen visual idea and its fit to the work:
- Visual layout: core summary, reachable detail, narrow-container behavior:
- Useful copy retained and decorative noise removed:

Apply [frontend design quality](../../../consult-tavernweave-library/references/frontend-design-quality.md).
Develop the design actively and show it visually. Do not force multiple proposals
or ask again for an approved design.

## Display mapping

- Current variable design/schema/initialization references and revision:
- Verified reader, target scope and floor/swipe identity:

| Display and purpose | Authoritative path/source | Shape; valid range or unit | Presentation and condition | Missing/empty/invalid behavior |
| --- | --- | --- | --- | --- |
| Fill only fields this view needs | | | | |

- Fixed copy and derived views, with their basis:
- Dynamic items: shape, stable identity, order, empty case:
- Selection default and behavior if the selected item disappears:
- Visibility/knowledge constraints inherited from the card:

Do not guess collection shapes from an empty initializer or add state to satisfy a
layout. Valid zero and `false` retain their meaning; fallback text is not a save repair.

## Implementation

- Existing stack and smallest suitable implementation:
- Transient view state; any explicitly adopted persistence scope:
- Readiness, refresh events, cleanup and deliberate reread:
- Resource delivery and fallback:
- Applicable loading, empty, failure and stale states:
- Separate authorized write capability, only if actually requested:

## Evidence and delivery

- Field-to-display and representative data cases checked:
- View state preserved across refresh; no unintended state writes:
- Rendered revision and viewport actually inspected:
- Maintained artifacts and affected consumers:
- Remaining real-host, persistence and author checks:

Use synthetic or authorized test data in the declared test scope. A static review
does not prove that MVU updated, that Zod enforced the schema, or that the host
loaded this revision.
