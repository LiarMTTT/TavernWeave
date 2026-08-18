import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildComparison, canonicalize, computeRecordHash, sha256, validateHistory, validateRecordObject } from "./validate-mirror-record.mjs";
import { renderTextAssessment } from "./render-text-assessment.mjs";

const REPORT_DATA_TOKEN = "__MIRROR_RECORD_JSON__";

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
}

function replaceJsonAtomically(filePath, value) {
  const tempPath = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function safeEmbeddedJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
}

function deriveRecordId(draft) {
  const stamp = new Date(draft.createdAt).toISOString().replaceAll(/[-:]/gu, "").replace(".000", "");
  const fingerprint = sha256(canonicalize(draft)).slice(0, 10);
  return `${stamp}-${fingerprint}`;
}

function indexEntry(record, directory) {
  const entry = {
    recordId: record.recordId,
    directory: directory.replaceAll("\\", "/"),
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

export function saveMirrorRecord({ root, record, templatePath }) {
  const resolvedRoot = path.resolve(root);
  const history = validateHistory(resolvedRoot);
  if (!history.valid) throw new Error(`existing mirror history is invalid; refusing append:\n${history.errors.join("\n")}`);
  const previous = history.latest;
  const draft = structuredClone(record);
  delete draft.integrity;
  if (!draft.recordId) draft.recordId = deriveRecordId(draft);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{7,95}$/u.test(draft.recordId)) throw new Error("recordId is invalid");
  if (previous) draft.comparison = buildComparison(draft, previous, draft.comparison?.dimensionMappings);
  else delete draft.comparison;
  const draftErrors = validateRecordObject(draft, { draft: true, previousRecord: previous });
  if (draftErrors.length > 0) throw new Error(`record draft is invalid:\n${draftErrors.join("\n")}`);

  const template = fs.readFileSync(path.resolve(templatePath), "utf8");
  const tokenCount = template.split(REPORT_DATA_TOKEN).length - 1;
  if (tokenCount !== 1) throw new Error(`report template must contain exactly one ${REPORT_DATA_TOKEN} token`);
  const assessmentMarkdown = renderTextAssessment(draft);
  const assessmentHash = sha256(Buffer.from(assessmentMarkdown, "utf8"));
  const reportView = structuredClone(draft);
  reportView.portableCopy = true;
  reportView.textAssessmentMarkdown = assessmentMarkdown;
  const reportHtml = template.replace(REPORT_DATA_TOKEN, safeEmbeddedJson(reportView));
  const reportHash = sha256(Buffer.from(reportHtml, "utf8"));
  const finalized = {
    ...draft,
    integrity: {
      algorithm: "sha256",
      recordHash: "",
      reportHash,
      assessmentHash,
      previousRecordId: previous?.recordId ?? null,
      previousRecordHash: previous?.integrity?.recordHash ?? null
    }
  };
  finalized.integrity.recordHash = computeRecordHash(finalized);
  const finalErrors = validateRecordObject(finalized, { previousRecord: previous });
  if (finalErrors.length > 0) throw new Error(`final record is invalid:\n${finalErrors.join("\n")}`);

  const recordsRoot = path.join(resolvedRoot, "records");
  const finalDirectory = path.join(recordsRoot, finalized.recordId);
  const relativeDirectory = path.relative(resolvedRoot, finalDirectory);
  if (fs.existsSync(finalDirectory)) throw new Error(`append-only refusal: record already exists: ${finalized.recordId}`);
  fs.mkdirSync(recordsRoot, { recursive: true });
  const stagingDirectory = path.join(resolvedRoot, `.staging-${finalized.recordId}`);
  if (fs.existsSync(stagingDirectory)) throw new Error(`staging path already exists: ${stagingDirectory}`);
  fs.mkdirSync(stagingDirectory);
  try {
    writeJson(path.join(stagingDirectory, "record.json"), finalized);
    fs.writeFileSync(path.join(stagingDirectory, "report.html"), reportHtml, { encoding: "utf8", flag: "wx" });
    fs.writeFileSync(path.join(stagingDirectory, "assessment.md"), assessmentMarkdown, { encoding: "utf8", flag: "wx" });
    fs.renameSync(stagingDirectory, finalDirectory);
  } catch (error) {
    if (fs.existsSync(stagingDirectory)) fs.rmSync(stagingDirectory, { recursive: true, force: true });
    throw error;
  }

  const entry = indexEntry(finalized, relativeDirectory);
  const currentEntries = history.empty ? [] : readIndex(resolvedRoot).entries;
  const nextIndex = { schemaVersion: 1, entries: [...currentEntries, entry] };
  const nextLatest = { schemaVersion: 1, ...entry };
  const indexPath = path.join(resolvedRoot, "index.json");
  const latestPath = path.join(resolvedRoot, "latest.json");
  if (history.empty) {
    writeJson(indexPath, nextIndex);
    writeJson(latestPath, nextLatest);
  } else {
    replaceJsonAtomically(indexPath, nextIndex);
    replaceJsonAtomically(latestPath, nextLatest);
  }

  const verified = validateHistory(resolvedRoot);
  if (!verified.valid) throw new Error(`post-save validation failed:\n${verified.errors.join("\n")}`);
  return {
    root: resolvedRoot,
    recordId: finalized.recordId,
    recordPath: path.join(finalDirectory, "record.json"),
    reportPath: path.join(finalDirectory, "report.html"),
    assessmentPath: path.join(finalDirectory, "assessment.md"),
    recordHash: finalized.integrity.recordHash,
    reportHash,
    assessmentHash,
    previousRecordId: finalized.integrity.previousRecordId,
    rubricVersion: finalized.rubricVersion,
    evidenceWindow: finalized.evidenceWindow
  };
}

function readIndex(root) {
  return JSON.parse(fs.readFileSync(path.join(root, "index.json"), "utf8"));
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item.startsWith("--")) args[item.slice(2)] = argv[++index];
    else throw new Error(`unexpected argument: ${item}`);
  }
  for (const required of ["root", "record", "template"]) if (!args[required]) throw new Error(`missing --${required}`);
  return args;
}

function isDirectRun() {
  return process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
}

if (isDirectRun()) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const record = JSON.parse(fs.readFileSync(path.resolve(args.record), "utf8"));
    const receipt = saveMirrorRecord({ root: args.root, record, templatePath: args.template });
    console.log(JSON.stringify(receipt, null, 2));
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}
