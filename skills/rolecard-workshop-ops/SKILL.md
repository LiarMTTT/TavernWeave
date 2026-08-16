---
name: rolecard-workshop-ops
description: Diagnose, review, operate, or deploy a generic rolecard workshop made of a static catalog, package gateway, object storage, OAuth ownership, review workflow, and reverse proxy. Use for health checks, API-contract alignment, publish/update/withdraw flows, privacy review, CORS and callback diagnosis, container or proxy planning, and explicitly authorized deployment. Start read-only; never deploy, rotate credentials, revoke access, or mutate production unless the user clearly authorizes that action and target.
---

# Rolecard Workshop Ops

Before any operational write, use `$consult-tavernweave-library` with the `rolecard-workshop-ops` route to load A0 and the deployment/workshop guides. Keep public guidance separate from production coordinates, credentials, live state, and deployment authorization.

Use this skill for workshop infrastructure and the contract between a rolecard client, a public catalog, a package Gateway, identity provider, review tools, and storage. Keep local rolecard UI work out of this skill unless the failure crosses that boundary.

## Operating Modes

Choose one mode and state it before acting.

1. **Read-only diagnosis** is the default. Inspect repository state, configuration names, health responses, public indexes, logs already available to the user, and contract tests. Do not deploy or alter remote state.
2. **Change candidate** is for preparing a bounded patch or deployment plan. Name the exact files, services, behavior change, verification, and rollback path. A candidate is not permission to deploy.
3. **Authorized deployment** requires an explicit user request to deploy or mutate the named environment. Reconfirm the resolved target, current release, backup/rollback surface, and verification commands immediately before execution.

If the request says only “check,” “debug,” “audit,” “take over,” or “see why,” remain in read-only diagnosis.

## Resolve Parameters First

Never infer deployment coordinates from examples. Discover or request these values and keep secrets out of chat and logs:

| Parameter | Meaning |
|---|---|
| `REPOSITORY_ROOT` | Local repository containing the catalog and Gateway |
| `GATEWAY_ROOT` | Gateway service directory |
| `STATIC_INDEX_URL` | Public catalog/index URL |
| `GATEWAY_BASE_URL` | Public HTTPS origin of the Gateway |
| `HEALTH_PATH` | Read-only health endpoint path |
| `SSH_TARGET` | Approved remote host alias or host supplied by the user |
| `DEPLOY_COMMAND` | Repository-owned deployment entry point |
| `VERIFY_COMMAND` | Repository-owned preflight/post-deploy checks |
| `SECRET_CONFIG` | Secret source consumed by deployment tooling, never opened into model context |

Reject unresolved placeholders before any remote command. Do not print secret values, private keys, OAuth client secrets, admin tokens, session signing material, or raw identity-provider identifiers.

## Architecture Boundary

- The static host publishes public schemas, examples, indexes, compatibility metadata, and version notices.
- The Gateway owns package creation, detail, update, withdraw, moderation status, ownership, and authenticated APIs.
- Object storage holds approved public packages and optional media; it is not an authorization database.
- OAuth establishes a minimal ownership identity for publish/update/withdraw. It is not a player-tracking system.
- The rolecard client consumes public data and authenticated owner APIs but must not contain server credentials.
- Imported packages must pass schema, compatibility, and policy checks before a separate, previewable application transaction.

Read [architecture-and-contracts.md](references/architecture-and-contracts.md) before changing an API or client consumer.

## Read-Only Diagnostic Sequence

1. Inspect the current repository and deployment documentation without changing files.
2. Locate existing ops scripts and package commands; do not invent a parallel deployment path.
3. Check the public health endpoint, static index, package list, and a package-detail response.
4. Compare the Gateway contract with every client consumer and contract test.
5. Inspect configuration key names and validation logic without reading values.
6. Check recent logs for the narrow failing request while redacting credentials, cookies, authorization headers, query secrets, and personal data.
7. Report the failing layer, evidence, smallest candidate change, verification, and whether deployment authorization would be required.

Do not treat a healthy process as proof that OAuth, storage, review, package detail, or client integration works.

## Change and Deployment Gate

For an authorized change:

1. Lock scope to one contract or operational problem.
2. Record the current release identifier and rollback mechanism.
3. Run repository-owned static checks, contract tests, and local smoke tests.
4. Review the diff for credentials, deployment coordinates, destructive commands, and unrelated changes.
5. Reconfirm the resolved environment and explicit authorization.
6. Use the existing deployment entry point; do not hand-copy secrets or improvise remote file mutation.
7. Verify health, public index, package detail, authentication status, and the affected owner/review flow.
8. If required post-deploy checks fail, stop and use the documented rollback path rather than stacking emergency patches.

Read [operations-and-security.md](references/operations-and-security.md) for approval, CORS, privacy, and rollback gates.

## Contract Rules

- Public list endpoints expose only approved, non-withdrawn packages.
- Detail endpoints preserve the package payload needed for validation and installation.
- Create, update, and withdraw enforce ownership on the server.
- Updates and moderation decisions use revisions or equivalent optimistic concurrency; stale writes fail closed.
- Clients cannot submit authoritative moderation, ownership, revision, or audit fields.
- Authentication handoff values are short-lived, one-time, bounded, and never delivered in a public URL with redemption authority.
- Install, update, and uninstall are transactional and touch only data owned by that package.
- An API-shape change is incomplete until Gateway, client consumers, schema/contract definitions, and smoke tests agree.

## Privacy Minimum

Persist only the minimum identity material needed for ownership, such as a provider-scoped keyed hash and a random publisher identifier. Do not persist email, nickname, avatar, raw provider ID, IP profile, or behavioral profile unless a separate, explicit product requirement and legal basis exists.

Logs should contain action, package identifier, pseudonymous publisher identifier, outcome, reason code, and time—not access tokens, cookies, authorization headers, OAuth codes, raw identity, or package secrets.

## Stop Conditions

Stop and return exact next steps when:

- Required authorization, account verification, CAPTCHA, or external consent is missing.
- A credential, private key, or secret would need to be exposed to continue.
- The target environment or rollback surface cannot be resolved unambiguously.
- The proposed operation could delete user packages, storage, audit history, or production data without a verified recovery path.
- A CORS, OAuth, proxy, storage, or release-pointer change would silently broaden the approved scope.

## References

- [architecture-and-contracts.md](references/architecture-and-contracts.md): generic service and API contract.
- [operations-and-security.md](references/operations-and-security.md): read-only checks, authorization gate, secrets, CORS, deployment, and rollback.
- [provenance.md](references/provenance.md): public-derivative boundary.
