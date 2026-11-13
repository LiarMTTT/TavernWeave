# Name review during yuri creation and adaptation

This is an agent judgment and conversation workflow, not a gender classifier or a list of names forbidden for women. Apply it when preserving a supplied character name or reviewing a changed portrayal. It is shared by the current original and post entry points and is intended for reuse by the future inherited-card adapter. It does not implement that adapter.

## Evaluate in context

1. Identify the actual character name and its owner. Source labels such as “friend”, “poster” and “narrator” are not names. Keep the player bound to `{{user}}`; preserve a supplied player persona and never rename the real user.
2. Consider the name together with the character's culture, language, era, setting, self-presentation and the user's wishes. A unisex name, a masculine-sounding name, an alias or a nonhuman designation can fit an author-defined woman. Avoid assuming that women need soft or conventionally feminine names. If the name is unfamiliar, mark the uncertainty rather than invent an etymology or cultural rule; use available research only if it would help the decision.
3. Preserve a name that fits or was explicitly chosen/confirmed by the user. Do not reopen a settled choice on every revision. When no name was supplied and ordinary creative choices are delegated, invent an appropriate name and record it as a creative choice without a new interview.

## Offer a choice only when useful

When the current name plausibly conflicts with the intended portrayal, explain the specific reason briefly and offer two or three alternatives with distinct, short rationales, plus keeping the original. Use the user's language. These conditional name choices are separate from the three saved genre defaults; do not change those defaults.

For example, in Chinese: “这个名字与目前设定的年代和地域不太协调。我建议 A（保留原名的音感）或 B（更贴近故事背景）；也可以保留原名。你选定前，草稿先沿用原名。” Use actual names and evidence-based reasons rather than these placeholders. For English interaction, present the same choice naturally in English.

Keep the current name in a provisional draft while awaiting a choice. Do not silently replace it, mark a suggestion as user-approved, or block the rest of drafting. If the user explicitly delegates renaming, choose within that authorization and explain the choice; another approval is unnecessary.

## Apply a chosen name consistently

- Keep source text, quotations, source names and stable record IDs unchanged. Record the original name, selected output name, reason, alternatives and the actual user instruction in the adaptation decision or original creation choices. The agent maintains this record; do not ask the user to fill a form.
- For the source route, use an `identity` decision linked to the character's record ID and affected `field_sources`. For the original route, keep `creation.json` cast names and `creative_choices` consistent with the draft.
- Update the NPC card name, prose, greetings, dialogue and worldbook titles/keys/content where they refer to this character. Keep an old name as a deliberate alias only when useful and explain its purpose. Do not accidentally rename a different character with a similar name.
- Inspect structured fields before changing them. Do not globally replace text in IDs, URLs, regular expressions, scripts, variable paths or unknown extension settings. A future inherited-card route must preserve unrelated metadata and configuration.
- If the draft changes after a source plan was prepared, generate a fresh bound plan and carry over the reviewed decisions. Rebuild to a new output path after the choice. Do not claim import or roleplay validation from the rename alone.
