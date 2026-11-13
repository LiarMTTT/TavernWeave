# Saved profiles and policy enforcement

All four entries use `shared/profiles.py`. Reuse the user's ready profile; when
none exists, use the unchanged three defaults. The agent maintains the JSON from
conversation choices. Do not require the user to fill a form or replace their
profile with defaults when a value is unsupported.

Validate before authoring with
`skills/yuri-card-creator/scripts/create_card.py validate-profile --profile PATH`.
Pass `--profile PATH` to original `init`, post `source_card.py init`, novel
`novel_source.py init`, or inherited `card_file.py open`. Each private project
retains its own full preferences, without changing a global profile. Interaction
locale is separate from `narrative_language`; `preserve_source` follows the source
language, or the conversation language for an original project without a source.

## Supported choices

| Field | Values and effect |
| --- | --- |
| `definition.womanhood_policy` | `author_defined_inclusive`; `human_explicitly_female` requires explicitly human women; `custom` requires nonempty `custom_criteria` and a reasoned criteria review for each target |
| `definition.allowed_dynamics` | Any nonempty subset of `romance`, `friendship`, `neutral`, `rivalry`, `hostility`, `kinship`; declared outcomes must use these dynamics |
| `transformation.scope` | `main_cast` selects main/player characters; `named_characters` selects exactly `selected_character_ids`; `entire_cast` also selects background characters |
| `transformation.excluded_character_ids` | Removes specified IDs from the selected scope; unknown IDs or selection/exclusion conflicts fail |
| `transformation.player_persona` | `preserve`, or `explicitly_authorized` with the user's actual authorization retained in the review |
| `transformation.protected_anchors` | Each supplied story/identity anchor must receive an explicit preservation review |
| `relationships.outcome_policy` | `preserve_outcomes` forbids relationship-change decisions; `rederive_if_causal` requires causal support; `explicit_pairing_targets` requires every specified pair and dynamic, without additional changed pairs |
| `relationships.pairing_targets` | Objects `{a, b, target_dynamic}` using stable character IDs; known, distinct pairs only; duplicate or conflicting pairs fail |
| `workflow` | `minimal-change`, `pairing-focused`, `character-focused`, `world-focused`; record how the chosen emphasis shaped the draft |
| `narrative_language` | A nonempty language choice, including `preserve_source`; the agent reviews the actual prose language |

Schema version is `1.0`; status must be `ready`. Missing optional fields receive
the prior public format's defaults: all six dynamics, no selected/excluded IDs or
protected anchors, no explicit pairings, `preserve_uncertainty: true`, and
`workflow: minimal-change`. Required compact-profile fields stay required. Unknown
keys, enums, wrong types, and contradictory choices fail explicitly. Gender
inference from stereotypes and romance inference from hostility must remain
false; source uncertainty must remain preserved. This is interface compatibility
with saved preferences, not a port or relicensing of the frozen legacy engine.

## Records maintained by the agent

For non-default policies, initialization/prepare creates `policy_review` with a
hash of the saved preferences and seven checks: definition, scope, relationships,
player persona, protected anchors, narrative language, and workflow. Fill each
check with a concise account of the actual prose reviewed. Fill `anchors` with
`{anchor, preserved: true, reason}` for every protected anchor. An empty or stale
review blocks export. Explicit player-persona permission belongs in
`player_authorization`; do not invent permission from a profile flag.

Original `creation.json` keeps its cast. Only policy-selected characters require
`author_defined_woman: true` and `adult: true`. Under the human policy add
`nature: human`; under custom criteria add `criteria_met: true` and
`criteria_reason`. Record authored relationships as `{a, b, target_dynamic}` when
needed, especially for explicit pairing targets. Original creation has no source
outcomes to preserve; `preserve_outcomes` keeps the agreed authored design.

Source plans keep the unchanged fact records. `targets` must match the selected
scope exactly, with `record_id`, `result_woman`, `result_adult` and `reason`; add
`nature` or custom-criteria fields as above. An excluded source player still binds
to `{{user}}` without becoming an identity target. Non-default relationship
decisions identify `a`, `b`, `target_dynamic`, plus the existing source-backed
causal fields for changes. Retained outcomes use `kind: preserved`. Invented novel
players remain explicit inventions, must meet the identity criteria, and have no
fabricated source ID; explicit ID-based selection/pairing uses actual cast IDs.

Non-default inherited plans add a source `cast` (`id`, `role`, `source_gender`,
`age_status`) and the same `targets`. Mark each prose change with `character_ids`
within the selected scope, or `[]` for setting-only prose. Relationship changes
also need `a`, `b`, `target_dynamic`, a specific `changed_circumstance` and
`causal_basis`. Preserve outcomes with `kind: preserved`. The existing field,
code, image and worldbook protections still apply, regardless of profile.

Changing source-project preferences invalidates an already prepared plan: review
and prepare a fresh plan. Changing an inherited session's preferences requires a
fresh `open`; its source, documents and profile are bound together. Original
non-default reviews also bind the profile hash. Historical default creation and
source projects remain usable. Legacy inherited v1 sessions remain default-only;
new sessions use v2 and require the saved profile, even when it is the default.

## Verification limits

The helper checks structured policy choices, declared target IDs, declared
relationship outcomes and receipt bindings. It cannot determine from prose who
was transformed, whether a sentence truly meets free-text criteria, whether an
anchor was preserved, whether consent was actually given, or whether a language
choice was followed. Read the actual output and record that review. Never call a
checked declaration a proof of narrative compliance or a live import test. Known
minor targets are not silently re-aged, and current player actions remain open.

For inherited cards, distinguish “unchanged by this edit” from “compliant.” Read
every greeting, not just the first: an inherited line may already prescribe the
player's thoughts, decisions or present actions. Report that retained limitation
with its field location; a pronoun-only edit does not resolve it. If the authorized
scope permits an agency repair, make the smallest explicit edit and review again.
Otherwise preserve the source and state the unresolved issue instead of claiming
an unconditional agency pass. Separate new adaptation facts from source facts;
custom criteria need clear evidence, not unnecessary plot additions or stereotypes.
