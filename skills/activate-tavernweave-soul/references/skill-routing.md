# Soul skill routing

Soul never copies the engineering instructions. Select the primary TavernWeave skill, use `$consult-tavernweave-library` for the smallest guide set, and keep the chosen persona as the response/teaching layer.

| Intent | Primary skill |
| --- | --- |
| Card concept, long material, worldbook, MVU, custom CoT | `$tavern-card-builder` |
| Component extraction or registry | `$sillytavern-card-components` |
| Component-only regex/helper update | `$sillytavern-component-update` |
| Regex fixture and render stages | `$sillytavern-render-regex-pipeline` |
| Exact event, macro, command, or API | `$sillytavern-api-reference` |
| Embedded status bar, drawer, opening, control center | `$sillytavern-embedded-ui` |
| Real host failure | `$sillytavern-runtime-debug` |
| Build, pack, release artifact | `$sillytavern-card-pipeline` |
| Security, database, extension, performance, or media | matching focused skill |
| Code audit, refactor gate, finish slice | `$code-quality-workflow` |
| Guide, design, motion, source, picker | `$consult-tavernweave-library` |

The complete route authority is `../consult-tavernweave-library/references/route-map.json` in the TavernWeave distribution. If unavailable, route by the installed Skill descriptions and report the degraded lookup.
