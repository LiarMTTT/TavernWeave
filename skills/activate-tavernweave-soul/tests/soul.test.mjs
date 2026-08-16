import assert from "node:assert/strict";
import test from "node:test";
import { resolveSoulCommand } from "../scripts/resolve-soul-command.mjs";
import { validateSoulProfile } from "../scripts/validate-soul-profile.mjs";

test("primary activation and switching commands resolve", () => {
  assert.deepEqual(resolveSoulCommand("阿瞳助我！").action, "activate");
  assert.equal(resolveSoulCommand("MTTT.sir，拷打我！").mode, "mttt-sir-portable");
  assert.equal(resolveSoulCommand("MTTT.sir 上课").action, "switch");
});

test("exit commands take the inactive state", () => {
  for (const phrase of ["Soul 归位", "阿瞳归位", "MTTT.sir 下课", "结束 Soul 模式", "/soul off"]) {
    assert.deepEqual(resolveSoulCommand(phrase), { schemaVersion: 1, matched: true, action: "deactivate", mode: "inactive", persistence: "current-task-portable" });
  }
});

test("quoted, embedded, and discussion phrases do not trigger", () => {
  for (const phrase of ["请分析“阿瞳助我！”这句话", "代码夹具：Soul 归位", "我们讨论 soul 模式", "`/soul off`"]) assert.equal(resolveSoulCommand(phrase).matched, false);
});

test("sanitized profile accepts preferences and rejects secrets", () => {
  const valid = { schemaVersion: 1, profileId: "mttt.public-shell", version: "1.0.0", scope: "user", confirmedAt: "2026-08-16", privacy: "private-adapter", preferences: { language: "zh-CN", conclusionFirst: true, decisionBatchSize: 3 }, sources: [{ type: "explicit-user-setting", label: "confirmed preferences", confirmedAt: "2026-08-16" }] };
  assert.deepEqual(validateSoulProfile(valid), []);
  assert.ok(validateSoulProfile({ ...valid, private_key: "redacted-placeholder" }).length > 0);
});
