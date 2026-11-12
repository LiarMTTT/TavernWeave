# Inherited files and protected edits

## Identify ownership before editing

Run `python extensions/yuri-creation/scripts/card_file.py inventory --folder <materialized-folder>`. Its labels are candidates, not a determination of authorship or card relationships. The agent reads only the needed parts and retains a private component map with each selected primary card, version, supporting files, conflicting/overlapping parts and the reason for adopting them.

| Input | Treatment |
| --- | --- |
| JSON/PNG | Inspect actual card metadata; each primary card gets its own private session |
| Several versions | Compare before selecting; retain superseded versions, do not mix their configurations |
| Related or independent cards | Keep separate unless shared-authority editing was requested; do not infer links from co-location |
| Split settings, openings, HTML/JS/CSS, worldbooks | Keep component boundaries and source paths; inspect overlap before choosing authority; never execute the supplied code |
| TXT/Markdown, DOCX or native Docs components | Read/export with available host tools into the private workspace; do not pretend they are losslessly decoded JSON cards. Use upstream inherited authoring for text-only assembly |
| JPG/JPEG/reference PNG | Preserve as reference art; no repainting or automatic embedding |
| Novel TXT/EPUB | Use novel-excerpt-to-yuri-card with an explicit chapter/excerpt scope |

Folder discovery does not resolve conflicting versions automatically. Ask in the conversation only when existing context cannot determine a consequential choice. Keep source/component text private, and do not reuse excluded cases.

## Container operations

```text
python extensions/yuri-creation/scripts/card_file.py open --input <card.png-or-json> --project <new-private-project>
python extensions/yuri-creation/scripts/card_file.py apply --project <project> --plan <project/edit-plan.json> --output <new-result-directory>
```

`open` supports wrapped character-card v2/v3, unwrapped legacy JSON and standalone JSON worldbooks. PNG decoding reads base64 card payloads from tEXt, zTXt and iTXt, with chunk bounds/CRC and bounded inflation. Conflicting duplicate keywords fail. All original payloads remain separate documents; identical duplicates are kept. No schema projection or default insertion occurs.

The 64 MiB input/metadata byte budget can be raised explicitly with `open --max-mib N`. It is a memory guard, not a character limit or silent truncation. Source bytes and decoded document fingerprints bind the session and plan. Editing documents.json directly is rejected; originals remain the authority.

## Agent-maintained plan

The generated plan already contains source/document hashes. Fill `changes` with objects such as:

```json
{
  "document": "chara",
  "path": "/data/description",
  "before": "the exact original string",
  "after": "the revised string",
  "reason": "Describe the specific authorized portrayal change."
}
```

Document IDs are `json` for JSON, and the actual `chara`/`ccv3` keywords for PNG. Paths are standard JSON pointers. Include separate changes for existing chara/ccv3 counterparts and matching top-level/data mirrors; stale values or divergent counterparts fail before output. The plan is a new edition against the frozen source, not a sequence of blind global replacements.

Allowed replacements are existing character prose fields, greeting strings/lists, and worldbook entry content/title/keyword lists. Entries may be arrays or native worldbook objects. Settings such as IDs, uid, depth, position, order, probability, recursion, enabled, selective logic, extensions and unknown fields are protected. Whole-entry/book replacements, additions, removals and config/script edits are outside this adapter. Fenced code and script/style blocks inside prose must survive verbatim.

Add `decisions` with `kind` (`identity`, `relationship`, `name`, `invention`, `preserved`) and a specific `summary`. Record source paths, targets, changed circumstances and user naming choices there when relevant. Finish `agent_review: {completed: true, notes: [...]}` only after reviewing the actual proposed prose and preserved scope. Neither review flags nor hashes prove semantic quality or the truth of reported source material.

`apply` writes a new `character.png` or `character.json`, each decoded payload JSON, exact embedded/standalone worldbook snapshots and `adaptation-record.json`. Unlisted JSON values survive unchanged; JSON whitespace may change. PNG image and unrelated metadata chunks remain byte-identical. Changed card metadata is written as standard tEXt using the existing Foreverse chunk writer; no new image is drawn. A no-change copy retains the source bytes exactly. Worldbook snapshots preserve their source dialect; no untested cross-dialect migration is implied.
