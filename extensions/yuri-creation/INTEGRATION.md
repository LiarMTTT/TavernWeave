# Integration and reuse map

| Responsibility | Choice in 0.4.0 |
| --- | --- |
| Original yuri policy, delegated choices, localized entry | New small MIT extension |
| General character/worldbook/opening methods | Pinned external TavernWeave authoring documents; optional file-verified bridge |
| Markdown to SillyTavern JSON | Unmodified Foreverse MIT exporter; original notice retained |
| Workbench 1.2.0 adaptation engine | Remains separate and frozen; no source copied or relicensed |
| Search and image actions | Optional host-native workflow; no new service |
| Chosen PNG avatar packaging | New thin wrapper around the unchanged MIT serializer |
| Inherited JSON/PNG and standalone worldbooks | Original protected pointer adapter; unchanged MIT PNG chunk writer |
| Novel TXT/Markdown/EPUB | Small selection front end; existing shared provenance/extraction/build |
| Native host plugins and full migration | Outside this checkpoint |

Run `python skills/yuri-card-creator/scripts/create_card.py probe-base --tavern-root PATH` to verify the two selected upstream file blobs. This does not prove a complete TavernWeave installation, native host routing or that an agent read the documents. Omit the root for reported standalone mode. The agent performs creative interpretation; scripts do not call model APIs or browse.

The helper accepts an existing ready Workbench profile with `init --profile PATH`; it saves the provided complete profile, rather than changing global choices. The original-creation record holds authored choices and the agent review. External creative references must remain empty: a source-adaptation task belongs in another workflow. No source-card or fabricated extraction record is generated.

Minimum end-to-end path: `init` → agent writes `card.md` and `creation.json` → `build` → final JSON + worldbook + creation record. Use fresh output paths. The build checks structure and source mode, not literary quality or the truth of an agent's review acknowledgment.

The first release uses a text-first adult main cast. Large systems, a mandatory design interview and graphics are unnecessary for this delegated first draft. Upstream does not automatically confer tested compatibility across hosts. Keep the verified v1.2.0 archive frozen.

`capabilities` reports supported package commands separately from unprobed host tools. `pack-image --card PATH --avatar PATH --output NEW.png` remains the original avatar packager. The separate card_file.py adapter handles inherited containers; do not send inherited cards through Markdown conversion. Package version is 0.4.0; the compatible original creation-record contract remains 0.1.0. Custom profile enforcement and legacy-file licensing remain deferred.

## Verified fork integration

Repository: https://github.com/imbdsssity/TavernWeave-Yuri. The co-located upstream base remains pinned at f9863d2b05305457fe9ed8b0c5688d52aca400a5; this development feature starts from yuri-dev at b6499d0b666f37c6c9b5e866d1affd1e014bd9d7. The extension lives under extensions/yuri-creation/. Main remains the accepted 0.2.0 checkpoint. Pass the repository root as --tavern-root when using the co-located pinned authoring files; this verifies selected blobs, not native registration. The 23-skill upstream inventory and upstream paths remain unchanged. Four extension entry points are not automatically included in upstream host/plugin packages.

The existing automated suite remains available at extensions/yuri-creation/tests, with a historical 40-check baseline at 0.3.1. It was not rerun for this feature under the user's minimal-testing instruction. New checks are two bounded GPT-6 Luna file trials; see docs/FILE_SUPPORT_REVIEW_2026-11-12.md. Keep custom-profile and legacy-license work deferred.

Development and publication now run directly from this workspace through GitHub: feature branch → PR into yuri-dev → user-authorized main release. See PROJECT_WORKFLOW.md; old Drive publisher instructions are superseded.

## Shared source provenance and first post route

Use scripts/source_card.py and shared/provenance.py for source_yuri mode. The post-to-yuri-card entry consumes supplied text, promotes source-linked extraction records into the pinned base’s work-library store via the small-record/reindex path, and exports with the existing MIT serializer. No long-task benchmark, token meter, model call, web fetch or fake original-mode record is introduced. The project keeps one authoritative fact store.

The base work-library code stays outside the extension under its PolyForm Noncommercial terms. UPSTREAM.json pins its actual implementation blob. New bridge code and the synthetic example are MIT original additions. The original creator stays original-only; do not empty real source references to bypass that validator. references/source-records.md defines the extraction/adaptation input format for the agent.

The post and novel routes support defaults only and require all registered units reviewed. novel_source.py selects TXT/Markdown chapters using the pinned splitter, or EPUB spine text using an original standard-library wrapper, then reuses the same records, quote basis and adaptation bindings. A third-person novel can introduce a player via an explicit invention decision without fabricating a source dossier.

As of 0.3.1, new extraction/v2 candidates use per-claim quotes; the original bridge derives body/evidence while leaving the upstream record format and engine unchanged. Existing promoted v1 projects remain readable and buildable, without a retroactive claim-review assertion. Both entry points route/read before drafting and share references/name-review.md for conditional conversational name choices. Name review is agent guidance, not a tested name classifier or an inherited-card adapter.

## Inherited containers

card_file.py inventory/open/apply supports existing v1/v2/v3 JSON, PNG card payloads and standalone JSON worldbooks. It decodes tEXt/zTXt/iTXt metadata, binds original bytes/documents, permits exact replacements of existing prose/keyword fields, preserves all unlisted settings, and writes fresh outputs. It calls the unchanged MIT chunk writer rather than the Markdown exporter, so no unknown field, worldbook ID/order/configuration or artwork is regenerated. Existing schema and worldbook dialect remain intact; arbitrary remodeling and cross-dialect migration are separate scope. See references/inherited-cards.md.

Native host registration/packaging is the next integration scope. Folder inventory/grouping is agent-assisted, not automatic merging or a claim of DOCS-to-card losslessness. No broad host or exhaustive container-variant validation is claimed.
