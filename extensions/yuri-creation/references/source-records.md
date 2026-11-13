# Shared provenance contract

This original bridge calls pinned TavernWeave work-library functions. Its source descriptors, units, editable `records/*.md`, exact quote validation, index and transactions keep their upstream owner. No upstream implementation is copied or relicensed. The original creator and the unchanged Foreverse MIT serializer remain separate dependencies.

## Extraction candidate

New extractions use schema `yuri/extraction/v2`, `source_sha256` from `source_card.py read`, `reviewed_unit_ids` listing every supplied unit, `review: {completed: true, notes: ["actual review"]}`, and a nonempty `records` array. Already-promoted v1 projects and their original receipts remain readable and buildable; do not edit them to pretend they received claim-level review. To revise an old extraction, create a new reviewed project rather than overwrite its authority.

`reviewed_unit_ids` uses the local IDs from the unit list, such as `u000001`. Evidence uses source-qualified IDs, such as `post-001/u000001`. These are intentionally different. An optional origin URL is saved on the supplied text descriptor; registration does not fabricate a webpage retrieval time or claim the page was fetched.

Each candidate record uses the upstream metadata: stable lowercase `id`, `kind` (`character`, `relationship`, `event`, `rule`, `place`, `faction`, `question`), `name`, `status` (`confirmed`, `inference`, `uncertain`), `realm: reference`, `continuity` matching the registered descriptor (`supplied-post` or `supplied-novel`), `known_from: null`, and optional `aliases`. Add nonempty `claims`, each with a unique record-local `id`, trimmed `text` stating one source assertion, and its own nonempty `evidence` array. For example:

```json
"claims": [
  {"id": "age", "text": "Lin is 32.", "evidence": ["replace with actual evidence objects"]},
  {"id": "goal", "text": "Lin wants to finish the register.", "evidence": ["replace with evidence for this separate claim"]}
]
```

The placeholders illustrate shape only; actual evidence items are objects with `unit_id`, `source_sha256` (descriptor hash), `start` (Unicode character offset in LF-normalized text) and `quote`. The helper returns these objects and splits boundary-spanning quotes into linked segments. Text hashes and descriptor hashes are different and must not be interchanged.

The bridge validates **each claim's own** quotes with the unchanged upstream validator. It derives `body` by joining claim texts with a newline, and derives record-level `evidence` as the ordered, deduplicated union of claim evidence. Omit those two fields in the candidate; supplied values must match the derived values exactly. Claims and their links remain in the upstream Markdown record's metadata, not another editable fact store. An extra summary cannot introduce uncited assertions around the claims. The bridge checks structure and quote locations; the agent must still check that each quote actually supports its claim, that claims are sufficiently narrow, and that no important clause was omitted.

Character records additionally use `yuri: {role: main|player|background, source_gender: woman|man|unknown, age_status: adult|minor|unknown}`. A post keeps exactly one poster/player. A novel may have one source player or zero when the player is an explicit invention; see [novel inputs](novel-inputs.md). This metadata describes source evidence; it does not become the adapted identity by implication. Keep source uncertainty explicit. Record competing interpretations as inference/questions instead of filling missing canon.

Keep distinct people and incidents under distinct stable record IDs. A remembered school friend is not the current friend merely because both appear in a similar relationship. Preserve the speaker and viewpoint of reported statements: a complaint or belief is not an independently established fact. Unknown gender, age or motive stays unknown; do not infer absence from a short quotation. Review absence/uncertainty against the entire supplied scope. Split interpretations needing a different certainty label into separate records.

`extract` validates the candidate through the actual upstream quote/authority validator and promotes it transactionally via the small-record/reindex path. Its receipt binds all reviewed source units and the current fact set. Review flags are agent acknowledgments. No model/API call, web fetch, benchmark or autonomous background task occurs in this command.

## Adaptation plan

Use `prepare` after writing the draft. It binds the source project, descriptor, reviewed records, saved preferences and draft. Fill:

- `targets`: exactly the characters selected by the saved scope and exclusions, each with `record_id`, `result_woman: true`, `result_adult: true`, and a specific `reason`. Unknown source gender stays unknown in the facts; the female result is an explicit fictional adaptation. Leave characters outside that scope unchanged. See [custom-profile fields and review](custom-profiles.md) for human/custom criteria and explicit relationship choices.
- `player_binding`: the poster's `record_id` and `runtime_aliases`, listing specific source names/labels that must disappear from runtime prose. Do not list common pronouns. The built-in forbidden labels are narrator, poster and 发帖者.
- `decisions`: unique `id`, `kind` (`identity`, `relationship`, `setting`, `invention`, `preserved`), `summary` and source `record_ids`. Relationship decisions also require nonempty `causal_record_ids` and a specific `changed_circumstance`. Declare unsupported new setting/events as invention rather than evidence. Code checks references; the agent reviews whether they actually support the change.
- `field_sources`: unique `pointer`, `record_ids` and `decision_ids` for every populated runtime field, including the name. Whole entry pointers such as `/data/character_book/entries/0` cover that entry's prose/title/keys. Use individual fields or entries, not a blanket `/data` or whole-worldbook mapping. Every decision must affect at least one output field.
- `agent_review`: `completed: true` and nonempty notes after reading the actual card for identity consistency, causal yuri development, facts versus invention, independent character goals, knowledge limits and player agency. Trace each reused incident back to the same people and event in the source. Do not transfer a player's past anger, actions or statements from another incident; an intentional recombination must be an explicit invention, not a preserved fact. Leave current player reactions open.

When a retained name may no longer fit the portrayal, use [name review](name-review.md). An accepted rename belongs in an `identity` decision and the affected field mappings; source names, quotes and record IDs remain unchanged.

The result is `mode: source_yuri`, with an adaptation record. It does not weaken the existing original-only validator. Hash matches, existing quotes and declared field links are deterministic checks, not proof of semantic fidelity. Post and novel entry points share this record authority and extraction/build pipeline. Novel TXT/EPUB selection is handled by `novel_source.py`; it is not a second extraction engine.
