# Integration and reuse map

| Responsibility | Choice in 0.2.0 |
| --- | --- |
| Original yuri policy, delegated choices, localized entry | New small MIT extension |
| General character/worldbook/opening methods | Pinned external TavernWeave authoring documents; optional file-verified bridge |
| Markdown to SillyTavern JSON | Unmodified Foreverse MIT exporter; original notice retained |
| Workbench 1.2.0 adaptation engine | Remains separate and frozen; no source copied or relicensed |
| Search and image actions | Optional host-native workflow; no new service |
| Chosen PNG avatar packaging | New thin wrapper around the unchanged MIT serializer |
| Native host plugins and full migration | Outside this checkpoint |

Run `python skills/yuri-card-creator/scripts/create_card.py probe-base --tavern-root PATH` to verify the two selected upstream file blobs. This does not prove a complete TavernWeave installation, native host routing or that an agent read the documents. Omit the root for reported standalone mode. The agent performs creative interpretation; scripts do not call model APIs or browse.

The helper accepts an existing ready Workbench profile with `init --profile PATH`; it saves the provided complete profile, rather than changing global choices. The original-creation record holds authored choices and the agent review. External creative references must remain empty: a source-adaptation task belongs in another workflow. No source-card or fabricated extraction record is generated.

Minimum end-to-end path: `init` → agent writes `card.md` and `creation.json` → `build` → final JSON + worldbook + creation record. Use fresh output paths. The build checks structure and source mode, not literary quality or the truth of an agent's review acknowledgment.

The first release uses a text-first adult main cast. Large systems, a mandatory design interview and graphics are unnecessary for this delegated first draft. Upstream does not automatically confer tested compatibility across hosts. Keep the verified v1.2.0 archive frozen.

`capabilities` reports supported package commands separately from unprobed host tools. `pack-image --card PATH --avatar PATH --output NEW.png` packages a wrapped v2 card with a PNG avatar; it is not an inherited-card decoder. Read the optional-tools reference for limits. Package version is 0.2.0; the compatible original creation-record contract remains 0.1.0. Custom profile enforcement is deferred, as is the legacy-file licensing decision.

## Verified fork integration

Repository: https://github.com/imbdsssity/TavernWeave-Yuri. Remote development branch yuri-dev was created and read back at f9863d2b05305457fe9ed8b0c5688d52aca400a5. This package is staged under extensions/yuri-creation/ on local feature/yuri-creation-integration. Main is unchanged. Pass the repository root as --tavern-root when using the co-located pinned authoring files; this verifies two document blobs, not native registration. The 23-skill inventory and all upstream paths remain unchanged. The extension is not automatically included in upstream host/plugin packages.

Run focused tests from the fork root with python -m unittest discover -s extensions/yuri-creation/tests -q. Run the file probe with `python extensions/yuri-creation/skills/yuri-card-creator/scripts/create_card.py probe-base --tavern-root .`. Keep custom-profile and legacy-license work deferred.

Development and publication now run directly from this workspace through GitHub: feature branch → PR into yuri-dev → user-authorized main release. See PROJECT_WORKFLOW.md; old Drive publisher instructions are superseded.
