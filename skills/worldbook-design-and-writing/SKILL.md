---
name: worldbook-design-and-writing
description: Plan, split, merge, review, and write SillyTavern worldbooks independently of whole-card creation. Jointly design scene information needs, native or template loading, entry bodies, conditions, exceptions, knowledge boundaries, and paired configuration. Use for standalone worldbook work, semantic-preserving entry rewrites, and native/template/partial-mix choices. Keep character design, exact APIs, state writers, real-runtime validation, and packaging with their existing owners.
---

# Worldbook Design and Writing

<!-- tw-guidance-entry:begin -->
## Shared communication

Apply [TW plain-language and guidance rules](../consult-tavernweave-library/references/communication-and-guidance.md): explain terms on first use, keep the user-selected 新人/入门/熟练/老手 level, and still explain needed changes and bugs at every level. Soul and prose modes never disable this baseline.
<!-- tw-guidance-entry:end -->

<!-- tw-plugin-runtime-entry:begin -->
## Plugin runtime

When this Skill runs through a plugin, cloud host, or remote machine, read [the plugin execution contract](../consult-tavernweave-library/references/plugin-runtime.md) at entry and apply its host, tool, and persistence checks before host-specific commands. Keep this Skill's scope, authorization, and acceptance gates.
<!-- tw-plugin-runtime-entry:end -->

Write the information a scene needs, then make sure it can reach the model handling
that scene. Do not begin by dividing an encyclopedia into equal-sized entries or
adding a controller.

## Enter at the requested scope

- **Write or refine a body:** read [writing-contracts.md](references/writing-contracts.md).
  Preserve confirmed meaning and source syntax. A prose-only request does not require
  a world-size interview, runtime matrix, template installation, or export.
- **Plan or change entry boundaries/loading:** read
  [planning-and-loading.md](references/planning-and-loading.md). Inspect actual entries,
  configuration, intended scenes and available mechanisms together. Ask 小型 / 中型 / 大型
  only for a new design or material redesign; reuse an explicit confirmed choice.
- **Review an existing book:** stay read-only, select the relevant checks from those
  references, and report observed issues separately from missing material and untested
  runtime behavior. Do not rebuild the book merely to match a new-card convention.
- **Investigate a wording or context-sensitivity failure:** optionally use
  [behavioral-validation.md](references/behavioral-validation.md) for equivalent-wording,
  local-definition and position comparisons. Read [research-sources.md](references/research-sources.md)
  when the rationale or its limits matter. These are not compulsory entry-level tests
  and do not authorize model charges or runtime execution.

Before file writes, use `$consult-tavernweave-library` with this route, read A0 and
the smallest matching guide sections, and retain the route receipt with the existing
project authority. Dated guides are evidence; current authoring policy and verified
target behavior decide which examples apply. Do not copy a snapshot's recursion,
numeric order recipe, model-brand depth, or runtime assumptions into the design.

When the selection/processing/request distinction is not already clear, read the
task-relevant part of [SillyTavern runtime foundations](../consult-tavernweave-library/references/sillytavern-runtime-foundations.md).
Start with its pure-text turn. Optional template, MVU and UI chains are needed only
when the project adopts them.

## Work from the existing decisions

Apply the shared communication reference's active clarification method: separate the
user's goal, hard constraints and suggested means. “拆细、最好用模板” may be a proposal;
“所有条目必须拆开” is a constraint. Reuse the context, ask only what changes the plan,
and continue reversible work where safe. Unknown runtime capabilities are facts to
verify, not preferences for the user to guess. Show conditional plans when necessary.

1. Start from the existing Content map, creative decisions, source evidence and state
   contract. Keep the established canon, decision ledger and state store rather than
   creating parallel copies.
2. Identify what the receiving model must decide in representative scenes, the facts
   needed together, and how they can actually reach that request.
3. Choose boundaries and loading jointly. Start with native mechanisms where suitable;
   use simple conditional output or an existing controller only when it solves a
   demonstrated need. Partial mixing within one book is allowed.
4. Write the body with its semantic invariants, then pair configuration when the task
   creates or changes an actual entry. Preserve stable IDs, unknown fields, unrelated
   settings and protected text in local edits.
5. Check the changed scope. Separate source checks, import, final-request evidence,
   model behavior and author acceptance; static tests do not establish runtime success.

Use [examples.md](references/examples.md) for the same bridge requirement through
native, simple conditional and controller designs; the port/secret, unreachable-entry,
partial-mix and neutral routing cases. The examples are optional and adjustable,
not exclusive templates or required chapter/keyword/word-count quotas.
The same-name example also separates a concept's local meaning from its human label.

## Ownership and handoff

| Need | Owner |
|---|---|
| Worldbuilding, whole-card Content map, greetings, character design and final card responsibility | [tavern-card-builder](../tavern-card-builder/SKILL.md) |
| Source extraction and provenance before choosing runtime entries | [build-work-library](../build-work-library/SKILL.md) |
| Wording refinement within the protected semantic contract | [rewrite-natural-prose](../rewrite-natural-prose/SKILL.md) |
| E03: target versions, APIs, template stages and exact read behavior | [version verification](../sillytavern-api-reference/references/worldbook-version-verification.md) |
| E05: typed targets, aliases, schema/initialization, state scopes and missing values | [target/state contract](../sillytavern-database-rolecards/references/worldbook-target-state-contract.md) |
| E06: shared content identity, deduplication and final context budget | [output budget](../sillytavern-rolecard-performance/references/worldbook-output-budget.md) |
| E07: isolated real-runtime probes and actual request evidence | [runtime checks](../sillytavern-runtime-debug/references/worldbook-isolated-runtime-checks.md) |
| Source-preserving component edits, import/export and release | [component update](../sillytavern-component-update/SKILL.md), [card pipeline](../sillytavern-card-pipeline/SKILL.md) |

This skill owns E01/E02 selection and E04 author-facing precedence. It states required
capabilities and expected outputs; it does not verify an API from its name, install
extensions, implement a new scheduler, write state, execute an inherited card, or
authorize publication. Template selection is a reader, never an incidental state writer.
Native recursive activation remains disabled in both directions; effective keyword
scan depth remains 2 under the existing TW policy, distinct from insertion depth.

Return the requested prose or the applicable entry plan/body/configuration, reasons,
dependencies, unresolved decisions and evidence. Keep short tasks short.
