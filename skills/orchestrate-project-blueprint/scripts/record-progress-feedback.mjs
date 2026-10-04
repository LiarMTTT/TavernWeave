#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BoardError, recordFeedback } from './project-board-core.mjs';
import { parseArgs } from './project-board.mjs';

export async function runFeedbackCLI(args) {
  const { command, options } = parseArgs(args);
  if (['help', '--help', '-h'].includes(command) || options.help) {
    process.stdout.write(`node record-progress-feedback.mjs add|update --root <项目根> --input <反馈草稿.json>\n\n草稿须携带 expectedRevision（反馈版本）和 context（画板版本、基线、来源哈希）。\n先通过 project-board.mjs check 或画板读取；不能为冲突自动改成最新版本。\nadd: type、title、text、itemId（可选）、priority、blocking（Bug可选）。\nupdate: id、state、reason、patch（可选）；关闭Bug须先进入 retest，并提供 resolution、verification、verificationEvidence[]。\n成功后写回 progress/feedback.json、递增版本并回读；失败保留输入文件。\n`);
    return;
  }
  if (!['add', 'update'].includes(command) || !options.root || !options.input) throw new BoardError('须指定 add|update、--root 和 --input；详见 help');
  const payload = JSON.parse(await fs.readFile(path.resolve(options.input), 'utf8'));
  const result = await recordFeedback(path.resolve(options.root), command, { ...payload, source: 'project-board-cli' });
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runFeedbackCLI(process.argv.slice(2)).catch((error) => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
