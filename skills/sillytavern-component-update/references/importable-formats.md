# Importable component formats

These shapes follow the pinned TavernWeave interoperability evidence. Re-check the
installed SillyTavern and Tavern Helper versions before claiming exact compatibility.

## Character-local regex

Use the card `RegexScriptData` shape for an importable character-local regex:

```text
id, scriptName, findRegex, replaceString, trimStrings, placement,
disabled, markdownOnly, promptOnly, runOnEdit, substituteRegex,
minDepth, maxDepth
```

Require string IDs and names, string find and replacement values, an array of numeric
placement codes, booleans for flags, and numeric or null depth bounds. Do not invent
the meaning of a numeric placement code; pin it from the target runtime or a verified
export fixture.

## Tavern Helper script

Use:

```text
type: "script"
enabled: boolean
name: string
id: string
content: string
info: string
button: { enabled: boolean, buttons: [{ name: string, visible: boolean }] }
data: object
export_with: { data: boolean, button: boolean }
```

Keep script content as a literal UTF-8 string. Preserve `data`, buttons, author info,
and export policy even when the requested code change touches only `content`.

## Tavern Helper folder

Use:

```text
type: "folder"
enabled: boolean
name: string
id: string
icon: string
color: string
scripts: Script[]
```

Require unique folder and child-script IDs. A folder contains scripts, not nested
folders, under the pinned interface.

## API versus import dialect

Tavern Helper's runtime regex API exposes a snake-case `TavernRegex` shape with
`source`, `destination`, and nullable depth fields. Character-card extension JSON
uses the camel-case shape above. Preserve the source dialect unless an explicit,
tested conversion is requested.

Use `sillytavern-render-regex-pipeline` to validate regex semantics. Use
`sillytavern-api-reference` to verify exact installed signatures and import behavior.
