# Card types and runtime dependencies

If the turn-to-turn runtime chain is not already in context, first read the needed
part of [the shared runtime foundations](../../consult-tavernweave-library/references/sillytavern-runtime-foundations.md):
plain-text request and next turn, then only the chosen template/MVU/UI additions.
Do not reload an already understood chain or require the full extension matrix for
text cards. Native/template/mixed worldbooks are a separate axis from card type.

## Contents

1. Detection evidence
2. Type and capability model
3. Shared core and component architecture
4. Legacy MVU compatibility
5. Dependency classes
6. MVU Zod interpretation
7. Runtime dependency ledger
8. User notice and handoff

## 1. Detection evidence

Inspect the maintained source and, when present, the packed card. Do not classify from
a filename, card title, or one script name.

Collect evidence from:

- card format and version;
- variable initialization, update rules, command dialect, and schema registration;
- `data.extensions.regex_scripts` or the repository's equivalent character-local
  regex surface;
- `data.extensions.tavern_helper.scripts` or the equivalent helper-script surface;
- embedded UI, EJS, worldbook, loader, and remote-import code;
- profile, manifest, registry, recipe, and stable contract declarations.

Record whether each fact was declared, detected, or still inferred. A packed card may
contain extension mirrors outside `data`; preserve the repository's format rather than
normalizing unknown fields.

## 2. Type and capability model

Return one primary type plus zero or more capability flags.

Primary types:

| Type | Evidence |
| --- | --- |
| `text` | Narrative and prompt behavior without a persistent variable runtime. |
| `mvu_zod` | MVU state is governed by a card-specific Zod schema with a detected registration path and the required packaged MVU Zod loader scripts. |
| `hybrid` | Multiple runtime systems are peers and no narrower primary type describes the card. |

These are the three current types. Use `unknown` only as an unresolved planning state,
not as a fourth type or evidence that detection succeeded. A proposed target type does
not prove its runtime components already exist.

Plain text with a regex status display or an auxiliary helper script remains `text`
unless it actually uses a persistent variable runtime. An ordinary MVU Zod card with
UI, regexes, and helper scripts remains `mvu_zod`; component count alone does not
justify `hybrid`. For a genuine hybrid, identify the peer systems, their data owners,
cross-system handoffs, and conflict behavior.

Single-character versus multi-character is a separate content dimension. It controls
the character-entry policy in [lorebook-and-prompts.md](lorebook-and-prompts.md), not
the runtime type.

Use capability flags such as:

- `regex`;
- `tavern_helper`;
- `remote_loader`;
- `regional_loaders`;
- `embedded_ui`;
- `ejs`;
- `external_extension`;
- `extra_update_model`.

Do not use `retrofit`, `release`, or `componentized` as runtime types; those describe
workflows or artifact state.

## 3. Shared core and component architecture

Every completed card, including `hybrid`, requires both a usable greeting and a
worldbook. Apart from format and identification requirements, these are the common
core. The greeting may be text, an opening frontend, or a combination of both. A
usable opening frontend satisfies the greeting requirement without an additional
plain-text version. This presentation choice neither changes the primary card type
nor determines whether later play uses a frontend.

An empty greeting field, a decorative shell with no usable opening, an empty attached
book, or placeholder entries do not meet the requirement. The worldbook must contain
substantive material and resolve to an embedded attachment or the project's explicit,
verified companion-book binding. See [opening strategies](opening-strategies.md#3-custom-opening-pages)
for the frontend's message carrier, player entry and model-visible content.

| Component | `text` | `mvu_zod` | `hybrid` |
| --- | --- | --- | --- |
| Greeting and alternate greetings | Required playable starting situation. | Required; each branch agrees with its initial variables. | Required; agrees with the initial conditions of each peer system. |
| Worldbook | Required main carrier of character, world, and portrayal material. | Required; also carries the chosen variable initialization, state exposure, update rules, and output requirements. | Required; identify which systems and models consume each part. |
| State | Narrative or text status; do not add MVU merely to display it. | Persistent MVU state constrained by a card-specific Zod schema. | Declare one authoritative owner for each fact and any cross-system writes. |
| Regexes and helper scripts | Include only those needed by the selected features. | Include the selected protocol's required loaders, registration, updates, and display adapters. | Identify each component's system, execution stage, and cleanup owner. |
| UI and media | Optional; an opening frontend or text/regex status display does not require MVU. | Common, but not universally required. | Include only selected consumers; define permissions for cross-system interaction. |

New cards normally leave traditional prompt fields empty and carry their material in
the worldbook; see [card-writing.md](card-writing.md) for field names and inherited-card
handling. Retain required format, name, authorship, and version metadata.

Planning and a bounded partial implementation may record either core as pending.
Record an owner and the next gate; do not claim the whole card is ready. Whole-card
assembly or delivery must verify the actual greeting, worldbook content and binding,
and their mutual consistency. A component-only task does not authorize creating the
missing rest of a card or block delivery of that bounded component.

## 4. Legacy MVU compatibility

Do not produce `mvu` as a current type. When inherited source or an older authority
uses that value, retain the historical declaration and report the observed runtime
as legacy MVU with Zod support unresolved or absent. The current variable-card target
is `mvu_zod`, but changing a label cannot prove a schema, registration path, or loader
exists. Do not relabel a legacy card as `hybrid` to bypass that gap.

Reading and locally maintaining a legacy card does not authorize migration. Preserve
its protocol, saves, and existing source while documenting missing target components.
Only an authorized migration may add or replace them. Before reporting MVU Zod
readiness, independently verify schema, registration, loader, and enabled-state
evidence. Preserve the distinction between a declared target and detected capability.

The creative-authority validator rejects legacy `mvu` by default. Its explicit
`--allow-legacy-mvu` read-compatibility option reports a warning without rewriting the
authority or any card/save. It does not waive the runtime checks above.

## 5. Dependency classes

Classify every runtime dependency:

| Class | Meaning | Required behavior |
| --- | --- | --- |
| `host_required` | A host extension or capability the card cannot carry itself. | Tell the user what must be installed or enabled; keep acceptance pending until probed. |
| `embedded_required` | A schema, regex, helper script, loader, or binding that must ship inside the card. | Block assembly or release when missing, disabled contrary to policy, or lost in roundtrip. |
| `remote_runtime` | Code or UI loaded at runtime from GitHub, jsDelivr, or another declared endpoint. | Report the remote load and fallback policy; do not describe it as a local installation. |
| `regional_alternative` | Equivalent domestic/global or other regional loader scripts. | Require every loader promised by the card to be packaged, then enforce its declared enabled-state policy. |
| `optional` | A non-core feature whose absence has a defined fail-soft path. | Report the disabled feature and fallback without blocking unrelated core behavior. |
| `development_only` | Node, package-manager, compiler, local Zod package, or other build dependency. | Keep it out of player installation notices. |

Module dependencies and runtime dependencies are different. Selecting a component may
bring its embedded output into the build, but it cannot prove that a host extension is
installed or that remote code executed.

## 6. MVU Zod interpretation

Separate these facts:

- the card-specific Zod schema is `embedded_required`;
- card-packaged MVU Zod scripts such as domestic and global variants are
  `regional_alternative` with `delivery: embedded`;
- every regional loader promised by the card must be present, while its enabled state
  follows the card's manifest or proven packed baseline;
- MagVarUpdate bundles, schema-registration helpers, or similar declared Git/CDN
  targets imported by those scripts are `remote_runtime`;
- Tavern Helper or another extension that executes the packaged scripts is
  `host_required`;
- a local `zod` package used to build or dump schema files is `development_only`.

Do not infer `mvu_zod`, a provider, or an installation path from an API call alone.
Require the schema, registration path, packaged loader identities, remote targets, and
enabled policy as independent evidence. If the card already packages its domestic and
global MVU Zod scripts, tell the player that the runtime loads through those scripts;
do not ask them to install Zod directly. Preserve an existing card's proven loader and
regional-selection policy unless migration is explicitly authorized.

## 7. Runtime dependency ledger

Record fields equivalent to:

| Field | Purpose |
| --- | --- |
| `id` | Stable dependency identifier. |
| `role` | Schema, MVU runtime, renderer regex, helper script, UI loader, or host capability. |
| `class` | One dependency class from this reference. |
| `required` | Whether absence blocks the selected stage. |
| `sourceOwner` | Maintained module, card field, manifest, or external project that owns the fact. |
| `evidence` | Stable script ID, regex ID/name, JSON pointer, source path, or capability probe. |
| `delivery` | Embedded card field, host installation, remote URL, or explicit unknown. |
| `enabledPolicy` | Required enabled state or alternative-group rule. |
| `region` | Global, domestic, or another declared target when applicable. |
| `versionOrRef` | Detected version, Git ref, or an explicit unknown. |
| `fallback` | Alternate loader or fail-soft behavior. |
| `failureMode` | What the user sees and which feature stops. |
| `validationOwner` | Static assembly, runtime debug, or user acceptance. |

For `mvu_zod`, trace at least:

```text
host extension -> embedded domestic/global MVU Zod script -> remote MVU bundle
               -> embedded Zod schema -> remote registration helper
               -> schema registration -> update rules -> regex/UI consumers
```

At `variable_core`, later embedded adapters may be explicitly deferred. At
`component_assembly` or `release`, every required embedded dependency must resolve to
an owned output or an existing packed field.

## 8. User notice and handoff

Before substantial authoring or assembly, report:

1. detected primary type and capability flags;
2. evidence, unresolved classification, and any legacy-MVU gap;
3. dependencies already embedded in the card;
4. host extensions or capabilities the user must install or enable;
5. remote Git/CDN runtimes and fallback policy;
6. regional alternatives and the selected member;
7. optional or development-only items excluded from player instructions;
8. greeting/worldbook readiness and missing requirements that block the next stage.

Use explicit wording:

- `已随卡封装，无需另行安装`;
- `需要在宿主中安装或启用`;
- `运行时从远程地址加载`;
- `仅开发环境需要`.

Do not use a generic “install all dependencies” reminder.
