# Development handoff — 0.4.0

Entry points: yuri-card-creator (original conversation), adapt-yuri-card (inherited JSON/PNG/worldbook), post-to-yuri-card (post), novel-excerpt-to-yuri-card (TXT/Markdown/EPUB). Core policy stays English; interactions use the user's language and the same three saved defaults. Name review remains contextual and user-directed; dedicated behavior testing is deferred.

Use scripts/card_file.py inventory/open/apply for guarded replacement edits. Keep original bytes/documents private; fill exact pointer patches and reasons. Change affected PNG counterparts and existing mirrors explicitly. Preserve scripts, unknown values, worldbook settings/IDs/order and unrelated image chunks. No default insertion or flattening; incompatible payload structures fail. No arbitrary schema migration or merging by folder alone.

Use scripts/novel_source.py index/init to select chapters or an explicit range; source_card.py then reads units, locates evidence, promotes extraction/v2, prepares and builds the card. A novel may keep zero source-player records when the plan invents a player honestly. Keep original file hash/member/offset mappings and never mark unread units reviewed. Source interpretation, yuri causality, player agency and contextual names remain agent responsibilities.

The unchanged pinned TavernWeave implementation retains source registration/units/quote validation/records/indexing/transactions. New standard-library container/EPUB wrappers are original MIT additions. The unchanged Foreverse MIT chunk helper writes PNG metadata. No legacy Workbench implementation was imported; all dependency notices remain.

Cost-limited validation: two GPT-6 Luna agents, one PNG file and one EPUB file; the EPUB scope is 1,500 characters. No primary-model test execution or old-suite rerun. Keep private inputs, generated cards and evidence out of public source. See docs/FILE_SUPPORT_REVIEW_2026-11-12.md for actual results and limits. Do not recover withdrawn cases.

Publish feature PR into yuri-dev and verify tree readback. Main remains accepted 0.2.0 until explicitly released. Next development scope is native host registration; custom profiles, legacy licensing and advanced migrations remain deferred.
