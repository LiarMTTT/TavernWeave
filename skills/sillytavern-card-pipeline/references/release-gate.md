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
2. Verify declared required outputs and compare them with the intended source snapshot.
3. Resolve the card release and every bound worldbook from the active manifest; reject
   stale or ambiguous sources before packing.
4. Pack JSON from maintained component sources.
5. Parse the packed JSON, inspect each worldbook attachment, and compare stable ID,
   version, and semantic content with the resolved maintained source.
6. When a standalone companion worldbook is declared, compare it with the card-bound
   copy and reject version or content drift.
7. Run the contract suite, including a stale-worldbook negative fixture.
8. Embed the validated JSON into a copied or declared PNG shell according to manifest
   payload policy.
9. Preserve all unrelated PNG chunks and replace only declared card payload chunks.
10. Re-open the PNG, enumerate payload keywords, decode each payload, and compare its
   parsed card semantics with the packed JSON.
11. Record artifact hashes, sizes, and write paths.

For broad SillyTavern compatibility, require a `chara` payload unless the target host
contract explicitly proves a different import path. If an additional V3 payload is
declared, require it to be semantically equal to the JSON and reject duplicates.

## Offline release-candidate gate

Require all applicable checks to pass:

- configuration, schema, and version alignment;
- card-bound and co-delivered worldbook ID, version, attachment, and maintained-source
  parity, including rejection of the previous version;
- dependency, conflict, and component-output ownership;
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
- inspect the imported card's actual bound worldbook identity and declared version;
- start a new chat and verify greetings and alternate greetings;
- exercise worldbook activation, MVU updates, regex rendering, and helper permissions;
- inspect the real DOM, computed styles, console, iframe/bridge state, and interactions;
- verify desktop and relevant mobile or WebView states;
- confirm saved settings are consumed by the intended runtime.

Label the result `candidate` while any required host check remains pending. Mark an
accepted release only after the owner confirms the manual gate.

## Delivery report

Report the exact files, hashes, adapter commands, check counts, skipped checks, and
manual acceptance status. Distinguish preparation, built candidate, and accepted
release; do not collapse them into a single "done" state.
