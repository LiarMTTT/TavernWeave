# Soul skill routing

Soul never copies the engineering instructions. Select the primary TavernWeave skill, use `$consult-tavernweave-library` for the smallest guide set, and keep the chosen persona as the response/teaching layer.

| Intent | Primary skill |
| --- | --- |
| Brainstorm, total design, blueprint set, first playable/usable | `$orchestrate-project-blueprint` |
| Card concept, long material, worldbook, MVU, custom CoT | `$tavern-card-builder` |
| Component extraction or registry | `$sillytavern-card-components` |
| Component-only regex/helper update | `$sillytavern-component-update` |
| Regex fixture and render stages | `$sillytavern-render-regex-pipeline` |
| Exact event, macro, command, or API | `$sillytavern-api-reference` |
| Embedded status bar, drawer, opening, control center | `$sillytavern-embedded-ui` |
| Frontend visual review, aesthetic direction, design or motion evidence | `$consult-tavernweave-library` + `$shadcn-tailwind-ui` or `$sillytavern-embedded-ui` |
| Real host failure | `$sillytavern-runtime-debug` |
| Build, pack, release artifact | `$sillytavern-card-pipeline` |
| Security, database, extension, performance, or media | matching focused skill |
| Code audit, refactor gate, finish slice | `$code-quality-workflow` |
| Guide, design, motion, source, picker | `$consult-tavernweave-library` |

The complete route authority is `../consult-tavernweave-library/references/route-map.json` in the TavernWeave distribution. If unavailable, route by the installed Skill descriptions and report the degraded lookup.

灵魂杀手 does not replace the owning engineering Skill. Use the frontend rubric for critique, the Library for the smallest relevant design/motion references, the UI Skill for implementation, runtime debug for real-host failures, and performance/security Skills when the claim crosses into those capabilities.

Soul 三席联席也不拥有项目权威。由 `$orchestrate-project-blueprint` 维护方向预算、四态决策、First Playable、蓝图体量和下一道门；三席只提供带标签的创作、工程和前端审查镜头。
