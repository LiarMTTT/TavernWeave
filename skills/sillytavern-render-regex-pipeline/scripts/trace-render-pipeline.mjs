import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { canonicalJson, loadRules } from './validate-tavern-regex.mjs';
import { runCases } from './run-regex-fixtures.mjs';

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--regex' || arg === '--fixtures') options[arg.slice(2)] = argv[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.regex || !options.fixtures) throw new Error('usage: --regex <file> --fixtures <file>');
  return options;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = runCases(loadRules(options.regex), JSON.parse(fs.readFileSync(options.fixtures, 'utf8')));
    const trace = {
      schemaVersion: 1,
      unsupportedHostStages: [
        'macro-expansion',
        'markdown-rendering',
        'prompt-assembly',
        'trimStrings-internals',
        'cross-scope-rule-order',
        'message-lifecycle'
      ],
      errors: report.errors,
      cases: report.results.map(result => ({ id: result.id, input: result.input, output: result.output, expected: result.expected, pass: result.pass, stages: result.trace }))
    };
    process.stdout.write(canonicalJson(trace));
    if (report.errors.length) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
