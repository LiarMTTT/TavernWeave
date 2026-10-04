#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { BoardError, projectPath, readProjectBoard, initializeBoard, syncBoard, recordFeedback, exportMarkdown, initializeBoardFromSources, planSourceSync, applySourceSync } from './project-board-core.mjs';

const staticFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/board.css', ['board.css', 'text/css; charset=utf-8']],
  ['/board.js', ['board.js', 'text/javascript; charset=utf-8']],
  ['/progress-math.mjs', ['progress-math.mjs', 'text/javascript; charset=utf-8']],
  ['/progress.json', ['progress.json', 'application/json; charset=utf-8']],
  ['/feedback.json', ['feedback.json', 'application/json; charset=utf-8']],
]);
function send(response, status, data, type = 'application/json; charset=utf-8') {
  const content = type.startsWith('application/json') && !Buffer.isBuffer(data) ? JSON.stringify(data) : data;
  response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" });
  response.end(content);
}
async function bodyJSON(request) {
  if (!request.headers['content-type']?.startsWith('application/json')) throw new BoardError('写入请求须使用 JSON', 415);
  let length = 0;
  let tooLong = false;
  const chunks = [];
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 65536) tooLong = true;
    if (!tooLong) chunks.push(chunk);
  }
  if (tooLong) throw new BoardError('反馈过长；本地写入单次上限为 64 KiB', 413);
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new BoardError('反馈 JSON 无效'); }
}
export async function createBoardServer(root) {
  root = await fs.realpath(root);
  await readProjectBoard(root);
  return http.createServer(async (request, response) => {
    try {
      const expectedHost = '127.0.0.1:' + request.socket.localPort;
      if (request.headers.host !== expectedHost) throw new BoardError('仅接受本机画板地址', 403);
      const url = new URL(request.url, 'http://' + expectedHost);
      if (request.method === 'POST' && url.pathname === '/api/feedback') {
        if (request.headers.origin !== 'http://' + expectedHost || request.headers['x-tw-board'] !== 'feedback-v1') throw new BoardError('请从本机画板提交反馈', 403);
        const payload = await bodyJSON(request);
        const result = await recordFeedback(root, payload.operation, { ...payload, source: 'project-board-ui' });
        send(response, 200, result);
        return;
      }
      if (!['GET', 'HEAD'].includes(request.method)) throw new BoardError('该入口不支持此操作', 405);
      if (url.pathname === '/api/board') { send(response, 200, await readProjectBoard(root)); return; }
      if (url.pathname === '/api/export') {
        const snapshot = await readProjectBoard(root);
        if (url.searchParams.get('format') === 'json') send(response, 200, snapshot);
        else send(response, 200, exportMarkdown(snapshot), 'text/markdown; charset=utf-8');
        return;
      }
      const entry = staticFiles.get(url.pathname);
      if (!entry) throw new BoardError('画板入口不存在', 404);
      const bytes = await fs.readFile(await projectPath(root, 'progress/' + entry[0]));
      send(response, 200, request.method === 'HEAD' ? Buffer.alloc(0) : bytes, entry[1]);
    } catch (error) {
      send(response, error.status || 500, { saved: false, error: error.message || '本地服务失败；请检查文件实际状态' });
    }
  });
}

export function parseArgs(args) {
  const options = {};
  const command = args[0] || 'help';
  for (let i = 1; i < args.length; i += 1) {
    const key = args[i];
    if (!key.startsWith('--')) throw new BoardError('参数须使用 --name value：' + key);
    if (['--reviewed-sources', '--help'].includes(key)) options[key.slice(2)] = true;
    else {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new BoardError('缺少参数值：' + key);
      options[key.slice(2)] = args[++i];
    }
  }
  return { command, options };
}
export const help = `TW 项目画板（Node 标准库，本地项目内使用）

node project-board.mjs init --root <项目根> --input <初始范围.json>
node project-board.mjs init-sources --root <项目根> [--design <总设计案相对路径>] [--next <续接文件相对路径>] [--driver-confirmation <确认依据>]
node project-board.mjs source-plan --root <项目根> [--design <相对路径>] [--next <相对路径>] --output <新预览.json>
node project-board.mjs sync-sources --root <项目根> --plan <已核对预览.json> [--driver-confirmation <确认依据>]
node project-board.mjs check --root <项目根>
node project-board.mjs sync --root <项目根> --input <完整画板.json> --expected-revision <整数> [--reviewed-sources] [--driver-confirmation <明确确认依据>]
node project-board.mjs export --root <项目根> [--format md|json] [--output <新文件路径>]
node project-board.mjs serve --root <项目根> [--port 0]

初始范围 JSON 包含 project、baseline、sources、items；sources 中 id: next 指向实际续接入口。
init 拒绝覆盖 progress/；权重缺省为 1，未确认范围不显示数字进度。
sync 的输入为完整 progress.json；来源变化先核查再使用 --reviewed-sources；改分母须登记新基线。
采用总设计案 tw-progress-scope 与 NEXT tw-progress-state 后，使用 source-plan / sync-sources。
同步预览绑定来源、画板、反馈与证据版本；变动后须重新核对。启用后不再接受手填 sync。
新增驾驶员通过记录须提供 --driver-confirmation，不能用自动检查代替用户确认。
serve 只绑定 127.0.0.1。停止终端服务即可停止写入；静态预览仍可只读和导出草稿。
反馈使用 record-progress-feedback.mjs；check/export 的 JSON 包含提交所需 context。
export 指定文件时拒绝覆盖已有文件，不改项目权威。
`;
export async function runCLI(args) {
  const { command, options } = parseArgs(args);
  if (['help', '--help', '-h'].includes(command) || options.help) { process.stdout.write(help); return; }
  if (!options.root) throw new BoardError('须明确指定 --root 项目根目录');
  const root = path.resolve(options.root);
  const input = async () => {
    if (!options.input) throw new BoardError('须指定 --input JSON 文件');
    const value = JSON.parse(await fs.readFile(path.resolve(options.input), 'utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BoardError('输入须为 JSON 对象');
    return value;
  };
  let result;
  if (command === 'init') result = await initializeBoard(root, await input(), { driverConfirmation: options['driver-confirmation'] });
  else if (command === 'init-sources') result = await initializeBoardFromSources(root, { design: options.design, next: options.next, driverConfirmation: options['driver-confirmation'] });
  else if (command === 'source-plan') {
    result = await planSourceSync(root, { design: options.design, next: options.next });
    if (options.output) {
      const content = JSON.stringify(result, null, 2) + '\n';
      await fs.writeFile(path.resolve(options.output), content, { flag: 'wx' });
      result = { preview: path.resolve(options.output), differences: result.differences, progress: result.progress, savedToBoard: false };
    }
  } else if (command === 'sync-sources') {
    if (!options.plan) throw new BoardError('须指定 --plan 已核对的同步预览 JSON');
    result = await applySourceSync(root, JSON.parse(await fs.readFile(path.resolve(options.plan), 'utf8')), { driverConfirmation: options['driver-confirmation'] });
  }
  else if (command === 'check') {
    result = await readProjectBoard(root);
    result.ok = !result.stale && !result.evidenceError && !result.authorityError;
    if (!result.ok) process.exitCode = 1;
  } else if (command === 'sync') {
    const revision = Number(options['expected-revision']);
    if (!Number.isSafeInteger(revision) || revision < 0 || options['expected-revision'] === undefined) throw new BoardError('须指定 --expected-revision 非负整数');
    result = await syncBoard(root, await input(), revision, { reviewedSources: options['reviewed-sources'] === true, driverConfirmation: options['driver-confirmation'] });
  } else if (command === 'export') {
    const snapshot = await readProjectBoard(root);
    const format = options.format || 'md';
    if (!['md', 'json'].includes(format)) throw new BoardError('导出格式须为 md 或 json');
    const content = format === 'md' ? exportMarkdown(snapshot) : JSON.stringify(snapshot, null, 2) + '\n';
    if (!options.output) { process.stdout.write(content); return; }
    await fs.writeFile(path.resolve(options.output), content, { flag: 'wx' });
    result = { exported: path.resolve(options.output), format, bytes: Buffer.byteLength(content) };
  } else if (command === 'serve') {
    const port = Number(options.port || 0);
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new BoardError('端口须为 0 到 65535；0 自动选择空闲端口');
    const server = await createBoardServer(root);
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
    process.stdout.write(JSON.stringify({ url: 'http://127.0.0.1:' + server.address().port + '/', project: root, writeScope: 'progress/feedback.json', mode: 'local' }) + '\n');
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
    return server;
  } else throw new BoardError('未知操作：' + command);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCLI(process.argv.slice(2)).catch((error) => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
