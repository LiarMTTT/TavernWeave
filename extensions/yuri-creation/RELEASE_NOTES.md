# Yuri Card Workbench 0.4.0 development checkpoint

Adds adapt-yuri-card with JSON/PNG decoding, original-byte/document bindings, protected before/after edits and fresh repacking. Unknown fields, scripts, worldbook settings/IDs/order and unrelated image chunks are preserved; schemas are retained instead of flattened through Markdown. Folder inventory distinguishes candidate cards, components, versions and reference art before agent-assisted grouping. Standalone JSON worldbooks use the same protected editor.

Adds novel-excerpt-to-yuri-card and a TXT/Markdown/EPUB chapter-selection front end. It registers chosen chapters or explicit ranges, records original hash/member/offset mappings, and shares the existing extraction/v2 and adaptation/build pipeline. Third-person fiction can introduce a player as an explicit invention, without fabricated source evidence. No fixed narrative character cap or silent truncation is introduced.

Two GPT-6 Luna checks covered one supplied PNG and one EPUB excerpt of 1,500 characters. No primary-model tests or old-suite reruns were performed. Container preservation and novel ingestion/promotion passed within that scope; no full adaptation-quality, host-import or roleplay claim is made. See docs/FILE_SUPPORT_REVIEW_2026-11-12.md. Native host registration remains the next integration scope; arbitrary schema migration and advanced compatibility remain separate.

## 0.3.1

Adds individually cited claims for new source extractions, retains compatibility with previously promoted v1 projects, clarifies pre-authoring routing and guards against blending different people's incidents. Shared name review offers contextual alternatives and preserves the current name until the user chooses or delegates. Dedicated name-review testing is deferred by request.

The Terra 0.3.0 post trial now has user-reported successful SillyTavern import and satisfactory roleplay. Its private card was not rewritten. See docs/SOURCE_TRIAL_REVIEW_2026-11-12.md for the scoped review and 40 automated checks. Inherited-card decoding/editing and broader file support remain unfinished; native host registration follows those stabilized entry points.

## 0.3.0 foundation

Adds a small post-to-yuri workflow alongside the existing original creator. The agent reads a supplied TXT/Markdown post, preserves source-linked facts and uncertainty, authors a yuri adaptation, and exports a card with a worldbook and adaptation record. An anonymous poster becomes {{user}} in runtime prose while the source gender remains unchanged in the evidence.

Shared provenance calls the pinned TavernWeave work-library implementation for frozen text, units, exact quote validation, editable Markdown records, indexing and transactional writes. Original bridge code adds source/draft/fact bindings, full supplied-post unit coverage, per-field/entry provenance and causal adaptation decisions. The existing unchanged Foreverse MIT serializer still produces the card. No legacy Workbench code is ported or relicensed.

This checkpoint supports one supplied post and the default adult-women main-cast result. It is not a whole-novel ingestion route, inherited-card decoder, autonomous web scraper, batch card system or native plugin registration. Large text is segmented rather than silently cut off; agent coverage notes and exact quote checks do not prove complete semantic understanding.

The 0.2.0 original-creation/PNG checkpoint remains available, with its earlier accepted import and short chat. New source-route checks use fresh synthetic material; withdrawn user cases stay excluded. Runtime semantic quality and causal faithfulness are reviewed by the agent, with human feedback in conversation.
