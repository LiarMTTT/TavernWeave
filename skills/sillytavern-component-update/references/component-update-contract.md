# Component update contract

## Delivery modes

`component` owns only importable component artifacts and validation reports.
It must not emit a character-card JSON, PNG, worldbook package, or release archive.

`full-card` owns component preparation and an assembly handoff. The handoff is an
input to `sillytavern-card-pipeline`; it is not a packed card and does not authorize
overwriting an existing artifact.

## Build spec

Use UTF-8 JSON:

```json
{
  "schemaVersion": 1,
  "deliveryMode": "component",
  "kind": "regex",
  "items": [
    {
      "artifactName": "status-bar",
      "value": {
        "id": "stable-id",
        "scriptName": "Status bar",
        "findRegex": "/<status>([\\s\\S]*?)<\\/status>/g",
        "replaceString": "$1",
        "trimStrings": [],
        "placement": [2],
        "disabled": false,
        "markdownOnly": true,
        "promptOnly": false,
        "runOnEdit": true,
        "substituteRegex": 0,
        "minDepth": 0,
        "maxDepth": 10
      }
    }
  ]
}
```

Supported `kind` values are `regex`, `helper-script`, and `helper-folder`.
`artifactName` must be a portable lowercase filename stem. Each item ID must be
unique inside the spec. Folder IDs and every child-script ID share that same batch
namespace, including children in different folders.

For `full-card`, also require:

```json
{
  "assembly": {
    "targetCard": "declared staging target",
    "componentId": "stable registry ID",
    "expectedUntouchedHash": "sha256 of the pre-change non-target surface"
  }
}
```

Do not put absolute private paths, secrets, or production coordinates in a public
spec or handoff.

## Outputs

The builder writes one JSON artifact per item and `component-update-manifest.json`.
Full-card mode additionally writes `assembly-handoff.json`. Output filenames are
derived from `artifactName`; collisions and paths outside `--out` are blocking.

Planning checks all output targets before writing, including the manifest and
handoff. Existing files, directories, or links at those targets are conflicts even
when their content happens to match. Use a fresh staging directory for another
delivery; this builder has no overwrite option. Unrelated files in the staging
directory are preserved.

The writer creates every target exclusively before filling the files. A target
created concurrently after planning cannot be overwritten. On a caught reservation
or write failure, close handles and remove only outputs created by this batch.
Return a failed result with any cleanup errors or remaining files. This is recovery
from handled failures, not a crash-atomic filesystem transaction; after a forced
process termination, inspect the staging directory and use a new directory for the
retry. Do not treat a partial manifest or the mere existence of a file as delivery.

The manifest records artifact kind, relative path, SHA-256, stable ID, and delivery
mode. It never contains card bytes.

## Preservation rules

- Preserve unknown object fields unless the target import format rejects them.
- Preserve item order, enabled state, helper buttons, helper data, and export flags.
- Never generate a new stable ID over an existing component unless explicitly
  replacing that component.
- Keep source, staging artifact, and packed card as distinct layers.
- In full-card mode, compare the non-target card surface against
  `expectedUntouchedHash` after the pipeline rebuild.
