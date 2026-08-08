import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { canonicalJson, detectDialect, loadRules, parseRegex, validateRules } from './validate-tavern-regex.mjs';

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

function depthEligible(minimum, maximum, depth) {
  if (depth === undefined || depth === null) return { eligible: true, tested: false };
  if (minimum !== undefined && minimum !== null && depth < minimum) return { eligible: false, tested: true };
  if (maximum !== undefined && maximum !== null && depth > maximum) return { eligible: false, tested: true };
  return { eligible: true, tested: true };
}

function evaluateEligibility(rule, fixture) {
  const dialect = detectDialect(rule);
  const stages = [];
  const enabled = dialect === 'card' ? rule.disabled !== true : rule.enabled === true;
  stages.push({ stage: 'enabled', pass: enabled });
  if (!enabled) return { eligible: false, dialect, stages };

  let sourcePass;
  if (dialect === 'card') {
    sourcePass = Number.isInteger(fixture.placement) && rule.placement.includes(fixture.placement);
    stages.push({ stage: 'placement', pass: sourcePass, expected: fixture.placement });
  } else {
    sourcePass = typeof fixture.source === 'string' && rule.source?.[fixture.source] === true;
    stages.push({ stage: 'source', pass: sourcePass, expected: fixture.source });
  }
  if (!sourcePass) return { eligible: false, dialect, stages };

  let destinationPass = false;
  if (dialect === 'card') {
    destinationPass = fixture.destination === 'display'
      ? rule.promptOnly !== true
      : fixture.destination === 'prompt' && rule.markdownOnly !== true;
  } else {
    destinationPass = rule.destination?.[fixture.destination] === true;
  }
  stages.push({ stage: 'destination', pass: destinationPass, expected: fixture.destination });
  if (!destinationPass) return { eligible: false, dialect, stages };

  const depth = dialect === 'card'
    ? depthEligible(rule.minDepth, rule.maxDepth, fixture.depth)
    : depthEligible(rule.min_depth, rule.max_depth, fixture.depth);
  stages.push({ stage: 'depth', pass: depth.eligible, tested: depth.tested, expected: fixture.depth ?? null });
  return { eligible: depth.eligible, dialect, stages };
}

function applyRule(rule, input) {
  const dialect = detectDialect(rule);
  const regex = parseRegex(dialect === 'card' ? rule.findRegex : rule.find_regex);
  const replacement = dialect === 'card' ? rule.replaceString : rule.replace_string;
  return input.replace(regex, replacement);
}

export function runCases(regexValue, fixtureValue) {
  const validation = validateRules(regexValue);
  const errors = [...validation.errors];
  const rules = validation.rules;
  if (fixtureValue?.schemaVersion !== 1 || !Array.isArray(fixtureValue.cases)) errors.push('fixtures must use schemaVersion 1 and a cases array');
  const seen = new Set();
  const results = [];
  for (const fixture of fixtureValue?.cases ?? []) {
    if (typeof fixture.id !== 'string' || fixture.id === '') errors.push('fixture id must be a non-empty string');
    else if (seen.has(fixture.id)) errors.push(`duplicate fixture id: ${fixture.id}`);
    else seen.add(fixture.id);
    if (typeof fixture.input !== 'string') errors.push(`fixture ${fixture.id} input must be a string`);
    if (!['display', 'prompt'].includes(fixture.destination)) errors.push(`fixture ${fixture.id} destination must be display or prompt`);
    let output = fixture.input;
    const trace = [];
    for (const rule of rules) {
      const eligibility = evaluateEligibility(rule, fixture);
      const before = output;
      if (eligibility.eligible) output = applyRule(rule, output);
      trace.push({ ruleId: rule.id, ...eligibility, input: before, output, applied: eligibility.eligible && before !== output });
    }
    const hasExpected = typeof fixture.expected === 'string';
    results.push({
      id: fixture.id,
      input: fixture.input,
      output,
      expected: hasExpected ? fixture.expected : null,
      pass: !hasExpected || output === fixture.expected,
      trace
    });
  }
  return {
    schemaVersion: 1,
    ruleCount: rules.length,
    caseCount: results.length,
    passed: results.filter(result => result.pass).length,
    failed: results.filter(result => !result.pass).length,
    errors,
    warnings: validation.warnings,
    results
  };
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = runCases(loadRules(options.regex), JSON.parse(fs.readFileSync(options.fixtures, 'utf8')));
    process.stdout.write(canonicalJson(report));
    if (report.errors.length || report.failed) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
