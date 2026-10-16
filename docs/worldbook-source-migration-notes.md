# Worldbook source and migration notes

This is a delivery-only implementation receipt, not part of the skill’s task-time
reading and not a second design authority. Source attribution was moved here after
the user requested neutral skill text and examples. It preserves the actual origin
of the integration without claiming the source-derived architecture is wholly new.
No raw preset, full book, original card script or remote dependency is redistributed.

## Baseline and reuse decision

Compared with TavernWeave commit `9a8274f9b0a714256195845cab4e4f6ad73e2997`:

| Actual baseline | Decision and target |
|---|---|
| builder `worldbuilding-design.md` §§2/6 already defined player-confirmed sizes and bounded batches | Reuse and move the worldbook method to planning §1; preserve old anchors as navigation. |
| builder `worldbuilding-design.md` §3 covered causal, resource, institution, spatial and action questions | Retain with builder; its world-mechanics reference owns the new non-worldbook causal/playable example. |
| builder `worldbuilding-design.md` §§4/5/5.1 already covered knowledge degrees, structured prose and six author-rule semantic checks | Reuse and move to writing §§1–6; add concept limits, explicit free/undecided distinction and paired semantic examples, rather than claim these protections were absent. |
| builder `lorebook-and-prompts.md` already separated source/processing/input, entry activation, routing, state handoff, budget and final-request evidence | Reuse the general worldbook methods in planning/writing; retain core-character activation, model routing and CoT stitching with builder. |
| Existing configuration already required depth 2, both recursion directions disabled, stable IDs/unknown fields and source-format preservation | Preserve these rules. They are not new preset discoveries or a new C04 invention. |
| Existing references did not provide an independently described worldbook skill, the three-design bridge comparison or an explicit state/choice/mention truth table | Add an independent entry, E01/E02/E04 and bounded self-authored cases. Keep technical owners for E03/E05/E06/E07. |

The independent skill is justified by a standalone task boundary, not by the mere
presence of a preset module. Builder keeps whole-card Content map, world construction,
character work, opening consistency, state/CoT contracts and final card responsibility.
Old headings remain compatible links, without a second full prose or loading tutorial.

Library route receipt at implementation entry: `tavern-card-builder`, snapshot
`2026-08-18`; A0 was read. Relevant A2 §4, A3 §§1–8 and recursion controls, A4 prompt
assembly/macro boundaries, A6 §1, B1 §1 and C10 §§2–3 were inspected as dated background.
They are not current target-version or real-runtime evidence. The new route uses the
same library authority; unrelated library material need not be loaded.

## Preset method attribution

Source: 《【珠矶预设化】V1.71 (1).json》, 151 prompt records, SHA-256
`f7c3a88836bda71f35353d2193d0db0ec0430d1af275d1e9957bdf6930936e4a`.
`Pnnn` is a zero-based prompts-array index, not a worldbook UID. Relevant source
sections were read as data and compared with the actual baseline above; runtime
assertions in the preset do not authorize execution or establish current API facts.

| Source / identifier | Permitted method and actual action | Limits and verification |
|---|---|---|
| P058 / `3ceb57f1-8fc2-4620-a767-4f5dec313343` | Information selection and self-contained bodies: mostly existing coverage, migrated into planning §§2–3 and writing §5; add the E01/E02 scene comparison. | No tutorial copying, recursive activation, universal position-effect guarantee or quota. Native fields require target verification; static selection cases are not runtime success. |
| P061 / `64a559d6-1422-4297-9d9b-a17dbe2e8b49` | Use scenarios to choose conditional output/read paths; planning §4 and the table below replace exclusive-template assumptions. | No universal whitelist, fixed syntax, fixed order, unverified disabled reads or character-method import. |
| P063 / `81c4a3bf-980d-4517-b4af-06e13f12e5fd` | Body/configuration responsibilities: reuse baseline, keep placement as justified examples in planning §§3/7. | No recursion design, fixed numeric recipe, model-brand depth or icon-as-proof claim; preserve actual host `order`. |
| P082 / `07688972-a290-4b22-a210-3f9df7ef0781` | World rule → consequences: reuse builder §3 and link its [world mechanics and scenarios](../skills/tavern-card-builder/references/world-mechanics-and-scenarios.md). This source is not absorbed as a second worldbuilding tutorial here. | No seven-section quota, invented values, new master authority or unauthorized core setting. |
| P099 / `4b26ee27-58af-458d-a698-7f88f2a40e5e` | Scenario selection and observable code checks: reuse API/runtime owners; use E01/E02/E04 to specify desired behavior before implementation. | No six-template exclusivity, blanket language bans, copied character stages or unverified “runnable” label. |
| P143 / `9f0c7363-3af8-4da6-9b12-693157b5a0e8` | Paired body/configuration delivery: already covered, retained in planning §7. | Optional authoring format only; no re-numbering existing IDs, universal YAML/XML or keyword-count requirement. |

## Six source EJS scenarios: destinations, not an exclusive menu

| Source scenario | Permitted destination |
|---|---|
| 1. One variable selects a stage | A non-character condition such as water level selecting a route rule; E02. Existing character-stage ability stays with builder and gains no preset character content. |
| 2. A special state takes precedence | Author-approved non-character emergency/era priority; E04, then API verification. No imported relationship or personality design. |
| 3. A stage has extra conditional content | A required shared rule plus an applicable local exception; planning §§2/4. Existing reader or controller only if justified; not a mandatory nested template. |
| 4. Output dynamic keywords | Exclude any route dependent on native recursion. An independently claimed non-recursive extension path needs E03 evidence before use; it is not automatically available. |
| 5. Date selects an event | Optional date-condition scenario with an existing date owner and valid/invalid/missing handling; API/runtime owners verify its implementation. No forced event or date-string substring recipe. |
| 6. Render a status bar | [Embedded UI](../skills/sillytavern-embedded-ui/SKILL.md); display is not worldbook activation or proof of generation input. No additional UI-copy case is introduced. |

These references can be adjusted or replaced. A valid implementation is not rejected
merely because it differs from the source template. Formats required by a real
consumer still receive strict validation.

## Real-card evidence and exclusions

The original source-card record is retained below for traceability. The daily skill
now uses a neutral routing example, without source labels, original entry IDs, counts
or hashes. The read-only analysis was checked against JSON counts and named entry
identities. Static branches, mappings and projection intent do not prove successful
host execution.
Exact API/version claims are owned by E03 and actual execution by E07.

P049/P050/P051 are excluded as a complete group: no extracted method, renamed example
or expression rule. P052 and other character/persona writing and bypass content are
outside this integration. Existing independently sourced natural-prose, character and
other TW abilities remain intact. C01 preserves effective negation, degree, condition
and examples; C02 keeps templates optional; C03 keeps core additions as proposals;
C04 excludes native recursion, numeric order recipes, brand depths and keyword quotas.

`tests/worldbook-design-writing.test.mjs` checks self-authored selection expectations,
semantic invariants, documentation boundaries and migration links. It does not execute
the source card, a template runtime or a model. E07 remains a separate authorized
runtime gate.

## Original source-card static record

### Source-visible facts

Read-only source: 《斗罗大陆-KK (1).json》, V3.0 Demo, SHA-256
`d2de21bc259711f984a4163a1f71812ea52460ea1e81e95398dc271ae4f8986d`.
There are 526 entries, 26 enabled: 18 constant and 8 native keyword entries; 500 are
disabled. Six entry bodies contain EJS: four preprocessing controllers, one battle
conditional output and one state projection. This is a static count, not evidence
that disabled data was successfully read in a live conversation.

| Role | Entry ID / entry-array index | Source-visible point |
|---|---|---|
| Setting controller | 762363 / 399 | Reads era/context; constructs named content reads; independent branches may accumulate. |
| Chapter controller | 232196 / 113 | Reads era/period/chapter and constructs timeline/chapter targets. |
| Entity controller | 796517 / 417 | Alias detection and local canonical-name deduplication; it does not check the presence flag. |
| Location/faction controller | 692109 / 363 | Tries typed-looking names in two categories; some material has another category. |
| Battle condition | 546597 / 278 | Constant entry outputs only for the battle condition after it is reached. |
| State projection | 862183 / 452 | Deep-copies state and trims the copy before output. |
| Initialization / update rules | 237405 / 119; 856449 / 447 | Other owners supply state; the routing readers are not initialization evidence. |

The raw card and its read-only analysis are external inputs, not bundled code. No
source card scripts, remote loaders, long setting text or character design is imported.

### Candidate neutral design, not a repaired card

Use eras A/B/C and a harbor transport scenario. An existing state owner supplies
current era, chapter and location. Four optional responsibilities select common rules,
chapter facts, relevant entities and locations/institutions. A typed registry maps
aliases to stable entity IDs and exact entry targets. All readers share the confirmed
snapshot and output policy; none mutates the world state. Ordinary keywords may remain
for unrelated independent detail entries.

This is useful for long, state-selected material with cross-entry reuse. It is excessive
for a short bridge rule. Follow E04's [precedence table](../skills/worldbook-design-and-writing/references/planning-and-loading.md#5-e04-state-choice-and-mention-precedence)
before implementing branches; use E05 for target/state contracts and E06 for final
deduplication/budget. Do not assume one controller per category is mandatory.

### Counterexamples and expected outcomes

| Static source anchor | Risk | Neutral acceptance target |
|---|---|---|
| 762363: earlier era-A textual branch and later era-C branch can both output | Confirmed C plus mention of A silently mixes eras | Current C wins; explicit comparison alone may add labeled A reference without changing state. |
| 796517: alias substring search, no presence read | Mention or negation treated as in-scene presence | Apply the project's explicit topic/presence policy; two aliases select one stable entity, and two relevant entities remain two. |
| 762363: literal target `[斗二]-设定-魂核凝聚规则` absent from this card | Missing local content assumed successfully loaded | E05 records exact local absence, external-book scope and required/optional fallback; no invented content. |
| 232196: special first-era timeline followed by a differently constructed name | Extra mismatched target query | Registry validates every target; a special route is not followed by an unneeded generic read. |
| 692109: names sought as location/faction whose actual content has another category | Wrong category described as absent material | Keep typed lookup; distinguish misclassification, exact-name mismatch and real absence. |
| 232196 and initialization: “待初始化” versus “未开始”; period not synchronized by every opening path | Sentinel/partial initialization becomes a normal chapter | Stop that dependency or emit agreed unknown; validate era/chapter/period together through their writer. |
| Alias deduplication is local; native branches remain separate | Two controllers or native+template emit the same rule twice | E06 checks stable content identity across the final request and applies the agreed budget/fallback. |
| 862183: deep-copy projection; `isEmptyData` treats 0/false as empty | Meaningful omitted module gets no folded-module notice | Preserve zero/false field meaning and needed notice; compare storage before/after to confirm projection is read-only. |

The original projection's empty check mainly affects the folded-module notice; it
does not establish deletion of persistent storage. Some UI field names also differ
from the initialization/update contract. That is a cross-component mismatch to inspect,
not proof that every EJS reader fails.

### Runtime still unverified

For the user's target, verify actual host/extension versions, disabled-entry access,
message-window parameters, template scope/lifetime/order, initialization and writer
success, external-book availability, final outputs and budget. Slicing the last three
items of a returned array does not prove an API returned three messages. A document
blob hash is not an installed plugin version. Fixed upstream implementation evidence
in [E03](../skills/sillytavern-api-reference/references/worldbook-version-verification.md)
does not close target-runtime acceptance.

Source-visible chain → candidate neutral rule → runtime unverified remains the report
structure until isolated E07 probes provide actual evidence. Importing, repairing or
executing the original card and its remote dependencies is outside this example.
