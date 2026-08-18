import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MEASUREMENT_TYPES = new Set(["exact", "user-reported", "phase-estimate", "behavioral-evidence-score", "unverifiable"]);
const CONFIDENCE_VALUES = new Set(["high", "medium", "low", "unverifiable"]);
const STAGE_STATUSES = new Set(["complete", "partial", "blocked", "not-evaluated", "not-applicable", "unverifiable"]);
const STAGE_KEYS = ["definition", "implementation", "automatedVerification", "buildPackaging", "humanAcceptance", "releaseOnlineReadback"];
const MAPPING_STATUSES = new Set(["comparable", "scale-changed", "merged", "retired"]);
const SENSITIVE_KEY = /^(?:rawChat|fullTranscript|completeChat|conversationDump|privateLog|rawLog|apiKey|accessToken|clientSecret|password|credential|credentials|secret|sessionKey|cookie|authorization)$/iu;
const SECRET_LITERAL = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*["'][^"']{8,}["']/iu;

export function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function computeRecordHash(record) {
  const material = structuredClone(record);
  if (material.integrity) delete material.integrity.recordHash;
  return sha256(canonicalize(material));
}

function add(errors, condition, message) {
  if (!condition) errors.push(message);
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validDate(value, dateOnly = false) {
  if (typeof value !== "string") return false;
  if (dateOnly && !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  return Number.isFinite(Date.parse(value));
}

function scanSensitive(value, errors, pointer = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanSensitive(item, errors, `${pointer}[${index}]`));
    return;
  }
  if (!isObject(value)) {
    if (typeof value === "string" && SECRET_LITERAL.test(value)) errors.push(`sensitive literal is forbidden at ${pointer}`);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) errors.push(`sensitive field is forbidden: ${pointer}.${key}`);
    scanSensitive(child, errors, `${pointer}.${key}`);
  }
}

function scaleFor(record, dimension) {
  return dimension.scoreScale ?? record.scoringMethod?.scoreScale;
}

function sameScale(left, right) {
  return isObject(left) && isObject(right) && left.min === right.min && left.max === right.max;
}

function dimensionMap(record) {
  return new Map((record.dimensions ?? []).map((item) => [item.dimensionId, item]));
}

export function buildComparison(current, previous, requestedMappings) {
  if (!previous) return undefined;
  const prior = dimensionMap(previous);
  const now = dimensionMap(current);
  const rubricChanged = current.rubricVersion !== previous.rubricVersion;
  let mappings = requestedMappings;

  if (!Array.isArray(mappings) || mappings.length === 0) {
    if (rubricChanged) throw new Error("rubricVersion changed; dimensionMappings are required");
    mappings = [];
    for (const [previousDimensionId, previousDimension] of prior) {
      const currentDimension = now.get(previousDimensionId);
      if (!currentDimension) {
        mappings.push({ previousDimensionId, currentDimensionId: null, status: "retired", note: "旧维度在当前量表中退役。" });
      } else if (previousDimension.scoringMethod === currentDimension.scoringMethod && sameScale(scaleFor(previous, previousDimension), scaleFor(current, currentDimension))) {
        mappings.push({ previousDimensionId, currentDimensionId: previousDimensionId, status: "comparable", note: "维度含义、量表与评分方法保持可比。" });
      } else {
        mappings.push({ previousDimensionId, currentDimensionId: previousDimensionId, status: "scale-changed", note: "评分方法或量表发生变化。" });
      }
    }
  }

  const seenPrevious = new Set();
  const mappedCurrent = new Set();
  const normalized = mappings.map((mapping, index) => {
    const previousDimensionId = mapping.previousDimensionId;
    const currentDimensionId = mapping.currentDimensionId ?? null;
    if (!prior.has(previousDimensionId)) throw new Error(`dimension mapping ${index} names unknown previous dimension: ${previousDimensionId}`);
    if (seenPrevious.has(previousDimensionId)) throw new Error(`previous dimension mapped more than once: ${previousDimensionId}`);
    seenPrevious.add(previousDimensionId);
    if (!MAPPING_STATUSES.has(mapping.status)) throw new Error(`invalid dimension mapping status: ${mapping.status}`);
    if (mapping.status === "retired") {
      if (currentDimensionId !== null) throw new Error(`retired mapping must not name a current dimension: ${previousDimensionId}`);
    } else {
      if (!now.has(currentDimensionId)) throw new Error(`dimension mapping ${index} names unknown current dimension: ${currentDimensionId}`);
      mappedCurrent.add(currentDimensionId);
    }

    const output = {
      previousDimensionId,
      currentDimensionId,
      status: mapping.status,
      note: String(mapping.note ?? "")
    };
    if (mapping.status === "comparable") {
      const before = prior.get(previousDimensionId);
      const after = now.get(currentDimensionId);
      if (before.scoringMethod !== after.scoringMethod || !sameScale(scaleFor(previous, before), scaleFor(current, after))) {
        throw new Error(`comparable mapping changed scale or scoring method: ${previousDimensionId}`);
      }
      if (!Number.isFinite(before.score) || !Number.isFinite(after.score)) throw new Error(`comparable mapping requires numeric scores: ${previousDimensionId}`);
      output.delta = Number((after.score - before.score).toFixed(6));
      output.comparisonLabel = output.delta === 0 ? "无数值变化" : output.delta > 0 ? `+${output.delta}` : String(output.delta);
    } else {
      output.comparisonLabel = "量表变化，不直接比较";
    }
    return output;
  });

  for (const previousDimensionId of prior.keys()) {
    if (!seenPrevious.has(previousDimensionId)) throw new Error(`previous dimension is missing from dimensionMappings: ${previousDimensionId}`);
  }
  return {
    previousRecordId: previous.recordId,
    rubricChanged,
    dimensionMappings: normalized,
    newDimensionIds: [...now.keys()].filter((dimensionId) => !mappedCurrent.has(dimensionId))
  };
}

export function validateRecordObject(record, { draft = false, previousRecord = null } = {}) {
  const errors = [];
  add(errors, isObject(record), "record must be an object");
  if (!isObject(record)) return errors;
  scanSensitive(record, errors);
  add(errors, record.schemaVersion === 1 || record.schemaVersion === 2, "schemaVersion must be 1 or 2");
  if (!draft) add(errors, typeof record.recordId === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]{7,95}$/u.test(record.recordId), "recordId is invalid");
  add(errors, validDate(record.createdAt), "createdAt must be an ISO date-time");
  add(errors, record.title === "Vibe Code 成长历程", "title must be Vibe Code 成长历程");
  add(errors, record.assessmentMode === "full-current-evidence-reassessment", "assessmentMode must require a full current-evidence reassessment");
  add(errors, typeof record.rubricVersion === "string" && record.rubricVersion.length > 0, "rubricVersion is required");
  add(errors, isObject(record.evidenceWindow) && validDate(record.evidenceWindow?.start, true) && validDate(record.evidenceWindow?.end, true), "evidenceWindow start/end must be dates");
  if (validDate(record.evidenceWindow?.start, true) && validDate(record.evidenceWindow?.end, true)) add(errors, record.evidenceWindow.start <= record.evidenceWindow.end, "evidenceWindow start must not be after end");
  add(errors, isObject(record.scoringMethod) && typeof record.scoringMethod?.id === "string" && typeof record.scoringMethod?.description === "string", "scoringMethod id and description are required");
  add(errors, Number.isFinite(record.scoringMethod?.scoreScale?.min) && Number.isFinite(record.scoringMethod?.scoreScale?.max) && record.scoringMethod.scoreScale.min < record.scoringMethod.scoreScale.max, "scoringMethod scoreScale is invalid");

  if (record.schemaVersion === 2) {
    const narrative = record.narrativeAssessment;
    add(errors, isObject(narrative), "schemaVersion 2 requires narrativeAssessment");
    if (isObject(narrative)) {
      add(errors, typeof narrative.executiveSummary === "string" && narrative.executiveSummary.length >= 40, "narrativeAssessment.executiveSummary must be substantive");
      add(errors, Array.isArray(narrative.sections) && narrative.sections.length >= 4, "narrativeAssessment.sections must contain at least four sections");
      add(errors, Array.isArray(narrative.recommendations) && narrative.recommendations.length > 0, "narrativeAssessment.recommendations must be a non-empty array");
      add(errors, typeof narrative.closingJudgment === "string" && narrative.closingJudgment.length >= 40, "narrativeAssessment.closingJudgment must be substantive");
    }
  }

  const evidenceIds = new Set();
  add(errors, Array.isArray(record.evidence), "evidence must be an array");
  for (const [index, item] of (record.evidence ?? []).entries()) {
    add(errors, typeof item.evidenceId === "string" && item.evidenceId.length > 1, `evidence[${index}].evidenceId is required`);
    if (evidenceIds.has(item.evidenceId)) errors.push(`duplicate evidenceId: ${item.evidenceId}`);
    evidenceIds.add(item.evidenceId);
    add(errors, typeof item.label === "string" && item.label.length > 0, `evidence[${index}].label is required`);
    add(errors, MEASUREMENT_TYPES.has(item.measurementType), `evidence[${index}].measurementType is invalid`);
    add(errors, typeof item.sourceKind === "string" && item.sourceKind.length > 0, `evidence[${index}].sourceKind is required`);
    add(errors, typeof item.summary === "string" && item.summary.length > 0, `evidence[${index}].summary is required`);
    add(errors, CONFIDENCE_VALUES.has(item.confidence), `evidence[${index}].confidence is invalid`);
  }

  const dimensionIds = new Set();
  add(errors, Array.isArray(record.dimensions) && record.dimensions.length > 0, "dimensions must be a non-empty array");
  for (const [index, dimension] of (record.dimensions ?? []).entries()) {
    add(errors, typeof dimension.dimensionId === "string" && /^[a-z][a-z0-9-]*$/u.test(dimension.dimensionId), `dimensions[${index}].dimensionId is invalid`);
    if (dimensionIds.has(dimension.dimensionId)) errors.push(`duplicate dimensionId: ${dimension.dimensionId}`);
    dimensionIds.add(dimension.dimensionId);
    add(errors, typeof dimension.label === "string" && dimension.label.length > 0, `dimensions[${index}].label is required`);
    add(errors, typeof dimension.cluster === "string" && dimension.cluster.length > 0, `dimensions[${index}].cluster is required`);
    add(errors, dimension.score === undefined || Number.isFinite(dimension.score), `dimensions[${index}].score must be numeric or omitted`);
    add(errors, CONFIDENCE_VALUES.has(dimension.confidence), `dimensions[${index}].confidence is invalid`);
    add(errors, typeof dimension.scoringMethod === "string" && dimension.scoringMethod.length > 0, `dimensions[${index}].scoringMethod is required`);
    add(errors, Array.isArray(dimension.evidenceRefs), `dimensions[${index}].evidenceRefs must be an array`);
    for (const ref of dimension.evidenceRefs ?? []) if (!evidenceIds.has(ref)) errors.push(`dimension ${dimension.dimensionId} references missing evidence: ${ref}`);
    add(errors, typeof dimension.judgment === "string" && dimension.judgment.length > 0, `dimensions[${index}].judgment is required`);
  }

  for (const [index, section] of (record.narrativeAssessment?.sections ?? []).entries()) {
    add(errors, typeof section.sectionId === "string" && /^[a-z][a-z0-9-]*$/u.test(section.sectionId), `narrative section ${index} sectionId is invalid`);
    add(errors, typeof section.title === "string" && section.title.length > 0, `narrative section ${index} title is required`);
    add(errors, typeof section.summary === "string" && section.summary.length > 0, `narrative section ${index} summary is required`);
    add(errors, Array.isArray(section.paragraphs) && section.paragraphs.length > 0, `narrative section ${index} paragraphs must be a non-empty array`);
    add(errors, Array.isArray(section.evidenceRefs), `narrative section ${index} evidenceRefs must be an array`);
    add(errors, Array.isArray(section.dimensionIds), `narrative section ${index} dimensionIds must be an array`);
    for (const ref of section.evidenceRefs ?? []) if (!evidenceIds.has(ref)) errors.push(`narrative section ${section.sectionId} references missing evidence: ${ref}`);
    for (const id of section.dimensionIds ?? []) if (!dimensionIds.has(id)) errors.push(`narrative section ${section.sectionId} references missing dimension: ${id}`);
  }
  for (const [index, recommendation] of (record.narrativeAssessment?.recommendations ?? []).entries()) {
    add(errors, typeof recommendation.title === "string" && recommendation.title.length > 0, `recommendation ${index} title is required`);
    add(errors, typeof recommendation.action === "string" && recommendation.action.length > 0, `recommendation ${index} action is required`);
    add(errors, typeof recommendation.successSignal === "string" && recommendation.successSignal.length > 0, `recommendation ${index} successSignal is required`);
  }

  for (const [index, source] of (record.tokenEconomics?.sources ?? []).entries()) {
    add(errors, MEASUREMENT_TYPES.has(source.measurementType), `tokenEconomics.sources[${index}].measurementType is invalid`);
    const tokenMetric = /token/iu.test(String(source.metric));
    const chatSource = /^chat(?:gpt)?$/iu.test(String(source.system));
    if (tokenMetric && chatSource && source.measurementType === "exact" && !/official[- ]export/iu.test(String(source.basis))) {
      errors.push(`Chat token source ${index} cannot be exact without an official export`);
    }
    if (tokenMetric && /combined|codex\s*\+\s*chat/iu.test(String(source.system))) errors.push(`Codex and Chat token totals may not be combined at source ${index}`);
  }

  add(errors, isObject(record.projectPortfolio) && Array.isArray(record.projectPortfolio?.projects), "projectPortfolio.projects must be an array");
  for (const [projectIndex, project] of (record.projectPortfolio?.projects ?? []).entries()) {
    add(errors, typeof project.projectId === "string" && project.projectId.length > 0, `project ${projectIndex} projectId is required`);
    add(errors, typeof project.label === "string" && project.label.length > 0, `project ${projectIndex} label is required`);
    for (const stageKey of STAGE_KEYS) {
      const stage = project.stages?.[stageKey];
      add(errors, isObject(stage), `project ${project.projectId} stage ${stageKey} is required`);
      if (isObject(stage)) {
        add(errors, STAGE_STATUSES.has(stage.status), `project ${project.projectId} stage ${stageKey} status is invalid`);
        add(errors, Array.isArray(stage.evidenceRefs), `project ${project.projectId} stage ${stageKey} evidenceRefs must be an array`);
        for (const ref of stage.evidenceRefs ?? []) if (!evidenceIds.has(ref)) errors.push(`project ${project.projectId} stage ${stageKey} references missing evidence: ${ref}`);
      }
    }
  }

  if (previousRecord) {
    try {
      const expected = buildComparison(record, previousRecord, record.comparison?.dimensionMappings);
      if (canonicalize(record.comparison) !== canonicalize(expected)) errors.push("comparison does not match the previous record and declared dimension mappings");
    } catch (error) {
      errors.push(error.message);
    }
  } else if (record.comparison !== undefined) {
    errors.push("first record must not contain comparison data");
  }

  if (!draft) {
    add(errors, isObject(record.integrity), "integrity is required");
    if (isObject(record.integrity)) {
      add(errors, record.integrity.algorithm === "sha256", "integrity.algorithm must be sha256");
      add(errors, /^[a-f0-9]{64}$/u.test(String(record.integrity.recordHash)), "integrity.recordHash is invalid");
      add(errors, /^[a-f0-9]{64}$/u.test(String(record.integrity.reportHash)), "integrity.reportHash is invalid");
      if (record.schemaVersion === 2) add(errors, /^[a-f0-9]{64}$/u.test(String(record.integrity.assessmentHash)), "integrity.assessmentHash is required for schemaVersion 2");
      else if (record.integrity.assessmentHash !== undefined) add(errors, /^[a-f0-9]{64}$/u.test(String(record.integrity.assessmentHash)), "integrity.assessmentHash is invalid");
      add(errors, record.integrity.previousRecordId === (previousRecord?.recordId ?? null), "integrity.previousRecordId does not match chain");
      add(errors, record.integrity.previousRecordHash === (previousRecord?.integrity?.recordHash ?? null), "integrity.previousRecordHash does not match chain");
      add(errors, computeRecordHash(record) === record.integrity.recordHash, "record hash mismatch");
    }
  }
  return errors;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function expectedIndexEntry(record, relativeDirectory) {
  const entry = {
    recordId: record.recordId,
    directory: relativeDirectory.replaceAll("\\", "/"),
    recordHash: record.integrity.recordHash,
    reportHash: record.integrity.reportHash,
    rubricVersion: record.rubricVersion,
    evidenceWindow: record.evidenceWindow,
    previousRecordId: record.integrity.previousRecordId,
    previousRecordHash: record.integrity.previousRecordHash
  };
  if (record.integrity.assessmentHash) entry.assessmentHash = record.integrity.assessmentHash;
  return entry;
}

export function validateHistory(root) {
  const resolvedRoot = path.resolve(root);
  const errors = [];
  const indexPath = path.join(resolvedRoot, "index.json");
  const latestPath = path.join(resolvedRoot, "latest.json");
  const recordsRoot = path.join(resolvedRoot, "records");
  const hasIndex = fs.existsSync(indexPath);
  const hasLatest = fs.existsSync(latestPath);
  const directories = fs.existsSync(recordsRoot) ? fs.readdirSync(recordsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort() : [];

  if (!hasIndex && !hasLatest && directories.length === 0) return { valid: true, empty: true, errors: [], records: [], latest: null, root: resolvedRoot };
  if (!hasIndex || !hasLatest) return { valid: false, empty: false, errors: ["index.json and latest.json must either both exist or both be absent"], records: [], latest: null, root: resolvedRoot };

  let index;
  let latest;
  try { index = readJson(indexPath); } catch (error) { errors.push(`invalid index.json: ${error.message}`); }
  try { latest = readJson(latestPath); } catch (error) { errors.push(`invalid latest.json: ${error.message}`); }
  if (!index || !latest) return { valid: false, empty: false, errors, records: [], latest: null, root: resolvedRoot };
  add(errors, index.schemaVersion === 1 && Array.isArray(index.entries), "index.json schema is invalid");
  const records = [];
  const indexedDirectories = [];
  let previous = null;

  for (const [position, entry] of (index.entries ?? []).entries()) {
    const directory = String(entry.directory ?? "");
    const absoluteDirectory = path.resolve(resolvedRoot, directory);
    const recordsPrefix = path.resolve(recordsRoot) + path.sep;
    if (!absoluteDirectory.startsWith(recordsPrefix)) {
      errors.push(`index entry ${position} escapes records root`);
      continue;
    }
    indexedDirectories.push(path.basename(absoluteDirectory));
    const recordPath = path.join(absoluteDirectory, "record.json");
    const reportPath = path.join(absoluteDirectory, "report.html");
    const assessmentPath = path.join(absoluteDirectory, "assessment.md");
    if (!fs.existsSync(recordPath) || !fs.existsSync(reportPath)) {
      errors.push(`record node is incomplete: ${directory}`);
      continue;
    }
    let record;
    try { record = readJson(recordPath); } catch (error) { errors.push(`invalid record JSON at ${directory}: ${error.message}`); continue; }
    const recordErrors = validateRecordObject(record, { previousRecord: previous });
    errors.push(...recordErrors.map((message) => `${record.recordId ?? directory}: ${message}`));
    const reportHash = sha256(fs.readFileSync(reportPath));
    if (reportHash !== record.integrity?.reportHash) errors.push(`${record.recordId}: report hash mismatch`);
    if (record.integrity?.assessmentHash) {
      if (!fs.existsSync(assessmentPath)) errors.push(`${record.recordId}: assessment.md is missing`);
      else if (sha256(fs.readFileSync(assessmentPath)) !== record.integrity.assessmentHash) errors.push(`${record.recordId}: assessment hash mismatch`);
    } else if (fs.existsSync(assessmentPath)) {
      errors.push(`${record.recordId}: assessment.md exists without an integrity hash`);
    }
    const expected = expectedIndexEntry(record, directory);
    if (canonicalize(entry) !== canonicalize(expected)) errors.push(`${record.recordId}: index entry does not match immutable record metadata`);
    records.push({ record, recordPath, reportPath, assessmentPath: record.integrity?.assessmentHash ? assessmentPath : null });
    previous = record;
  }

  if (canonicalize([...directories].sort()) !== canonicalize([...indexedDirectories].sort())) errors.push("records directory contains missing or unindexed history nodes");
  const finalEntry = index.entries?.at(-1) ?? null;
  add(errors, Boolean(finalEntry), "index.json must contain at least one record");
  if (finalEntry) {
    const expectedLatest = { schemaVersion: 1, ...finalEntry };
    if (canonicalize(latest) !== canonicalize(expectedLatest)) errors.push("latest.json does not point to the final indexed node");
  }
  return { valid: errors.length === 0, empty: false, errors, records, latest: records.at(-1)?.record ?? null, root: resolvedRoot };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--json") args.json = true;
    else if (item.startsWith("--")) args[item.slice(2)] = argv[++index];
    else if (!args.root) args.root = item;
    else throw new Error(`unexpected argument: ${item}`);
  }
  if (!args.root) throw new Error("usage: node validate-mirror-record.mjs --root <history-root> [--json]");
  return args;
}

function isDirectRun() {
  return process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
}

if (isDirectRun()) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = validateHistory(args.root);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else if (result.valid) console.log(`Mirror history valid: ${result.records.length} record(s) at ${result.root}`);
    else result.errors.forEach((error) => console.error(`ERROR: ${error}`));
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}
