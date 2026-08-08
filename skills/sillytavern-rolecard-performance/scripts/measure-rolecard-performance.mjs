import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PROMPT_FIELDS = new Set([
  'description', 'personality', 'scenario', 'first_mes', 'mes_example',
  'system_prompt', 'post_history_instructions', 'alternate_greetings'
]);
const REGEX_FIELDS = new Set(['findRegex', 'replaceString', 'find_regex', 'replace_string']);

export function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function utf8Bytes(value) {
  return Buffer.byteLength(value, 'utf8');
}

function pathText(parts) {
  return parts.reduce((result, part) => typeof part === 'number' ? `${result}[${part}]` : `${result}.${part}`, '$');
}

function inWorldbook(parts) {
  return parts.includes('entries') && (parts.includes('character_book') || parts.includes('worldbook') || parts.includes('characterBook'));
}

function inHelperScripts(parts) {
  return parts.includes('tavern_helper') && parts.includes('scripts');
}

function dataUriBytes(value) {
  const match = /^data:[^,]*;base64,([A-Za-z0-9+/=\r\n]+)$/i.exec(value);
  if (!match) return 0;
  try { return Buffer.from(match[1].replace(/\s/g, ''), 'base64').length; }
  catch { return 0; }
}

export function measureCard(value, rawText, identity = {}) {
  const metrics = {
    fileBytes: utf8Bytes(rawText),
    stringBytes: 0,
    maxStringBytes: 0,
    embeddedDataBytes: 0,
    promptBytes: 0,
    worldbookEntries: 0,
    worldbookBytes: 0,
    regexCount: 0,
    regexBytes: 0,
    helperScriptCount: 0,
    helperScriptBytes: 0,
    remoteUrlCount: 0
  };
  let maxStringPath = null;
  const walk = (node, parts) => {
    if (typeof node === 'string') {
      const bytes = utf8Bytes(node);
      metrics.stringBytes += bytes;
      if (bytes > metrics.maxStringBytes) {
        metrics.maxStringBytes = bytes;
        maxStringPath = pathText(parts);
      }
      metrics.embeddedDataBytes += dataUriBytes(node);
      metrics.remoteUrlCount += (node.match(/https?:\/\/[^\s"'<>]+/gi) ?? []).length;
      const field = parts.at(-1);
      if (PROMPT_FIELDS.has(field)) metrics.promptBytes += bytes;
      if (field === 'content' && inWorldbook(parts)) metrics.worldbookBytes += bytes;
      if (REGEX_FIELDS.has(field) && parts.includes('regex_scripts')) metrics.regexBytes += bytes;
      if (field === 'content' && inHelperScripts(parts)) metrics.helperScriptBytes += bytes;
      return;
    }
    if (Array.isArray(node)) {
      const field = parts.at(-1);
      if (field === 'regex_scripts') metrics.regexCount += node.filter(item => item && typeof item === 'object').length;
      if (field === 'entries' && inWorldbook(parts)) metrics.worldbookEntries += node.filter(item => item && typeof item === 'object').length;
      node.forEach((item, index) => walk(item, [...parts, index]));
      return;
    }
    if (node && typeof node === 'object') {
      if (node.type === 'script' && inHelperScripts(parts)) metrics.helperScriptCount += 1;
      for (const [key, child] of Object.entries(node)) walk(child, [...parts, key]);
    }
  };
  walk(value, []);
  return {
    schemaVersion: 1,
    identity: {
      file: identity.file ?? null,
      sha256: crypto.createHash('sha256').update(rawText, 'utf8').digest('hex')
    },
    metrics,
    metricPaths: { maxStringPath },
    redaction: 'No string values, URLs, scripts, prompts, or embedded payloads are included.'
  };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--card' || arg === '--out') options[arg.slice(2)] = argv[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.card) throw new Error('usage: --card <rolecard.json> [--out report.json]');
  return options;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const cardPath = path.resolve(options.card);
    const rawText = fs.readFileSync(cardPath, 'utf8');
    const value = JSON.parse(rawText);
    const report = measureCard(value, rawText, { file: cardPath });
    const output = canonicalJson(report);
    if (options.out) {
      const out = path.resolve(options.out);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, output, 'utf8');
    }
    process.stdout.write(output);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
