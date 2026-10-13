# Player profile and portrayal permission

## 1. Scope

A player profile describes the fictional player character. Portrayal permission says
which parts of that character the model may write. Keep these separate from the real
person's private information and from the creator's working preferences.

This reference applies to `text`, `mvu_zod`, and `hybrid`. The portrayal modes below
are convenient descriptions of permission, not additional card types, required
runtime systems, or a mandatory questionnaire. Reuse explicit decisions in the
existing [creative authority](creative-authority.md). An inherited card's effective
contract must be inspected before a change; adopting this reference does not itself
authorize rewriting the card, an existing chat, or a Persona.

## 2. Record only useful profile information

Use a shallow structure appropriate to the work; omit unused sections.

| Part | Record when relevant | Does not authorize |
| --- | --- | --- |
| Fictional identity | Name or existing placeholder, age, role, distinguishing details | Collecting or publishing the real person's identity |
| Confirmed background and relationships | Established history, relationship starting point, opening position | Inventing further history or future relationship outcomes |
| Visibility and knowledge | What is observable, who knows which facts, and on what basis | Giving every character or narrator access to the complete profile |
| Interpretation cues | Confirmed habits, intended meanings, their conditions and exceptions | Treating every similar action as having an identical motive |
| Portrayal permission | Allowed content, exclusions, affected scene or passage, and duration | Extending a local permission to every later response |
| Optional portrayal material | Voice, behavior tendencies, limits, and permitted improvisation | Requiring a complete personality system for every player |

Personality material is optional, not forbidden in player-controlled play. Its
presence does not grant portrayal permission. For delegated portrayal, use only the
parts of [character design](character-design.md) needed to perform the agreed role.
Do not require a palette, every profile field, a fixed token fraction, or repeated
feature warnings. If repetition is a real concern, state when a feature is useful to
mention rather than attaching the same prohibition to every fact.

Preserve existing placeholders such as `{{user}}`, `<user>`, or an explicit name.
Keep confirmed facts, proposals, unresolved choices, and rejected material in their
existing authority records. A generated passage cannot confirm its own new facts.

## 3. Use the actual permission scope

| Mode | Allowed scope | Boundary |
| --- | --- | --- |
| Player-controlled | Write the world and other characters; refer to established player facts and actions already supplied by the player | Do not invent player dialogue, voluntary action, decisions, inner thoughts, feelings, emotions, or bodily reactions |
| Limited portrayal | Write only the explicitly permitted parts, such as wording an already supplied action or performing a named opening passage | Permission for actions does not automatically include dialogue, thoughts, feelings, or major decisions |
| Delegated portrayal | Continue portraying the player character within the agreed creative scope | Still obey established facts, exclusions, scene boundaries, and the permitted degree of improvisation |

Without explicit portrayal permission, use player-controlled behavior. Subjective
sensations, emotions, and involuntary bodily reactions remain for the player to
write. Objective external effects and results already established by the selected
rules may be described: rain may wet clothing, but that does not permit inventing
the player's fear, shivering, or decision to run. Distinguish the effect from an
unprovided personal response. Supplied reactions and confirmed facts may be
referenced without inventing a continuation.

For an actual permission, record its source, allowed content, exclusions, context,
and duration in the existing author record. Project only the model-needed rule into
the prompt. Reuse a clear applicable permission without repeated approval; do not
infer broader permission where its scope is unclear. Ask a focused question only
when the missing scope changes the requested result. A withdrawal or scoped change
applies to subsequent work in that scope; it does not silently rewrite prior text.

Neither a detailed profile, a long player message, a third-person passage, nor a
single completed action grants ongoing portrayal permission. A local permission
for one opening branch does not automatically apply to other branches or the later
conversation. An explicit lasting permission remains effective within its stated
scope until changed; a new greeting must not silently erase it.

## 4. Separate intention, observation, and response

Interpretation cues help avoid unsupported assumptions; they do not dictate another
character's feelings or consent to an action.

1. Distinguish what the player says they intend, what they do, what is observable,
   and what each other character can know.
2. A current explicit intention governs interpretation of that input. A habitual
   cue is a conditional aid, not a rule that invalidates a different current input.
3. Missing intention stays unresolved where it matters. Do not automatically supply
   either a benevolent or hostile motive.
4. Other characters respond through their own knowledge, relationships, judgment,
   feelings, and boundaries. Knowing the player's intent as an author does not make
   it known to every character, guarantee understanding, or compel acceptance.
5. Do not turn a current action, intention, or temporary choice into a permanent
   setting update. If it conflicts with a confirmed lasting fact, identify the
   conflict and resolve it under the existing creative authority.

For example, a player may say that taking another character's hand is intended to
warn them about traffic. This establishes the stated intention. Whether the other
character sees the traffic, understands the warning, welcomes the contact, or
responds differently still depends on the scene and their own characterization.

Apply the [world knowledge boundaries](worldbuilding-design.md) and their degrees
of awareness. An intention-to-response example is not evidence of a fixed hidden
model mechanism. Evaluate observable prose and prompt behavior instead.

## 5. Choose a source and prompt destination

| Location | Suitable content | Boundary |
| --- | --- | --- |
| Card worldbook | Work-specific player identity, background, relationships, and the portrayal rules the model needs | Load only the selected identity where alternatives exist; maintain knowledge boundaries |
| Player-managed Persona | A fictional identity the player explicitly wants to reuse in their chosen scope | Do not create, overwrite, enable, or globally persist it without explicit authorization for that operation |
| Existing author records | Permission evidence, full scope, decisions, proposals, private sources, and change history | Keep private material and process commentary out of model-visible prose and public card packages |
| Current input or opening choice | Current action, stated intention, temporary selection, and a local permission | Do not promote transient information to permanent world facts or global preferences |

Use one maintained source for each fact and reference it rather than manually
duplicating it between Persona and worldbook. Identify the sources and resolve
conflicts explicitly. Do not automatically import real personal data or private
creator preferences into a player character. The profile is not a new memory store;
use the existing [memory boundary](memory-architecture.md) and prompt budget.

Persona is an optional destination, not a prerequisite for this authoring method.
Storage, precedence, macros, and injection behavior depend on the target host;
verify exact implementation through `$sillytavern-api-reference` when implementing.

## 6. Openings and review

In [opening authoring](opening-strategies.md), establish the scene using confirmed
player facts and the permission that actually applies to that branch. An established
position or past event is a scene condition, not permission to invent the player's
next action. Other characters may continue their own activities or change the
situation; preserving player agency does not require an inert cast or a question
at the end of every opening.

Review the finished passage and relevant model-visible rules for:

- correct fictional identity, established facts, and knowledge boundaries;
- no portrayal beyond the applicable permission, including feelings and bodily reactions;
- no inference of permission from the profile's length or personality content;
- no forced equivalence between player intent and another character's knowledge or acceptance;
- no local opening permission leaking into another branch or the later conversation;
- no transient input becoming permanent setting or private information entering a package;
- no contradictory absolute ban when limited or delegated portrayal is explicitly authorized.

Link findings to the existing [character review](character-review-and-correction.md)
and acceptance record. Static review can establish written scope and examples, but
cannot guarantee that a target model follows the scope during play. When runtime
acceptance is in scope, inspect representative outputs under the selected mode and
record any untested boundary without demanding hidden reasoning.
