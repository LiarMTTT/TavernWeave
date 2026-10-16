# Card writing

## Contents

1. Identity fields
2. Greetings
3. Small creative pieces
4. Examples and plot guidance
5. CoT and narrative boundary
6. Prompt economy
7. Accurate titles and release descriptions

## 1. Identity fields

For newly authored cards, normally leave the traditional prompt fields below empty.
Use the worldbook as the main carrier of character, world, and portrayal material.
Keep format-required fields and identification metadata such as name, author, and
version. This is the current TW authoring default, not a claim that SillyTavern has
removed these fields.

| Field | Chinese interface label / location |
| --- | --- |
| `description` | 角色描述 |
| `personality` | 高级定义 → 角色设定摘要 |
| `scenario` | 高级定义 → 情景 |
| `mes_example` | 高级定义 → 对话示例 |
| `system_prompt` | 高级定义 → 提示词覆盖 → 主要提示词 |
| `post_history_instructions` | 高级定义 → 提示词覆盖 → 历史后置指令 |

These are interface labels, not additional file keys; translations and placement can
vary by host version. Use the target card format's actual fields. An explicit project
need may justify a populated field; record its purpose and check overlap with the
worldbook and preset instead of filling every box by habit.

For an inherited card, inspect what each populated field currently does before any
change. Do not clear, move, or duplicate effective material merely to apply the new
default. A migration must preserve its prompt behavior and the authorized scope.

## 2. Greetings

For the character material carried by the worldbook, use [character-design.md](character-design.md).
It covers confirmed foundations, living circumstances, disposition and optional
expression guidance without requiring four entries. Player facts and portrayal
permission use [player-profile-and-agency.md](player-profile-and-agency.md).

Every completed card requires a usable greeting and a substantive, bound worldbook.
Neither an empty field nor a placeholder satisfies the common core described in
[card-types-and-runtime-dependencies.md](card-types-and-runtime-dependencies.md).
Plans may leave these pending; a whole-card completion claim may not.

A greeting should establish:

- immediate situation and point of view;
- the user's actionable position;
- important constraints or choices;
- only the initialization markup required by the chosen opening strategy.

Alternate greetings should differ meaningfully and remain consistent with the same
card identity and worldbook. Do not use the first message to repeat the complete
character dossier or world encyclopedia. Validate each branch's initial situation and,
for MVU Zod or hybrid cards, hidden state separately. UI-only openings must still
provide the selected interactive entry and its intended starting conditions.

Check the player's scoped portrayal permission in every branch. Confirmed identity,
location or a supplied action can be referenced without inventing the player's next
speech, action, decision, inner thought, feeling or bodily reaction. Explicit limited
or delegated portrayal permits only its stated scope; an opening-only permission does
not carry into later play. Established objective effects may follow the agreed game
rules without inventing a subjective reaction. Leave a usable handoff; it need not be
a question or force other characters to stop acting.

Use [opening-strategies.md](opening-strategies.md) to turn a style preference into a
usable writing direction, draft within the existing authorization, and handle local
feedback. An already clear brief does not require a separate style-confirmation turn.

## 3. Small creative pieces

A card-local item, scene, event or relationship fragment can be a complete request.
Identify the requested piece and use the relevant confirmed material. With sufficient
scope or explicit creative delegation, produce it directly; unresolved details matter
only when their answers would substantially change the result.

Match structure to use:

| Piece | Useful structure when needed |
| --- | --- |
| Item | The distinguishing fact and the condition governing its use |
| Scene | The immediate situation with a usable point of entry |
| Event | What can bring it about and the consequences or choices it makes available |
| Relationship fragment | The established relationship and the requested difference |

These examples are not mandatory fields. Use a short passage for continuous material,
or a shallow structure where conditions need to be distinguished. Reuse a supplied
format that works. A request for a key that warms on rainy nights does not by itself
require an inventory system or a secret history.

Keep confirmed facts and creative proposals distinct under the existing authority.
Within delegated scope, make the permitted choices. Otherwise, a new mechanism that
materially changes the world needs its own decision. Do not restart the world-size
interview or require a whole-card inventory for an isolated piece; follow the existing
world-design decision process if the request actually expands into that work.

Deliver content that can be used on its own, with a meaningful name if useful. Split
pieces when they need independent use. Preserve the project's placeholders and
technical syntax. Do not force a draft/confirmation/final sequence, an XML wrapper,
or a request to hide conversation floors.

A chat draft does not automatically become a worldbook entry, persistent variable,
or frontend component. If that function is needed, identify the requirement and use
the existing owner.
Chinese prose follows the [natural Chinese review](../../rewrite-natural-prose/references/natural-chinese-review.md).

## 4. Examples and plot guidance

When examples are useful, place them in the appropriate worldbook material by
default; their usefulness does not require populating `mes_example`. Use them to
demonstrate voice, interaction rhythm, and formatting, not to hard-code future plot
outcomes. Plot guidance should express priorities and boundaries without duplicating
variable rules.

Choice menus are optional. Choose complete sendable sentences or atmospheric fragments based on the product experience; do not impose one house style on every card.

For non-character mechanics, maps and optional event planning, use
[world-mechanics-and-scenarios.md](world-mechanics-and-scenarios.md). Its example connects
world causes to action costs and directed travel without making a planned event happen
merely because its outline is present.

## 5. CoT and narrative boundary

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

## 6. Prompt economy

- Put only content needed by the receiving model in the worldbook body. Keep the
  author's reasoning and configuration in their corresponding maintenance records.
- Keep always-on instructions limited to facts needed every turn.
- Trigger detailed setting entries by key, condition, or event where supported.
- Remove developer commentary and incident history from model-visible text.
- Avoid Markdown decoration that consumes tokens without adding structure for the target parser.
- Audit repeated rules across card fields, custom CoT, lorebook, preset, variable
  prompts, and scripts.

## 7. Accurate titles and release descriptions

When the user asks for a title, introduction or release copy, start from the current
artifact and its acceptance evidence. Connect each experience claim to something a
player can actually use. Identify the playable boundary and any required runtime
dependency that changes how the player can start. A planned feature stays labelled
planned; an unverified capability cannot become a tested selling point.

An optional structure is title → actual playable experience → relevant tags and
important requirements. Reuse a format the destination requires, but do not impose a
minimum number of titles, tags or characters. Tags describe present content; they are
not promises of a larger world or additional mechanics. Keep material limitations
visible without burying the introduction in author-only test history.

For the invented crossing example, suppose source and actual play evidence support
the crossing choices, while an interactive map has only been proposed. Suitable copy:
“石渡：岚河涨水，旧桥封了。乘船去北港要用一张船票，沿青岑高地绕行要多花时间；你也可以先停在南岸。
标签：文字探索、路线选择。” Do not advertise an interactive map, automatic save rollback,
an open-world campaign or a completed live test from that evidence. If only the design
exists, describe it as a design preview instead of a playable release.

Review title, introduction and tags against the same delivered version. Drafting
release copy does not publish, upload or install anything; those actions retain their
existing authorization and delivery gates.
