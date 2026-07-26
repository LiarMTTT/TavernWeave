# Card types and runtime dependencies

## Contents

1. Detection evidence
2. Type and capability model
3. Dependency classes
4. MVU Zod interpretation
5. Runtime dependency ledger
6. User notice and handoff

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
| `mvu` | An identified MVU dialect owns persistent state, but no Zod schema registration is required. |
| `mvu_zod` | MVU state is governed by a card-specific Zod schema with a detected registration path and the required packaged MVU Zod loader scripts. |
| `hybrid` | Multiple runtime systems are peers and no narrower primary type describes the card. |

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

## 3. Dependency classes

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

## 4. MVU Zod interpretation

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

## 5. Runtime dependency ledger

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

## 6. User notice and handoff

Before substantial authoring or assembly, report:

1. detected primary type and capability flags;
2. evidence and unresolved classification;
3. dependencies already embedded in the card;
4. host extensions or capabilities the user must install or enable;
5. remote Git/CDN runtimes and fallback policy;
6. regional alternatives and the selected member;
7. optional or development-only items excluded from player instructions;
8. missing requirements that block the next stage.

Use explicit wording:

- `已随卡封装，无需另行安装`;
- `需要在宿主中安装或启用`;
- `运行时从远程地址加载`;
- `仅开发环境需要`.

Do not use a generic “install all dependencies” reminder.
