# Architecture and Contracts

## Service roles

| Layer | Owns | Must not own |
|---|---|---|
| Static catalog | Schemas, examples, public indexes, compatibility metadata | Sessions, moderation writes, private credentials |
| Gateway | Package lifecycle, ownership, review state, authenticated APIs | Client-side runtime state or private keys embedded in packages |
| Object storage | Approved package files and optional media | Authorization decisions or identity profiles |
| Identity provider | Authentication assertion | Workshop package policy or long-term player tracking |
| Rolecard client | Browse, preview, install, owner actions | Server credentials or authoritative moderation fields |

Use the smallest deployment that meets the current reliability and distribution requirements. A custom domain, extra server, or managed service is optional unless the product requirements make it necessary.

## Generic endpoint contract

Actual paths are repository-defined. A typical Gateway exposes equivalents of:

- Read-only health.
- Public package list and package detail.
- Current publisher state and the publisher's packages.
- Create, update, and withdraw package operations.
- Moderation queue, detail, and decision operations.
- OAuth login, callback, and a bounded login handoff.

Public list responses include only approved, non-withdrawn records. Public detail retains the validated payload required by the client. Non-public records are visible only to an authorized owner or reviewer.

## Ownership and concurrency

- Derive a pseudonymous publisher identity server-side from the provider identity using a keyed hash or equivalent construction.
- Generate workshop publisher identifiers independently of the raw provider identifier.
- Enforce ownership on every update and withdraw request.
- Require a revision, ETag, or equivalent precondition for mutable package and review operations.
- Return a conflict for stale writes; never silently overwrite a newer package or moderation decision.
- Ignore or reject client-supplied ownership, review, revision, audit, and content-hash authority fields.

## Authentication handoff

For a browser-to-local-client handoff:

- Keep the redemption secret only in the initiating client.
- Send only a public handoff identifier through navigation URLs.
- Register a short-lived challenge before OAuth navigation.
- Make the handoff one-time, capacity-bounded, expiration-bounded, and deleted on redemption.
- Validate OAuth state, callback origin, return target, and handoff identifier.
- Use an exact `postMessage` target origin and send only a readiness signal; redeem through the authenticated Gateway channel.
- Mark responses containing authentication material `no-store`.

## Package lifecycle

Use explicit states such as pending, approved, rejected, and withdrawn. Only approved packages enter the public index. Withdrawal removes public availability without deleting a user's already installed local content.

Treat installation as a transaction:

1. Download and validate schema, size, content policy, and compatibility.
2. Show a diff or impact preview.
3. Apply only to the package-owned namespace after confirmation.
4. Preserve unrelated user-authored data.
5. Keep update and uninstall reversible where practical.

Do not let a content package directly mutate unrelated runtime variables, messages, credentials, or settings merely because it passed catalog review.

## Contract-change checklist

- Gateway request and response schema updated.
- Static schema/contract updated.
- Every client consumer updated.
- Compatibility behavior for older clients decided explicitly.
- Publish/update/withdraw/review smoke tests updated.
- Privacy field allowlist and log redaction rechecked.
- Public list and detail behavior verified after deployment.
