# Third-party notices

TavernWeave-authored instructions, metadata, and repository tooling are licensed under the repository's [PolyForm Noncommercial License 1.0.0](LICENSE). That license does not relicense independent upstream projects referenced for interoperability.

The `sillytavern-api-reference` skill contains newly authored navigation notes. It does not redistribute upstream source code, type declarations, command grammar, or license prose. Its pinned links are reproducible navigation snapshots retrieved on 2026-07-22, not claims about the latest versions; the user's installed runtime remains authoritative.

## SillyTavern interoperability sources

- **SillyTavern 1.18.0 snapshot** - [release page](https://github.com/SillyTavern/SillyTavern/releases/tag/1.18.0), [pinned commit `8172dcd0ee672d3cd9a5e5f7af134f91a45cd2b8`](https://github.com/SillyTavern/SillyTavern/commit/8172dcd0ee672d3cd9a5e5f7af134f91a45cd2b8), and [license at that commit](https://github.com/SillyTavern/SillyTavern/blob/8172dcd0ee672d3cd9a5e5f7af134f91a45cd2b8/LICENSE). Upstream license: AGPL-3.0.
- **JS-Slash-Runner / Tavern Helper 4.8.19** - [manifest](https://github.com/N0VI028/JS-Slash-Runner/blob/36d8889a99f1cf09d3d1f8aabd0eba33975dc64d/manifest.json), [pinned main commit `36d8889a99f1cf09d3d1f8aabd0eba33975dc64d`](https://github.com/N0VI028/JS-Slash-Runner/commit/36d8889a99f1cf09d3d1f8aabd0eba33975dc64d), and [license at that commit](https://github.com/N0VI028/JS-Slash-Runner/blob/36d8889a99f1cf09d3d1f8aabd0eba33975dc64d/LICENSE). Upstream license: AFPL-9; upstream explicitly identifies the repository as non-open-source.
- **ST-Prompt-Template 1.17.4.3** - [manifest](https://github.com/zonde306/ST-Prompt-Template/blob/ada54bb22e3dab0a07e473d383b4c2fe40bc6573/manifest.json), [pinned main commit `ada54bb22e3dab0a07e473d383b4c2fe40bc6573`](https://github.com/zonde306/ST-Prompt-Template/commit/ada54bb22e3dab0a07e473d383b4c2fe40bc6573), and [license at that commit](https://github.com/zonde306/ST-Prompt-Template/blob/ada54bb22e3dab0a07e473d383b4c2fe40bc6573/LICENSE). Upstream license: AGPL-3.0.
- **MagVarUpdate beta snapshot** - [pinned commit `b42817925d0391c15fa242a8238d2bbe28eb6319`](https://github.com/MagicalAstrogy/MagVarUpdate/commit/b42817925d0391c15fa242a8238d2bbe28eb6319) and [license at that commit](https://github.com/MagicalAstrogy/MagVarUpdate/blob/b42817925d0391c15fa242a8238d2bbe28eb6319/LICENSE). Upstream license: MIT. Its package version is not treated as a reliable extension-release identifier.

Only public facts needed to locate and distinguish these interoperability surfaces are summarized. Any future inclusion or adaptation of upstream material must be reviewed under that project's own license before release.

## shadcn-tailwind-ui source review

The private source used as a design input carried inconsistent license metadata and unverified font assets. TavernWeave does not redistribute those fonts, coverage output, or unknown-license assets. Any retained third-party code must keep its original notice in the corresponding skill and is not relicensed by TavernWeave's repository-level license.

This notice must be updated before release whenever third-party text, code, or assets are added.
