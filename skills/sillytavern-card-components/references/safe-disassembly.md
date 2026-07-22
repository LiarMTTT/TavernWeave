# Safe JSON and PNG disassembly

Use this procedure whenever a packed card is being split into editable files.

## Non-destructive invariants

- Keep the caller's JSON or PNG byte-for-byte unchanged.
- Never use the input path as an output path.
- Never extract directly into an active source tree, version snapshot, release
  directory, or shared component library.
- Perform every parse and write inside a fresh sandbox with an explicit output root.
- Stop before writing if the tool cannot prove where it will write.
- Preserve a raw snapshot even when parsing fails.

## Create the evidence snapshot

1. Resolve the exact input path without following an ambiguous glob.
2. Reject directories, missing files, and unsupported extensions.
3. Record the original file's basename, byte size, modification time, and SHA-256.
4. Create a fresh sandbox outside all source and release roots.
5. Copy the input into `snapshot/` and make the copy read-only when the platform
   supports it. Do not change the original file's attributes.
6. Write extraction products only under separate `decoded/`, `components/`, and
   `roundtrip/` directories.
7. Record the extraction adapter, its version or hash, its arguments, and the final
   output inventory.

Treat the snapshot manifest as provenance, not as a second card configuration.

## Probe the extractor before use

Confirm from help output or source inspection that the extractor:

- accepts one explicit JSON or PNG input;
- accepts an explicit output root;
- rejects input/output aliasing and path traversal;
- reports duplicate logical entries rather than silently choosing one;
- preserves unknown fields and stable identifiers;
- fails without partially updating live files.

If an existing project extractor obtains its destination from a manifest, clone only
the required manifest and source into the sandbox and repoint every destination there.
Do not invoke it against the live manifest merely because the input flag is explicit.

## Decode JSON input

1. Decode as UTF-8 and fail on replacement characters or invalid JSON.
2. Preserve the raw bytes next to a normalized parsed copy.
3. Validate the declared card specification when a schema or validator is available.
4. Inventory top-level mirrors, `data`, character book entries, regex scripts, helper
   scripts, extension fields, messages, greetings, and embedded UI assets before
   splitting them.
5. Preserve unknown extension keys and object metadata. Do not normalize them away to
   fit a preferred local schema.

## Decode PNG input

1. Validate the PNG signature, chunk boundaries, lengths, CRCs when supported, and a
   terminal `IEND` chunk.
2. Inventory all textual payload chunks before selecting one.
3. Decode recognized card payloads from base64 to UTF-8 JSON. Treat `chara` as the
   compatibility payload and `ccv3` as an additional V3 payload when present.
4. Reject or explicitly quarantine duplicate payload keywords.
5. If multiple recognized payloads exist, compare their parsed card semantics. Stop
   on disagreement rather than guessing which one is authoritative.
6. Preserve the complete PNG snapshot and its non-card chunks. Extraction must not
   rewrite the image shell.

## Split logical components

Create a mapping record for each output with:

- stable component ID;
- relative output path;
- source JSON pointer, entry selector, or extension key;
- logical kind such as worldbook entry, regex, helper script, message, or extension;
- original identity and ordering metadata;
- source and output hashes;
- encoding and serialization mode.

Fail on duplicate output paths or selectors. Use lossless JSON for structured entries
whose metadata must round-trip; use text only when the mapping contract owns the
surrounding metadata.

## Prove the round trip

1. Compose the extracted components into a new JSON artifact in `roundtrip/`.
2. Compare normalized parsed objects while preserving semantically significant array
   order, IDs, booleans, nulls, unknown fields, and extension metadata.
3. If PNG is in scope, embed the rebuilt JSON into a copy of the captured image shell,
   then decode it again and compare it with the rebuilt JSON.
4. Verify the original input hash again.
5. Report semantic differences, byte differences, and intentionally excluded fields
   separately.

Do not promote extracted files merely because the round trip succeeds. Round-trip
fidelity proves reversibility, not generality, maintainability, or runtime fitness.
