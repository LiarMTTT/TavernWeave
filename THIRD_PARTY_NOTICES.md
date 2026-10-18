# Third-party notices

TavernWeave-authored instructions, metadata, and repository tooling are licensed under the repository's [PolyForm Noncommercial License 1.0.0](LICENSE). That license does not relicense independent upstream projects referenced for interoperability.

The `sillytavern-api-reference` skill contains newly authored navigation notes. It does not redistribute upstream source code, type declarations, command grammar, or license prose. Its pinned links are reproducible navigation snapshots retrieved on 2026-07-22, not claims about the latest versions; the user's installed runtime remains authoritative.

The seven 0.5.0 skills (`sillytavern-component-update`, `sillytavern-render-regex-pipeline`, `sillytavern-rolecard-security`, `sillytavern-database-rolecards`, `sillytavern-extension-dev`, `sillytavern-rolecard-performance`, and `sillytavern-media-live2d-runtime`) contain newly authored procedures, validators, and fixtures informed by the interoperability facts identified below. They do not vendor upstream source code, type declarations, private database material, or extension assets. Their offline schemas are validation contracts rather than claims that every installed runtime uses an identical export shape or performance profile.

## Soul Killer fan-reference boundary

“Cyberpunk 2077” and “Johnny Silverhand” identify third-party fictional material associated with CD PROJEKT and its licensors. TavernWeave is not affiliated with, endorsed by, or sponsored by CD PROJEKT, the game's publishers, or any actor. The `soul-killer-portable` mode contains newly authored TavernWeave frontend-review instructions and an explicitly disclosed fan-roleplay Easter egg. It does not redistribute game dialogue, scripts, lyrics, images, character likeness assets, voices, logos, fonts, music, UI captures, or other game assets, and it must not claim to impersonate a real actor.

## DeepSeek Harness interoperability

The `host-adapters/dsh` plugin bundle is newly authored TavernWeave code derived from public composition, package-bundle, Skill-provider and system-prompt interfaces in [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), which is distributed under the MIT License and was marked Developer Preview at the audited runtime version `0.2.1-rc.2` on 2026-10-18. TavernWeave does not vendor the DSH application, package source, official preset files, models, API credentials, or responses. Package names and configuration keys are used only for interoperability. The local [contract](host-adapters/dsh/dsh-plugin-contract.json) pins the audited runtime version and must be refreshed before any compatibility claim for another DSH build.

## SillyTavern interoperability sources

- **SillyTavern 1.18.0 snapshot** - [release page](https://github.com/SillyTavern/SillyTavern/releases/tag/1.18.0), [pinned commit `8172dcd0ee672d3cd9a5e5f7af134f91a45cd2b8`](https://github.com/SillyTavern/SillyTavern/commit/8172dcd0ee672d3cd9a5e5f7af134f91a45cd2b8), and [license at that commit](https://github.com/SillyTavern/SillyTavern/blob/8172dcd0ee672d3cd9a5e5f7af134f91a45cd2b8/LICENSE). Upstream license: AGPL-3.0.
- **SillyTavern UI extension contributor guide** - [official manifest and lifecycle documentation](https://docs.sillytavern.app/for-contributors/writing-extensions/), consulted 2026-08-08 for extension field and hook interoperability. The installed release remains authoritative.
- **JS-Slash-Runner / Tavern Helper 4.8.19** - [manifest](https://github.com/N0VI028/JS-Slash-Runner/blob/36d8889a99f1cf09d3d1f8aabd0eba33975dc64d/manifest.json), [pinned main commit `36d8889a99f1cf09d3d1f8aabd0eba33975dc64d`](https://github.com/N0VI028/JS-Slash-Runner/commit/36d8889a99f1cf09d3d1f8aabd0eba33975dc64d), and [license at that commit](https://github.com/N0VI028/JS-Slash-Runner/blob/36d8889a99f1cf09d3d1f8aabd0eba33975dc64d/LICENSE). Upstream license: AFPL-9; upstream explicitly identifies the repository as non-open-source.
- **ST-Prompt-Template 1.17.4.3** - [manifest](https://github.com/zonde306/ST-Prompt-Template/blob/ada54bb22e3dab0a07e473d383b4c2fe40bc6573/manifest.json), [pinned main commit `ada54bb22e3dab0a07e473d383b4c2fe40bc6573`](https://github.com/zonde306/ST-Prompt-Template/commit/ada54bb22e3dab0a07e473d383b4c2fe40bc6573), and [license at that commit](https://github.com/zonde306/ST-Prompt-Template/blob/ada54bb22e3dab0a07e473d383b4c2fe40bc6573/LICENSE). Upstream license: AGPL-3.0.
- **MagVarUpdate beta snapshot** - [pinned commit `b42817925d0391c15fa242a8238d2bbe28eb6319`](https://github.com/MagicalAstrogy/MagVarUpdate/commit/b42817925d0391c15fa242a8238d2bbe28eb6319) and [license at that commit](https://github.com/MagicalAstrogy/MagVarUpdate/blob/b42817925d0391c15fa242a8238d2bbe28eb6319/LICENSE). Upstream license: MIT. Its package version is not treated as a reliable extension-release identifier.

Only public facts needed to locate and distinguish these interoperability surfaces are summarized. Any future inclusion or adaptation of upstream material must be reviewed under that project's own license before release.

## TavernWeave Library snapshot

The `consult-tavernweave-library` skill includes an explicit public snapshot of two LiarMTTT-authored local knowledge sources:

- 32 ST development topic guides plus the public A0 harness checklist, distributed by the same copyright holder under TavernWeave's PolyForm Noncommercial license;
- AFV frontend-design and motion catalogs, directly linked concept Wiki pages, and owned technique sandboxes originally published by LiarMTTT under the MIT License. The AFV MIT notice is retained in `skills/consult-tavernweave-library/references/AFV-LICENSE.txt`.

Catalog entries may link to independent standards, libraries, products, demos, fonts, images, or source sites. TavernWeave records names, URLs, classification, and interoperability notes; it does not vendor those external projects, their paid examples, third-party fonts, images, or source code. An outbound catalog link is not a redistribution license or an adoption decision. Users must review the linked project's current terms before incorporating it into a card or product.

The public snapshot intentionally excludes the A1 driver master, archived command-era guidance, local evidence, AFV raw or inbox material, private profiles, credentials, and unrelated knowledge domains. File-level hashes and redaction counts are recorded in the library manifest.

## shadcn-tailwind-ui source review

The private source used as a design input carried inconsistent license metadata and unverified font assets. TavernWeave does not redistribute those fonts, coverage output, or unknown-license assets. Any retained third-party code must keep its original notice in the corresponding skill and is not relicensed by TavernWeave's repository-level license.

This notice must be updated before release whenever third-party text, code, or assets are added.

## Rolecard authoring integration candidate

The three-type architecture, character/player/stage/portrayal methods, variable-design
and worldbuilding/worldbook guidance
in this candidate was newly written for TavernWeave using the maintainer's explicit
task decisions and selected local Moyue workshop method documents as design inputs.
Those decisions include required greetings and worldbooks, normally empty legacy
prompt fields, player-confirmed world scale, structured prose and knowledge degrees,
character-entry activation conventions, keyword scan depth 2 and disabled recursion.
The character integration additionally separates player facts from portrayal permission,
stable foundations from state-selected differences, and observed feedback from
diagnostic hypotheses. Independent clarification is optional and does not create facts
or advance state. Current methods are not a mandatory revival of older palette or
three-face structures; effective inherited designs are preserved.
They are authoring conventions rather than claims that every SillyTavern version
requires the same content or exposes the same field names.

The source prompt corpus, workshop assistant persona, prompt-assembly macros, forced reasoning/output
wrappers, project scripts, bundled type declarations, runtime utilities, assets,
build/sync/pack tools and dependency environment are not redistributed by this
integration. Input references and hashes are recorded in the separate review
evidence. A local source file's presence does not establish a redistribution license
for its unrelated code or assets. Existing upstream licenses and runtime boundaries
remain unchanged.

## Opening, frontend and natural-prose method extension

This candidate adds newly written opening-style and small-piece authoring methods,
message content UI and MVU statusbar design guidance, author-facing assessment,
and natural Chinese review. Selected local Moyue methods and the maintainer's
Chinese prose requirements from an existing project were design inputs. No original
project setting, private decision log or full source corpus is redistributed.

The default Awwwards quality direction, proactive online design research, visual
proposal requirement, clean-page copy rules and strict restraint on rhetorical
three-part lists are explicit maintainer decisions for this integration. The
[Awwwards Self Aware score page](https://www.awwwards.com/sites/self-aware) provides
the published scoring dimensions; [mobile guidance](https://www.awwwards.com/mobile-excellence-guidelines.pdf)
provides relevant usability considerations. These outbound references do not imply
affiliation, an award, or inclusion of third-party site assets. Existing notices and
runtime responsibilities remain in effect.
