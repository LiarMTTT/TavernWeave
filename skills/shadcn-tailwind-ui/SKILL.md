---
name: shadcn-tailwind-ui
description: Build, restyle, or review accessible React interfaces that use shadcn/ui, Radix UI primitives, and Tailwind CSS. Use for component composition, responsive layouts, semantic design tokens, dark mode, forms, dialogs, tables, keyboard interaction, and safe Tailwind configuration in React, Vite, or Next.js projects. Do not use for canvas art, posters, font bundles, non-React frameworks, or general brand design.
---

# shadcn + Tailwind UI

Before UI writes, use `$consult-tavernweave-library` with the `shadcn-tailwind-ui` route to load A0, responsive/CSS guides, and candidate design/motion references. Selecting a library or visual direction does not authorize dependency installation or overwrite existing configuration.

Use this skill for implementation work inside an existing React codebase. Preserve the project's framework, package manager, component conventions, tokens, and installed shadcn components before introducing anything new.

## Scope

- React, Vite, and Next.js applications.
- shadcn/ui components backed by Radix UI primitives.
- Tailwind CSS utilities, semantic tokens, responsive layout, dark mode, and reduced motion.
- Product UI such as forms, dialogs, navigation, tables, settings, dashboards, and empty/error/loading states.

This skill does not provide fonts, images, canvas design, poster generation, or third-party component source. Read [provenance.md](references/provenance.md) before redistributing this skill.

## Workflow

1. Inspect the project before changing it:
   - Read `package.json`, the lockfile, `components.json`, the CSS entry point, and existing UI components.
   - Detect the React framework, Tailwind major version, path aliases, icon library, form stack, and package manager.
   - Check existing user changes and avoid replacing configuration or generated components blindly.
2. Reuse the current system:
   - Prefer an installed shadcn component over a parallel custom primitive.
   - Reuse semantic colors, spacing, radius, typography, and motion tokens.
   - Extend a component locally only when the behavior or repeated variant requires it.
3. Implement structure before decoration:
   - Use semantic HTML and a logical heading order.
   - Provide labels, descriptions, error associations, visible focus, keyboard operation, and stable loading/error/empty states.
   - Compose dialogs, menus, tabs, selects, and popovers from Radix-backed primitives instead of recreating focus management.
4. Style mobile-first:
   - Start with the smallest supported viewport, then add a small number of breakpoint overrides.
   - Use wrapping, `min-w-0`, overflow rules, and content constraints deliberately.
   - Support light/dark themes, 200% zoom, reduced motion, long text, and touch targets.
5. Validate in the real project:
   - Run the project's typecheck, lint, tests, and build at the smallest useful scope.
   - Exercise keyboard-only navigation, focus return, form errors, responsive breakpoints, dark mode, and reduced motion.
   - Inspect the rendered DOM and computed layout; a successful build alone does not prove UI behavior.

## Component Rules

- Use `Button` for actions and links for navigation; do not attach click behavior to plain `div` elements.
- Every input needs an accessible name. Associate errors and descriptions with the input that owns them.
- Icon-only controls require an accessible label and a visible focus state.
- Destructive actions require clear wording and confirmation proportional to impact.
- Dialogs must have a title, focus containment, Escape handling, and focus return to the trigger.
- Prefer semantic token classes such as `bg-background`, `text-foreground`, and `text-muted-foreground` over scattered literal colors.
- Avoid runtime-built Tailwind class fragments that the compiler cannot discover. Use complete class names or an explicit safelist.
- Respect `prefers-reduced-motion`; motion must not be the only way to communicate state.

## Tailwind Configuration Safety

Prefer the project's existing configuration. Tailwind versions differ: use the installed version's official documentation before deciding between a JavaScript/TypeScript config and CSS-first `@theme` customization.

For projects that intentionally use a config file, `scripts/generate_tailwind_config.py` is a guarded helper:

```powershell
# Default TypeScript format; dry run prints the proposed file and writes nothing.
python scripts/generate_tailwind_config.py --framework react --format typescript --colors brand:#2563eb

# ESM JavaScript: tailwind.config.js with export default.
python scripts/generate_tailwind_config.py --framework nextjs --format esm --write

# CommonJS: tailwind.config.cjs with module.exports; explicitly replace an existing file.
python scripts/generate_tailwind_config.py --framework nextjs --format commonjs --force
```

Choose `typescript` for `tailwind.config.ts`, `esm` for `tailwind.config.js`, or `commonjs` for `tailwind.config.cjs`. Match the project's existing module mode; do not change `package.json` just to fit the generator. The selected format controls both the default extension and export syntax. `--force` is the only overwrite path. Review the printed proposal and preserve project-specific content paths, plugins, and tokens before using it.

## Installing shadcn Components

Treat the shadcn CLI as a project mutation:

1. Confirm `components.json` and the package manager.
2. Inspect whether the requested component already exists or has local edits.
3. Pin or confirm the CLI version appropriate for the project.
4. Run the smallest `add` command; do not use `--all` by default.
5. Review the generated diff and run the project checks.

Never overwrite a locally modified component without explicit user authorization.

## References

- [react-ui-checklist.md](references/react-ui-checklist.md): compact implementation and acceptance checklist.
- [provenance.md](references/provenance.md): source and licensing boundary for this clean derivative.
