# Plan information and loading together

Use this reference to decide entry boundaries, choose how entries load, and pair each
body with its configuration. The builder retains world creation, whole-card responsibility,
[core-character activation and model routing](../../tavern-card-builder/references/lorebook-and-prompts.md),
and CoT design. Use only the parts needed for the current task.

## 1. Scope, size and authority

Reuse the existing Content map, creative decisions, source provenance and state ledger.
First determine what “better” means in context: fewer irrelevant details, fewer missing
rules, easier maintenance, or a specific required mechanism. The shared
[communication rules](../../consult-tavernweave-library/references/communication-and-guidance.md)
own clarification. Do not replace an explicit requirement with a guessed “real goal”.
Inspect safely before deciding; unknown versions allow a conditional design, not an
invented capability or an automatic extension installation.

Before a new worldbook design or material redesign, explain and ask for **小型 / 中型 / 大型**.
Reuse a confirmed choice, never infer it from silence. A narrow wording, ID or
configuration repair and a read-only review do not restart this interview.

| Choice | Meaning and next work |
|---|---|
| 小型 / small | One focused playable stage. Write a compact body and paired configuration, normally one constant world entry; several constant entries are fine when they improve maintenance. Stop before unused branches become an encyclopedia. |
| 中型 / medium | A connected main stage. Plan common foundations and independently needed details, their responsibilities and dependencies before full prose. Several constant entries are allowed; keyword entries have no quota. |
| 大型 / large | Multiple independent contexts. Agree playable scope, a small shared foundation and entry/loading relationships first, then write bounded batches. Track first use, scene continuation and budget; leave unplanned territories open. |

Size is a playable-scope choice, not a word count, entry count, quality rank or mandatory
progression. A vast fictional universe can support a small card. If a small design
newly needs independently activated details, explain the scope change and recommend
medium rather than silently expanding it or deleting necessary facts. These sizes
concern world content, not the count of character or variable-protocol entries.

## 2. Joint planning

For a small project, a few sentences suffice. Extend the existing map for larger work:

| Question | Design consequence |
|---|---|
| What must the receiving model decide in this scene? | Name the concrete decision, not just an encyclopedia topic. |
| Which facts, rules, exceptions and current inputs are needed together? | Merge short, tightly coupled material; avoid leaving an exception behind. |
| Where do those facts and current values come from? | Link their source and state owner; a current value is not another world fact to duplicate. |
| What actual entry or processing path can reach the intended model? | Record native activation or verified explicit access, processing stage, recipient and failures. |
| Which details differ in use, secrecy or lifecycle? | Split when independent access is useful; keep knowledge boundaries with the fact they constrain. |
| What fails if one part is missing? | Give a reachable common dependency or reconsider the split; a document link does not load runtime content. |

Keep one coherent responsibility per entry, while retaining facts that must be read
together. Separate author notes, maintenance history, full source documents and plans
from material needed in the prompt. Do not load everything merely because it shares
a source chapter. Keep common foundations short enough to orient a first mention;
do not repeat them in every detail entry.

For each entry, record its stable identity and human label, where its body comes from,
what it is for and which information it covers. Then record how it activates and is processed, which
model receives it, placement constraints and dependencies. Mark whether the material
is maintained source, generated output or optional. Check the body, activation,
processing and delivery separately: a title or keywords cannot supply a fact omitted
from the body.

## 3. Native foundations and preserved TW policy

Native constant and keyword strategies are choices in the actual host format, not proof
that a colored icon delivered content. Enabled state, matching, filters, budget and
request assembly can still matter. Verify fields in the target export/API; editor labels,
standalone worldbook fields and embedded-card fields are not interchangeable.

- Constant/blue suits short information needed throughout play. It still requires
  actual budget and request checks; it is not an unlimited delivery guarantee.
- Keyword/green suits details with reliable scene names or context anchors. Use formal
  names and unambiguous aliases; do not add broad words such as “城” or “家” merely to
  increase hits. Choose keys by hit/miss/collision evidence, without a keyword quota.
- Where adopted, primary/secondary text filters express matching requirements:
  AND ANY needs at least one secondary match, AND ALL all, NOT ANY none, NOT ALL fewer
  than all, after a primary match. These are intended text conditions, not proof that
  an actual world state is true. Verify target semantics and empty-secondary behavior
  through E03; do not infer behavior from an enum or a dated guide alone.
- Effective keyword scan depth is **2**. Set it explicitly where supported or record
  a verified inherited value of 2. Unknown inheritance is unresolved. Scan depth is
  not prompt insertion depth; 2 does not mean D2.
- **Both directions of native recursive activation are disabled for every entry**,
  including constant, disabled and explicitly read entries. They neither activate
  through other entries' text nor activate further entries through their own text.
  Constant/explicit paths may not use keywords; dormant keyword depth remains 2 where
  such a setting exists. Explicit reads and object traversal are not native recursion.
- Do not increase scan depth, enable recursion or force repetitive naming to fix a
  missing dependency. Diagnose the entry boundary and actual loading requirement.
  Unsupported settings or conflicting inherited choices remain visible; do not change
  global host configuration without authorization.

Keep a project's proven placement and order. New world foundations can start before
character definitions and local details after them; a brief immediate instruction
may use a task-appropriate insertion depth/role, including D0 where justified. These
are scene examples, not fixed numeric order ranges, universal D0, brand-specific
depth rules, or promises of stronger compliance. Retain the host's `order` field.
Assign concrete values only from the required relative layout and verified format;
inspect the assembled result. Insertion order is neither a semantic conflict resolver
nor evidence of controller execution order. Core-profile placement remains with builder.

Probability, sticky and cooldown are normally unused for new cards. Recommend them
only for an explicit request or a demonstrated need; explain random omission or
duration before adoption. The normal new-card path stays deterministic unless another
behavior is deliberately adopted. Preserve deliberate inherited values. Delay, groups, filters
and controller settings likewise require their real purpose and target semantics;
do not invent timed controls to conceal loading defects.

With scan depth 2 and recursion disabled, review first introduction, continued presence
without repeated names, departure, and alias/quoted/negated mention collisions. A concise
foundation or natural opening/input anchor can handle a first mention. An overview
listing a name does not guarantee same-generation detail loading. If state rather
than text must decide, request an existing state reader and verified delivery path.

## 4. E01: choose the least complex sufficient mechanism

| Need | Candidate | Required evidence and cost | Upgrade or exit reason |
|---|---|---|---|
| Short independent knowledge with reliable scene words | Native keywords | Match window, aliases, misses and actual request; no template dependency | Keep it native while reliable. Move only when required facts regularly lack a text anchor. |
| Short shared rule needed every round | Native constant | Bounded body, recipient and final budget | Split independent detail if constant cost grows; do not move the essential exception away. |
| A few branches within one responsibility | Conditional output inside a reachable entry | Verified processing stage and ready state; true/false/missing cases; template cost | Prefer this to a controller for a short rule. Return to native prose when selecting text adds no benefit. |
| Long mutually exclusive material | Existing controller with explicit reads | Stable targets, existence, state authority, missing-read policy, output budget and request proof | Useful when selecting avoids substantial irrelevant material; remove orchestration if the set becomes small. |
| Several entries need the same dependency | Shared authority plus a reliable access path; possibly a controller | Explain which entry reaches it and who deduplicates it | A simple entry can explicitly read one dependency. Centralize only when coordination actually reduces duplication or errors. |
| Only some scenes need complex state | Partial native/template mix | One owner for each fact, cross-path deduplication and required shared dependencies | Keep unaffected entries native; mixed loading does not require every entry to support both mechanisms. |

**A centralized controller is an organization choice; explicit loading is an action.**
They are not mutually exclusive technical levels. One controller may read several
entries; a simple conditional entry may read one. The bridge example in
[examples.md](examples.md#1-e02-one-bridge-three-designs) compares actual bodies, inputs,
entry paths, outputs and costs before introducing a multi-controller case.

For ST-Prompt-Template, distinguish entry reachability, template evaluation/output,
and delivery into the receiving request. A true condition inside an unreachable entry
does nothing. Rendering to the player's screen is not proof of model input. Use
[E03 version verification](../../sillytavern-api-reference/references/worldbook-version-verification.md)
for exact API calls, decorators, parameters, disabled-target reads and scope/lifecycle.
Conceptual examples here are not verified runnable EJS.

Conditional designs can use the following adjustable scenarios. They are examples,
not an exclusive menu, function whitelist or mandatory code structures:

| Scenario | Use and boundary |
|---|---|
| One value selects a rule | Water level selects an applicable passage rule; use true/false/missing cases as in E02. |
| A special state takes precedence | An emergency restriction precedes an ordinary access rule when the author approved that relationship; specify E04 precedence. |
| A rule needs conditional supporting detail | A common rule can load one applicable local exception through a verified path; nested templates are optional. |
| Template-generated keywords | Exclude any path dependent on native recursive scanning. Other claimed non-recursive extension paths require E03 version and stage evidence before adoption. |
| Date selects an event | Read an existing date owner, distinguish valid/invalid/missing values, and verify the implementation; do not force an event or assume a date-string recipe. |
| Render state to the player | Route to [embedded UI](../../sillytavern-embedded-ui/SKILL.md); a display template is not worldbook activation or proof of generation input. |

A suitable implementation may adjust or replace these patterns. Character-stage
design retains its existing builder owner; these examples introduce no character facts.

## 5. E04: state, choice and mention precedence

Define precedence as an author-approved content policy, not by the incidental order
of independent `if` statements. The following is a recommended neutral example:
confirmed current state selects the current era; an explicit cross-era comparison
permits clearly labeled reference material without changing that state. A textual
mention, quoted name or negation does not prove presence, membership or a state change.

An explicit choice changes the current era only through the authorized writer and
validated state update. Until success, a reader uses the last confirmed state or the
agreed pending/failure response. Do not treat “switch to era A” in a message as evidence
that the write already succeeded. Cross-era references need explicit scope, not a
permanent permission inferred from one comparison.

| Case | Confirmed state | Choice/write result | Mention and comparison scope | Expected selection |
|---|---|---|---|---|
| R1 | C | None | A mentioned; no comparison permission | Current C only; no silent A/C mixture |
| R2 | C | None | “不是 A”; no comparison permission | Current C only; negated A is not current state |
| R3 | C | None | Explicit comparison with A authorized | Current C + separately labeled A reference; state stays C |
| R4 | C | Switch to A requested; pending/failed | Any | Keep confirmed C or the agreed pending response; do not report a successful switch |
| R5 | A | Switch to A validated and committed | C merely mentioned | Current A; mention does not override the accepted update |
| R6 | Missing/invalid/init sentinel | No valid update | A mentioned | Missing-state fallback; do not invent era A |
| R7 | C | None | Two relevant entities, aliases repeat | Select each permitted entity once by stable identity; no assumed presence |
| R8 | C | None | Entity mentioned but presence required and false/unknown | Do not select its presence-only payload; distinguish explicit false from missing |

R7 applies when topic-reference material is wanted. If the project instead requires
only present entities, declare the extra presence condition and apply R8. This policy
does not create character facts or a character-stage system. If project rules conflict,
ask the smallest meaningful question instead of silently choosing an era or priority.

## 6. State and mixed-path boundaries

Mixing native and template entries in one book is independent of the card types
`text`, `mvu_zod` and `hybrid`. Do not relabel or migrate a card to solve a loading issue.
State remains in its existing authoritative mechanism. Selection does not advance a
stage, reset a route, write a fallback or create a duplicate field.

Use [E05 target/state integrity](../../sillytavern-database-rolecards/references/worldbook-target-state-contract.md)
for aliases → entities → typed targets, initialization sentinels, schema, writers,
message scope and consumers. Undefined, null, empty text, 0 and false are not equivalent.
Use the agreed missing policy: an explicit unknown, omission of optional material, or
stopping a dependent operation. Never fill a missing era/chapter with invented canon.

Use [E06 output budget](../../sillytavern-rolecard-performance/references/worldbook-output-budget.md)
for stable content identity across native and template paths, deduplication, priorities,
fallbacks and measured final token cost. One controller's alias set does not deduplicate
the whole prompt. A host budget flag alone does not establish template-read budgeting.
Budget plot/update recipients separately where adopted; do not shorten away constraints
or change persistent storage to reduce prompt size.

## 7. Pair, validate and deliver the changed scope

An actual entry has a body/configuration pair linked by stable ID or maintained source
identity: enabled state, activation, keywords, effective scan depth, both recursion
directions, placement/order, applicable depth/role, relevant other controls, recipient,
dependencies and preserved source values. “Not applicable” differs from “unknown”.
Author decisions and configuration explanations stay outside the model-facing body.

The builder's [optional worksheet](../../tavern-card-builder/assets/templates/worldbook-design.md)
is an authoring view, not importable JSON or a required form. Markdown/YAML authoring,
editor fields, helper API objects, standalone exports and embedded exports have separate
schemas. Derive an export from a verified format/local export, preserve stable IDs and unknown
fields, and check key/UID consistency and roundtrip through the pipeline owner.

For prose-only work, check [semantic invariants](writing-contracts.md#6-semantic-invariants)
and deliver the requested prose. For loading changes, add only applicable scene tests,
true/false/missing state, dependencies and recipient checks. A native-only project does
not need template installation or a full runtime matrix. Follow
[E07 isolated runtime checks](../../sillytavern-runtime-debug/references/worldbook-isolated-runtime-checks.md)
when runtime verification is authorized. A static fixture validates a design expectation,
not an imported setting, successful read or real model behavior.

Report completed paths, source/state references, unresolved choices and actual evidence.
Separate source/offline checks, import/roundtrip, final-request capture, model behavior,
author acceptance and publication. Reviews do not authorize edits; authoring does not
authorize import, installation, model charges, deployment or release.
