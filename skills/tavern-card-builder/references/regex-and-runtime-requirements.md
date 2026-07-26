# Regex and runtime requirements

## Contents

1. Regex contracts
2. Script contracts
3. Delivery and dependency requirements
4. External API requirements

## 1. Regex contracts

Define the transformation before writing a pattern:

- source text and lifecycle stage;
- destination or replacement behavior;
- streaming versus final-message behavior;
- scope, ordering, and idempotence;
- preservation of model-visible protocol;
- rollback when the pattern does not match.

Do not use regex to conceal a broken variable or prompt chain. Test raw, streaming, and final states with adversarial text.

## 2. Script contracts

For every requested script, specify:

- trigger/event and lifecycle;
- read and write scope;
- idempotence and duplicate-registration guard;
- failure and cleanup behavior;
- dependency and capability detection;
- evidence required in a real runtime.

Use `$sillytavern-api-reference` before writing exact calls. Use `$sillytavern-runtime-debug` to close behavior.

## 3. Delivery and dependency requirements

Classify every regex, helper script, schema, loader, and host extension through
[card-types-and-runtime-dependencies.md](card-types-and-runtime-dependencies.md).

- A character-local regex or helper script that the card requires is
  `embedded_required`; missing or disabled content blocks assembly at the applicable
  stage.
- A Git/CDN import is `remote_runtime`; record its role, URL/ref, fallback, and
  failure behavior without telling the player to install it locally.
- Equivalent domestic and global loaders are `regional_alternative`; require every
  variant promised by the card to remain packaged, preserve the declared selection
  rule, and reject a release with no selected member or unintended double activation.
- A host extension is `host_required`; do not treat a packaged script as proof that
  the host capability is installed.

## 4. External API requirements

Treat a second model/API as a separate subsystem with explicit privacy, cost, timeout, retry, cancellation, and fallback behavior. Do not place credentials in card data or public skill examples.
