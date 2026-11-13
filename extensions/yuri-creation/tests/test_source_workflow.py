import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("post_example", ROOT / "examples/post-to-yuri/run_example.py")
fixture = importlib.util.module_from_spec(spec); spec.loader.exec_module(fixture)
p = fixture.p


class SourceWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.project, self.draft, self.plan = fixture.setup(self.root)
        self.output = self.root / "result"

    def change_plan(self, mutate):
        value = p.read(self.plan); mutate(value)
        self.plan.write_text(json.dumps(value, ensure_ascii=False))

    def build(self):
        return p.build(self.project, self.draft, self.plan, self.output)

    def test_complete_source_route_preserves_unknown_gender_and_exports(self):
        self.build(); card = p.read(self.output / "yuri-card.v2.json")
        _, library, tw, _, _ = p.context(self.project)
        facts = {r['id']:r for r in tw.records(library)}
        self.assertEqual(facts['player']['yuri']['source_gender'], 'unknown')
        self.assertIn('{{user}}', card['data']['first_mes'])
        self.assertEqual(len(card['data']['character_book']['entries']), 2)
        receipt = p.read(self.output/'adaptation-record.json')
        self.assertEqual(receipt['mode'],'source_yuri');self.assertEqual(receipt['host_import'],'not_run')
        self.assertFalse((self.output/'creation-record.json').exists())

    def test_wrong_quote_is_rejected(self):
        with self.assertRaisesRegex(ValueError,'Quote/start'):p.evidence(self.project,'不存在',0)

    def test_text_tampering_invalidates_the_source(self):
        path=self.project/'library/sources/post-001.txt';path.write_text(path.read_text()+'改动')
        with self.assertRaisesRegex(ValueError,'Source text changed'):self.build()

    def test_changed_facts_do_not_silently_override_review(self):
        path=self.project/'library/records/player.md';path.write_text(path.read_text().replace('第一人称讲述者30岁','第一人称讲述者40岁'))
        with self.assertRaisesRegex(ValueError,'facts changed'):self.build()

    def test_stale_draft_is_rejected(self):
        self.draft.write_text(self.draft.read_text()+'\n改动')
        with self.assertRaisesRegex(ValueError,'Stale'):self.build()

    def test_relationship_needs_causal_circumstances(self):
        self.change_plan(lambda v:v['decisions'][1].update(changed_circumstance=''))
        with self.assertRaisesRegex(ValueError,'Relationship changes'):self.build()

    def test_blanket_provenance_is_rejected(self):
        self.change_plan(lambda v:v.update(field_sources=[{'pointer':'/data','record_ids':['lin'],'decision_ids':['identity','bond','scene']}]))
        with self.assertRaisesRegex(ValueError,'blanket'):self.build()

    def test_unmapped_field_is_rejected(self):
        self.change_plan(lambda v:v['field_sources'].pop())
        with self.assertRaisesRegex(ValueError,'Unmapped'):self.build()

    def test_player_label_in_runtime_is_rejected(self):
        self.draft.write_text(self.draft.read_text().replace('{{user}}','发帖者',1))
        self.change_plan(lambda v:v.update(bindings=p.bindings(self.project,self.draft)))
        with self.assertRaisesRegex(ValueError,'opening required'):self.build()

    def test_missing_main_target_is_rejected(self):
        self.change_plan(lambda v:v.update(targets=v['targets'][:1]))
        with self.assertRaisesRegex(ValueError,'every main'):self.build()

    def test_background_identity_is_not_an_adaptation_target(self):
        self.change_plan(lambda v:v['targets'].append({'record_id':'owner','result_woman':True,'result_adult':True,'reason':'unrequested change'}))
        with self.assertRaisesRegex(ValueError,'every main'):self.build()

    def test_worldbook_player_label_is_rejected(self):
        self.draft.write_text(self.draft.read_text().replace('玩家与关系','发帖者与关系'))
        self.change_plan(lambda v:v.update(bindings=p.bindings(self.project,self.draft)))
        with self.assertRaisesRegex(ValueError,'Unresolved player label'):self.build()

    def test_single_brace_player_macro_is_rejected(self):
        self.draft.write_text(self.draft.read_text().replace('{{user}}是30岁','{user}是30岁'))
        self.change_plan(lambda v:v.update(bindings=p.bindings(self.project,self.draft)))
        with self.assertRaisesRegex(ValueError,'exact'):self.build()

    def test_unpinned_source_code_is_not_executed(self):
        base=self.root/'fake';path=base/p.LIBRARY_PATH;path.parent.mkdir(parents=True)
        path.write_text('raise RuntimeError("must not execute")')
        with self.assertRaisesRegex(ValueError,'declared pin'):p.dependencies(base)

    def test_origin_link_does_not_fabricate_web_retrieval(self):
        project=self.root/'linked-project'
        p.register(ROOT/'examples/post-to-yuri/post.txt',project,url='https://example.org/post')
        _,_,_,_,src=p.context(project)
        self.assertEqual(src['kind'],'local-text');self.assertEqual(src['origin_url'],'https://example.org/post')
        self.assertNotIn('retrieved_at',src)

    def test_source_cannot_be_repromoted_over_existing_records(self):
        with self.assertRaisesRegex(ValueError,'already promoted'):p.promote(self.project,self.root/'extraction.json')

    def test_existing_output_is_preserved(self):
        self.output.mkdir();(self.output/'sentinel').write_text('keep')
        with self.assertRaisesRegex(ValueError,'Output exists'):self.build()
        self.assertEqual((self.output/'sentinel').read_text(),'keep')

    def test_quote_crossing_unit_boundary_retains_all_text(self):
        root=self.root/'boundary';root.mkdir();text='甲'*5998+'甲乙丙丁';source=root/'post.txt';source.write_text(text)
        project=root/'project';p.register(source,project)
        refs=p.evidence(project,'甲乙丙丁',5998)
        self.assertEqual(len(refs),2);self.assertEqual(''.join(x['quote'] for x in refs),'甲乙丙丁')

    def test_unreviewed_units_and_wrong_citations_are_rejected(self):
        root=self.root/'candidate';root.mkdir();project=root/'project'
        p.register(ROOT/'examples/post-to-yuri/post.txt',project)
        candidate=p.read(self.root/'extraction.json');candidate['source_sha256']=p.units(project)['source_sha256']
        for row in candidate['records']:
            for claim in row['claims']:
                for ev in claim['evidence']:ev['source_sha256']=candidate['source_sha256']
        candidate['reviewed_unit_ids']=[];path=root/'bad.json';p.write_new(path,candidate)
        with self.assertRaisesRegex(ValueError,'Review all'):p.promote(project,path)
        candidate['reviewed_unit_ids']=['u000001'];candidate['records'][0]['claims'][0]['evidence'][0]['quote']='wrong';path.write_text(json.dumps(candidate))
        with self.assertRaisesRegex(ValueError,'Quote or character'):p.promote(project,path)

    def candidate_project(self):
        project=self.root/'claim-project'
        p.register(ROOT/'examples/post-to-yuri/post.txt',project)
        candidate=p.read(self.root/'extraction.json')
        candidate['source_sha256']=p.units(project)['source_sha256']
        for row in candidate['records']:
            for claim in row['claims']:
                for ev in claim['evidence']:ev['source_sha256']=candidate['source_sha256']
        path=self.root/'claim-candidate.json'
        return project,candidate,path

    def test_claims_survive_promotion_and_derive_searchable_record(self):
        _,library,tw,_,_=p.context(self.project)
        row=next(r for r in tw.records(library) if r['id']=='lin')
        self.assertEqual(row['body'],'\n'.join(c['text'] for c in row['claims']))
        self.assertEqual(row['evidence'],[ev for c in row['claims'] for ev in c['evidence']])
        self.assertEqual(len(row['claims']),2)

    def test_a_second_claim_cannot_borrow_the_first_claims_quote_validation(self):
        project,candidate,path=self.candidate_project()
        candidate['records'][0]['claims'][1]['evidence'][0]['quote']='fabricated'
        p.write_new(path,candidate)
        with self.assertRaisesRegex(ValueError,'Quote or character'):p.promote(project,path)
        self.assertFalse((project/'library/.state/yuri-extraction.json').exists())

    def test_missing_claim_evidence_and_duplicate_claim_ids_are_rejected(self):
        project,candidate,path=self.candidate_project()
        claim=candidate['records'][0]['claims'][1];saved=claim.pop('evidence')
        p.write_new(path,candidate)
        with self.assertRaisesRegex(ValueError,'Every record needs evidence'):p.promote(project,path)
        claim['evidence']=saved;claim['id']=candidate['records'][0]['claims'][0]['id']
        path.write_text(json.dumps(candidate))
        with self.assertRaisesRegex(ValueError,'Unique local claim'):p.promote(project,path)

    def test_uncited_summary_and_legacy_new_candidate_are_rejected(self):
        project,candidate,path=self.candidate_project()
        candidate['records'][0]['body']='Extra, uncited biography.';p.write_new(path,candidate)
        with self.assertRaisesRegex(ValueError,'body must be derived'):p.promote(project,path)
        candidate['schema']='yuri/extraction/v1';path.write_text(json.dumps(candidate))
        with self.assertRaisesRegex(ValueError,'extraction/v2'):p.promote(project,path)

    def test_previously_promoted_v1_records_remain_buildable(self):
        # Recreate the prior persisted format, without requiring a v1 promotion API.
        _,library,tw,_,_=p.context(self.project)
        for row in tw.records(library):
            row.pop('claims')
            (library/row['source_path']).write_text(tw.render(row))
        receipt=p.read(library/'.state/yuri-extraction.json')
        receipt.update(schema='yuri/extraction-receipt/v1',records_sha256=p.fact_hash(tw.records(library)))
        receipt.pop('extraction_schema');receipt.pop('claim_count')
        (library/'.state/yuri-extraction.json').write_text(json.dumps(receipt))
        self.change_plan(lambda v:v.update(bindings=p.bindings(self.project,self.draft)))
        self.build()
        self.assertEqual(p.read(self.output/'adaptation-record.json')['extraction_review']['schema'],'yuri/extraction-receipt/v1')


if __name__ == '__main__':unittest.main()
