#!/usr/bin/env python3
"""Local, source-backed work libraries. No model calls, browsing or downloads."""
import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import sys
import tempfile
from urllib.parse import urlparse

_SOURCE_CACHE = {}


class LibraryError(ValueError):
    pass


def require(value, message):
    if not value:
        raise LibraryError(message)


def stamp():
    return datetime.now(timezone.utc).isoformat()


def dump(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + '\n'


def digest(data):
    return hashlib.sha256(data if isinstance(data, bytes) else data.encode('utf-8')).hexdigest()


def load(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def identifier(value):
    require(isinstance(value, str) and re.fullmatch(r'[a-z0-9][a-z0-9_-]{0,95}', value), 'Invalid stable ID')
    return value


def integer(value, minimum=0):
    require(type(value) is int and value >= minimum, 'Expected a bounded non-negative integer')
    return value


def safe(root, relative):
    path = root / relative
    require(not Path(relative).is_absolute() and path.resolve().is_relative_to(root.resolve()), 'Path escapes project')
    for part in (path, *path.parents):
        require(not part.is_symlink(), 'Linked project paths are not supported')
        if part == root:
            break
    return path


def atomic(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temp = tempfile.mkstemp(prefix='.tw-write-', dir=path.parent)
    try:
        with os.fdopen(descriptor, 'w', encoding='utf-8', newline='\n') as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp, path)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


def file_hash(path):
    return digest(path.read_bytes()) if path.exists() else None


@contextmanager
def locked(root):
    _SOURCE_CACHE.clear()
    require(root.is_dir() and safe(root, 'project.json').is_file(), 'Initialize a project first')
    require(load(root / 'project.json').get('schema') == 'tw/work-library/v1', 'Unsupported project format')
    lock_path = safe(root, '.state/writer.sqlite')
    connection = sqlite3.connect(lock_path, timeout=1)
    try:
        connection.execute('BEGIN IMMEDIATE')
        yield
    finally:
        connection.rollback()
        connection.close()


def recover(root):
    pending = safe(root, '.state/pending.json')
    if not pending.exists():
        return {'recovered': False}
    transaction = load(pending)
    # Preflight all destinations before completing an interrupted group of writes.
    for row in transaction['writes']:
        path = safe(root, row['path'])
        require(file_hash(path) in (row['before'], digest(row['text'])), 'Recovery conflict: ' + row['path'])
    for row in transaction['writes']:
        path = safe(root, row['path'])
        if file_hash(path) != digest(row['text']):
            require(file_hash(path) == row['before'], 'Concurrent edit: ' + row['path'])
            atomic(path, row['text'])
    pending.unlink()
    return {'recovered': True, 'operation': transaction['operation']}


def transaction(root, writes, operation):
    require(not safe(root, '.state/pending.json').exists(), 'Run recover before another write')
    rows = []
    for name, (text, expected) in writes.items():
        path = safe(root, name)
        require(file_hash(path) == expected, 'Concurrent edit: ' + name)
        rows.append({'path': name, 'text': text, 'before': expected})
    atomic(root / '.state/pending.json', dump({'operation': operation, 'writes': rows}))
    recover(root)


def write_object(root, relative, value):
    transaction(root, {relative: (dump(value), file_hash(safe(root, relative)))}, relative)


def init(root, title):
    require(not root.exists(), 'Project target already exists; refusing to overwrite')
    skill_root = Path(__file__).resolve().parents[1]
    require(not root.resolve().is_relative_to(skill_root), 'Project data cannot live inside the Skill')
    root.mkdir(parents=True)
    for name in ('sources', 'records', 'index', 'batches', '.state'):
        (root / name).mkdir()
    atomic(root / 'project.json', dump({'schema': 'tw/work-library/v1', 'title': title, 'created': stamp(), 'authority': 'records/*.md', 'sourceAuthority': 'sources descriptors and verified excerpts'}))
    atomic(root / '.state/state.json', dump({'completed': [], 'active': None, 'batches': 0, 'calls': 0, 'measured_tokens': 0, 'unmeasured_calls': 0, 'paused': False}))
    return {'created': True, 'project': str(root), 'modelCalls': 0}


def split_text(text, size):
    headings = list(re.finditer(r'(?m)^(?:第[^\n]{1,32}[章节回卷][^\n]*|chapter\s+[^\n]+|#{1,3}\s+[^\n]+)$', text, re.I))
    boundaries = sorted(set([0, len(text)] + [match.start() for match in headings]))
    units = []
    for entry, (start, end) in enumerate(zip(boundaries, boundaries[1:]), 1):
        title = text[start:end].split('\n', 1)[0][:100]
        position = start
        while position < end:
            stop = min(position + size, end)
            if stop < end:
                newline = text.rfind('\n', position + size // 2, stop)
                if newline > position:
                    stop = newline + 1
            units.append({'id': f'u{len(units) + 1:06}', 'entry': entry, 'title': title, 'start': position, 'end': stop})
            position = stop
    return units


def source(root, sid):
    key = (str(root), sid)
    if key in _SOURCE_CACHE:
        return _SOURCE_CACHE[key]
    obj = load(safe(root, 'sources/' + identifier(sid) + '.json'))
    obj['_descriptor_sha256'] = file_hash(root / 'sources' / (sid + '.json'))
    if obj['kind'] != 'image':
        text = safe(root, 'sources/' + sid + '.txt').read_text(encoding='utf-8')
        require(digest(text) == obj['text_sha256'], 'Source text changed; register a new edition instead')
        obj['_text'] = text
    _SOURCE_CACHE[key] = obj
    return obj


def catalog(root):
    return [source(root, path.stem) for path in sorted(safe(root, 'sources').glob('*.json'))]


def corpus_hash(root):
    return digest(dump([{k: v for k, v in item.items() if not k.startswith('_')} for item in catalog(root)]))


def add_source(root, obj, text_path=None, chunk_chars=6000):
    sid = identifier(obj.get('id'))
    require(obj.get('kind') in ('local-text', 'web-text', 'image'), 'Unsupported source kind')
    require(obj.get('realm') in ('canon', 'reference', 'fanon', 'unknown'), 'Label canon/reference/fanon/unknown explicitly')
    for field in ('title', 'continuity', 'edition', 'provenance', 'rights'):
        require(isinstance(obj.get(field), str) and obj[field].strip(), 'Missing source field: ' + field)
    require(obj.get('phase') is None or type(obj['phase']) is int and obj['phase'] >= 0, 'Phase must be non-negative or null')
    state = load(root / '.state/state.json')
    require(state['active'] is None, 'Finish the active batch before changing the source set')
    require(not safe(root, f'sources/{sid}.json').exists(), 'Source ID already exists')
    obj = dict(obj)
    require(not any(key.startswith('_') for key in obj), 'Reserved source field')
    writes = {}
    if obj['kind'] != 'local-text':
        parsed = urlparse(obj.get('url', ''))
        require(parsed.scheme in ('http', 'https') and parsed.hostname and not parsed.username and not parsed.password, 'Expected a public source page URL without credentials')
        require(isinstance(obj.get('retrieved_at'), str) and obj['retrieved_at'], 'Record retrieval time')
    if obj['kind'] == 'image':
        require(text_path is None, 'Image sources store reference metadata, not a text pretending to be pixels')
        require(obj.get('inspection') in ('not-viewed', 'viewed') and isinstance(obj.get('inspection_ref'), str), 'Record actual image inspection status and receipt')
        require(obj.get('use') == 'reference-only', 'This tool registers image references; it does not authorize asset reuse/download')
        obj['units'] = [{'id': 'u000001', 'entry': 1, 'title': obj['title']}]
    else:
        require(text_path is not None, 'Text source needs a local UTF-8 input')
        integer(chunk_chars, 256)
        require(chunk_chars <= 20000, 'Chunk size exceeds bounded context limit')
        text = Path(text_path).read_text(encoding='utf-8-sig').replace('\r\n', '\n').replace('\r', '\n')
        require(text.strip(), 'Empty source')
        obj['text_sha256'] = digest(text)
        obj['units'] = split_text(text, chunk_chars)
        obj['characters'] = len(text)
        writes[f'sources/{sid}.txt'] = (text, None)
    obj['registered_at'] = stamp()
    writes[f'sources/{sid}.json'] = (dump(obj), None)
    transaction(root, writes, 'add-source')
    titles = [unit['title'] for unit in obj['units'] if unit['id'] == 'u000001' or unit['entry'] != obj['units'][int(unit['id'][1:]) - 2]['entry']]
    return {'source_id': sid, 'units': len(obj['units']), 'duplicate_titles': sorted({title for title in titles if titles.count(title) > 1}), 'modelTokens': None}


def usage_valid(obj):
    require(isinstance(obj, dict), 'Usage must be a JSON object')
    integer(obj.get('calls'), 1)
    require(obj.get('kind') in ('measured', 'estimated', 'unavailable'), 'Label token evidence accurately')
    require(isinstance(obj.get('provenance'), str) and obj['provenance'].strip(), 'Usage needs a source receipt or unavailability explanation')
    if obj['kind'] == 'unavailable':
        require(obj.get('input_tokens') is None and obj.get('output_tokens') is None, 'Unavailable tokens must be null')
        return None
    return integer(obj.get('input_tokens')) + integer(obj.get('output_tokens'))


def benchmark(root, report):
    require(load(root / '.state/state.json')['active'] is None, 'Active batch exists')
    require(isinstance(report.get('samples'), list) and report['samples'], 'A real sample report is required')
    ids = []
    for sample in report['samples']:
        require(isinstance(sample, dict), 'Each sample must be an object')
        ids.append(identifier(sample.get('id')))
        require(sample.get('strategy') in ('sequential', 'native-subagents'), 'Unknown execution strategy')
        require(sample.get('source_ids') and all(sid in {s['id'] for s in catalog(root)} for sid in sample['source_ids']), 'Sample source missing')
        usage_valid(sample['usage'])
        questions = sample.get('questions')
        require(isinstance(questions, list) and questions, 'Evaluate retrieval questions, not file counts')
        for question in questions:
            require(isinstance(question, dict), 'Each quality question must be an object')
            require(all(isinstance(question.get(key), str) and question[key].strip() for key in ('question', 'answer', 'evidence')), 'Incomplete quality evidence')
            require(type(question.get('pass')) is bool, 'Question result must be explicit')
        integer(sample.get('unsupported_assertions'))
    require(len(set(ids)) == len(ids) and report.get('selected') in ids and report.get('reason'), 'Select a unique sample strategy and explain why')
    report = dict(report, corpus_sha256=corpus_hash(root), recorded_at=stamp(), evidence_status='caller-recorded-not-machine-semantic-acceptance')
    write_object(root, '.state/benchmark.json', report)
    return {'recorded': True, 'benchmark_sha256': file_hash(root / '.state/benchmark.json')}


def set_plan(root, plan):
    state = load(root / '.state/state.json')
    require(state['active'] is None, 'Finish the active batch first')
    report = load(root / '.state/benchmark.json')
    require(report['corpus_sha256'] == corpus_hash(root), 'Source set changed since sample evaluation')
    require(plan.get('benchmark_sha256') == file_hash(root / '.state/benchmark.json'), 'Plan must bind the exact benchmark')
    selected = next(sample for sample in report['samples'] if sample['id'] == report['selected'])
    require(selected['unsupported_assertions'] == 0 and all(q['pass'] for q in selected['questions']), 'Selected sample has unresolved quality failures')
    require(plan.get('authorization_note') and plan.get('goal'), 'Record the actual user scope and intended deliverable')
    require(plan.get('strategy') == selected['strategy'], 'Benchmark a changed strategy before batching')
    require(isinstance(plan.get('roles'), dict) and plan['roles'] and all(isinstance(value, str) and value.strip() for value in plan['roles'].values()), 'Define project-specific role responsibilities')
    for field in ('max_batches', 'max_calls', 'calls_per_batch', 'max_units_per_batch'):
        integer(plan.get(field), 1)
    require(plan['max_units_per_batch'] <= 8 and plan['calls_per_batch'] <= plan['max_calls'], 'Unbounded batch allocation')
    known = {s['id'] + '/' + u['id'] for s in catalog(root) for u in s['units']}
    require(plan.get('units') and len(set(plan['units'])) == len(plan['units']) and set(plan['units']) <= known, 'Explicit unique source units required')
    if plan.get('token_limit') is not None:
        integer(plan['token_limit'], 1)
        integer(plan.get('tokens_per_batch'), 1)
        require(selected['usage']['kind'] == 'measured' and plan['tokens_per_batch'] <= plan['token_limit'], 'Token bounds need measured evidence and an allocation')
    else:
        require(plan.get('allow_unmeasured') is True or selected['usage']['kind'] == 'measured', 'User must explicitly accept call/batch-only limits when tokens cannot be measured')
    plan = dict(plan, corpus_sha256=corpus_hash(root), recorded_at=stamp(), authorization_status='caller-declared')
    # Limits are cumulative for this library, so replacing a plan cannot silently reset spend.
    write_object(root, '.state/plan.json', plan)
    return {'plan_recorded': True, 'prior_calls': state['calls'], 'prior_batches': state['batches']}


def batch_pack(root, active):
    packs = []
    for uid in active['units']:
        sid, unit_id = uid.split('/')
        src = source(root, sid)
        unit = next(u for u in src['units'] if u['id'] == unit_id)
        packs.append({'unit_id': uid, 'source_sha256': src['_descriptor_sha256'], 'source': {k: v for k, v in src.items() if not k.startswith('_') and k != 'units'}, 'location': unit, 'text': src['_text'][unit['start']:unit['end']] if '_text' in src else None})
    return {'batch_id': active['id'], 'units': packs, 'usage': active['usage'], 'characters': sum(len(p['text'] or '') for p in packs), 'modelTokens': None}


def next_batch(root):
    state = load(root / '.state/state.json')
    require(not state['paused'], 'Task paused; resume explicitly after reviewing the reason')
    plan = load(root / '.state/plan.json')
    require(plan['corpus_sha256'] == corpus_hash(root), 'Source set changed; repeat sample/plan binding')
    if state['active']:
        calls = sum(u['calls'] for u in state['active']['usage'])
        can_run = calls < plan['calls_per_batch'] and state['calls'] < plan['max_calls']
        if plan.get('token_limit') is not None:
            used = sum(usage_valid(u) or 0 for u in state['active']['usage'] if u['kind'] == 'measured')
            can_run = can_run and not state['unmeasured_calls'] and used < plan['tokens_per_batch'] and state['measured_tokens'] < plan['token_limit']
        return dict(batch_pack(root, state['active']), resumed=True, execution_allowed=can_run, roles=plan['roles'], strategy=plan['strategy'], next_action='continue-within-host-limits' if can_run else 'review-and-commit-or-stop')
    todo = [uid for uid in plan['units'] if uid not in state['completed']]
    if not todo:
        return {'status': 'complete', 'batches': state['batches'], 'calls': state['calls']}
    require(state['batches'] < plan['max_batches'] and state['calls'] + plan['calls_per_batch'] <= plan['max_calls'], 'Batch/call budget exhausted')
    if plan.get('token_limit') is not None:
        require(not state['unmeasured_calls'] and state['measured_tokens'] + plan['tokens_per_batch'] <= plan['token_limit'], 'Token budget exhausted or usage unknown')
    active = {'id': f'b{state["batches"] + 1:06}', 'units': todo[:plan['max_units_per_batch']], 'usage': [], 'created_at': stamp()}
    state['active'] = active
    write_object(root, '.state/state.json', state)
    return dict(batch_pack(root, active), resumed=False, execution_allowed=True, roles=plan['roles'], strategy=plan['strategy'])


def record_usage(root, report):
    state = load(root / '.state/state.json')
    active = state['active']
    require(active and report.get('batch_id') == active['id'], 'Usage must belong to the active batch')
    identifier(report.get('attempt_id'))
    tokens = usage_valid(report)
    previous = next((r for r in active['usage'] if r['attempt_id'] == report['attempt_id']), None)
    if previous:
        require(previous == report, 'Attempt ID already has different usage')
        return {'already_recorded': True}
    active['usage'].append(report)
    state['calls'] += report['calls']
    if report['kind'] == 'measured':
        state['measured_tokens'] += tokens
    else:
        state['unmeasured_calls'] += report['calls']
    write_object(root, '.state/state.json', state)
    return {'recorded': True, 'calls': state['calls'], 'measured_tokens': state['measured_tokens'], 'unmeasured_calls': state['unmeasured_calls']}


def validate_record(root, record, allowed_units=None):
    identifier(record.get('id'))
    require(record.get('kind') in ('character', 'event', 'place', 'faction', 'rule', 'relationship', 'visual', 'question'), 'Unknown record kind')
    require(record.get('status') in ('confirmed', 'inference', 'uncertain'), 'Keep evidence certainty explicit')
    require(record.get('realm') in ('canon', 'reference', 'fanon', 'unknown'), 'Missing continuity authority label')
    for key in ('name', 'continuity', 'body'):
        require(isinstance(record.get(key), str) and record[key].strip(), 'Missing record field: ' + key)
    require('known_from' in record and (record['known_from'] is None or type(record['known_from']) is int and record['known_from'] >= 0), 'Explicit knowledge phase or null required')
    require(isinstance(record.get('aliases', []), list) and all(isinstance(a, str) for a in record.get('aliases', [])), 'Aliases must be strings')
    require(isinstance(record.get('evidence'), list) and record['evidence'], 'Every record needs evidence; unresolved questions still cite their context')
    for ev in record['evidence']:
        require(isinstance(ev, dict), 'Each evidence item must be an object')
        uid = ev.get('unit_id', '')
        require(re.fullmatch(r'[a-z0-9][a-z0-9_-]{0,95}/u\d{6}', uid), 'Invalid evidence unit')
        require(allowed_units is None or uid in allowed_units, 'Evidence outside the allocated batch')
        sid, unit_id = uid.split('/')
        src = source(root, sid)
        require(ev.get('source_sha256') == src['_descriptor_sha256'], 'Evidence source fingerprint changed or missing')
        require(record['continuity'] == src['continuity'], 'Do not merge different adaptations or fanwork continuities')
        require(record['realm'] != 'canon' or src['realm'] == 'canon', 'Reference/fanon material cannot silently become canon')
        unit = next((u for u in src['units'] if u['id'] == unit_id), None)
        require(unit is not None, 'Unknown source unit')
        phase = src.get('phase')
        if record['known_from'] is not None:
            require(phase is not None and record['known_from'] >= phase, 'Unknown or later source cannot enter an earlier knowledge phase')
            if src['kind'] == 'local-text':
                require(record['known_from'] >= phase + unit['entry'] - 1, 'Later chapter evidence cannot backflow into an opening state')
        if src['kind'] == 'image':
            require(src['inspection'] == 'viewed' and src['inspection_ref'].strip(), 'Inspect the actual image before recording visual conclusions')
            require(ev.get('locator') and ev.get('observation'), 'Visual evidence needs a region and observation')
        else:
            quote = ev.get('quote')
            require(isinstance(quote, str) and quote.strip(), 'Missing exact source excerpt')
            offset = integer(ev.get('start'))
            require(unit['start'] <= offset and offset + len(quote) <= unit['end'] and src['_text'][offset:offset + len(quote)] == quote, 'Quote or character locator does not match the frozen source')
    return record


def render(record):
    metadata = {k: v for k, v in record.items() if k not in ('body', 'base_sha256', 'source_path', 'markdown_sha256')}
    return '<!-- tw-work-record:v1 -->\n```json\n' + dump(metadata) + '```\n\n' + record['body'].strip() + '\n'


def parse_record(root, text, path):
    match = re.fullmatch(r'<!-- tw-work-record:v1 -->\n```json\n(.*?)\n```\n\n([\s\S]+)', text, re.S)
    require(match, 'Invalid record document: ' + path)
    record = json.loads(match[1])
    record['body'] = match[2].strip()
    validate_record(root, record)
    require(path == 'records/' + record['id'] + '.md', 'Record ID/path mismatch')
    return dict(record, source_path=path, markdown_sha256=digest(text))


def records(root, overlay=None):
    overlay = overlay or {}
    paths = {'records/' + p.name for p in safe(root, 'records').glob('*.md')} | set(overlay)
    rows = []
    for name in sorted(paths):
        row = parse_record(root, overlay[name] if name in overlay else safe(root, name).read_text(encoding='utf-8'), name)
        if name not in overlay:
            row['markdown_sha256'] = file_hash(safe(root, name))
        rows.append(row)
    return rows


def reindex_writes(root, overlay=None):
    rows = records(root, overlay)
    target = safe(root, 'index/records.jsonl')
    old_rows = [json.loads(line) for line in target.read_text(encoding='utf-8').splitlines()] if target.exists() else []
    old = {r['id']: r['markdown_sha256'] for r in old_rows}
    current = {r['id']: r['markdown_sha256'] for r in rows}
    changes = [{'id': key, 'before': old.get(key), 'after': current.get(key)} for key in sorted(old.keys() | current.keys()) if old.get(key) != current.get(key)]
    content = ''.join(json.dumps(row, ensure_ascii=False, sort_keys=True) + '\n' for row in rows)
    writes = {'index/records.jsonl': (content, file_hash(target))}
    if changes:
        event_path = safe(root, '.state/edit-log.jsonl')
        previous = event_path.read_text(encoding='utf-8') if event_path.exists() else ''
        event = {'at': stamp(), 'kind': 'index-observed-change', 'changes': changes, 'actor': 'not-inferred'}
        writes['.state/edit-log.jsonl'] = (previous + json.dumps(event, ensure_ascii=False) + '\n', file_hash(event_path))
    return rows, writes


def commit_batch(root, candidate):
    bid = identifier(candidate.get('batch_id'))
    receipt_path = safe(root, f'batches/{bid}.json')
    if receipt_path.exists():
        require(load(receipt_path)['candidate_sha256'] == digest(dump(candidate)), 'Batch ID already committed with different content')
        return {'already_committed': True, 'batch_id': bid}
    state = load(root / '.state/state.json')
    active = state['active']
    require(active and active['id'] == bid and active['usage'], 'Active batch and recorded attempt usage required')
    require(load(root / '.state/plan.json')['corpus_sha256'] == corpus_hash(root), 'Source set changed during the batch')
    require(isinstance(candidate.get('records'), list), 'Candidate records must be a list')
    require(candidate['records'] or candidate.get('empty_reason'), 'An empty batch needs an explicit reading result')
    require(candidate.get('review_note'), 'Record semantic review and unresolved issues before promotion')
    require(all(isinstance(r, dict) for r in candidate['records']), 'Each candidate record must be an object')
    overlay, writes = {}, {}
    ids = [r.get('id') for r in candidate['records']]
    require(len(set(ids)) == len(ids), 'Duplicate IDs within a batch')
    for record in candidate['records']:
        identifier(record.get('id'))
        name = 'records/' + record['id'] + '.md'
        expected = record.get('base_sha256')
        require(file_hash(safe(root, name)) == expected, 'Human edit or duplicate record: supply the actual base hash')
        previous_evidence = []
        if expected:
            previous_evidence = parse_record(root, safe(root, name).read_text(encoding='utf-8'), name)['evidence']
        # Existing evidence may be retained verbatim when an allocated later batch updates a dossier.
        allowed = set(active['units']) | {ev['unit_id'] for ev in previous_evidence if ev in record['evidence']}
        validate_record(root, record, allowed)
        overlay[name] = render(record)
        writes[name] = (overlay[name], expected)
    rows, index_writes = reindex_writes(root, overlay)
    writes.update(index_writes)
    state['completed'] = sorted(set(state['completed']) | set(active['units']))
    state['batches'] += 1
    state['active'] = None
    writes['.state/state.json'] = (dump(state), file_hash(root / '.state/state.json'))
    receipt = {'batch_id': bid, 'candidate_sha256': digest(dump(candidate)), 'units': active['units'], 'usage': active['usage'], 'record_ids': ids, 'review_note': candidate['review_note'], 'committed_at': stamp(), 'semanticAcceptance': 'caller-reviewed'}
    writes[f'batches/{bid}.json'] = (dump(receipt), None)
    transaction(root, writes, 'commit-batch')
    return {'batch_id': bid, 'committed': len(ids), 'total_records': len(rows)}


def query(root, text='', realm=None, continuity=None, as_of=None, limit=20):
    integer(limit, 1)
    require(limit <= 100, 'Query limit must be at most 100')
    rows = records(root)
    selected = [r for r in rows if (not realm or r['realm'] == realm) and (not continuity or r['continuity'] == continuity) and (as_of is None or r['known_from'] is not None and r['known_from'] <= as_of) and (not text or text.casefold() in (r['name'] + ' ' + ' '.join(r.get('aliases', [])) + ' ' + r['body']).casefold())]
    return {'matches': len(selected), 'records': selected[:limit], 'truncated': len(selected) > limit, 'authority': 'current-markdown'}


def export_sqlite(root, destination):
    destination = Path(destination)
    require(not destination.exists(), 'Export target already exists; choose a new file')
    require(not destination.resolve().is_relative_to((root / '.state').resolve()), 'Export cannot replace internal state')
    rows = records(root)
    destination.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix='.tw-export-', dir=destination.parent)
    os.close(descriptor)
    try:
        db = sqlite3.connect(temporary)
        try:
            db.execute('CREATE TABLE records (id TEXT PRIMARY KEY, kind TEXT, name TEXT, realm TEXT, continuity TEXT, status TEXT, known_from INTEGER, body TEXT, source_path TEXT, markdown_sha256 TEXT, record_json TEXT)')
            db.executemany('INSERT INTO records VALUES (?,?,?,?,?,?,?,?,?,?,?)', [(r['id'], r['kind'], r['name'], r['realm'], r['continuity'], r['status'], r['known_from'], r['body'], r['source_path'], r['markdown_sha256'], json.dumps(r, ensure_ascii=False)) for r in rows])
            db.execute('CREATE TABLE sources (id TEXT PRIMARY KEY, descriptor_json TEXT)')
            db.executemany('INSERT INTO sources VALUES (?,?)', [(s['id'], json.dumps({k: v for k, v in s.items() if not k.startswith('_')}, ensure_ascii=False)) for s in catalog(root)])
            db.commit()
            require(db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok', 'SQLite integrity failure')
        finally:
            db.close()
        # Exclusive creation keeps an existing user export intact even after a race.
        with destination.open('xb') as output:
            output.write(Path(temporary).read_bytes())
        return {'exported': str(destination), 'records': len(rows), 'sha256': file_hash(destination), 'authority': 'derived-snapshot'}
    finally:
        Path(temporary).unlink(missing_ok=True)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['init', 'add-source', 'benchmark', 'plan', 'next', 'usage', 'commit', 'reindex', 'query', 'export-sqlite', 'recover', 'status', 'pause', 'resume'])
    parser.add_argument('--project', required=True)
    parser.add_argument('--input')
    parser.add_argument('--text')
    parser.add_argument('--title')
    parser.add_argument('--out')
    parser.add_argument('--query', default='')
    parser.add_argument('--realm', choices=['canon', 'reference', 'fanon', 'unknown'])
    parser.add_argument('--continuity')
    parser.add_argument('--as-of', type=int)
    parser.add_argument('--limit', type=int, default=20)
    parser.add_argument('--chunk-chars', type=int, default=6000)
    args = parser.parse_args(argv)
    root = Path(args.project).absolute()
    try:
        if args.command == 'init':
            require(args.title, 'Give the work a title')
            result = init(root, args.title)
        else:
            with locked(root):
                if args.command == 'recover':
                    result = recover(root)
                elif args.command == 'status':
                    result = dict(load(root / '.state/state.json'), recovery_required=(root / '.state/pending.json').exists(), source_count=len(list((root / 'sources').glob('*.json'))))
                else:
                    require(not (root / '.state/pending.json').exists(), 'Interrupted transaction: run recover first')
                    if args.command in ('add-source', 'benchmark', 'plan', 'usage', 'commit'):
                        require(args.input, '--input is required')
                        obj = load(args.input)
                        require(isinstance(obj, dict), 'Input must be a JSON object')
                    if args.command == 'add-source':
                        result = add_source(root, obj, args.text, args.chunk_chars)
                    elif args.command == 'benchmark':
                        result = benchmark(root, obj)
                    elif args.command == 'plan':
                        result = set_plan(root, obj)
                    elif args.command == 'next':
                        result = next_batch(root)
                    elif args.command == 'usage':
                        result = record_usage(root, obj)
                    elif args.command == 'commit':
                        result = commit_batch(root, obj)
                    elif args.command == 'reindex':
                        rows, writes = reindex_writes(root)
                        transaction(root, writes, 'reindex')
                        result = {'indexed': len(rows), 'authority': 'current-markdown'}
                    elif args.command == 'query':
                        result = query(root, args.query, args.realm, args.continuity, args.as_of, args.limit)
                    elif args.command == 'export-sqlite':
                        require(args.out, '--out is required')
                        result = export_sqlite(root, args.out)
                    elif args.command in ('pause', 'resume'):
                        state = load(root / '.state/state.json')
                        state['paused'] = args.command == 'pause'
                        write_object(root, '.state/state.json', state)
                        result = {'paused': state['paused']}
        print(json.dumps({'ok': True, **result}, ensure_ascii=True))
        return 0
    except (LibraryError, OSError, sqlite3.Error, ValueError, KeyError, TypeError, StopIteration) as error:
        print(json.dumps({'ok': False, 'error': str(error)}, ensure_ascii=True))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
