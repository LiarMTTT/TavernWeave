# Profile, manifest, plan, and contract roles

Keep workflow behavior data-driven while preserving one owner for each fact.

## Responsibility split

| File | Owns | Must not become |
| --- | --- | --- |
| Profile | Card-family identity, defaults, protocol selection, card-type/capability defaults, variable roots, recipe, and links to version data. | A copy of every packed field or a version-specific script. |
| Manifest | Exact version paths, component mappings, packaging policy, deliverables, field chains, runtime dependency ledger, and release-specific declarations. | A second component source tree. |
| Plan | Ordered, reviewable operations that transform one known state into another. | An evergreen truth source or an opaque migration program. |
| Contract | Stable required behavior, forbidden regressions, counts, identities, and protocol invariants. | A snapshot of temporary implementation preferences. |

Repositories may store a field in a different file. Preserve the repository's schema
and map the semantic role through the adapter instead of introducing a parallel format.

## Profile checks

Require a stable ID, family or type, semantic version, and an explicit link or
deterministic resolution to version truth. When relevant, declare:

- update protocol and model-context mode;
- primary card type, capability flags, and runtime dependency defaults;
- variable roots and status/UI variant;
- component recipe and component-library compatibility;
- default target paths or a manifest selector;
- deprecated feature policy and model-text lint policy.

Validate IDs, allowed family values, versions, and referenced files. Do not reuse a
remembered profile without re-reading its current target.

## Manifest checks

Resolve and validate exact paths for:

- component source or snapshot directory;
- every card-bound or co-delivered worldbook source;
- packed JSON target;
- PNG shell and PNG target when applicable;
- contracts, recipes, fixtures, and extra validators;
- declared deliverables.

Also validate component selectors, required counts or stable IDs, field-chain
declarations, version text, deprecated entries, payload keywords, extension mirroring,
runtime dependency declarations, and other packaging policy owned by the project.

Reject paths that escape the approved root, source/target aliasing, missing inputs,
duplicate targets, and writes to an archived release not explicitly selected for
replacement.

## Card-type and runtime-dependency checks

Detect one primary type (`text`, `mvu`, `mvu_zod`, or `hybrid`) plus capability flags
from maintained source. Reconcile detection with profile and manifest declarations.
Record whether each fact is declared, detected, or inferred.

For each runtime dependency, require fields equivalent to:

- stable ID and role;
- class: `host_required`, `embedded_required`, `remote_runtime`,
  `regional_alternative`, `optional`, or `development_only`;
- source owner and stable evidence such as JSON pointer, script/regex ID, or output;
- required stage and enabled policy;
- region and alternative-group rule;
- version/Git ref, remote URL, fallback, and failure behavior when applicable;
- static and real-host validation owners.

Apply these rules:

- A required character-local regex, card-specific Zod schema, non-regional Tavern
  Helper script, loader, or binding must be `embedded_required`.
- Tavern Helper or another extension/capability that the card cannot carry is
  `host_required`.
- A declared Git/CDN MVU bundle, schema-registration helper, or other runtime import
  is `remote_runtime`; it is not a player-side package installation.
- Packaged domestic/global implementations of one role are `regional_alternative`.
  The manifest must require every promised script and define the enabled state for
  each member.
- Node, a package manager, compiler, or local Zod package used only for builds is
  `development_only` and must not appear in player installation notices.

Do not infer a card type, provider, or installation path from an API call alone.
Require independent evidence for the card-specific schema, registration path,
packaged domestic/global MVU Zod scripts, remote import targets, and enabled policy.
When those scripts already ship in the card, report them as embedded assets and do not
add a standalone Zod installation step.

At `variable_core`, a later embedded adapter may be explicitly deferred with an owner
and required stage. At `component_assembly` or `release`, missing required embedded
assets and invalid regional selection block the build.

## Card-bound worldbook version checks

For every worldbook attached to a card or delivered as its required companion, resolve
from the active manifest:

- stable card ID and release version;
- stable worldbook ID and maintained source path;
- the worldbook version surface or deterministic derivation from release truth;
- the exact card attachment field or project-owned binding operation;
- whether an equivalent standalone worldbook deliverable is required.

SillyTavern export shapes do not provide one universal worldbook version field. Adapt
to the repository's existing schema, but require a machine-checkable version surface
when card/worldbook alignment is a release invariant. Do not infer alignment from
display names, file modification times, directory order, or a filename alone.

Before packing, reject a missing, duplicate, stale, or unresolved worldbook binding.
After packing, inspect the attached object and prove its stable ID, declared version,
and semantic content match the maintained source selected by the manifest. If the
worldbook has an independent schema version, validate it separately from the card
release version rather than treating the two numbers as interchangeable.

## Plan checks

Keep operations declarative and small enough to review. Typical semantic operations
include copying a source file or directory, copying a named component, guarded text
replacement, structured JSON merge, entry removal, new-version derivation, and version
update.

Before applying a plan:

1. validate the plan schema;
2. verify the declared base state and source version;
3. resolve all paths and detect source/target overlap;
4. require exact match counts for replacements;
5. reject target collisions unless the operation explicitly permits a reviewed
   replacement;
6. preview the complete write set in dry-run mode;
7. attach a validation command or invariant to each meaningful operation.

Use one-time plans as history after execution. Do not make future builds depend on
their side effects when the resulting state belongs in a profile, manifest, contract,
or component source.

## Contract checks

Express both positive and negative invariants. Depending on the card, cover:

- required and forbidden worldbook entries, regex scripts, and helper scripts;
- card-type/capability evidence and runtime dependency classes;
- required embedded schema/loaders and regional alternative selection;
- forbidden player-facing claims that development-only Zod/Node packages must be
  installed;
- required variable roots and complete field chains;
- model-visible forbidden terms;
- output protocol location and ordering;
- status or embedded UI markers;
- stable IDs, ordering, counts, and metadata;
- packaging and payload rules;
- stable card/worldbook binding and version alignment across both surfaces;
- rejection of the previous worldbook version after a card release advances.

Update a contract only when the stable behavior intentionally changes. Add a forbidden
check when retiring an old protocol or component so a later pack cannot silently
restore it.

## Precedence and reconciliation

Use this decision order:

1. Treat maintained component source as content truth.
2. Treat the active manifest as exact card/worldbook version and artifact truth.
3. Treat the profile as family defaults and configuration selection.
4. Treat the contract as acceptance truth.
5. Treat the plan as intended mutation history.
6. Treat packed JSON and PNG as outputs to verify, not inputs to overwrite source.

When files disagree, stop and reconcile the owners. Do not copy the newest-looking
value across all layers without determining which layer is authoritative.
