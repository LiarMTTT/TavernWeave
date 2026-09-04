# Architecture review

Use with `focus: architecture`. Work from current source, actual contracts and project authority. Identify the reviewed root and revision/worktree state; only merge slices from the same agreed scope and snapshot. Diagrams or proposals are context, not proof of implementation.

## Software

Trace a small set of representative core flows through their real entrypoints, owners and consumers. Inspect module responsibilities, dependency direction, hidden global state, duplicate sources of truth, public contracts, error propagation, lifecycle/cleanup and whether core behavior can be verified at its boundary. Distinguish repeated independent behavior from unsafe duplication. File size, layering count, or aesthetic preference alone does not justify refactoring.

## Character cards

Start at the existing creative authority and source manifest. Follow the systems actually present:

- identity, relationships, worldbook entry boundaries and who owns each established fact;
- prompt routing, entry activation, knowledge boundaries and prompt budgets;
- author-written decision protocols and plot/update model responsibilities;
- variable schema, initialization, updates and derived state, when used;
- script/regex responsibilities and frontend projections;
- maintained sources, component recipes, assembled JSON/PNG and companion worldbooks.

Check contradictions, divergent copies, duplicate state writers, missing or mismatched links between these boundaries, and untestable core behavior. A text-only card need not adopt MVU, a custom decision protocol, or a separate frontend. Use `$tavern-card-builder` for authoring-contract context, the API reference skill for version-sensitive facts, and runtime debugging for real-host evidence. This review does not authorize installing dependencies or invoking a paid model. Do not demand a model's private reasoning as evidence; inspect observable routing and outputs.

## Mixed projects and report

Review both sides and their connections: for example, whether a status panel displays canonical variable state or maintains an independent competing state. Trace the same identity, contract and lifecycle through the boundary rather than auditing disconnected layers alone.

Return a concise current-structure description or relationship table, then evidence-backed findings with the affected contract/flow, consequence, bounded correction and verification route. Retain the P0–P3 scale and existing refactor gates. Keep staged recommendations separate from authorized patches; preserve a rewrite as a separately approved plan.

For a full architecture review, inventory the entire agreed scope, finish or explicitly defer each slice, and include coverage records from [audit-and-sweep.md](audit-and-sweep.md). Resolve missing files, excluded sources and contradictory slice claims before claiming full scope coverage. File review still does not prove runtime or driver acceptance.
