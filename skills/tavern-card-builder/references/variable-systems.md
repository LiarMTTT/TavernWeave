# Variable systems

## Contents

1. Card type and capability detection
2. Select necessary state
3. Semantic design and complete structure
4. Initialization and greetings
5. Minimal update rules
6. Compile and cross-check artifacts
7. Update-model routing
8. CoT and script boundary
9. Projection, lorebook consumers, and rendering
10. Cleanup and migration
11. Representative review cases

## 1. Card type and capability detection

Use the primary types `text`, `mvu_zod`, and `hybrid` defined in
[card-types-and-runtime-dependencies.md](card-types-and-runtime-dependencies.md).
New variable cards use the MVU Zod architecture: an actual MVU runtime, a Zod
structure definition, and the verified registration/loading mechanism. A frontend
is common, not mandatory. A regex status bar does not turn a text card into a
variable card; MVU, Zod, regexes, scripts, and UI together do not by themselves make
a card `hybrid`.

Legacy `mvu` is compatibility input, not a new authoring type. Record the observed
runtime and missing Zod capabilities honestly. Reclassification does not prove a
schema exists, authorize a migration, or justify relabeling the card `hybrid`.
For `hybrid`, apply this reference to its MVU subsystem and name the owner of every
shared fact and cross-system transfer.

Identify the actual MVU implementation, command dialect, Zod provider/version,
registration path, and model-context modes from maintained/installed source,
verified documentation, or runtime evidence. Type declarations alone do not prove
runtime behavior. Do not mix native commands, an MVU JSONPatch dialect, and pure
RFC 6902 semantics.

Use `$sillytavern-api-reference` for exact operations and signatures. Preserve the
card's current dialect and update mode unless migration is explicitly requested
and verified. Do not universally impose a CDN URL, `z` provider, registration
wrapper, field-name prefix, fixed tag, or numeric insertion order.

The routed ST-B1 and other bundled guides are dated technical snapshots. If a recipe
unconditionally requires `window.z`, a particular default helper, jQuery registration,
or one runtime layering scheme, record its version assumption rather than treating it
as an exception to the checks above. Use actual target evidence to resolve the API;
keep the current authoring convention and the old guide's provenance distinct.

## 2. Select necessary state

Before choosing a data type, test each candidate field:

1. What state must persist across turns or change during play?
2. Who reads it: a prompt/lorebook entry, an EJS condition, gameplay logic, a script,
   or UI?
3. What observable result changes when that consumer reads it?
4. What evidence permits an update, and which model, script, or user operation is
   its designated writer?
5. Can it be derived reliably from existing state instead?
6. What specific behavior would be lost if the field were removed?

Do not add common systems such as affinity, stamina, inventory, or quests without
an actual need. Static character/world facts belong in the lorebook by default;
one-off prose, decorative labels, and unbounded plot or memory dumps do not become
variables just because they can be stored. Model current state, not an event log,
unless a bounded history is itself a confirmed consumer requirement.

If a field has no consumer, maintenance owner, or deletion loss, omit it by
default. Preserve a user's explicit decision to keep it, record the reason and
maintenance/prompt cost, and do not turn this review into permission to delete
existing saved data. Stop adding fields when the confirmed play loop is covered.

## 3. Semantic design and complete structure

For new work, settle field meaning, structure, initial values, and update semantics
before compiling final artifacts. A structure draft may help discussion; it must
not silently fix undecided creative choices. For an inherited card, read the
existing schema, initialization, rules, and consumers first; do not restart the
entire interview or replace a proven structure for formatting convenience.

Maintain one field ledger with [variable-design.md](../assets/templates/variable-design.md)
or the project's equivalent. Link to the existing creative authority rather than
creating another decision/status store. It must preserve:

| Design item | Required meaning |
| --- | --- |
| Final path and meaning | Exact keys, one meaning per field, compatible with the target path parser |
| Data shape | Text, number, boolean, full enum, fixed object, dynamic record, or ordered list |
| Complete child structure | Every required/optional child; dynamic key meaning and value shape; list element shape even when initially empty |
| Structural limits | Missing/null/empty/clear distinctions; permitted add/remove; confirmed ranges, capacity, duplicates, references, and invariants |
| Initial values and basis | Actual values, confirmed source/decision, applicable greeting, and initialization class |
| Consumers and impact | Exact lorebook/condition/script/UI readers and the behavior each controls |
| Write and visibility intent | Designated writer, model-writable/read-only/code-only intent, receiving models, and verified enforcement mechanism |
| Updates and lifecycle | Required rule or no-special-rule result, derivation, cleanup/retention, migration, and representative case |

Use fixed objects for fixed fields and records for truly dynamic collections. An
initial `{}` is not a definition of a record value; `[]` is not an element type.
Preserve all enum choices, not only the currently selected one. Explain whether a
field can be absent, hold `null`, be empty, or be removed, and what each means.
Unknown initial facts are unresolved decisions, not automatically empty strings,
zero, `false`, or `null`.

Permission intent is not permission enforcement. Confirm any read-only/hidden
naming convention with the actual runtime. Do not invent `_`, `$`, or other
prefixes, rename existing keys, or claim code-only secrecy from a name alone.
Identifier/counter schemes remain project decisions.

## 4. Initialization and greetings

Keep four classes separate:

- shared defaults used by every conversation;
- fixed-greeting branch defaults;
- free-form setup collected through normal user interaction;
- migration defaults for older saved state.

Each initial value needs a basis: a confirmed fact, the approved greeting, an
explicitly delegated choice, or an allowed empty state. Do not infer values from
rhetoric, mood, genre conventions, or an arbitrary midpoint. Use pending/sentinel
states only when the design actually requires them and defines their handling.

For multiple greetings, map each branch to its actual initial state and resolve
shared/branch precedence using the verified opening protocol. Check the greeting,
worldbook facts, and resulting state together. Migration defaults must not reset
valid older state merely because a new greeting changed.

Do not delete `<initvar>` or `<UpdateVariable>` from greetings simply because a
different project uses another strategy. Read
[opening-strategies.md](opening-strategies.md); verify the target implementation
before adding wrappers, changing initialization placement, or imitating events.

## 5. Minimal update rules

First inspect permission and ownership: model update rules address only fields
the designated model may write. A script-owned, read-only, or code-only field must
not also be assigned to the model. Then ask whether a special rule is necessary.

- If the name, structure, and established protocol already express ordinary
  behavior and there is no special constraint, record **no special rule needed**.
- Add a concise rule for a concrete ambiguity or failure risk. Merge fields only
  when their update semantics are genuinely identical.
- Do not write a second schema, worldbook, character description, or gameplay
  system in the update rules. Do not add thresholds, cooldowns, stages, or numeric
  increments that were never confirmed.

For each necessary rule, include only applicable parts:

| Part | Required distinction |
| --- | --- |
| Trigger evidence | Which actual event or authorized operation permits change |
| Hold condition | When a related mention or event still leaves the field unchanged |
| Knowledge boundary | Who learned what, to what degree, through which evidence/source; retain uncertainty, error, and outdated knowledge where relevant |
| Operation | Permitted add, replace, remove, move, or other verified dialect operation |
| Amount/range/stage | Only the already confirmed numeric effect, range, or transition condition |
| Collection lifecycle | Create/update/remove/reorder, identity, deduplication, and retention when needed |
| Consistency | The minimum linked changes needed to keep a compound fact valid |

World truth is not every character's knowledge. Knowing nothing, hearing a rumor,
knowing part, and understanding deeply can differ; do not force all knowledge
into numbers or store it at all unless a consumer needs persistent changes.
An update must preserve the distinction between evidence, belief, and fact.

Check relevant failures: mentioning a person must not automatically create a
record; a mentioned object is not necessarily acquired; the same event must not
be settled twice; unobserved truth must not update a character's belief; casual
dialogue must not cause an unsupported large change. These are review questions,
not mandatory rules copied into every card.

Reject empty instructions such as “update reasonably according to the plot”.
Keep plot prose out of variable rules. Prefer structural constraints and small
non-copyable fragments to complete hard-coded output examples.

If a rule reveals a needed new field, type, permission, or initial value, return
to that design decision and synchronize affected artifacts. Do not hide a design
change in a formatter or ask the user to manually copy completed stages between
workshop prompts. Continue within existing authorization; ask only genuinely
unresolved material decisions.

## 6. Compile and cross-check artifacts

Compile confirmed semantics into the target's initialization data, update rules,
Zod schema/registration script, model projection/output contract, and required
consumers. Exact syntax and placement come from the verified target. Formatting
may not add, rename, remove, relocate, or reinterpret a field or invent defaults.

Cross-check the following before calling source work complete:

1. Every applicable required field and actual initial collection item matches the
   design; optional missing fields remain missing when allowed.
2. Initialization keys, nesting, types, values, enums, and branches agree with the
   ledger. Preserve text such as leading-zero identifiers and date strings. For
   YAML, quote ambiguous text and preserve actual multiline semantics.
3. Update rules refer to actual fields with the correct writer and semantics;
   no-special-rule fields are not padded with invented checks.
4. Empty records/lists and full enum sets are compiled from the design, not guessed
   from their initial values. The schema accepts every supported initial state
   and can represent the confirmed results of insert/remove/replace/move.
5. Missing, clear, unknown-field, range, and coercion behavior matches the design.
   Silent stripping is data loss unless intended. Avoid coercion or partial/union
   combinations that discard nested input before defaults run.
6. If normalization is used, repeated parsing is stable:
   `Schema.parse(Schema.parse(input))` does not keep changing data. Defaults,
   prefaults, unions, and transforms must match the actual Zod version and
   intended semantics; do not pick a universal one-line recipe.
7. The schema definition, registration, load order, and required providers are
   present and compatible; syntactic validity is not registration/runtime proof.
8. The greeting, lorebook entry IDs/conditions, model recipients, script/UI paths,
   and migration references agree. A rename must reach every consumer.

For a conflict, report the affected decision and artifacts, resolve the authority,
and regenerate/synchronize within scope. Do not choose whichever file is most
convenient, silently reset data, or deliver a partial script as complete. Follow
[lorebook-and-prompts.md](lorebook-and-prompts.md) for the approved entry policy;
do not import conflicting workshop fixed tags, D0 placement, order numbers, or
delivery rituals as universal requirements.

## 7. Update-model routing

Treat the update mode as an authoring contract:

- **same-generation update**: the plot model writes narrative output and the
  variable update command in one generation;
- **extra update-model pass**: one model writes the plot, then a separate model
  reads the result and writes the variable update command.

Do not assume every MVU implementation supports entry-name routing. When the
detected MVU Zod runtime documents the `[mvu_plot]` and `[mvu_update]` convention,
apply this matrix:

| Entry name | Same-generation update | Extra update-model pass |
| --- | --- | --- |
| contains `[mvu_plot]` | normal activated entry | plot model only |
| contains `[mvu_update]` | normal activated entry | update model only |
| contains neither marker | normal activated entry | both models |

The marker may occur anywhere in the entry name; do not require a literal prefix.
Routing does not activate an entry: enabled state, activation, scan/recursion
policy, budgets, position, and ordering are checked separately. Treat a name with
both markers as ambiguous unless the installed implementation explicitly defines
it. The worldbook policy is owned by
[lorebook-and-prompts.md](lorebook-and-prompts.md).

For a new dual-compatible card, use this baseline only with runtime support:

- leave the current variable projection/list unmarked only when both models need it;
- mark variable update rules and output format with `[mvu_update]`;
- mark plot-only custom CoT, prose, or unrelated output formats with `[mvu_plot]`;
- inventory every unmarked entry and justify duplication into both contexts.

An unmarked entry is a shared-context decision with prompt-budget and exposure
cost, not automatically an error. Do not send plot-specific custom CoT, style
scaffolding, NPC scheduling, or unrelated output formats to the update model merely
for compatibility. For a retrofit, report current mode/routing before editing
names; do not add markers when ignored or when the card intentionally uses one mode.

## 8. CoT and script boundary

Custom CoT is not an MVU feature. A text card can use an author-written decision
protocol, and an MVU Zod card still has separate plot/character behavior needs.
Do not require hidden reasoning or copy workshop thinking-output rituals.

- MVU `<analysis>` or equivalent observable update evidence serves variable
  decisions, not the complete plot/character/NPC/combat protocol. Preserve only
  the supported output contract; evaluate observable behavior.
- Zod defines/validates data structure and has no direct relationship to CoT.
- The plot model receives relevant plot and behavior guidance. An extra update
  model receives needed current state, generated plot, update rules, and format.
- Let the model write semantic source events/states. Let scripts perform
  deterministic formulas, derived updates, and batch synchronization when needed.
- Assign one normal writer to every field, with explicit initialization/migration
  ownership. Never let the model and a script compete over a field. UI mutations
  and hybrid transfers go through the same agreed write path.

Read [cot-design-and-authoring.md](cot-design-and-authoring.md) for independent
protocol design, model separation, and model/script workload boundaries.

## 9. Projection, lorebook consumers, and rendering

Use [the shared turn-to-turn foundations](../../consult-tavernweave-library/references/sillytavern-runtime-foundations.md)
only when that context is missing. Worldbook target types, aliases, initialization
sentinels and write/read/consumer scope use the [E05 consumer contract](../../sillytavern-database-rolecards/references/worldbook-target-state-contract.md)
within this existing field ledger; cross-native/template output deduplication and
budgets use [E06](../../sillytavern-rolecard-performance/references/worldbook-output-budget.md).
Neither consumer may repair saved state or become its second writer.

The model projection is not the full database. Send only state required for the
current turn and verify recipients. Distinguish objective world truth, current
state, and character knowledge in the content sent. Read-only or code-only intent
must be enforced by the verified projection/write mechanism, not asserted by a
field name.

Trace field -> lorebook entry/condition -> recipient -> visible consequence, and
field -> UI/script reader -> authorized write-back. When a worldbook condition
needs new persistent state, resolve that need in the variable design and return
the agreed path, missing-value behavior, and trigger to the worldbook design.
Do not introduce EJS or variables into text cards solely to fill a checklist.

State-selected character portrayal follows [character-stages.md](character-stages.md).
The stage selector is a read-only consumer of this contract, not another state
authority. It must not create fields, repair values or write a fallback into a save.
Unreliable state normally leaves the foundation visible and suspends unsupported
differences with a diagnostic; a specified fallback requires confirmed safe meaning.
Portrayal clarification cannot advance a relationship or stage. A new field or changed
update rule returns to the existing design rather than being hidden inside an EJS consumer.

For UI, define a presentation model instead of mutating raw state ad hoc. A
rendered status panel is not evidence that MVU saved state or enforced Zod.
Delegate exact DOM/runtime implementation to `$sillytavern-embedded-ui` and
`$sillytavern-api-reference`.

For a read-only status bar, use the embedded-UI
[status-bar design method](../../sillytavern-embedded-ui/references/mvu-statusbar-design.md)
to map the player's reading task to existing fields. Its optional worksheet is an
Agent aid, not a second variable ledger or a user questionnaire. Resolve absent
field definitions here; do not infer collection shapes from empty initialization,
introduce state to fill a layout, or let a display fallback repair saved data.
Preserve the field contract's distinction between valid zero, false and unavailable
data, and verify the actual scope read by the UI.

## 10. Cleanup and migration

Specify stale-record retention/archive, maximum collection sizes where needed,
schema-version detection, idempotent migrations, rollback/safe failure, and
evidence that older conversations remain readable. Preserve unknown fields unless
their removal is an explicit, scoped design/migration decision. A missing value
and an intentionally cleared value must not receive the same automatic repair
unless the design says so.

A semantic change must trace initialization, schema, update rules, projections,
lorebook conditions, scripts/UI, and old state. Reclassification of legacy `mvu`
alone does not authorize any of these writes. Keep source checks, actual runtime
loading, real conversation behavior, and driver acceptance separate.

## 11. Representative review cases

Use only cases relevant to the actual change. These are bounded design examples,
not universal gameplay systems or proof of host execution:

| Case | Expected decision/evidence |
| --- | --- |
| Text card with regex status bar | Remains `text`; no invented MVU state or schema |
| Empty inventory record/list | Full future item type and identity remain in design; no invented initial items |
| Mentioned NPC or object | No record/acquisition without the confirmed creation event |
| Character hears a partial rumor | Degree, source, and uncertainty preserved; no automatic objective truth/full knowledge |
| Two greetings with different possession | Branch states agree with greetings; common defaults do not overwrite valid branch/old values |
| Script-derived result | Source field has its writer; derived value has the script as sole writer, or is projected without duplicate storage |
| Renamed condition field | Schema, initial data, update rule, lorebook condition, renderer, and migration all accounted for |
| Legacy MVU without registration | Legacy evidence retained; Zod gap reported; no claim of completed migration |
