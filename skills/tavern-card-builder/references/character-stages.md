# Character stages and conditional portrayal

## Contents

1. Purpose and adoption
2. What is adopted from Moyue
3. Base portrayal, stage differences, and correction
4. State authority and condition design
5. Facts, knowledge, and player agency
6. Activation, conditional content, and recipients
7. Implementation and inherited cards
8. Authoring record and review cases

## 1. Purpose and adoption

Use this reference with [character-design.md](character-design.md) when a character's
lasting portrayal must depend on an explicitly selected state. Natural growth,
changing relationships, reversals, and learning can occur in all three card types.
They do not by themselves require numbered stages, a numerical affection scale,
MVU, EJS, or a new runtime.

Create conditional stage content only when a real change in cognition, relationship
understanding, behavior tendency, or expression boundary needs different prompt
content, and ordinary character material plus the current scene is insufficient.
Do not create a stage for every temporary emotion, action, location, display value,
or numerical threshold. Explain the actual portrayal difference before selecting a
technical carrier. Stage adoption is a creative decision, not a checklist default.

| Card type | Growth and portrayal | Selected automatic stage behavior |
|---|---|---|
| `text` | Use narrative context and, when useful, an explicit text record. | Do not silently add a persistent state runtime. A request for deterministic selection needs a real state source and an explicit capability/type decision. |
| `mvu_zod` | Natural portrayal remains valid; not every field needs a stage. | Consume the chosen, schema-governed state through the verified read path. The stage reader is not a new writer. |
| `hybrid` | Growth remains a content concern. | Identify one authoritative owner for each stage fact and explicit cross-system reads and conflict behavior. |

EJS is an optional capability, not a fourth card type. Ordinary MVU Zod plus EJS,
UI, regexes, or helper scripts does not by component count become `hybrid`. Apply
[card-types-and-runtime-dependencies.md](card-types-and-runtime-dependencies.md).

## 2. What is adopted from Moyue

Moyue's materials contain both an older controller-plus-separate-stage-entry recipe
and a newer single-entry conditional recipe. The newer method separates stable
portrayal from stage differences and asks for a complete condition table. Older
examples also contain independent conditions that can select conflicting portrayal
blocks for some combinations. Treat these as authoring inputs, not interchangeable
or verified runtime implementations.

Adopt the need test, difference-only writing, complete legal-state coverage, and
source review. Extend them with TW's existing state ownership, knowledge boundaries,
card types, activation policy, and evidence separation. Do not import universal
blue activation, fixed order numbers, recursion requirements, a prescribed EJS call,
or the workshop ritual of copying materials and hiding all discussion floors.

TW already defines field ownership and recipients, conditional worldbook handoffs,
and version-sensitive API verification. This reference supplies the missing
character-stage authoring method; it does not replace those authorities or introduce
a second variable ledger.

## 3. Base portrayal, stage differences, and correction

Keep three responsibilities distinct. They need not become three physical files.

| Responsibility | Content | Boundary |
|---|---|---|
| Base portrayal | Identity, history, values, expression habits, confirmed facts, and the relationship foundation that remains applicable. | A maintained foundation, not a promise that the person can never change. |
| Stage differences | What the selected state adds, changes, or makes temporarily inapplicable in cognition, relationship understanding, behavior tendency, or expression. | Do not duplicate the whole profile, rewrite unrelated traits, or prescribe a fixed action, line, or plot result for every scene. |
| Optional correction | Clarification of a likely or observed misreading of the approved portrayal. | Does not add facts, change state, advance a relationship, or resolve an authorial conflict without a decision. |

Each difference must identify its relation to the base. If it changes a base rule,
state the affected scope and meaning. Later insertion alone does not resolve a
semantic contradiction. Reuse unchanged material by reference in authoring records;
do not copy a complete biography into every branch.

For example, an approved stage may change a character from avoiding direct concern
to admitting concern in private while remaining reserved in public. That change
does not authorize replacing their history, values, or entire voice. Do not impose
a universal distant-to-intimate progression. Whether a stage can reverse, be held,
or be left permanently follows the author's design and the existing update rules.

Use [character-review-and-correction.md](character-review-and-correction.md) for
correction. A stage-specific correction is optional and follows the same applicability
conditions as its stage; common correction belongs with the common portrayal. It
must not turn an unconfirmed state into a confirmed one, reveal unavailable
knowledge, or become a hidden third profile that overrides the base and differences.
If correction exposes a contradiction, report it and resolve the relevant authorial
decision instead of advancing the state to make the text fit.

## 4. State authority and condition design

Read the current maintained schema, initialization, update rules, and consumers when
they exist. Check their field paths, meanings, types, legal values, and versions
together. Use [variable-systems.md](variable-systems.md) as the authority for fields,
initial values, permitted changes, writers, and migration. Re-read accessible current
files before final implementation; do not use an obsolete chat summary or require
the user to paste files that the agent can already read.

The stage mechanism consumes approved state. It must not add or rename fields,
invent defaults, normalize or repair stored values, write back a selected stage,
or modify schema/initialization/update rules merely to make a condition work. If the
necessary state is absent, describe the need and return it to variable design.
Creating that state or adding a runtime requires the corresponding explicit design
and authorization; a portrayal task does not imply it.

### Conditions within and across dimensions

- Within one stage dimension, conditions are mutually exclusive and cover every
  legal state. Assign each numerical boundary and each enum or boolean value.
- Prefer one principal stage with only the necessary independent modifiers as the
  lightweight starting point. This is not a ban on justified multidimensional state.
- Relationship identity, trust, disclosure, and other genuinely independent facts
  need not collapse into one affection number. Define which combinations can coexist,
  which are invalid, and the portrayal or conflict behavior for each relevant case.
- Separate exclusive stages from compatible modifiers. Several compatible dimensions
  may contribute content; they must not accidentally emit contradictory full profiles.
- An implementation's first matching branch is not proof that the design has no
  overlap. Check the condition table independently, including boundaries and combinations.
- If the table is too complex to explain and maintain, simplify the dimensions or
  identify a separately designed mechanism. Do not silently discard author requirements
  or generate an unreviewable condition tree.

### Missing and invalid state

Keep missing, `null`, intentionally cleared, unknown-enum, and out-of-range values
distinct according to the existing field contract. Check that a value belongs to
the legal domain before treating it as a normal stage input. An unrecognized value
must not fall through into the last or highest stage.

When no reliable stage state is available, the default is to retain the base
portrayal, omit the unsupported difference, and record an author-facing diagnostic
and evidence gap. Use a specific fallback stage only when its meaning has explicitly
been confirmed safe for that condition. Do not guess the initial, lowest, highest,
or allegedly last-known stage. An initialization value for a new conversation is
not automatically a safe fallback for missing state in an older conversation.

Retaining the base is a content-level fallback, not a delivery guarantee. It still
depends on normal entry activation/loading and recipient routing. If that foundation
did not reach the intended prompt, report the separate loading gap; do not bypass
the adopted activation policy merely to make fallback content appear available.

Fallback selects content for this evaluation only. It does not reset, initialize,
repair, migrate, or write saved state. A past value is usable only through an
existing contract that establishes its identity, freshness, and scope; never copy
state from another chat or floor to conceal a missing source.

## 5. Facts, knowledge, and player agency

Distinguish the objective event, what each person knows or believes, and the lasting
attitude or relationship understanding supported by that evidence. Being present in
the model's prompt does not make a fact known by the character. Keep degree, source,
uncertainty, mistaken belief, and outdated knowledge where relevant; apply
[worldbuilding-design.md](worldbuilding-design.md).

A rumor of betrayal does not by itself justify the portrayal for confirmed betrayal.
A relationship label does not prove every participant knows, accepts, or interprets
it in the same way. Do not use a stage to erase those distinctions or expose a secret.
Stable knowledge may remain in character material; dynamic knowledge uses the
existing state design only when play actually needs it. Do not build a knowledge
database merely to support this section.

Stages constrain the authored character's portrayal, not the player's choices,
thoughts, emotions, speech, consent, or future actions. Do not infer a mutual
relationship or player decision from one character's score. Follow
[player-profile-and-agency.md](player-profile-and-agency.md).

## 6. Activation, conditional content, and recipients

Treat these as three separate decisions:

| Decision | Question | Required boundary |
|---|---|---|
| Entry activation or explicit loading | Does this entry enter processing now? | Follow the adopted character-entry policy and the verified loading mechanism. |
| Conditional content | Which approved differences does the processed entry produce? | Read actual state and apply the condition table; a true condition does not itself activate an entry. |
| Recipient routing | Which model or processing stage receives the result? | Follow the detected routing contract; a recipient marker is not constant activation or a replacement for keyword matching. |

Keep the policy in [lorebook-and-prompts.md](lorebook-and-prompts.md): one core
character's profile entries are blue/constant; with multiple core characters the
overview is blue and detailed profiles are green/keyword. Effective keyword scan
depth remains 2, and both recursion directions remain disabled for all entries.
Single versus multiple core characters is independent of `text`, `mvu_zod`, or
`hybrid`, and independent of how many stage fragments a profile contains.

When conditional content is inside a profile entry, retain that entry's required
activation. A green detail entry that did not activate cannot be assumed to have
sent its stage content. Diagnose loading separately; do not enable recursion, raise
scan depth, or force repetitive names into prose as an automatic repair.

An explicitly adopted and verified controller may deliver separate conditional
payloads under the existing TW contract. Record the owner, conditions, recipients,
and assembled-prompt evidence. Do not relabel ordinary profile content as a payload
or invent a controller to bypass the single-core blue / multi-core green policy.
Constant activation itself still does not prove delivery through enabled-state,
budget, recipient, or other host filters.

## 7. Implementation and inherited cards

For a new simple scheme, consider conditions inside the relevant entry first, to
keep the selected differences together and avoid unnecessary loading machinery.
This is a starting recommendation, not a universal EJS implementation mandate.
Keep the maintained source's full condition table distinct from the content actually
sent in one evaluation. Verify the chosen runtime selects the intended content;
do not claim unused branches are absent from a prompt based on source inspection alone.

Preserve a working inherited controller or other approved carrier unless there is
evidence and authorization to change it. Adding stage design does not authorize
converting legacy MVU, migrating saves, renaming entries or variables, changing the
card type, or replacing the established loading protocol.

Use `$sillytavern-api-reference` for the actual target's EJS or other capability,
evaluation context, escaping, entry access, and read semantics. A disabled-entry
read such as an old `getwi` example, a registration wrapper, declaration keyword,
or decorator is not a TW-wide requirement or verified call. Do not introduce
recursive activation to reproduce a workshop recipe. If the target cannot satisfy
the chosen design with the adopted policy, report the gap and resolve the design.

Use `$sillytavern-runtime-debug` for assembled prompt and execution evidence. Keep
condition-table review, source checks, local fixtures, real-host execution, model
portrayal, and human acceptance separate. No static pass establishes all of them.

## 8. Authoring record and review cases

Use the optional stage section of
[character-design.md](../assets/templates/character-design.md), or the project's
equivalent. Record only what this character actually needs:

- base portrayal reference and reason for adopting stages;
- authoritative state source/version, paths, legal domains, meanings, and writers;
- principal stage and any independent dimensions, compatible/invalid combinations;
- exact conditions, differences, and affected base scopes;
- objective facts, character knowledge, and player-agency boundaries;
- missing/invalid behavior and any explicitly approved semantic fallback;
- entry activation/loading, content selection, recipients, and chosen carrier;
- optional correction references and their matching applicability;
- representative cases, evidence, and remaining runtime or portrayal gaps.

Keep the field ledger and creative authority as their existing sources of truth.
An unselected stage system is not missing mandatory card content. Test only cases
relevant to the chosen design, using synthetic examples or authorized project data.

| Case | Required outcome |
|---|---|
| Text character grows after a major event | Growth remains possible without invented MVU/EJS or a false claim of deterministic state. |
| Numerical boundary or every legal enum value | Exactly one result within that exclusive dimension; no gaps or accidental overlap. |
| High trust without confirmed relationship identity | Do not derive identity, mutual agreement, or player choice from a score. |
| Low trust while an established relationship still exists | Produce the defined compatible portrayal or a diagnosed conflict, not two contradictory full profiles. |
| Missing, `null`, clear, unknown, or invalid value | Respect each declared meaning; retain the base when no reliable stage exists; no guessed stage or save repair. |
| Stage changes | Only the declared differences change; unrelated identity, history, and voice remain coherent. |
| Only character A receives new evidence | Character B does not automatically learn it or change to the corresponding informed stage. |
| Multi-core detail entry is not activated | Report the loading gap; a true internal condition is not evidence of delivery. |
| Correction wording becomes warmer | No unapproved relationship fact, stage advancement, knowledge gain, or variable write. |
| Old controller, legacy MVU, or old save | Preserve the authorized scope and existing structure; do not imply migration. |
| Repeated evaluation with the same state and scope | Consistent selected content, no duplicate payload, and no state write. |
| Two systems disagree about a stage fact | Use its declared authority or explicitly suspend unsupported differences; do not select whichever is more advanced. |
