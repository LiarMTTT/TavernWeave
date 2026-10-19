/**
 * 神之手 · 宿主半侧（M5）
 *
 * Host 能力，都走 DSH 的 `webServer`：
 *   1. `GET /godhand/library/*`：只读地服务 TavernWeave 的
 *      `skills/consult-tavernweave-library` 整个技能根（picker 在
 *      `assets/picker/index.html`，页面里的 `../../references/...` 依赖这个根）。
 *   2. `POST /godhand/worldbook/{select,read,save,versions}`：读写本地世界书
 *      `.json`。保存前把旧版本复制到 `<root>/.godhand/versions/<相对路径转__>/`，
 *      再用同目录临时文件 + rename 原子替换主文件。
 *   3. `POST /godhand/mvu/{select,inspect}`：选择 MVU 组件目录，读取组件 JSON 的
 *      `content` 字符串，静态扫描 `const Schema = z.object({...})`；绝不执行被检查
 *      的 JS（不用 eval / new Function / vm），只返回变量树和 warnings。
 *   4. `GET/POST /godhand/workspace`：把工作区路径状态原子写到
 *      `DSH_HOME/godhand/workspace.json`；另有 project/scan（有界递归版本目录）、
 *      card/list、card/read 做目录/卡文件扫描和只读卡元信息提取。
 *   5. `POST /godhand/card/inspect`：只读卡内世界书条目、静态选择卡内 MVU 脚本、
 *      列出助手脚本元信息；脚本 content 不返回、不执行，不写卡和 workspace。
 *
 * 安全边界：
 *   - 所有路径 resolve 后必须仍在当前世界书根内；拒绝目录、非 `.json`、符号链接；
 *   - 静态文件只接受 GET/HEAD，不列目录，根前缀校验，拒绝 `\` / NUL / `..`；
 *   - POST 只接受 `application/json`（允许 charset），body 上限 8 MiB；
 *   - 错误只返回 `{ code, message }`，不把文件内容写进错误；
 *   - `connection` 服务是可选注入：拿得到且带 `requestRejection` 就先让它裁决；
 *     文件类 POST 在 connection 缺失时 fail closed（503），静态资料库仍只读可看。
 *
 * 已知边界（与合同一致）：模块级 `selectedRoot` / `selectedMvuRoot` 只存在内存里，
 * 宿主重启后需要客户端重新选目录；MVU 是静态解析，不是运行时 Zod 校验；卡内
 * 世界书/MVU 只读，不保存卡，卡内脚本执行和真实编译链仍未接。
 */
import { constants as fsConstants } from 'node:fs';
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  utimes,
  writeFile,
} from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync, deflateSync } from 'node:zlib';

export const name = 'godhand-dsh';
export const inject = ['webServer'];

const PLUGIN_ROOT = path.dirname(fileURLToPath(import.meta.url));

const LIBRARY_PREFIX = '/godhand/library';
const LIBRARY_SKILL = 'consult-tavernweave-library';
const WORLDBOOK_ROUTES = Object.freeze({
  select: '/godhand/worldbook/select',
  read: '/godhand/worldbook/read',
  save: '/godhand/worldbook/save',
  versions: '/godhand/worldbook/versions',
});
const MVU_ROUTES = Object.freeze({
  select: '/godhand/mvu/select',
  inspect: '/godhand/mvu/inspect',
});
const WORKSPACE_ROUTE = '/godhand/workspace';
const PROJECT_ROUTES = Object.freeze({
  scan: '/godhand/project/scan',
});
const CARD_ROUTES = Object.freeze({
  list: '/godhand/card/list',
  read: '/godhand/card/read',
  inspect: '/godhand/card/inspect',
});

const MAX_BODY_BYTES = 8 * 1024 * 1024;
const MAX_WORLDBOOK_BYTES = 8 * 1024 * 1024;
const MAX_WORKSPACE_BYTES = 256 * 1024;
const MAX_CARD_BYTES = 32 * 1024 * 1024;
const MAX_SCAN_DEPTH = 3;
const MAX_SCAN_FILES = 200;
const MAX_MVU_NODES = 2000;
const MAX_MVU_DEPTH = 12;
const MAX_PROJECT_SCAN_DEPTH = 3;
const MAX_PROJECT_VERSIONS = 200;
const MAX_PROJECT_ENTRIES = 2000;
const SKIP_DIRECTORIES = new Set(['node_modules', '.git', 'dist', '.godhand']);
const PROJECT_SCAN_SKIP = new Set(['node_modules', '.git', '.godhand', 'dist', 'build', 'release']);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const MIME_BY_EXTENSION = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}));

/** 模块级内存状态：当前世界书根；重启后丢失是合同允许的。 */
let selectedRoot = null;
/** MVU 组件根与世界书根分开保存，互不影响。 */
let selectedMvuRoot = null;
/** 备份文件名时间戳的单调兜底：同一毫秒连续保存也不会撞名。 */
let lastBackupStamp = 0;

/* ---------------- 通用 HTTP 工具 ---------------- */

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload));
}

function sendMethodNotAllowed(res, allow) {
  res.setHeader('allow', allow);
  sendJson(res, 405, { code: 'method-not-allowed', message: `method must be ${allow}` });
}

function logError(ctx, error) {
  try {
    const detail = error && error.stack ? error.stack : String(error);
    ctx.logger?.warn?.('[godhand] ' + detail);
  } catch {
    // Logging must never turn an API error into a crash.
  }
}

/** 统一的错误出口：ApiError 按约定码返回，其他错误只报 internal。 */
async function handle(ctx, res, work) {
  try {
    await work();
  } catch (error) {
    if (error instanceof ApiError) {
      sendJson(res, error.status, { code: error.code, message: error.message });
      return;
    }
    logError(ctx, error);
    sendJson(res, 500, { code: 'internal', message: 'internal error' });
  }
}

/**
 * `connection` 是可选服务：声明 inject 会强制它存在，所以用 ctx.get 试探；
 * 老版本/本机组合没有这个服务时按本机路由处理。
 */
function connectionOf(ctx) {
  let connection;
  try {
    connection = typeof ctx.get === 'function' ? ctx.get('connection') : undefined;
  } catch {
    connection = undefined;
  }
  if (connection === undefined) {
    try {
      connection = Reflect.get(ctx, 'connection');
    } catch {
      connection = undefined;
    }
  }
  return connection && typeof connection.requestRejection === 'function' ? connection : undefined;
}

/** 先让 connection 的 Host/Origin/登录围栏裁决；被拒绝时不写任何业务响应。
 *  世界书路由是真实文件读写：connection 缺失时必须 fail closed，不能退回“本机路由”。 */
function rejectIfFenced(ctx, req, res, { requireFence = false } = {}) {
  const connection = connectionOf(ctx);
  if (connection === undefined) {
    if (!requireFence) return false;
    sendJson(res, 503, { code: 'connection-unavailable', message: 'connection service is required for file routes' });
    return true;
  }
  const rejection = connection.requestRejection(req);
  if (rejection === undefined) return false;
  res.statusCode = typeof rejection === 'number' ? rejection : 403;
  res.end();
  return true;
}

/** 收集有上限的 UTF-8 body；超限返回 null（并把剩余流排掉）。 */
async function readBoundedBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > MAX_BODY_BYTES) {
      try { req.resume?.(); } catch {}
      return null;
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks, size).toString('utf8');
}

/** 所有世界书 POST 的唯一入口校验：JSON content-type、8 MiB、JSON 对象。 */
async function readJsonBody(req) {
  const essence = String(req.headers?.['content-type'] ?? '')
    .split(';', 1)[0].trim().toLowerCase();
  if (essence !== 'application/json') {
    throw new ApiError(415, 'unsupported-media-type', 'content-type must be application/json');
  }
  let text;
  try {
    text = await readBoundedBody(req);
  } catch {
    throw new ApiError(400, 'bad-request', 'request body unreadable');
  }
  if (text === null) {
    throw new ApiError(413, 'payload-too-large', 'request body exceeds 8 MiB');
  }
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new ApiError(400, 'bad-request', 'request body must be valid JSON');
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new ApiError(400, 'bad-request', 'request body must be a JSON object');
  }
  return body;
}

function methodOf(req) {
  return String(req.method ?? '').toUpperCase();
}

/* ---------------- 静态资料库 ---------------- */

function libraryCandidates(config) {
  const override = config && typeof config.libraryRoot === 'string' ? config.libraryRoot.trim() : '';
  if (override.length > 0) return [path.resolve(override)];
  return [
    // 源码树：reviews/godhand -> reviews/dsh-install/package/skills/...
    path.join(PLUGIN_ROOT, '..', 'dsh-install', 'package', 'skills', LIBRARY_SKILL),
    // profile 的 node_modules 兄弟目录（源码树没装时的部署形态）
    path.join(PLUGIN_ROOT, '..', 'liarmttt-tavernweave-dsh', 'skills', LIBRARY_SKILL),
    // profile/node_modules/godhand-dsh -> profile/node_modules/liarmttt-...
    path.join(PLUGIN_ROOT, '..', '..', 'node_modules', 'liarmttt-tavernweave-dsh', 'skills', LIBRARY_SKILL),
    // 以宿主进程工作目录为基准的兜底
    path.join(process.cwd(), 'skills', LIBRARY_SKILL),
  ].map((candidate) => path.resolve(candidate));
}

async function resolveLibraryRoot(config, cache) {
  if (cache.root !== null) return cache.root;
  for (const candidate of libraryCandidates(config)) {
    let info;
    try {
      info = await stat(candidate);
    } catch {
      continue;
    }
    if (!info.isDirectory()) continue;
    try {
      cache.root = await realpath(candidate);
    } catch {
      continue;
    }
    return cache.root;
  }
  return null;
}

/** `target` 是否严格位于 `root` 之下（root 本身不算）。 */
function isContained(root, target) {
  const relative = path.relative(root, target);
  return relative !== ''
    && relative !== '..'
    && !relative.startsWith('..' + path.sep)
    && !path.isAbsolute(relative);
}

function mimeOf(target) {
  return MIME_BY_EXTENSION.get(path.extname(target).toLowerCase()) ?? 'application/octet-stream';
}

async function serveLibrary(ctx, config, cache, req, res) {
  if (rejectIfFenced(ctx, req, res)) return;
  const method = methodOf(req);
  if (method !== 'GET' && method !== 'HEAD') {
    sendMethodNotAllowed(res, 'GET, HEAD');
    return;
  }

  const root = await resolveLibraryRoot(config, cache);
  if (root === null) {
    sendJson(res, 503, {
      code: 'library-unavailable',
      message: 'TavernWeave library skill directory was not found',
    });
    return;
  }

  let pathname;
  try {
    pathname = new URL(String(req.url ?? '/'), 'http://localhost').pathname;
  } catch {
    throw new ApiError(400, 'bad-request', 'malformed request URL');
  }
  if (pathname !== LIBRARY_PREFIX && !pathname.startsWith(LIBRARY_PREFIX + '/')) {
    throw new ApiError(404, 'not-found', 'not found');
  }

  let relative;
  try {
    relative = decodeURIComponent(pathname.slice(LIBRARY_PREFIX.length));
  } catch {
    throw new ApiError(400, 'bad-request', 'malformed path encoding');
  }
  // 反斜杠在 Windows 也是分隔符；NUL 没有合法文件用途。两者都不该出现在 URL 路径里。
  if (relative.includes('\\') || relative.includes('\0')) {
    throw new ApiError(400, 'bad-request', 'invalid path');
  }
  relative = relative.replace(/^\/+/u, '');
  if (relative === '') throw new ApiError(404, 'not-found', 'not found');

  let target = path.resolve(root, relative);
  if (!isContained(root, target)) {
    throw new ApiError(400, 'bad-request', 'path outside library root');
  }

  // 先取真实路径再校验根：父目录是链接、或最终文件是链接时都不能逃出技能根。
  let real;
  try {
    real = await realpath(target);
  } catch {
    throw new ApiError(404, 'not-found', 'not found');
  }
  if (!isContained(root, real)) {
    throw new ApiError(400, 'bad-request', 'path outside library root');
  }
  target = real;
  let info;
  try {
    info = await stat(target);
  } catch {
    throw new ApiError(404, 'not-found', 'not found');
  }
  // 目录不列出内容，也没有 index 自动补全；picker 的 URL 由客户端写全。
  if (!info.isFile()) throw new ApiError(404, 'not-found', 'not found');

  let data;
  try {
    data = await readFile(target);
  } catch {
    throw new ApiError(404, 'not-found', 'not found');
  }

  res.statusCode = 200;
  res.setHeader('content-type', mimeOf(target));
  res.setHeader('content-length', String(data.byteLength));
  res.setHeader('cache-control', 'no-cache');
  if (method === 'HEAD') {
    res.end();
    return;
  }
  res.end(data);
}

/* ---------------- 世界书：路径与列表 ---------------- */

function currentRoot() {
  if (selectedRoot === null) {
    throw new ApiError(409, 'no-root', 'choose a worldbook directory first');
  }
  return selectedRoot;
}

function currentMvuRoot() {
  if (selectedMvuRoot === null) {
    throw new ApiError(409, 'no-mvu-root', 'choose an MVU component directory first');
  }
  return selectedMvuRoot;
}

async function listWorldbookFiles(root) {
  const files = [];
  let stopped = false;

  const walk = async (directory, depth) => {
    if (stopped) return;
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (depth === 0) {
        throw new ApiError(400, 'root-unreadable', 'worldbook directory is not readable');
      }
      return;
    }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      if (stopped) return;
      if (files.length >= MAX_SCAN_FILES) {
        stopped = true;
        return;
      }
      const lower = entry.name.toLowerCase();
      if (SKIP_DIRECTORIES.has(lower)) continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (depth < MAX_SCAN_DEPTH) await walk(full, depth + 1);
        continue;
      }
      // 只认真实文件；符号链接（含 Windows junction）不参与列出。
      if (!entry.isFile()) continue;
      if (path.extname(entry.name).toLowerCase() !== '.json') continue;
      let info;
      try {
        info = await stat(full);
      } catch {
        continue;
      }
      if (!info.isFile()) continue;
      files.push({
        path: full,
        name: entry.name,
        size: info.size,
        mtime: info.mtime.toISOString(),
      });
    }
  };

  await walk(root, 0);
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return files;
}

/**
 * 把客户端传来的路径收敛到当前根内的真实 `.json` 文件。
 * 符号链接一律拒绝：合同只要求拒绝“逃逸”，全部拒绝更不容易在保存时
 * 意外替换链接本体而不是它指向的文件。
 */
async function resolveJsonFileWithin(root, value, label) {
  if (typeof value !== 'string' || value.trim() === '' || value.includes('\0')) {
    throw new ApiError(400, 'bad-request', '"path" must be a file path');
  }
  const target = path.resolve(root, value);
  // 不在 lstat 前做词法前缀判断：Windows 的 8.3 短名（ADMINI~1）和长名指向同一
  // 目录，词法比较会把合法路径误判成越界。真实路径（realpath）才是权威边界。
  if (path.extname(target).toLowerCase() !== '.json') {
    throw new ApiError(400, 'not-json', 'path must name a .json file');
  }
  let info;
  try {
    info = await lstat(target);
  } catch {
    throw new ApiError(404, 'not-found', `${label} file does not exist`);
  }
  if (info.isSymbolicLink()) {
    throw new ApiError(400, 'symlink-not-allowed', 'symbolic links are not allowed');
  }
  if (info.isDirectory()) {
    throw new ApiError(400, 'not-a-file', 'path names a directory');
  }
  if (!info.isFile()) {
    throw new ApiError(400, 'not-a-file', 'path is not a regular file');
  }
  // 父目录可能是链接：解析真实路径后仍必须留在根内。
  let real;
  try {
    real = await realpath(target);
  } catch {
    throw new ApiError(404, 'not-found', `${label} file does not exist`);
  }
  if (!isContained(root, real)) {
    throw new ApiError(400, 'path-outside-root', `path is outside the selected ${label} directory`);
  }
  try {
    info = await stat(real);
  } catch {
    throw new ApiError(404, 'not-found', `${label} file does not exist`);
  }
  return { target: real, info };
}

function resolveWorldbookFile(root, value) {
  return resolveJsonFileWithin(root, value, 'worldbook');
}

function resolveMvuFile(root, value) {
  return resolveJsonFileWithin(root, value, 'MVU component');
}

/* ---------------- 世界书：JSON 结构归一化 ---------------- */

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string') return value;
  }
  return '';
}

function stringList(value) {
  if (typeof value === 'string') return value.length > 0 ? [value] : [];
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string' && item.length > 0);
}

/**
 * ST 的触发词在不同形态里字段位置不一样：原生条目用 `key` 数组；也有文件用
 * `keys`；数组形态里 `key` 可能同时被当成条目标识。优先 `key` 数组，其次
 * `keys`，最后才把字符串 `key` 当作单个触发词。
 */
function triggerList(record) {
  if (Array.isArray(record.key)) return stringList(record.key);
  if (record.keys !== undefined) return stringList(record.keys);
  return stringList(record.key);
}

function secondaryList(record) {
  if (Array.isArray(record.keysecondary)) return stringList(record.keysecondary);
  if (record.secondary !== undefined) return stringList(record.secondary);
  return stringList(record.keysecondary);
}

function kindOf(json) {
  if (
    json !== null
    && typeof json === 'object'
    && !Array.isArray(json)
    && json.entries !== null
    && typeof json.entries === 'object'
    && !Array.isArray(json.entries)
  ) {
    return 'st-object';
  }
  if (Array.isArray(json)) return 'st-array';
  return 'unknown';
}

function normalizeEntry(entry, key) {
  const record = entry !== null && typeof entry === 'object' && !Array.isArray(entry) ? entry : {};
  return {
    key: typeof key === 'string'
      ? key
      : (typeof record.key === 'string' ? record.key : null),
    uid: typeof record.uid === 'number' && Number.isFinite(record.uid) ? record.uid : null,
    comment: firstString(record.comment, record.title),
    content: firstString(record.content, record.body),
    keys: triggerList(record),
    secondary: secondaryList(record),
  };
}

/** `[{key, uid, comment, content, keys, secondary}]`，两种 ST 形态都能读。 */
function normalizeEntries(json) {
  if (Array.isArray(json)) {
    return json.map((entry) => normalizeEntry(entry, undefined));
  }
  if (
    json !== null
    && typeof json === 'object'
    && json.entries !== null
    && typeof json.entries === 'object'
    && !Array.isArray(json.entries)
  ) {
    return Object.entries(json.entries).map(([key, entry]) => normalizeEntry(entry, key));
  }
  return [];
}

/** 归一化一个 entries 集合（卡内 character_book.entries 可能是数组，也可能是对象）。 */
function normalizeEntryCollection(value) {
  if (Array.isArray(value)) {
    return value.map((entry, index) => {
      const key = entry !== null && typeof entry === 'object' && typeof entry.key === 'string'
        ? entry.key
        : String(index);
      return normalizeEntry(entry, key);
    });
  }
  if (isPlainObject(value)) {
    return Object.entries(value).map(([key, entry]) => normalizeEntry(entry, key));
  }
  return [];
}

/* ---------------- 世界书：备份与原子写 ---------------- */

function backupDirectoryFor(root, target) {
  const relative = path.relative(root, target);
  const encoded = relative.split(/[\\/]+/u).filter(Boolean).join('__');
  if (encoded === '' || encoded === '..' || encoded.startsWith('..__')) {
    throw new ApiError(400, 'path-outside-root', 'path is outside the selected worldbook directory');
  }
  return path.join(root, '.godhand', 'versions', encoded);
}

/** Windows 文件名不能带 `:`；把 ISO 时间里的 `:` 和 `.` 换成 `-`，保持可排序。 */
function backupStamp(time) {
  return new Date(time).toISOString().replace(/[:.]/gu, '-');
}

async function writeBackup(directory, target) {
  try {
    await mkdir(directory, { recursive: true });
  } catch {
    throw new ApiError(500, 'backup-failed', 'could not write a backup; the worldbook was not changed');
  }
  let time = Math.max(Date.now(), lastBackupStamp + 1);
  for (let attempt = 0; attempt < 2000; attempt += 1, time += 1) {
    const name = backupStamp(time) + '.json';
    const destination = path.join(directory, name);
    try {
      await copyFile(target, destination, fsConstants.COPYFILE_EXCL);
    } catch (error) {
      if (error && error.code === 'EEXIST') continue;
      throw new ApiError(500, 'backup-failed', 'could not write a backup; the worldbook was not changed');
    }
    // copyFile 在 Windows 会沿用源文件的 mtime；版本列表要显示备份时间，显式改成现在。
    try {
      const now = new Date();
      await utimes(destination, now, now);
    } catch {}
    lastBackupStamp = time;
    return destination;
  }
  throw new ApiError(500, 'backup-failed', 'could not allocate a backup file name');
}

/** 备份原始卡文件到 <cardDir>/.godhand/backups/<timestamp>/<filename>。 */
async function createCardBackup(target) {
  const backupRoot = path.join(path.dirname(target), '.godhand', 'backups');
  try {
    await mkdir(backupRoot, { recursive: true });
  } catch {
    throw new ApiError(500, 'backup-failed', 'could not create the card backup directory; the card was not changed');
  }
  let time = Math.max(Date.now(), lastBackupStamp + 1);
  for (let attempt = 0; attempt < 2000; attempt += 1, time += 1) {
    const directory = path.join(backupRoot, backupStamp(time));
    try {
      await mkdir(directory);
    } catch (error) {
      if (error && error.code === 'EEXIST') continue;
      throw new ApiError(500, 'backup-failed', 'could not create the card backup directory; the card was not changed');
    }
    const destination = path.join(directory, path.basename(target));
    try {
      await copyFile(target, destination, fsConstants.COPYFILE_EXCL);
      lastBackupStamp = time;
      return destination;
    } catch {
      try { await rm(directory, { recursive: true, force: true }); } catch {}
      throw new ApiError(500, 'backup-failed', 'could not copy the card backup; the card was not changed');
    }
  }
  throw new ApiError(500, 'backup-failed', 'could not allocate a card backup directory');
}

/** 同目录临时文件 + rename；失败时清理临时文件，主文件保持原样。 */
async function atomicWrite(target, text, label = 'worldbook') {
  const directory = path.dirname(target);
  const temporary = path.join(
    directory,
    `.${path.basename(target)}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`,
  );
  try {
    await writeFile(temporary, text, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, target);
  } catch (error) {
    try { await rm(temporary, { force: true }); } catch {}
    throw new ApiError(500, 'write-failed', `could not write the ${label} file`);
  }
}

async function atomicWriteBinary(target, buffer, label = 'card') {
  const directory = path.dirname(target);
  const temporary = path.join(
    directory,
    `.${path.basename(target)}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`,
  );
  try {
    await writeFile(temporary, buffer, { flag: 'wx' });
    await rename(temporary, target);
  } catch {
    try { await rm(temporary, { force: true }); } catch {}
    throw new ApiError(500, 'write-failed', `could not write the ${label} file`);
  }
}

/* ---------------- 世界书：四个操作 ---------------- */

async function selectWorldbook(body) {
  const input = typeof body.root === 'string' ? body.root.trim() : '';
  if (input === '') throw new ApiError(400, 'bad-request', '"root" must be a directory path');
  if (!path.isAbsolute(input)) {
    throw new ApiError(400, 'bad-request', '"root" must be an absolute path');
  }
  let info;
  try {
    info = await stat(input);
  } catch {
    throw new ApiError(404, 'not-found', 'worldbook directory does not exist');
  }
  if (!info.isDirectory()) {
    throw new ApiError(400, 'not-a-directory', '"root" is not a directory');
  }
  let canonical;
  try {
    canonical = await realpath(input);
  } catch {
    throw new ApiError(404, 'not-found', 'worldbook directory does not exist');
  }
  selectedRoot = canonical;
  const files = await listWorldbookFiles(canonical);
  return { ok: true, root: canonical, files };
}

async function selectMvu(body) {
  const input = typeof body.root === 'string' ? body.root.trim() : '';
  if (input === '') throw new ApiError(400, 'bad-request', '"root" must be a directory path');
  if (!path.isAbsolute(input)) {
    throw new ApiError(400, 'bad-request', '"root" must be an absolute path');
  }
  let info;
  try {
    info = await stat(input);
  } catch {
    throw new ApiError(404, 'not-found', 'MVU component directory does not exist');
  }
  if (!info.isDirectory()) {
    throw new ApiError(400, 'not-a-directory', '"root" is not a directory');
  }
  let canonical;
  try {
    canonical = await realpath(input);
  } catch {
    throw new ApiError(404, 'not-found', 'MVU component directory does not exist');
  }
  const files = await listWorldbookFiles(canonical);
  // 列目录成功后才切换当前组件根，失败时保留旧根。
  selectedMvuRoot = canonical;
  return { ok: true, root: canonical, files };
}

async function readWorldbook(body) {
  const root = currentRoot();
  const { target, info } = await resolveWorldbookFile(root, body.path);
  if (info.size > MAX_WORLDBOOK_BYTES) {
    throw new ApiError(413, 'file-too-large', 'worldbook file exceeds 8 MiB');
  }
  let text;
  try {
    text = await readFile(target, 'utf8');
  } catch {
    throw new ApiError(404, 'not-found', 'worldbook file does not exist');
  }
  let json;
  try {
    json = JSON.parse(text.replace(/^\uFEFF/u, ''));
  } catch {
    throw new ApiError(400, 'invalid-json', 'file is not valid JSON');
  }
  return {
    ok: true,
    path: target,
    json,
    entries: normalizeEntries(json),
    kind: kindOf(json),
  };
}

async function saveWorldbook(body) {
  const root = currentRoot();
  const { target } = await resolveWorldbookFile(root, body.path);
  const json = body.json;
  // 合同 save 行写“必须是对象”，但 client 段要求 st-array 也能回写；这里允许
  // 对象或数组，只拒绝 null 和原始值，避免把数组根世界书锁成只读。
  if (json === null || typeof json !== 'object') {
    throw new ApiError(400, 'bad-request', '"json" must be a JSON object or array');
  }
  let text;
  try {
    text = JSON.stringify(json, null, 2) + '\n';
  } catch {
    throw new ApiError(400, 'bad-request', '"json" cannot be serialized');
  }
  if (Buffer.byteLength(text, 'utf8') > MAX_WORLDBOOK_BYTES) {
    throw new ApiError(413, 'payload-too-large', 'serialized worldbook exceeds 8 MiB');
  }
  const backup = await writeBackup(backupDirectoryFor(root, target), target);
  await atomicWrite(target, text);
  return { ok: true, path: target, backup };
}

async function listVersions(body) {
  const root = currentRoot();
  const { target } = await resolveWorldbookFile(root, body.path);
  const directory = backupDirectoryFor(root, target);
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === 'ENOENT') return { ok: true, versions: [] };
    throw new ApiError(500, 'internal', 'could not list versions');
  }
  const versions = [];
  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.json') continue;
    const full = path.join(directory, entry.name);
    let info;
    try {
      info = await stat(full);
    } catch {
      continue;
    }
    versions.push({
      path: full,
      name: entry.name,
      size: info.size,
      mtime: info.mtime.toISOString(),
      mtimeMs: info.mtimeMs,
    });
  }
  versions.sort((a, b) => (b.mtimeMs - a.mtimeMs)
    || (a.name < b.name ? 1 : a.name > b.name ? -1 : 0));
  return {
    ok: true,
    versions: versions.map(({ mtimeMs, ...rest }) => rest),
  };
}

/* ---------------- MVU：静态 Zod 扫描（绝不执行被检查的 JS） ---------------- */

class ParseFailure extends Error {
  constructor(code) {
    super(code);
    this.name = 'ParseFailure';
    this.code = code;
  }
}

const REGEX_PREFIX_WORDS = new Set([
  'return', 'case', 'throw', 'typeof', 'instanceof', 'in', 'of', 'yield',
  'await', 'else', 'do', 'void', 'delete', 'new',
]);

function canStartRegex(previous, word) {
  if (word && REGEX_PREFIX_WORDS.has(word)) return true;
  if (previous === '') return true;
  return '([{=,:;!&|?~+-*%^<>'.includes(previous);
}

function blankRange(chars, from, to) {
  for (let index = from; index < to; index += 1) {
    if (chars[index] !== '\n' && chars[index] !== '\r') chars[index] = ' ';
  }
}

/**
 * 把字符串、注释、正则字面量替换成空格，保留换行和字符位置。
 * 之后的花括号平衡与逗号切分只看代码结构，不会被内容里的 `{}`/`,`/`:` 骗到。
 */
function maskJavaScript(source) {
  const chars = source.split('');
  const length = source.length;
  let index = 0;
  let lastSignificant = '';
  let lastWord = '';

  while (index < length) {
    const char = source[index];
    const next = source[index + 1];

    if (char === '/' && next === '/') {
      let end = index + 2;
      while (end < length && source[end] !== '\n') end += 1;
      blankRange(chars, index, end);
      index = end;
      lastSignificant = '';
      lastWord = '';
      continue;
    }

    if (char === '/' && next === '*') {
      const close = source.indexOf('*/', index + 2);
      if (close < 0) throw new ParseFailure('unterminated-comment');
      blankRange(chars, index, close + 2);
      index = close + 2;
      lastSignificant = '';
      lastWord = '';
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      let end = index + 1;
      let closed = false;
      while (end < length) {
        const inner = source[end];
        if (inner === '\\') {
          end += 2;
          continue;
        }
        if (inner === char) {
          closed = true;
          end += 1;
          break;
        }
        // 普通字符串不能跨行；模板字符串可以。
        if (char !== '`' && (inner === '\n' || inner === '\r')) break;
        end += 1;
      }
      if (!closed) throw new ParseFailure('unterminated-string');
      blankRange(chars, index, end);
      index = end;
      lastSignificant = char;
      lastWord = '';
      continue;
    }

    if (char === '/' && canStartRegex(lastSignificant, lastWord)) {
      let end = index + 1;
      let inClass = false;
      let closed = false;
      while (end < length) {
        const inner = source[end];
        if (inner === '\\') {
          end += 2;
          continue;
        }
        if (inner === '[') {
          inClass = true;
          end += 1;
          continue;
        }
        if (inner === ']') {
          inClass = false;
          end += 1;
          continue;
        }
        if (inner === '\n' || inner === '\r') break;
        if (inner === '/' && !inClass) {
          closed = true;
          end += 1;
          break;
        }
        end += 1;
      }
      if (!closed) throw new ParseFailure('unterminated-regex');
      while (end < length && /[a-z]/i.test(source[end])) end += 1;
      blankRange(chars, index, end);
      index = end;
      lastSignificant = '/';
      lastWord = '';
      continue;
    }

    if (!/\s/u.test(char)) {
      if (/[A-Za-z0-9_$]/u.test(char)) {
        let end = index;
        while (end < length && /[A-Za-z0-9_$]/u.test(source[end])) end += 1;
        lastWord = source.slice(index, end);
        lastSignificant = source[end - 1];
        index = end;
        continue;
      }
      lastSignificant = char;
      lastWord = '';
    }
    index += 1;
  }

  return chars.join('');
}

function findMatching(text, openIndex, open, close) {
  let depth = 0;
  for (let index = openIndex; index < text.length; index += 1) {
    if (text[index] === open) depth += 1;
    else if (text[index] === close) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function trimMaskedRange(masked, start, end) {
  let from = start;
  let to = end;
  while (from < to && /\s/u.test(masked[from])) from += 1;
  while (to > from && /\s/u.test(masked[to - 1])) to -= 1;
  return { start: from, end: to };
}

/** 在遮罩文本里按顶层分隔符切分；括号/方括号/花括号里的分隔符不切。 */
function splitTopLevel(text, start, end, delimiter) {
  const ranges = [];
  let paren = 0;
  let bracket = 0;
  let brace = 0;
  let last = start;
  for (let index = start; index < end; index += 1) {
    const char = text[index];
    if (char === '(') paren += 1;
    else if (char === ')') paren -= 1;
    else if (char === '[') bracket += 1;
    else if (char === ']') bracket -= 1;
    else if (char === '{') brace += 1;
    else if (char === '}') brace -= 1;
    else if (char === delimiter && paren === 0 && bracket === 0 && brace === 0) {
      ranges.push({ start: last, end: index });
      last = index + 1;
    }
  }
  ranges.push({ start: last, end });
  return ranges;
}

function findTopLevelColon(masked, start, end) {
  let paren = 0;
  let bracket = 0;
  let brace = 0;
  for (let index = start; index < end; index += 1) {
    const char = masked[index];
    if (char === '(') paren += 1;
    else if (char === ')') paren -= 1;
    else if (char === '[') bracket += 1;
    else if (char === ']') bracket -= 1;
    else if (char === '{') brace += 1;
    else if (char === '}') brace -= 1;
    else if (char === ':' && paren === 0 && bracket === 0 && brace === 0) return index;
  }
  return -1;
}

function findTopLevelMethodArg(masked, method) {
  let paren = 0;
  let bracket = 0;
  let brace = 0;
  let result = null;
  for (let index = 0; index < masked.length; index += 1) {
    const char = masked[index];
    if (char === '(') paren += 1;
    else if (char === ')') paren -= 1;
    else if (char === '[') bracket += 1;
    else if (char === ']') bracket -= 1;
    else if (char === '{') brace += 1;
    else if (char === '}') brace -= 1;
    else if (char === '.' && paren === 0 && bracket === 0 && brace === 0) {
      const match = new RegExp(`^\\s*${method}\\s*\\(`, 'u').exec(masked.slice(index + 1));
      if (match) {
        const open = index + 1 + match[0].length - 1;
        const close = findMatching(masked, open, '(', ')');
        if (close < 0) throw new ParseFailure('unbalanced-parens');
        // 链式调用从外到内扫描；后面的调用覆盖前面的同名调用（Zod 的链式语义）。
        result = { start: open + 1, end: close };
        index = close;
      }
    }
  }
  return result;
}

function decodeJsString(text) {
  if (typeof text !== 'string' || text.length < 2) return null;
  const quote = text[0];
  if ((quote !== '"' && quote !== "'" && quote !== '`') || text[text.length - 1] !== quote) return null;
  if (quote === '`' && text.includes('${')) return null;

  let output = '';
  for (let index = 1; index < text.length - 1; index += 1) {
    const char = text[index];
    if (char !== '\\') {
      output += char;
      continue;
    }
    index += 1;
    if (index >= text.length - 1) return null;
    const escaped = text[index];
    switch (escaped) {
      case 'n': output += '\n'; break;
      case 'r': output += '\r'; break;
      case 't': output += '\t'; break;
      case 'b': output += '\b'; break;
      case 'f': output += '\f'; break;
      case 'v': output += '\v'; break;
      case '0': output += '\0'; break;
      case '\\': output += '\\'; break;
      case "'": output += "'"; break;
      case '"': output += '"'; break;
      case '`': output += '`'; break;
      case '\n': break;
      case '\r':
        if (text[index + 1] === '\n') index += 1;
        break;
      case 'x': {
        const hex = text.slice(index + 1, index + 3);
        if (!/^[0-9a-f]{2}$/iu.test(hex)) return null;
        output += String.fromCharCode(Number.parseInt(hex, 16));
        index += 2;
        break;
      }
      case 'u': {
        if (text[index + 1] === '{') {
          const close = text.indexOf('}', index + 2);
          if (close < 0) return null;
          const hex = text.slice(index + 2, close);
          if (!/^[0-9a-f]{1,6}$/iu.test(hex)) return null;
          const codePoint = Number.parseInt(hex, 16);
          if (codePoint > 0x10ffff) return null;
          output += String.fromCodePoint(codePoint);
          index = close;
        } else {
          const hex = text.slice(index + 1, index + 5);
          if (!/^[0-9a-f]{4}$/iu.test(hex)) return null;
          output += String.fromCharCode(Number.parseInt(hex, 16));
          index += 4;
        }
        break;
      }
      default:
        // JS 对未知转义保留字符本身（例如 \q -> q）。
        output += escaped;
    }
  }
  return output;
}

function parseSimpleLiteral(text) {
  const value = text.trim();
  if (value === '') return null;
  if (value[0] === '"' || value[0] === "'" || value[0] === '`') return decodeJsString(value);
  if (/^-?(?:(?:0|[1-9]\d*)(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/u.test(value)) {
    return Number(value);
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === '{}') return {};
  if (value === '[]') return [];
  return null;
}

function mvuWarn(ctx, code) {
  if (!ctx.seen.has(code)) {
    ctx.seen.add(code);
    ctx.warnings.push(code);
  }
}

function extractMvuDefault(start, end, ctx) {
  const masked = ctx.masked.slice(start, end);
  const original = ctx.source.slice(start, end);
  const prefault = findTopLevelMethodArg(masked, 'prefault');
  if (prefault !== null) {
    return parseSimpleLiteral(original.slice(prefault.start, prefault.end));
  }
  const fallback = findTopLevelMethodArg(masked, 'default');
  if (fallback !== null) {
    return parseSimpleLiteral(original.slice(fallback.start, fallback.end));
  }
  return null;
}

function parseMvuValue(start, end, depth, ctx) {
  const masked = ctx.masked.slice(start, end);

  let match = /^\s*z\s*\.\s*object\s*\(/u.exec(masked);
  if (match) {
    const openRel = match[0].length - 1;
    const closeParenRel = findMatching(masked, openRel, '(', ')');
    if (closeParenRel < 0) throw new ParseFailure('unbalanced-parens');
    const braceRel = masked.indexOf('{', openRel + 1);
    if (braceRel >= 0 && braceRel < closeParenRel) {
      const closeBraceRel = findMatching(masked, braceRel, '{', '}');
      if (closeBraceRel < 0) throw new ParseFailure('unbalanced-braces');
      const children = parseMvuFields(start + braceRel + 1, start + closeBraceRel, depth + 1, ctx);
      return { type: 'object', children };
    }
    // 非字面量 object（例如 z.object(Object.fromEntries(...))）无法静态展开；
    // 保留一个 opaque object 节点，避免整棵 Schema 因为局部动态构造而整体丢失。
    mvuWarn(ctx, 'object-not-literal');
    return { type: 'object', children: [] };
  }

  match = /^\s*z\s*\.\s*record\s*\(/u.exec(masked);
  if (match) {
    const openRel = match[0].length - 1;
    const closeRel = findMatching(masked, openRel, '(', ')');
    if (closeRel < 0) throw new ParseFailure('unbalanced-parens');
    const args = splitTopLevel(masked, openRel + 1, closeRel, ',').map((range) => (
      trimMaskedRange(masked, range.start, range.end)
    )).filter((range) => range.start < range.end);
    if (args.length === 0) throw new ParseFailure('record-without-value');
    const last = args[args.length - 1];
    const children = [];
    const child = parseMvuField('*', start + last.start, start + last.end, depth + 1, ctx);
    if (child !== null) children.push(child);
    return { type: 'record', children };
  }

  if (/^\s*z\s*\.\s*array\s*\(/u.test(masked)) return { type: 'array', children: [] };
  if (/^\s*z\s*\.\s*coerce\s*\.\s*string\s*\(/u.test(masked)) return { type: 'string', children: [] };
  if (/^\s*z\s*\.\s*coerce\s*\.\s*number\s*\(/u.test(masked)) return { type: 'number', children: [] };
  if (/^\s*z\s*\.\s*string\s*\(/u.test(masked)) return { type: 'string', children: [] };
  if (/^\s*z\s*\.\s*number\s*\(/u.test(masked)) return { type: 'number', children: [] };
  if (/^\s*Num\s*\(/u.test(masked)) return { type: 'number', children: [] };
  if (/^\s*z\s*\.\s*boolean\s*\(/u.test(masked)) return { type: 'boolean', children: [] };
  if (/^\s*z\s*\.\s*any\s*\(/u.test(masked)) return { type: 'any', children: [] };

  const zodCall = /^\s*z\s*\.\s*([A-Za-z_$][\w$]*)/u.exec(masked);
  if (zodCall) {
    mvuWarn(ctx, `unsupported-type:z.${zodCall[1]}`);
    return { type: 'unknown', children: [] };
  }

  const identifier = /^\s*([A-Za-z_$][\w$]*)/u.exec(masked);
  if (identifier) {
    const name = identifier[1];
    const definition = ctx.definitions.get(name);
    if (definition === undefined) return { type: `ref:${name}`, children: [] };
    if (ctx.activeRefs.has(name)) {
      mvuWarn(ctx, `cycle-ref:${name}`);
      return { type: `ref:${name}`, children: [] };
    }
    ctx.activeRefs.add(name);
    let children = [];
    try {
      children = parseMvuFields(definition.start, definition.end, depth + 1, ctx);
    } finally {
      ctx.activeRefs.delete(name);
    }
    return { type: `ref:${name}`, children };
  }

  mvuWarn(ctx, 'unknown-type');
  return { type: 'unknown', children: [] };
}

function parseMvuField(key, start, end, depth, ctx) {
  if (depth > MAX_MVU_DEPTH) {
    mvuWarn(ctx, 'depth-limit');
    return null;
  }
  if (ctx.count >= MAX_MVU_NODES) {
    mvuWarn(ctx, 'node-limit');
    ctx.stopped = true;
    return null;
  }
  ctx.count += 1;
  const typeInfo = parseMvuValue(start, end, depth, ctx);
  return {
    key,
    type: typeInfo.type,
    default: extractMvuDefault(start, end, ctx),
    children: typeInfo.children,
  };
}

function firstMeaningfulIndex(source, start, end) {
  let index = start;
  while (index < end) {
    while (index < end && /\s/u.test(source[index])) index += 1;
    if (index >= end) return -1;
    if (source[index] === '/' && source[index + 1] === '/') {
      index += 2;
      while (index < end && source[index] !== '\n') index += 1;
      continue;
    }
    if (source[index] === '/' && source[index + 1] === '*') {
      const close = source.indexOf('*/', index + 2);
      if (close < 0 || close >= end) return -1;
      index = close + 2;
      continue;
    }
    return index;
  }
  return -1;
}

function parseMvuFields(start, end, depth, ctx) {
  const fields = [];
  for (const rawRange of splitTopLevel(ctx.masked, start, end, ',')) {
    const range = trimMaskedRange(ctx.masked, rawRange.start, rawRange.end);
    if (range.start >= range.end) continue;
    const colon = findTopLevelColon(ctx.masked, range.start, range.end);
    if (colon < 0) {
      // Zod object 里允许 `{ status, position }` 这种简写；值就是同名标识符。
      const shorthandStart = firstMeaningfulIndex(ctx.source, range.start, range.end);
      const shorthand = shorthandStart < 0 ? '' : ctx.source.slice(shorthandStart, range.end).trim();
      if (shorthand.startsWith('...')) {
        mvuWarn(ctx, 'spread-skipped');
        continue;
      }
      if (!/^[A-Za-z_$][\w$]*$/u.test(shorthand)) throw new ParseFailure('missing-colon');
      const field = parseMvuField(shorthand, shorthandStart, range.end, depth, ctx);
      if (field !== null) fields.push(field);
      if (ctx.stopped) break;
      continue;
    }

    // 引号键在遮罩文本里全是空格，不能拿 trim 后的范围当键起点。
    const keyStart = firstMeaningfulIndex(ctx.source, rawRange.start, colon);
    if (keyStart < 0) throw new ParseFailure('missing-key');
    const keyText = ctx.source.slice(keyStart, colon);
    if (keyText.startsWith('...')) {
      mvuWarn(ctx, 'spread-skipped');
      continue;
    }

    let key;
    if (keyText.startsWith('"') || keyText.startsWith("'")) {
      const quoted = /^(['"])(?:\\.|(?!\1)[^\\])*\1/su.exec(keyText);
      if (quoted === null) throw new ParseFailure('invalid-key');
      key = decodeJsString(quoted[0]);
      if (key === null) throw new ParseFailure('invalid-key');
    } else {
      key = ctx.masked.slice(keyStart, colon).trim();
    }
    if (key === '') throw new ParseFailure('missing-key');

    const valueRange = trimMaskedRange(ctx.masked, colon + 1, range.end);
    if (valueRange.start >= valueRange.end) throw new ParseFailure('missing-value');
    const field = parseMvuField(key, valueRange.start, valueRange.end, depth, ctx);
    if (field !== null) fields.push(field);
    if (ctx.stopped) break;
  }
  return fields;
}

/** 收集 `const <Name> = z.object({...})` 定义；后续 ref:<Name> 用它们递归展开。 */
function collectMvuDefinitions(masked) {
  const definitions = new Map();
  const declaration = /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*z\s*\.\s*object\s*\(/gu;
  let match;
  while ((match = declaration.exec(masked)) !== null) {
    const name = match[1];
    const openParen = match.index + match[0].length - 1;
    const closeParen = findMatching(masked, openParen, '(', ')');
    if (closeParen < 0) continue;
    const brace = masked.indexOf('{', openParen + 1);
    if (brace < 0 || brace > closeParen) continue;
    const closeBrace = findMatching(masked, brace, '{', '}');
    if (closeBrace < 0) continue;
    if (!definitions.has(name)) definitions.set(name, { start: brace + 1, end: closeBrace });
  }
  return definitions;
}

/**
 * 静态扫描 `const Schema = z.object({...})`。
 * 返回 `{schema}|{schema:null,reason,warnings}`；不执行任何被检查代码。
 */
function parseMvuSchema(source) {
  const ctx = {
    source: '',
    masked: '',
    count: 0,
    warnings: [],
    seen: new Set(),
    stopped: false,
    definitions: new Map(),
    activeRefs: new Set(),
  };
  try {
    const code = source.replace(/^\uFEFF/u, '');
    ctx.source = code;
    ctx.masked = maskJavaScript(code);
    ctx.definitions = collectMvuDefinitions(ctx.masked);

    const declaration = /(?:^|[^\w$])const\s+Schema\b/gu;
    let declarationMatch;
    let body = null;
    while ((declarationMatch = declaration.exec(ctx.masked)) !== null) {
      const from = declarationMatch.index + declarationMatch[0].length;
      const call = /\bz\s*\.\s*object\s*\(/gu;
      call.lastIndex = from;
      const callMatch = call.exec(ctx.masked);
      if (callMatch === null) continue;
      const openParen = callMatch.index + callMatch[0].length - 1;
      let brace = openParen + 1;
      while (brace < ctx.masked.length && ctx.masked[brace] !== '{' && ctx.masked[brace] !== ')') {
        brace += 1;
      }
      if (ctx.masked[brace] !== '{') throw new ParseFailure('object-not-literal');
      const close = findMatching(ctx.masked, brace, '{', '}');
      if (close < 0) throw new ParseFailure('unbalanced-braces');
      body = { start: brace + 1, end: close };
      break;
    }

    if (body === null) {
      return { schema: null, reason: 'no-zod-object', warnings: [] };
    }
    const roots = parseMvuFields(body.start, body.end, 0, ctx);
    return {
      schema: {
        parser: 'static-zod-object',
        roots,
        nodeCount: ctx.count,
        warnings: ctx.warnings,
      },
    };
  } catch (error) {
    const code = error instanceof ParseFailure ? error.code : 'parse-error';
    return {
      schema: null,
      reason: 'parse-error',
      warnings: [...ctx.warnings, code],
    };
  }
}

async function inspectMvu(body) {
  const root = currentMvuRoot();
  const { target, info } = await resolveMvuFile(root, body.path);
  if (info.size > MAX_WORLDBOOK_BYTES) {
    throw new ApiError(413, 'file-too-large', 'MVU component file exceeds 8 MiB');
  }
  let text;
  try {
    text = await readFile(target, 'utf8');
  } catch {
    throw new ApiError(404, 'not-found', 'MVU component file does not exist');
  }
  let json;
  try {
    json = JSON.parse(text.replace(/^\uFEFF/u, ''));
  } catch {
    throw new ApiError(400, 'invalid-json', 'MVU component file is not valid JSON');
  }
  if (json === null || typeof json !== 'object' || Array.isArray(json)) {
    throw new ApiError(400, 'bad-request', 'MVU component JSON must be an object');
  }
  if (typeof json.content !== 'string') {
    throw new ApiError(400, 'bad-request', 'MVU component JSON must contain a string "content"');
  }

  const parsed = parseMvuSchema(json.content);
  const scalar = (value) => (
    typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
      ? value
      : null
  );
  const response = {
    ok: true,
    file: {
      path: target,
      name: path.basename(target),
      size: info.size,
    },
    meta: {
      type: scalar(json.type),
      enabled: scalar(json.enabled),
      name: scalar(json.name),
      id: scalar(json.id),
      contentLength: json.content.length,
    },
  };
  if (parsed.schema === null) {
    return {
      ...response,
      schema: null,
      reason: parsed.reason,
      warnings: parsed.warnings,
    };
  }
  return { ...response, schema: parsed.schema };
}

/* ---------------- 持久工作区 ---------------- */

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function emptyWorkspaceState() {
  return {
    version: 1,
    projects: [],
    activeProjectId: null,
    autoLatest: true,
    worldbook: { root: '', file: '' },
    mvu: { root: '', file: '' },
    ui: { root: '', file: '' },
  };
}

function workspaceFilePath() {
  const configured = typeof process.env.DSH_HOME === 'string' ? process.env.DSH_HOME.trim() : '';
  const home = configured === '' ? path.join(homedir(), '.dsh') : path.resolve(configured);
  return path.join(home, 'godhand', 'workspace.json');
}

function emptyWorkspaceResponse(file) {
  return { ok: true, state: emptyWorkspaceState(), path: file, savedAt: null };
}

/** 工作区状态只允许路径/项目元数据；卡正文、世界书条目、脚本内容等一律剔除。 */
const WORKSPACE_PROJECT_FIELDS = Object.freeze([
  'id', 'root', 'label', 'lastVersionDir', 'lastCardPath',
  'lastWorldbookRoot', 'lastWorldbookPath', 'lastMvuRoot', 'lastMvuPath', 'lastUsed',
]);
const WORKSPACE_SLOTS = Object.freeze(['worldbook', 'mvu', 'ui']);

function sanitizeWorkspaceProject(project) {
  const clean = {};
  for (const field of WORKSPACE_PROJECT_FIELDS) {
    if (typeof project[field] === 'string') clean[field] = project[field];
  }
  return clean;
}

function sanitizeWorkspaceState(state) {
  const clean = {};
  if ('version' in state) clean.version = state.version;
  if ('projects' in state) clean.projects = state.projects.map(sanitizeWorkspaceProject);
  if ('activeProjectId' in state) clean.activeProjectId = state.activeProjectId;
  if ('autoLatest' in state) clean.autoLatest = state.autoLatest;
  for (const name of WORKSPACE_SLOTS) {
    if (!(name in state)) continue;
    const slot = {};
    if (typeof state[name].root === 'string') slot.root = state[name].root;
    if (typeof state[name].file === 'string') slot.file = state[name].file;
    clean[name] = slot;
  }
  return clean;
}

/** 轻量 JSON 形状校验：状态文件是客户端业务数据，host 只挡明显损坏的结构并做字段白名单。 */
function assertWorkspaceState(state) {
  if (!isPlainObject(state)) {
    throw new ApiError(400, 'bad-request', '"state" must be a JSON object');
  }
  if ('version' in state && (!Number.isInteger(state.version) || state.version < 1)) {
    throw new ApiError(400, 'bad-request', '"state.version" must be a positive integer');
  }
  if ('projects' in state) {
    if (!Array.isArray(state.projects)) {
      throw new ApiError(400, 'bad-request', '"state.projects" must be an array');
    }
    for (const project of state.projects) {
      if (!isPlainObject(project)) {
        throw new ApiError(400, 'bad-request', '"state.projects" entries must be objects');
      }
    }
  }
  if ('activeProjectId' in state && state.activeProjectId !== null && typeof state.activeProjectId !== 'string') {
    throw new ApiError(400, 'bad-request', '"state.activeProjectId" must be a string or null');
  }
  if ('autoLatest' in state && typeof state.autoLatest !== 'boolean') {
    throw new ApiError(400, 'bad-request', '"state.autoLatest" must be a boolean');
  }
  for (const name of WORKSPACE_SLOTS) {
    if (!(name in state)) continue;
    const slot = state[name];
    if (!isPlainObject(slot)) {
      throw new ApiError(400, 'bad-request', `"state.${name}" must be an object`);
    }
    for (const field of ['root', 'file']) {
      if (field in slot && typeof slot[field] !== 'string') {
        throw new ApiError(400, 'bad-request', `"state.${name}.${field}" must be a string`);
      }
    }
  }
  return sanitizeWorkspaceState(state);
}

async function readWorkspaceState() {
  const file = workspaceFilePath();
  let info;
  try {
    info = await stat(file);
  } catch (error) {
    if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) return emptyWorkspaceResponse(file);
    throw new ApiError(500, 'workspace-unreadable', 'workspace state is unreadable');
  }
  if (!info.isFile() || info.size > MAX_WORKSPACE_BYTES) return emptyWorkspaceResponse(file);
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    throw new ApiError(500, 'workspace-unreadable', 'workspace state is unreadable');
  }
  try {
    const state = assertWorkspaceState(JSON.parse(text.replace(/^\uFEFF/u, '')));
    return { ok: true, state, path: file, savedAt: info.mtime.toISOString() };
  } catch {
    // 损坏的状态不 500，也不偷偷读 .bak；客户端会拿到空状态重新建。
    return emptyWorkspaceResponse(file);
  }
}

async function saveWorkspaceState(body) {
  const state = assertWorkspaceState(body.state);
  let text;
  try {
    text = JSON.stringify(state, null, 2) + '\n';
  } catch {
    throw new ApiError(400, 'bad-request', '"state" cannot be serialized');
  }
  if (Buffer.byteLength(text, 'utf8') > MAX_WORKSPACE_BYTES) {
    throw new ApiError(413, 'payload-too-large', 'workspace state exceeds 256 KiB');
  }

  const file = workspaceFilePath();
  try {
    await mkdir(path.dirname(file), { recursive: true });
  } catch {
    throw new ApiError(500, 'write-failed', 'could not create the workspace directory');
  }

  // 只有现有文件是有效状态时才更新 .bak；损坏文件不能覆盖上一份好备份。
  let previousValid = false;
  try {
    const info = await stat(file);
    if (info.isFile() && info.size <= MAX_WORKSPACE_BYTES) {
      const previous = JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/u, ''));
      assertWorkspaceState(previous);
      previousValid = true;
    }
  } catch {
    previousValid = false;
  }
  if (previousValid) {
    try {
      await copyFile(file, `${file}.bak`);
    } catch {
      throw new ApiError(500, 'backup-failed', 'could not write a workspace backup; state was not changed');
    }
  }

  await atomicWrite(file, text, 'workspace state');
  let savedAt = new Date().toISOString();
  try {
    savedAt = (await stat(file)).mtime.toISOString();
  } catch {}
  return { ok: true, path: file, savedAt };
}

/* ---------------- 项目 / 卡片：版本与目录扫描 ---------------- */

function parseSemverVersion(name) {
  const match = /(?:^|[^0-9A-Za-z])v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?(?:$|[^0-9A-Za-z])/u.exec(name);
  if (match === null) return null;
  const prerelease = match[4] ? match[4].split('.') : [];
  return {
    version: `${Number(match[1])}.${Number(match[2])}.${Number(match[3])}${prerelease.length > 0 ? `-${match[4]}` : ''}`,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease,
  };
}

function compareSemver(left, right) {
  for (const field of ['major', 'minor', 'patch']) {
    if (left[field] !== right[field]) return left[field] - right[field];
  }
  if (left.prerelease.length === 0 && right.prerelease.length === 0) return 0;
  if (left.prerelease.length === 0) return 1;
  if (right.prerelease.length === 0) return -1;
  const length = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const a = left.prerelease[index];
    const b = right.prerelease[index];
    if (a === undefined) return -1;
    if (b === undefined) return 1;
    const aNumeric = /^\d+$/u.test(a);
    const bNumeric = /^\d+$/u.test(b);
    if (aNumeric && bNumeric) {
      const difference = Number(a) - Number(b);
      if (difference !== 0) return difference;
    } else if (aNumeric !== bNumeric) {
      return aNumeric ? -1 : 1;
    } else if (a !== b) {
      return a < b ? -1 : 1;
    }
  }
  return 0;
}

async function resolveAbsoluteDirectory(value, label) {
  const input = typeof value === 'string' ? value.trim() : '';
  if (input === '') throw new ApiError(400, 'bad-request', '"root" must be a directory path');
  if (!path.isAbsolute(input)) {
    throw new ApiError(400, 'bad-request', '"root" must be an absolute path');
  }
  let info;
  try {
    info = await stat(input);
  } catch {
    throw new ApiError(404, 'not-found', `${label} directory does not exist`);
  }
  if (!info.isDirectory()) {
    throw new ApiError(400, 'not-a-directory', '"root" is not a directory');
  }
  try {
    return await realpath(input);
  } catch {
    throw new ApiError(404, 'not-found', `${label} directory does not exist`);
  }
}

async function scanProject(body) {
  const root = await resolveAbsoluteDirectory(body.root, 'project');
  const versions = [];
  let scannedEntries = 0;
  let stopped = false;

  const walk = async (directory, depth) => {
    if (stopped) return;
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      if (depth === 0) {
        throw new ApiError(400, 'root-unreadable', 'project directory is not readable');
      }
      return;
    }
    entries.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
    for (const entry of entries) {
      if (stopped) return;
      if (scannedEntries >= MAX_PROJECT_ENTRIES) {
        stopped = true;
        return;
      }
      scannedEntries += 1;
      if (!entry.isDirectory()) continue;
      if (entry.isSymbolicLink()) continue;
      if (PROJECT_SCAN_SKIP.has(entry.name.toLowerCase())) continue;
      const childDepth = depth + 1;
      if (childDepth > MAX_PROJECT_SCAN_DEPTH) continue;
      const full = path.join(directory, entry.name);
      // Dirent 在部分 Windows 组合里可能把 junction 报成目录；lstat 再确认不是链接。
      let info;
      try {
        info = await lstat(full);
      } catch {
        continue;
      }
      if (!info.isDirectory() || info.isSymbolicLink()) continue;
      const semver = parseSemverVersion(entry.name);
      if (semver !== null) {
        versions.push({
          path: full,
          name: entry.name,
          relative: path.relative(root, full),
          version: semver.version,
          mtime: info.mtime.toISOString(),
          semver,
          mtimeMs: info.mtimeMs,
        });
      }
      // 版本目录本身也可能是容器（例如 版本包/1.2.5/1.9.6），继续向下但受深度上限约束。
      if (childDepth < MAX_PROJECT_SCAN_DEPTH) await walk(full, childDepth);
    }
  };

  await walk(root, 0);
  versions.sort((left, right) => (compareSemver(right.semver, left.semver)
    || right.mtimeMs - left.mtimeMs
    || (left.relative < right.relative ? -1 : left.relative > right.relative ? 1 : 0)));
  const limited = versions.slice(0, MAX_PROJECT_VERSIONS);
  return {
    ok: true,
    root,
    versions: limited.map(({ semver, mtimeMs, ...rest }) => rest),
    latest: limited[0]?.path ?? root,
  };
}

function isIgnoredCardName(name) {
  return name.startsWith('.')
    || name.startsWith('~')
    || /\.(?:tmp|temp|bak|part|crdownload|download)$/iu.test(name);
}

async function listCards(body) {
  const root = await resolveAbsoluteDirectory(body.root, 'card');
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    throw new ApiError(400, 'root-unreadable', 'card directory is not readable');
  }
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile() || isIgnoredCardName(entry.name)) continue;
    const extension = path.extname(entry.name).toLowerCase();
    if (extension !== '.png' && extension !== '.json') continue;
    const full = path.join(root, entry.name);
    let info;
    try {
      info = await stat(full);
    } catch {
      continue;
    }
    const semver = parseSemverVersion(entry.name);
    files.push({
      path: full,
      name: entry.name,
      size: info.size,
      mtime: info.mtime.toISOString(),
      version: semver === null ? null : semver.version,
      semver,
      mtimeMs: info.mtimeMs,
    });
  }
  files.sort((left, right) => {
    if (left.semver !== null && right.semver !== null) {
      const byVersion = compareSemver(right.semver, left.semver);
      if (byVersion !== 0) return byVersion;
    } else if (left.semver !== null) return -1;
    else if (right.semver !== null) return 1;
    return (right.mtimeMs - left.mtimeMs)
      || (left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
  });
  return {
    ok: true,
    root,
    files: files.map(({ semver, mtimeMs, ...rest }) => rest),
    latest: files[0]?.path ?? null,
  };
}

/* ---------------- 卡片：只读元信息 ---------------- */

async function resolveCardFile(root, value) {
  if (typeof value !== 'string' || value.trim() === '' || value.includes('\0')) {
    throw new ApiError(400, 'bad-request', '"path" must be a file path');
  }
  const target = path.resolve(root, value);
  const extension = path.extname(target).toLowerCase();
  if (extension !== '.png' && extension !== '.json') {
    throw new ApiError(400, 'not-card-file', 'path must name a .png or .json file');
  }
  let info;
  try {
    info = await lstat(target);
  } catch {
    throw new ApiError(404, 'not-found', 'card file does not exist');
  }
  if (info.isSymbolicLink()) {
    throw new ApiError(400, 'symlink-not-allowed', 'symbolic links are not allowed');
  }
  if (info.isDirectory()) {
    throw new ApiError(400, 'not-a-file', 'path names a directory');
  }
  if (!info.isFile()) {
    throw new ApiError(400, 'not-a-file', 'path is not a regular file');
  }
  let real;
  try {
    real = await realpath(target);
  } catch {
    throw new ApiError(404, 'not-found', 'card file does not exist');
  }
  if (!isContained(root, real)) {
    throw new ApiError(400, 'path-outside-root', 'path is outside the selected card root');
  }
  try {
    info = await stat(real);
  } catch {
    throw new ApiError(404, 'not-found', 'card file does not exist');
  }
  return { target: real, info, extension };
}

function emptyCardMeta() {
  return {
    name: null,
    spec: null,
    specVersion: null,
    characterName: null,
    characterVersion: null,
    creator: null,
    createDate: null,
  };
}

function firstMetaString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
}

function collectionCount(value) {
  if (Array.isArray(value)) return value.length;
  if (isPlainObject(value)) return Object.keys(value).length;
  return 0;
}

function firstNonZeroCount(values) {
  for (const value of values) {
    const count = collectionCount(value);
    if (count > 0) return count;
  }
  return 0;
}

function describeCardObject(json) {
  const data = isPlainObject(json.data) ? json.data : json;
  const extensions = isPlainObject(data.extensions)
    ? data.extensions
    : isPlainObject(json.extensions) ? json.extensions : {};
  const characterBook = isPlainObject(data.character_book)
    ? data.character_book
    : isPlainObject(json.character_book) ? json.character_book : null;

  const scriptCount = firstNonZeroCount([
    extensions.TavernHelper_scripts,
    extensions.tavern_helper?.scripts,
    extensions.TavernHelper?.scripts,
    extensions.tavern_helper_scripts,
    data.TavernHelper_scripts,
    json.TavernHelper_scripts,
  ]);
  const regexCount = firstNonZeroCount([
    extensions.regex_scripts,
    extensions.regexScripts,
    data.regex_scripts,
    json.regex_scripts,
  ]);

  return {
    meta: {
      name: firstMetaString(data.name, json.name, data.character_name, json.character_name),
      spec: firstMetaString(json.spec, data.spec),
      specVersion: firstMetaString(json.spec_version, data.spec_version),
      characterName: firstMetaString(data.name, json.name, data.character_name, json.character_name),
      characterVersion: firstMetaString(data.character_version, json.character_version),
      creator: firstMetaString(data.creator, json.creator),
      createDate: firstMetaString(data.create_date, json.create_date),
    },
    hasWorldbook: characterBook !== null,
    worldbookEntryCount: collectionCount(characterBook?.entries),
    scriptCount,
    regexCount,
  };
}

function describeJsonFile(json) {
  if (!isPlainObject(json)) {
    return {
      kind: 'unknown',
      meta: emptyCardMeta(),
      hasWorldbook: false,
      worldbookEntryCount: 0,
      scriptCount: 0,
      regexCount: 0,
    };
  }
  if (isPlainObject(json.data)) {
    return { kind: 'card-json', ...describeCardObject(json) };
  }
  if (isPlainObject(json.entries) || Array.isArray(json.entries)) {
    return {
      kind: 'worldbook-json',
      meta: emptyCardMeta(),
      hasWorldbook: true,
      worldbookEntryCount: collectionCount(json.entries),
      scriptCount: 0,
      regexCount: 0,
    };
  }
  return {
    kind: 'unknown',
    meta: emptyCardMeta(),
    hasWorldbook: false,
    worldbookEntryCount: 0,
    scriptCount: 0,
    regexCount: 0,
  };
}

function splitPngKeyword(data) {
  const nul = data.indexOf(0);
  if (nul < 0) return null;
  return {
    keyword: data.toString('latin1', 0, nul),
    rest: data.subarray(nul + 1),
  };
}

function decodePngBase64Json(text) {
  const cleaned = text.replace(/\s+/gu, '').replace(/\0+$/u, '');
  if (cleaned === '') return null;
  try {
    const decoded = Buffer.from(cleaned, 'base64').toString('utf8').replace(/^\uFEFF/u, '');
    const json = JSON.parse(decoded);
    return isPlainObject(json) ? json : null;
  } catch {
    return null;
  }
}

/** 只读 PNG 的 tEXt/iTXt/zTXt；不解码图像，也不执行任何文本。 */
function readPngCardPayload(buffer) {
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  const texts = new Map();
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('latin1', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) break;
    const data = buffer.subarray(dataStart, dataEnd);
    try {
      if (type === 'tEXt') {
        const entry = splitPngKeyword(data);
        if (entry !== null) texts.set(entry.keyword, entry.rest.toString('latin1'));
      } else if (type === 'zTXt') {
        const entry = splitPngKeyword(data);
        if (entry !== null && entry.rest[0] === 0) {
          const inflated = inflateSync(entry.rest.subarray(1), { maxOutputLength: MAX_CARD_BYTES });
          texts.set(entry.keyword, inflated.toString('utf8'));
        }
      } else if (type === 'iTXt') {
        const entry = splitPngKeyword(data);
        if (entry !== null) {
          const rest = entry.rest;
          const compressed = rest[0] === 1;
          const method = rest[1];
          let cursor = 2;
          const languageEnd = rest.indexOf(0, cursor);
          if (languageEnd >= 0) {
            cursor = languageEnd + 1;
            const translatedEnd = rest.indexOf(0, cursor);
            if (translatedEnd >= 0) {
              cursor = translatedEnd + 1;
              const payload = rest.subarray(cursor);
              if (compressed) {
                if (method === 0) {
                  const inflated = inflateSync(payload, { maxOutputLength: MAX_CARD_BYTES });
                  texts.set(entry.keyword, inflated.toString('utf8'));
                }
              } else {
                texts.set(entry.keyword, payload.toString('utf8'));
              }
            }
          }
        }
      }
    } catch {
      // 单个损坏/超大 chunk 不应让整个 PNG 读取失败；继续找后面的块。
    }
    offset = dataEnd + 4;
    if (type === 'IEND') break;
  }
  for (const keyword of ['ccv3', 'chara']) {
    if (!texts.has(keyword)) continue;
    const json = decodePngBase64Json(texts.get(keyword));
    if (json !== null) return json;
  }
  return null;
}

async function loadCardSource(body) {
  const root = await resolveAbsoluteDirectory(body.root, 'card');
  const { target, info, extension } = await resolveCardFile(root, body.path);
  if (info.size > MAX_CARD_BYTES) {
    throw new ApiError(413, 'file-too-large', 'card file exceeds 32 MiB');
  }
  const file = {
    path: target,
    name: path.basename(target),
    size: info.size,
    mtime: info.mtime.toISOString(),
  };

  if (extension === '.json') {
    let text;
    try {
      text = await readFile(target, 'utf8');
    } catch {
      throw new ApiError(404, 'not-found', 'card file does not exist');
    }
    let json;
    try {
      json = JSON.parse(text.replace(/^\uFEFF/u, ''));
    } catch {
      throw new ApiError(400, 'invalid-json', 'card JSON is not valid JSON');
    }
    return { extension, file, json };
  }

  let buffer;
  try {
    buffer = await readFile(target);
  } catch {
    throw new ApiError(404, 'not-found', 'card file does not exist');
  }
  return { extension, file, payload: readPngCardPayload(buffer) };
}

async function readCard(body) {
  const loaded = await loadCardSource(body);
  if (loaded.extension === '.json') {
    return { ok: true, ...describeJsonFile(loaded.json), file: loaded.file };
  }
  if (loaded.payload === null) {
    return {
      ok: true,
      kind: 'unknown',
      file: loaded.file,
      meta: emptyCardMeta(),
      hasWorldbook: false,
      worldbookEntryCount: 0,
      scriptCount: 0,
      regexCount: 0,
    };
  }
  return { ok: true, kind: 'card-png', ...describeCardObject(loaded.payload), file: loaded.file };
}

function contentHasMvuSchema(content) {
  return typeof content === 'string'
    && /(?:^|[^\w$])const\s+Schema\b/u.test(content)
    && /\bz\s*\.\s*object\s*\(/u.test(content);
}

function scriptMetadata(script, collectionKey) {
  const record = isPlainObject(script) ? script : {};
  const content = typeof record.content === 'string' ? record.content : '';
  const rawId = typeof record.id === 'string' || typeof record.id === 'number'
    ? record.id
    : (typeof collectionKey === 'string' ? collectionKey : null);
  return {
    id: rawId,
    name: firstMetaString(record.name, record.scriptName)
      ?? (typeof collectionKey === 'string' ? collectionKey : null),
    type: typeof record.type === 'string' ? record.type : null,
    enabled: typeof record.enabled === 'boolean' ? record.enabled : null,
    contentLength: content.length,
    hasSchema: contentHasMvuSchema(content),
    content,
  };
}

function cardScriptEntries(cardJson) {
  const data = isPlainObject(cardJson.data) ? cardJson.data : cardJson;
  const extensions = isPlainObject(data.extensions)
    ? data.extensions
    : isPlainObject(cardJson.extensions) ? cardJson.extensions : {};
  const candidates = [
    extensions.tavern_helper?.scripts,
    extensions.TavernHelper_scripts,
    extensions.TavernHelper?.scripts,
    extensions.tavern_helper_scripts,
    data.TavernHelper_scripts,
    cardJson.TavernHelper_scripts,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate
        .map((script, index) => ({ script, key: String(index) }))
        .filter(({ script }) => isPlainObject(script));
    }
    if (isPlainObject(candidate)) {
      if ('content' in candidate || 'name' in candidate || 'id' in candidate) {
        return [{ script: candidate, key: null }];
      }
      const entries = Object.entries(candidate).filter(([, script]) => isPlainObject(script));
      if (entries.length > 0) return entries.map(([key, script]) => ({ script, key }));
    }
  }
  return [];
}

function collectCardScripts(cardJson) {
  return cardScriptEntries(cardJson)
    .map(({ script, key }) => scriptMetadata(script, key));
}

/** 写回时定位与 card/inspect 相同的“最完整 Schema 脚本”。 */
function selectSchemaScript(cardJson) {
  const candidates = cardScriptEntries(cardJson)
    .map((entry) => ({ entry, meta: scriptMetadata(entry.script, entry.key) }))
    .filter(({ meta }) => meta.hasSchema);
  if (candidates.length === 0) return null;
  const evaluated = candidates.map((candidate) => ({
    ...candidate,
    result: parseMvuSchema(candidate.meta.content),
  }));
  const valid = evaluated.filter((entry) => entry.result.schema !== null);
  const pool = valid.length > 0 ? valid : evaluated;
  pool.sort((left, right) => {
    const a = left.result.schema;
    const b = right.result.schema;
    if (a !== null && b !== null) {
      if (b.nodeCount !== a.nodeCount) return b.nodeCount - a.nodeCount;
      const aRoots = a.roots?.length ?? 0;
      const bRoots = b.roots?.length ?? 0;
      if (bRoots !== aRoots) return bRoots - aRoots;
    } else if (a !== null) return -1;
    else if (b !== null) return 1;
    return right.meta.contentLength - left.meta.contentLength;
  });
  return pool[0];
}

/** 在卡内助手脚本里选 nodeCount/roots 最完整的静态 Schema；不执行 content。 */
function mvuForScripts(scripts, updateRules = '') {
  const candidates = scripts.filter((script) => script.hasSchema);
  if (candidates.length === 0) return null;
  const evaluated = candidates.map((script) => ({
    script,
    result: parseMvuSchema(script.content),
  }));
  const valid = evaluated.filter((entry) => entry.result.schema !== null);
  const pool = valid.length > 0 ? valid : evaluated;
  pool.sort((left, right) => {
    const a = left.result.schema;
    const b = right.result.schema;
    if (a !== null && b !== null) {
      if (b.nodeCount !== a.nodeCount) return b.nodeCount - a.nodeCount;
      const aRoots = a.roots?.length ?? 0;
      const bRoots = b.roots?.length ?? 0;
      if (bRoots !== aRoots) return bRoots - aRoots;
    } else if (a !== null) return -1;
    else if (b !== null) return 1;
    return right.script.contentLength - left.script.contentLength;
  });
  const chosen = pool[0];
  const schema = chosen.result.schema;
  return {
    script: {
      id: chosen.script.id,
      name: chosen.script.name,
      type: chosen.script.type,
      enabled: chosen.script.enabled,
      contentLength: chosen.script.contentLength,
    },
    schemaSource: chosen.script.content,
    updateRules,
    schema,
    reason: schema === null ? chosen.result.reason : null,
    warnings: schema === null ? chosen.result.warnings : schema.warnings,
  };
}

/** 卡内世界书中带 [mvu_update] 标记的条目内容拼接。 */
function updateRulesForEntries(entries) {
  return entries
    .filter((entry) => {
      const comment = typeof entry.comment === 'string' ? entry.comment.toLowerCase() : '';
      const keys = Array.isArray(entry.keys) ? entry.keys : [];
      return comment.includes('[mvu_update]')
        || keys.some((key) => typeof key === 'string' && key.toLowerCase().includes('[mvu_update]'));
    })
    .map((entry) => (typeof entry.content === 'string' ? entry.content : ''))
    .filter((content) => content.length > 0)
    .join('\n\n');
}

function worldbookForCard(cardJson) {
  const data = isPlainObject(cardJson.data) ? cardJson.data : cardJson;
  const book = isPlainObject(data.character_book)
    ? data.character_book
    : isPlainObject(cardJson.character_book) ? cardJson.character_book : null;
  if (book === null) return { name: null, count: 0, entries: [] };
  const entries = normalizeEntryCollection(book.entries);
  return { name: firstMetaString(book.name), count: entries.length, entries };
}

function worldbookForJson(json) {
  const entries = normalizeEntryCollection(json.entries);
  return { name: firstMetaString(json.name), count: entries.length, entries };
}

function rawWorldbookEntries(cardJson) {
  const data = isPlainObject(cardJson.data) ? cardJson.data : cardJson;
  const book = isPlainObject(data.character_book)
    ? data.character_book
    : isPlainObject(cardJson.character_book) ? cardJson.character_book : null;
  if (book === null) return [];
  if (Array.isArray(book.entries)) {
    return book.entries.map((entry, index) => ({ entry, key: String(index) }));
  }
  if (isPlainObject(book.entries)) {
    return Object.entries(book.entries).map(([key, entry]) => ({ entry, key }));
  }
  return [];
}

function rawEntryId(entry, key) {
  const id = isPlainObject(entry) ? (entry.id ?? entry.uid) : undefined;
  return typeof id === 'string' || typeof id === 'number' ? id : key;
}

function rawEntryName(entry, key) {
  return firstMetaString(
    isPlainObject(entry) ? entry.comment : null,
    isPlainObject(entry) ? entry.title : null,
    isPlainObject(entry) ? entry.name : null,
  ) ?? key;
}

function entryMarkerText(entry) {
  if (!isPlainObject(entry)) return '';
  return [
    entry.comment,
    entry.title,
    entry.name,
    ...(Array.isArray(entry.keys) ? entry.keys : []),
  ].filter((item) => typeof item === 'string').join('\n').toLowerCase();
}

function updateRuleEntriesForCard(cardJson) {
  return rawWorldbookEntries(cardJson)
    .filter(({ entry }) => entryMarkerText(entry).includes('[mvu_update]'))
    .map(({ entry, key }) => ({
      id: rawEntryId(entry, key),
      name: rawEntryName(entry, key),
      content: typeof entry.content === 'string' ? entry.content : '',
    }));
}

function initVarEntryForCard(cardJson) {
  const found = rawWorldbookEntries(cardJson).find(({ entry }) => {
    const marker = entryMarkerText(entry);
    return marker.includes('[initvar]') || marker.includes('[initialvariables]');
  });
  if (found === undefined) return null;
  return {
    id: rawEntryId(found.entry, found.key),
    name: rawEntryName(found.entry, found.key),
    content: typeof found.entry.content === 'string' ? found.entry.content : '',
  };
}

function joinUpdateRules(entries) {
  return entries.map((entry) => entry.content).filter((content) => content.length > 0).join('\n\n');
}

/** 卡内初始变量只认对象字段；常见位置 data.extensions.tavern_helper.variables。 */
function variablesForCard(cardJson) {
  const data = isPlainObject(cardJson.data) ? cardJson.data : cardJson;
  const extensions = isPlainObject(data.extensions)
    ? data.extensions
    : isPlainObject(cardJson.extensions) ? cardJson.extensions : {};
  const candidates = [
    extensions.tavern_helper?.variables,
    extensions.TavernHelper_variables,
    extensions.TavernHelper?.variables,
    extensions.tavern_helper_variables,
    data.TavernHelper_variables,
    cardJson.TavernHelper_variables,
  ];
  for (const candidate of candidates) {
    if (isPlainObject(candidate)) return candidate;
  }
  return null;
}

async function inspectCard(body) {
  const loaded = await loadCardSource(body);
  let kind = 'unknown';
  let meta = emptyCardMeta();
  let worldbook = { name: null, count: 0, entries: [] };
  let scripts = [];
  let variables = null;
  let updateRules = '';
  let updateRuleEntries = [];
  let initVarSource = null;
  let initVarName = null;
  let initVar = null;

  if (loaded.extension === '.json') {
    const described = describeJsonFile(loaded.json);
    kind = described.kind;
    meta = described.meta;
    if (kind === 'card-json') {
      worldbook = worldbookForCard(loaded.json);
      scripts = collectCardScripts(loaded.json);
      variables = variablesForCard(loaded.json);
      updateRuleEntries = updateRuleEntriesForCard(loaded.json);
      updateRules = joinUpdateRules(updateRuleEntries);
      const initEntry = initVarEntryForCard(loaded.json);
      initVarSource = initEntry?.content ?? null;
      initVarName = initEntry?.name ?? null;
      initVar = initEntry
        ? { kind: 'worldbook', id: initEntry.id, name: initEntry.name }
        : (variables !== null ? { kind: 'tavern-helper' } : null);
    } else if (kind === 'worldbook-json') {
      worldbook = worldbookForJson(loaded.json);
    }
  } else if (loaded.payload !== null) {
    kind = 'card-png';
    meta = describeCardObject(loaded.payload).meta;
    worldbook = worldbookForCard(loaded.payload);
    scripts = collectCardScripts(loaded.payload);
    variables = variablesForCard(loaded.payload);
    updateRuleEntries = updateRuleEntriesForCard(loaded.payload);
    updateRules = joinUpdateRules(updateRuleEntries);
    const initEntry = initVarEntryForCard(loaded.payload);
    initVarSource = initEntry?.content ?? null;
    initVarName = initEntry?.name ?? null;
    initVar = initEntry
      ? { kind: 'worldbook', id: initEntry.id, name: initEntry.name }
      : (variables !== null ? { kind: 'tavern-helper' } : null);
  }

  const mvu = mvuForScripts(scripts, updateRules);
  if (mvu !== null) {
    mvu.schemaScript = { id: mvu.script.id, name: mvu.script.name };
    mvu.updateRuleEntries = updateRuleEntries;
    mvu.initVarSource = initVarSource;
    mvu.initVarName = initVarName;
    mvu.initVar = initVar;
  }

  return {
    ok: true,
    kind,
    file: loaded.file,
    meta,
    worldbook,
    mvu,
    scripts: scripts.map(({ content, ...rest }) => rest),
    variables,
  };
}

/* ---------------- 卡写回 ---------------- */

const PNG_CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function pngCrc32(buffer) {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc = PNG_CRC_TABLE[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'latin1');
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(pngCrc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return chunk;
}

function parsePngChunksForWrite(buffer) {
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  const chunks = [];
  let offset = 8;
  let sawEnd = false;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    if (offset + 12 + length > buffer.length) return null;
    const type = buffer.toString('latin1', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    chunks.push({
      type,
      data: buffer.subarray(dataStart, dataEnd),
      raw: buffer.subarray(offset, dataEnd + 4),
    });
    offset = dataEnd + 4;
    if (type === 'IEND') {
      sawEnd = true;
      break;
    }
  }
  if (!sawEnd) return null;
  return { chunks, trailing: buffer.subarray(offset) };
}

function parsePngTextForWrite(chunk) {
  if (chunk.type === 'tEXt') {
    const entry = splitPngKeyword(chunk.data);
    if (entry === null) return null;
    return {
      keyword: entry.keyword,
      text: entry.rest.toString('latin1'),
      style: { type: 'tEXt' },
    };
  }
  if (chunk.type === 'zTXt') {
    const entry = splitPngKeyword(chunk.data);
    if (entry === null || entry.rest[0] !== 0) return null;
    try {
      const inflated = inflateSync(entry.rest.subarray(1), { maxOutputLength: MAX_CARD_BYTES });
      return {
        keyword: entry.keyword,
        text: inflated.toString('utf8'),
        style: { type: 'zTXt', method: 0 },
      };
    } catch {
      return null;
    }
  }
  if (chunk.type !== 'iTXt') return null;
  const entry = splitPngKeyword(chunk.data);
  if (entry === null || entry.rest.length < 2) return null;
  const rest = entry.rest;
  const compressed = rest[0] === 1;
  const method = rest[1];
  if (compressed && method !== 0) return null;
  let cursor = 2;
  const languageEnd = rest.indexOf(0, cursor);
  if (languageEnd < 0) return null;
  const language = rest.subarray(cursor, languageEnd);
  cursor = languageEnd + 1;
  const translatedEnd = rest.indexOf(0, cursor);
  if (translatedEnd < 0) return null;
  const translated = rest.subarray(cursor, translatedEnd);
  cursor = translatedEnd + 1;
  const payload = rest.subarray(cursor);
  try {
    const text = compressed
      ? inflateSync(payload, { maxOutputLength: MAX_CARD_BYTES }).toString('utf8')
      : payload.toString('utf8');
    return {
      keyword: entry.keyword,
      text,
      style: { type: 'iTXt', compressed, method, language, translated },
    };
  } catch {
    return null;
  }
}

function encodePngTextForWrite(parsed, json) {
  const base64 = Buffer.from(JSON.stringify(json), 'utf8').toString('base64');
  const keyword = Buffer.from(parsed.keyword, 'latin1');
  const nul = Buffer.from([0]);
  const style = parsed.style;
  if (style.type === 'tEXt') {
    return makePngChunk('tEXt', Buffer.concat([keyword, nul, Buffer.from(base64, 'latin1')]));
  }
  if (style.type === 'zTXt') {
    return makePngChunk('zTXt', Buffer.concat([
      keyword,
      nul,
      Buffer.from([0]),
      deflateSync(Buffer.from(base64, 'utf8')),
    ]));
  }
  const payload = style.compressed
    ? deflateSync(Buffer.from(base64, 'utf8'))
    : Buffer.from(base64, 'utf8');
  return makePngChunk('iTXt', Buffer.concat([
    keyword,
    nul,
    Buffer.from([style.compressed ? 1 : 0, 0]),
    style.language,
    nul,
    style.translated,
    nul,
    payload,
  ]));
}

function parsePngPayloadsForWrite(buffer) {
  const parsed = parsePngChunksForWrite(buffer);
  if (parsed === null) return null;
  const payloads = [];
  for (const chunk of parsed.chunks) {
    const text = parsePngTextForWrite(chunk);
    if (text === null || (text.keyword !== 'chara' && text.keyword !== 'ccv3')) continue;
    const json = decodePngBase64Json(text.text);
    if (json !== null) payloads.push({ chunk, keyword: text.keyword, parsed: text, json });
  }
  return { ...parsed, payloads };
}

function setRawEntryName(entry, name) {
  if (!isPlainObject(entry)) return;
  if (Object.hasOwn(entry, 'comment') || (!Object.hasOwn(entry, 'title') && !Object.hasOwn(entry, 'name'))) {
    entry.comment = name;
  } else if (Object.hasOwn(entry, 'title')) {
    entry.title = name;
  } else {
    entry.name = name;
  }
}

function findRawEntryById(cardJson, id) {
  return rawWorldbookEntries(cardJson)
    .find(({ entry, key }) => String(rawEntryId(entry, key)) === String(id)) ?? null;
}

function findRawInitVarEntry(cardJson) {
  return rawWorldbookEntries(cardJson).find(({ entry }) => {
    const marker = entryMarkerText(entry);
    return marker.includes('[initvar]') || marker.includes('[initialvariables]');
  }) ?? null;
}

function setTavernHelperVariables(cardJson, variables) {
  if (!isPlainObject(cardJson.data)) cardJson.data = {};
  if (!isPlainObject(cardJson.data.extensions)) cardJson.data.extensions = {};
  if (!isPlainObject(cardJson.data.extensions.tavern_helper)) {
    cardJson.data.extensions.tavern_helper = {};
  }
  cardJson.data.extensions.tavern_helper.variables = variables;
}

function applyCardChanges(cardJson, write) {
  const card = JSON.parse(JSON.stringify(cardJson));
  const updated = [];

  if (write.schemaContent !== undefined) {
    const selected = selectSchemaScript(card);
    if (selected === null) {
      throw new ApiError(400, 'write-target-missing', 'no Schema script was found in the card');
    }
    selected.entry.script.content = write.schemaContent;
    updated.push('schema');
  }

  if (write.updateRules !== undefined && write.updateRules.length > 0) {
    for (const item of write.updateRules) {
      const target = findRawEntryById(card, item.id);
      if (target === null) {
        throw new ApiError(400, 'write-target-missing', `update rule entry ${item.id} was not found`);
      }
      if (typeof item.content === 'string') target.entry.content = item.content;
      if (typeof item.name === 'string') setRawEntryName(target.entry, item.name);
    }
    updated.push('updateRules');
  }

  if (write.initVarContent !== undefined) {
    const target = findRawInitVarEntry(card);
    if (target === null) {
      throw new ApiError(400, 'write-target-missing', 'no [initvar] worldbook entry was found in the card');
    }
    target.entry.content = write.initVarContent;
    updated.push('initVar');
  }

  if (write.variables !== undefined) {
    setTavernHelperVariables(card, write.variables);
    updated.push('variables');
  }

  return { card, updated };
}

async function resolveCardWriteTarget(value) {
  const input = typeof value === 'string' ? value.trim() : '';
  if (input === '' || !path.isAbsolute(input)) {
    throw new ApiError(400, 'bad-request', '"path" must be an absolute path');
  }
  const extension = path.extname(input).toLowerCase();
  if (extension !== '.json' && extension !== '.png') {
    throw new ApiError(400, 'not-card-file', 'card path must be a .json or .png file');
  }
  let linkInfo;
  try {
    linkInfo = await lstat(input);
  } catch {
    throw new ApiError(404, 'not-found', 'card file does not exist');
  }
  if (linkInfo.isSymbolicLink() || !linkInfo.isFile()) {
    throw new ApiError(400, 'not-card-file', 'card path must be a regular file');
  }
  if (linkInfo.size > MAX_CARD_BYTES) {
    throw new ApiError(413, 'file-too-large', 'card file exceeds 32 MiB');
  }
  let target;
  try {
    target = await realpath(input);
  } catch {
    throw new ApiError(404, 'not-found', 'card file does not exist');
  }
  const info = await stat(target);
  if (!info.isFile() || info.size > MAX_CARD_BYTES) {
    throw new ApiError(413, 'file-too-large', 'card file is not a regular file or exceeds 32 MiB');
  }
  return { target, extension, info };
}

function validateCardWriteBody(body) {
  if (body.schemaContent !== undefined && typeof body.schemaContent !== 'string') {
    throw new ApiError(400, 'bad-request', '"schemaContent" must be a string');
  }
  if (body.updateRules !== undefined) {
    if (!Array.isArray(body.updateRules)) {
      throw new ApiError(400, 'bad-request', '"updateRules" must be an array');
    }
    for (const item of body.updateRules) {
      if (!isPlainObject(item)
        || (typeof item.id !== 'string' && typeof item.id !== 'number')
        || (item.content !== undefined && typeof item.content !== 'string')
        || (item.name !== undefined && typeof item.name !== 'string')) {
        throw new ApiError(400, 'bad-request', 'each updateRules item must have id and optional string name/content');
      }
      if (item.content === undefined && item.name === undefined) {
        throw new ApiError(400, 'bad-request', 'each updateRules item must change name or content');
      }
    }
  }
  if (body.initVarContent !== undefined && typeof body.initVarContent !== 'string') {
    throw new ApiError(400, 'bad-request', '"initVarContent" must be a string');
  }
  if (body.variables !== undefined && !isPlainObject(body.variables)) {
    throw new ApiError(400, 'bad-request', '"variables" must be an object');
  }
  const changes = [
    body.schemaContent !== undefined,
    Array.isArray(body.updateRules) && body.updateRules.length > 0,
    body.initVarContent !== undefined,
    body.variables !== undefined,
  ].filter(Boolean).length;
  if (changes === 0) {
    throw new ApiError(400, 'bad-request', 'no card fields were selected for write-back');
  }
  return {
    schemaContent: body.schemaContent,
    updateRules: body.updateRules,
    initVarContent: body.initVarContent,
    variables: body.variables,
  };
}

async function writeCardFile(body) {
  const write = validateCardWriteBody(body);
  const { target, extension } = await resolveCardWriteTarget(body.path);
  let original;
  try {
    original = await readFile(target);
  } catch {
    throw new ApiError(404, 'not-found', 'card file does not exist');
  }

  let output;
  let expectedPayloads;
  let kind;
  let updated;

  if (extension === '.json') {
    let card;
    try {
      card = JSON.parse(original.toString('utf8').replace(/^\uFEFF/u, ''));
    } catch {
      throw new ApiError(400, 'invalid-json', 'card JSON is not valid JSON');
    }
    const applied = applyCardChanges(card, write);
    output = Buffer.from(`${JSON.stringify(applied.card, null, 2)}\n`, 'utf8');
    expectedPayloads = [{ keyword: null, json: applied.card }];
    kind = 'card-json';
    updated = applied.updated;
  } else {
    const parsed = parsePngPayloadsForWrite(original);
    if (parsed === null) {
      throw new ApiError(400, 'invalid-png', 'card PNG is not a valid PNG');
    }
    if (parsed.payloads.length === 0) {
      throw new ApiError(400, 'card-payload-missing', 'card PNG has no readable chara/ccv3 text payload');
    }
    const modified = parsed.payloads.map((payload) => ({
      ...payload,
      expected: applyCardChanges(payload.json, write).card,
    }));
    if (modified.length > 0) updated = ['schema', 'updateRules', 'initVar', 'variables'].filter((name) => {
      if (name === 'schema') return write.schemaContent !== undefined;
      if (name === 'updateRules') return write.updateRules !== undefined && write.updateRules.length > 0;
      if (name === 'initVar') return write.initVarContent !== undefined;
      return write.variables !== undefined;
    });
    const chunks = parsed.chunks.map((chunk) => {
      const match = modified.find((payload) => payload.chunk === chunk);
      return match === undefined
        ? chunk.raw
        : encodePngTextForWrite(match.parsed, match.expected);
    });
    output = Buffer.concat([PNG_SIGNATURE, ...chunks, parsed.trailing]);
    expectedPayloads = modified.map((payload) => ({ keyword: payload.keyword, json: payload.expected }));
    kind = 'card-png';
  }

  if (output.length > MAX_CARD_BYTES) {
    throw new ApiError(413, 'file-too-large', 'written card would exceed 32 MiB');
  }

  const backup = await createCardBackup(target);
  if (extension === '.json') {
    await atomicWrite(target, output.toString('utf8'), 'card');
  } else {
    await atomicWriteBinary(target, output, 'card');
  }

  try {
    const saved = await readFile(target);
    if (extension === '.json') {
      const json = JSON.parse(saved.toString('utf8').replace(/^\uFEFF/u, ''));
      if (JSON.stringify(json) !== JSON.stringify(expectedPayloads[0].json)) throw new Error('json mismatch');
    } else {
      const parsed = parsePngPayloadsForWrite(saved);
      if (parsed === null || parsed.payloads.length !== expectedPayloads.length) throw new Error('png payload count mismatch');
      for (const expected of expectedPayloads) {
        const actual = parsed.payloads.find((payload) => payload.keyword === expected.keyword);
        if (actual === undefined || JSON.stringify(actual.json) !== JSON.stringify(expected.json)) {
          throw new Error('png payload mismatch');
        }
      }
    }
  } catch {
    try { await copyFile(backup, target); } catch {}
    throw new ApiError(500, 'write-verify-failed', 'card read-back verification failed; the backup was restored if possible');
  }

  return {
    ok: true,
    path: target,
    backup,
    kind,
    verified: true,
    updated,
  };
}


async function simulateMvu(body) {
  if (typeof body.initialVariables !== 'string') {
    throw new ApiError(400, 'bad-request', '"initialVariables" must be a string');
  }
  if (body.operations === undefined) {
    throw new ApiError(400, 'bad-request', '"operations" is required');
  }
  if (body.updateRules !== undefined && typeof body.updateRules !== 'string') {
    throw new ApiError(400, 'bad-request', '"updateRules" must be a string');
  }
  if (body.schema !== undefined && typeof body.schema !== 'string') {
    throw new ApiError(400, 'bad-request', '"schema" must be a string');
  }
  if (body.dialect !== undefined && typeof body.dialect !== 'string') {
    throw new ApiError(400, 'bad-request', '"dialect" must be a string');
  }

  try {
    const seed = createMvuSimulationSeed({
      initialVariables: body.initialVariables,
      updateRules: body.updateRules ?? '',
      schema: body.schema ?? '',
      dialect: body.dialect ?? 'rfc6902',
    });
    const result = simulateMvuTurn({
      sourceSignature: seed.sourceSignature,
      currentSourceSignature: seed.sourceSignature,
      dialect: seed.dialect,
      before: seed.before,
      operationInput: body.operations,
      contract: seed.contract,
    });
    // 兼容合同里的 result.trace：保留完整 trace 副本，同时顶层字段仍按原结构返回。
    const trace = JSON.parse(JSON.stringify(result));
    return { ok: true, result: { ...result, trace } };
  } catch (error) {
    if (error instanceof MvuSimulationError || (error && typeof error.code === 'string')) {
      throw new ApiError(400, error.code, error.message || 'MVU simulation failed');
    }
    throw error;
  }
}

async function parseMvuSource(body) {
  if (typeof body.content !== 'string') {
    throw new ApiError(400, 'bad-request', '"content" must be a string');
  }
  const parsed = parseMvuSchema(body.content);
  if (parsed.schema === null) {
    return {
      ok: true,
      schema: null,
      reason: parsed.reason,
      warnings: parsed.warnings,
    };
  }
  return {
    ok: true,
    schema: parsed.schema,
    reason: null,
    warnings: parsed.schema.warnings,
  };
}

/* ---------------- 路由注册 ---------------- */

export function apply(ctx, config = {}) {
  const libraryCache = { root: null };
  const register = (route, label) => ctx.effect(() => ctx.webServer.register(route), label);

  const postRoute = (routePath, work, label) => {
    register({
      kind: 'exact',
      path: routePath,
      handler: (req, res) => handle(ctx, res, async () => {
        if (rejectIfFenced(ctx, req, res, { requireFence: true })) return;
        if (methodOf(req) !== 'POST') {
          sendMethodNotAllowed(res, 'POST');
          return;
        }
        const body = await readJsonBody(req);
        sendJson(res, 200, await work(body));
      }),
    }, label);
  };

  register({
    kind: 'prefix',
    path: LIBRARY_PREFIX,
    handler: (req, res) => handle(ctx, res, () => serveLibrary(ctx, config, libraryCache, req, res)),
  }, 'godhand: GET /godhand/library/*');

  register({
    kind: 'exact',
    path: WORKSPACE_ROUTE,
    handler: (req, res) => handle(ctx, res, async () => {
      if (rejectIfFenced(ctx, req, res, { requireFence: true })) return;
      const method = methodOf(req);
      if (method === 'GET') {
        sendJson(res, 200, await readWorkspaceState());
        return;
      }
      if (method === 'POST') {
        const body = await readJsonBody(req);
        sendJson(res, 200, await saveWorkspaceState(body));
        return;
      }
      sendMethodNotAllowed(res, 'GET, POST');
    }),
  }, 'godhand: GET/POST /godhand/workspace');

  postRoute(WORLDBOOK_ROUTES.select, selectWorldbook, 'godhand: POST /godhand/worldbook/select');
  postRoute(WORLDBOOK_ROUTES.read, readWorldbook, 'godhand: POST /godhand/worldbook/read');
  postRoute(WORLDBOOK_ROUTES.save, saveWorldbook, 'godhand: POST /godhand/worldbook/save');
  postRoute(WORLDBOOK_ROUTES.versions, listVersions, 'godhand: POST /godhand/worldbook/versions');
  postRoute(MVU_ROUTES.select, selectMvu, 'godhand: POST /godhand/mvu/select');
  postRoute(MVU_ROUTES.inspect, inspectMvu, 'godhand: POST /godhand/mvu/inspect');
  postRoute(PROJECT_ROUTES.scan, scanProject, 'godhand: POST /godhand/project/scan');
  postRoute(CARD_ROUTES.list, listCards, 'godhand: POST /godhand/card/list');
  postRoute(CARD_ROUTES.read, readCard, 'godhand: POST /godhand/card/read');
  postRoute(CARD_ROUTES.inspect, inspectCard, 'godhand: POST /godhand/card/inspect');
}
