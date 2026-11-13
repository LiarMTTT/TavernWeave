# Gemini adapter source

These templates were integrated from `Gemini-plugin` at fb182b4. `build_host_plugin.py --host gemini` overlays them onto a complete generated distribution; do not merge a generated tree into the source branch. The root entry points remain the four `skills/<workflow>/SKILL.md` files. There is no root SKILL.md.

The accepted Gemini CLI and Task setup imports each skill individually. Keep the complete package available so canonical workflows and the 23 base skills remain readable; a host that copies only a wrapper needs those sibling resources made accessible too. Explicitly load the required dependency when the host does not hand off automatically. Context, agent and extension descriptors are optional compatibility files, not a claim of accepted plugin import.

The context/rule text and `agents/tavernweave.md` derive from the pinned TavernWeave front door and retain the root LICENSE and Required Notice. Yuri-specific additions and the original adapter descriptors use the extension MIT license. No combined MIT grant is implied. The host's current tools and permissions remain authoritative.
