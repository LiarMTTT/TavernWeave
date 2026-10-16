# Write precise worldbook bodies

Keep worldbook writing rules in this reference: how to word the prose and the author's
rules, and how to distinguish facts from what characters know. World creation remains in builder's
[worldbuilding-design.md](../../tavern-card-builder/references/worldbuilding-design.md);
entry reachability and configuration are in [planning-and-loading.md](planning-and-loading.md).
Use supplied facts and confirmed decisions. The checks below are a writing method,
not a questionnaire or compulsory output template.

## 1. Know what a sentence does

Distinguish a world fact, causal relationship, conditional rule, tendency, rumor,
expression instruction, current state and knowledge boundary. Do not collapse them
into a slogan such as “保持真实神秘”. A mixed source may contain several responsibilities;
preserve it and route each part rather than treating every sentence as a direct order.

For a constraint, inspect only the applicable elements: subject, scope, condition,
result, exception and permitted variation. “Must”, “only”, “must not”, “usually” and
“try to” commit to different things. Preserve useful negation, degree, uncertainty,
causal limits and examples when shortening. Direct and concrete is preferable to
vague emphasis; minimum token count is not the objective.

New core setting, gameplay goals and major plot changes are proposals before adoption.
Ordinary details may be filled in within the user's authorized creative scope, without
repeated approval for the same choice. An unresolved fact is not automatically an
invitation to invent canon. Do not add a new power, exception or compulsory outcome
merely to make the text sound complete.

## 2. Define the concept and its useful limits

A familiar concept can convey a relationship economically, but can also import an
unwanted assumption. State the borrowed core and the differences that matter here.
Concept labels do not guarantee recall of the author's intended definition.

A **label** is the name used to refer to something; a **local definition** states what
that name means in this setting, with its relevant scope and limits. Familiarity with
the label is not evidence that the receiving model has the local definition. Two
things can share a name, and one thing can have several names. Do not merge them or
import outside traits solely because their labels match.

When ambiguity matters, name the subject and its type or context in the body. Keep
the useful definition reachable alongside independently loaded detail; an author-only
glossary, title or keyword is not delivery of that definition. Reuse existing stable
identities and aliases, rather than creating a second registry. See the
[same-name example](examples.md#6-one-label-two-local-meanings). The conceptual
distinction is consistent with [SKOS](research-sources.md#1-writing-organization-and-terminology),
but ordinary prose is sufficient; no RDF tooling is required.

The examples use the [Kingdom of Yuguan](examples.md#shared-setting-the-kingdom-of-yuguan).
For this teaching case, the author has established how its lamp workshop trains apprentices:

> 石渡的符灯工坊由师傅带徒。学徒参与修灯，工料按修缮需要和各人承担的活计分配。师傅由同行公开评议选任，不世袭；学徒可以更换师傅，但须交接未完的修缮。

“不世袭” and the transfer condition prevent unsupported lifetime loyalty or inherited
office. Do not replace them with an absolute positive slogan that loses the boundary.

For a coined term, define the object and condition locally:

> 石渡人把重复借用港署传音石的维护费叫作回声税。

This does not imply ghosts, magical punishment, a universal levy on speech, or a
character trait. Add a rate, exemption or enforcement only if the source authorizes it.

Another bounded rewrite: if the author specified both properties, replace ambiguous
“城门护障隔绝外界” with “石渡城门的护障阻挡箭矢，但声音可穿过。” Do not add fire resistance or thought
blocking. A useful negative is not an imperfection to remove.

## 3. Rules, exceptions, strength and freedom

| Kind | Keep clear |
|---|---|
| Hard fact | What is established and cannot change without the relevant authorization. |
| Conditional rule | The prerequisite and consequence; an exception is limited to its stated scope. |
| Tendency | The actual strength: usually, may, most, rare. It is not an absolute every-turn behavior. |
| Free space | Details the model may supply without changing canon, player agency or the rule. |
| Undecided item | What remains open and who decides; it is not necessarily free space. |

The city-gate entry gives the guards a task and a limit to their authority:

> 石渡城门外常有等候验货的车队。城门守卫负责维持通行，货款争执由市法庭裁断。对堵路推搡的滋事者，他们通常先警告；不听劝的，再拘留。有人正在伤害平民时，可直接制止。拘押簿要写明扣人的缘由，商人付过门税，也不能凭税票指使守卫抓人。

The warning-and-detention sequence concerns people disrupting passage, with detention
conditional on ignoring the warning. “通常” is not “一律”; “可” is not “必须”. The
exception permits immediate intervention against ongoing harm. A tax receipt does
not give a merchant arrest authority, and stopping a fight does not settle a debt.
These facts let the model work out a scene without a fixed speech or gesture. Do not
prewrite the player's action, motive or feelings.

Check the rule against a few different encounters:

| Scene | Expected reading |
|---|---|
| 滋事者听见警告便让开道路，现场无人受伤。 | The ignored-warning condition is absent; this rule does not automatically require detention. |
| 有人正在殴打平民。 | Immediate intervention is permitted. Keep “可”; do not turn permission into a compulsory response. |
| 商人举着税票，要求守卫替他抓走欠款人。 | The receipt grants no arrest authority. The debt remains a matter for the city court. |

These are authored review expectations, not captured model responses.

Keep the ordinary rule and an exception together when the same judgment needs both.
If an exception lives separately, its reliable co-delivery is part of the design,
not a hope that the model remembers it. Resolve real contradictions through the
existing decision authority; insertion order and “later wins” do not settle canon.
Historical/current versions and different people's beliefs can coexist without being
contradictions when their scope is explicit.

## 4. Facts, knowledge and degrees of awareness

An objective fact is distinct from access to it and from a person's belief. A
model-visible fact does not make every character know it. Where that distinction
matters, identify:

- the objective fact, or its unresolved status;
- the people or groups with access, including differences within a group;
- the extent of knowledge: unknown, heard of, partial, detailed, mistaken or outdated;
- what that person actually knows, not merely a category label;
- the basis: observation, document, rumor or inference;
- how new evidence can change knowledge, only when play needs that change.

These are descriptive possibilities, not a mandatory enum, numerical score or
character-design form. Expertise does not grant every secret. Hearing a rumor does
not confirm its truth; a misleading belief must not be rewritten as objective fact.
Do not reveal deeper information simply because another character or the narrator
has access to it. Source-library provenance such as `known_from` records evidence;
it is not automatically an in-story knowledge permission.

In the outlying fief, the author has established a rumor but not its truth:

> 青岑领的佃户流传废井藏龙的说法，尚无确证。

This permits investigation, argument and fear. It neither establishes a real dragon
nor declares a hoax. A rewrite must preserve both the existence of the rumor and the
unresolved truth. The [port example](examples.md#2-port-rules-and-a-secret) pairs a
secret with the people who know it; a “do not leak” instruction alone is not a
technical confidentiality guarantee. Use information filtering when the receiving
generation path should not receive the secret at all.

Stable knowledge can remain in setting material. Only changes with a real cross-turn
consumer need state, through builder's [variable systems](../../tavern-card-builder/references/variable-systems.md)
and E05. Do not introduce a second mutable truth or silently convert a text card to MVU.

## 5. Structured prose and processing boundaries

Use meaningful headings, shallow groups, natural paragraphs or named fields where
they clarify responsibilities. YAML/XML are optional authoring examples, not universal
formats, minimum section counts or word-count quotas. Preserve syntax required by an
actual parser/importer and the project's protected placeholders. Tags do not confer
authority or guarantee isolation.

An independently loaded detail names its subject in the body, explains useful
conditions and consequences, and makes sense with its declared foundation. A title
or keyword list does not supply missing facts. Preserve necessary atmosphere and
the work's voice; do not turn every sentence into a separate key or force equal-length
sections. “The model probably knows” is no reason to delete a fact the author wants
reliably present.

Review the book for duplicates, omissions and interacting rules before adjusting
order and polishing sentences. Remove unsupported grand claims, unexplained name lists
and unused encyclopedia branches. An abstract rule need not have an example. Keep an
example when it prevents a costly misreading; do not generalize its special outcome
into an unconditional rule or remove conditions to save length.

### Model-facing body and processed source

Keep in the model-facing body what the receiving model needs for its intended task.
Author design rationale, maintenance history, rejected ideas, workshop commands,
configuration explanations and requests for hidden reasoning belong outside it.

Distinguish maintained source, verified processing and assembled model input.
Necessary EJS, macros or conditional source may select or generate the body. Do not
delete working syntax as decoration, remove a secret's guard, or assume raw script
belongs in the final input. Preserve an unknown script role in a narrow prose edit
until its owner checks it. Retain code only when required by actual processing or by
the receiving model's task. Exact APIs and final-prompt evidence retain their owners.

Apply the existing [natural Chinese review](../../rewrite-natural-prose/references/natural-chinese-review.md)
without enabling a persistent rewriting mode. Remove unnecessary semantic triads,
including conjunctions or adjacent sentences, and defensive repetition that merely
restates an already clear boundary. Keep real conditions, uncertainty and degree.
This prose capability keeps its existing scope and authoring purpose.

### Standalone author rules

For a rolecard's standalone prompt rule or creative restriction, inspect the required
result, subject, affected output, strength, semantic boundary and confirmed exceptions
or precedence. These six checks are internal working checks, not six required fields.
Ask only when a missing decision changes the result. Do not strengthen a tendency
into an unavoidable reaction, invent an exception, or resolve conflicting rules silently.

Group related instructions by their object/responsibility when useful. World facts,
knowledge degrees and narrator instructions remain distinct. Preserve the project's
syntax and placeholders. Tool/delivery limitations stay outside the creative body;
fictional constraints stay with the content they govern.

A chat-only rule request ends with the requested rule prose. It does not need MVU,
CoT, a world-size interview or a whole-card report. An actual entry additionally uses
the [body/configuration pair](planning-and-loading.md#7-pair-validate-and-deliver-the-changed-scope),
without a compulsory D0. A local correction preserves IDs, unknown fields, effective
inherited prompt fields, unrelated content and configuration. Ordinary articles and
real-world rule explanations stay outside this rolecard workflow. Custom CoT remains
with builder's [CoT reference](../../tavern-card-builder/references/cot-design-and-authoring.md).

## 6. Semantic invariants

Before a rewrite, identify the meaning that must survive. After it, compare source
and draft by that meaning rather than by a required phrase count:

- Who and what are covered? What remains outside the scope?
- Which prerequisites, negations, costs, exceptions and causal links are necessary?
- Did the draft preserve “usually/may”, uncertainty and the origin of a claim?
- Are truth, belief, access, time and current state still distinct?
- Which details can vary, and which are still undecided rather than delegated?
- Did a new ability, core setting, goal, major event or player action appear without
  the corresponding decision?
- Are identifiers, protected syntax and configuration unchanged outside scope?

Check a positive, contrasting or missing-information scene when it tests a real risk.
The port must admit eligible ordinary cargo in normal conditions as well as reject
it under closure; otherwise a draft may merely teach blanket refusal. Rumor review
must not decide whether the dragon exists. A semantic review does not prove delivery
or reliable model behavior; those are separate evidence levels.

If a material ambiguity or observed model failure remains, the
[optional comparisons](behavioral-validation.md) can test equivalent wording, a local
definition or context position under controlled conditions. They are not mandatory
for each entry, and static review must not be described as a successful model trial.
