# -*- coding: utf-8 -*-
"""
Apply Book 8 (Thời Đại 2) fixes to data files:
- data/lesson_contents.json
- data/offline_curriculum_2.json & .gz
- data/offline_bundle.json & .gz
"""

import json
import gzip
import os
import sys

# Import Part 1 and Part 2
from rebuild_b8_dialogues_master import LESSONS_B8
from rebuild_b8_part2 import LESSONS_B8_PART2

ALL_B8 = {}
ALL_B8.update(LESSONS_B8)
ALL_B8.update(LESSONS_B8_PART2)

print(f"Total Book 8 lessons loaded: {len(ALL_B8)}")
assert len(ALL_B8) == 16, f"Expected 16 lessons, got {len(ALL_B8)}"

# Validation check: line counts
errors = []
for lid in range(91, 107):
    slid = str(lid)
    data = ALL_B8.get(slid)
    if not data:
        errors.append(f"Missing lesson {slid}")
        continue
    cn_lines = [l for l in data["dialogue_cn"].split("\n") if l.strip()]
    vi_lines = [l for l in data["dialogue_vi"].split("\n") if l.strip()]
    if len(cn_lines) != len(vi_lines):
        errors.append(f"Lesson {slid} line count mismatch: CN={len(cn_lines)} vs VI={len(vi_lines)}")
    for line in cn_lines:
        if "：" not in line and ":" not in line:
            errors.append(f"Lesson {slid} CN line missing colon speaker: {line[:30]}")
    for line in vi_lines:
        if ":" not in line:
            errors.append(f"Lesson {slid} VI line missing colon speaker: {line[:30]}")

if errors:
    print("VALIDATION ERRORS:")
    for e in errors:
        print("  -", e)
    sys.exit(1)

print("Validation passed 100%! All 16 lessons have identical line counts and proper speaker formatting.")

# Path definitions
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LC_PATH = os.path.join(ROOT, "data", "lesson_contents.json")
C2_PATH = os.path.join(ROOT, "data", "offline_curriculum_2.json")
C2_GZ_PATH = os.path.join(ROOT, "data", "offline_curriculum_2.json.gz")
BUNDLE_PATH = os.path.join(ROOT, "data", "offline_bundle.json")
BUNDLE_GZ_PATH = os.path.join(ROOT, "data", "offline_bundle.json.gz")

with open(LC_PATH, "r", encoding="utf-8") as f:
    lesson_contents = json.load(f)

def update_contents_dict(contents_dict):
    updated_count = 0
    for lid in range(91, 107):
        slid = str(lid)
        items = contents_dict.get(slid, [])
        b8_data = ALL_B8.get(slid)
        if not b8_data:
            continue
        
        cn_lines = [l for l in b8_data["dialogue_cn"].split("\n") if l.strip()]
        
        # Build clean script_json for dialogue
        clean_script = []
        for idx, line in enumerate(cn_lines):
            # text without speaker prefix
            speaker, text = line.split("：", 1) if "：" in line else line.split(":", 1)
            clean_script.append({
                "id": idx + 1,
                "speaker": speaker.strip(),
                "text": text.strip(),
                "start_time": idx * 3.5,
                "end_time": (idx + 1) * 3.5
            })

        for it in items:
            opt = it.get("dropdown_option", "")
            itype = it.get("type", "")
            if opt == "Bài khoá 1" or ("Bài khoá 1" in opt) or (itype == "dialogue" and "Bài khoá 1" in it.get("title", "")):
                it["title"] = b8_data["dialogue_title"]
                it["content"] = b8_data["dialogue_cn"]
                it["vietnamese"] = b8_data["dialogue_vi"]
                it["script_json"] = clean_script
                updated_count += 1
            elif opt == "Bài khoá 2" or ("Bài khoá 2" in opt) or (itype == "lesson_text" and "課本短文" in it.get("title", "")):
                it["title"] = b8_data["text_title"]
                it["content"] = b8_data["text_cn"]
                it["vietnamese"] = b8_data["text_vi"]
                updated_count += 1

    return updated_count

# 1. Update lesson_contents.json
count_lc = update_contents_dict(lesson_contents)
print(f"Updated {count_lc} items in lesson_contents.json")
with open(LC_PATH, "w", encoding="utf-8") as f:
    json.dump(lesson_contents, f, ensure_ascii=False, indent=2)

# 2. Update offline_curriculum_2.json & .gz
if os.path.exists(C2_PATH):
    with open(C2_PATH, "r", encoding="utf-8") as f:
        c2 = json.load(f)
    if "lesson_contents" in c2:
        count_c2 = update_contents_dict(c2["lesson_contents"])
        print(f"Updated {count_c2} items in offline_curriculum_2.json")
        with open(C2_PATH, "w", encoding="utf-8") as f:
            json.dump(c2, f, ensure_ascii=False, indent=2)
        with gzip.open(C2_GZ_PATH, "wt", encoding="utf-8") as f:
            json.dump(c2, f, ensure_ascii=False)
        print("Regenerated offline_curriculum_2.json.gz successfully.")

# 3. Update offline_bundle.json & .gz
if os.path.exists(BUNDLE_PATH):
    with open(BUNDLE_PATH, "r", encoding="utf-8") as f:
        bundle = json.load(f)
    if "lesson_contents" in bundle:
        count_bundle = update_contents_dict(bundle["lesson_contents"])
        print(f"Updated {count_bundle} items in offline_bundle.json")
        with open(BUNDLE_PATH, "w", encoding="utf-8") as f:
            json.dump(bundle, f, ensure_ascii=False, indent=2)
        with gzip.open(BUNDLE_GZ_PATH, "wt", encoding="utf-8") as f:
            json.dump(bundle, f, ensure_ascii=False)
        print("Regenerated offline_bundle.json.gz successfully.")

print("\n--- Verification Sample ---")
for check_id in ["92", "93", "100", "103", "105"]:
    sample_items = lesson_contents.get(check_id, [])
    for it in sample_items:
        if it.get("dropdown_option") == "Bài khoá 1":
            print(f"\n[Lesson {check_id}] {it.get('title')}:")
            lines = it.get("content", "").split("\n")
            print(f"  First line: {lines[0]}")
            print(f"  Second line: {lines[1]}")
            print(f"  Total lines: {len(lines)}")
            print(f"  Last line:  {lines[-1]}")
            vi_lines = it.get("vietnamese", "").split("\n")
            print(f"  VI first:   {vi_lines[0]}")
            print(f"  VI last:    {vi_lines[-1]}")
