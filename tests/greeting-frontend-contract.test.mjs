import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// These checks protect the authored guidance. They do not execute a card or prove
// display, model delivery, interaction, or acceptance in real SillyTavern.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const builder = 'skills/tavern-card-builder/references/';
const types = read(`${builder}card-types-and-runtime-dependencies.md`);
const opening = read(`${builder}opening-strategies.md`);
const writing = read(`${builder}card-writing.md`);
const validation = read(`${builder}validation.md`);
const ui = read('skills/sillytavern-embedded-ui/SKILL.md');

test('the common core accepts frontend greetings without duplicate prose', () => {
  assert.match(types, /greeting may be text, an opening frontend, or a combination of both/u);
  assert.match(types, /usable opening frontend satisfies the greeting requirement without an additional\s+plain-text version/u);
  assert.match(types, /requires both a usable greeting and a\s+worldbook/u);
  assert.match(types, /decorative shell with no usable opening/u);
  assert.match(types, /empty greeting field/u);
});

test('greeting presentation changes neither runtime type nor later UI scope', () => {
  const table = types.split('Primary types:')[1].split('These are the three current types.')[0];
  assert.deepEqual([...table.matchAll(/^\| `(\w+)` \|/gmu)].map(x => x[1]), ['text', 'mvu_zod', 'hybrid']);
  assert.match(types, /neither changes the primary card type\s+nor determines whether later play uses a frontend/u);
  assert.match(types, /opening frontend or text\/regex status display does not require MVU/u);
  assert.match(types, /component count alone does not\s+justify `hybrid`/u);
});

test('frontend guidance preserves a real carrier and a useful player entry', () => {
  assert.match(opening, /actual carrier in `first_mes` or the applicable\s+`alternate_greetings` branch/u);
  assert.match(opening, /marker whose page never loads does not establish a usable greeting/u);
  assert.match(opening, /normal\s+chat input or its declared controls/u);
});

test('player presentation is not assumed to be model-visible or duplicated prose', () => {
  assert.match(opening, /Check player-visible content separately from model-visible content/u);
  assert.match(opening, /model does\s+not see a page merely because the player sees it/u);
  assert.match(opening, /this is not a second required prose greeting/u);
  assert.match(opening, /Check the actual request/u);
});

test('controls and adopted state retain their real behavior checks', () => {
  const contentPage = read('skills/sillytavern-embedded-ui/references/message-content-ui.md');
  assert.match(contentPage, /control changes only the current view or creates a real player\s+message/u);
  assert.match(contentPage, /prevent\s+duplicate submission, and expose failure/u);
  assert.match(opening, /For a greeting that actually uses MVU state/u);
  assert.match(opening, /verify the stored state for every alternate greeting/u);
  assert.match(opening, /Do not call a low-level state replacement function to simulate initialization/u);
});

test('frontend presentation and setup-wizard transactions have distinct scope', () => {
  assert.match(ui, /Opening page \| Present the greeting or support opening selection\/setup/u);
  assert.match(ui, /transaction rules when implementing a custom setup wizard/u);
  assert.match(ui, /Mark the opening committed only after the real user message is confirmed/u);
  assert.match(ui, /confirmation, a real player message and a real\s+assistant reply without duplicate submission/u);
  assert.match(ui, /Verify variable initialization when\s+the adopted state system requires it/u);
  assert.match(opening, /remote page should remain declarative/u);
  assert.match(opening, /submission needs validation, confirmation, snapshot, rollback, and safe retry/u);
});

test('authoring and assessment refer back to the core and retain host evidence limits', () => {
  assert.match(writing, /UI-only openings must still\s+provide the selected interactive entry and its intended starting conditions/u);
  assert.match(validation, /rather than marking a working frontend greeting as missing/u);
  assert.match(validation, /test sends or state\s+writes only where the page provides them/u);
  assert.match(validation, /Offline HTML or headless checks do not close this gate/u);
  assert.match(ui, /Do not mark runtime cases as passed here unless citing a separate runtime-debug report/u);
});
