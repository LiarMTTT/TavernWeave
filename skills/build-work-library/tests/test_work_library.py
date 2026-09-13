import copy
from contextlib import closing
import importlib.util
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/work_library.py'
spec = importlib.util.spec_from_file_location('work_library', SCRIPT)
lib = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lib)


class WorkLibraryTests(unittest.TestCase):
    def setUp(self):
        self.test_root = Path(os.environ.get('TW_TEST_ROOT', tempfile.gettempdir())).resolve()
        self.test_root.mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(prefix='tw-work-library-', dir=self.test_root)
        self.base = Path(self.temp.name)
        assert self.base.resolve().is_relative_to(self.test_root)
        self.root = self.base / 'library'
        lib.init(self.root, '合成测试作品')
        self.text = '第一章 起点\n岚住在北港，代号青鸟。\n第二章 转折\n岚迁往南城。\n第二章 异版\n同号章节仍是独立条目。\n'
        text_file = self.base / 'original.txt'
        text_file.write_text(self.text, encoding='utf-8')
        self.descriptor = {'id': 'original', 'kind': 'local-text', 'title': '合成正文', 'realm': 'canon', 'continuity': 'novel', 'edition': 'fixture-a', 'phase': 0, 'provenance': 'authored test fixture', 'rights': 'test fixture'}
        self.call(lib.add_source, self.descriptor, text_file)

    def tearDown(self):
        self.temp.cleanup()

    def call(self, function, *args, **kwargs):
        with lib.locked(self.root):
            return function(self.root, *args, **kwargs)

    def setup_plan(self, **changes):
        report = {'samples': [{'id': 'trial', 'strategy': 'sequential', 'source_ids': ['original'], 'usage': {'calls': 1, 'kind': 'measured', 'input_tokens': 100, 'output_tokens': 20, 'provenance': 'synthetic fixture, not a real model measurement'}, 'unsupported_assertions': 0, 'questions': [{'question': '岚住哪里？', 'answer': '北港', 'evidence': '第一章原句', 'pass': True}]}], 'selected': 'trial', 'reason': 'fixture choice'}
        result = self.call(lib.benchmark, report)
        plan = {'goal': 'test', 'authorization_note': 'test-only fixture authorization', 'benchmark_sha256': result['benchmark_sha256'], 'strategy': 'sequential', 'units': ['original/' + u['id'] for u in self.call(lib.source, 'original')['units']], 'roles': {'reader': 'read assigned source', 'reviewer': 'check exact evidence'}, 'max_batches': 3, 'max_calls': 3, 'calls_per_batch': 1, 'max_units_per_batch': 1, 'token_limit': 600, 'tokens_per_batch': 200}
        plan.update(changes)
        self.call(lib.set_plan, plan)
        return plan, report

    def candidate(self, pack, rid='lan', phrase='岚住在北港，代号青鸟。'):
        unit = pack['units'][0]
        start = self.text.index(phrase)
        return {'batch_id': pack['batch_id'], 'review_note': 'synthetic source manually checked in test', 'records': [{'id': rid, 'kind': 'character', 'name': '岚', 'aliases': ['青鸟'], 'realm': 'canon', 'continuity': 'novel', 'status': 'confirmed', 'known_from': unit['location']['entry'] - 1, 'body': '# 岚\n\n' + phrase, 'evidence': [{'unit_id': unit['unit_id'], 'source_sha256': unit['source_sha256'], 'start': start, 'quote': phrase}]}]}

    def usage(self, pack, **changes):
        obj = {'batch_id': pack['batch_id'], 'attempt_id': 'attempt-1', 'calls': 1, 'kind': 'measured', 'input_tokens': 80, 'output_tokens': 20, 'provenance': 'synthetic fixture'}
        obj.update(changes)
        self.call(lib.record_usage, obj)
        return obj

    def first_commit(self):
        self.setup_plan()
        pack = self.call(lib.next_batch)
        self.usage(pack)
        candidate = self.candidate(pack)
        self.call(lib.commit_batch, candidate)
        return candidate

    def test_source_units_preserve_duplicates_and_exact_coverage(self):
        source = self.call(lib.source, 'original')
        self.assertEqual(len(source['units']), 3)
        self.assertEqual(''.join(source['_text'][u['start']:u['end']] for u in source['units']), self.text)
        self.assertEqual([u['entry'] for u in source['units']], [1, 2, 3])
        self.assertLessEqual(max(u['end'] - u['start'] for u in source['units']), 6000)

    def test_claim_resume_usage_and_commit_are_idempotent(self):
        self.setup_plan()
        first = self.call(lib.next_batch)
        self.assertTrue(first['execution_allowed'])
        self.assertEqual(self.call(lib.next_batch)['roles'], first['roles'])
        self.assertEqual(self.call(lib.next_batch)['batch_id'], first['batch_id'])
        usage = self.usage(first)
        self.assertTrue(self.call(lib.record_usage, usage)['already_recorded'])
        self.assertFalse(self.call(lib.next_batch)['execution_allowed'])
        candidate = self.candidate(first)
        self.call(lib.commit_batch, candidate)
        self.assertTrue(self.call(lib.commit_batch, candidate)['already_committed'])
        state = lib.load(self.root / '.state/state.json')
        self.assertEqual((state['calls'], state['measured_tokens'], state['batches']), (1, 100, 1))
        changed = copy.deepcopy(candidate)
        changed['records'][0]['body'] += 'new'
        with self.assertRaises(lib.LibraryError):
            self.call(lib.commit_batch, changed)

    def test_bad_quote_and_forged_source_leave_records_untouched(self):
        self.setup_plan()
        pack = self.call(lib.next_batch)
        self.usage(pack)
        candidate = self.candidate(pack)
        for field, value in [('quote', '原文没有这句话'), ('source_sha256', '0' * 64), ('start', 0)]:
            changed = copy.deepcopy(candidate)
            changed['records'][0]['evidence'][0][field] = value
            with self.assertRaises(lib.LibraryError):
                self.call(lib.commit_batch, changed)
            self.assertEqual(list((self.root / 'records').iterdir()), [])

    def test_fanon_and_other_continuity_cannot_become_original(self):
        desc = dict(self.descriptor, id='fanfic', realm='fanon', continuity='fan-branch')
        self.call(lib.add_source, desc, self.base / 'original.txt')
        self.setup_plan(units=['fanfic/u000001'])
        pack = self.call(lib.next_batch)
        record = self.candidate(pack)['records'][0]
        with self.assertRaisesRegex(lib.LibraryError, 'adaptations'):
            self.call(lib.validate_record, record)
        record['continuity'] = 'fan-branch'
        with self.assertRaisesRegex(lib.LibraryError, 'canon'):
            self.call(lib.validate_record, record)

    def test_late_information_and_unknown_phase_are_filtered(self):
        self.first_commit()
        pack = self.call(lib.next_batch)
        self.usage(pack)
        candidate = self.candidate(pack, 'lan-later', '岚迁往南城。')
        candidate['records'][0]['known_from'] = 0
        with self.assertRaisesRegex(lib.LibraryError, 'backflow'):
            self.call(lib.commit_batch, candidate)
        candidate['records'][0]['known_from'] = 1
        self.call(lib.commit_batch, candidate)
        self.assertEqual(self.call(lib.query, as_of=0)['matches'], 1)
        self.assertEqual(self.call(lib.query, as_of=1)['matches'], 2)

    def test_human_edit_reindex_alias_and_sqlite_readback(self):
        self.first_commit()
        file = self.root / 'records/lan.md'
        text = file.read_text(encoding='utf-8').replace('岚住在北港，代号青鸟。\n', '岚住在北港，代号青鸟。人工补充阅读备注。\n')
        file.write_bytes(text.replace('\n', '\r\n').encode('utf-8'))
        row = self.call(lib.query, text='青鸟')['records'][0]
        self.assertEqual(row['markdown_sha256'], lib.file_hash(file))
        self.assertIn('人工补充', row['body'])
        with lib.locked(self.root):
            rows, writes = lib.reindex_writes(self.root)
            lib.transaction(self.root, writes, 'test-reindex')
        indexed = json.loads((self.root / 'index/records.jsonl').read_text(encoding='utf-8'))
        self.assertEqual(indexed['body'], row['body'])
        target = self.base / 'export.sqlite'
        self.call(lib.export_sqlite, target)
        with closing(sqlite3.connect(target)) as db:
            self.assertIn('人工补充', db.execute('SELECT body FROM records').fetchone()[0])
            self.assertEqual(db.execute('SELECT COUNT(*) FROM sources').fetchone()[0], 1)
        before = target.read_bytes()
        with self.assertRaises(lib.LibraryError):
            self.call(lib.export_sqlite, target)
        self.assertEqual(before, target.read_bytes())

    def test_stale_base_rejected_and_old_evidence_retained_on_update(self):
        self.first_commit()
        pack = self.call(lib.next_batch)
        self.usage(pack)
        candidate = self.candidate(pack, 'lan', '岚迁往南城。')
        file = self.root / 'records/lan.md'
        old = self.call(lib.query)['records'][0]
        candidate['records'][0]['base_sha256'] = '0' * 64
        with self.assertRaises(lib.LibraryError):
            self.call(lib.commit_batch, candidate)
        candidate['records'][0]['base_sha256'] = lib.file_hash(file)
        candidate['records'][0]['evidence'] += old['evidence']
        self.call(lib.commit_batch, candidate)
        self.assertEqual(len(self.call(lib.query)['records'][0]['evidence']), 2)

    def test_interrupted_transaction_resumes_without_duplicate_batch(self):
        self.setup_plan()
        pack = self.call(lib.next_batch)
        self.usage(pack)
        original = lib.atomic
        def fail_after_record(path, text):
            original(path, text)
            if path.name == 'lan.md':
                raise OSError('simulated process interruption')
        with patch.object(lib, 'atomic', side_effect=fail_after_record):
            with self.assertRaises(OSError):
                self.call(lib.commit_batch, self.candidate(pack))
        self.assertTrue((self.root / '.state/pending.json').exists())
        self.assertTrue(self.call(lib.recover)['recovered'])
        self.assertEqual(lib.load(self.root / '.state/state.json')['batches'], 1)
        self.assertTrue(self.call(lib.commit_batch, self.candidate(pack))['already_committed'])

    def test_recovery_preserves_intervening_human_edit(self):
        file = self.root / 'records/x.md'
        pending = {'operation': 'fixture', 'writes': [{'path': 'records/x.md', 'before': None, 'text': 'planned'}]}
        lib.atomic(self.root / '.state/pending.json', lib.dump(pending))
        file.write_text('human data', encoding='utf-8')
        with self.assertRaisesRegex(lib.LibraryError, 'Recovery conflict'):
            self.call(lib.recover)
        self.assertEqual(file.read_text(encoding='utf-8'), 'human data')
        self.assertTrue((self.root / '.state/pending.json').exists())

    def test_budget_unmeasured_usage_and_failed_sample_stop_new_work(self):
        self.setup_plan(max_calls=1)
        pack = self.call(lib.next_batch)
        self.usage(pack, kind='unavailable', input_tokens=None, output_tokens=None)
        self.assertFalse(self.call(lib.next_batch)['execution_allowed'])
        self.call(lib.commit_batch, self.candidate(pack))
        with self.assertRaises(lib.LibraryError):
            self.call(lib.next_batch)
        plan, report = self.setup_plan()
        report['samples'][0]['unsupported_assertions'] = 1
        benchmark = self.call(lib.benchmark, report)
        plan['benchmark_sha256'] = benchmark['benchmark_sha256']
        with self.assertRaisesRegex(lib.LibraryError, 'quality'):
            self.call(lib.set_plan, plan)

    def test_source_drift_invalidates_plan_and_record(self):
        self.first_commit()
        path = self.root / 'sources/original.txt'
        path.write_text('changed source', encoding='utf-8')
        with self.assertRaisesRegex(lib.LibraryError, 'Source text changed'):
            self.call(lib.next_batch)
        with self.assertRaises(lib.LibraryError):
            self.call(lib.query)

    def test_image_metadata_is_not_visual_inspection(self):
        desc = dict(self.descriptor, id='image-ref', kind='image', url='https://example.org/fixture-image', retrieved_at='2026-09-13', inspection='not-viewed', inspection_ref='', use='reference-only')
        self.call(lib.add_source, desc)
        record = {'id': 'visual', 'kind': 'visual', 'name': '外观', 'realm': 'canon', 'continuity': 'novel', 'status': 'inference', 'known_from': 0, 'body': '测试观察', 'evidence': [{'unit_id': 'image-ref/u000001', 'source_sha256': lib.file_hash(self.root / 'sources/image-ref.json'), 'locator': 'upper-left', 'observation': 'synthetic'}]}
        with self.assertRaisesRegex(lib.LibraryError, 'Inspect'):
            self.call(lib.validate_record, record)

    def test_web_provenance_and_path_boundaries(self):
        desc = dict(self.descriptor, id='web', kind='web-text')
        with self.assertRaisesRegex(lib.LibraryError, 'URL'):
            self.call(lib.add_source, desc, self.base / 'original.txt')
        desc.update(url='https://example.org/fixture', retrieved_at='2026-09-13')
        self.call(lib.add_source, desc, self.base / 'original.txt')
        with self.assertRaises(lib.LibraryError):
            lib.safe(self.root, '../escape')
        with self.assertRaises(lib.LibraryError):
            lib.init(self.root, 'overwrite')

    def test_process_lock_and_cli_roundtrip(self):
        with lib.locked(self.root):
            with self.assertRaises(sqlite3.OperationalError):
                with lib.locked(self.root):
                    pass
        result = subprocess.run([sys.executable, str(SCRIPT), 'status', '--project', str(self.root)], capture_output=True)
        self.assertEqual(result.returncode, 0)
        self.assertTrue(json.loads(result.stdout)['ok'])

    def test_replacing_plan_keeps_cumulative_spend_and_validates_roles(self):
        self.first_commit()
        plan, _ = self.setup_plan(max_calls=1)
        self.assertEqual(lib.load(self.root / '.state/state.json')['calls'], 1)
        with self.assertRaisesRegex(lib.LibraryError, 'budget'):
            self.call(lib.next_batch)
        plan['roles'] = ['not a role map']
        with self.assertRaisesRegex(lib.LibraryError, 'responsibilities'):
            self.call(lib.set_plan, plan)
        malformed = self.base / 'malformed.json'
        malformed.write_text('[]', encoding='utf-8')
        result = subprocess.run([sys.executable, str(SCRIPT), 'plan', '--project', str(self.root), '--input', str(malformed)], capture_output=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn('JSON object', json.loads(result.stdout)['error'])

    def test_viewed_image_and_web_text_are_queryable_with_separate_provenance(self):
        for kind, sid in [('image', 'viewed-image'), ('web-text', 'web')]:
            desc = dict(self.descriptor, id=sid, kind=kind, realm='reference', url='https://example.org/synthetic-' + sid, retrieved_at='2026-09-13', inspection='viewed', inspection_ref='synthetic test of receipt shape only; no actual image', use='reference-only')
            self.call(lib.add_source, desc, self.base / 'original.txt' if kind == 'web-text' else None)
            ev = {'unit_id': sid + '/u000001', 'source_sha256': lib.file_hash(self.root / ('sources/' + sid + '.json'))}
            if kind == 'image':
                ev.update(locator='center', observation='fixture observation')
            else:
                ev.update(start=self.text.index('岚住在北港'), quote='岚住在北港')
            record = {'id': sid, 'kind': 'visual' if kind == 'image' else 'character', 'name': '岚', 'realm': 'reference', 'continuity': 'novel', 'status': 'inference', 'known_from': 0, 'body': '合成参考条目，不是真实联网采集。', 'evidence': [ev]}
            self.call(lib.validate_record, record)
            lib.atomic(self.root / ('records/' + sid + '.md'), lib.render(record))
        rows, writes = self.call(lib.reindex_writes)
        self.call(lib.transaction, writes, 'fixture-reindex')
        self.assertEqual(len(rows), 2)
        self.assertEqual(self.call(lib.query, realm='reference')['matches'], 2)
        self.assertEqual(self.call(lib.query, realm='canon')['matches'], 0)
        self.assertEqual({r['evidence'][0]['unit_id'] for r in rows}, {'web/u000001', 'viewed-image/u000001'})


if __name__ == '__main__':
    unittest.main()
