# Review of three submitted user trials

This is a bounded review of submitted artifacts, not three end-to-end extension passes. Private Drive cards, source PNGs and research notes are not copied into this repository.

| Trial | Available evidence | Review result |
| --- | --- | --- |
| Terra original conversational creation | The user-reviewed `examples/yuri-trials/wuren-shuming/` source, card, worldbook and creation record added in commit `2401ad9f8dcfe73472eb87a469eecb45d8d1440d` | Rebuilt with the extension on that commit; all three output files match byte for byte. Ten worldbook entries and four dialogue examples are present. This supports the original-creation/export path; no real SillyTavern import is recorded. |
| Argon named-fictional-character research | A JSON card with eight embedded worldbook entries and source/authority notes | The notes explicitly report using upstream archive `f9863d2b05305457fe9ed8b0c5688d52aca400a5`, without the extension. They describe host search/page tools and a separately authored candidate export. This is useful upstream/host-assisted evidence, not an extension export pass. |
| Argon inherited PNG adaptation | Adapted JSON, agent report and the linked original PNG | The report also declares the older upstream archive and private sandbox tools. Independent comparison confirms the source hash, preserved worldbook IDs, unchanged regex configuration and consistent root/data mirrors. The revised PNG is absent from the submitted folder and was not found by its reported filename, so its payload/image round trip remains unverified here. |

## Findings

- The original trial's exact agent checkout is not separately recorded, but its artifacts are reproducible on the reviewed PR head. User-supplied thematic inspiration is explicitly recorded as inspiration rather than verified history; no supplied essay body is bundled.
- Both Argon trials report that the pinned extension commit was inaccessible. Their transparent fallback reports must remain labeled as upstream/host-assisted runs. These are environment/access gaps, not evidence that the extension exporter failed.
- The researched card's runtime strings use `{{user}}` correctly. Single-brace `{user}` wording occurs in its author notes, so there is no supported reason to rewrite the runtime card for that issue.
- The official character page was opened during this review and supports the basic character/age information used in the research notes. The complete research chain, host tool invocations and all detailed claims were not independently replayed. This fictional-character trial does not establish real-person-specific handling.
- The inherited JSON changes nine alternate greetings, six worldbook content fields and two regex replacement bodies. Source worldbook IDs remain `0–11,13`; gaps are not renumbered. Regex IDs, matching expressions, switches and other configuration compare equal. Editing a replacement body's visible text does not by itself establish unchanged live rendering or script behavior.
- No submitted trial establishes live SillyTavern import, frontend interaction, slash-command behavior or roleplay quality. The researched standalone worldbook is mentioned in notes but not present in its submitted folder; the card does contain an embedded worldbook.

## Work resulting from this review

Added a compact testing reference that requires the actual revision/capability check before attributing a result to this extension and asks the agent to retain the actual output artifacts. No exporter, source card, artwork or narrative content was changed on the basis of an unverified report. The existing 16 focused tests remain the runtime baseline; no upstream suite or full model trial was repeated.

The next useful evidence is the actual revised PNG, followed by one small import/persona-selector check in the user's SillyTavern environment. A future extension-specific rerun needs a host that can access the pinned extension files, or an exact supplied snapshot. Research/source-mode support and inherited-card adapters remain separate work; do not erase provenance or treat those tasks as original creation to pass its validator.

The custom-profile and legacy-license decisions, and real-use validation of frozen Workbench v1.2.0, remain deferred. Frontend redesign is not a prerequisite for the text-first original trial.

Official page spot-check: https://pripri-anime.jp/character/
