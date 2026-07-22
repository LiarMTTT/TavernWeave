# Regex and runtime requirements

## Contents

1. Regex contracts
2. Script contracts
3. External API requirements

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

## 3. External API requirements

Treat a second model/API as a separate subsystem with explicit privacy, cost, timeout, retry, cancellation, and fallback behavior. Do not place credentials in card data or public skill examples.
