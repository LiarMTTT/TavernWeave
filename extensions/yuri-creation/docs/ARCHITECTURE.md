# Product architecture and counting

Yuri Card Workbench / TavernWeave-Yuri is a specialized product distribution
built on TavernWeave. It retains the general-purpose upstream ecosystem and adds
a Yuri domain layer, shared execution contracts, source provenance, protected
file operations and native-host composition. GitHub's fork relationship describes
repository ancestry; it does not fully describe this product's responsibilities.

| Layer | Authority and responsibility |
| --- | --- |
| Pinned TavernWeave base | General authoring, source-library, routing, prompt specifications, UI/runtime specialists, shared scripts and host resources; original terms/notices retained |
| Canonical Yuri workflows | Four procedures under `extensions/yuri-creation/skills/`: original conversation, inherited cards, supplied posts and selected novel excerpts |
| Shared implementation/contracts | `shared/`, `scripts/`, profiles, evidence/receipt bindings, guarded edits, TXT/EPUB selection and image-review guidance; these are not separately discoverable skills |
| Discovery and host adapters | Portable/Gemini wrappers bind canonical procedures; DSH providers register canonical workflows directly. Native registration is distinct from resource presence |
| Distributions and releases | Committed-source builders generate complete host packages and immutable source/tree receipts, tags and checksums; the user reviews final cards/images in conversation |

The domain value is Yuri adaptation with causal relationships, independent
characters and preserved player agency, not replacing TavernWeave with another
general-purpose card engine. Use existing specialists first. Host image/search
tools supply optional capabilities; packaging does not install a model service.
Unknown card fields, scripts and worldbook configuration remain protected.

## Counting units for this release

| Unit | Source / portable / Gemini | DSH bundle | What the number means |
| --- | --- | --- | --- |
| Canonical Yuri workflows | 4 | 4 | Four maintained procedures, counted once each |
| Yuri discovery wrappers | 4 | 0 | Portable/Gemini root aliases; DSH uses providers directly |
| Upstream dependency entries | 23 | 23 | Retained general-purpose skill entries at the reviewed baseline |
| Packaged discoverable entries | 27 | 27 | Four exposed Yuri procedures plus 23 dependencies |
| Internal implementation modules | Not added to entry totals | Not added to entry totals | Python/JS helpers, schemas, references and serializers; file totals are a separate measure |

Do not add the four canonical files to their four wrapper aliases to claim 31
discoverable skills. Do not call this “three extra skills.” The legacy receipt
field `skill_count` is retained for compatibility and means discoverable entries;
`counts` names the separate units explicitly. Package byte/file counts are not
skill counts. Future upstream inventory changes require a fresh review of these
numbers and their manifests.

## Ownership and synchronization

`UPSTREAM.json` and its authoring asset mirror lock the reviewed base commit and
module blobs. The product's version, upstream release version, immutable source
revision and observed host acceptance are independent. For 1.2.0, TavernWeave's
current v2.4.0 is the existing f9863d2 baseline; no upstream implementation is
newly imported. [Upstream synchronization](UPSTREAM_SYNC.md) defines candidate
review, compatibility checks, complete pin updates, targeted regressions and
records. There is no automatic moving-branch adoption.

`main` maintains official product source and `yuri-dev` integrates development.
`yuri-plugin`, `Gemini-plugin` and `DSH-plugin` remain installation/update channels.
Generated portable/Gemini trees must not replace maintained source. Original
additions are MIT with the exclusions in LICENSE_BOUNDARY.md; upstream resources
and the independent Foreverse exporter retain their own notices and terms.
