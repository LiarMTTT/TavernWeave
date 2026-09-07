# Retrofit and text cards

## Contents

1. Retrofit scan
2. Minimal MVU retrofit
3. Text-card protocol
4. Preservation checks
5. Inherited cards: continuation and derivative work

## 1. Retrofit scan

Before changing an existing card, inventory:

- voice and narrative anchors;
- greetings and alternate branches;
- existing state-like conventions in prose;
- lorebook routing and optional content;
- regex, scripts, UI, and external dependencies;
- packaged artifacts versus maintained sources.

Preserve the original experience unless the user explicitly requests redesign.

## 2. Minimal MVU retrofit

Start with the smallest state that unlocks the requested behavior. Add schema, shared initialization, update rules, and model projection as one complete chain. Do not variable-ize every noun merely because MVU is available.

## 3. Text-card protocol

A text card can maintain continuity with a compact, explicit state block that the model updates in prose. Define:

- stable delimiters;
- required and optional fields;
- carry-forward behavior;
- summary/archival rules;
- how regex displays without deleting model-visible state.

Do not introduce a variable runtime when the user wants a portable text-only card.

## 4. Preservation checks

Compare before and after:

- identity and tone;
- opening semantics;
- lorebook activation;
- token footprint;
- runtime dependencies;
- import/export behavior.

## 5. Inherited cards: continuation and derivative work

Treat taking over a card as an independent starting path, including users who have only a PNG or JSON package:

1. Inspect the supplied files and actual dependencies. Explain who the card is about, its main play loop, openings, UI, runtime requirements and known problems. Record missing material; extracted card data is a working source, not evidence of the original author's missing repository.
2. Establish whether the user wants to continue the original direction or create a derivative. Ask only the decisions still open: what must stay, what should change, and which change matters first. Do not infer a redesign mandate from “二创”.
3. Preserve the original and work on a traceable copy under the project's authorized path. Record which files are received originals, extracted working data, maintained sources and test exports. Use component extraction and pipeline skills only for their actual operations and permissions.
4. Explain a small first change, its effect and the tradeoff. When the user is unsure, recommend one or two directions grounded in the inspected card. Continue after their creative choice without repeatedly asking the same questions.
5. Compare new behavior and preserved behavior. For old chats, variables or saves, explain whether the change affects only new starts, requires migration, or still needs testing. Do not reset existing progress or test imports over the sole original card.
6. Guide one actual trial: where to import/open, what to do, what should appear, and what evidence to bring back if it fails. Record local checks separately from observed SillyTavern use.
7. After the first result, help the user request and complete one further modification within their scope. If a failure appears, explain the known cause versus uncertainty and recover from the preserved copy; do not discard the accepted creative decisions.

For ongoing maintenance, reuse [creative-authority.md](creative-authority.md) and the existing continuation record. Keep the creator's guidance level in the client preference, not in card data or story prompts.
