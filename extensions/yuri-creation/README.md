# Yuri Card Creator 0.2.0

Create an original yuri character card through conversation. Your agent chooses unspecified details, writes a playable opening and worldbook, and prepares a JSON card for SillyTavern.

[中文说明](README.zh-CN.md)

## Start

Open this folder with an agent that can read and write files, then say:

```text
Use yuri-card-creator to create an original yuri character card for me.
Decide the unspecified details yourself and give me a complete first draft.
Use my saved preferences and handle the files; I will give feedback here.
```

No reference text or image is needed. The starting main cast consists of adult women, including author-defined virtual and nonhuman women. You retain control of your player character's current actions and replies.

The agent creates a final card, a worldbook and an original-creation record. Import the final JSON—or a PNG packaged with your chosen avatar—into SillyTavern and discuss revisions in the conversation. The worldbook is embedded in the card.

## What this checkpoint provides

- One original-creation skill, with English core instructions and English/Chinese interaction catalogs.
- The three saved genre preferences, reused without a required interview.
- A thin build helper and the unchanged, attributed Foreverse exporter.
- An optional pinned TavernWeave authoring-file bridge. The card can also be created in reported standalone mode.

This is a portable project checkpoint, not a native host plugin installation. Ask your agent to research a factual setting, review an image, or package the card with a chosen PNG avatar. Research and image creation use tools available in your current workspace; they are optional. Native host installation is not included.

Custom preference modes beyond this checkpoint’s adult main-cast defaults are deferred; loading a saved profile does not establish full compatibility.

[Licensing boundary](LICENSE_BOUNDARY.md) · [Integration notes](INTEGRATION.md) · [MIT license for new files](LICENSE)
