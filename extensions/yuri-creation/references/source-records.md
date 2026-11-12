# Shared provenance contract

This original bridge calls pinned TavernWeave work-library functions. Its source descriptors, units, editable `records/*.md`, exact quote validation, index and transactions keep their upstream owner. No upstream implementation is copied or relicensed. The original creator and the unchanged Foreverse MIT serializer remain separate dependencies.

## Extraction candidate

Use schema `yuri/extraction/v1`, `source_sha256` from `source_card.py read`, `reviewed_unit_ids` listing every supplied unit, `review: {completed: true, notes: ["actual review"]}`, and a nonempty `records` array.

`reviewed_unit_ids` uses the local IDs from the unit list, such as `u000001`. Evidence uses source-qualified IDs, such as `post-001/u000001`. These are intentionally different. An optional origin URL is saved on the supplied text descriptor; registration does not fabricate a webpage retrieval time or claim the page was fetched.

Each record uses the upstream format: stable lowercase `id`, `kind` (`character`, `relationship`, `event`, `rule`, `place`, `faction`, `question`), `name`, `body`, `status` (`confirmed`, `inference`, `uncertain`), `realm` (`reference` for this supplied post), `continuity: supplied-post`, `known_from: null`, optional `aliases`, and nonempty `evidence`. Every evidence item has `unit_id`, `source_sha256` (descriptor hash), `start` (Unicode character offset in LF-normalized text) and `quote`. The helper returns these values and splits boundary-spanning quotes into linked segments. Text hashes and descriptor hashes are different and must not be interchanged.

Character records additionally use `yuri: {role: main|player|background, source_gender: woman|man|unknown, age_status: adult|minor|unknown}`. Keep exactly one poster/player. This metadata describes source evidence; it does not become the adapted identity by implication. Keep source uncertainty explicit. Record competing interpretations as inference/questions instead of filling missing canon.

`extract` validates the candidate through the actual upstream quote/authority validator and promotes it transactionally via the small-record/reindex path. Its receipt binds all reviewed source units and the current fact set. Review flags are agent acknowledgments. No model/API call, web fetch, benchmark or autonomous background task occurs in this command.

## Adaptation plan

Use `prepare` after writing the draft. It binds the source project, descriptor, reviewed records, default preferences and draft. Fill:

- `targets`: every main/player character, each with `record_id`, `result_woman: true`, `result_adult: true`, and a specific `reason`. Unknown source gender stays unknown in the facts; the female result is an explicit fictional adaptation. Leave background characters outside targets.
- `player_binding`: the poster's `record_id` and `runtime_aliases`, listing specific source names/labels that must disappear from runtime prose. Do not list common pronouns. The built-in forbidden labels are narrator, poster and 发帖者.
- `decisions`: unique `id`, `kind` (`identity`, `relationship`, `setting`, `invention`, `preserved`), `summary` and source `record_ids`. Relationship decisions also require nonempty `causal_record_ids` and a specific `changed_circumstance`. Declare unsupported new setting/events as invention rather than evidence. Code checks references; the agent reviews whether they actually support the change.
- `field_sources`: unique `pointer`, `record_ids` and `decision_ids` for every populated runtime field, including the name. Whole entry pointers such as `/data/character_book/entries/0` cover that entry's prose/title/keys. Use individual fields or entries, not a blanket `/data` or whole-worldbook mapping. Every decision must affect at least one output field.
- `agent_review`: `completed: true` and nonempty notes after reading the actual card for identity consistency, causal yuri development, facts versus invention, independent character goals, knowledge limits and player agency.

The result is `mode: source_yuri`, with an adaptation record. It does not weaken the existing original-only validator. Hash matches, existing quotes and declared field links are deterministic checks, not proof of semantic fidelity. The default source checkpoint supports one supplied post. Its record format can be reused by a later separately implemented novel entry point without introducing another fact store.
