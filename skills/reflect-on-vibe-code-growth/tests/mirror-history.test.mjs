import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { saveMirrorRecord } from "../scripts/save-mirror-record.mjs";
import { renderTextAssessment } from "../scripts/render-text-assessment.mjs";
import { sha256, validateHistory, validateRecordObject } from "../scripts/validate-mirror-record.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(skillRoot, "assets", "vibe-code-growth-report.html");

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tavernweave-mirror-"));
}

function stage(status = "not-evaluated", evidenceRefs = []) {
  return { status, evidenceRefs };
}

function draft(createdAt = "2026-08-18T12:00:00.000Z", rubricVersion = "behavior-network-v1") {
  const evidence = [
    { evidenceId: "ev-project", label: "项目状态", measurementType: "exact", sourceKind: "project-state", summary: "项目状态文件可复算。", confidence: "high", basis: "versioned files" },
    { evidenceId: "ev-behavior", label: "行为证据", measurementType: "behavioral-evidence-score", sourceKind: "delivery-review", summary: "多次区分自动验证与人工验收。", confidence: "medium", basis: "named delivery receipts" }
  ];
  const dimensions = [
    { dimensionId: "decisiveness", label: "决断力", cluster: "产品决策", score: 7.2, confidence: "medium", scoringMethod: "behavior-network", evidenceRefs: ["ev-behavior"], judgment: "能明确停止错误方向。", limits: "样本窗口有限。", nextStep: "记录止损阈值。" },
    { dimensionId: "correction", label: "纠错能力", cluster: "驾驶校准", score: 7.5, confidence: "medium", scoringMethod: "behavior-network", evidenceRefs: ["ev-behavior"], judgment: "能以证据纠偏。", limits: "复杂问题仍需多轮。", nextStep: "缩短反馈回路。" },
    { dimensionId: "learning-speed", label: "学习速度", cluster: "学习迁移", score: 7.1, confidence: "medium", scoringMethod: "behavior-network", evidenceRefs: ["ev-project"], judgment: "能迁移工程门控。", limits: "不评价纯手写速度。", nextStep: "增加闭环样本。" },
    { dimensionId: "driver-sync", label: "驾驶同步率", cluster: "驾驶校准", score: 7.7, confidence: "high", scoringMethod: "behavior-network", evidenceRefs: ["ev-behavior"], judgment: "长任务可持续拉回意图。", limits: "恢复上下文有成本。", nextStep: "压缩权威摘要。" }
  ];
  return {
    schemaVersion: 2,
    createdAt,
    title: "Vibe Code 成长历程",
    assessmentMode: "full-current-evidence-reassessment",
    rubricVersion,
    evidenceWindow: { start: "2026-08-01", end: "2026-08-18", coverageNote: "测试窗口" },
    scoringMethod: { id: "behavior-network", description: "基于具名行为证据的当前窗口评分。", scoreScale: { min: 0, max: 10 } },
    evidence,
    dimensions,
    coreDimensionIds: ["decisiveness", "correction", "learning-speed", "driver-sync"],
    tokenEconomics: {
      sources: [
        { system: "Codex", metric: "token total", value: 1234, unit: "tokens", measurementType: "exact", basis: "local machine export" },
        { system: "Chat", metric: "visible turns", value: 12, unit: "turns", measurementType: "exact", basis: "visible conversation count", note: "不换算 Token。" }
      ]
    },
    projectPortfolio: {
      projects: [{
        projectId: "demo", label: "演示项目", stages: {
          definition: stage("complete", ["ev-project"]), implementation: stage("partial", ["ev-project"]), automatedVerification: stage("complete", ["ev-project"]),
          buildPackaging: stage(), humanAcceptance: stage(), releaseOnlineReadback: stage()
        }
      }]
    },
    timeline: [{ period: "当前窗口", summary: "从功能实现转向证据闭环。", change: "开始分离完成门。" }],
    narrativeAssessment: {
      executiveSummary: "当前证据说明用户已经能把模糊意图转化为具备边界、验证门和交付路径的工程任务，同时仍需控制并发与复核成本。",
      sections: [
        { sectionId: "decision-architecture", title: "产品定义与架构", summary: "强项是把问题压回正确的软件单位。", paragraphs: ["能够区分产品愿景、当前阶段和真实交付入口，并拒绝无授权扩张。"], evidenceRefs: ["ev-behavior"], dimensionIds: ["decisiveness"] },
        { sectionId: "correction-learning", title: "纠错与学习", summary: "纠错会重建执行对象与验证门。", paragraphs: ["学习结果会迁移成项目规则，而不是停留在术语记忆。"], evidenceRefs: ["ev-behavior", "ev-project"], dimensionIds: ["correction", "learning-speed"] },
        { sectionId: "project-portfolio", title: "项目组合", summary: "阶段闭环与长期愿景需要分开报告。", paragraphs: ["自动验证通过不能替代人工验收和发布回读。"], evidenceRefs: ["ev-project"], dimensionIds: ["driver-sync"] },
        { sectionId: "final-verdict", title: "能力定位", summary: "当前判断只属于本次证据窗口。", paragraphs: ["下一次再次核验必须从当前证据完整重评，历史分数不构成下限。"], evidenceRefs: ["ev-behavior"], dimensionIds: ["decisiveness", "correction"] }
      ],
      recommendations: [{ title: "缩短反馈回路", action: "为每个阶段保留一个明确的关闭门和停止条件。", successSignal: "下一次核验能指出更少的重复恢复和更高的真实闭环比例。" }],
      closingJudgment: "这是一份基于当前行为证据的能力判断，而不是人格标签；强项在定义、纠错和同步，下一步重点是把同样的质量用更低成本转化为最终闭环。"
    },
    verdict: { current: "当前窗口判断", limits: "不外推到未来上限", next: "关闭更多真实门", unverifiable: "纯手写代码速度" }
  };
}

test("first save creates immutable record, report, text assessment, index, latest pointer, and valid hashes", () => {
  const root = tempRoot();
  try {
    const receipt = saveMirrorRecord({ root, record: draft(), templatePath });
    assert.ok(fs.existsSync(receipt.recordPath));
    assert.ok(fs.existsSync(receipt.reportPath));
    assert.ok(fs.existsSync(receipt.assessmentPath));
    assert.equal(receipt.previousRecordId, null);
    assert.equal(sha256(fs.readFileSync(receipt.reportPath)), receipt.reportHash);
    assert.equal(sha256(fs.readFileSync(receipt.assessmentPath)), receipt.assessmentHash);
    const saved = JSON.parse(fs.readFileSync(receipt.recordPath, "utf8"));
    assert.equal(saved.integrity.recordHash, receipt.recordHash);
    assert.equal(saved.comparison, undefined);
    assert.match(fs.readFileSync(receipt.reportPath, "utf8"), /<title>Vibe Code 成长历程<\/title>/u);
    assert.match(fs.readFileSync(receipt.assessmentPath, "utf8"), /单份文字评估表单/u);
    const checked = validateHistory(root);
    assert.equal(checked.valid, true, checked.errors.join("\n"));
    assert.equal(checked.records.length, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("repeat save refuses overwrite and a later save appends with a verified predecessor", () => {
  const root = tempRoot();
  try {
    const firstDraft = draft();
    const first = saveMirrorRecord({ root, record: firstDraft, templatePath });
    assert.throws(() => saveMirrorRecord({ root, record: firstDraft, templatePath }), /append-only refusal|already exists/u);
    const nextDraft = draft("2026-08-19T12:00:00.000Z");
    nextDraft.dimensions[0].score = 7.8;
    const second = saveMirrorRecord({ root, record: nextDraft, templatePath });
    const record = JSON.parse(fs.readFileSync(second.recordPath, "utf8"));
    assert.equal(second.previousRecordId, first.recordId);
    assert.equal(record.integrity.previousRecordHash, first.recordHash);
    const change = record.comparison.dimensionMappings.find((item) => item.previousDimensionId === "decisiveness");
    assert.equal(change.status, "comparable");
    assert.equal(change.delta, 0.6);
    assert.equal(validateHistory(root).records.length, 2);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("history corruption and unindexed nodes stop continuity conclusions", () => {
  const root = tempRoot();
  try {
    const receipt = saveMirrorRecord({ root, record: draft(), templatePath });
    fs.appendFileSync(receipt.reportPath, "\ncorruption", "utf8");
    fs.appendFileSync(receipt.assessmentPath, "\ncorruption", "utf8");
    let checked = validateHistory(root);
    assert.equal(checked.valid, false);
    assert.ok(checked.errors.some((error) => error.includes("report hash mismatch")));
    assert.ok(checked.errors.some((error) => error.includes("assessment hash mismatch")));
    fs.mkdirSync(path.join(root, "records", "orphan-node"));
    checked = validateHistory(root);
    assert.ok(checked.errors.some((error) => error.includes("unindexed history nodes")));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("text assessment is deterministic, standalone, detailed, and contains no HTML shell", () => {
  const record = draft();
  const first = renderTextAssessment(record);
  const second = renderTextAssessment(record);
  assert.equal(first, second);
  assert.ok(first.length > 2000, `text assessment was unexpectedly short: ${first.length}`);
  assert.match(first, /结论先行/u);
  assert.match(first, /完整能力网络总表/u);
  assert.match(first, /四项核心评估/u);
  assert.match(first, /项目达成与六道完成门/u);
  assert.match(first, /历史轨迹与可比变化/u);
  assert.match(first, /最终判断/u);
  assert.doesNotMatch(first, /<!doctype|<html|<body/iu);
});

test("rubric changes require complete mappings and calculate delta only for comparable dimensions", () => {
  const root = tempRoot();
  try {
    saveMirrorRecord({ root, record: draft(), templatePath });
    const changed = draft("2026-08-20T12:00:00.000Z", "behavior-network-v2");
    changed.dimensions[0].score = 8.2;
    changed.dimensions[1].scoringMethod = "behavior-network-v2";
    changed.dimensions.push(
      { dimensionId: "deep-thinking", label: "深度思考能力", cluster: "上游创造", score: 8.4, confidence: "medium", scoringMethod: "behavior-network-v2", evidenceRefs: ["ev-behavior"], judgment: "能把观察推进到因果、反馈和长期后果。", limits: "缺少长期预测回读。", nextStep: "记录主张、反例与后续观察。" },
      { dimensionId: "upstream-architecture", label: "上游架构能力", cluster: "上游创造", score: 8.6, confidence: "high", scoringMethod: "behavior-network-v2", evidenceRefs: ["ev-project"], judgment: "能定义约束下游实现的源头结构。", limits: "公共接口仍需收束。", nextStep: "记录架构消费者和迁移成本。" },
      { dimensionId: "innovation", label: "创新能力", cluster: "上游创造", score: 8.1, confidence: "medium", scoringMethod: "behavior-network-v2", evidenceRefs: ["ev-project", "ev-behavior"], judgment: "能把参考素材、旧轮子和新问题重新组合。", limits: "参考素材数量与采用率未统一统计。", nextStep: "为创新保留来源、改造与验证回执。" }
    );
    changed.comparison = { dimensionMappings: [
      { previousDimensionId: "decisiveness", currentDimensionId: "decisiveness", status: "comparable", note: "含义和量表保持一致。" },
      { previousDimensionId: "correction", currentDimensionId: "correction", status: "scale-changed", note: "评分方法升级。" },
      { previousDimensionId: "learning-speed", currentDimensionId: "learning-speed", status: "comparable", note: "保持可比。" },
      { previousDimensionId: "driver-sync", currentDimensionId: "driver-sync", status: "comparable", note: "保持可比。" }
    ] };
    const receipt = saveMirrorRecord({ root, record: changed, templatePath });
    const saved = JSON.parse(fs.readFileSync(receipt.recordPath, "utf8"));
    const comparable = saved.comparison.dimensionMappings[0];
    const changedScale = saved.comparison.dimensionMappings[1];
    assert.equal(comparable.delta, 1);
    assert.equal(changedScale.delta, undefined);
    assert.equal(changedScale.comparisonLabel, "量表变化，不直接比较");
    assert.deepEqual(saved.comparison.newDimensionIds, ["deep-thinking", "upstream-architecture", "innovation"]);
    for (const dimensionId of saved.comparison.newDimensionIds) {
      assert.equal(saved.comparison.dimensionMappings.some((item) => item.currentDimensionId === dimensionId), false);
    }

    const incomplete = draft("2026-08-21T12:00:00.000Z", "behavior-network-v3");
    incomplete.comparison = { dimensionMappings: [{ previousDimensionId: "decisiveness", currentDimensionId: "decisiveness", status: "comparable" }] };
    assert.throws(() => saveMirrorRecord({ root, record: incomplete, templatePath }), /missing from dimensionMappings/u);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("sensitive fields, fabricated exact Chat tokens, and combined token totals are rejected", () => {
  const sensitive = draft();
  sensitive.rawChat = "private conversation";
  assert.ok(validateRecordObject(sensitive, { draft: true }).some((error) => error.includes("sensitive field")));
  const fakeChat = draft();
  fakeChat.tokenEconomics.sources.push({ system: "Chat", metric: "token total", value: 99, unit: "tokens", measurementType: "exact", basis: "visible characters" });
  assert.ok(validateRecordObject(fakeChat, { draft: true }).some((error) => error.includes("official export")));
  const combined = draft();
  combined.tokenEconomics.sources.push({ system: "Codex + Chat combined", metric: "token total", value: 99, unit: "tokens", measurementType: "phase-estimate", basis: "mixed sources" });
  assert.ok(validateRecordObject(combined, { draft: true }).some((error) => error.includes("may not be combined")));
});

test("generic report keeps seven chapters, exports, local-history guidance, themes, responsive gates, and valid script syntax", () => {
  const html = fs.readFileSync(templatePath, "utf8");
  const skill = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
  assert.equal((html.match(/data-panel=/gu) || []).length, 7);
  assert.match(html, /导出便携 HTML/u);
  assert.match(html, /导出便携 JSON/u);
  assert.match(html, /文字评估表单/u);
  assert.match(html, /导出 Markdown/u);
  assert.match(html, /完整能力维度评分与作用/u);
  assert.match(html, /项目完成门总表/u);
  assert.match(html, /下一阶段行动协议/u);
  assert.match(html, /核心 → 能力簇 → 当前维度/u);
  assert.match(html, /foreignObject/u);
  assert.match(html, /className = `network-node/u);
  assert.match(html, /button\.addEventListener\("click"/u);
  assert.match(html, /cluster-key/u);
  assert.match(html, /\.shell \{ width: min\(736px/u);
  assert.match(html, /\.timeline::before/u);
  assert.match(html, /\.decision-grid/u);
  assert.doesNotMatch(html, /class="network-canvas"/u);
  assert.doesNotMatch(html, /tabindex=/iu);
  assert.match(html, /权威本地履历/u);
  assert.match(html, /@media \(max-width: 1024px\)/u);
  assert.match(html, /@media \(max-width: 736px\)/u);
  assert.match(html, /360px/u);
  assert.match(html, /data-theme="auto"/u);
  assert.doesNotMatch(html, /415\.22|87\.58|9\.5\s*\/?\s*10/u);
  assert.match(skill, /深度思考能力/u);
  assert.match(skill, /上游架构能力/u);
  assert.match(skill, /创新能力/u);
  const scripts = [...html.matchAll(/<script(?<attrs>[^>]*)>(?<code>[\s\S]*?)<\/script>/gu)];
  for (const script of scripts) {
    if (/application\/json/u.test(script.groups.attrs)) continue;
    assert.doesNotThrow(() => new vm.Script(script.groups.code));
  }
});
