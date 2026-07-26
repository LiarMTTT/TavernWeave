# Registry, recipe, and dependency model

Use this reference to keep reusable source modules separate from release artifacts.

## Source-of-truth hierarchy

1. Keep component bodies in source files.
2. Keep machine metadata in one registry.
3. Keep module selections in recipes.
4. Generate catalogs and packed cards from those sources.
5. Treat version-local component trees, JSON cards, PNG cards, and catalog exports as derived artifacts unless the repository explicitly defines a different boundary.

Do not let a spreadsheet, generated catalog, packed card, or archived version become a parallel build input.

## Registry contract

Represent each module with fields equivalent to:

| Field | Purpose |
| --- | --- |
| `id` | Stable machine identifier. |
| `category` | Source and runtime grouping. |
| `sourceFiles` | Files owned by the module. |
| `outputs` | Logical output IDs or relative files it emits. |
| `build` | Copy, template, merge, or other deterministic emission rules. |
| `dependsOn` | Required modules. |
| `conflictsWith` | Mutually exclusive modules. |
| `runtimeDependencies` | Embedded, host, remote, regional, optional, or development-only runtime requirements. |
| `defaultEnabled` | Default selection policy, not an implicit dependency. |
| `modelVisible` | Whether emitted content can enter model context. |
| `affectedLayers` | Coupled data, rule, validation, or UI layers. |
| `variableRoots` | Top-level variable roots owned or consumed. |
| `applicableScenarios` | General applicability without card-name branching. |
| `replaces` / `replacedBy` | Bidirectional replacement history. |
| maturity metadata | Production, validation-only, experimental, or deprecated state. |

Declare outputs separately when the library supports a global output inventory. Mark their logical kind and whether a given stage requires them.

Keep output paths relative. Reject absolute paths, parent traversal, unowned writes, and emission into the source files themselves.

## Dependency resolution

Resolve a recipe in this order:

1. Load explicitly enabled modules.
2. Add transitive dependencies.
3. Apply explicit disables only if they do not break a dependency.
4. Fail on missing IDs, cycles, enabled conflicts, or disabled requirements.
5. Topologically order deterministic build steps.
6. Build an output-ownership map.
7. Fail when two modules emit the same output unless the registry declares one deterministic merge strategy and ordering rule.
8. Verify every declared source exists and every emitted output is accounted for.
9. Resolve required embedded runtime assets for the selected stage and validate every
   regional-alternative group.

Do not resolve runtime isolation by adding an undeclared global. A worldbook entry, MVU rule, regex, helper script, and iframe may need adapters even when their modules depend on each other.

## Runtime dependency contract

Keep module graph dependencies separate from runtime dependencies. Represent each
runtime requirement with fields equivalent to:

- stable dependency ID and role;
- class: `host_required`, `embedded_required`, `remote_runtime`,
  `regional_alternative`, `optional`, or `development_only`;
- owned source/output or stable packed-field evidence;
- required stage and enabled policy;
- region and alternative-group ID when applicable;
- version, Git ref, remote URL, fallback, and failure behavior when known;
- static validation owner and remaining real-host probe.

Use these rules:

- A card-local regex, Zod schema, helper script, loader, or binding required by the
  feature is `embedded_required`.
- Tavern Helper, ST-Prompt-Template, or another host capability is `host_required`;
  embedding card code does not satisfy it.
- A Git/CDN import is `remote_runtime`, not an installation task.
- Equivalent domestic/global loaders are `regional_alternative`; at release, enforce
  that every promised loader is packaged and its enabled state matches the declared
  rule.
- A local Zod package, compiler, or package manager used only to build artifacts is
  `development_only` and must not enter player-facing installation instructions.
- An API identifier is not a component or delivery signal. Resolve the actual schema,
  packaged domestic/global scripts, their remote targets, and enabled states from
  stable card evidence.

At `variable_core`, an embedded adapter may be deferred when its owner and later
required stage are explicit. At `component_assembly` and `release`, unresolved
required embedded assets fail composition.

## Recipe contract

A recipe should contain only selection and boundary data equivalent to:

- stable recipe ID and target family or capability;
- workflow stage;
- enabled and disabled module IDs;
- required outputs for the selected stage;
- explicit output root, defaulting to a sandbox;
- optional compatibility or feature flags already understood by the composer.
- selected runtime region or alternative policy when the recipe owns that choice.

Keep card text and build algorithms out of recipes. Keep release-specific required outputs explicit when the general library inventory would require components that the target intentionally does not ship.

## Variable-root contract

For each top-level variable root, declare ownership of every applicable layer:

1. initial value fragment;
2. runtime or Zod-style schema;
3. full and compact update rules;
4. output protocol;
5. model context or summary;
6. variable-group metadata;
7. status or control UI readers;
8. examples and fixtures.

Update the complete chain when a field changes. If a layer is intentionally deferred to card assembly, state that explicitly in module metadata or validation output.

## Replacement and promotion

Promote only after a predefined acceptance gate passes. Keep validation-only modules out of production recipes. When a new module replaces an existing shared module:

1. add `replaces` to the new module;
2. add `replacedBy` to the old module;
3. record status and migration notes when supported;
4. retain old release artifacts and historical recipes;
5. regenerate catalogs from the registry;
6. verify at least one production-equivalent recipe and one negative conflict case.

Do not rewrite historical artifacts to make the registry look uniform.
