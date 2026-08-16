# Creative authority and resumable continuation

Use one project-local Markdown document as the human-readable authority for a long-running card. Its YAML front matter carries identity and state; bounded structure blocks carry machine-checkable records; prose explains decisions without becoming a second source of truth.

## Required front matter

```yaml
---
authority_schema: tavernweave/creative-authority/v1
project_id: stable-project-id
title: Human-readable title
status: implementation-candidate
target_card_type: text | mvu | mvu_zod | hybrid | unknown
target_host: SillyTavern version or unresolved
updated: YYYY-MM-DD
next_gate: one concrete gate
---
```

Allowed `status` values are:

```text
candidate
driver-approved-design
implementation-candidate
automated-evidence
real-host-evidence
driver-accepted
```

Only the driver may set `driver-approved-design` or `driver-accepted`. Automation may report evidence and propose the transition, but must not perform it.

## Required sections

Keep each fact in exactly one state bucket:

```markdown
## Goal and exclusions
## Confirmed
## Proposed
## Open decisions
## Rejected
## Material index
## Entry and component map
## Runtime dependency ledger
## Acceptance ledger
## Next gate
```

Use stable record lines in the five decision sections:

```text
- [DEC-001] statement
```

An ID may occur in only one of `Confirmed`, `Proposed`, `Open decisions`, or `Rejected`. Move the record when its state changes; do not duplicate it and do not silently rewrite its meaning.

## Bounded structure blocks

Use fenced blocks for data that scripts must validate. JSON is used inside the Markdown authority so users can read and diff it without installing a YAML parser.

```twa-materials
{
  "schemaVersion": 1,
  "materials": []
}
```

```twa-entries
{
  "schemaVersion": 1,
  "entries": []
}
```

```twa-acceptance
{
  "schemaVersion": 1,
  "items": []
}
```

Read [material-provenance.md](material-provenance.md) for material and claim records. Read [acceptance-ledger.md](../../sillytavern-card-pipeline/references/acceptance-ledger.md) for evidence records.

## Resume protocol

When the user says “继续”, “续接”, or returns after an interruption:

1. Locate the repository instructions and the declared creative-authority file.
2. Read its front matter, `Confirmed`, `Open decisions`, `Acceptance ledger`, and `Next gate` before asking questions.
3. Inspect the actual Git/worktree and named artifacts; do not trust a stale prose summary over current files.
4. Restate the current authority, what remains proposed, the last verified evidence, and the next gate.
5. Ask only decisions that are truly open. Never re-interview a confirmed setting unless the user changes it or current files contradict it.
6. If authority and implementation disagree, stop promotion, record the conflict, and ask which is authoritative.

## Promotion rules

- A proposed setting becomes confirmed only through an explicit driver decision.
- Generated prose cannot promote its own source claims.
- Automatic tests can move work only as far as `automated-evidence`.
- A browser preview, API 200, static fixture, or package hash cannot substitute for a required real SillyTavern or human gate.
- A new idea discovered during finishing returns to `Proposed` or a follow-up; it does not widen the active slice.
- Every state transition records date, actor class (`driver`, `agent`, `automation`), evidence IDs, and the next gate.

## Minimal template

Copy [creative-authority-template.md](creative-authority-template.md) into the target project and rename it deliberately. The template contains no private project facts and is not a global memory store.
