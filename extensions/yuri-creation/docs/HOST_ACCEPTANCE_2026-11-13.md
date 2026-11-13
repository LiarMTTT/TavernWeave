# Host acceptance and official release — 2026-11-13

The user authorizes integration and official GitHub publication. Reports below are user-supplied acceptance evidence; they were not rerun by the release agent. No private cards, withdrawn cases or Drive trash are used.

| Host | Accepted source | Reported result | Limits |
| --- | --- | --- | --- |
| Codex | yuri-plugin 0.5.0, generated commit 53a28d6 | Four wrappers and canonical entries loaded; file reads, Python 3.12.10, Node 24.13.1, UI files and dependency pins verified | Report explicitly excludes writes, card generation and a new SillyTavern trial |
| ChatGPT Work | yuri-plugin 0.5.0 | User confirms import and skill verification passed | The detailed local Windows probe is Codex evidence; do not attribute its exact runtime versions to the browser workspace |
| DeepSeek Harness | DSH-plugin 785123b, package 0.5.0 | Import/discovery passed; contract records desktop DSH 0.2.2-rc.1, four yuri skills and 23 base skills, bundled source and runtime probe | Version-bound acceptance; UI icon, disable/uninstall, Linux/WSL and live SillyTavern are not newly verified |
| Gemini CLI | Gemini-plugin fb182b4, package 0.5.0 | User confirms individual skill imports and verification passed | Plugin import unavailable in the accepted environment; no automatic plugin-wide handoff |
| Gemini Task mode | Gemini-plugin fb182b4, package 0.5.0 | User confirms individual skill imports and verification passed | Same per-skill import and explicit dependency-loading limit |

## Integration

DSH source commits e116a4f and 785123b are retained as source-compatible integration changes. Gemini is a generated distribution descended from yuri-plugin, so only its adapter delta is brought into maintained templates. The release corrects two receipt/documentation inaccuracies: the supplied Gemini receipt named an older source commit, and it referred to a root SKILL.md that was absent. New generated receipts record the actual immutable source commit; the four real wrappers remain the entry points.

The original 0.5.0 canonical workflows/runtime and 23 base skills remain unchanged. Previously accepted original/post SillyTavern trials and the bounded PNG/EPUB checks retain their original scope. This release does not claim new narrative-quality, conversion or roleplay results. Gemini optional extension/context/agent descriptors are retained without claiming plugin approval or automatic loading.

## Release verification

One GPT-6 Luna package-only check covers generated portable/Gemini layouts, DSH packing, source/receipt hashes, retained notices and dependency paths. Its receipt is `docs/RELEASE_PACKAGE_CHECK_2026-11-13.json`. It does not repeat host installation, card conversion, name-choice behavior or old test suites.

## Follow-up: Gemini CLI extension acceptance

On 2026-11-13 the user re-imported `Gemini-plugin` as a Gemini CLI extension using the official [extension guide](https://geminicli.com/docs/extensions/writing-extensions/) and confirmed that all skills were identified correctly. The available branch at review was 9c7ace2b12d5b97f9f142c7df850bfd0ef7d6944. This supersedes the earlier Gemini CLI per-skill-only limitation recorded above. It does not change the Gemini Task mode report or establish new card conversion/roleplay acceptance.

The source integration preserves main's scripts, tests, examples and other host adapters, while bringing in the extension manifest, context and four native entry wrappers. The unchanged 23-skill dependency tree remains separately pinned. Canonical Yuri authoring/conversion workflows are unchanged. Current instructions are in NATIVE_HOSTS.md; the 0.5.0 release tag and its existing attachments remain the original published snapshot.
