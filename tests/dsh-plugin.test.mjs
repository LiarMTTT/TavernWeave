import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { apply, inject, name as pluginName } from "../host-adapters/dsh/plugin/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8").replace(/\r\n?/g, "\n");
const manifest = JSON.parse(read("tavernweave-install-manifest.json"));
const contract = JSON.parse(read("host-adapters/dsh/dsh-plugin-contract.json"));
const hostMap = JSON.parse(read("host-adapters/host-map.json"));
const packageTemplate = JSON.parse(read("host-adapters/dsh/plugin/package.template.json"));
const patch = read("host-adapters/dsh/plugin/cordis.patch.yml");
const frontDoor = read("host-adapters/tavernweave-front-door.md");

function frontDoorVersion() {
  const marker = frontDoor.split("\n").find((line) => line.startsWith("<!-- tavernweave-host-front-door:begin"));
  const match = /version=([^\s]+)/.exec(marker ?? "");
  assert.ok(match, "host front door marker version must exist");
  return match[1];
}

test("manifest, host map and contract agree on the DSH plugin bundle", () => {
  assert.equal(manifest.version, "2.2.0");
  assert.equal(contract.adapterVersion, manifest.version);
  assert.equal(hostMap.adapterVersion, manifest.version);
  assert.equal(frontDoorVersion(), manifest.version);
  assert.equal(manifest.hostFrontDoor.version, manifest.version);
  assert.equal(contract.package.name, packageTemplate.name);
  assert.equal(contract.package.version, manifest.version);
  assert.match(contract.package.name, /liarmttt/u);
  assert.equal(contract.package.presetId, "tavernweave");
  assert.equal(contract.status, "plugin-bundle");
  assert.equal(contract.runtimeAccepted, true);
  assert.equal(manifest.hostFrontDoor.dshSupport, contract.status);
  assert.equal(hostMap.hosts.dsh.support, contract.status);
  assert.equal(hostMap.hosts.dsh.instructionFileName, null);
  assert.equal(hostMap.hosts.dsh.pluginPackage, contract.package.name);
  assert.equal(hostMap.hosts.dsh.presetId, contract.package.presetId);
  assert.ok(manifest.dshPlugin, "installation manifest must declare dshPlugin");
  assert.equal(manifest.dshPlugin.package, contract.package.name);
  assert.equal(manifest.dshPlugin.status, contract.status);
  assert.equal(manifest.dshPlugin.contract, "host-adapters/dsh/dsh-plugin-contract.json");
  assert.equal(manifest.dshPreview, undefined, "legacy dshPreview must be removed");
  assert.equal(contract.upstream.auditedRuntimeVersion, "0.2.1-rc.2");
  assert.ok(packageTemplate.engines.dsh.includes(contract.upstream.auditedRuntimeVersion), "engines.dsh must include the audited runtime version");
  assert.ok(contract.forbiddenClaimsBeforeRuntimeAcceptance.includes("front-door-file-equals-host-loading"));
});

test("bundle patch declares the selectable TavernWeave preset and plugin row", () => {
  assert.match(patch, /id: preset-tavernweave/u);
  assert.match(patch, /name: '@deepseek-ai\/dsh-agent-preset'/u);
  assert.match(patch, /id: tavernweave\n/u);
  assert.match(patch, /name: 'liarmttt-tavernweave-dsh'/u);
  assert.match(patch, /id: tool-skill/u);
  assert.match(patch, /catalogDescriptionMaxLength: 1200/u);
  assert.match(patch, /id: tool-present/u);
  assert.doesNotMatch(patch, /tool-result-pruner/u, "compaction must not prune TavernWeave skill bodies");
  assert.match(packageTemplate.dsh.bundle.patch, /cordis\.patch\.yml/u);
  assert.ok(packageTemplate.files.some((entry) => entry.startsWith("skills")));
});

test("plugin registers the 23 skills and the host front door on a mock context", async () => {
  const sections = [];
  const logs = [];
  let provider;
  const ctx = {
    skills: {
      registerProvider(create) {
        provider = create({ signal: new AbortController().signal, invalidate() {} });
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
  assert.equal(pluginName, "tavernweave-dsh");
  assert.deepEqual(inject, ["skills"]);
  assert.ok(provider, "plugin must register a skill provider");

  const candidates = await provider.list();
  assert.equal(candidates.length, manifest.skillCount);
  assert.deepEqual(candidates.map((candidate) => candidate.name).sort(), [...manifest.skills].sort());
  for (const candidate of candidates) {
    assert.equal(candidate.provider, "tavernweave");
    assert.equal(candidate.source, "bundled");
    assert.equal(candidate.rank, 600);
    assert.equal(candidate.invocation.modelInvocable, true);
    assert.equal(candidate.invocation.userInvocable, true);
    assert.ok(candidate.description.length > 0);
    assert.equal(candidate.resourceBase.kind, "directory");
    assert.ok(fs.statSync(candidate.resourceBase.path).isDirectory());
    assert.ok(fs.existsSync(candidate.path));
  }

  const definition = await provider.get(candidates[0]);
  assert.equal(definition.name, candidates[0].name);
  assert.ok(definition.content.length > 0);

  assert.equal(sections.length, 1);
  assert.equal(sections[0].name, "tavernweave:host-front-door");
  assert.equal(sections[0].order, 100);
  assert.equal(sections[0].interpolate, false);
  assert.ok(sections[0].text.includes("TavernWeave Host Front Door"));
  assert.ok(logs.some((line) => line.includes("registered")));
});

test("packaged build validates and carries the skill bundle", () => {
  const script = path.join(root, "scripts/build-dsh-plugin.mjs");
  const output = execFileSync(process.execPath, [script, "--check"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  const summary = JSON.parse(output.trim().split(/\r?\n/).at(-1));
  assert.equal(summary.status, "ok");
  assert.equal(summary.mode, "check");
  assert.equal(summary.package, contract.package.name);
  assert.equal(summary.version, manifest.version);
  assert.equal(summary.skills, manifest.skillCount);
  assert.ok(summary.longestDescription <= summary.maxDescription);
  assert.ok(summary.frontDoorBytes > 2000);
  assert.ok(summary.scannedFiles > 100);
  assert.ok(summary.enginesDsh.includes("0.2.1-rc.2"));
});

test("legacy TW Lite DSH presets and preview test are removed", () => {
  const legacy = [
    "host-adapters/dsh/tw-lite-contract.json",
    "host-adapters/dsh/tw-lite-entry/agent.cordis.yml",
    "host-adapters/dsh/tw-lite-full/agent.cordis.yml",
    "tests/dsh-preview.test.mjs",
  ];
  for (const relative of legacy) assert.equal(fs.existsSync(path.join(root, relative)), false, `${relative} must be removed`);
});
