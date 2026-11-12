import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("creator", ROOT / "skills/yuri-card-creator/scripts/create_card.py")
c = importlib.util.module_from_spec(spec); spec.loader.exec_module(c)


class CreatorTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name); self.project = self.root / "creation"
        c.initialize(self.project)
        self.contract = c.read(self.project / "creation.json")
        self.contract.update(cast=[{"id":"nora","name":"诺拉","role":"main","author_defined_woman":True,"adult":True}],
                             creative_choices=["原创夜间档案馆，以寻找遗失书信开始。"],
                             agent_review={"completed":True,"notes":["玩家当前行动留白；原创设定与世界书一致。"]})
        c.write(self.project / "creation.json", self.contract)
        (self.project / "card.md").write_text('---\nname: 诺拉\n---\n## First Message\n诺拉递来目录，向 {{user}} 示意空着的座位。“要一起找那封信吗？”\n## Lorebook\n### 档案馆 | keys: 档案馆,书信\n诺拉是成年女性档案员，有独立的工作目标。档案馆在夜间开放。\n',encoding='utf-8')

    def build(self):
        return c.export(self.project, self.root / "result")

    def test_original_card_has_worldbook_unicode_and_no_fake_source_card(self):
        before=(self.project/'preferences.json').read_bytes();self.build()
        card=c.read(self.root/'result/yuri-card.v2.json');record=c.read(self.root/'result/creation-record.json')
        self.assertEqual(card['spec'],'chara_card_v2');self.assertEqual(card['data']['name'],'诺拉')
        self.assertIn('{{user}}',card['data']['first_mes']);self.assertTrue(card['data']['character_book']['entries'])
        self.assertNotIn('Foreverse',card['data']['creator']);self.assertEqual(record['mode'],'original')
        self.assertEqual(record['creation']['external_creative_sources'],[])
        self.assertFalse((self.root/'result/source-card.v2.json').exists())
        self.assertEqual(record['card_sha256'],c.sha((self.root/'result/yuri-card.v2.json').read_bytes()))
        self.assertEqual((self.project/'preferences.json').read_bytes(),before)
        self.assertEqual(record['host_import'],'not_run')

    def test_review_cannot_be_implicitly_claimed(self):
        self.contract['agent_review']['completed']=False;c.write(self.project/'creation.json',self.contract)
        with self.assertRaisesRegex(ValueError,'review is still pending'):self.build()
        self.assertFalse((self.root/'result').exists())

    def test_external_references_do_not_become_original_provenance(self):
        self.contract['external_creative_sources']=['A supplied novel'];c.write(self.project/'creation.json',self.contract)
        with self.assertRaisesRegex(ValueError,'source workflow'):self.build()

    def test_nonhuman_author_defined_woman_is_accepted(self):
        self.contract['cast'][0]['nature']='virtual';c.write(self.project/'creation.json',self.contract);self.build()

    def test_background_man_does_not_trigger_a_main_cast_rewrite(self):
        self.contract['cast'].append({'id':'porter','name':'Porter','role':'background','author_defined_woman':False,'adult':True})
        c.write(self.project/'creation.json',self.contract);self.build()

    def test_missing_adult_designation_is_rejected_for_this_checkpoint(self):
        self.contract['cast'][0]['adult']=False;c.write(self.project/'creation.json',self.contract)
        with self.assertRaisesRegex(ValueError,'adult'):self.build()

    def test_pending_preferences_are_not_silently_accepted(self):
        p=c.read(self.project/'preferences.json');p['status']='pending';c.write(self.project/'preferences.json',p)
        with self.assertRaisesRegex(ValueError,'ready preferences'):self.build()

    def test_existing_output_is_preserved(self):
        (self.root/'result').mkdir();(self.root/'result/sentinel').write_text('keep')
        with self.assertRaisesRegex(ValueError,'output exists'):self.build()
        self.assertEqual((self.root/'result/sentinel').read_text(),'keep')

    def test_existing_creation_is_not_overwritten(self):
        original=(self.project/'creation.json').read_bytes()
        with self.assertRaisesRegex(ValueError,'empty creation'):c.initialize(self.project)
        self.assertEqual((self.project/'creation.json').read_bytes(),original)

    def test_missing_worldbook_fails_without_partial_output(self):
        p=self.project/'card.md';p.write_text(p.read_text().split('## Lorebook')[0])
        with self.assertRaisesRegex(ValueError,'usable worldbook'):self.build()
        self.assertFalse((self.root/'result').exists())

    def test_default_catalogs_keep_values_and_localize_chinese_choices(self):
        a=ROOT/'skills/yuri-card-creator/assets';en=c.read(a/'interaction.en.json');zh=c.read(a/'interaction.zh-CN.json')
        self.assertEqual([x['value'] for x in en['choices']],[x['value'] for x in zh['choices']])
        self.assertEqual(len(zh['choices']),3)
        for x in zh['choices']:self.assertRegex(x['label'],r'[\u4e00-\u9fff]')

    def test_unverified_base_is_not_claimed_as_the_pinned_dependency(self):
        with self.assertRaisesRegex(ValueError,'missing or differs'):c.probe(self.root/'uninstalled-base')


if __name__=='__main__':unittest.main()
