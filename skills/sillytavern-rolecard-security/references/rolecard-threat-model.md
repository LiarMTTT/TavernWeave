# Rolecard threat model

## Trust boundaries

Treat these as separate surfaces:

- model and user text entering regex replacement or HTML;
- character-card fields and worldbook content;
- message-floor iframes and background Tavern Helper scripts;
- parent SillyTavern DOM and context APIs;
- remote Git/CDN loaders and host extensions;
- local development tools, release artifacts, and private operations.

Data crossing a boundary requires an explicit parser, sanitizer, origin rule,
capability check, or permission decision. A dependency declaration does not make one
surface's API available in another.

## Static rule families

- `TWSEC-DOM-*`: HTML sinks such as `innerHTML`, `outerHTML`,
  `insertAdjacentHTML`, or `document.write`.
- `TWSEC-EXEC-*`: `eval`, `Function`, or string-based dynamic execution.
- `TWSEC-REMOTE-*`: remote JavaScript imports, loader URLs, or executable schemes.
- `TWSEC-MSG-*`: wildcard or unchecked cross-frame messaging.
- `TWSEC-SECRET-*`: credential-shaped literals or sensitive field names with values.
- `TWSEC-FRAME-*`: iframe sandbox relaxation or executable `srcdoc`.
- `TWSEC-REGEX-*`: selected nested-quantifier patterns that merit ReDoS review.

Static matches are leads, not exploit proof. Validate reachability and controls before
calling a finding a vulnerability.

## Non-goals

Do not execute untrusted code, import a suspicious card, contact its remote loaders,
weaken browser or iframe security, enumerate user secrets, or perform exploitation.
Do not include secret values or long source excerpts in reports.

## Release decision

Block on an unresolved high finding, newly introduced baseline regression, exposed
credential, or remote executable dependency without provenance and an explicit
runtime contract. Medium findings require review and disposition. Low findings may
remain with rationale and a regression fixture.
