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

test("explicit review combinations route scope without making generic reviews Soul commands", () => {
  for (const [label, mode, focus] of [["全量审查", "full-scan", "general"], ["架构审查", "architecture-hotspot-scan", "architecture"], ["全量架构审查", "full-scan", "architecture"]]) {
    const result = resolveSoulCommand(`灵魂杀手，${label}`);
    assert.equal(result.mode, "soul-killer-portable");
    assert.deepEqual(result.review, { skill: "code-quality-workflow", mode, focus });
    assert.equal(resolveSoulCommand(label).matched, false);
    assert.equal(resolveSoulCommand(`引用：灵魂杀手，${label}`).matched, false);
  }
  assert.equal(resolveSoulCommand("灵魂杀手！").review, undefined);
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

test("profile validation enforces every preference type and source record contract", () => {
  const valid = { schemaVersion: 1, profileId: "creator.test", version: "1.2.0", scope: "project", confirmedAt: "2024-02-29", privacy: "private-adapter", preferences: { language: "中".repeat(32), conclusionFirst: false, technicalAltitude: "adaptive", decisionBatchSize: 4, creativeOpenness: "guided", acceptanceStyle: "compact", frontendCritiqueDirectness: "measured", designPriorities: ["叙事阅读", "键盘操作"], motionPreference: "adaptive" }, sources: [{ type: "project-authority", label: "confirmed", confirmedAt: "2024-02-29" }] };
  assert.deepEqual(validateSoulProfile(valid), []);
  for (const [key, values] of Object.entries({ language: [42, "a".repeat(33), null], conclusionFirst: ["true", 1, null], technicalAltitude: ["beginner", false], decisionBatchSize: [0, 5, 1.5, "2"], creativeOpenness: ["maybe", 4], acceptanceStyle: ["any", true], frontendCritiqueDirectness: ["high"], motionPreference: ["never"], designPriorities: [["same", "same"], [""], [2], Array.from({ length: 9 }, (_, i) => String(i)), ["x".repeat(49)]] })) {
    for (const value of values) assert.ok(validateSoulProfile({ ...valid, preferences: { ...valid.preferences, [key]: value } }).length, `must reject ${key}: ${JSON.stringify(value)}`);
  }
  for (const source of [42, [], null, {}, { type: "invented", label: "x", confirmedAt: "2024-02-29" }, { type: "approved-summary", label: 42, confirmedAt: "2024-02-29" }, { type: "approved-summary", label: "x".repeat(121), confirmedAt: "2024-02-29" }, { type: "approved-summary", label: "x", confirmedAt: "2026-02-30" }, { ...valid.sources[0], extra: true }]) assert.ok(validateSoulProfile({ ...valid, sources: [source] }).length);
  for (const changed of [{ sources: Array(13).fill(valid.sources[0]) }, { preferences: [] }, { profileId: 1234 }, { version: 120 }, { confirmedAt: "2026-02-29" }, { schemaVersion: "1" }, { privacy: "public" }, { extra: true }]) assert.ok(validateSoulProfile({ ...valid, ...changed }).length);
  const missing = structuredClone(valid); delete missing.sources;
  assert.ok(validateSoulProfile(missing).length);
});

test("private Windows paths are checked in decoded strings including nested preferences and sources", () => {
  const valid = { schemaVersion: 1, profileId: "creator.test", version: "1.0.0", scope: "user", confirmedAt: "2026-10-13", privacy: "private-adapter", preferences: {}, sources: [] };
  for (const location of ["C:\\Users\\Sample\\notes", "C:/Users/Sample/notes", "\\\\server\\Users\\Sample\\notes"]) {
    const fromJson = JSON.parse(JSON.stringify({ ...valid, sources: [{ type: "approved-summary", label: location, confirmedAt: "2026-10-13" }] }));
    assert.ok(validateSoulProfile(fromJson).some((error) => error.includes("private absolute path")), location);
  }
  assert.ok(validateSoulProfile({ ...valid, preferences: { designPriorities: ["C:\\Users\\Sample\\notes"] } }).some((error) => error.includes("private absolute path")));
});
