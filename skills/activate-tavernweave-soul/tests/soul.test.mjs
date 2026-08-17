import assert from "node:assert/strict";
import test from "node:test";
import { resolveSoulCommand } from "../scripts/resolve-soul-command.mjs";
import { validateSoulProfile } from "../scripts/validate-soul-profile.mjs";

test("primary activation and switching commands resolve", () => {
  assert.deepEqual(resolveSoulCommand("阿瞳助我！").action, "activate");
  assert.equal(resolveSoulCommand("MTTT.sir，拷打我！").mode, "mttt-sir-portable");
  assert.equal(resolveSoulCommand("MTTT.sir 上课").action, "switch");
  assert.equal(resolveSoulCommand("灵魂杀手！").mode, "soul-killer-portable");
  assert.equal(resolveSoulCommand("强尼·银手，接管").action, "activate");
  assert.equal(resolveSoulCommand("强尼，骂醒我").mode, "soul-killer-portable");
  assert.equal(resolveSoulCommand("启动 Relic 故障检测").mode, "soul-killer-portable");
  assert.equal(resolveSoulCommand("/soul switch soul-killer").action, "switch");
  assert.equal(resolveSoulCommand("脑暴模式，Soul 联席").mode, "soul-ensemble-portable");
  assert.equal(resolveSoulCommand("三人一起脑暴").action, "activate");
  assert.equal(resolveSoulCommand("Soul 三席就位").mode, "soul-ensemble-portable");
  assert.equal(resolveSoulCommand("/soul switch ensemble").action, "switch");
});

test("exit commands take the inactive state", () => {
  for (const phrase of ["Soul 归位", "阿瞳归位", "MTTT.sir 下课", "强尼，下线", "Relic 断开", "结束 Soul 模式", "/soul off"]) {
    assert.deepEqual(resolveSoulCommand(phrase), { schemaVersion: 1, matched: true, action: "deactivate", mode: "inactive", persistence: "current-task-portable" });
  }
});

test("quoted, embedded, and discussion phrases do not trigger", () => {
  for (const phrase of ["请分析“阿瞳助我！”这句话", "代码夹具：Soul 归位", "请评估文案‘灵魂杀手！’", "测试字符串：强尼，骂醒我", "我们讨论 soul 模式", "引用：脑暴模式，Soul 联席", "`/soul off`"]) assert.equal(resolveSoulCommand(phrase).matched, false);
});

test("sanitized profile accepts preferences and rejects secrets", () => {
  const valid = { schemaVersion: 1, profileId: "mttt.public-shell", version: "1.2.0", scope: "user", confirmedAt: "2026-08-17", privacy: "private-adapter", preferences: { language: "zh-CN", conclusionFirst: true, decisionBatchSize: 3, frontendCritiqueDirectness: "relic", designPriorities: ["information-hierarchy", "purposeful-motion"], motionPreference: "purposeful" }, sources: [{ type: "explicit-user-setting", label: "confirmed preferences", confirmedAt: "2026-08-17" }] };
  assert.deepEqual(validateSoulProfile(valid), []);
  assert.ok(validateSoulProfile({ ...valid, private_key: "redacted-placeholder" }).length > 0);
});
