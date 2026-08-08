import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--current' || arg === '--baseline') options[arg.slice(2)] = argv[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.current || !options.baseline) throw new Error('usage: --current <report.json> --baseline <report.json>');
  return options;
}

function loadReport(file) {
  const report = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (report.schemaVersion !== 1 || !report.summary || !report.summary.byRule) throw new Error(`invalid security report: ${file}`);
  return report;
}

export function compareReports(current, baseline) {
  const regressions = [];
  const rules = new Set([...Object.keys(current.summary.byRule), ...Object.keys(baseline.summary.byRule)]);
  for (const ruleId of [...rules].sort()) {
    const currentCount = Number(current.summary.byRule[ruleId] ?? 0);
    const baselineCount = Number(baseline.summary.byRule[ruleId] ?? 0);
    if (currentCount > baselineCount) regressions.push({ ruleId, baseline: baselineCount, current: currentCount, delta: currentCount - baselineCount });
  }
  return { schemaVersion: 1, pass: regressions.length === 0, regressions };
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = compareReports(loadReport(options.current), loadReport(options.baseline));
    process.stdout.write(canonicalJson(result));
    if (!result.pass) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
