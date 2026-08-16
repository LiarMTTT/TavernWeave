# Memory architecture boundary

Do not call every persistent-looking value “memory”. Separate four stores by owner, lifetime, retrieval, and deletion behavior.

| Store | Holds | Primary owner | Typical lifetime | Must not replace |
| --- | --- | --- | --- | --- |
| Fixed knowledge | Stable world and character facts | card/worldbook source | release version | current gameplay state |
| MVU state | deterministic current variables | message/chat variable protocol | chat branch | semantic long-term recall |
| Narrative recall | selected prior events and relationships | project-selected retrieval layer | project policy | canonical setting authority |
| Creator profile | approved working preferences and method | private user adapter | user-controlled | card facts or permissions |

## Design contract

For each store declare:

- data classes and forbidden data;
- canonical writer and readers;
- scope key such as project, character, chat, branch, or user;
- retention, deletion, export, and conflict policy;
- retrieval trigger and prompt budget;
- fallback when unavailable;
- version-sensitive API surface and evidence source.

The creator profile may influence explanation, workflow pacing, and proposal style. It cannot silently change confirmed card facts, grant write or production permission, or enter a public package. Narrative retrieval may suggest relevant events but cannot overrule the creative authority.

## First-version boundary

TavernWeave v1 provides this design and routing contract only. It does not ship a vector database, embedding service, cloud synchronization, cross-thread identity store, or automatic private-profile writeback. Route exact SillyTavern/Tavern Helper storage and retrieval APIs to `$sillytavern-api-reference`, and require versioned evidence before implementation.
