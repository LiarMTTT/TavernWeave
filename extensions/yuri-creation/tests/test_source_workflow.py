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
        path=self.project/'library/records/player.md';path.write_text(path.read_text().replace('原文没有明确性别','原文明确男性'))
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
            for ev in row['evidence']:ev['source_sha256']=candidate['source_sha256']
        candidate['reviewed_unit_ids']=[];path=root/'bad.json';p.write_new(path,candidate)
        with self.assertRaisesRegex(ValueError,'Review all'):p.promote(project,path)
        candidate['reviewed_unit_ids']=['u000001'];candidate['records'][0]['evidence'][0]['quote']='wrong';path.write_text(json.dumps(candidate))
        with self.assertRaisesRegex(ValueError,'Quote or character'):p.promote(project,path)


if __name__ == '__main__':unittest.main()
