"""Focused contract checks for saved-profile compatibility across workflows."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "shared"))

def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec); spec.loader.exec_module(value)
    return value

p = module("profile_provenance", ROOT / "shared/provenance.py")
profiles = module("profile_contract", ROOT / "shared/profiles.py")
creator = module("profile_creator", ROOT / "skills/yuri-card-creator/scripts/create_card.py")
cards = module("profile_cards", ROOT / "shared/card_files.py")
novels = module("profile_novels", ROOT / "shared/novels.py")
fixture = module("profile_source_fixture", ROOT / "examples/post-to-yuri/run_example.py")


class ProfileTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def profile(self):
        value = p.read(ROOT / "skills/yuri-card-creator/assets/preferences.default.json")
        value["profile_id"] = "focused-regression"
        return value

    def write_profile(self, value):
        path = self.root / "profile.json"
        path.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")
        return path

    def complete_review(self, record, path):
        record["policy_review"] = profiles.review_template(path)
        record["policy_review"]["checks"] = {key: "Reviewed in focused synthetic regression." for key in record["policy_review"]["checks"]}

    def test_legacy_default_is_unchanged_and_custom_profile_is_validated(self):
        default = creator.profile()
        self.assertTrue(profiles.is_default(default))
        custom = self.profile()
        custom["definition"]["womanhood_policy"] = "custom"
        custom["definition"]["custom_criteria"] = "The author explicitly designates the character as a woman."
        custom["transformation"].update(scope="named_characters", selected_character_ids=["lin"])
        custom["relationships"]["outcome_policy"] = "preserve_outcomes"
        self.assertEqual(profiles.validate(custom), custom)
        for mutate in (
            lambda x: x.update(unrecognized=True),
            lambda x: x["definition"].update(infer_gender_from_stereotypes=True),
            lambda x: x["transformation"].update(scope="named_characters", selected_character_ids=[]),
            lambda x: x["definition"].update(allowed_dynamics=["romance", "romance"]),
            lambda x: x["relationships"].update(outcome_policy="explicit_pairing_targets", pairing_targets=[]),
            lambda x: x.update(workflow=42),
            lambda x: x.update(narrative_language=[]),
        ):
            bad = copy.deepcopy(custom); mutate(bad)
            with self.assertRaises(ValueError): profiles.validate(bad)

    def test_original_custom_export_checks_target_and_profile_review(self):
        project = self.root / "original"
        profile = self.profile()
        profile["definition"]["womanhood_policy"] = "custom"
        profile["definition"]["custom_criteria"] = "Author designation is explicit."
        profile_path = self.write_profile(profile)
        creator.initialize(project, profile_path=profile_path)
        contract = creator.read(project / "creation.json")
        contract.update(cast=[{"id":"nora", "name":"Nora", "role":"main", "author_defined_woman":True,
                               "adult":True, "criteria_met":True, "criteria_reason":"Explicitly author-designated."}],
                        relationships=[], creative_choices=["Synthetic original fixture."],
                        agent_review={"completed":True, "notes":["Reviewed synthetic fixture."]})
        creator.write(project / "creation.json", contract)
        with self.assertRaisesRegex(ValueError, "policy_review"):
            profiles.validate_original(profile, contract, project / "preferences.json")
        self.complete_review(contract, project / "preferences.json")
        profiles.validate_original(profile, contract, project / "preferences.json")
        (project / "card.md").write_text('---\nname: Nora\n---\n## First Message\nNora turns to {{user}}.\n## Lorebook\n### Nora | keys: Nora\nNora is an adult woman.\n', encoding="utf-8")
        creator.write(project / "creation.json", contract)
        creator.export(project, self.root / "original-result")
        contract["cast"][0]["criteria_met"] = False
        creator.write(project / "creation.json", contract)
        with self.assertRaisesRegex(ValueError, "custom criteria"):
            creator.export(project, self.root / "original-invalid")

    def test_target_scopes_exclusions_human_policy_and_relationship_constraints(self):
        cast = [{"id":"a", "role":"main"}, {"id":"b", "role":"background"}, {"id":"skip", "role":"player"}]
        value = self.profile(); value["transformation"].update(scope="entire_cast", excluded_character_ids=["skip"])
        self.assertEqual(profiles.target_ids(value, cast), {"a", "b"})
        value["transformation"]["excluded_character_ids"] = ["missing"]
        with self.assertRaisesRegex(ValueError, "Unknown selected/excluded"):
            profiles.target_ids(value, cast)
        value = self.profile(); value["definition"].update(womanhood_policy="human_explicitly_female")
        with self.assertRaisesRegex(ValueError, "explicit human nature"):
            profiles.identity(value, {"result_woman":True, "result_adult":True, "nature":"virtual"})
        value["relationships"].update(outcome_policy="explicit_pairing_targets", pairing_targets=[{"a":"a", "b":"b", "target_dynamic":"romance"}])
        profiles.relationships(value, [{"kind":"preserved", "a":"a", "b":"b", "target_dynamic":"romance"}], {"a", "b"})
        profiles.relationships(value, [{"kind":"preserved", "a":"a", "b":"b", "target_dynamic":"romance"},
                                      {"kind":"preserved", "a":"a", "b":"other", "target_dynamic":"friendship"}], {"a", "b", "other"})
        with self.assertRaisesRegex(ValueError, "explicit pairing_targets"):
            profiles.relationships(value, [{"kind":"relationship", "a":"a", "b":"b", "target_dynamic":"romance",
                                            "changed_circumstance":"new event", "causal_basis":"synthetic cause"},
                                           {"kind":"relationship", "a":"a", "b":"other", "target_dynamic":"friendship",
                                            "changed_circumstance":"new event", "causal_basis":"synthetic cause"}], {"a", "b", "other"})
        with self.assertRaisesRegex(ValueError, "does not match explicit pairing_targets"):
            profiles.relationships(value, [{"kind":"preserved", "a":"a", "b":"b", "target_dynamic":"friendship"}], {"a", "b"})
        value["definition"]["allowed_dynamics"] = ["friendship"]
        with self.assertRaisesRegex(ValueError, "disallowed dynamic"):
            profiles.validate(value)

    def test_policy_review_requires_protected_anchors_and_player_authorization(self):
        value = self.profile(); value["transformation"]["protected_anchors"] = ["keep ending open"]
        value["transformation"]["player_persona"] = "explicitly_authorized"
        path = self.write_profile(value)
        record = {"policy_review": profiles.review_template(path)}
        record["policy_review"]["checks"] = {key:"Reviewed." for key in record["policy_review"]["checks"]}
        with self.assertRaisesRegex(ValueError, "Review every protected anchor"):
            profiles.review(value, record, path)
        record["policy_review"]["anchors"] = [{"anchor":"keep ending open", "preserved":True, "reason":"Opening leaves player choice open."}]
        with self.assertRaisesRegex(ValueError, "player-persona authorization"):
            profiles.review(value, record, path)
        record["policy_review"]["player_authorization"] = "User explicitly requested a fixed adult female persona."
        profiles.review(value, record, path)

    def test_source_scope_relationship_guard_and_profile_binding(self):
        # A non-default language profile remains buildable through the source route.
        good_project, good_draft, good_plan = fixture.setup(self.root / "source-valid")
        good_profile = self.profile(); good_profile["definition"]["womanhood_policy"] = "human_explicitly_female"
        good_pref = good_project / "preferences.json"
        good_pref.write_text(json.dumps(good_profile, ensure_ascii=False), encoding="utf-8")
        good_value = p.read(good_plan); good_value["bindings"] = p.bindings(good_project, good_draft)
        for target in good_value["targets"]: target["nature"] = "human"
        bond = next(d for d in good_value["decisions"] if d["id"] == "bond")
        bond.update(a="player", b="lin", target_dynamic="romance")
        self.complete_review(good_value, good_pref)
        good_plan.write_text(json.dumps(good_value, ensure_ascii=False), encoding="utf-8")
        p.build(good_project, good_draft, good_plan, self.root / "source-valid-result")

        project, draft, plan = fixture.setup(self.root / "source")
        profile = self.profile()
        profile["transformation"].update(scope="named_characters", selected_character_ids=["lin"])
        profile["relationships"]["outcome_policy"] = "preserve_outcomes"
        pref = project / "preferences.json"
        pref.write_text(json.dumps(profile, ensure_ascii=False), encoding="utf-8")
        value = p.read(plan)
        value["bindings"] = p.bindings(project, draft)
        value["targets"] = [{"record_id":"lin", "result_woman":True, "result_adult":True, "reason":"Keep sourced adult woman."}]
        self.complete_review(value, pref)
        plan.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")
        # The remaining identity decision intentionally references the source player;
        # scope policy only restricts transformation targets, not factual provenance.
        with self.assertRaisesRegex(ValueError, "preserve_outcomes"):
            p.build(project, draft, plan, self.root / "blocked")
        value["decisions"] = [d for d in value["decisions"] if d["id"] != "bond"]
        value["field_sources"] = [dict(m, decision_ids=[d for d in m["decision_ids"] if d != "bond"])
                                  for m in value["field_sources"]]
        value["decisions"].append({"id":"bond", "kind":"preserved", "record_ids":["lamp"], "a":"player", "b":"lin",
                                   "target_dynamic":"neutral", "summary":"Preserve uncertainty and current outcome."})
        plan.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")
        # The separate binding assertion catches profile edits even before plan semantics run.
        pref.write_text(json.dumps({**profile, "narrative_language":"en"}, ensure_ascii=False), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Stale source/draft/profile bindings"):
            p.build(project, draft, plan, self.root / "stale")

    def test_novel_registration_forwards_valid_profile(self):
        source = self.root / "short-synthetic.txt"
        source.write_text("第一章\n一位成年女性在修复旧书。\n", encoding="utf-8")
        profile = self.profile(); profile["workflow"] = "character-focused"
        path = self.write_profile(profile)
        result = novels.register(source, self.root / "novel-project", ["c000001"], profile_path=path)
        saved = p.read(self.root / "novel-project/preferences.json")
        self.assertEqual(result["mode"], "source_yuri")
        self.assertEqual(saved["workflow"], "character-focused")

    def test_post_novel_and_card_cli_forward_profile_arguments(self):
        profile = self.profile(); profile["workflow"] = "world-focused"
        profile_path = self.write_profile(profile)
        scripts = ROOT / "scripts"
        existing_card = ROOT / "examples/one-conversation/yuri-card.v2.json"
        post = ROOT / "examples/post-to-yuri/post.txt"
        novel = self.root / "tiny.txt"; novel.write_text("第一章\n合成短篇。\n", encoding="utf-8")
        calls = [
            [sys.executable, str(scripts / "source_card.py"), "init", "--input", str(post), "--project", str(self.root / "post"), "--profile", str(profile_path)],
            [sys.executable, str(scripts / "novel_source.py"), "init", "--input", str(novel), "--project", str(self.root / "novel"), "--chapter", "c000001", "--profile", str(profile_path)],
            [sys.executable, str(scripts / "card_file.py"), "open", "--input", str(existing_card), "--project", str(self.root / "card"), "--profile", str(profile_path)],
        ]
        for command, project in zip(calls, ("post", "novel", "card")):
            subprocess.run(command, cwd=ROOT, check=True, capture_output=True, text=True)
            self.assertEqual(p.read(self.root / project / "preferences.json")["workflow"], "world-focused")

    def test_inherited_custom_scope_and_stale_profile(self):
        source_card = self.root / "inherited-input.json"
        source_value = p.read(ROOT / "examples/one-conversation/yuri-card.v2.json")
        source_value["data"]["scenario"] = "Before.\n```text\nkeep-code\n```"
        source_card.write_text(json.dumps(source_value, ensure_ascii=False), encoding="utf-8")
        project = self.root / "inherited"
        profile = self.profile()
        profile["transformation"].update(scope="named_characters", selected_character_ids=["nora"])
        path = self.write_profile(profile)
        cards.open_project(source_card, project, profile_path=path)
        plan = p.read(project / "edit-plan.json")
        plan["cast"] = [{"id":"nora", "role":"main", "source_gender":"woman", "age_status":"adult"}]
        plan["targets"] = [{"record_id":"nora", "result_woman":True, "result_adult":True, "reason":"Preserve source identity."}]
        self.complete_review(plan, project / "preferences.json")
        plan["agent_review"] = {"completed":True, "notes":["Reviewed no-op synthetic inherited session."]}
        plan["changes"] = [{"document":"json", "path":"/data/scenario", "before":"Before.\n```text\nkeep-code\n```", "after":"Setting note.\n```text\nkeep-code\n```", "reason":"Clarify the setting without changing character facts.", "character_ids":[]}]
        plan["decisions"] = [{"kind":"invention", "summary":"Add one setting-only clarification."}]
        plan_path = project / "edit-plan.json"
        plan_path.write_text(json.dumps(plan, ensure_ascii=False), encoding="utf-8")
        # A valid custom-profile no-op session exercises target scope and review binding.
        cards.apply(project, plan_path, self.root / "inherited-result")
        result = p.read(self.root / "inherited-result/json.json")
        self.assertIn("keep-code", result["data"]["scenario"])
        plan["changes"][0].update(path="/data/name", before="沈照汐", after="Changed", character_ids=["owner"])
        plan_path.write_text(json.dumps(plan, ensure_ascii=False), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Prose edits must stay within saved character scope"):
            cards.apply(project, plan_path, self.root / "out-of-scope")
        book = p.read(project / "documents.json")["json"]["data"]["character_book"]
        plan["changes"][0].update(path="/data/character_book", before=book, after=book, character_ids=[])
        plan_path.write_text(json.dumps(plan, ensure_ascii=False), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Protected field"):
            cards.apply(project, plan_path, self.root / "protected")
        pref = p.read(project / "preferences.json"); pref["narrative_language"] = "en"
        (project / "preferences.json").write_text(json.dumps(pref, ensure_ascii=False), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Stale inherited profile binding"):
            cards.apply(project, plan_path, self.root / "stale-result")

    def test_legacy_v1_default_session_remains_supported(self):
        project = self.root / "legacy"
        cards.open_project(ROOT / "examples/one-conversation/yuri-card.v2.json", project)
        session = p.read(project / "session.json"); session["schema"] = "yuri/card-session/v1"
        session.pop("profile_sha256"); (project / "session.json").write_text(json.dumps(session), encoding="utf-8")
        (project / "preferences.json").unlink()
        plan_path = project / "edit-plan.json"; plan = p.read(plan_path); plan.pop("profile_sha256")
        plan["agent_review"] = {"completed":True, "notes":["Legacy default no-op regression."]}
        plan_path.write_text(json.dumps(plan, ensure_ascii=False), encoding="utf-8")
        cards.apply(project, plan_path, self.root / "legacy-result")


if __name__ == "__main__": unittest.main()
