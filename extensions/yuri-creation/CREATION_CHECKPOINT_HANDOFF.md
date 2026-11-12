# Fork integration handoff

Extension: 0.2.0. Repository: https://github.com/imbdsssity/TavernWeave-Yuri. Initial yuri-dev base: f9863d2b05305457fe9ed8b0c5688d52aca400a5. Target path: extensions/yuri-creation/. Feature branch: feature/yuri-creation-integration.

Publish directly through the connected GitHub tools and open a PR into yuri-dev. Keep main and the frozen Workbench unchanged. The user adopted this direct process; a separate uploading agent and Drive/local synchronization are no longer prerequisites. See PROJECT_WORKFLOW.md.

The integration preserves all upstream tracked paths and adds this isolated extension. Root LICENSE, manifests, hooks, installers and the 23-skill inventory are unchanged. Original extension additions retain their nested MIT LICENSE; upstream remains under its root terms and notices. No legacy Workbench implementation was imported.

Sixteen focused tests passed in the fork layout before the workflow-document update. Runtime and test files are unchanged by that update. The two pinned authoring-file hashes also passed; neither result proves native installation or host image generation. Custom-profile compatibility and legacy licensing remain deferred.

Regenerate and verify PACKAGE_MANIFEST.json before publication, then compare the published Git tree with the checked workspace. Use actual GitHub PR/commit state to continue. The earlier Drive delivery and integration.patch are historical snapshots; do not apply them over this updated branch or expect their tree hash to match the revised workflow documents.

The retained PNG has now been imported successfully according to user feedback. The user accepted the short chat, and its private exported transcript was reviewed. This closes the bounded original-creation/PNG acceptance step; do not request another import or multi-turn trial merely to repeat it. See the current trial review for evidence limits. Prepare the 0.2.0 main PR; do not merge main without the user’s instruction.
