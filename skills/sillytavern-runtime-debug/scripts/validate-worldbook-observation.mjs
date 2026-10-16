import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

// Validates a receipt, never the host behavior or the referenced evidence itself.
const statuses = new Set(['not-run', 'blocked', 'pass', 'fail']);
const observedKeys = [
  'entry', 'condition', 'target', 'read', 'output', 'finalRequest',
  'stateBefore', 'stateAfter', 'selectionBefore', 'selectionAfter', 'ui', 'nextRequest',
];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const count = value => Number.isSafeInteger(value) && value >= 0;

export function validateObservation(record) {
  const errors = [];
  const require = (ok, message) => { if (!ok) errors.push(message); };
  if (!object(record)) return { valid: false, errors: ['Record must be an object.'] };
  require(record.schemaVersion === 1, 'schemaVersion must be 1.');
  require(record.evidenceLevel === 'runtime-observation', 'evidenceLevel must be runtime-observation.');
  require(text(record.caseId), 'caseId must identify the case.');
  require(text(record.artifact), 'artifact must identify the exact candidate.');
  require(statuses.has(record.runtimeStatus), 'runtimeStatus is invalid.');
  require(statuses.has(record.modelStatus), 'modelStatus is invalid.');
  require(object(record.environment), 'environment must be an object.');
  require(object(record.authorization), 'authorization must be an object.');
  require(object(record.input), 'input must be an object.');
  require(object(record.expected), 'expected must be separate from observed.');
  require(object(record.observed), 'observed must be an object.');
  for (const scope of ['runtime', 'model']) {
    const blockers = record[`${scope}Blockers`];
    require(Array.isArray(blockers) && blockers.every(text), `${scope}Blockers must be a string array.`);
    if (record[`${scope}Status`] === 'blocked' || record[`${scope}Status`] === 'fail') {
      require(Array.isArray(blockers) && blockers.length > 0, `A blocked/failed ${scope} needs its own explicit reason.`);
    }
    if (record[`${scope}Status`] === 'pass') {
      require(Array.isArray(blockers) && blockers.length === 0, `${scope} pass cannot retain unresolved ${scope} blockers.`);
    }
  }
  require(!Object.hasOwn(record, 'blockers'), 'Replace unscoped blockers with runtimeBlockers and modelBlockers.');
  const observed = object(record.observed) ? record.observed : {};
  for (const key of observedKeys) {
    require(Object.hasOwn(observed, key), `observed.${key} is required; use null when not observed.`);
    require(observed[key] === null || object(observed[key]), `observed.${key} must be null or a structured observation.`);
  }
  if (record.runtimeStatus === 'not-run') {
    require(Object.values(observed).every(value => value === null), 'not-run cannot contain observed results.');
    require(record.modelStatus === 'not-run' || record.modelStatus === 'blocked', 'A model result cannot accompany an unexecuted runtime receipt.');
  }
  const finalRequest = observed.finalRequest;
  if (object(finalRequest)) {
    require(text(finalRequest.evidenceRef), 'finalRequest needs a capture evidenceRef.');
    require(text(finalRequest.recipient), 'finalRequest needs its actual model/consumer recipient.');
    if (finalRequest.tokenCount != null) {
      require(count(finalRequest.tokenCount), 'tokenCount must be a non-negative integer.');
      require(text(finalRequest.tokenizer), 'A token count needs the actual tokenizer identity.');
      require(['final-request', 'worldbook-fragment'].includes(finalRequest.measurementScope), 'A token count needs its measurement scope.');
    }
  }
  if (record.runtimeStatus === 'pass') {
    const env = record.environment ?? {};
    require(text(env.sillytavern) && text(env.browser) && text(env.configurationRef), 'Runtime pass requires the named host, browser and configuration evidence.');
    require(object(env.extensions) && Object.values(env.extensions).every(text), 'All participating extensions need identified versions.');
    require(text(record.authorization?.environmentRef) && Array.isArray(record.authorization?.operations)
      && record.authorization.operations.length > 0 && record.authorization.operations.every(text), 'Runtime pass requires an authorized environment and operation scope.');
    require(typeof observed.entry?.reached === 'boolean' && text(observed.entry?.evidenceRef), 'Runtime pass requires an observed entry boundary.');
    require([true, false, 'missing', 'not-evaluated', 'not-applicable'].includes(observed.condition?.result)
      && text(observed.condition?.evidenceRef), 'Runtime pass requires the observed condition result or explicit inapplicability.');
    if (observed.entry?.reached === false) {
      require(observed.condition?.result === 'not-evaluated', 'An unreachable entry cannot have an evaluated condition.');
      require(observed.output?.codePoints === 0, 'An unreachable entry cannot emit output in this receipt.');
    }
    require(count(observed.output?.codePoints) && text(observed.output?.evidenceRef), 'Runtime pass requires captured output length and evidence.');
    require(object(finalRequest) && finalRequest.captured === true, 'Runtime pass requires the actual final request capture.');
  }
  if (record.modelStatus === 'pass' || record.modelStatus === 'fail') {
    require(record.runtimeStatus === 'pass' || record.runtimeStatus === 'fail', 'Model behavior needs an executed runtime receipt.');
    require(text(record.modelEvidenceRef), 'Model behavior needs its own evidence reference.');
  } else {
    require(record.modelEvidenceRef === null, 'Unobserved model behavior must keep modelEvidenceRef null.');
  }
  return { valid: errors.length === 0, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node validate-worldbook-observation.mjs observation.json');
    const record = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    const result = validateObservation(record);
    console.log(JSON.stringify({
      ...result,
      validation: 'receipt-structure-only',
      runtimeStatus: record.runtimeStatus ?? null,
      modelStatus: record.modelStatus ?? null,
      evidenceContentsVerified: false,
    }, null, 2));
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({ valid: false, error: error.message, validation: 'receipt-structure-only' }));
    process.exitCode = 1;
  }
}
