# Frontend aesthetic rubric

Use this rubric for 灵魂杀手 reviews. It is an evidence checklist, not a universal style generator. The current product intent, audience, content density, platform constraints, accessibility needs, and confirmed project design authority outrank personal taste.

## Relic fault levels

| Level | Meaning | Default action |
| --- | --- | --- |
| Critical fault | blocks comprehension, control, accessibility, or the primary task | stop adjacent polish and fix now |
| High-pressure warning | materially weakens hierarchy, trust, rhythm, or platform fit | fix in the current slice |
| Aesthetic noise | generic, inconsistent, decorative, or insufficiently intentional | rank behind structural faults |
| Deferred signal | plausible issue without matching evidence | name the missing check; do not convict |

Report at most three faults. More findings may be parked, but the main review must remain actionable.

## Review axes

1. **Purpose and thesis** — Can the page state its primary job and emotional direction without a pile of effects? Is there one visual idea rather than a collage of fashionable fragments?
2. **Hierarchy and attention** — Does the first screen make title, state, primary action, secondary action, and decoration visibly unequal? Check contrast, scale, spacing, grouping, and reading order.
3. **Layout and rhythm** — Check alignment, container logic, whitespace cadence, density changes, edge relationships, scroll rhythm, and whether cards exist for structure rather than habit.
4. **CJK typography and copy** — Check Chinese line length, font fallback, punctuation, weight availability, heading/body contrast, cramped labels, orphaned units, and whether jargon or placeholder copy is doing design work.
5. **Color and tokens** — Check semantic roles, contrast, dark/light behavior, token reuse, and whether gradients, glow, glass, neon, gold, or red are communicating state instead of merely decorating it.
6. **Components and states** — Check repeated controls, icon language, radius, border, elevation, hover/focus/active/disabled/error/loading/empty states, and whether the same action looks the same everywhere.
7. **Motion with a job** — Every transition should explain causality, hierarchy, spatial continuity, feedback, or state change. Reject ornamental delay, competing loops, layout thrash, motion without reduced-motion fallback, and animation that hides latency or control.
8. **Responsive and ST fit** — Validate the relevant narrow width (default 390px), touch targets, text wrapping, safe areas, nested scrolling, keyboard/focus, iframe sizing, host CSS collisions, rerender/rebind behavior, and real SillyTavern constraints.
9. **Accessibility and resilience** — Check semantic structure, focus visibility, contrast, zoom, keyboard operation, reduced motion, failure/empty states, slow assets, missing fonts, and readable degradation.
10. **AI-slop detector** — Flag only with evidence: equal-weight card grids, gratuitous glassmorphism, purple-cyan gradient dependence, random sparkles, excessive pill labels, giant empty hero copy, icon soup, generic dashboard chrome, unedited placeholder prose, or motion everywhere. Any one pattern can be valid when the product thesis justifies it.

## Evidence ladder

```text
description -> source -> rendered screenshot -> interactive browser
-> 390px / reduced-motion / keyboard -> real SillyTavern iframe
-> driver aesthetic acceptance
```

Never promote one rung into another. A source review can find token drift but cannot prove visual balance. A screenshot can prove composition at one viewport but not hover, focus, motion, data change, or host lifecycle. A browser preview cannot prove real SillyTavern behavior. Driver acceptance cannot be self-issued by an agent.

## Repair format

For each fault, write:

```text
Claim: <one falsifiable design problem>
Evidence: <specific node, screenshot region, rule, state, or measurement>
Impact: <task, comprehension, consistency, accessibility, performance, or tone>
Correction: <smallest coherent design change>
Acceptance: <matching viewport/state/host/human check>
```

End by naming at least one thing that already works. Blunt review is not permission to erase a coherent style or redesign everything in the reviewer's image.
