# Worldbook design worksheet

This is an authoring worksheet, **not importable JSON or a runtime API schema**.
Use only sections needed by the current scope. Link existing authority, provenance,
variable contracts, and progress records; do not copy them into a second authority.
Replace placeholders before declaring the relevant section complete. Preserve a
project's established equivalent rather than creating duplicate files.

## Scope and existing sources

- Card type: <text | mvu_zod | hybrid>
- Core characters: <one | multiple; evidence/reference>
- Creative authority and confirmed scope: <path + decision ID>
- Source/provenance references: <paths + relevant IDs>
- Current opening(s): <path/ID; relevant initial conditions>
- Worldbook source and format: <path; Markdown/YAML/export/etc.>
- State authority, if used: <existing contract path; otherwise not applicable>
- Continuation/progress authority: <existing path; not a new progress log here>
- Change boundary and protected content: <this operation only>

## Size decision before design

- Selected size: <小型 | 中型 | 大型 | unresolved>
- Player decision reference: <message or existing decision ID>
- Explanation given: <小型 compact body + configuration; 中型 common foundation + details; 大型 playable scope + entry/loading plan, then batches>
- Recommendation and reason: <playable range; information needed together; loading needs>
- If not re-asked: <already explicit decision, or narrow non-redesign operation>

Do not begin new design with an unresolved choice. Read-only inspection and a
recommendation can proceed. Do not treat size as a quality, word-count, or entry quota.

## Content map

| Entry identity | Responsibility and boundary | Fact/decision reference | Common foundation dependency | Body source | Configuration source |
|---|---|---|---|---|---|
| <stable existing ID or proposed source ID> | <one responsibility> | <existing reference> | <ID or none> | <path> | <path/section> |

## Knowledge distinctions, where relevant

| Fact reference | Person/group | What and how much they know | Basis | Mistaken/outdated parts | Stable prose or existing changing-state reference |
|---|---|---|---|---|---|
| <objective fact or unresolved fact reference> | <including relevant intra-group differences> | <unknown/heard/partial/detailed; describe extent> | <evidence/source> | <belief distinct from truth> | <no duplicate mutable truth> |

Categories are descriptive, not a required enum or score. Knowledge is not merely known/unknown.

## Body and paired configuration: repeat per entry

### Identity and body

- Stable ID / source ID: <preserve existing ID>
- Name and responsibility: <meaningful subject and purpose>
- Body path: <maintained source>
- Body status and decision reference: <draft/confirmed; existing authority>
- Structured body organization: <headings/fields/lists; YAML when useful>
- Constraints preserved: <conditions, exceptions, costs, knowledge differences>
- Source/generated/optional: <one; projection source if generated>

### Authoring configuration — map to the verified target format

| Item | Value or preserved source reference |
|---|---|
| Enabled state | <true/false or equivalent verified source value> |
| Delivery class | <ordinary entry / explicitly loaded payload with controller reference> |
| Activation | <blue/constant; green/keyword; verified explicit-loading mechanism> |
| Core-profile rule | <single core: all profile entries blue; multiple: overview blue/details green; non-profile: not applicable> |
| Keywords | <specific formal names and stable aliases; target representation> |
| Effective keyword scan depth | **2**; <explicit field or verified inheritance; matching may be inactive for this delivery class> |
| Disable incoming recursive activation | **true**, mapped to <verified target field> |
| Disable outgoing recursive activation | **true**, mapped to <verified target field> |
| Placement and order | <use the new-card starting layout and example ordering in lorebook-and-prompts.md, or preserve the existing source; concrete values and reason for departures> |
| Insertion depth and role | <actual value when applicable; otherwise not applicable; unrelated to scan depth 2> |
| Probability, sticky, cooldown | <normally unused; explicit author request or identified special need before recommendation; preserve intentional existing values> |
| Delay, groups, filters | <preserved or deliberately chosen values; not invented to hide loading defects> |
| Dependencies | <common foundation IDs; approved state paths; controller/runtime evidence> |
| Missing-state behaviour | <approved contract reference, or not applicable> |
| Version/format evidence | <verified export/API/version evidence, or unresolved runtime boundary> |

Blue activation is not delivery evidence. All entries disable both recursion directions.
Do not convert unrelated world/protocol entries to green because a card has several
characters. Use the [new-card starting layout](../../references/lorebook-and-prompts.md)
when applicable; do not turn its recommendations into universal D0, fixed order ranges,
or all-world-before-character. Brief direct guidance may start at D0/system. A separate
character clarification is optional under [portrayal review and correction](../../references/character-review-and-correction.md):
prefer fixing its source, retain profile activation policy and stage applicability,
and do not add facts or advance state. Keep diagnosis in author records.

### Recipient ledger

| Generation mode | Plot recipient | Update recipient | Reason/evidence |
|---|---|---|---|
| Same-generation plot and update | <visible/not required> | <same generation, if applicable> | <why> |
| Extra update-model workflow | <visible/excluded> | <visible/excluded> | <verified routing or unresolved> |

State whether a mode is unsupported/not applicable rather than claiming both were
tested. Activation and routing are separate. Preserve current routing on a narrow edit.

## World-to-state handoff, only where required

| World/loading requirement | State contract reference and owner | Update/hold reference | Entry condition/reader | Missing value | Recipient | Evidence gap |
|---|---|---|---|---|---|---|
| <actual need> | <existing or approved proposed path; owning system> | <existing rule ID> | <entry/controller reference> | <contract behaviour> | <model(s)> | <source/prompt/runtime> |

Do not use this table as another writable state database. For hybrid, name one writer
per fact and the cross-system read contract. A loading problem does not authorize a
text-to-MVU migration or installation.

## Checks and handoff

| Case | Expected result | Evidence and status |
|---|---|---|
| First introduction without prior keyword | <safe foundation or approved preloading; no keyword prediction> | <not run/source/prompt/runtime> |
| Continued scene without repeated name | <necessary content available by designed mechanism> | <evidence> |
| Departure | <unneeded old details leave the prompt> | <evidence> |
| Alias/name collision | <no unrelated detail burst> | <evidence> |
| Single/multiple character configuration | <correct baseline, independent of technical type> | <evidence> |
| Effective scan and recursion | <scan 2; both recursion directions disabled> | <evidence> |
| Opening and initial state | <consistent with world and relevant branch> | <evidence> |
| Model recipients and budget | <each model receives only required content> | <evidence> |
| Existing source preservation | <stable IDs and unknown/unrelated fields retained> | <diff evidence> |

- Completed body/configuration pairs: <paths/IDs>
- Unresolved decisions or loading limits: <existing authority references>
- Actual prompt/model/runtime evidence still needed: <specific gaps>
- Next approved step: <scope; not an installation or release authorization>
