const MEASUREMENT_LABELS = {
  exact: "精确统计",
  "user-reported": "用户自报",
  "phase-estimate": "阶段估算",
  "behavioral-evidence-score": "行为证据评分",
  unverifiable: "不可核验"
};

const CONFIDENCE_LABELS = {
  high: "高",
  medium: "中",
  low: "低",
  unverifiable: "不可核验"
};

const STAGE_LABELS = {
  definition: "定义",
  implementation: "实现",
  automatedVerification: "自动验证",
  buildPackaging: "构建/封装",
  humanAcceptance: "人工验收",
  releaseOnlineReadback: "发布/在线回读"
};

const STATUS_LABELS = {
  complete: "完成",
  partial: "部分完成",
  blocked: "受阻",
  "not-evaluated": "未核验",
  unverifiable: "不可核验",
  "not-applicable": "不适用"
};

function present(value, fallback = "未核验") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function markdownCell(value) {
  return present(value).replaceAll("|", "\\|").replaceAll(/\r?\n/gu, "<br>");
}

function scoreLabel(dimension) {
  return Number.isFinite(dimension?.score) ? String(dimension.score) : "不评分";
}

function section(lines, heading, body = []) {
  lines.push(`## ${heading}`, "", ...body, "");
}

function evidenceSentence(dimension, evidenceById) {
  const evidence = (dimension.evidenceRefs ?? [])
    .map((id) => evidenceById.get(id))
    .filter(Boolean)
    .map((item) => `${item.label}：${item.summary}`);
  return evidence.length > 0 ? evidence.join("；") : "当前记录没有可展开的具名证据。";
}

function renderComparison(record, dimensionsById) {
  if (!record.comparison) return ["这是首个履历节点，没有前序数值变化。"];
  const rows = [
    "| 上次维度 | 当前维度 | 可比性 | 变化 | 说明 |",
    "|---|---|---|---:|---|"
  ];
  for (const mapping of record.comparison.dimensionMappings ?? []) {
    const before = dimensionsById.get(mapping.previousDimensionId)?.label ?? mapping.previousDimensionId;
    const after = mapping.currentDimensionId ? (dimensionsById.get(mapping.currentDimensionId)?.label ?? mapping.currentDimensionId) : "已退役";
    rows.push(`| ${markdownCell(before)} | ${markdownCell(after)} | ${mapping.status === "comparable" ? "可比" : "量表变化，不直接比较"} | ${markdownCell(mapping.comparisonLabel)} | ${markdownCell(mapping.note)} |`);
  }
  if ((record.comparison.newDimensionIds ?? []).length > 0) {
    rows.push("", `新增维度：${record.comparison.newDimensionIds.map((id) => dimensionsById.get(id)?.label ?? id).join("、")}。`);
  }
  return rows;
}

export function renderTextAssessment(record) {
  const lines = [];
  const evidenceById = new Map((record.evidence ?? []).map((item) => [item.evidenceId, item]));
  const dimensionsById = new Map((record.dimensions ?? []).map((item) => [item.dimensionId, item]));
  const narrative = record.narrativeAssessment ?? {};

  lines.push(
    "# Vibe Code 成长历程｜单份文字评估表单",
    "",
    `- 记录时间：${present(record.createdAt)}`,
    `- 观察窗口：${present(record.evidenceWindow?.start)}—${present(record.evidenceWindow?.end)}`,
    `- 量表版本：${present(record.rubricVersion)}`,
    `- 评分方法：${present(record.scoringMethod?.description)}`,
    `- 评估模式：从当前可用证据重新评估完整能力网络；历史节点不是评分锚点、能力上限或固定分母。`,
    ""
  );

  section(lines, "一、结论先行", [
    present(narrative.executiveSummary, record.verdict?.current),
    "",
    `**当前主要边界：** ${present(record.verdict?.limits)}`,
    "",
    `**下一阶段：** ${present(record.verdict?.next)}`
  ]);

  const scopeBody = [
    present(record.evidenceWindow?.coverageNote, "只在可访问证据范围内作结论。"),
    "",
    "本表严格区分精确统计、用户自报、阶段估算、行为证据评分和不可核验项。Chat 没有统一精确 Token 导出时，不用可见字符伪造 Token，也不与 Codex 本地 Token 直接相加。",
    "",
    "| 证据 | 类型 | 来源 | 置信度 | 摘要 |",
    "|---|---|---|---|---|"
  ];
  for (const item of record.evidence ?? []) {
    scopeBody.push(`| ${markdownCell(item.label)} | ${markdownCell(MEASUREMENT_LABELS[item.measurementType] ?? item.measurementType)} | ${markdownCell(item.sourceKind)} | ${markdownCell(CONFIDENCE_LABELS[item.confidence] ?? item.confidence)} | ${markdownCell(item.summary)} |`);
  }
  section(lines, "二、证据边界与核验口径", scopeBody);

  const dimensionRows = [
    "| 能力簇 | 维度 | 当前评分 | 置信度 | 当前判断 | 主要限制 | 下一步 |",
    "|---|---|---:|---|---|---|---|"
  ];
  for (const dimension of record.dimensions ?? []) {
    dimensionRows.push(`| ${markdownCell(dimension.cluster)} | ${markdownCell(dimension.label)} | ${markdownCell(scoreLabel(dimension))} | ${markdownCell(CONFIDENCE_LABELS[dimension.confidence] ?? dimension.confidence)} | ${markdownCell(dimension.judgment)} | ${markdownCell(dimension.limits)} | ${markdownCell(dimension.nextStep)} |`);
  }
  section(lines, "三、完整能力网络总表", dimensionRows);

  const coreBody = [];
  const coreIds = record.coreDimensionIds ?? [];
  for (const [index, dimensionId] of coreIds.entries()) {
    const dimension = dimensionsById.get(dimensionId);
    if (!dimension) continue;
    coreBody.push(
      `### ${index + 1}. ${dimension.label}｜${scoreLabel(dimension)}`,
      "",
      `**判断：** ${present(dimension.judgment)}`,
      "",
      `**证据：** ${evidenceSentence(dimension, evidenceById)}`,
      "",
      `**限制：** ${present(dimension.limits)}`,
      "",
      `**下一步：** ${present(dimension.nextStep)}`,
      ""
    );
  }
  section(lines, "四、四项核心评估", coreBody);

  for (const item of narrative.sections ?? []) {
    const body = [];
    if (item.summary) body.push(item.summary, "");
    for (const paragraph of item.paragraphs ?? []) body.push(paragraph, "");
    if ((item.dimensionIds ?? []).length > 0) {
      body.push(`关联维度：${item.dimensionIds.map((id) => dimensionsById.get(id)?.label ?? id).join("、")}。`, "");
    }
    if ((item.evidenceRefs ?? []).length > 0) {
      body.push(`证据索引：${item.evidenceRefs.map((id) => evidenceById.get(id)?.label ?? id).join("、")}。`);
    }
    section(lines, item.title, body);
  }

  const tokenRows = [
    "| 系统 | 指标 | 数值 | 类型 | 依据 | 备注 |",
    "|---|---|---:|---|---|---|"
  ];
  for (const source of record.tokenEconomics?.sources ?? []) {
    const value = source.value === null || source.value === undefined ? "不可核验" : `${source.value} ${present(source.unit, "")}`.trim();
    tokenRows.push(`| ${markdownCell(source.system)} | ${markdownCell(source.metric)} | ${markdownCell(value)} | ${markdownCell(MEASUREMENT_LABELS[source.measurementType] ?? source.measurementType)} | ${markdownCell(source.basis)} | ${markdownCell(source.note)} |`);
  }
  section(lines, "五、Token 与 Agent 经济性", [
    "各来源保持独立口径；下表没有跨来源伪合计。",
    "",
    ...tokenRows
  ]);

  const projects = record.projectPortfolio?.projects ?? [];
  const projectRows = [
    `| 项目 | ${Object.values(STAGE_LABELS).join(" | ")} |`,
    `|---|${Object.keys(STAGE_LABELS).map(() => "---").join("|")}|`
  ];
  for (const project of projects) {
    const cells = Object.keys(STAGE_LABELS).map((stageKey) => {
      const stage = project.stages?.[stageKey] ?? {};
      const status = STATUS_LABELS[stage.status] ?? present(stage.status);
      return stage.note ? `${status}：${stage.note}` : status;
    });
    projectRows.push(`| ${markdownCell(project.label)} | ${cells.map(markdownCell).join(" | ")} |`);
  }
  section(lines, "六、项目达成与六道完成门", [
    "项目完成必须分别核验定义、实现、自动验证、构建/封装、人工验收、发布/在线回读；任何单一绿灯都不能替代其余门。",
    "",
    ...projectRows
  ]);

  const timelineBody = [];
  for (const item of record.timeline ?? []) {
    timelineBody.push(`### ${present(item.period)}`, "", present(item.summary), "", `**阶段变化：** ${present(item.change)}`, "");
  }
  section(lines, "七、成长历程", timelineBody);

  section(lines, "八、历史轨迹与可比变化", renderComparison(record, dimensionsById));

  const recommendationBody = [];
  for (const [index, item] of (narrative.recommendations ?? []).entries()) {
    recommendationBody.push(
      `### ${index + 1}. ${present(item.title)}`,
      "",
      present(item.action),
      "",
      `**完成信号：** ${present(item.successSignal)}`,
      ""
    );
  }
  if (recommendationBody.length === 0) recommendationBody.push(present(record.verdict?.next));
  section(lines, "九、下一阶段行动建议", recommendationBody);

  section(lines, "十、最终判断", [
    present(narrative.closingJudgment, record.verdict?.current),
    "",
    `**不可核验项：** ${present(record.verdict?.unverifiable)}`,
    "",
    "本表是当次证据窗口下的可复核判断，不是人格标签，也不锁定下一次评分。再次核验时必须重新审查当前完整能力网络；只有量表、含义和评分方法均可比的维度才显示数值变化。"
  ]);

  return `${lines.join("\n").replaceAll(/\n{3,}/gu, "\n\n").trim()}\n`;
}
