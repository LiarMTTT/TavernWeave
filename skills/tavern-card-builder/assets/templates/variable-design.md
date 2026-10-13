# Variable design record

Use this template only for needed persistent state. It is an authoring worksheet,
not a worldbook entry, executable schema, or new project status store. Link it from
the existing creative authority. Adapt the project's existing ledger instead of
duplicating it. Keep only applicable sections; unresolved matters remain explicit
until resolved, and placeholders must not enter delivered initialization data.

Follow [variable-systems.md](../../references/variable-systems.md) and the target's
verified protocol. No field, numeric range, enum, or subsystem below is a default
gameplay requirement.

## A. Scope and actual runtime

- Existing authority / decision references:
- Target primary type: `text` / `mvu_zod` / `hybrid`
- Actual MVU, Zod provider/version, and evidence:
- Registration / loader / required host dependencies and evidence:
- Legacy `mvu` input, observed capability gaps, and authorized migration scope, if any:
- Actual command dialect / output contract:
- Update mode: same-generation / extra update-model pass:
- Related greeting IDs and worldbook entries:
- Out-of-scope systems and protected saved data:

## B. Necessity decision

| Candidate field | Cross-turn state | Consumer and visible effect | Writer/evidence source | Derivable from existing state? | Loss if removed | Decision and authority |
| --- | --- | --- | --- | --- | --- | --- |
| Fill from the actual project | | | | | | |

Record a user's explicit low-benefit retention decision and cost instead of
deleting it. This table does not authorize removal of existing stored data.

## C. One field or coherent field group

### Identity and structure

- Exact path / final keys:
- Meaning and distinction from other fields:
- Data shape: text / number / boolean / full enum / fixed object / record / ordered list:
- Full enum choices, or every required/optional child:
- Dynamic key meaning and complete value shape:
- Complete list element shape, even when the initial value is `[]`:
- Missing / `null` / empty / removed / whole-object clear semantics:
- Allowed addition, deletion, order, capacity, duplicates, ranges, and references:
- Relationships / mutually exclusive states / minimum consistency conditions:
- Unknown-field handling and parser-compatible key constraints:

### Consumers, ownership, and visibility

| Consumer / recipient | Actual entry, condition, script, or UI path | Result controlled | Read-only or authorized write path | Missing/invalid behavior |
| --- | --- | --- | --- | --- |
| Fill from the actual project | | | | |

- Designated normal writer and actual input evidence:
- Initialization / migration owner:
- Model-writable / model-read-only / code-only intent:
- Verified enforcement/projection mechanism, or unresolved capability:
- Derivation rule and whether the result is stored or projected:
- Hybrid transfer/ownership boundary, if applicable:

### Initialization

| Initialization class | Greeting/branch or saved-state version | Actual initial value | Confirmed source / delegated decision | Composition and preservation rule |
| --- | --- | --- | --- | --- |
| Shared defaults | | | | |
| Fixed-greeting branch | | | | |
| Free-form user setup | | | | |
| Older-state migration | | | | |

Use only applicable rows. An allowed empty collection does not replace its element
definition. Do not use zero, `false`, `null`, or a sentinel to disguise an unknown
fact. New conversation defaults do not reset valid older state.

### Update rule decision

- Result: special rule needed / no special rule needed / not model-writable:
- Reason and exact affected fields:
- Trigger evidence:
- Hold condition despite related mention/event:
- Knowledge subject, degree, source, uncertainty/error/outdated information, if needed:
- Allowed operation in the target dialect:
- Confirmed amount / range / transition condition, if needed:
- Collection creation, update, removal, ordering, identity and deduplication:
- Linked updates and repeated-event handling, if needed:
- Fields sharing identical semantics, if any:

Omit inapplicable items. Do not fabricate an empty `check` or repeat “update
reasonably”. Script/read-only fields are not assigned to the model.

### Lifecycle and examples

- Retention / cleanup owner and boundary:
- Version / migration / rollback or safe failure:
- Small allowed-change example:
- Small hold/invalid-input example:
- Relevant old-state example and unknown fields to preserve:

## D. Artifact map and consistency record

| Confirmed decision / field | Initialization artifact | Zod schema / registration | Update rule or no-special-rule result | Lorebook entry / recipient | Script/UI consumer | Greeting | Migration |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Fill from the actual project | | | | | | | |

- Type/nesting/value agreement, including all enums and empty collection shapes:
- Schema accepts supported initial states and confirmed update outcomes:
- Missing/clear/unknown/coercion behavior matches the design:
- Repeated normalization remains stable, when normalization is used:
- Writer and receiving-model agreement:
- Greeting, condition, UI and migration paths agree:
- Actual worldbook configuration follows the owning worldbook policy:
- Conflicts and the authoritative decision to revisit:

## E. Evidence and handoff

Keep these statuses distinct; do not mark another stage accepted from source-only
evidence:

- Design/source review and representative cases:
- Syntax/data/schema checks, if implementation exists:
- Required runtime and schema registration observed:
- Actual prompt content and receiving model observed:
- Real conversation updates / reloads / old-save preservation observed:
- Driver acceptance:
- Unverified items and next authorized step:
