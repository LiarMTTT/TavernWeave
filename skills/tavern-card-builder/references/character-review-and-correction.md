# Character review and interpretation guidance

Use this reference for portrayal feedback and optional guidance about a known
misreading. It complements [character design](character-design.md), existing
[validation](validation.md) and [retrofit work](retrofit-and-text-cards.md); it does
not create another approval workflow, fact store or runtime controller.

## 1. Keep four kinds of evidence distinct

| Kind | What it supports |
|---|---|
| Established character material | The current facts and portrayal decisions, with their source and status. |
| Actual generated output | What happened in that run; generated backstory or motives do not become canon automatically. |
| Author observations and preferences | The desired improvement and the author's judgement, not proof of a technical cause. |
| Diagnostic hypotheses | Possible explanations requiring an appropriate check, not new character facts. |

Use the existing material index, creative authority and acceptance ledger. Preserve
source/output locations and model, preset, opening, relevant worldbook and chat
conditions when available. Missing information stays missing. Do not require a formal
test report before helping with an ordinary description such as "too passive".

## 2. Separate static review, delivery and portrayal evidence

Static review can find contradictions, repetition, overly fixed examples and likely
gaps. It cannot demonstrate how a model actually portrays the character. If no output
is supplied, report a static assessment or suggest a small trial; do not fabricate a
test result.

Actual output shows behaviour under the observed conditions. Inspect delivery when
needed: did the intended character material reach the intended plot model, in the
expected form and active stage? Missing or duplicated prompt content is not evidence
that the personality needs more detail. Route exact injection and runtime questions
to the existing API-reference and runtime-debug skills.

Receiving the correct prompt still does not prove good portrayal. Conversely, one
convincing response does not establish long-term consistency. Retain these limits
when recording evidence and leave human acceptance to the author.

## 3. Diagnose before changing long-term material

Translate a broad complaint into an observable difference, then compare the relevant
source and output. Check, as needed:

1. Whether stable facts were contradicted or a temporary fact was treated as permanent.
2. Whether the character lacks practical reasons or means to act, or the current
   scene simply did not call on material already present.
3. Whether the author's intended meaning of a trait was absent, ambiguous or overridden.
4. Whether fixed lines, gestures or one expression scale dominate the output.
5. Whether an opening, history, world rule, preset, model limitation, missing delivery
   or output requirement better explains the result.

Compare alternatives without pretending a single cause is known. One output may
reveal a direct source problem; otherwise a different, unfamiliar scene can help
distinguish causes. A scene that copies the profile's example mainly tests repetition
of that example. Ordinary life, conflict, failure, being alone or making a decision
are possible probes, not a mandatory test suite.

Prefer a clear comparison with known model/preset and limited unrelated history when
available. Existing long chats can still provide useful evidence; describe the limits
instead of refusing analysis. Do not require a fixed repeat count, create or import a
test card, or initiate model calls solely because this guide suggests a trial; follow
the user's task and existing operation authority.

Choose the smallest supported response: leave unchanged, observe again, delete,
shorten, merge, relocate, clarify or add genuinely missing content. A problem in a
preset or loader should go to that owner rather than receive a compensating character
patch. After an authorized revision, compare the targeted behaviour and the character
facts that must remain. Do not overfit a long-term profile to one accidental output.

## 4. Optional interpretation guidance

An author may identify a known ambiguity before testing, or an observed output may
expose one. Either can justify considering a short clarification; a failed trial is
not a prerequisite. This is optional, not another required character layer.

First consider clarifying the original entry. Use a separate short instruction only
when its responsibility or delivery makes that useful. State:

- the relevant term or misreading;
- the author's intended meaning, grounded in the established brief;
- the conditions and boundaries under which that meaning applies.

Do not add new history, values, relationships or capability merely to make the
clarification convincing. Do not demand a fixed reaction, guarantee a plot outcome,
force another character's agreement, or advance a relationship or character stage.
If the intended meaning is itself a new creative decision, resolve it under the
existing authority before treating it as established guidance.

Keep the distinction between a stable fact, the character's interpretation, and a
brief instruction to the generating model. A guidance entry may clarify portrayal;
it is not a second state writer or a replacement for [stage design](character-stages.md).
Stage-specific guidance must use the same applicable condition as the portrayal it
qualifies, and must stop applying when that condition no longer holds.

## 5. Configuration and upkeep

Apply the adopted [worldbook policy](lorebook-and-prompts.md):

- Guidance about a single core character follows the blue/constant profile policy.
  In a multi-core-character card, individual character guidance follows the green
  detail policy; the overview remains blue. A new guidance label cannot bypass this.
- A necessary, brief instruction that directly guides generated behaviour may use
  the recommended D0/system placement. This is a starting configuration, not a
  guarantee of stronger adherence. It does not move all profile facts to D0.
- Effective keyword scan depth remains 2 and both recursion directions stay disabled.
- Additional stage selection uses the project's explicitly adopted and verified
  mechanism. Neither blue nor green configuration alone proves correct stage selection
  or delivery; do not invent a controller to bypass the character-entry policy.
- Send portrayal guidance to the plot model. Do not duplicate it into variable-update
  prompts unless a particular shared fact is actually required there and recorded.

Avoid retaining the same instruction in both the original profile and a separate
entry. When integrating a clarification into the source, remove or retire redundant
guidance within the authorized scope. Check stage switches, revised facts and changed
relationships for stale instructions. Keep the existing entry IDs, mappings and
acceptance records traceable; do not silently delete effective old-card material.

## 6. Review examples

| Observation or request | Appropriate handling |
|---|---|
| Every tense scene repeats a sleeve gesture that the profile explicitly prescribes. | Consider removing or broadening the fixed example; do not add five competing gestures by default. |
| Several different characters use the same ornate prose under one preset. | Inspect the shared style source before rewriting each personality. |
| One normally talkative character falls silent after bad news. | Check the situation and established meaning; variation alone is not a contradiction. |
| The author says their reserved character is often mistaken for hostile and supplies the intended distinction. | Clarify that distinction now if useful; no failed trial is required and no fixed friendly response is imposed. |
| A relationship stage changes, but old guidance continues to describe strangers. | Check the stage condition and obsolete content; do not repair this by forcing a new relationship event. |
| No generated output or prompt capture is available. | Give a bounded static assessment and state the missing runtime/portrayal evidence. |

These are review cases, not evidence that a real card or model has passed them.
