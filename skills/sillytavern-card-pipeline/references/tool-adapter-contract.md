# Detectable project-tool adapter contract

This skill supplies orchestration rules, not an executable card engine. Bind its
capabilities to tools that already exist in the target repository.

## Discover capabilities without writing

1. Locate the repository root and read its agent instructions, build docs, package
   scripts, task definitions, and schemas.
2. Inventory likely entrypoints with read-only search.
3. Inspect `--help`, usage text, tests, or source for each candidate.
4. Confirm the required runtime and working directory.
5. Confirm how configuration is selected: explicit profile, explicit manifest,
   environment, or repository default.
6. Confirm exit-code behavior and machine-readable or stable textual success output.
7. Do not run a mutating capability during discovery.

A filename such as `build`, `pack`, or `release` is not evidence of its side effects.

## Record the adapter

Keep the adapter record in the task log or an existing project-owned configuration
surface. Do not add a new adapter layer unless the user requested implementation and
the repository lacks a suitable entrypoint.

Record these fields for every capability:

| Field | Requirement |
| --- | --- |
| `capability` | Stable semantic name. |
| `command` | Executable plus argument template. |
| `cwd` | Required working directory. |
| `inputs` | Explicit profile, manifest, plan, source, or artifact inputs. |
| `outputs` | Exact files or directories the command may write. |
| `readOnly` | Whether the capability is guaranteed not to write. |
| `dryRun` | Supported dry-run command and what it validates. |
| `collisionPolicy` | Fail, create-new, or explicitly replace after snapshot. |
| `partialWritePolicy` | Atomic behavior or recovery procedure. |
| `success` | Exit code and expected validation summary. |
| `provenance` | Documentation, schema, test, or source that proved the mapping. |

For a long-running watcher, also record its initial ready signal, rebuild success and
failure signals, output paths, observation method, and stop procedure. Do not reduce a
watcher to a one-shot command whose only success criterion is that the process remains
alive.

Pass arguments as separate process arguments when possible. Avoid constructing shell
strings from card paths or user content.

## Semantic capabilities

Map only capabilities the project actually provides:

| Capability | Expected behavior |
| --- | --- |
| `inspect` | Resolve active configuration and targets without writing. |
| `watch` | Continuously rebuild declared development outputs from maintained source and expose observable initial-build and rebuild results. |
| `validate-config` | Validate profile, manifest, plan, and contract structure. |
| `validate-source` | Run syntax, contract, field-chain, and targeted checks. |
| `apply-plan` | Preview and apply guarded data-driven operations. |
| `compose` | Resolve recipe dependencies and emit components to an explicit root. |
| `package-json` | Build a card JSON artifact from maintained component sources. |
| `embed-png` | Embed declared payloads into an explicit PNG target. |
| `validate-artifacts` | Parse and compare JSON and PNG payloads. |
| `audit-release` | Run the complete offline release audit. |
| `extract-roundtrip` | Re-extract a built artifact to an explicit sandbox root. |

Not every task needs every capability. Packaging JSON requires `package-json` and
artifact validation; publishing PNG additionally requires `embed-png`. A final release
requires whatever the repository declares for `audit-release`.

## Requirements for mutating capabilities

Before invoking a write:

- resolve every input and output to an exact path;
- verify outputs stay inside the approved staging or version root;
- reject ambiguous globs, parent traversal, input/output aliasing, and unplanned
  existing targets;
- require a dry-run for plan application when supported;
- snapshot an explicitly replaceable artifact before writing;
- know whether failure can leave partial output;
- capture the command, exit code, and final output inventory.

For `watch`, require an explicit live-development request, capture the first successful
build before handing off to runtime testing, keep compiler output observable, and stop
or isolate the process before another command writes the same outputs. Watch readiness
does not prove Tavern Helper listener connectivity or real-SillyTavern reload; those
belong to `sillytavern-runtime-debug`.

An extraction command is unsafe for round-trip use if it accepts an explicit input but
still writes to a live component directory through an implicit manifest. Rebind every
destination to a disposable configuration copy or leave that capability unavailable.

## Handle missing capabilities honestly

If discovery cannot prove a required capability:

1. stop before that stage;
2. report what was searched and what is missing;
3. complete any earlier read-only or independently verifiable checks;
4. ask whether to implement a project-local capability as a separate change.

Do not vendor a project engine into this skill, invent a command, or describe an
unverified manual transformation as equivalent to the repository's release process.
