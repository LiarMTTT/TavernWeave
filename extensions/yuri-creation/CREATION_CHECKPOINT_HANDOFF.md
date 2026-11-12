# Development handoff — 0.3.0

The extension now has two entry points: yuri-card-creator for original conversation and post-to-yuri-card for one supplied post. Do not relabel a source-based task as original. Source records and adaptation decisions have separate ownership; see references/source-records.md.

Source CLI: python extensions/yuri-creation/scripts/source_card.py --help. It requires the pinned base work-library file, defaulting to the current checkout. For another base, pass --tavern-root before the subcommand. Private project directories must be outside the repository. Output directories are fresh and existing files are not overwritten.

New bridge code is original MIT material. The work-library implementation is called from the base, not copied or relicensed. The Foreverse serializer remains unmodified and separately attributed. Legacy-file licensing is still deferred and no legacy implementation is imported.

The 0.2.0 original path has a previously accepted PNG import/short chat. Source-route structural tests and a fresh synthetic task are separate evidence. No new real SillyTavern source-route import is claimed. Withdrawn cases must remain excluded.

Use direct GitHub publication into a feature branch/PR targeting yuri-dev, with verified tree readback. Main remains the accepted 0.2.0 release until the user authorizes another release.
