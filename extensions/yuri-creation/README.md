# Yuri Card Workbench 1.2.0

Create yuri roleplay cards through conversation, adapt an existing card, or turn a post or novel excerpt into a new story. Your agent handles the files; you review and revise in the conversation.

This is a specialized Yuri product distribution built on TavernWeave: a retained general-purpose ecosystem, a domain-specific extension, shared execution contracts and native-host integration. Its focus is Yuri adaptation across different source media.

[中文说明](README.zh-CN.md)

## Install

Use the distribution for your host:

| Host | Distribution | Installation |
| --- | --- | --- |
| Codex / ChatGPT Work | `yuri-plugin` | Import and enable `tavernweave-yuri` as a plugin |
| DeepSeek Harness | `DSH-plugin` / release `.tgz` | Install the DSH bundle, then select its Yuri Workbench preset |
| Gemini CLI | `main` or `Gemini-plugin` | Install the complete extension; bundled skills are discovered automatically |
| Gemini Task mode | `Gemini-plugin` | Import the four skills individually and retain the complete shared folder |

See [installation and host limits](docs/NATIVE_HOSTS.md) for the Gemini CLI extension command and Task mode fallback. Gemini CLI extension import and skill discovery passed the user's test. The agent loads canonical workflows and dependencies as needed. File tools, Python and Node must be available for export.

## Choose your starting point

Open this folder with an agent that can read and write files. Give it your material, then use one of these requests:

| Starting point | What to say |
| --- | --- |
| An idea, or no idea yet | “Create an original yuri card for me. Decide the unspecified details and give me a complete first draft.” |
| An existing JSON or PNG card | “Adapt this card into a yuri story. Preserve its artwork, scripts and unrelated worldbook settings.” |
| A post | “Adapt this post into a yuri card. Keep the poster as {{user}} and distinguish source facts from new story choices.” |
| A TXT, Markdown or EPUB novel | “Use this chapter or scene to create a yuri card. If I have not chosen a scope, start with one short chapter.” |

Ask the agent to read the matching workflow in this folder. No manual Markdown or JSON worksheet is required. For a folder containing several cards, versions or supporting components, the agent identifies what belongs together before editing.

## Review and import

The agent presents a playable opening, characters and a worldbook. Tell it what you want changed directly in the conversation. The default main cast consists of adult women, including author-defined virtual and nonhuman women; background identities are preserved. Your player character's current actions, thoughts and replies remain yours.

You can change the character scope, exclude individuals, preserve relationship outcomes, request specific pairings, or supply custom criteria in conversation. The agent saves and checks those preferences across all four workflows; unsupported choices receive an explicit explanation. See [supported custom profiles](references/custom-profiles.md).

If a retained name seems out of place, the agent explains why and suggests alternatives. You may keep the original or choose a new name; masculine-sounding names are not automatically replaced.

When you choose to replace existing art, the agent inspects its actual visual style and combines that with the revised card’s narrative direction in an image prompt. It generates and inspects a candidate using available image tools, then shows it for your review before embedding. The original stays available. See [image adaptation](references/image-adaptation.md).

Import the final JSON or character-card PNG into SillyTavern. Its worldbook is already embedded. The agent identifies the final file and keeps source records and adaptation notes separately. When editing an existing card, the original file stays untouched and unrelated fields, code and worldbook loading settings are preserved.

Large novels do not need to fit into one conversation message. The agent can select chapters or an explicit excerpt, keep track of the source, and continue in stages. It does not silently trim your input or claim to have read unselected chapters.

## Inside the folder

| Workflow | Purpose |
| --- | --- |
| yuri-card-creator | Original creation without references |
| adapt-yuri-card | Protected editing of inherited JSON/PNG cards and worldbooks |
| post-to-yuri-card | Adaptation from a supplied post |
| novel-excerpt-to-yuri-card | Adaptation from selected TXT/Markdown/EPUB prose |

Research, image inspection and optional artwork creation use tools available in your agent's workspace. A text-only card is complete on its own. The native package exposes these workflows; account installation and available tools still depend on your host. The protected editor keeps the original schema; structural migration or script changes require a separately scoped operation. Text-only/DOCS components use available host reading/export tools and upstream authoring rather than JSON round-tripping.

[Licensing](LICENSE_BOUNDARY.md) · [Integration and supported scope](INTEGRATION.md)

Four canonical Yuri workflows are exposed through four portable/Gemini discovery wrappers; DSH registers the canonical procedures directly. With 23 upstream dependency entries, each host exposes 27 discoverable entries. Internal implementation modules and canonical files behind wrappers are not additional entries. See [architecture and counting](docs/ARCHITECTURE.md).

The currently integrated TavernWeave commit is its v2.4.0 release. Updates follow an explicit [upstream review and synchronization procedure](docs/UPSTREAM_SYNC.md), rather than automatic moving-branch adoption.
