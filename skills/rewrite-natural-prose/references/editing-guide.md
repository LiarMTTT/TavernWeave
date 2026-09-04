# Editing decisions

## Read the prose as prose

Identify what the reader needs, the passage's voice, and its factual or fictional commitments. Preserve purposeful formality, restraint, ambiguity, humor and rhythm. Fix the places that obstruct those aims; do not force every passage into short sentences or casual speech.

- Explanations and reports: lead with the useful result, replace abstract praise with the actual action, consolidate repeated conclusions, and retain evidence and qualifications. Required report sections remain present.
- Narrative: remove stock emotional labels when the existing passage already supplies the emotion through action. Do not invent an action to replace a label. Preserve viewpoint, chronology and the narrator's distance.
- Dialogue: preserve each character's vocabulary, social distance, knowledge and intention. Do not make every character equally witty, blunt or eloquent.
- Character settings and worldbooks: keep explicit facts and playable constraints easy to recover. Tighten redundancies without merging different conditions or changing who knows what.
- Instructions and prompts: preserve the distinction between must, may and must not, and preserve conditions, exceptions and model responsibilities.

## Mixed-content edits

Identify the maintained source rather than editing a generated export by accident. Record allowed prose fields or spans and preserve everything else. Macros such as `{{user}}`, variable paths such as `stat_data.player.hp`, EJS such as `<%= name %>`, regex syntax, JSON keys, IDs and code are technical content, not word choices. Changing text inside code or machine fields requires that exact field to be part of the user's request.

Use existing format tooling for edits to JSON, YAML, HTML or a card component. Compare protected values and the parsed structure before and after, including key/type preservation and intended field differences. A literal scan cannot prove semantic preservation; review numbers, negation, causal relationships and uncertainty separately. Keep quoted material exact unless the user explicitly asks to rewrite the quote itself.

## Illustrative decisions, not mandatory substitutions

Original: “本功能旨在通过对文本进行深度优化，有效提升表达的自然度与可读性。”

Light: “本功能会优化文本，让表达更自然、更易读。”

Original: “必须先保存记录，失败时不得切换页面。”

Safe refinement: “先保存记录；保存失败时，必须停留在当前页面。”

The second passage remains a requirement. Replacing “必须” with “建议”, deleting the failure condition, or inventing a successful save would change its meaning.
