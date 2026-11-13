# Novel inputs and bounded scope

```text
python extensions/yuri-creation/scripts/novel_source.py index --input <novel.epub-or-txt>
python extensions/yuri-creation/scripts/novel_source.py init --input <novel> --chapter c000003 --project <new-private-project>
```

Repeat `--chapter` to select several catalog IDs, in source order. `--start A --end B` explicitly selects Unicode character offsets within one selected chapter. Both offsets are required. This is a declared excerpt, not a hidden max-chars cutoff. `--all` is an explicit alternative for full registration, not a claim that the agent read it all. Select a small scope by default and checkpoint ongoing reading rather than spend context on the whole work.

Text input defaults to UTF-8 or BOM-marked UTF-16. For another known encoding, supply `--encoding gb18030` (for example); decoding errors fail rather than replace characters. Chapter detection reuses pinned TavernWeave `split_text`, including Chinese chapter headings, English Chapter headings and Markdown headings. If the supplied text lacks recognizable headings, the catalog honestly exposes one continuous section; choose a range or have the agent identify boundaries from the text.

EPUB uses package spine order and available EPUB navigation/NCX labels. Spine documents are not guaranteed to be literary chapters; some contain covers, contents or several scenes. The catalog lists stable local IDs, member names, labels and linear flags without opening every story document. The agent selects actual prose from that catalog; empty/image-only selections fail. No artwork is extracted, remote content fetched, DRM bypassed or OCR result invented. Chapter extraction removes markup, scripts/styles/navigation and ruby pronunciation while preserving readable text. Exact quotes bind that normalized text, with original EPUB hash and member/character mappings retained.

The default 256 MiB input/selected-text memory budget is adjustable with `--max-mib`. It does not trim text. A selected chapter/member must fit the budget; otherwise select a smaller declared scope or raise the budget deliberately. There is no model context capacity claim. The agent decides what it can actually read and records only reviewed units. Large chapter counts do not require including all prose in one prompt.

Registration produces the existing source project with kind `novel`, `novel-001` source ID and `supplied-novel` continuity. The source descriptor's `origin` retains the file hash, total/selected catalog entries, source members or original TXT offsets, extraction offsets and text hashes. Subsequent exact quote/record promotion, indexing and transactions use the pinned upstream implementation unchanged.

Use shared `scripts/source_card.py read/evidence/extract/prepare/build` after registration. New extraction candidates still use `yuri/extraction/v2`. Adapted facts remain in the same upstream Markdown records; candidates are snapshots, not a second writable ledger. The ordinary source plan/binding/field checks apply unchanged.

For a source player, keep exactly one `yuri.role: player`, and `player_binding.record_id` selects her. Otherwise a novel extraction may have zero player records; keep real source cast roles as main/background. Use:

```json
"player_binding": {
  "mode": "invented",
  "record_id": "",
  "runtime_aliases": [],
  "result_woman": true,
  "result_adult": true,
  "reason": "A fictional adult woman introduced to interact with the sourced cast.",
  "decision_id": "new-player"
}
```

Add a matching `invention` decision and map it to affected output fields. This player is an adaptation, never an extracted source fact. Known-minor targets remain blocked by the existing adult-result source guard; do not falsify source age to get around it. Role, age, knowledge, narrator identity and relationship causality need actual prose review.
