"""MIT profile contract shared by the four workflows; no legacy engine imported.

Validate declared policies and their structured decisions. Prose fidelity and
free-text criteria remain explicit agent reviews, never an automatic claim.
"""
import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT = ROOT / "skills/yuri-card-creator/assets/preferences.default.json"
DYNAMICS = ("romance", "friendship", "neutral", "rivalry", "hostility", "kinship")
OPTIONAL = {
    "definition": {"allowed_dynamics": list(DYNAMICS)},
    "transformation": {"selected_character_ids": [], "excluded_character_ids": [], "protected_anchors": []},
    "relationships": {"pairing_targets": [], "preserve_uncertainty": True},
    "workflow": "minimal-change",
}


def require(value, message):
    if not value:
        raise ValueError(message)


def text(value):
    return isinstance(value, str) and bool(value.strip()) and value == value.strip()


def identifiers(value, label):
    require(isinstance(value, list) and all(text(x) for x in value)
            and len(set(value)) == len(value), label + " must be a list of unique nonempty strings")
    return set(value)


def effective(value):
    result = copy.deepcopy(value)
    for group, fields in OPTIONAL.items():
        if isinstance(fields, dict):
            for key, default in fields.items():
                result[group].setdefault(key, copy.deepcopy(default))
        else:
            result.setdefault(group, fields)
    return result


def validate(value):
    require(isinstance(value, dict), "Profile must be an object")
    require(value.get("schema_version") == "1.0", "Unsupported profile schema_version")
    require(value.get("status") == "ready", "profile must contain ready preferences")
    require(text(value.get("profile_id")) and text(value.get("narrative_language")), "Profile needs profile_id and narrative_language")
    keys = {
        "definition": {"womanhood_policy", "custom_criteria", "infer_gender_from_stereotypes", "allowed_dynamics"},
        "transformation": {"scope", "player_persona", "selected_character_ids", "excluded_character_ids", "protected_anchors"},
        "relationships": {"outcome_policy", "infer_romance_from_hostility", "pairing_targets", "preserve_uncertainty"},
    }
    require(set(value) <= {*keys, "schema_version", "profile_id", "status", "narrative_language", "workflow"}, "Unsupported profile field; do not silently discard it")
    for group, allowed in keys.items():
        require(isinstance(value.get(group), dict) and set(value[group]) <= allowed, "Unsupported or malformed profile group: " + group)
    v = effective(value)
    definition, transform, relations = (v[g] for g in keys)
    require(definition.get("womanhood_policy") in ("author_defined_inclusive", "human_explicitly_female", "custom"), "Unsupported womanhood_policy")
    require(isinstance(definition.get("custom_criteria"), str), "custom_criteria must be text")
    require(bool(definition["custom_criteria"].strip()) == (definition["womanhood_policy"] == "custom"), "Use nonempty custom_criteria only with the custom womanhood_policy")
    require(definition.get("infer_gender_from_stereotypes") is False, "infer_gender_from_stereotypes must remain false")
    allowed = identifiers(definition["allowed_dynamics"], "allowed_dynamics")
    require(allowed and allowed <= set(DYNAMICS), "Unsupported or empty allowed_dynamics")
    require(transform.get("scope") in ("main_cast", "named_characters", "entire_cast"), "Unsupported transformation scope")
    selected = identifiers(transform["selected_character_ids"], "selected_character_ids")
    excluded = identifiers(transform["excluded_character_ids"], "excluded_character_ids")
    require(not selected & excluded, "Selected and excluded character IDs overlap")
    require(bool(selected) == (transform["scope"] == "named_characters"), "named_characters requires selected_character_ids; other scopes must leave it empty")
    identifiers(transform["protected_anchors"], "protected_anchors")
    require(transform.get("player_persona") in ("preserve", "explicitly_authorized"), "Unsupported player_persona policy")
    require(relations.get("outcome_policy") in ("preserve_outcomes", "rederive_if_causal", "explicit_pairing_targets"), "Unsupported relationship outcome_policy")
    require(relations.get("infer_romance_from_hostility") is False and relations["preserve_uncertainty"] is True, "Do not infer romance from hostility or erase source uncertainty")
    require(isinstance(relations["pairing_targets"], list), "pairing_targets must be a list")
    pairs = set()
    for pair in relations["pairing_targets"]:
        require(isinstance(pair, dict) and set(pair) == {"a", "b", "target_dynamic"}
                and text(pair["a"]) and text(pair["b"]) and pair["a"] != pair["b"]
                and text(pair["target_dynamic"]) and pair["target_dynamic"] in allowed, "Invalid pairing target or disallowed dynamic")
        key = tuple(sorted((pair["a"], pair["b"])))
        require(key not in pairs, "Duplicate/conflicting pairing target")
        pairs.add(key)
    require(bool(pairs) == (relations["outcome_policy"] == "explicit_pairing_targets"), "Use pairing_targets only with explicit_pairing_targets, which requires at least one pair")
    require(v["workflow"] in ("minimal-change", "pairing-focused", "character-focused", "world-focused"), "Unsupported workflow policy")
    return value


def load(path=None):
    def unique(items):
        result = {}
        for key, value in items:
            require(key not in result, "Duplicate profile key: " + key)
            result[key] = value
        return result
    value = json.loads(Path(path or DEFAULT).read_text(encoding="utf-8-sig"), object_pairs_hook=unique,
                       parse_constant=lambda x: (_ for _ in ()).throw(ValueError("Invalid profile number: " + x)))
    return validate(value)


def is_default(value):
    def policy(v):
        return {k: field for k, field in effective(v).items() if k not in ("profile_id", "status")}
    return policy(value) == policy(load())


def review_template(path):
    return {"profile_sha256": hashlib.sha256(Path(path).read_bytes()).hexdigest(),
            "checks": {k: "" for k in ("definition", "scope", "relationships", "player_persona", "protected_anchors", "narrative_language", "workflow")},
            "player_authorization": "", "anchors": []}


def review(value, record, path):
    saved = record.get("policy_review")
    if is_default(value) and saved is None:
        return  # Historical default projects need no invented review receipt.
    expected = review_template(path)
    require(isinstance(saved, dict) and saved.get("profile_sha256") == expected["profile_sha256"], "Missing or stale policy_review profile binding")
    checks = saved.get("checks")
    require(isinstance(checks, dict) and all(text(checks.get(k)) for k in expected["checks"]), "Complete the actual policy_review checks before export")
    anchors = saved.get("anchors", [])
    required = effective(value)["transformation"]["protected_anchors"]
    require(isinstance(anchors, list) and all(isinstance(a, dict) and text(a.get("anchor"))
            and a.get("preserved") is True and text(a.get("reason")) for a in anchors)
            and len(anchors) == len(required) and {a["anchor"] for a in anchors} == set(required), "Review every protected anchor as preserved with a reason")
    if value["transformation"]["player_persona"] == "explicitly_authorized":
        require(text(saved.get("player_authorization")), "Record the user's actual player-persona authorization")


def target_ids(value, cast):
    require(isinstance(cast, list) and cast and all(isinstance(c, dict) and text(c.get("id"))
            and c.get("role") in ("main", "player", "background") for c in cast), "Record cast IDs and main/player/background roles")
    known = {c["id"] for c in cast}
    require(len(known) == len(cast), "Unique cast IDs required")
    transform = effective(value)["transformation"]
    selected, excluded = set(transform["selected_character_ids"]), set(transform["excluded_character_ids"])
    require(selected | excluded <= known, "Unknown selected/excluded character ID")
    pairs = effective(value)["relationships"]["pairing_targets"]
    require(all({p["a"], p["b"]} <= known for p in pairs), "Unknown pairing character ID")
    chosen = selected if transform["scope"] == "named_characters" else known if transform["scope"] == "entire_cast" else {c["id"] for c in cast if c["role"] in ("main", "player")}
    return chosen - excluded


def identity(value, result, *, original=False):
    woman, adult = ("author_defined_woman", "adult") if original else ("result_woman", "result_adult")
    require(result.get(woman) is True and result.get(adult) is True, "Selected targets must be adult author-defined women")
    policy = value["definition"]["womanhood_policy"]
    if policy == "human_explicitly_female":
        require(result.get("nature") == "human", "human_explicitly_female requires explicit human nature for every selected target")
    if policy == "custom":
        require(result.get("criteria_met") is True and text(result.get("criteria_reason")), "Document custom criteria_met and criteria_reason for every selected target")


def relationships(value, rows, known, *, original=False):
    require(isinstance(rows, list) and all(isinstance(row, dict) for row in rows), "Relationship decisions must be an array of objects")
    v = effective(value)
    policy = v["relationships"]["outcome_policy"]
    required = {tuple(sorted((p["a"], p["b"]))): p["target_dynamic"] for p in v["relationships"]["pairing_targets"]}
    seen = {}
    for row in rows:
        change = original or row.get("kind") == "relationship"
        if not original and policy == "preserve_outcomes":
            require(not change, "preserve_outcomes forbids relationship-change decisions; record retained outcomes as preserved")
        if not change and not (row.get("kind") == "preserved" and "target_dynamic" in row):
            continue
        if not original and is_default(value) and not {"a", "b", "target_dynamic"} & row.keys():
            continue  # Retain pre-profile default source plans.
        a, b, dynamic = row.get("a"), row.get("b"), row.get("target_dynamic")
        require(text(a) and text(b) and a != b and {a, b} <= known, "Relationship decisions need known, distinct a/b character IDs")
        require(text(dynamic) and dynamic in v["definition"]["allowed_dynamics"], "Relationship dynamic is outside allowed_dynamics")
        pair = tuple(sorted((a, b)))
        require(pair not in seen, "Duplicate relationship outcome")
        if policy == "explicit_pairing_targets":
            if pair in required:
                require(required[pair] == dynamic, "Relationship does not match explicit pairing_targets")
            else:
                require(original or not change, "Relationship change is outside explicit pairing_targets")
        if change and not original:
            require(text(row.get("changed_circumstance")), "Relationship changes need a specific changed circumstance")
            require(row.get("causal_record_ids") or text(row.get("causal_basis")), "Relationship changes need causal support")
        seen[pair] = dynamic
    if required:
        require(all(seen.get(pair) == dynamic for pair, dynamic in required.items()), "Document every explicit pairing target and its requested dynamic")


def validate_original(value, contract, path):
    cast = contract["cast"]
    selected = target_ids(value, cast)
    for character in cast:
        if character["id"] in selected:
            identity(value, character, original=True)
    relationships(value, contract.get("relationships", []), {c["id"] for c in cast}, original=True)
    review(value, contract, path)


def validate_targets(value, targets, cast):
    expected = target_ids(value, cast)
    require(isinstance(targets, list) and all(isinstance(t, dict) and text(t.get("record_id")) for t in targets), "Record adaptation targets")
    actual = {t["record_id"] for t in targets}
    require(len(actual) == len(targets) and actual == expected, "Scope must cover every main/player character or exactly the selected policy targets, excluding saved exclusions")
    source = {c["id"]: c for c in cast}
    for target in targets:
        require(source[target["record_id"]].get("age_status") != "minor", "Do not silently re-age minor targets")
        identity(value, target)
        require(text(target.get("reason")), "Record each target's adaptation basis")
    return expected
