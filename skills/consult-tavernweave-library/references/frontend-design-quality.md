# Frontend design quality

Use this shared standard for TW frontend design, visual implementation and review.
It applies to message content pages, MVU status bars, openings, control centers and
general product interfaces, including React. It applies without enabling Soul.
A local repair uses the standard within its scope and preserves the adopted design.

## Own the design work

Understand the experience the author wants from their description, supplied material
and the current project. Work out what the author needs and develop a design that fits.
The author need not supply a layout, a field inventory or design terminology first.
Resolve questions from maintained material before asking. Ask only about a missing
decision that would materially change the result and is outside delegated scope.

Propose a coherent main design with reasons. Offer alternatives when they represent
meaningfully different experiences, not to fill a fixed option count. Within the
authorized direction, decide the ordinary details and continue. Explain any proposed
new gameplay or content decision before treating it as established. A worksheet is
the agent's working aid, not a questionnaire or an extra approval gate for the author.

## Research before proposing a visual direction

Actively search the web for relevant design precedents and domain material. Open
useful source pages and inspect the actual design when the host supports it. Use
the bundled design/motion library as a starting index, not a substitute for current
research. Search by the task and experience: a correspondence archive, a compact
readout or a character selector may need different references from an award gallery.

Record the links actually consulted and what each contributes. Distinguish a rendered
page or interaction you inspected from a thumbnail, text description or inaccessible
page. When access is unavailable or the user requests offline work, state the gap
and use the available material; do not invent research or claim visual inspection.
Reuse relevant project research when it still answers the current decision. A narrow
wording or spacing fix need not restart the whole research stage.

Adapt useful methods to the current work. Do not copy another site's identity,
content or implementation wholesale. Browsing references does not adopt a dependency
or import an asset. Keep source URLs and design reasoning in author-facing records,
outside the player's page and model-visible worldbook body unless they serve a real
product purpose.

## Judge the idea and make it understandable

Give the interface a recognizable identity drawn from this work and the user's
preferences. Let its subject, atmosphere, and actual content shape the composition,
typography, imagery, and interaction details instead of applying a generic template
with a new palette. Carry the distinctive choices through the interface rather
than confining them to a decorative title. Reuse familiar controls where they work;
keep content readable, actions clear, and the interface accessible and responsive
within the runtime budget. Preserve an adopted direction when making local changes.

Prefer a visual explanation of the proposal. Use a wireframe or annotated mockup to
show hierarchy; use a small clickable prototype when the question concerns interaction.
Show an alternative beside the main proposal when comparison helps. Choose the
smallest useful representation with the available host tools. If only a text sketch
is possible, label its limits. Prototype-only interactions and sample data must be
identified as such; a mockup does not establish runtime readiness.

Explain why the recommended design is better for the current purpose. Identify what
the player notices first and how they reach the main action. Use those criteria to
make a recommendation rather than handing the author an unexplained gallery.
Existing design approval is reused; a visual explanation does not create another
mandatory confirmation round.

## Default quality standard

Default to Awwwards-level design ambition and evaluate the result through its four
published scoring dimensions. The [official Self Aware score page](https://www.awwwards.com/sites/self-aware)
lists Design 40%, Usability 30%, Creativity 20% and Content 10%. The table below is
TW's application of those dimensions, not an official award assessment.

| Dimension | Applied review |
|---|---|
| Design | The composition and visual details belong to the work. Typography, color roles and components form a coherent system. |
| Usability | Main content and actions are understandable. Narrow layouts, keyboard operation and recovery states remain usable. |
| Creativity | The idea has a reason grounded in this work and improves the experience. It does more than restyle a generic dashboard. |
| Content | Copy and visual material serve actual content or interaction. Placeholder material and decorative explanations do not fill gaps. |

Judge rendered work and the relevant interactions. Name concrete shortcomings and
revise them; do not self-issue an award, invent a passing score or use source presence
as evidence of aesthetic quality. Simple surfaces still require design care. Motion
and resource weight should fit the purpose, especially in frequently read status bars.

## Keep the page clean

Every visible phrase should have a content, narrative or operational purpose.
Do not add tiny text, arbitrary badges or pseudo-identifiers to fill space. Do not
automatically place English eyebrow text or a translation below every Chinese title.
Decorative additions such as `OVERVIEW` or `SYSTEM ONLINE` are not default page copy.
Explain a control only when its use or consequence needs explanation.

Retain meaningful names, units, dates, state labels and recovery messages. Preserve
the author's actual prose and explicitly chosen bilingual design. Code identifiers
and original data are not copy-editing targets. Put developer diagnostics in the
author's report or an appropriate on-demand diagnostic surface rather than ordinary
player content. Keep accessible names even when they are not displayed as extra text.

Remove content with no purpose instead of merely hiding it. Organize secondary
information through grouping or deliberate disclosure. Do not shrink readable text
to pack more labels into the page. Clean design permits detail when the work needs
it; it does not mandate a monochrome layout or one universal minimal style.

Use [natural Chinese review](../../rewrite-natural-prose/references/natural-chinese-review.md)
for editable copy. Strictly avoid unnecessary three-part rhetorical lists even when
joined by conjunctions. Do not append caveats already expressed by the content.

## Complete the important states

Fit the actual container, including a narrow message iframe. Check long CJK text,
missing images, empty content and the selected interactions. Keep useful error
recovery readable. Preserve meaningful differences between unavailable data and an
actual zero. Support focus and reduced motion; do not rely on hover or color alone.

The [official mobile guidance](https://www.awwwards.com/mobile-excellence-guidelines.pdf)
includes viewport fit, legible text, touch targets, contrast and performance. Use
the relevant principles with TW's current platform guidance; dated website/PWA checks
are not universal requirements for an embedded message frame.

## Review record and handoff

In the existing design record, retain the purpose, adopted direction and references
that influenced it. Keep the visual proposal with the author's decision when one
was needed. For each material issue, record the actual evidence, its effect and the
smallest coherent correction. Use the existing implementation and acceptance process.

Separate source review, rendered composition and interaction evidence. For embedded
cards, real SillyTavern checks and author aesthetic acceptance remain separate from
an offline preview. Mark unavailable evidence plainly. The standard is a default
requirement; individual catalog candidates remain proposed until adopted.
