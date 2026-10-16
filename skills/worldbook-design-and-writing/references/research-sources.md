# Research sources and limits

Consult this appendix when a design rationale, source check or behavioral comparison
is needed. It is not required reading for every entry rewrite. The references below
were checked on **2026-10-15** against their linked original documents. Living vendor
pages can change; the paper versions and DITA/SKOS editions are identified below.

These sources support bounded design choices. They do not establish that this
worldbook method has been experimentally validated. Existing TW responsibilities,
knowledge boundaries, prose protection and state/runtime owners remain their existing
authorities; moving those methods to this Skill did not make them new research results.
The examples and comparison plans here are self-authored applications, not examples
reported by the cited authors.

## 1. Writing, organization and terminology

| Original source and inspected section | Concrete use in this repository | Support and limit |
|---|---|---|
| [Google Technical Writing: Documents](https://developers.google.com/tech-writing/one/documents), scope, audience, comparison and organization | [Planning §1–2](planning-and-loading.md#1-scope-size-and-authority): identify the receiving task and organize information around it. [Writing §2](writing-contracts.md#2-define-the-concept-and-its-useful-limits): state a familiar concept's useful similarities and differences. | Technical-document guidance motivates scope and reader checks. It is not evidence that literary atmosphere should become technical prose, or that these existing TW checks originated in this article. |
| [EARS, author's guide](https://alistairmavin.com/ears/), generic, state-driven and event-driven patterns | [Writing §1 and §3](writing-contracts.md#1-know-what-a-sentence-does), including the guard intervention example: distinguish a continuing condition, triggering event and permitted response. | Requirement patterns help expose missing conditions. The example is a local adaptation; no mandatory English `shall` syntax, one-sentence-per-entry rule or compulsory EARS form follows. |
| [NASA Appendix C: How to Write a Good Requirement](https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/), C.1–C.4 | [Writing §1](writing-contracts.md#1-know-what-a-sentence-does) and [semantic invariants](writing-contracts.md#6-semantic-invariants): inspect subject, force, ambiguity and observable consequences. | Engineering requirements inform rule review. NASA's preference for positive phrasing is not adopted as a ban on useful negation; TW preserves exceptions, uncertainty and literary openness. No invented value resolves an undecided setting. |
| [Anthropic prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices), clarity, context, examples and long-context guidance | [Prompt specification](../../orchestrate-project-blueprint/references/prompt-spec-contract.md) and [writing §5](writing-contracts.md#5-structured-prose-and-processing-boundaries): clarify the consumer, relevant facts and examples. | Vendor guidance for its named models is a testing lead. Its XML, example-count and placement recommendations are not universal TW quotas, authority boundaries or guarantees for another model. |
| [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), 2025-09-29, context selection and retrieval | [Planning §2 and §6](planning-and-loading.md#2-joint-planning), [E06 output budget](../../sillytavern-rolecard-performance/references/worldbook-output-budget.md) | The engineering account motivates selecting task-relevant information under a finite budget. It does not prove that fewer tokens are always better, establish universal context degradation, or supply SillyTavern loading semantics. |
| [DITA 1.3: The topic as the basic unit of information](https://dita-lang.org/1.3/dita/archspec/base/topicdefined) | [Planning §2](planning-and-loading.md#2-joint-planning) and the [port rule/exception pair](examples.md#2-port-rules-and-a-secret) | Topic-oriented authoring distinguishes a coherent responsibility from delivery organization. A DITA topic is not automatically a runtime entry; the source also allows less self-contained topics. This adaptation requires no XML architecture and does not split every sentence. |
| [NN/g: Taxonomy 101](https://www.nngroup.com/articles/taxonomy-101/), taxonomy versus navigation, information architecture, content models and ontology | [Planning §2](planning-and-loading.md#2-joint-planning) and [E05 typed targets](../../sillytavern-database-rolecards/references/worldbook-target-state-contract.md) | Controlled naming and category relationships help authors find and distinguish material. Categories, UI navigation, semantic relations and runtime activation are separate; a taxonomy neither verifies a trigger nor requires a new ontology system. |
| [Diátaxis: Reference](https://diataxis.fr/reference/), description, standard patterns and links to other documentation types | This on-demand source reference, [writing method](writing-contracts.md), [examples](examples.md) and [optional comparison plans](behavioral-validation.md) have distinct purposes. | Information-oriented reference should be findable without embedding every explanation in the working instructions. This is an organizational adaptation, not a requirement to create four compulsory documents for each task. |
| [W3C SKOS Primer](https://www.w3.org/TR/skos-primer/), 2009 W3C Working Group Note, §§2.1–2.4 (concepts, labels, relations, documentation) | [Writing §2](writing-contracts.md#2-define-the-concept-and-its-useful-limits) and [same-name example](examples.md#6-one-label-two-local-meanings) | SKOS distinguishes concepts from their labels and provides definitions and scope notes. We borrow that distinction for ordinary prose: a label is not a local definition; identical labels need not identify one thing. No RDF/URI toolchain, SKOS-conformance claim or second identity registry is required. |

## 2. Research that motivates optional comparisons

| Original research and checked scope | Worldbook application in this patch | What it does not establish |
|---|---|---|
| [Jiang et al., How Can We Know What Language Models Know?](https://aclanthology.org/2020.tacl-1.28/), TACL 2020; [paper](https://aclanthology.org/2020.tacl-1.28.pdf), §§3–5: prompt mining/paraphrasing, ensembles and relational-knowledge probing on LAMA | [Comparison A](behavioral-validation.md#2-a-equivalent-wording): test semantically equivalent formulations rather than assuming identical model behavior. This is a new optional test design, not a reproduction of LAMA. | Knowledge retrieval from the evaluated pretrained models is different from obeying supplied fictional rules. The study does not prove stable recall from a special label, identify one best synonym for every model or validate the examples in this Skill. |
| [Zheng et al., Take a Step Back](https://arxiv.org/abs/2310.06117), [v2 full text](https://arxiv.org/html/2310.06117v2), 2024-03-12, §§2–7: abstraction followed by reasoning on STEM, knowledge QA and multi-hop tasks | [Comparison B](behavioral-validation.md#3-b-local-definition-and-concept-framing): check a supplied local definition and an optional concept-first restatement. This is an authoring hypothesis inspired by abstraction, not the paper's model-generated two-step procedure. | Results for the tested models/tasks do not guarantee worldbook quality. The paper itself notes that abstraction is not needed or possible in all cases. Adding missing facts, adding a label and changing presentation are different interventions. No compulsory intermediate model call or hidden-reasoning output is introduced. |
| [Liu et al., Lost in the Middle](https://arxiv.org/abs/2307.03172), [v3 full text](https://arxiv.org/html/2307.03172v3), 2023-11-20, §§2–4: controlled information position/length in multi-document QA and synthetic key-value retrieval | [Comparison C](behavioral-validation.md#4-c-position-and-context-length): vary the position of the same rule packet within an actually assembled input; vary context length in a separate comparison. | Those retrieval tasks do not prove that all models have a U-shaped curve, that an `order` value is an attention weight, or that D0 is best. A host setting is not evidence of final position. Some evaluated models did not show the same failure on the synthetic task. |
| [Anthropic: Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), 2026-01-09, evaluation structure and code/model/human graders | [Comparison record](behavioral-validation.md#5-record-and-interpret-results) and the existing [E07 evidence boundary](../../sillytavern-runtime-debug/references/worldbook-isolated-runtime-checks.md) | The engineering guidance distinguishes trials, transcripts, outcomes and graders. It supports choosing evidence appropriate to the claim; it does not validate this package, replace author judgment about prose or make a deterministic fixture into a model trial. |

## 3. Runtime and existing TW authority

For native loading, use [SillyTavern World Info](https://docs.sillytavern.app/usage/core-concepts/worldinfo/)
with the target installation. For templates, the [features](https://github.com/zonde306/ST-Prompt-Template/blob/main/docs/features.md)
and [reference](https://github.com/zonde306/ST-Prompt-Template/blob/main/docs/reference.md)
are lookup entrances, not pinned runtime evidence. [E03](../../sillytavern-api-reference/references/worldbook-version-verification.md)
already records fixed implementation checks and what still requires target verification;
this writing supplement neither replaces nor extends those checks. Mutable `main`
links do not identify the installed revision.

The existing builder [worldbuilding reference](../../tavern-card-builder/references/worldbuilding-design.md),
[lorebook reference](../../tavern-card-builder/references/lorebook-and-prompts.md),
[state owner](../../tavern-card-builder/references/variable-systems.md) and shared
[runtime foundations](../../consult-tavernweave-library/references/sillytavern-runtime-foundations.md)
retain their established scope. The new material here is the explicit source-to-method
mapping, the local-term disambiguation example and the optional comparison designs.
Source agreement, static consistency, actual delivery and model behavior are different
claims; report only the level supported by the evidence obtained.
