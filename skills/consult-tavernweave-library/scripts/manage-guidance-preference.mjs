#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

export const LEVELS = Object.freeze(["新人", "入门", "熟练", "老手"]);
const begin = "<!-- tavernweave-guidance-preference:begin";
const end = "<!-- tavernweave-guidance-preference:end -->";
const hash = value => createHash("sha256").update(value).digest("hex");
const samePath = (a, b) => process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;

function absolute(value, label) {
  if (typeof value !== "string" || !path.isAbsolute(value)) throw new Error(`${label} 必须是已核实的绝对路径`);
  return path.resolve(value);
}

function noLinks(target) {
  for (let current = target; ; current = path.dirname(current)) {
    try { if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`目标经过链接，未写入：${current}`); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
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
  catch { throw new Error(`指令文件不是有效 UTF-8，未转换编码：${target}`); }
  return { exists: true, bytes, text, bom, newline: text.match(/\r\n|\n|\r/u)?.[0] || "\n", digest: hash(bytes) };
}

export function resolveClientTarget(options) {
  if (!["codex", "claude"].includes(options.host)) throw new Error("仅支持 codex / claude 客户端；DSH 尚无持久文件适配");
  const root = absolute(options.scopeRoot, "客户端全局目录");
  const target = absolute(options.target, "指令文件");
  noLinks(root);
  if (fs.existsSync(root) && !fs.statSync(root).isDirectory()) throw new Error("客户端全局目录不是文件夹");
  const candidates = (options.host === "codex" ? ["AGENTS.override.md", "AGENTS.md"] : ["CLAUDE.md"]).map(name => path.join(root, name));
  const states = candidates.map(file => ({ file, state: read(file) }));
  const effective = states.find(item => item.state.text.trim().length)?.file || candidates.at(-1);
  if (!samePath(effective, target)) throw new Error(`目标被遮蔽或不受支持；有效目标为 ${effective}`);
  return { root, target, discovery: states.map(({ file, state }) => ({ path: file, digest: state.digest })) };
}

function block(level, newline = "\n") {
  return `${begin} schema=1 -->\nTW_GUIDANCE_LEVEL=${level}\n用户明确选择的长期引导挡位：${level}。只有用户直接要求或明确许可才能更改；临时详细/简短要求不切档。大白话与必要解释继续生效。\n${end}\n`.replace(/\n/gu, newline);
}

export function inspectPreference(text) {
  const begins = text.split(begin).length - 1;
  const ends = text.split(end).length - 1;
  if (!begins && !ends) return { status: "unset", level: null, match: null };
  const invalid = { status: "invalid", level: null, match: null };
  if (begins !== 1 || ends !== 1) return invalid;
  const match = /^<!-- tavernweave-guidance-preference:begin schema=(\d+) -->(?:\r\n|\n|\r)[\s\S]*?^<!-- tavernweave-guidance-preference:end -->[ \t]*(?:\r\n|\n|\r|$)/gmu.exec(text);
  if (!match) return invalid;
  const prefix = text.slice(0, match.index);
  let fence = null;
  for (const line of prefix.split(/\r\n|\n|\r/u)) {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(line);
    if (!marker) continue;
    if (!fence) fence = marker[1];
    else if (marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
  }
  if (fence) return invalid;
  for (const owner of ["tavernweave-host-front-door", "tavernweave-rewrite-policy"]) {
    if (prefix.lastIndexOf(`<!-- ${owner}:begin`) > prefix.lastIndexOf(`<!-- ${owner}:end -->`)) return invalid;
  }
  if (match[1] !== "1") return { status: "unsupported-schema", level: null, match: null };
  const levelMatch = /^TW_GUIDANCE_LEVEL=(新人|入门|熟练|老手)$/mu.exec(match[0].replace(/\r\n?/gu, "\n"));
  if (!levelMatch) return invalid;
  const normalized = match[0].replace(/\r\n?/gu, "\n");
  if (normalized !== block(levelMatch[1])) return invalid;
  return { status: "selected", level: levelMatch[1], match };
}

function proposal(options) {
  const resolved = resolveClientTarget(options);
  const state = read(resolved.target);
  const current = inspectPreference(state.text);
  const replacement = options.level ? block(options.level, state.newline) : "";
  let text = state.text;
  if (replacement && ["unset", "selected"].includes(current.status)) {
    text = current.match
      ? text.slice(0, current.match.index) + replacement + text.slice(current.match.index + current.match[0].length)
      : text + (text && !/[\r\n]$/u.test(text) ? state.newline : "") + replacement;
  }
  const bytes = Buffer.concat([state.bom ? Buffer.from([0xef, 0xbb, 0xbf]) : Buffer.alloc(0), Buffer.from(text, "utf8")]);
  const token = hash(JSON.stringify({ operation: "set", level: options.level, host: options.host, ...resolved, before: state.digest, after: hash(bytes) }));
  return { resolved, state, current, bytes, token, changed: !bytes.equals(state.bytes), diff: { before: current.match?.[0] || "", after: replacement } };
}

export function managePreference(options) {
  const action = options.action || "check";
  if (!["check", "preview", "set"].includes(action)) throw new Error("动作必须是 check、preview 或 set");
  if (options.level !== undefined && !LEVELS.includes(options.level)) throw new Error("挡位只能是新人、入门、熟练或老手");
  if (action !== "check" && !options.level) throw new Error("预览或设置需要用户明确选择的挡位");
  let proposed = proposal(options);
  if (action !== "check" && !["unset", "selected"].includes(proposed.current.status)) throw new Error("偏好区块损坏、重复、嵌套或结构不受支持；先核对修复范围，未写入");
  let changed = false;
  let backupPath = null;
  if (action === "set") {
    if (options.approved !== true) throw new Error("需要用户对该目标和挡位的明确许可，未写入");
    if (options.expectedToken !== proposed.token) throw new Error("预览缺失或已过期；请重新核对当前文件，未写入");
    const backupDirectory = absolute(options.backupDir, "备份目录");
    noLinks(backupDirectory);
    if (proposed.changed) {
      const target = proposed.resolved.target;
      fs.mkdirSync(path.dirname(target), { recursive: true });
      noLinks(target);
      const lockPath = `${target}.tw-guidance.lock`;
      const lock = fs.openSync(lockPath, "wx", 0o600);
      const temporary = `${target}.${randomUUID()}.tmp`;
      try {
        proposed = proposal(options);
        if (options.expectedToken !== proposed.token) throw new Error("文件或有效路径已变化，请重新预览；未覆盖");
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
        if (proposal(options).token !== options.expectedToken) throw new Error("写入前发现文件变化，未覆盖；请重新预览");
        fs.renameSync(temporary, target);
        if (!fs.readFileSync(target).equals(proposed.bytes)) throw new Error(`写后核对失败；保留的备份：${backupPath}`);
        changed = true;
      } finally {
        if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
        fs.closeSync(lock);
        fs.unlinkSync(lockPath);
      }
    }
  }
  const finalState = read(proposed.resolved.target);
  const final = inspectPreference(finalState.text);
  return {
    schemaVersion: 1, preferenceSchemaVersion: 1, action, host: options.host, scope: "client",
    target: proposed.resolved.target, scopeRoot: proposed.resolved.root,
    statusBefore: proposed.current.status, statusAfter: final.status,
    levelBefore: proposed.current.level, level: final.level,
    changed, wouldChange: proposed.changed, backupPath,
    beforeHash: proposed.state.digest, afterHash: finalState.digest,
    discovery: proposed.resolved.discovery, hostLoading: "not-verified",
    explanation: final.status === "selected" ? `文件中已保存${final.level}档；客户端新任务是否加载仍需实际验证。` : final.status === "unset" ? "尚未选择挡位；没有自动分档。" : "偏好记录无效；请核对，未自动选择挡位。",
    ...(action === "preview" ? { previewToken: proposed.token, diff: proposed.diff, proposedLevel: options.level } : {}),
  };
}

function parseArguments(args) {
  const result = {};
  const names = { "--action": "action", "--level": "level", "--host": "host", "--scope-root": "scopeRoot", "--target": "target", "--expected-token": "expectedToken", "--backup-dir": "backupDir" };
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--approved") {
      if (result.approved) throw new Error("重复的 --approved");
      result.approved = true;
      continue;
    }
    const key = names[args[index]];
    if (!key || index + 1 >= args.length || args[index + 1].startsWith("--")) throw new Error(`未知或不完整参数：${args[index]}`);
    if (Object.hasOwn(result, key)) throw new Error(`重复参数：${args[index]}`);
    result[key] = args[++index];
  }
  return result;
}

function cliJson(value) {
  // Legacy Windows console code pages must not corrupt the JSON transport.
  // JSON escapes preserve every Unicode code unit after the caller parses it.
  return `${JSON.stringify(value, null, 2).replace(/[\u0080-\uffff]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`)}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.stdout.write(cliJson(managePreference(parseArguments(process.argv.slice(2))))); }
  catch (error) { process.stderr.write(cliJson({ error: error.message, changed: "not-claimed" })); process.exitCode = 1; }
}
