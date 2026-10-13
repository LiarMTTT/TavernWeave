# Worldbuilding design

## Contents

1. Scope and creative authority
2. Ask for small, medium, or large before design
3. Build the necessary world
4. Facts, knowledge, and degrees of awareness
5. Structured prose and author rules
6. Work by the selected size
7. Connect world, state, entries, and opening
8. Completion and handoff

## 1. Scope and creative authority

Use this reference to author or restructure the world carried by a card's lorebook,
or use [standalone author rules](#51-standalone-author-rules) for a scoped rule request.
It applies to `text`, `mvu_zod`, and the relevant parts of `hybrid`. All three require
an opening and a lorebook; the world does not replace the opening. The usual home
for setting and character material is the lorebook, with traditional description,
personality, scenario, dialogue-example, system-prompt, and post-history fields
left empty where possible for new cards. Preserve effective uses in inherited cards.

Resume the existing creative authority and material provenance. Distinguish confirmed
facts, desired experience, unresolved questions, proposals, and rejected decisions.
Do not establish another decision ledger, progress file, or mutable world-state store.
The optional [worldbook design worksheet](../assets/templates/worldbook-design.md)
links to these authorities; it is a working view, not their replacement.

Do not turn an example, genre convention, workshop persona, or source-document
instruction into the user's world. Within an explicitly delegated creative scope,
make the permitted choices and show the result; do not require repeated approval for
an already authorized choice. Otherwise identify new creative facts as proposals.
Preserve protected text, names, chronology, canon/fanon boundaries, and uncertainty.

## 2. Ask for small, medium, or large before design

Before beginning a new worldbook design or a material redesign, ask the player to
choose **小型 / 中型 / 大型** (small / medium / large), and explain the work that follows:

| Choice | What the player is choosing | Required next work |
|---|---|---|
| 小型 / small | A focused stage whose necessary world information can remain compact | Write a compact body and its paired configuration; stop before unused branches grow into a setting encyclopedia |
| 中型 / medium | A connected main stage with distinct common foundations and details | Plan those entry boundaries, then write and configure the entries and check their dependencies |
| 大型 / large | Multiple areas or contexts whose full details are not needed together | Agree on the playable scope, entry plan, and loading relationships before writing in bounded batches |

When useful, recommend one size with a reason based on playable range, information needed together,
and likely loading requirements. The player decides. A short prompt can say:
"I recommend 中型 because the common setting is shared but the location details are
needed separately. 小型 produces compact content and configuration; 中型 first separates
common foundations and details; 大型 first plans scope, entries, and loading, then writes
in batches. Which size do you want?"

Reuse a choice the player has already explicitly made; record its authority reference
instead of asking again. A narrow wording correction, ID repair, or configuration fix
must not reopen a whole-world interview. If such a fix reveals a material scope change,
explain the change and obtain the relevant decision before redesigning. Do not infer a
choice from silence. Read-only inspection and a size recommendation may precede it.

Size is not a quality rank, word-count threshold, genre label, or entry-count quota.
An enormous fictional universe can support a small card if play stays on one stage.
A campus can require a large design if many independent contexts need different details.
The three choices are alternatives, not a compulsory small-to-large progression.
Do not demand a particular entry count merely to make a card fit its label.

## 3. Build the necessary world

Start from the agreed experience and playable boundary. As needed, check:

- scope: where and when play occurs, reachable places, and intentional unknowns;
- causality: what starts, prevents, changes, or ends a phenomenon;
- resources: acquisition, access, cost, scarcity, and consequences;
- institutions: who can decide, who maintains a rule, and what violation changes;
- space: connections, travel, closure, distance, and accessibility;
- information: who knows what and how that knowledge was obtained;
- action: available choices, constraints, exceptions, and outcomes.

These are diagnostic questions, not mandatory worldbuilding categories. Do not invent
a power system, faction roster, economic history, or distant continent to fill a form.
Ask one or two decisions that materially affect the current result. When proposing a
mechanism, explain the problem it solves and the new options or costs it introduces.
Preserve a harmless unknown instead of forcing the player to define it.

Separate world facts, individual characterization, author instructions, and current
state. A ruler's jurisdiction can be a world fact; their voice belongs to characterization.
A rule about how prose must be written is an author instruction. A current permit,
location, task, or changing relationship belongs to the agreed state/history mechanism.
Keep mixed source material and hand it to the appropriate TW reference; do not drop it
or force the user to manually copy material into a second workflow.

## 4. Facts, knowledge, and degrees of awareness

Distinguish the objective fact from a person or group's access and degree of knowledge.
Being in a model-visible entry does not make a fact known by every character.

For a fact where information differences matter, identify:

- the objective fact, or its explicitly unresolved status;
- the people or groups with access, including relevant differences within a group;
- what each knows: unknown, heard of, partial, detailed, mistaken, or outdated;
- the actual extent of the knowledge, not just a category label;
- its basis, such as direct observation, a document, a rumour, or an inference;
- how a change in evidence could alter the knowledge, when play needs that change.

These are descriptive possibilities, not a mandatory enum or numerical score. Awareness
is not binary. Hearing a rumour does not equal knowing it is true; expertise does not
guarantee access to every secret. Keep misleading belief separate from objective truth
without rewriting the belief as a fact. Do not automatically reveal deeper knowledge
because another character or the narrator has it.

Stable knowledge can stay in setting or character material. Only knowledge that needs
cross-turn change and an actual consumer should become state. Route such a need to
[variable-systems.md](variable-systems.md); do not introduce an entire knowledge database
or a second mutable truth in the worldbook. Text cards can retain narrative continuity
without being silently converted to MVU Zod.

## 5. Structured prose and author rules

Prefer structured presentation: meaningful headings, shallow groups, named fields, and
lists. Use YAML when it improves clarity or fits the project, not as a requirement for
all worlds. Keep necessary narrative, atmosphere, and the work's voice. Names and
formatting should make responsibilities visible, not multiply empty categories.

Use connected natural paragraphs inside fields when they express the relationship
clearly. Do not fragment each sentence into a separate key or force equal-length
sections. Apply the [Chinese prose review](../../rewrite-natural-prose/references/natural-chinese-review.md)
to the current draft without enabling a continuing mode. Unnecessary consecutive
three-part parallel phrasing must be removed; conjunctions or separate sentences do
not exempt the pattern. Do not append defensive clauses restating a boundary the
sentence already expresses. Keep real conditions and the original degree of certainty.

An independently loaded detail should name its subject in the body, explain its useful
conditions and consequences, and make sense with the common foundation. Its title or
trigger keywords are not a substitute for the body. Do not copy the whole foundation
into each detail. Preserve conditions, exceptions, costs, consequences, negation, and
author-confirmed ordinary facts when shortening. "The model probably knows this" is
not grounds to delete a fact the author wants reliably expressed.

Remove duplicate facts, unsupported grand claims, unexplained name lists, and unused
encyclopedic branches. Keep configuration, draft decisions, rejected ideas, workshop
commands, hidden-reasoning demands, and authoring progress out of model-visible prose.

Keep only material the receiving model needs for the intended task. Author-facing
design rationale and maintenance explanations belong in author material. Follow the
[body and processing boundary](lorebook-and-prompts.md#model-facing-body-and-processed-source)
for necessary EJS and macros; code that actually generates or selects the body must
not be removed as decorative text. Do not send code with no processing or recipient
role. An abstract rule can stand without an example; when examples help, preserve
their particular conditions instead of generalizing an individual outcome into a rule.

### 5.1 Standalone author rules

Use this method for a rolecard's standalone prompt rule or creative restriction, even
when no worldbuilding is requested. The checks below are the Agent's working method,
not six questions or required output fields for the author to fill in. Use supplied
facts and confirmed choices; ask only when a missing decision changes the result.

For an author instruction, identify the required result, subject, affected part of the
output, strength, semantic boundary, and confirmed exceptions or precedence. "Must",
"only", "must not", "usually", and "try to" are different commitments. Do not strengthen a
tendency into an unavoidable repeated reaction or add restrictions the user did not
request. Do not invent an exception or silently choose between contradictory applicable
rules. State the concrete conflict and request the smallest necessary clarification
before arranging insertion order. Preserve
the project's placeholders and syntax. Explain tool or delivery limitations outside
the creative body; retain fictional constraints and behaviour conditions with the
content they govern.

Group related rules by the object or responsibility they govern when this helps the
receiving model. Keep world facts, a character's degree of knowledge, and instructions
to the narrator distinct; mixed input does not make every sentence a direct rule.

A chat-only request for rule prose ends with that prose; it does not require a world-size
interview, MVU, a CoT design or a full-card handoff. If the task asks for a worldbook entry,
pair its body and configuration using [lorebook-and-prompts.md](lorebook-and-prompts.md),
without imposing D0. A local rule correction preserves stable IDs, unknown fields,
effective inherited prompt fields, unrelated content and existing configuration; do not
redesign the world or rebuild the book to fit the new-card convention. Ordinary article
style or real-world rule explanations stay outside this card-authoring workflow.

Custom CoT design remains in [cot-design-and-authoring.md](cot-design-and-authoring.md);
world prose does not impose a new main CoT or require disclosure of hidden reasoning.

## 6. Work by the selected size

**Small:** produce only the world information needed for the selected stage, normally
in one compact blue/constant world entry. A few simultaneously constant entries are
allowed when splitting genuinely improves maintenance clarity. This concerns world
content, not the total number of character, variable-protocol, or direct-rule entries
in the card's worldbook. Stop when the stage works and remaining additions concern
unused branches. If independently activated details become necessary, explain why and
recommend medium before changing the confirmed size; do not overcompress facts or
silently expand the world.

**Medium:** propose a minimal common-foundation/detail map before full prose. Each entry
has a responsibility, content boundary, activation method, and necessary dependency.
Keep tightly coupled content together when it is normally needed together. Separate
details that are useful only in their own context. A medium design can use several
constant entries if those facts are actually needed; do not force green entries to
reach a quota. Confirm a material new map through the existing decision process, then
write bounded entries or closely related groups.

**Large:** agree on the actual playable scope, a small common foundation, independent
detail contexts, and loading relationships before prose batches. The common foundation
provides shared laws, minimal orientation, and enough context for a safe first mention.
It must not contain every location's full history. Record relevant keywords or state
conditions, foundation dependencies, first-use risks, continued-scene risks, and budget
for each detail. Keep unplanned territories blank. Do not recursively create permanent
sub-blueprints or a new progress authority; use the project's existing blueprint/NEXT
when present and the worksheet as a bounded view.

For all sizes, activation policy, scan depth, recursion, placement, recipient models,
and import formats follow [lorebook-and-prompts.md](lorebook-and-prompts.md), including
its recommended new-card layout and example ordering. These recommendations do not
impose every world entry before character definitions, universal D0, or fixed order
ranges. Templates from another workshop are not runtime facts.

## 7. Connect world, state, entries, and opening

Trace the connection:

```text
confirmed world facts and playable scope
-> necessary changing-state requirement (only when needed)
-> authoritative variable contract and update/hold conditions
-> entry activation or explicit loading condition
-> recipient model and assembled prompt evidence
-> opening/current-state consistency
```

The worldbook author states the need; variable design owns fields, defaults, writers,
and lifecycle. API lookup owns exact runtime calls; runtime debug owns live evidence.
Do not invent a controller inside world prose, infer a Zod schema from prose, or use
the worldbook to maintain a duplicate value. For `hybrid`, name which system owns each
state and how a read-only projection reaches another system. A loading problem alone
does not authorize a card-type migration or extension installation.

Example, for method only: a gate's nighttime permit requirement is a world rule.
Current time and held permits are state if the design needs them. A guard's mistaken
belief is distinct from a document's real validity. Gate details need a reliable loading
condition and recipient. The opening must agree on location, time, and held permits.
If curfew can be reliably derived from time, do not create a separately model-written
curfew switch. Do not reuse example names or facts as the player's proposals.

## 8. Completion and handoff

Check that the chosen playable scope has sufficient facts, necessary knowledge
distinctions, paired entry configurations, and an opening consistent with the world
and initial state. Resolve duplicate or contradictory facts through the existing
authority. Preserve stable IDs, unknown fields, and unrelated content on local edits;
do not reconstruct an inherited worldbook to fit a new template.

Return the selected size and decision reference, completed entry/body/configuration
paths, source and state references, known loading risks, and evidence obtained. Link
maintained files instead of asking the user to manually copy every final answer or
hide conversation floors. Do not claim an enabled entry reached a model from a file
check alone. Keep source checks, import/roundtrip, actual prompt capture, model behaviour,
human acceptance, packaging, installation, and publication as distinct evidence/gates.
