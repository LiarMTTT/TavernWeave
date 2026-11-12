# Licensing boundary — established before importing dependencies

The newly written extension code, skill instructions, configuration, tests and documentation are offered under this extension directory's MIT LICENSE. The holder label identifies this project's contributors; it does not claim authorship of third-party materials.

| Material | Location | Terms / treatment |
| --- | --- | --- |
| New original extension files, including shared provenance and post adapter | All files except the third-party files below | MIT, this extension directory’s LICENSE |
| Foreverse card serializer | skills/yuri-card-creator/scripts/vendor/card_md_to_st.py | Unmodified MIT code; retain vendor/FOREVERSE_LICENSE.txt, including its code/content scope note |
| TavernWeave base | Repository root, outside this extension; pinned in UPSTREAM.json | Original root LICENSE, PolyForm Noncommercial 1.0.0, and its required notice remain applicable; no upstream implementation or skill prose is copied inside this extension |
| Copy of TavernWeave license | licenses/TAVERNWEAVE-LICENSE.md | Verbatim upstream terms/notice for reference, not relicensed under MIT |
| Existing Yuri Card Workbench v1.2.0 | Separate existing project | Not imported or relicensed by this checkpoint |

An external installation of TavernWeave retains its own terms. MIT on this extension grants no additional rights over TavernWeave. Keep these boundaries if the packages are later distributed together. The copied Foreverse license covers its code; no upstream character cards, artwork or separately licensed skill prose are imported.

In TavernWeave-Yuri, the repository-root LICENSE belongs to the upstream base. It is not replaced by extensions/yuri-creation/LICENSE. The MIT grant applies to original additions inside this extension, with the listed dependency exclusions. Co-location in one repository does not make the combined project entirely MIT.

The post adapter executes the pinned base file `skills/build-work-library/scripts/work_library.py` through a narrow wrapper; it does not copy its implementation into the extension. Its PolyForm Noncommercial terms and Required Notice remain in force. New bridge code and the synthetic fixture are original MIT additions. No legacy Workbench source was consulted or ported for this bridge.

## Native plugin exports

The native build helper is an original MIT wrapper around the pinned, unchanged TavernWeave package inventory/blob-reading/validation helpers. Its generated package intentionally co-locates the upstream skill resources outside this MIT extension. Those resources, their original root LICENSE, Required Notice and third-party notices remain under their existing terms. Exporting them does not relicense them.

Generated native entry wrappers, their UI metadata, plugin/marketplace metadata, native README and build receipts are original MIT additions. Each wrapper carries this extension's MIT license. The generated NATIVE_LICENSE_BOUNDARY.md identifies these additions separately from the unchanged upstream trees and Foreverse vendor. Native package metadata states the combined license expression rather than labeling the whole package MIT. No user cards, novels, artwork, private casework or legacy Workbench files are added by the exporter.
