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

Use this reference to create the world and connect it to a whole card.
For independent entry planning, configuration, review or prose, use
[worldbook-design-and-writing](../../worldbook-design-and-writing/SKILL.md); older
links to [standalone author rules](#51-standalone-author-rules) remain supported.
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

The player-confirmed 小型 / 中型 / 大型 choice and subsequent worldbook work now have
one authority: [worldbook scope and size](../../worldbook-design-and-writing/references/planning-and-loading.md#1-scope-size-and-authority).
Use that step for a new design or material redesign and reuse an explicit prior choice.
Narrow corrections and read-only work keep their scope.

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

For a world rule that needs to become playable consequences, use
[world mechanics and scenarios](world-mechanics-and-scenarios.md). It connects the
existing causal/resource checks to actions, costs, failure, directed travel and event
identity without forcing a new setting taxonomy or a fixed plot. New core setting,
gameplay goals and major plot changes remain proposals before adoption.

## 4. Facts, knowledge, and degrees of awareness

The worldbook writing authority is now [facts, knowledge and degrees of awareness](../../worldbook-design-and-writing/references/writing-contracts.md#4-facts-knowledge-and-degrees-of-awareness).
Carry its distinctions into the world's fact map; keep changing knowledge with the
existing state owner. This heading remains for older links.

## 5. Structured prose and author rules

Use [worldbook writing contracts](../../worldbook-design-and-writing/references/writing-contracts.md)
for concept limits, fact/rule/rumor distinctions, conditions and exceptions, strength,
free/undecided space, structured prose and semantic invariants. It is the sole owner
of those detailed methods; world construction and whole-card integration remain here.

### 5.1 Standalone author rules

The compatible destination is [standalone author rules](../../worldbook-design-and-writing/references/writing-contracts.md#standalone-author-rules).
A short rolecard-rule request still ends with the requested prose; it does not become
whole-card design merely because the method now has an independent owner.

## 6. Work by the selected size

Follow [worldbook scope and size](../../worldbook-design-and-writing/references/planning-and-loading.md#1-scope-size-and-authority),
then its scene/loading map. Return the agreed entry decisions to the same Content map;
do not maintain a parallel blueprint. The builder remains responsible for how world
content, characters, opening and state work together.

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
Use the [joint scene/loading plan](../../worldbook-design-and-writing/references/planning-and-loading.md)
for entry boundaries and reachability rather than building a second loading method here.

Example, for method only: a gate's nighttime permit requirement is a world rule.
Current time and held permits are state if the design needs them. A guard's mistaken
belief is distinct from a document's real validity. Gate details need a reliable loading
condition and recipient. The opening must agree on location, time, and held permits.
If curfew can be reliably derived from time, do not create a separately model-written
curfew switch. Do not reuse example names or facts as the player's proposals.

## 8. Completion and handoff

Check that the selected playable scope has sufficient facts and that greetings and
initial state agree with them. Resolve duplicated or conflicting facts through the
existing creative authority. Use the worldbook owner's
[scoped delivery checks](../../worldbook-design-and-writing/references/planning-and-loading.md#7-pair-validate-and-deliver-the-changed-scope)
for body/configuration pairs and loading evidence, then return the result to the
whole-card [validation](validation.md) gate. Preserve stable IDs, unknown fields and
unrelated content; do not rebuild an inherited book to fit a new template.
