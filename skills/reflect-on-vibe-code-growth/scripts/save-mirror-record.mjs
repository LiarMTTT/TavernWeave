import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { buildComparison, canonicalize, computeRecordHash, sha256, validateHistory, validateHistoryBeforeAppend, validateRecordObject } from "./validate-mirror-record.mjs";
import { DEFAULT_CORE_DIMENSION_IDS, renderTextAssessment } from "./render-text-assessment.mjs";

const REPORT_DATA_TOKEN = "__MIRROR_RECORD_JSON__";
const LOCK_NAME = ".mirror-save.lock";
const RECOVERY_NAME = ".mirror-recovery.lock";
const TRANSACTION_NAME = ".mirror-transaction";

function jsonText(value) { return `${JSON.stringify(value, null, 2)}\n`; }

function writeDurably(filePath, value, flag = "wx") {
  const fd = fs.openSync(filePath, flag);
  try { fs.writeFileSync(fd, value, "utf8"); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
}

function assertOwnedDirectory(root, directory, allowedNames) {
  if (path.dirname(directory) !== root || fs.lstatSync(directory).isSymbolicLink()) throw new Error("refusing an unsafe transaction or lock path");
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!allowedNames.includes(entry.name) || entry.isSymbolicLink()) throw new Error(`unexpected transaction or lock item: ${entry.name}`);
  }
}

function releaseLock(root, directory, token) {
  const ownerFile = path.join(directory, "owner.json");
  const owner = JSON.parse(fs.readFileSync(ownerFile, "utf8"));
  if (owner.token !== token) throw new Error("lock ownership changed; refusing to release it");
  assertOwnedDirectory(root, directory, ["owner.json"]);
  fs.unlinkSync(ownerFile);
  fs.rmdirSync(directory);
}

function acquireLock(root, name) {
  const directory = path.join(root, name);
  try { fs.mkdirSync(directory); }
  catch (error) {
    if (error.code === "EEXIST") throw new Error(`history is locked: ${name}; do not delete an active lock`);
    throw error;
  }
  const token = randomUUID();
  try { writeDurably(path.join(directory, "owner.json"), jsonText({ schemaVersion: 1, token, pid: process.pid, hostname: os.hostname() })); }
  catch (error) {
    const ownerFile = path.join(directory, "owner.json");
    if (fs.existsSync(ownerFile)) fs.unlinkSync(ownerFile);
    fs.rmdirSync(directory);
    throw error;
  }
  return () => releaseLock(root, directory, token);
}

function withHistoryLock(root, action, { recovering = false, staleLockToken } = {}) {
  fs.mkdirSync(root, { recursive: true });
  let releaseRecovery;
  let release;
  try {
    if (recovering) releaseRecovery = acquireLock(root, RECOVERY_NAME);
    else if (fs.existsSync(path.join(root, RECOVERY_NAME))) throw new Error("history recovery is locked; retry after it completes");
    if (staleLockToken !== undefined) {
      if (!recovering) throw new Error("a stale lock may only be reclaimed by explicit recovery");
      const lockDirectory = path.join(root, LOCK_NAME);
      assertOwnedDirectory(root, lockDirectory, ["owner.json"]);
      const owner = JSON.parse(fs.readFileSync(path.join(lockDirectory, "owner.json"), "utf8"));
      if (owner.token !== staleLockToken || owner.hostname !== os.hostname() || !Number.isSafeInteger(owner.pid) || owner.pid < 1) throw new Error("stale lock identity does not match this host and token");
      let dead = false;
      try { process.kill(owner.pid, 0); } catch (error) { if (error.code === "ESRCH") dead = true; else throw error; }
      if (!dead) throw new Error("lock owner is still running; refusing to reclaim it");
      releaseLock(root, lockDirectory, owner.token);
    }
    release = acquireLock(root, LOCK_NAME);
    // A recovery command may have begun between the first check and acquisition.
    if (!recovering && fs.existsSync(path.join(root, RECOVERY_NAME))) throw new Error("history recovery is locked; retry after it completes");
    return action();
  } finally {
    try { release?.(); } finally { releaseRecovery?.(); }
  }
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

export function saveMirrorRecord({ root, record, templatePath, faultInjector = () => {} }) {
  const resolvedRoot = path.resolve(root);
  return withHistoryLock(resolvedRoot, () => saveLocked({ resolvedRoot, record, templatePath, faultInjector }));
}

function saveLocked({ resolvedRoot, record, templatePath, faultInjector }) {
  const transactionDirectory = path.join(resolvedRoot, TRANSACTION_NAME);
  if (fs.existsSync(transactionDirectory)) throw new Error("pending mirror transaction; run explicit --recover before another save");
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
  reportView.coreDimensionIds ??= DEFAULT_CORE_DIMENSION_IDS;
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
  const entry = indexEntry(finalized, relativeDirectory);
  const currentEntries = history.empty ? [] : readIndex(resolvedRoot).entries;
  const nextIndex = { schemaVersion: 1, entries: [...currentEntries, entry] };
  const nextLatest = { schemaVersion: 1, ...entry };
  const journal = {
    schemaVersion: 1, recordId: finalized.recordId,
    priorIndex: readOptionalText(path.join(resolvedRoot, "index.json")),
    priorLatest: readOptionalText(path.join(resolvedRoot, "latest.json")),
    nextIndex, nextLatest
  };
  fs.mkdirSync(transactionDirectory);
  const stagingDirectory = path.join(transactionDirectory, "node");
  try {
    faultInjector("staging-created");
    fs.mkdirSync(stagingDirectory);
    writeDurably(path.join(stagingDirectory, "record.json"), jsonText(finalized));
    faultInjector("record-written");
    writeDurably(path.join(stagingDirectory, "report.html"), reportHtml);
    writeDurably(path.join(stagingDirectory, "assessment.md"), assessmentMarkdown);
    // Publication starts only after the complete journal is durably written and renamed.
    writeDurably(path.join(transactionDirectory, "journal.preparing"), jsonText(journal));
    fs.renameSync(path.join(transactionDirectory, "journal.preparing"), path.join(transactionDirectory, "journal.json"));
    faultInjector("journal-written");
    completeTransaction(resolvedRoot, faultInjector);
  } catch (error) {
    throw new Error(`${error.message}\npending mirror transaction retained; run explicit --recover`, { cause: error });
  }
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

function readOptionalText(file) { return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null; }

function checkTransactionDirectory(root) {
  const directory = path.join(root, TRANSACTION_NAME);
  assertOwnedDirectory(root, directory, ["node", "journal.json", "journal.preparing", "index.next", "latest.next"]);
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node" ? !entry.isDirectory() : !entry.isFile()) throw new Error(`unexpected transaction item type: ${entry.name}`);
  }
  const node = path.join(directory, "node");
  if (fs.existsSync(node)) {
    if (!fs.lstatSync(node).isDirectory() || fs.lstatSync(node).isSymbolicLink()) throw new Error("unsafe staged node");
    for (const entry of fs.readdirSync(node, { withFileTypes: true })) if (!entry.isFile() || !["record.json", "report.html", "assessment.md"].includes(entry.name)) throw new Error("unexpected staged node content");
  }
  return directory;
}

function completeTransaction(root, faultInjector = () => {}) {
  const directory = checkTransactionDirectory(root);
  const journal = JSON.parse(fs.readFileSync(path.join(directory, "journal.json"), "utf8"));
  const validPriorPointer = (value) => value === null || typeof value === "string";
  if (journal.schemaVersion !== 1 || typeof journal.recordId !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{7,95}$/u.test(journal.recordId) || !validPriorPointer(journal.priorIndex) || !validPriorPointer(journal.priorLatest)) throw new Error("invalid mirror transaction journal");
  for (const [name, prior, next] of [["index", journal.priorIndex, journal.nextIndex], ["latest", journal.priorLatest, journal.nextLatest]]) {
    const current = readOptionalText(path.join(root, `${name}.json`));
    if (current !== prior && current !== jsonText(next)) throw new Error(`${name}.json changed outside this transaction; refusing recovery`);
  }
  const priorIndex = journal.priorIndex === null ? null : JSON.parse(journal.priorIndex);
  const priorLatest = journal.priorLatest === null ? null : JSON.parse(journal.priorLatest);
  if (priorIndex?.entries?.some((entry) => entry.recordId === journal.recordId)) throw new Error("transaction attempts to overwrite a historical node");
  const history = validateHistoryBeforeAppend(root, priorIndex, priorLatest, journal.recordId);
  if (!history.valid) throw new Error(`prior history is invalid; refusing recovery:\n${history.errors.join("\n")}`);
  const staged = path.join(directory, "node");
  const finalDirectory = path.join(root, "records", journal.recordId);
  const wasPromoted = fs.existsSync(finalDirectory);
  if (wasPromoted && fs.existsSync(staged)) throw new Error("both staged and final nodes exist; refusing ambiguous recovery");
  const node = wasPromoted ? finalDirectory : staged;
  if (!fs.existsSync(node) || fs.lstatSync(node).isSymbolicLink()) throw new Error("transaction node missing or unsafe");
  const record = JSON.parse(fs.readFileSync(path.join(node, "record.json"), "utf8"));
  const errors = validateRecordObject(record, { previousRecord: history.latest });
  if (record.recordId !== journal.recordId) errors.push("transaction recordId mismatch");
  for (const [file, hash] of [["report.html", record.integrity?.reportHash], ["assessment.md", record.integrity?.assessmentHash]]) {
    if (!fs.existsSync(path.join(node, file)) || sha256(fs.readFileSync(path.join(node, file))) !== hash) errors.push(`transaction ${file} hash mismatch`);
  }
  const entry = indexEntry(record, path.join("records", journal.recordId));
  if (canonicalize(journal.nextIndex) !== canonicalize({ schemaVersion: 1, entries: [...(priorIndex?.entries ?? []), entry] }) || canonicalize(journal.nextLatest) !== canonicalize({ schemaVersion: 1, ...entry })) errors.push("transaction pointers do not append the verified node");
  if (errors.length) throw new Error(`transaction verification failed:\n${errors.join("\n")}`);
  if (!wasPromoted) {
    fs.mkdirSync(path.join(root, "records"), { recursive: true });
    fs.renameSync(staged, finalDirectory);
  }
  faultInjector("node-promoted");
  for (const [name, value] of [["index", journal.nextIndex], ["latest", journal.nextLatest]]) {
    const temp = path.join(directory, `${name}.next`);
    writeDurably(temp, jsonText(value), "w");
    faultInjector(`${name}-prepared`);
    fs.renameSync(temp, path.join(root, `${name}.json`));
    faultInjector(`${name}-written`);
  }
  const verified = validateHistory(root);
  if (!verified.valid) throw new Error(`post-save validation failed:\n${verified.errors.join("\n")}`);
  // Checked immediate child path; this only removes our transaction workspace.
  checkTransactionDirectory(root);
  fs.rmSync(directory, { recursive: true });
  return { status: "completed", root, recordId: journal.recordId, recordHash: record.integrity.recordHash };
}

export function recoverMirrorRecord({ root, staleLockToken, faultInjector = () => {} }) {
  const resolvedRoot = path.resolve(root);
  return withHistoryLock(resolvedRoot, () => {
    const directory = path.join(resolvedRoot, TRANSACTION_NAME);
    if (!fs.existsSync(directory)) {
      const history = validateHistory(resolvedRoot);
      if (!history.valid) throw new Error(`history is invalid; no journal authorizes repair:\n${history.errors.join("\n")}`);
      return { status: "no-pending-transaction", root: resolvedRoot };
    }
    checkTransactionDirectory(resolvedRoot);
    if (!fs.existsSync(path.join(directory, "journal.json"))) {
      // No complete journal means no node or pointer could have been published.
      const history = validateHistory(resolvedRoot);
      if (!history.valid) throw new Error(`history is invalid; refusing staging cleanup:\n${history.errors.join("\n")}`);
      fs.rmSync(directory, { recursive: true });
      return { status: "discarded-incomplete-staging", root: resolvedRoot };
    }
    return completeTransaction(resolvedRoot, faultInjector);
  }, { recovering: true, staleLockToken });
}

function readIndex(root) {
  return JSON.parse(fs.readFileSync(path.join(root, "index.json"), "utf8"));
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--recover") args.recover = true;
    else if (item.startsWith("--")) args[item.slice(2)] = argv[++index];
    else throw new Error(`unexpected argument: ${item}`);
  }
  for (const required of args.recover ? ["root"] : ["root", "record", "template"]) if (!args[required]) throw new Error(`missing --${required}`);
  if (args["stale-lock-token"] && !args.recover) throw new Error("--stale-lock-token requires --recover");
  return args;
}

function isDirectRun() {
  return process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
}

if (isDirectRun()) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const receipt = args.recover
      ? recoverMirrorRecord({ root: args.root, staleLockToken: args["stale-lock-token"] })
      : saveMirrorRecord({ root: args.root, record: JSON.parse(fs.readFileSync(path.resolve(args.record), "utf8")), templatePath: args.template });
    console.log(JSON.stringify(receipt, null, 2));
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}
