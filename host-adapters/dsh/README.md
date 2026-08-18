# TavernWeave TW Lite for DeepSeek Harness

This directory is a **Developer Preview, offline-only adapter candidate**. It does not mean TavernWeave has been installed in DSH, called a DeepSeek model, spent API credit, passed Windows/Linux/WSL acceptance, or proved that a preset preserves or maximizes model intelligence.

The snapshot was re-audited against the official `deepseek-ai/deepseek-harness` `master` root version `0.1.0-rc.5` on 2026-08-17. Upstream explicitly warns that Developer Preview may introduce compatibility-breaking changes. Re-audit before installation.

## Why official minimal cannot run TavernWeave

The official `minimal` preset composes only persistent bash and `str_replace_editor`; it does not mount `@deepseek-ai/dsh-skill-filesystem` or `@deepseek-ai/dsh-tool-skill`. Copying TW Skill files beside that preset therefore does not make them callable.

Official `standard` and `code` include both Skill components. TW Lite starts from the smaller idea but adds cross-platform shell selection, filesystem/search, Skill discovery/loader, user questions, and the compact TavernWeave Host Front Door. Web, subagents, workflows, Ralph, todo, goals, jobs, and Code Mode presentation remain omitted unless a task-specific experiment adds and revalidates them.

## Variants

- `tw-lite-full/agent.cordis.yml`: discover all 20 TavernWeave Skills from an official DSH Skill root. This is the functional baseline.
- `tw-lite-entry/agent.cordis.yml`: point DSH at a **dedicated** Skill root containing only `activate-tavernweave-soul`, `consult-tavernweave-library`, `orchestrate-project-blueprint`, and `tavern-card-builder`. This reduces catalog exposure for A/B testing, but secondary routes are unavailable and must be reported as degraded.

Do not delete or hide the full installation merely to run Entry. Use a separate explicit directory. The repository installer only accepts a target whose final segment is `skills`, which can stage either catalog without inventing another package format.

## Acceptance boundary

The machine-readable authority is [tw-lite-contract.json](tw-lite-contract.json). Before recommending TW Lite, run every listed runtime gate against the currently pinned DSH build and compare the same tasks across official `minimal`, `standard`, `code`, TW Lite Full, and TW Lite Entry. Record success, constraint adherence, tokens, latency, tool calls, Library evidence, artifact quality, and failures. A single impressive answer is not evidence of “maximum intelligence.”
