---
name: sillytavern-card-components
description: >-
  Safely disassemble SillyTavern character cards from JSON or PNG into sandboxed,
  reviewable components, and design or maintain registry-driven component libraries
  and recipes. Use when extracting a card, modularizing worldbook, MVU, regex,
  helper-script, message, or embedded UI content, tracing a coupled variable-field
  chain, declaring embedded/host/remote/regional runtime dependencies, resolving
  component dependencies or conflicts, validating a source-to-artifact round trip,
  or promoting a proven version back into a shared component library. Do not use for
  routine packaging of an already-defined release; use sillytavern-card-pipeline
  instead.
---

# SillyTavern Card Components

Before decomposition or registry writes, use `$consult-tavernweave-library` with the `sillytavern-card-components` route, read A0 and the returned card-format/regex guidance, and record the receipt in the roundtrip plan.

Treat reusable component sources and packed card artifacts as different layers. Keep
the shared library stable, make exploratory work disposable, and move changes across
that boundary only after evidence supports promotion.

## Establish the boundary

1. Read repository instructions before inspecting or changing card files.
2. Classify the task as one of:
   - disassemble an input card into a new sandbox;
   - edit a version-local component snapshot;
   - compose an existing recipe;
   - explicitly promote mature work into the shared library.
3. Identify the current source of truth. Treat a version-local `components/` tree,
   packed JSON, and packed PNG as artifacts unless the repository explicitly says
   otherwise.
4. Preserve prior releases. Never migrate, rewrite, or normalize archived artifacts
   as a side effect of component work.
5. Prefer the smallest change that reuses the existing registry, recipe, and build
   conventions.

## Disassemble cards safely

Read [safe-disassembly.md](references/safe-disassembly.md) before extracting JSON or
PNG input.

- Never extract into the input directory, an active version tree, or the shared
  component library.
- Copy the input to a fresh sandbox, record its hash and size, and treat that snapshot
  as read-only evidence.
- Require an extraction tool to accept explicit input and output locations. If it
  writes through an implicit manifest path, run it only against a disposable copy of
  that configuration inside the sandbox or choose another method.
- Decode a PNG payload to normalized card JSON before splitting logical components.
- Record where every extracted file came from using a stable logical identifier,
  card JSON pointer or selector, source hash, and output hash.
- Keep unknown fields, entry identifiers, array order, and extension metadata unless
  an explicit contract authorizes a transformation.

Do not interpret successful extraction as permission to update the shared library.

## Model the component library

Read [component-model.md](references/component-model.md) when creating or changing a
registry, module declaration, output declaration, recipe, dependency, variable root,
or replacement relationship.

Use the registry as the machine-readable source of truth. Generate human-facing
catalogs from it; never make CSV or spreadsheet exports into build inputs.

For every module, declare at least:

- a stable ID and category;
- source files and emitted outputs;
- explicit dependencies and conflicts;
- runtime dependency declarations and delivery class;
- whether the content is model-visible;
- build or merge behavior;
- affected runtime or variable layers;
- applicability and maturity metadata when the library supports them.

Fail composition on missing dependencies, cycles, conflicts, undeclared output
collisions, missing sources, or paths that escape the intended roots. At
`component_assembly` and `release`, also fail on unresolved required embedded runtime
assets or invalid regional-alternative selection. Keep worldbook, MVU, regex,
helper-script, and embedded-UI APIs isolated; a dependency declaration does not make
another runtime layer globally available.

## Define recipes as selections

Keep component bodies in modules. Let a recipe select modules and declare the output
boundary; do not copy build logic or content into the recipe.

Use repository-defined stages. When the repository has equivalent stages, keep these
semantics:

- `variable_core`: emit only the complete variable chain;
- `component_assembly`: add card-specific adapters and presentation components;
- `release`: require the complete declared output set and release checks.

Default recipe output to a sandbox. Point at a version snapshot only for an explicit
rebuild or promotion operation whose write scope has already been approved.
Allow a `variable_core` recipe to defer later embedded adapters only when the registry
names the deferred owner and required stage. Do not carry that deferral into
`component_assembly` or `release`.

## Keep coupled fields synchronized

Treat a variable field as one cross-file contract. Trace and update every applicable
consumer in this order:

`initial data -> schema -> update rules -> output format -> context -> variable groups -> runtime readers -> rendered examples`

Record intentionally absent layers. Do not call a field migration complete because
one writer or one screen changed successfully.

## Validate source and artifact parity

1. Validate registry and recipe structure.
2. Resolve the dependency graph and output ownership.
3. Resolve runtime dependency classes, owned embedded outputs, and regional
   alternative groups.
4. Compose into a clean sandbox.
5. Validate syntax, encoding, required and forbidden content, and runtime-layer
   contracts.
6. Build sandbox JSON and, when in scope, sandbox PNG.
7. Re-extract the built artifact into a second clean sandbox.
8. Compare canonical card semantics and the component mapping. Use byte equality only
   where the contract requires it; JSON formatting and PNG container bytes may differ.
9. Run regression checks for every previously working consumer touched by the change.
10. Leave host-dependent UI, regex, bridge, remote-loader execution, and interaction
   behavior pending until it
   passes real SillyTavern acceptance.

## Promote only mature components

Require an explicit request to update the shared library and a predeclared maturity
gate. Promote one independently testable feature at a time only after composition,
round-trip, regression, and applicable runtime checks pass.

When replacing a shared module, register both directions of the relationship, retain
the old version artifacts, and regenerate derived catalogs from the registry. Keep
experimental or validation-only modules labeled outside production recipes. If the
feature remains unstable after repeated debugging, stop and reassess the core design
instead of layering compatibility patches into the library.

## Report the result

State:

- the input snapshot hash and sandbox location;
- files created or changed;
- registry, recipe, and dependency decisions;
- detected card capabilities plus the runtime dependency ledger, including embedded
  assets, host requirements, remote loaders, and regional selection;
- round-trip and regression checks with results;
- whether shared-library promotion occurred;
- any real-SillyTavern checks still required.
