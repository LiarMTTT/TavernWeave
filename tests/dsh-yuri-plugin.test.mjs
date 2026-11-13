import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { apply, inject, name as pluginName } from "../host-adapters/dsh/plugin-yuri/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8").replace(/\r\n?/g, "\n");
const manifest = JSON.parse(read("tavernweave-install-manifest.json"));
const yuriManifest = manifest.yuriDshPlugin;
const contract = JSON.parse(read("host-adapters/dsh/yuri-plugin-contract.json"));
const packageSource = JSON.parse(read("host-adapters/dsh/plugin-yuri/package.json"));
const patch = read("host-adapters/dsh/plugin-yuri/cordis.patch.yml");

const YURI_WORKFLOWS = ["adapt-yuri-card", "novel-excerpt-to-yuri-card", "post-to-yuri-card", "yuri-card-creator"];

test("install manifest and contract agree on the yuri DSH plugin bundle", () => {
  assert.ok(yuriManifest, "installation manifest must declare yuriDshPlugin");
  assert.equal(yuriManifest.package, "tavernweave-yuri-dsh");
  assert.equal(yuriManifest.version, read("extensions/yuri-creation/VERSION").trim());
  assert.equal(yuriManifest.presetId, "tavernweave-yuri");
  assert.equal(yuriManifest.sourceDir, "host-adapters/dsh/plugin-yuri");
  assert.equal(yuriManifest.patch, "host-adapters/dsh/plugin-yuri/cordis.patch.yml");
  assert.equal(yuriManifest.buildScript, "scripts/build-yuri-dsh-plugin.mjs");
  assert.deepEqual([...yuriManifest.workflows].sort(), [...YURI_WORKFLOWS].sort());

  assert.equal(packageSource.name, yuriManifest.package);
  assert.equal(packageSource.version, yuriManifest.version);
  assert.equal(packageSource.dsh.bundle.patch, "./cordis.patch.yml");
  assert.ok(packageSource.engines.dsh.includes("0.2.2-rc.1"), "engines.dsh must include the current audited runtime version");
  assert.ok(packageSource.files.some((entry) => entry === "skills/"));
  assert.ok(packageSource.files.some((entry) => entry === "extensions/yuri-creation/"));

  assert.equal(contract.package.name, packageSource.name);
  assert.equal(contract.package.version, packageSource.version);
  assert.equal(contract.package.presetId, "tavernweave-yuri");
  assert.deepEqual([...contract.package.workflows].sort(), [...YURI_WORKFLOWS].sort());
  assert.equal(contract.composition.dependencySkills, 23);
  assert.equal(contract.composition.workflowSkills, 4);
  assert.equal(contract.upstream.auditedRuntimeVersion, "0.2.2-rc.1");
});

test("bundle patch declares the selectable yuri preset and plugin row", () => {
  assert.match(patch, /id: preset-tavernweave-yuri/u);
  assert.match(patch, /name: '@deepseek-ai\/dsh-agent-preset'/u);
  assert.match(patch, /id: tavernweave-yuri\n/u);
  assert.match(patch, /name: 'tavernweave-yuri-dsh'/u);
  assert.match(patch, /id: tool-skill/u);
  assert.match(patch, /catalogDescriptionMaxLength: 1200/u);
  assert.match(patch, /id: tool-fs/u);
  assert.match(patch, /id: tool-pwsh/u);
  assert.match(patch, /id: tool-bash/u);
  assert.match(patch, /id: tool-present/u);
  const presetSummary = /^\s*description: (.+)$/mu.exec(patch)?.[1] ?? "";
  assert.match(presetSummary, /四个百合卡工作流/u, "preset summary must name the four yuri workflows");
  assert.match(presetSummary, /yuri-card-creator/u);
  assert.match(presetSummary, /adapt-yuri-card/u);
  assert.match(presetSummary, /post-to-yuri-card/u);
  assert.match(presetSummary, /novel-excerpt-to-yuri-card/u);
  assert.match(presetSummary, /23 个未改动的 TavernWeave 依赖技能/u, "preset summary must name the 23 dependency skills");
  assert.doesNotMatch(patch, /tool-result-pruner/u, "compaction must not prune workflow bodies");
  assert.doesNotMatch(patch, /tavernweave:host-front-door/u, "the yuri plugin must not inject the TavernWeave host front door");
});

test("plugin registers the four yuri workflows, the 23 base skills and the location section", async () => {
  const sections = [];
  const logs = [];
  const providers = [];
  const ctx = {
    skills: {
      registerProvider(create) {
        providers.push(create({ signal: new AbortController().signal, invalidate() {} }));
      },
    },
    inject(dependencies, callback) {
      assert.deepEqual(dependencies, ["systemPrompt"]);
      callback({
        effect(run) {
          return run();
        },
        systemPrompt: {
          section(section) {
            sections.push(section);
            return () => {};
          },
        },
      });
    },
    effect(run) {
      return run();
    },
    logger: { info: (message) => logs.push(message) },
  };
  apply(ctx);
  assert.equal(pluginName, "tavernweave-yuri-dsh");
  assert.deepEqual(inject, ["skills"]);
  assert.equal(providers.length, 2, "plugin must register two skill providers");

  const yuriProvider = providers.find((provider) => provider.name === "tavernweave-yuri");
  const baseProvider = providers.find((provider) => provider.name === "tavernweave-base");
  assert.ok(yuriProvider, "yuri provider must be registered");
  assert.ok(baseProvider, "base provider must be registered");

  const yuriCandidates = await yuriProvider.list();
  assert.equal(yuriCandidates.length, 4);
  assert.deepEqual(yuriCandidates.map((candidate) => candidate.name).sort(), [...YURI_WORKFLOWS].sort());
  for (const candidate of yuriCandidates) {
    assert.equal(candidate.provider, "tavernweave-yuri");
    assert.equal(candidate.source, "bundled");
    assert.equal(candidate.rank, 600);
    assert.equal(candidate.invocation.modelInvocable, true);
    assert.equal(candidate.invocation.userInvocable, true);
    assert.ok(candidate.description.length > 0);
    assert.equal(candidate.resourceBase.kind, "directory");
    assert.ok(fs.statSync(candidate.resourceBase.path).isDirectory());
    assert.ok(fs.existsSync(candidate.path));
    // The workflow must keep its canonical directory layout: sibling references
    // (`../../references/...`) resolve against the packaged workbench root.
    assert.ok(candidate.path.includes(`extensions${path.sep}yuri-creation${path.sep}skills`), "yuri workflow must load from its canonical directory");
  }
  const definition = await yuriProvider.get(yuriCandidates[0]);
  assert.equal(definition.name, yuriCandidates[0].name);
  assert.ok(definition.content.length > 0);

  const baseCandidates = await baseProvider.list();
  assert.equal(baseCandidates.length, 23);
  assert.deepEqual(baseCandidates.map((candidate) => candidate.name).sort(), [...manifest.skills].sort());
  for (const candidate of baseCandidates) {
    assert.equal(candidate.provider, "tavernweave-base");
    assert.equal(candidate.source, "bundled");
    assert.equal(candidate.resourceBase.kind, "directory");
    assert.ok(fs.statSync(candidate.resourceBase.path).isDirectory());
  }

  assert.equal(sections.length, 1);
  assert.equal(sections[0].name, "tavernweave-yuri:locations");
  assert.equal(sections[0].order, 100);
  assert.equal(sections[0].interpolate, false);
  assert.match(sections[0].text, /TavernWeave Yuri Workbench locations/u);
  assert.match(sections[0].text, /yuri workbench root/u);
  assert.match(sections[0].text, /pinned TavernWeave base/u);
  assert.ok(logs.some((line) => line.includes("registered")));
});

test("packaged build validates and carries both skill trees", () => {
  const script = path.join(root, "scripts/build-yuri-dsh-plugin.mjs");
  const output = execFileSync(process.execPath, [script, "--check"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  const summary = JSON.parse(output.trim().split(/\r?\n/).at(-1));
  assert.equal(summary.status, "ok");
  assert.equal(summary.mode, "check");
  assert.equal(summary.package, contract.package.name);
  assert.equal(summary.version, yuriManifest.version);
  assert.equal(summary.workflows, 4);
  assert.equal(summary.baseSkills, 23);
  assert.ok(summary.longestDescription <= summary.maxDescription);
  assert.ok(summary.scannedFiles > 100);
  assert.ok(summary.enginesDsh.includes("0.2.2-rc.1"));
});

test("manifest workflows match the extension's native host entry points", () => {
  const native = JSON.parse(read("extensions/yuri-creation/hosts/native.json"));
  assert.equal(native.name, "tavernweave-yuri");
  assert.deepEqual(
    Object.keys(native.entry_points).sort(),
    [...YURI_WORKFLOWS].sort(),
    "the four workflows must match hosts/native.json entry points",
  );
  assert.equal(native.components.skills, true, "the yuri native plugin is skills-only");
  for (const workflow of YURI_WORKFLOWS) {
    const canonical = path.join(root, "extensions", "yuri-creation", "skills", workflow, "SKILL.md");
    assert.ok(fs.existsSync(canonical), `${workflow} canonical SKILL.md must exist`);
  }
});
