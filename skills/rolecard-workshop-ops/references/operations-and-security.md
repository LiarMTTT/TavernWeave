# Operations and Security Gates

## Read-only first

The default investigation may:

- Read repository status and deployment documentation.
- Enumerate configuration key names without values.
- Call public read-only health, index, and detail endpoints.
- Read already-authorized service status and narrowly filtered logs.
- Run local static checks and non-mutating contract tests.

It may not deploy, restart services, alter DNS/proxy/OAuth settings, change storage, rotate credentials, log out accounts, revoke tokens, or publish/review/withdraw packages without explicit authorization for that action.

## Preflight for authorized deployment

- Resolve `REPOSITORY_ROOT`, `GATEWAY_ROOT`, `GATEWAY_BASE_URL`, `SSH_TARGET`, `DEPLOY_COMMAND`, and `VERIFY_COMMAND` from user-approved configuration.
- Confirm branch, dirty files, intended diff, current release identifier, and rollback method.
- Ensure deployment tooling consumes `SECRET_CONFIG` without printing or copying secret contents into the model context.
- Run static checks, contract tests, local smoke tests, and package/privacy validation.
- Confirm the deployment does not include unrelated files or production data migrations.

## Secret handling

- Never print environment files, private keys, OAuth client secrets, admin credentials, session signing material, cookies, or authorization headers.
- Inspect presence, permissions, and validation results rather than values.
- Do not create an ad-hoc secret transport through chat, command arguments, logs, or committed files.
- Do not rotate, revoke, or replace credentials merely because they are unavailable; stop and ask the authorized operator.

## CORS and browser credentials

Derive CORS policy from the credential transport instead of applying a universal rule:

- Anonymous or explicit Bearer requests that omit browser credentials may support a broad origin policy when the product contract allows it.
- Cookie-authenticated cross-origin requests require an explicit allowed origin, `Vary: Origin`, and tightly scoped credential handling.
- Never combine wildcard origins with credentialed browser responses.
- Preflight and actual responses must agree on allowed methods, headers, and origin.
- Treat a CORS policy change as its own reviewed contract change; do not hide it inside an unrelated deployment.

Authentication and authorization remain server responsibilities. CORS is not a substitute for ownership checks, token validation, CSRF defenses where cookies are used, or least-privilege endpoints.

## Reverse proxy and OAuth checks

- Preserve the externally visible scheme and host through trusted forwarded headers.
- Route only intended API, authentication, and admin paths to the Gateway.
- Keep the Gateway's internal port private unless an explicit diagnostic exception exists.
- Ensure the OAuth callback configured at the provider exactly matches the public callback URL.
- Validate redirect/return targets against a narrow allowlist; never accept an arbitrary redirect destination.

## Post-deploy verification

1. Service/container reports healthy.
2. Public health endpoint responds through the reverse proxy.
3. Static index and package detail are reachable and mutually consistent.
4. Authentication status behaves correctly for anonymous and authenticated requests.
5. The affected create/update/withdraw/review flow passes with revision protection.
6. Logs contain no credentials or newly introduced personal data.
7. The active release identifier points to the verified release.

If a required check fails, stop further changes and use the documented rollback. Do not repeatedly restart, patch around the failure, or destroy the previous release.
