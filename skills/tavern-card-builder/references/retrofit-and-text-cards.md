# Retrofit and text cards

## Contents

1. Retrofit scan
2. Minimal MVU retrofit
3. Text-card protocol
4. Preservation checks

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
