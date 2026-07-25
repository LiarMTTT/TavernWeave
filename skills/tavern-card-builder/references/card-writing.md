# Card writing

## Contents

1. Identity fields
2. Greetings
3. Examples and plot guidance
4. CoT and narrative boundary
5. Prompt economy

## 1. Identity fields

Use each target card field according to the installed card format and project convention. Do not apply a universal rule that every system card must leave the same five fields empty.

Keep stable identity and behavioral anchors in the least fragile layer. Move large optional setting material to lorebook entries. Keep runtime instructions out of narrative identity fields unless the runtime explicitly consumes them there.

## 2. Greetings

A greeting should establish:

- immediate situation and point of view;
- the user's actionable position;
- important constraints or choices;
- only the initialization markup required by the chosen opening strategy.

Alternate greetings should differ meaningfully and remain consistent with the same card identity. Validate each branch's hidden state separately.

## 3. Examples and plot guidance

Use examples to demonstrate voice, interaction rhythm, and formatting, not to hard-code future plot outcomes. Plot guidance should express priorities and boundaries without duplicating variable rules.

Choice menus are optional. Choose complete sendable sentences or atmospheric fragments based on the product experience; do not impose one house style on every card.

## 4. CoT and narrative boundary

Custom CoT is an author-written decision protocol. Card prose supplies identity,
voice, relationships, and narrative facts; it should not duplicate the preset's
complete CoT.

- Visible character thoughts are narrative content. They may appear when the point of
  view and style allow, but they do not prove that a system judgment ran.
- System checks, candidate actions, scores, and step labels stay out of the final
  prose unless the product explicitly exposes a compact result field.
- A card-specific CoT should contain only additions to the preset main CoT: unique
  knowledge limits, behavior conditions, exceptions, or card-only output rules.
- Examples may demonstrate voice or structure but must not become a fixed answer that
  the model copies whenever the CoT runs.
- A text card can use custom CoT without MVU, schemas, update blocks, or scripts.

Read [cot-design-and-authoring.md](cot-design-and-authoring.md) when deciding whether a
rule belongs in the preset, card increment, conditional worldbook, or final prose.

## 5. Prompt economy

- Keep always-on instructions limited to facts needed every turn.
- Trigger detailed setting entries by key, condition, or event where supported.
- Remove developer commentary and incident history from model-visible text.
- Avoid Markdown decoration that consumes tokens without adding structure for the target parser.
- Audit repeated rules across card fields, custom CoT, lorebook, preset, variable
  prompts, and scripts.
