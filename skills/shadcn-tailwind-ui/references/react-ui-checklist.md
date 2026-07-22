# React UI Checklist

Use this checklist after inspecting the installed versions and the project's existing conventions.

## Before implementation

- Identify React framework, router, package manager, Tailwind major version, and shadcn configuration.
- Read the components and tokens already used by neighboring screens.
- Confirm the required states: default, loading, empty, error, disabled, offline, and success.
- Define the supported viewport range and whether embedded/iframe rendering changes the available width.

## Structure and behavior

- Use semantic landmarks and a logical heading hierarchy.
- Keep actions, navigation, disclosure, selection, and text entry as distinct control types.
- Use Radix-backed components for focus-sensitive patterns such as dialogs, menus, tabs, selects, and popovers.
- Keep form state and validation messages close to the fields they describe.
- Preserve user input across recoverable errors.

## Accessibility

- Test every interaction with keyboard only.
- Keep focus indicators visible and ensure focus returns after closing overlays.
- Give icon-only buttons an accessible name.
- Associate input labels, descriptions, and errors with stable IDs.
- Announce important asynchronous status changes with an appropriate live region.
- Meet WCAG AA contrast and avoid using color as the only signal.
- Respect reduced motion and verify the interface at 200% zoom.

## Responsive behavior

- Start with base mobile styles and add only necessary breakpoint overrides.
- Test narrow mobile, tablet, desktop, long text, and localized copy.
- Use `min-w-0`, wrapping, truncation, or scrolling intentionally; do not hide overflow accidentally.
- Keep touch targets large enough and avoid hover-only affordances.
- Check dialogs, tables, navigation, and sticky/fixed regions at boundary widths.

## Tailwind and tokens

- Prefer semantic tokens over literal palette values for product surfaces.
- Keep complete utility class names discoverable by the compiler.
- Use CSS variables for themeable values and pair background tokens with readable foreground tokens.
- Extend existing token scales before inventing one-off arbitrary values.
- Follow the installed Tailwind version's configuration model.

## Verification

- Run typecheck, lint, focused tests, and production build where available.
- Review the generated diff after any shadcn CLI operation.
- Inspect real DOM, computed styles, focus order, dark mode, and reduced motion.
- Confirm there are no console errors, clipped controls, inaccessible names, or accidental config replacement.

## Primary documentation

- shadcn/ui: https://ui.shadcn.com/docs
- Radix UI primitives: https://www.radix-ui.com/primitives/docs/overview/introduction
- Tailwind CSS: https://tailwindcss.com/docs
- WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
