TavernWeave-Yuri is a specialized product distribution built on the retained TavernWeave ecosystem, with domain workflows, shared contracts and native-host composition.

# Product integration and reuse map

| Responsibility | Choice in 1.2.0 |
| --- | --- |
| Original yuri policy, delegated choices, localized entry | New small MIT extension |
| General character/worldbook/opening methods | Pinned external TavernWeave authoring documents; optional file-verified bridge |
| Markdown to SillyTavern JSON | Unmodified Foreverse MIT exporter; original notice retained |
| Workbench 1.2.0 adaptation engine | Remains separate and frozen; no source copied or relicensed |
| Search and image actions | Optional host-native workflow; no new service |
| Chosen PNG avatar packaging | New thin wrapper around the unchanged MIT serializer |
| Inherited JSON/PNG and standalone worldbooks | Original protected pointer adapter; unchanged MIT PNG chunk writer |
| Novel TXT/Markdown/EPUB | Small selection front end; existing shared provenance/extraction/build |
| Native discovery/package layout | Separate generated skills-only plugin with 27 entries; live account loading remains separate |

Run `python skills/yuri-card-creator/scripts/create_card.py probe-base --tavern-root PATH` to verify the two selected upstream file blobs. This does not prove a complete TavernWeave installation, native host routing or that an agent read the documents. Omit the root for reported standalone mode. The agent performs creative interpretation; scripts do not call model APIs or browse.

The helper accepts an existing ready Workbench profile with `init --profile PATH`; it saves the provided complete profile, rather than changing global choices. The original-creation record holds authored choices and the agent review. External creative references must remain empty: a source-adaptation task belongs in another workflow. No source-card or fabricated extraction record is generated.

Minimum end-to-end path: `init` → agent writes `card.md` and `creation.json` → `build` → final JSON + worldbook + creation record. Use fresh output paths. The build checks structure and source mode, not literary quality or the truth of an agent's review acknowledgment.

The first release uses a text-first adult main cast. Large systems, a mandatory design interview and graphics are unnecessary for this delegated first draft. Upstream does not automatically confer tested compatibility across hosts. Keep the verified v1.2.0 archive frozen.

`capabilities` reports supported package commands separately from unprobed host tools. `pack-image --card PATH --avatar PATH --output NEW.png` remains the original avatar packager. The separate card_file.py adapter handles inherited containers; do not send inherited cards through Markdown conversion. Package version is 1.2.0; the compatible original creation-record contract remains 0.1.0. Custom profile enforcement is implemented in shared/profiles.py; see references/custom-profiles.md. Legacy-file licensing remains deferred.

## Reviewed upstream integration

Repository: https://github.com/imbdsssity/TavernWeave-Yuri. The co-located upstream base remains pinned at f9863d2b05305457fe9ed8b0c5688d52aca400a5; this native feature starts from yuri-dev at 3ebc2a536dabb37328d8cc9ad05b5ad6182d8e8b. The extension lives under extensions/yuri-creation/. Main carries the official 1.2.0 release. Pass the repository/plugin root as --tavern-root when using co-located authoring files. Source root inventories and all 23 upstream skills remain unchanged; the separate native export adds four discovery wrappers.

The automated suite remains available with a historical 40-check baseline at 0.3.1. The 0.4.0 checks used one PNG and one EPUB excerpt; see docs/FILE_SUPPORT_REVIEW_2026-11-12.md. Native packaging checks are separately recorded in docs/NATIVE_HOST_REVIEW_2026-11-12.md and run by GPT-6 Luna. No earlier material trials or suites are repeated. Custom-policy checks use the focused development test in tests/test_profiles.py; legacy-license work remains deferred.

Development and publication now run directly from this workspace through GitHub: feature branch → PR into yuri-dev → user-authorized main release. See PROJECT_WORKFLOW.md; old Drive publisher instructions are superseded.

## Shared source provenance and first post route

Use scripts/source_card.py and shared/provenance.py for source_yuri mode. The post-to-yuri-card entry consumes supplied text, promotes source-linked extraction records into the pinned base’s work-library store via the small-record/reindex path, and exports with the existing MIT serializer. No long-task benchmark, token meter, model call, web fetch or fake original-mode record is introduced. The project keeps one authoritative fact store.

The base work-library code stays outside the extension under its PolyForm Noncommercial terms. UPSTREAM.json pins its actual implementation blob. New bridge code and the synthetic example are MIT original additions. The original creator stays original-only; do not empty real source references to bypass that validator. references/source-records.md defines the extraction/adaptation input format for the agent.

The post and novel routes support the shared validated profiles and require all registered units reviewed. novel_source.py selects TXT/Markdown chapters using the pinned splitter, or EPUB spine text using an original standard-library wrapper, then reuses the same records, quote basis and adaptation bindings. A third-person novel can introduce a player via an explicit invention decision without fabricating a source dossier.

As of 0.3.1, new extraction/v2 candidates use per-claim quotes; the original bridge derives body/evidence while leaving the upstream record format and engine unchanged. Existing promoted v1 projects remain readable and buildable, without a retroactive claim-review assertion. Both entry points route/read before drafting and share references/name-review.md for conditional conversational name choices. Name review is agent guidance, not a tested name classifier or an inherited-card adapter.

## Inherited containers

card_file.py inventory/open/apply supports existing v1/v2/v3 JSON, PNG card payloads and standalone JSON worldbooks. It decodes tEXt/zTXt/iTXt metadata, binds original bytes/documents, permits exact replacements of existing prose/keyword fields, preserves all unlisted settings, and writes fresh outputs. It calls the unchanged MIT chunk writer rather than the Markdown exporter, so no unknown field, worldbook ID/order/configuration or artwork is regenerated. Existing schema and worldbook dialect remain intact; arbitrary remodeling and cross-dialect migration are separate scope. See references/inherited-cards.md.

Folder inventory/grouping is agent-assisted, not automatic merging or a claim of DOCS-to-card losslessness. No broad host or exhaustive container-variant validation is claimed.

## Native distribution

scripts/build_host_plugin.py reuses the pinned upstream committed-file inventory, blob reader and source validator. It builds a complete folder from one source commit, retains the base skill tree and notices unchanged, then generates four native wrapper entries from canonical frontmatter, UI metadata, portable/Codex/Claude skills-only manifests and marketplaces. Canonical policies, shared scripts and source records stay in their maintained extension layout.

The generated yuri-plugin branch is a distribution channel, not the editable source branch. Its receipt identifies the exact source commit. No source-only tests, root hooks, MCP service, API keys, global instructions or personal-skill installation are enabled. Do not merge the generated tree back into source/main. DSH/Antigravity-specific registration is outside this checkpoint.

scripts/host_probe.py checks materialized files, runtimes and pins from any working directory; it never asserts account installation or actual native loading. ChatGPT Work browser users need a workspace admin to import/enable the GitHub marketplace, then a new task observing the entries. See docs/NATIVE_HOSTS.md for exact fields and evidence boundaries. This account action cannot be performed by GitHub writes.

## Custom-profile development checkpoint

All four workflows now validate the same saved policy interface, preserve the supplied preferences, and bind non-default policy review to the profile fingerprint. Scope, exclusions, declared identity criteria and declared relationship outcomes are checked before output. Unknown choices fail rather than receive default behavior. Actual prose, free-text criteria, authorization and protected anchors remain agent-reviewed. Default historical projects remain readable; inherited v1 sessions are default-only and new v2 sessions bind their saved profiles. No legacy implementation is copied. See references/custom-profiles.md for the supported fields and review contract.

Reference-led image changes reuse the pinned source-library visual observation, character-design, local prompt-spec and packaging skills. The Yuri handoff combines inspected original style with the updated narrative, passes the actual reference to image tools and presents a visually reviewed candidate for user choice. No new image engine or upstream skill changes are introduced. See references/image-adaptation.md.

[Architecture and distinct counting units](docs/ARCHITECTURE.md) defines canonical workflows, wrappers, implementation modules and discoverable entries. [Upstream synchronization](docs/UPSTREAM_SYNC.md) defines the seven-stage review/adoption process and the complete pin set. The 2026-11-13 review confirms that the existing f9863d2 commit already is current upstream v2.4.0, so no upstream code or pin revision is changed for 1.2.0.
