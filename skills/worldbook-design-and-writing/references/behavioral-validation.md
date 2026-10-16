# Optional worldbook behavior comparisons

Use this appendix when an observed failure or material design choice warrants a
comparison. A short prose correction does not require an experiment, every entry
does not need all three families, and no model call, paid evaluation or host import
is authorized by this guide. The [research mapping](research-sources.md#2-research-that-motivates-optional-comparisons)
separates original results from the worldbook applications below.

The accompanying [synthetic plan fixture](../assets/examples/behavioral-validation-cases.json)
contains author-defined inputs and expected judgments. It contains **no model output**.
Passing its offline tests establishes only that the plan and examples are internally
consistent. It must never be reported as a model passing these comparisons.

## 1. Freeze the question and shared conditions

Name the failure being tested and the smallest change that could address it. Freeze
the author-approved facts, required outcomes, forbidden additions and scoring criteria
before viewing comparison outputs. Keep discovery examples separate from later
check scenes; if a failed scene informs an edit, it becomes a regression case and
does not remain an unseen confirmation case.

Hold constant the model/version, system and preset text, conversation/state snapshot,
recipient, generation settings and output allowance wherever the comparison permits.
Record unavailable settings rather than inventing them. Use independent reset contexts
or equivalent snapshots; randomize or counterbalance variant order. With stochastic
generation, use the same declared repetition plan for each variant and retain every
trial, including failures. A single answer is a smoke observation, not a reliability
estimate; no universal trial count or pass-rate threshold is imposed here.

For text-only comparisons, supply the frozen input directly in an authorized test
context. For claims about a real worldbook, use [E07](../../sillytavern-runtime-debug/references/worldbook-isolated-runtime-checks.md)
to capture the assembled receiving request first. Missing/truncated text, a wrong
recipient or unresolved state is a delivery defect, not evidence against the prose.
Do not change entry selection and wording in the same comparison unless the study
explicitly tests their combined effect.

## 2. A: equivalent wording

**Question:** do two author-reviewed formulations of the same rule produce the same
required judgments in the target setup?

The [shared setting](examples.md#shared-setting-the-kingdom-of-yuguan) gives the north-bank tower a fog bell. Its enchantment responds to visibility at the tower, not to the judgment of a bell-ringer. Two candidate bodies express the same confirmed rule:

- A1: 白塔前的能见度不足十步时，塔顶雾铃自鸣；达到十步或更远时，雾铃不响。
- A2: 白塔雾铃随塔前的能见度鸣响：不足十步便自行响起，十步及以上不响。

Both use the same explicit unknown-value policy outside the variant body: when the
current visibility is missing, report that the bell's current state cannot be determined.
Check visibility 6, 10 and 14 steps, plus missing visibility. The expected judgments
are ringing, silent, silent and unknown. Judge the decision and preserved boundary,
not exact vocabulary. Include a deliberately broken rewrite that omits the equality
case as a reviewer diagnostic; it is not an equivalent candidate.

Only the rule wording changes. Keep the query, facts, surrounding text and placement
fixed. Record token-count differences and any accidental change in force or scope;
revise a non-equivalent pair before drawing a wording conclusion. Do not insert both
candidate bodies into the same request. A useful result is a repeatable failure class
or a more reliable candidate for this setup, not a universal synonym ranking.

The knowledge-probing paper motivates sensitivity checks; this supplied-rule task
does not test the model's pretrained factual knowledge or reproduce its benchmark.

## 3. B: local definition and concept framing

**Question:** is the local meaning available and correctly applied, and does a
concept-first presentation help after the facts are already complete?

Use the [same-name example](examples.md#6-one-label-two-local-meanings) or the synthetic
fee definition below. In Shidu, people can borrow the port office's public speaking stone to send a message. Repeat use funds its upkeep; the office covers a newcomer's first use. These facts belong to the teaching brief. Do not ask the model to invent what a term ought to mean.

- B0, diagnostic only: 回声税。
- B1, complete definition without the label: 重复借用石渡港署的公共传音石时收取维护费；首次使用不收费，私人谈话不收费。
- B2, label plus the same definition: 回声税是重复借用石渡港署的公共传音石时收取的维护费；首次使用不收费，私人谈话不收费。
- B3, concept-first restatement: 这笔钱用来维护石渡港署的公共传音石，叫作回声税。重复借用传音石时收取；首次使用不收费，私人谈话不收费。

Check repeated public-facility use, first use, private conversation, and unknown
usage count. Require charge, no charge, no charge, and unresolved eligibility
respectively. Do not invent a rate, punishment, magical effect or exemption. For
B1 ask about “这项维护费”; for B2/B3 use that same query to avoid changing both term
recognition and rule application. An additional named-term query is a separate check.

B0 versus B2 deliberately adds information, so improved answers would show the value
of providing the definition in that setting, not the isolated benefit of abstraction.
B1 versus B2 tests adding the label with complete facts; B2 versus B3 tests a
concept-first formulation, including its extra length and changed order. Record those
confounders. For stronger causal claims, prepare fact-equivalent, approximately
length-matched controls and still disclose remaining differences. Never remove needed
facts from a production entry just to make a control shorter.

Step-Back's generated abstraction-then-reasoning procedure is not implemented here.
This is a cheaper author-supplied comparison hypothesis; it introduces no compulsory
extra generation, chain-of-thought disclosure or general promise of improved writing.

## 4. C: position and context length

**Question:** can the target model use the same complete rule packet at different
positions in the actual input, with the surrounding material held fixed?

Use A1 and its missing-value policy as one unchanged packet. Place it near the start,
middle and end of the same worldbook-content block, keeping all other blocks in the
same relative order. Keep the query at the same location, the message role unchanged,
the same distractors present and the rule present exactly once. Preserve rule and
exception co-delivery; do not move only the exception and call that a position test.
The compact fixture demonstrates permutations only, not a long-context experiment.

Within each length condition, retain the same token multiset as far as the host
allows, and record actual token totals and offsets after assembly. Message wrappers,
tokenizer boundaries and hidden host insertions can alter those totals. If moving an
entry also changes its role, priority or inclusion, label the comparison confounded.
Record final positions; a numeric host `order` or configured insertion depth is not
an observed token position or a measure of instruction authority.

If length is relevant, repeat the position comparison at separately chosen short and
long context sizes appropriate to the target. Freeze each distractor set; longer
contexts must not add contradictory rules, answer leaks or new relevant facts.
Changing length also changes distractor exposure, so describe that joint change.
Confirm no truncation, budget drop or duplication with E06/E07 before scoring.

Score the same positive, boundary and missing-information cases as A, plus a scene
requiring an applicable exception when that is the actual risk. Report results by
length and position; do not infer a universal U-shaped curve, a fixed attention
weight, a model-brand depth rule or a blanket D0 recommendation.

## 5. Record and interpret results

Keep the comparison record with the existing task evidence, outside model-facing
worldbook prose. Record only what is needed to reproduce and interpret the run:

- Question, frozen candidate IDs/hashes, scene IDs, expected semantic invariants and
  any deliberately under-specified diagnostic control
- Exact assembled input or an authorized local evidence reference; target model,
  relevant host/extension versions, settings, state and observed token positions/counts
- Trial and variant order, repetitions, actual outputs, scorer/rubric and any manual
  corrections; a valid paraphrase should not fail an exact-string-only grader
- Per-case outcomes: correct application, omission, wrong strength/scope, invented
  fact, knowledge leak, unknown handled wrongly, or delivery/setup failure
- Cost/latency when measured, remaining confounders, changed wording decision, and
  author review of atmosphere, clarity and playable freedom

Keep raw outputs and failure examples. Report counts and denominators separately
for each condition, including setup failures; do not hide them in one quality score.
Small/noisy samples justify a tentative local choice, not a broad model claim. An
automatic rubric can assist judgment but does not replace checking the actual output.
If review exposes an incorrect expected answer, correct the test and mark earlier
scores invalid rather than tuning the rule to satisfy a bad oracle.

Use distinct evidence labels: **plan only**, **static consistency checked**,
**delivery observed**, **model trials observed**, and **author accepted**. Passing one
level does not imply the next. The delivered fixture stays `not-run` until real
authorized trials exist; results belong in a separate record, not retroactive claims
about the synthetic fixture. Stop when the requested decision is supported, the
authorized evaluation budget is exhausted, or a prerequisite/permission is missing.
