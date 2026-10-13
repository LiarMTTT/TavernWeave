# Validation

## Contents

0. Review scope and author-facing assessment
1. Static chain checks
   - Character material, player agency and portrayal review
2. CoT-specific checks
3. Artifact checks
4. Runtime acceptance
5. Handoff report

## 0. Review scope and author-facing assessment

Start from the requested scope and actual supplied material: a complete card,
worldbook, character, opening, UI or passage. Identify each relevant part's purpose
and the systems the card actually adopts before choosing checks. A partial excerpt
cannot establish that the whole card lacks a greeting. Optional stages or frontends
are not mandatory completeness requirements. Required greetings and worldbooks still
apply when judging a completed whole card.

Use the following distinctions rather than one undifferentiated pass/fail label:

| Status | Meaning |
|---|---|
| Satisfied | The relevant requirement has supporting evidence. |
| Needs improvement | An observed issue has a specific consequence. |
| Required but missing | Within the inspected complete scope, necessary content is absent. |
| Optional and not adopted | This design does not use the optional feature. |
| Material not supplied | The current materials do not establish presence or completeness. |
| Not verified | The part exists but the corresponding runtime or effect evidence is absent. |

Assess creative ideas against the author's intended experience when requested. Offer
reasoned alternatives, distinguishing an actual contradiction from a taste-based
suggestion. Preserve effective work; neither praise nor findings need a quota.
Separate prose quality, entry configuration, model-bound delivery and actual portrayal.
Use existing specialist checks rather than creating another full-card test regime.

For editable prose, apply [natural Chinese review](../../rewrite-natural-prose/references/natural-chinese-review.md).
Review nonessential three-part lists by meaning, including conjunctions and adjacent
clauses. Remove defensive repetition when the content already carries the limitation.
Inspect the model-visible worldbook body separately from author notes and necessary
runtime templates. Do not infer model behaviour or aesthetic acceptance from text checks.

## 1. Static chain checks

- A completed card has a usable greeting and an available, relevant worldbook;
  empty placeholders do not close this gate. A planning record may still be incomplete.
- Target type is `text`, `mvu_zod` or `hybrid`; `unknown` remains a discovery state.
  Legacy `mvu` is read only through the explicit compatibility path and is not proof
  of Zod support or migration. A normal MVU Zod card with UI/scripts is not hybrid.
- New cards normally leave the traditional prompt fields empty and use worldbook
  content. Existing effective fields are not cleared as a side effect of a narrow edit.
- New worldbook design has a player-confirmed 小型 / 中型 / 大型 choice and an
  explanation of the corresponding work. A prior explicit choice is reused.
- World prose prefers structure and preserves conditions, exceptions, knowledge
  scope and degree, including partial, mistaken or outdated understanding.
- Character-entry activation follows the single/multiple-character convention;
  effective keyword scan depth is 2 and both recursion directions are disabled for
  every entry. Verify actual target fields; scan depth is not insertion depth.
- Each maintained entry has matching content and configuration. Known source-format
  edits preserve IDs, unrelated settings, unknown fields and protected text.
- Each variable has a consumer, complete type/collection shape, initial-value basis
  and update/keep conditions where needed. Unknown input is not silently coerced
  into a guessed initial value; a derived value has no competing writers.
- Every state field has an owner and lifecycle.
- Schema, initialization, updates, projection, UI requirements, cleanup, and examples agree.
- Lorebook routing reaches the intended model/stage in every supported update mode.
- The recipient ledger accounts for plot-only, update-only, and intentionally shared
  entries; no entry contains both routing markers without a verified runtime rule.
- Routing markers do not bypass normal worldbook activation, depth, stickiness, or
  ordering.
- Fixed greetings and dynamic setup use the selected opening strategy.
- Regex and script requirements name failure behavior and idempotence.
- The primary card type and capability flags are supported by inspected evidence.
- Every runtime dependency has one class and a delivery path; player notices exclude
  development-only tools.
- An MVU Zod card distinguishes its embedded schema, every promised domestic/global
  MVU Zod script, their declared enabled states, remote import targets, and required
  host extension.
- Model-visible text contains no developer-only explanation or secret.

### Character material, player agency and portrayal review

Use the relevant parts of [character-design.md](character-design.md),
[player-profile-and-agency.md](player-profile-and-agency.md),
[character-stages.md](character-stages.md) and
[character-review-and-correction.md](character-review-and-correction.md).
Review only the current scope; these checks do not require every optional feature.

- The request's organize/collaborate/delegate scope is respected. Proposals do not
  become confirmed facts merely through generated prose, and unknowns may stay open.
- Foundation, living circumstances, disposition and expression are responsibilities,
  not four compulsory documents. Lightweight NPCs and optional clothing information
  are proportional to their use; inherited palettes and other effective structures stay.
- Player facts do not imply delegation. Each opening and later play respect the
  actual allowed speech/action/thought/feeling/reaction scope and duration. Objective
  effects follow agreed rules; the player's intent does not dictate another person's
  knowledge, feelings or acceptance. No global Persona is silently edited or exported.
- Stage differences use the current schema/initialization/update authority. Conditions
  cover legal states within each axis, boundaries and permitted multidimensional
  combinations; invalid/unknown values are not the highest or initial stage by default.
- A stage reader writes no state. Reliable foundations remain when unsupported
  differences are suspended; any safe specified fallback has a confirmed meaning.
- Clarifications have a concrete author-identified or evidenced purpose, retain the
  foundation and stage conditions, and add no facts, fixed response menu or state advance.
- Diagnosis distinguishes original facts, observed output, author feedback and
  hypotheses, including scene/history/preset/model and delivery causes. Author-only
  records stay out of the prompt, and no-change/removal remain valid outcomes.

Representative cases: a brief delegated concept without invented canonical trauma;
a sufficient compact NPC; opening-only limited player delegation; repetition traceable
to a fixed source gesture; shared preset style mistaken for several character defects;
high trust without confirmed relationship identity; low trust with that identity still
present; threshold/missing/null/invalid stage state; one character learning a fact;
and a narrow inherited-card edit. Check the expected distinction, not a required prose
string or a fixed number of trial runs. Paper review establishes static evidence only.

## 2. CoT-specific checks

- A custom CoT can operate in a text card with no MVU, schema, update block, or script.
- The default design can stitch a card increment into an existing preset main CoT.
- The card has not copied the preset's complete CoT.
- Every card-specific rule is a real increment with a target phase, stable purpose,
  output boundary, skip condition, and safe fallback.
- Every step answers a concrete question; no empty “think deeply” or “analyze
  carefully” step remains.
- CoT does not repeat card prose, character identity, setting text, or worldbook
  knowledge.
- Visible character thoughts remain narrative prose and are not treated as evidence
  of system judgment.
- MVU `<analysis>` or update evidence is not treated as the complete CoT.
- Plot/character/NPC/output CoT reaches only the plot model; update rules and update
  output format reach only the update model; intentionally shared facts are recorded.
- Deterministic formulas and derived-variable batches are owned by scripts, while the
  LLM supplies only required semantic source events or states.
- No variable has competing LLM and script writers.
- Multiple conditional modules have stable dependency, ordering, and deduplication
  behavior and cannot redefine the main CoT structure.
- CoT disablement, missing increments, failed stitching, and unavailable scripts have
  explicit safe degradation.
- The assembled Prompt contains no unresolved insertion markers, duplicated rule IDs,
  full-reasoning output demand, or author-only comments.

Use the templates and counterexamples in
[cot-design-and-authoring.md](cot-design-and-authoring.md) for the review.

## 3. Artifact checks

When artifacts exist, delegate to `$sillytavern-card-pipeline` and verify:

- maintained source is the change origin;
- generated JSON matches source contracts;
- PNG embedding preserves the expected payload;
- import/export roundtrip retains entries and extensions;
- every `embedded_required` regex, schema, script, loader, and binding is present with
  the declared enabled state;
- regional alternative groups satisfy the declared selection rule;
- a card-bound or co-delivered worldbook resolves to the card's declared version;
- versions and release notes describe the actual change.

## 4. Runtime acceptance

For runtime-affecting work, verify in real SillyTavern:

- import and new chat;
- every greeting branch involved;
- a no-MVU text card with custom CoT;
- preset main CoT plus card increment, with the assembled result reaching the intended
  plot context exactly once;
- conditional CoT activation, deactivation, simultaneous-module ordering, and
  deduplication;
- plot behavior for a representative single-character case and a group/NPC scheduling
  case;
- safe minimum output when the main CoT, card increment, optional script, or
  conditional module is disabled or unavailable;
- actual stored state and model-visible projection;
- same-generation update: the plot response includes one valid update and sees no
  missing required entry;
- extra update-model pass: the plot model excludes update-only instructions, the
  update model excludes plot-only instructions, shared entries reach both, and one
  valid update is applied without repeating an earlier change;
- keyword/green-light/sticky routing still activates and deactivates the same entries
  under both update modes;
- script registration and cleanup;
- host-required capabilities are installed and enabled;
- selected Git/CDN loaders execute, publish their expected readiness capability, and
  use their declared fallback when the primary path fails;
- UI on target devices and reload paths;
- console errors, network failures, and safe fallback.

For worldbook changes, additionally inspect actual model-bound content for first
entry into a scene, continued presence without repeated names, departure, ambiguous
aliases, and state-controlled selection. Do not silently increase scan depth or
enable recursion to make a case pass. Keep the agreed configuration and diagnose
keyword, content-boundary or state-loading needs. Separate selection evidence from
whether a model follows or writes the intended content.

Offline HTML or headless checks do not close this gate.

For portrayal quality, collect relevant actual outputs and the author goal through
[character-review-and-correction.md](character-review-and-correction.md). A novel
scene can check whether the character works beyond a quoted example. Diagnose
whether the required material reached the intended model before blaming the prose.
Existing chat evidence permits bounded analysis; creating test chats, model calls or
imports requires the corresponding task scope. Do not invent observations, require
hidden reasoning, or claim stable portrayal from static checks or one unexplained sample.

## 5. Handoff report

For an author-facing assessment, use the applicable columns below; a narrow answer
need not become a full table. Give exact source locations where possible.

| Object and purpose | Status and evidence | Effect on play or comprehension | Smallest useful response | Missing evidence |
|---|---|---|---|---|
| Actual reviewed part | Applicable requirement and observed result | Specific consequence | Retain, revise, clarify or investigate as warranted | Only the checks still needed |

A review does not authorize rewriting the source. When repair is authorized, address
the supported cause. Runtime delivery problems belong to their owner and do not by
themselves justify adding character text.


Separate:

- confirmed static evidence;
- generated but not imported artifacts;
- real-runtime evidence;
- user acceptance still pending;
- assumptions tied to a runtime version or optional extension.
- dependencies already embedded, host setup still required, remote loads, selected
  regional alternative, and development-only exclusions.
