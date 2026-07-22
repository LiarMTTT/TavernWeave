# Lorebooks and prompts

## Contents

1. Entry boundaries
2. Routing and visibility
3. Import contracts
4. Prompt budget

## 1. Entry boundaries

Give each entry one coherent responsibility. Split always-on protocol, conditional setting knowledge, optional modules, and runtime-generated projections.

Record for each entry:

- stable identifier and human label;
- activation method;
- target model or processing stage;
- ordering/depth constraints;
- whether it is source, generated projection, or optional content.

## 2. Routing and visibility

Prefixes and placement may route content differently depending on the installed prompt/MVU mode. Verify who sees the entry. A variable model that cannot see current state may create duplicates or overwrite valid data; a plot model should not receive low-level mutation rules unless required.

## 3. Import contracts

When producing standalone lorebook JSON, derive its exact schema from an authoritative format definition or a verified local export. Validate entry-key/UID consistency and roundtrip import. Do not assume an export shape from another SillyTavern version.

Packaging and embedded-card attachment belong to `$sillytavern-card-pipeline`.

## 4. Prompt budget

Classify content as:

- always required;
- conditionally required;
- author documentation only;
- runtime/UI data that should never be sent to a model.

Deduplicate before shortening. Preserve semantic constraints and remove repeated explanation first.
