# Impact validation and release gate

Use the smallest sufficient validation during iteration, then require the complete
gate for a release candidate.

## Impact-based validation matrix

| Changed surface | Minimum evidence |
| --- | --- |
| Worldbook or rule text | UTF-8/JSON parse, model-visible lint, targeted contract, staged JSON pack. |
| Card-bound worldbook or version surface | Stable-ID and version resolution, attachment check, maintained-source semantic parity, stale-version negative fixture, staged JSON pack. |
| Initial variables or schema | Parse or syntax check, full field-chain trace, required/forbidden contract, staged JSON pack. |
| Update protocol or output format | Parser and protocol contract, examples/fixtures, model-text lint, reverse forbidden check, staged JSON pack. |
| Helper or runtime script | Language syntax, dependency/API contract, focused fixtures, staged JSON pack. |
| Regex or embedded UI | Syntax, selector and placeholder contract, native/fail-soft checks, staged JSON and PNG when payload changes, real-host acceptance pending. |
| Card type or runtime dependency ledger | Detection evidence, declared/detected reconciliation, dependency classes, embedded ownership, regional selection, user notice. |
| Remote or regional loader | URL/ref and fallback contract, exactly-one selection when declared, staged script preservation, real execution pending. |
| Profile or manifest | Schema, path containment, version alignment, referenced-file existence, packaging-policy checks. |
| Plan | Schema, base-state check, collision scan, guarded replacement counts, dry-run write inventory. |
| Contract | Schema plus positive and negative fixtures proving the check detects both pass and failure. |
| Recipe or component mapping | Dependency graph, conflict and collision checks, required outputs, sandbox composition parity. |
| JSON packer or PNG embedder | Full round trip, unknown-field preservation, payload cardinality, artifact parity, regression audit. |

Widen the check set whenever a change crosses two rows. A runtime-facing change remains
open after offline checks until the relevant SillyTavern behavior is exercised.

## Preparation gate

Before producing artifacts, require:

- explicit packaging or checkpoint intent;
- active profile and manifest re-resolved from disk;
- source changes complete within the approved scope;
- existing release artifacts inventoried and preserved;
- primary card type, capability flags, and runtime dependency ledger reconciled from
  maintained source;
- every required embedded dependency owned by a component or existing packed field;
- every regional alternative group has a declared selection rule;
- every card-bound or co-delivered worldbook resolved by stable ID from maintained
  source, with its version surface and attachment target declared;
- plan and configuration schemas valid;
- dry-run output reviewed;
- targeted checks passing;
- unresolved manual-component versus recipe ownership documented.

Do not compose a manual component profile unless a current matching recipe is
explicitly selected.

## Candidate construction

1. Compose generated components into staging.
2. Verify declared required outputs, embedded runtime assets, and regional selection,
   then compare them with the intended source snapshot.
3. Produce a user notice that reports what is already embedded, what the host must
   provide, what loads remotely, which regional member is selected, and which tools
   are development-only. For an MVU Zod card, name the packaged schema and
   domestic/global scripts, state which script is enabled, and report their remote
   targets without adding a standalone Zod installation step.
4. Resolve the card release and every bound worldbook from the active manifest; reject
   stale or ambiguous sources before packing.
5. Pack JSON from maintained component sources.
6. Parse the packed JSON; re-inventory `regex_scripts`, Tavern Helper scripts,
   schemas, loaders, and enabled states; then inspect each worldbook attachment and
   compare stable ID,
   version, and semantic content with the resolved maintained source.
7. When a standalone companion worldbook is declared, compare it with the card-bound
   copy and reject version or content drift.
8. Run the contract suite, including stale-worldbook, missing-embedded-dependency, and
   invalid-regional-selection negative fixtures when applicable.
9. Embed the validated JSON into a copied or declared PNG shell according to manifest
   payload policy.
10. Preserve all unrelated PNG chunks and replace only declared card payload chunks.
11. Re-open the PNG, enumerate payload keywords, decode each payload, and compare its
   parsed card semantics with the packed JSON.
12. Record artifact hashes, sizes, and write paths.

For broad SillyTavern compatibility, require a `chara` payload unless the target host
contract explicitly proves a different import path. If an additional V3 payload is
declared, require it to be semantically equal to the JSON and reject duplicates.

## Offline release-candidate gate

Require all applicable checks to pass:

- configuration, schema, and version alignment;
- card-bound and co-delivered worldbook ID, version, attachment, and maintained-source
  parity, including rejection of the previous version;
- dependency, conflict, and component-output ownership;
- card type/capability evidence and complete runtime dependency classification;
- every required embedded regex/schema/script/loader/binding present with the
  declared stable identity and enabled state;
- every regional alternative group satisfies its selection rule;
- syntax and UTF-8 integrity with no replacement characters;
- stable required and forbidden contract assertions;
- complete variable-field chains;
- model-visible text lint;
- JSON parse and card-spec validation;
- declared deliverable existence;
- JSON-to-PNG payload parity;
- round-trip extraction into a separate sandbox;
- release audit supplied by the project adapter;
- no writes outside the declared output scope.

A failed check blocks the candidate. Fix the maintained source or configuration and
rebuild; never patch the packed output to make the audit pass.

## Real-host acceptance gate

Keep these checks distinct from offline success when they are in scope:

- import JSON and PNG into the target SillyTavern version;
- verify host-required extensions/capabilities are installed and enabled;
- verify selected remote and regional loaders execute and publish their expected
  capability, not merely return HTTP success;
- inspect the imported card's actual bound worldbook identity and declared version;
- start a new chat and verify greetings and alternate greetings;
- exercise worldbook activation, MVU updates, regex rendering, and helper permissions;
- inspect the real DOM, computed styles, console, iframe/bridge state, and interactions;
- verify desktop and relevant mobile or WebView states;
- confirm saved settings are consumed by the intended runtime.

Label the result `candidate` while any required host check remains pending. Mark an
accepted release only after the owner confirms the manual gate.

## Delivery report

Report the detected card type/capabilities, dependency ledger, embedded assets, host
setup, remote loads, regional selection, development-only exclusions, exact files,
hashes, adapter commands, check counts, skipped checks, and manual acceptance status.
Distinguish preparation, built candidate, and accepted release; do not collapse them
into a single "done" state.
