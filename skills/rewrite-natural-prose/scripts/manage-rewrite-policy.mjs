#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

export const VERSION = "1.4.0";
export const HOST_FILES = Object.freeze({ codex: "AGENTS.md", claude: "CLAUDE.md" });
const directory = path.dirname(fileURLToPath(import.meta.url));
const body = fs.readFileSync(path.join(directory, "../assets/rewrite-policy.md"), "utf8").trimEnd();
const begin = "<!-- tavernweave-rewrite-policy:begin";
const end = "<!-- tavernweave-rewrite-policy:end -->";
const hash = value => createHash("sha256").update(value).digest("hex");
const samePath = (a, b) => process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;

function absolute(value, label) {
  if (typeof value !== "string" || !path.isAbsolute(value)) throw new Error(`${label} must be an explicit absolute path`);
  return path.resolve(value);
}

function noLinks(target) {
  for (let current = target; ; current = path.dirname(current)) {
    try {
      if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`Refusing linked path: ${current}`);
    } catch (error) { if (error.code !== "ENOENT") throw error; }
    if (path.dirname(current) === current) break;
  }
}

function read(target) {
  noLinks(target);
  let bytes;
  try { bytes = fs.readFileSync(target); }
  catch (error) {
    if (error.code !== "ENOENT") throw error;
    return { exists: false, bytes: Buffer.alloc(0), text: "", bom: false, newline: "\n", digest: "missing" };
  }
  const bom = bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]));
  let text;
  try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes.subarray(bom ? 3 : 0)); }
  catch { throw new Error(`Instruction file is not valid UTF-8: ${target}`); }
  return { exists: true, bytes, text, bom, newline: text.match(/\r\n|\n|\r/u)?.[0] || "\n", digest: hash(bytes) };
}

function encode(text, bom) {
  return Buffer.concat([bom ? Buffer.from([0xef, 0xbb, 0xbf]) : Buffer.alloc(0), Buffer.from(text, "utf8")]);
}

export function resolveTarget(options) {
  if (!Object.hasOwn(HOST_FILES, options.host)) throw new Error("Supported hosts are codex and claude; DSH persistence is unavailable");
  if (!["workspace", "client"].includes(options.scope)) throw new Error("scope must be workspace or client");
  const root = absolute(options.scopeRoot, "scope root");
  const target = absolute(options.target, "target");
  noLinks(root);
  if (!fs.statSync(root).isDirectory()) throw new Error("scope root must be an existing directory");
  noLinks(target);
  let candidates;
  if (options.host === "codex") {
    const fallbacks = options.scope === "workspace" ? options.fallbackNames : [];
    if (!Array.isArray(fallbacks)) throw new Error("Confirm effective project_doc_fallback_filenames and pass --fallback-names (use [] when empty)");
    for (const name of fallbacks) {
      if (typeof name !== "string" || !name || /[\\/\r\n:]/u.test(name) || name === "." || name === "..") throw new Error("Fallback names must be simple filenames");
    }
    candidates = [...new Set(["AGENTS.override.md", HOST_FILES.codex, ...fallbacks])].map(name => path.join(root, name));
    const effective = candidates.find(file => read(file).text.trim().length) || path.join(root, HOST_FILES.codex);
    if (!samePath(effective, target)) throw new Error(`Target is shadowed or unsupported; effective target is ${effective}`);
  } else {
    const names = options.scope === "workspace" ? [HOST_FILES.claude, ".claude/CLAUDE.md", "CLAUDE.local.md"] : [HOST_FILES.claude];
    candidates = names.map(name => path.join(root, name));
    if (!candidates.some(file => samePath(file, target))) throw new Error("Unsupported Claude instruction target for this scope");
  }
  return { root, target, discovery: candidates.map(file => ({ path: file, digest: read(file).digest })) };
}

function block(scope, separator, newline) {
  return `${begin} version=${VERSION} scope=${scope} separator=${separator} -->\n${body}\n${end}\n`.replace(/\n/gu, newline);
}

function inspect(state, scope) {
  const begins = state.text.split(begin).length - 1;
  const ends = state.text.split(end).length - 1;
  if (begins === 0 && ends === 0) return { status: state.exists ? "missing-block" : "missing-file", match: null };
  if (begins !== 1 || ends !== 1) return { status: "invalid-markers", match: null };
  const pattern = /^<!-- tavernweave-rewrite-policy:begin version=([0-9A-Za-z.+-]+) scope=(workspace|client) separator=([01]) -->(?:\r\n|\n|\r)[\s\S]*?^<!-- tavernweave-rewrite-policy:end -->[ \t]*(?:\r\n|\n|\r|$)/gmu;
  const match = pattern.exec(state.text);
  if (!match || match[2] !== scope) return { status: "invalid-markers", match: null };
  const status = match[0] === block(scope, match[3], state.newline) ? "current" : match[1] === VERSION ? "drifted" : "outdated";
  if (match[3] === "1" && !state.text.slice(0, match.index).endsWith(state.newline)) return { status: "invalid-markers", match: null };
  return { status, match };
}

function proposal(options, operation) {
  const resolved = resolveTarget(options);
  const state = read(resolved.target);
  const current = inspect(state, options.scope);
  let next = state.text;
  let replacement = "";
  if (current.status !== "invalid-markers") {
    if (current.match) {
      const match = current.match;
      let prefix = state.text.slice(0, match.index);
      const suffix = state.text.slice(match.index + match[0].length);
      if (operation === "enable") replacement = block(options.scope, match[3], state.newline);
      else if (match[3] === "1" && !suffix.length) prefix = prefix.slice(0, -state.newline.length);
      next = prefix + replacement + suffix;
    } else if (operation === "enable") {
      const separator = state.text.length && !/[\r\n]$/u.test(state.text) ? "1" : "0";
      replacement = block(options.scope, separator, state.newline);
      next = state.text + (separator === "1" ? state.newline : "") + replacement;
    }
  }
  const bytes = encode(next, state.bom);
  const changed = !bytes.equals(state.bytes);
  const token = hash(JSON.stringify({ operation, host: options.host, scope: options.scope, ...resolved, before: state.digest, after: hash(bytes), template: hash(body) }));
  return { resolved, state, current, bytes, token, changed, diff: { before: current.match?.[0] || "", after: replacement } };
}

export function managePolicy(options) {
  const action = options.action || "check";
  if (!["check", "preview", "enable", "disable"].includes(action)) throw new Error("Invalid action");
  const mutation = action === "enable" || action === "disable";
  const operation = mutation ? action : options.operation || "enable";
  if (!["enable", "disable"].includes(operation)) throw new Error("operation must be enable or disable");
  let proposed = proposal(options, operation);
  if (action !== "check" && proposed.current.status === "invalid-markers") throw new Error("Invalid, duplicate, or mismatched-scope policy markers; repair requires a separate reviewed edit");
  let backupPath = null;
  let changed = false;
  if (mutation) {
    if (options.approved !== true) throw new Error("Driver approval of the concrete preview is required");
    if (options.expectedToken !== proposed.token) throw new Error("Preview token is missing or stale; re-preview the operation");
    const backupDirectory = absolute(options.backupDir, "backup directory");
    noLinks(backupDirectory);
    if (proposed.changed) {
      const target = proposed.resolved.target;
      const parent = path.dirname(target);
      fs.mkdirSync(parent, { recursive: true });
      noLinks(target);
      const lockPath = `${target}.tw-rewrite.lock`;
      const lock = fs.openSync(lockPath, "wx", 0o600);
      const temporary = `${target}.${randomUUID()}.tmp`;
      try {
        proposed = proposal(options, operation);
        if (options.expectedToken !== proposed.token) throw new Error("Instruction/discovery changed after preview; re-preview");
        fs.mkdirSync(backupDirectory, { recursive: true });
        noLinks(backupDirectory);
        if (proposed.state.exists) {
          backupPath = path.join(backupDirectory, `${path.basename(target)}.${Date.now()}.${randomUUID()}.bak`);
          fs.writeFileSync(backupPath, proposed.state.bytes, { flag: "wx", mode: 0o600 });
        }
        const mode = proposed.state.exists ? fs.statSync(target).mode & 0o777 : 0o600;
        const handle = fs.openSync(temporary, "wx", mode);
        try { fs.writeFileSync(handle, proposed.bytes); fs.fsyncSync(handle); }
        finally { fs.closeSync(handle); }
        if (proposal(options, operation).token !== options.expectedToken) throw new Error("Instruction/discovery changed before replacement; re-preview");
        fs.renameSync(temporary, target);
        if (!fs.readFileSync(target).equals(proposed.bytes)) throw new Error(`Post-write verification failed; backup retained at ${backupPath}`);
        changed = true;
      } finally {
        if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
        fs.closeSync(lock);
        fs.unlinkSync(lockPath);
      }
    }
  }
  const finalState = read(proposed.resolved.target);
  return {
    schemaVersion: 1, version: VERSION, action, operation, host: options.host, scope: options.scope,
    scopeRoot: proposed.resolved.root, target: proposed.resolved.target,
    statusBefore: proposed.current.status, statusAfter: inspect(finalState, options.scope).status,
    changed, wouldChange: proposed.changed, backupPath,
    beforeHash: proposed.state.digest, afterHash: finalState.digest,
    discovery: proposed.resolved.discovery, hostLoading: "not-verified",
    ...(action === "preview" ? { previewToken: proposed.token, diff: proposed.diff } : {}),
  };
}

function parseArguments(args) {
  const result = {};
  const names = { "--action": "action", "--operation": "operation", "--host": "host", "--scope": "scope", "--scope-root": "scopeRoot", "--target": "target", "--expected-token": "expectedToken", "--backup-dir": "backupDir", "--fallback-names": "fallbackNames" };
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--approved") { result.approved = true; continue; }
    const key = names[args[index]];
    if (!key || index + 1 >= args.length || args[index + 1].startsWith("--")) throw new Error(`Unknown or incomplete option: ${args[index]}`);
    if (Object.hasOwn(result, key)) throw new Error(`Duplicate option: ${args[index]}`);
    const value = args[++index];
    result[key] = key === "fallbackNames" ? JSON.parse(value) : value;
  }
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.stdout.write(`${JSON.stringify(managePolicy(parseArguments(process.argv.slice(2))), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${JSON.stringify({ error: error.message, changed: "not-claimed" })}\n`); process.exitCode = 1; }
}
