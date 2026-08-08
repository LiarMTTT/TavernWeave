import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TEXT_EXTENSIONS = new Set(['.json', '.js', '.mjs', '.ts', '.html', '.htm', '.css', '.md', '.txt', '.ejs']);
const SKIP_DIRECTORIES = new Set(['.git', '.private', 'dist', 'node_modules', '__pycache__']);
const SENSITIVE_NAMES = [/^\.env(?:\..*)?$/i, /credentials?/i, /rolecard-workshop-secrets\.secret\.json$/i, /(?:^|[-_.])secrets?(?:[-_.]|$)/i, /\.(?:pem|key|p12|pfx)$/i];

const RULES = [
  { ruleId: 'TWSEC-DOM-001', severity: 'medium', pattern: /\.(?:innerHTML|outerHTML)\s*=/g, message: 'HTML assignment sink requires an inert-data boundary' },
  { ruleId: 'TWSEC-DOM-002', severity: 'medium', pattern: /\.insertAdjacentHTML\s*\(/g, message: 'insertAdjacentHTML requires sanitization and reachability review' },
  { ruleId: 'TWSEC-DOM-003', severity: 'high', pattern: /document\.write(?:ln)?\s*\(/g, message: 'document.write executes an HTML parsing sink' },
  { ruleId: 'TWSEC-EXEC-001', severity: 'high', pattern: /(?:^|[^\w])eval\s*\(/gm, message: 'Dynamic eval execution is present' },
  { ruleId: 'TWSEC-EXEC-002', severity: 'high', pattern: /new\s+Function\s*\(/g, message: 'Dynamic Function construction is present' },
  { ruleId: 'TWSEC-EXEC-003', severity: 'high', pattern: /(?:setTimeout|setInterval)\s*\(\s*["'`]/g, message: 'String-based timer execution is present' },
  { ruleId: 'TWSEC-REMOTE-001', severity: 'medium', pattern: /https?:\/\/[^\s"'`<>]+\.m?js(?:[?#][^\s"'`<>]*)?/gi, message: 'Remote JavaScript dependency requires provenance and runtime review' },
  { ruleId: 'TWSEC-REMOTE-002', severity: 'high', pattern: /javascript\s*:/gi, message: 'Executable javascript URL scheme is present' },
  { ruleId: 'TWSEC-MSG-001', severity: 'medium', pattern: /postMessage\s*\([\s\S]{0,300}?["']\*["']\s*\)/g, message: 'Wildcard postMessage target requires an origin contract' },
  { ruleId: 'TWSEC-SECRET-001', severity: 'high', pattern: /(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*["'][^"'\r\n]{8,}["']/gi, message: 'Credential-shaped literal is present; value is redacted' },
  { ruleId: 'TWSEC-FRAME-001', severity: 'medium', pattern: /sandbox\s*=\s*["'][^"']*allow-scripts[^"']*allow-same-origin[^"']*["']/gi, message: 'Iframe combines scripts and same-origin permissions' },
  { ruleId: 'TWSEC-FRAME-002', severity: 'medium', pattern: /\bsrcdoc\s*=/gi, message: 'Executable iframe srcdoc requires an inert-content contract' },
  { ruleId: 'TWSEC-REGEX-001', severity: 'medium', pattern: /\([^\r\n)]*[+*][^\r\n)]*\)[+*]/g, message: 'Nested quantifier shape requires ReDoS review' }
];

function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function parseArgs(argv) {
  const options = { failOn: 'high' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--report') options.report = argv[++index];
    else if (arg === '--fail-on') options.failOn = argv[++index];
    else if (!options.target) options.target = arg;
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.target) throw new Error('usage: audit-rolecard-security.mjs <target> [--report file] [--fail-on high|medium|none]');
  if (!['high', 'medium', 'none'].includes(options.failOn)) throw new Error('--fail-on must be high, medium, or none');
  return options;
}

function sensitiveName(name) {
  return SENSITIVE_NAMES.some(pattern => pattern.test(name));
}

function collectFiles(target, skipped) {
  const resolved = path.resolve(target);
  if (!fs.existsSync(resolved)) throw new Error(`target does not exist: ${resolved}`);
  const stat = fs.lstatSync(resolved);
  if (stat.isSymbolicLink()) throw new Error('target must not be a symbolic link');
  if (stat.isFile()) {
    if (sensitiveName(path.basename(resolved))) {
      skipped.push({ path: resolved, reason: 'credential-sensitive filename' });
      return [];
    }
    return TEXT_EXTENSIONS.has(path.extname(resolved).toLowerCase()) ? [resolved] : [];
  }
  const files = [];
  const queue = [resolved];
  while (queue.length) {
    const directory = queue.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        skipped.push({ path: full, reason: 'symbolic link' });
        continue;
      }
      if (entry.isDirectory()) {
        if (SKIP_DIRECTORIES.has(entry.name)) skipped.push({ path: full, reason: 'excluded directory' });
        else queue.push(full);
      } else if (entry.isFile()) {
        if (sensitiveName(entry.name)) skipped.push({ path: full, reason: 'credential-sensitive filename' });
        else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(full);
      }
    }
  }
  return files.sort();
}

function lineColumn(text, index) {
  const before = text.slice(0, index);
  const lines = before.split('\n');
  return { line: lines.length, column: lines.at(-1).length + 1 };
}

function relativeFile(file, root) {
  if (fs.statSync(root).isFile()) return path.basename(file);
  return path.relative(root, file).replaceAll('\\', '/');
}

function addFinding(findings, rule, file, text, index) {
  const location = lineColumn(text, index);
  findings.push({ ruleId: rule.ruleId, severity: rule.severity, file, ...location, message: rule.message });
}

export function auditTarget(target) {
  const resolved = path.resolve(target);
  const skipped = [];
  const files = collectFiles(resolved, skipped);
  const findings = [];
  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (error) {
      findings.push({ ruleId: 'TWSEC-PARSE-001', severity: 'medium', file: relativeFile(file, resolved), line: 1, column: 1, message: `UTF-8 read failed: ${error.message}` });
      continue;
    }
    const relative = relativeFile(file, resolved);
    if (path.extname(file).toLowerCase() === '.json') {
      try { JSON.parse(text); }
      catch (error) { findings.push({ ruleId: 'TWSEC-PARSE-002', severity: 'medium', file: relative, line: 1, column: 1, message: `JSON parse failed: ${error.message}` }); }
    }
    for (const rule of RULES) {
      rule.pattern.lastIndex = 0;
      for (let match = rule.pattern.exec(text); match; match = rule.pattern.exec(text)) {
        addFinding(findings, rule, relative, text, match.index);
        if (match[0].length === 0) rule.pattern.lastIndex += 1;
      }
    }
  }
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column || a.ruleId.localeCompare(b.ruleId));
  const byRule = {};
  const summary = { high: 0, medium: 0, low: 0, byRule };
  for (const finding of findings) {
    summary[finding.severity] += 1;
    byRule[finding.ruleId] = (byRule[finding.ruleId] ?? 0) + 1;
  }
  return {
    schemaVersion: 1,
    target: resolved,
    filesScanned: files.length,
    skipped: skipped.map(item => ({ path: path.relative(resolved, item.path).replaceAll('\\', '/') || path.basename(item.path), reason: item.reason })),
    findings,
    summary
  };
}

function failsGate(report, failOn) {
  if (failOn === 'none') return false;
  if (report.summary.high > 0) return true;
  return failOn === 'medium' && report.summary.medium > 0;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = auditTarget(options.target);
    const rendered = canonicalJson(report);
    if (options.report) {
      const reportPath = path.resolve(options.report);
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, rendered, 'utf8');
    }
    process.stdout.write(rendered);
    if (failsGate(report, options.failOn)) process.exitCode = 2;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
