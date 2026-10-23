import os
import re
import json
import unicodedata
import hashlib
import time
import asyncio
import urllib.request
import urllib.parse
import subprocess
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template, send_from_directory, send_file, Response

app = Flask(__name__, static_folder="static", template_folder="templates")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
TTS_CACHE_DIR = os.path.join(BASE_DIR, "tts_cache")
os.makedirs(TTS_CACHE_DIR, exist_ok=True)

# Helper to load JSON
def load_json(filename, default=None):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return default

# Load datasets into memory on startup
print("Loading datasets into memory...")
CURRICULUMS = load_json("curriculums.json", [])
BOOKS = load_json("books.json", [])
LESSONS = load_json("lessons.json", [])
LESSON_VOCAB = load_json("lesson_vocab.json", {})
LESSON_CONTENTS = load_json("lesson_contents.json", {})
GRAMMAR = load_json("grammar.json", [])
RADICALS = load_json("radicals.json", [])
MEASURE_WORDS = load_json("measure_words.json", {"groups": [], "words": []})
DICT_TAGS = load_json("dict_tags.json", [])
TAG_VOCAB = load_json("tag_vocab.json", {})
SHADOWING_TOPICS = load_json("shadowing_topics.json", [])
SHADOWING_VIDEOS = load_json("shadowing_videos.json", [])
print(f"Loaded: {len(CURRICULUMS)} curriculums, {len(BOOKS)} books, {len(LESSONS)} lessons, {len(GRAMMAR)} grammar points, {len(RADICALS)} radicals.")

# Build search index for vocabulary
ALL_VOCAB = []
for lid, vlist in LESSON_VOCAB.items():
    if isinstance(vlist, list):
        for w in vlist:
            if isinstance(w, dict) and "hanzi" in w:
                ALL_VOCAB.append(w)
print(f"Total vocabulary indexed: {len(ALL_VOCAB)} words.")
CHAR_META = load_json("char_meta.json", {})
RELATIONS = load_json("relations.json", {})
VOCAB_BY_HANZI = {}
for w in ALL_VOCAB:
    hz = (w.get("hanzi") or "").split("/")[0].strip()
    if hz and hz not in VOCAB_BY_HANZI:
        VOCAB_BY_HANZI[hz] = w
print(f"Loaded {len(CHAR_META)} char metadata, {len(RELATIONS)} relation entries, {len(VOCAB_BY_HANZI)} unique vocab words.")

# OpenCC character mapping for Traditional <-> Simplified
TS_MAP = {}
ts_path = os.path.join(DATA_DIR, "TSCharacters.txt")
if os.path.exists(ts_path):
    with open(ts_path, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split("	")
            if len(parts) >= 2:
                TS_MAP[parts[0]] = parts[1].split(" ")[0]

ST_MAP = {}
st_path = os.path.join(DATA_DIR, "STCharacters.txt")
if os.path.exists(st_path):
    with open(st_path, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split("	")
            if len(parts) >= 2:
                ST_MAP[parts[0]] = parts[1].split(" ")[0]

def to_simplified(s):
    if not s: return ""
    return "".join(TS_MAP.get(c, c) for c in s)

def to_traditional(s):
    if not s: return ""
    return "".join(ST_MAP.get(c, c) for c in s)

def remove_pinyin_tones(p):
    if not p: return ""
    p = p.lower().replace("ü", "v").replace("u:", "v")
    p = unicodedata.normalize("NFD", p)
    p = "".join(c for c in p if unicodedata.category(c) != "Mn")
    return p.replace(" ", "").replace("-", "").replace("'", "")

def remove_vn_tones(s):
    if not s: return ""
    s = s.lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.replace("đ", "d")

# Pre-computed deduplicated dictionary search index
DICT_INDEX = []
DICT_BY_ID = {}
seen_did = set()
for w in ALL_VOCAB:
    did = w.get("dict_id") or w.get("vocab_id")
    if not did or did in seen_did:
        continue
    seen_did.add(did)
    hz = (w.get("hanzi") or "").strip()
    simp = to_simplified(hz)
    py = (w.get("pinyin") or "").strip()
    defn = (w.get("definition") or "").strip()
    first_vi = defn.split(";")[0].strip() if defn else ""
    
    first_c = hz[0] if hz else ""
    cm = CHAR_META.get(first_c, {})
    
    item = {
        "dict_id": did,
        "vocab_id": w.get("vocab_id") or did,
        "hanzi": hz,
        "hanzi_simplified": simp if simp != hz else None,
        "pinyin": py,
        "pinyin_clean": remove_pinyin_tones(py),
        "definition": defn,
        "first_meaning_vi": first_vi,
        "vn_clean": remove_vn_tones(defn),
        "radical": cm.get("radical") if len(hz) == 1 else None,
        "stroke_count": cm.get("stroke_count") if len(hz) == 1 else None,
        "tocfl_band": w.get("tocfl_band") if (w.get("tocfl_band") and w.get("tocfl_band") < 99) else None,
        "part_of_speech": w.get("part_of_speech") or "Từ vựng",
        "examples": w.get("examples") or [],
        "ex_len": len(w.get("examples") or [])
    }
    DICT_INDEX.append(item)
    DICT_BY_ID[str(did)] = item
print(f"Compiled optimized DICT_INDEX with {len(DICT_INDEX)} unique entries.")

# Pre-computed TOCFL vocabulary by band (1-6)
TOCFL_VOCAB = {i: [] for i in range(1, 7)}
for it in DICT_INDEX:
    b = it.get("tocfl_band")
    if b in TOCFL_VOCAB:
        TOCFL_VOCAB[b].append(it)
print(f"Indexed TOCFL_VOCAB: {', '.join(f'Band {k}: {len(v)}' for k, v in TOCFL_VOCAB.items())}")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/manifest.json")
def serve_manifest():
    return send_from_directory(os.path.join(BASE_DIR, "static"), "manifest.json", mimetype="application/manifest+json")

@app.route("/sw.js")
@app.route("/service-worker.js")
def serve_sw():
    response = send_from_directory(os.path.join(BASE_DIR, "static"), "sw.js", mimetype="application/javascript")
    response.headers["Service-Worker-Allowed"] = "/"
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response

@app.route("/audio/tts/<path:filename>")
def serve_audio_tts(filename):
    text = filename.replace(".mp3", "").strip()
    if not text:
        return "Missing text", 400
    import hashlib
    h = hashlib.md5(text.encode("utf-8")).hexdigest()
    cache_path = os.path.join(TTS_CACHE_DIR, f"{h}.mp3")
    if not os.path.exists(cache_path) or os.path.getsize(cache_path) == 0:
        import subprocess
        cmd = ["edge-tts", "--voice", "zh-TW-HsiaoChenNeural", "--text", text, "--write-media", cache_path]
        try:
            res = subprocess.run(cmd, timeout=8, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if res.returncode != 0 or not os.path.exists(cache_path):
                cmd[2] = "zh-CN-XiaoxiaoNeural"
                subprocess.run(cmd, timeout=8, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            return "TTS error", 500
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
        return send_file(cache_path, mimetype="audio/mpeg")
    return "Not found", 404

# --- Local Storage Helpers for No-Auth Mode ---
USER_HISTORY_FILE = os.path.join(DATA_DIR, "user_history.json")
SRS_PROGRESS_FILE = os.path.join(DATA_DIR, "srs_progress.json")
NOTEBOOK_FILE = os.path.join(DATA_DIR, "notebook.json")
LAST_POS_FILE = os.path.join(DATA_DIR, "last_position.json")

def load_user_history():
    if os.path.exists(USER_HISTORY_FILE):
        try:
            with open(USER_HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_user_history(hist):
    try:
        with open(USER_HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(hist, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving user history: {e}")

def load_srs_progress():
    if os.path.exists(SRS_PROGRESS_FILE):
        try:
            with open(SRS_PROGRESS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"reviews": {}, "stats": {"points": 180, "streak": 3, "best_streak": 7}, "daily_counts": {}}

def save_srs_progress(prog):
    try:
        with open(SRS_PROGRESS_FILE, "w", encoding="utf-8") as f:
            json.dump(prog, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving srs progress: {e}")

def load_notebook():
    if os.path.exists(NOTEBOOK_FILE):
        try:
            with open(NOTEBOOK_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"groups": [{"id": 1, "name": "Từ vựng yêu thích", "words": []}], "words": []}

def save_notebook(nb):
    try:
        with open(NOTEBOOK_FILE, "w", encoding="utf-8") as f:
            json.dump(nb, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving notebook: {e}")

DICT_CACHE_DIR = os.path.join(DATA_DIR, "dict_cache")
os.makedirs(DICT_CACHE_DIR, exist_ok=True)

def get_rich_dict_detail(did, hanzi=None):
    cache_file = os.path.join(DICT_CACHE_DIR, f"{did}.json") if did else None
    data = None
    if cache_file and os.path.exists(cache_file):
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            pass

    if not data and did:
        try:
            req_t = urllib.request.Request("https://zh.taiwandiary.vn/api.php?action=dict_search_token", headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://zh.taiwandiary.vn/"
            })
            resp_t = urllib.request.urlopen(req_t, timeout=4)
            t_json = json.loads(resp_t.read().decode("utf-8"))
            ts, token = t_json["ts"], t_json["token"]

            url = f"https://zh.taiwandiary.vn/api.php?action=dict_lookup_detail&dict_id={did}&ts={ts}&token={token}"
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://zh.taiwandiary.vn/"
            })
            resp = urllib.request.urlopen(req, timeout=4)
            res = json.loads(resp.read().decode("utf-8"))
            if res.get("success") and res.get("data"):
                data = res["data"]
                if cache_file:
                    with open(cache_file, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False)
        except Exception as e:
            print(f"Remote fetch for dict_id={did} failed: {e}")

    if not data:
        word = None
        if did:
            word = next((w for w in ALL_VOCAB if str(w.get("dict_id") or w.get("vocab_id") or w.get("id")) == str(did)), None)
        if not word and hanzi:
            word = next((w for w in ALL_VOCAB if (w.get("hanzi") or "").lower() == hanzi.lower()), None)
        if word:
            data = dict(word)
            raw_examples = data.get("examples") or []
            mapped_examples = []
            for ex in raw_examples:
                raw_hz = ex.get("examples_hanzi") or ex.get("example_zh") or ""
                clean_hz = re.sub(r"^\[[^\]]+\]\s*", "", raw_hz)
                py = ex.get("examples_pinyin") or ex.get("example_pinyin") or ""
                vi = ex.get("examples_translation") or ex.get("example_vi") or ""
                mapped_examples.append({
                    "example_zh": clean_hz or raw_hz,
                    "example_pinyin": py,
                    "example_vi": vi
                })
            ex0 = mapped_examples[0] if mapped_examples else {}
            pos_label = data.get("part_of_speech") or "Từ vựng"
            data["senses"] = [{
                "meaning_vi": data.get("definition", ""),
                "pos": pos_label,
                "source": "tocfl_textbook",
                "register": "textbook",
                "example_zh": ex0.get("example_zh", ""),
                "example_pinyin": ex0.get("example_pinyin", ""),
                "example_vi": ex0.get("example_vi", ""),
                "examples": mapped_examples
            }]
            data["sense_groups"] = [{
                "pos": pos_label,
                "senses": data["senses"]
            }]

    if data:
        hz = data.get("hanzi", "")
        chars_info = []
        for c in hz:
            cm = CHAR_META.get(c, {})
            chars_info.append({
                "char": c,
                "radical": cm.get("radical") or c,
                "radical_name": cm.get("radical_name") or cm.get("radical") or c,
                "stroke_count": cm.get("stroke_count"),
                "han_viet": cm.get("han_viet") or "",
                "decomposition": cm.get("decomposition") or ""
            })
        data["chars_info"] = chars_info
        if not data.get("han_viet"):
            data["han_viet"] = " ".join(c.get("han_viet", "").split(",")[0].strip() for c in chars_info if c.get("han_viet"))
        first_c = chars_info[0] if chars_info else {}
        if not data.get("radical"):
            data["radical"] = first_c.get("radical")
        if not data.get("stroke_count"):
            data["stroke_count"] = first_c.get("stroke_count")
            
        if not data.get("related"):
            hz_clean = hz.split("/")[0].strip()
            related_words = []
            for w in DICT_INDEX:
                w_hz = w.get("hanzi") or ""
                if hz_clean in w_hz and w_hz != hz_clean:
                    related_words.append({
                        "dict_id": w["dict_id"],
                        "hanzi": w["hanzi"],
                        "hanzi_simplified": w["hanzi_simplified"],
                        "pinyin": w["pinyin"],
                        "definition": w["first_meaning_vi"]
                    })
            related_words.sort(key=lambda r: (len(r["hanzi"]), r["hanzi"]))
            data["related"] = related_words[:30]

    return data

@app.route("/api.php", methods=["GET", "POST"])
def api_php():
    action = request.args.get("action") or request.form.get("action") or ""
    if action == "get_curriculum_types":
        return jsonify(CURRICULUMS)
    elif action == "get_books":
        cid = request.args.get("curriculum_id")
        if cid:
            try:
                cid = int(cid)
                return jsonify([b for b in BOOKS if b.get("curriculum_type_id") == cid])
            except ValueError:
                pass
        return jsonify(BOOKS)
    elif action == "get_lessons":
        bid = request.args.get("book_id")
        if bid:
            try:
                bid = int(bid)
                return jsonify([l for l in LESSONS if l.get("book_id") == bid])
            except ValueError:
                pass
        return jsonify(LESSONS)
    elif action == "get_vocabularies":
        lid = request.args.get("lesson_id")
        return jsonify(LESSON_VOCAB.get(str(lid), []) if lid else [])
    elif action == "get_lesson_contents":
        lid = request.args.get("lesson_id")
        return jsonify({"success": True, "data": LESSON_CONTENTS.get(str(lid), []) if lid else []})
    elif action == "get_dict_tags":
        cat = request.args.get("category")
        tags = [t for t in DICT_TAGS if t.get("category") == cat] if cat else DICT_TAGS
        return jsonify({"success": True, "data": tags})
    elif action in ("get_vocab_by_tag", "get_tag_vocab"):
        tid = request.args.get("tag_id")
        return jsonify({"success": True, "data": TAG_VOCAB.get(str(tid), []) if tid else []})
    elif action in ("get_vocab_by_tocfl_band", "get_tocfl_vocab"):
        band = request.args.get("band") or request.args.get("level")
        try:
            b_val = int(band)
            data = TOCFL_VOCAB.get(b_val, [])
            return jsonify({"success": True, "data": data, "total": len(data), "band": b_val})
        except (ValueError, TypeError):
            return jsonify({"success": False, "message": "Invalid band", "data": []})
    elif action == "get_vocab_contexts":
        vid = request.args.get("dict_id") or request.args.get("vocab_id") or request.args.get("id")
        word = next((w for w in ALL_VOCAB if str(w.get("dict_id") or w.get("vocab_id") or w.get("id")) == str(vid)), None)
        contexts = []
        if word and word.get("hanzi"):
            hz = word["hanzi"].split("/")[0].strip()
            for lid, clist in LESSON_CONTENTS.items():
                for c in clist:
                    content = c.get("content", "")
                    matching_lines = [line.strip() for line in content.split("\n") if hz in line]
                    if matching_lines:
                        contexts.append({
                            "hanzi": hz,
                            "title": c.get("dropdown_option") or f"Bài {lid}",
                            "lesson_title": c.get("dropdown_option") or f"Bài {lid}",
                            "book_id": c.get("book_id"),
                            "lesson_id": c.get("lesson_id") or lid,
                            "content_id": c.get("content_id") or c.get("id"),
                            "lines": [{"line": l} for l in matching_lines[:3]]
                        })
                        if len(contexts) >= 5:
                            break
                if len(contexts) >= 5:
                    break
        return jsonify({"success": True, "data": contexts})
    elif action == "get_grammar_tags":
        tag_type = request.args.get("tag_type")
        if tag_type == "top_n":
            data = [
                {"tag_id": 6, "tag_type": "top_n", "tag_name": "Top 10 hay dùng", "sort_order": 1, "grammar_count": 10},
                {"tag_id": 7, "tag_type": "top_n", "tag_name": "Top 20 hay dùng", "sort_order": 2, "grammar_count": 20},
                {"tag_id": 8, "tag_type": "top_n", "tag_name": "Top 50 hay dùng", "sort_order": 3, "grammar_count": 50}
            ]
        else:
            data = [
                {"tag_id": 9, "tag_type": "curriculum", "tag_name": "TBCL Chính thức (Đài Loan)", "sort_order": 0, "grammar_count": len(GRAMMAR)},
                {"tag_id": 1, "tag_type": "curriculum", "tag_name": "Giáo trình Đương Đại 1", "sort_order": 1, "grammar_count": 50},
                {"tag_id": 2, "tag_type": "curriculum", "tag_name": "Giáo trình Đương Đại 2", "sort_order": 2, "grammar_count": 48},
                {"tag_id": 12, "tag_type": "curriculum", "tag_name": "Giáo trình Thời Đại 2", "sort_order": 3, "grammar_count": 48},
                {"tag_id": 29, "tag_type": "curriculum", "tag_name": "Giáo trình Đương Đại 4", "sort_order": 5, "grammar_count": 43},
                {"tag_id": 42, "tag_type": "curriculum", "tag_name": "Giáo trình Đương Đại 5", "sort_order": 6, "grammar_count": 34}
            ]
        return jsonify({"success": True, "data": data})
    elif action == "get_grammar_list":
        band = request.args.get("band")
        search = request.args.get("search", "").strip().lower()
        tag_id = request.args.get("tag_id")
        page = int(request.args.get("page", 1))
        page_size = int(request.args.get("page_size", 10))
        res = GRAMMAR
        if tag_id:
            try:
                tid = int(tag_id)
                if tid == 6: res = res[:10]
                elif tid == 7: res = res[:20]
                elif tid == 8: res = res[:50]
            except ValueError:
                pass
        if band:
            try:
                b_val = int(band)
                res = [g for g in res if g.get("tocfl_band") == b_val]
            except ValueError:
                pass
        if search:
            res = [g for g in res if search in (g.get("pattern_zh") or "").lower() or search in (g.get("pattern_pinyin") or "").lower() or search in (g.get("title_vi") or "").lower()]
        total = len(res)
        start = (page - 1) * page_size
        return jsonify({"success": True, "data": res[start:start+page_size], "total": total})
    elif action in ("grammar_detail", "get_grammar_detail"):
        gid = request.args.get("grammar_id") or request.args.get("id")
        item = next((g for g in GRAMMAR if str(g.get("grammar_id") or g.get("id")) == str(gid)), None)
        return jsonify({"success": True if item else False, "data": item})
    elif action == "get_radicals":
        strokes = request.args.get("strokes")
        search = request.args.get("search", "").strip().lower()
        res = RADICALS
        if strokes:
            try:
                s_val = int(strokes)
                res = [r for r in res if r.get("strokes") == s_val]
            except ValueError:
                pass
        if search:
            res = [r for r in res if search in (r.get("radical") or "").lower() or search in (r.get("pinyin") or "").lower() or search in (r.get("hanviet") or "").lower() or search in (r.get("meaning_vi") or "").lower()]
        return jsonify({"success": True, "data": res})
    elif action == "get_measure_words":
        group_id = request.args.get("group")
        groups = MEASURE_WORDS.get("groups", [])
        words = MEASURE_WORDS.get("words", [])
        if group_id:
            words = [w for w in words if w.get("group_id") == group_id]
        return jsonify({"success": True, "groups": groups, "words": words})
    elif action in ("notebook_group_list", "get_notebook_groups"):
        return jsonify({"success": True, "groups": [{"group_id": 1, "name": "Từ vựng yêu thích", "word_count": 0, "color": "blue"}]})
    elif action in ("notebook_group_words", "get_saved_vocab"):
        return jsonify({"success": True, "words": []})
    elif action in ("notebook_group_create", "notebook_add_word", "notebook_remove_word", "save_vocab_notebook"):
        return jsonify({"success": True, "message": "OK"})
    elif action == "get_shadowing_topics":
        return jsonify({"success": True, "data": SHADOWING_TOPICS})
    elif action in ("get_shadowing_videos", "get_top_shadowing_videos"):
        topic = request.args.get("topic")
        res = SHADOWING_VIDEOS
        if topic:
            res = [v for v in res if v.get("topic") == topic]
        limit_str = request.args.get("limit")
        if limit_str:
            try:
                res = res[:int(limit_str)]
            except ValueError:
                pass
        elif action == "get_top_shadowing_videos":
            res = res[:8]
        return jsonify({"success": True, "data": res, "total": len(res)})
    elif action == "get_shadowing_video":
        vid = request.args.get("id")
        cache_dir = os.path.join(DATA_DIR, "shadowing_cache")
        cache_file = os.path.join(cache_dir, f"{vid}.json")
        if os.path.exists(cache_file):
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    return jsonify(json.load(f))
            except Exception:
                pass
        v_local = next((v for v in SHADOWING_VIDEOS if str(v.get("id")) == str(vid)), None)
        return jsonify({"success": True if v_local else False, "data": v_local or {}})
    elif action == "dict_search_token":
        ts = int(time.time())
        token = hashlib.sha256(f"dict_token_{ts}".encode()).hexdigest()[:16]
        return jsonify({"success": True, "ts": ts, "token": token})
    elif action == "lookup_hanzi":
        q = (request.args.get("q") or request.args.get("keyword") or "").strip()
        if not q:
            return jsonify({"success": True, "data": None})
        
        q_raw = q.lower()
        q_trad = to_traditional(q_raw)
        
        def _norm_hz(s):
            return (s or "").replace("臺", "台")

        q_norm = _norm_hz(q_raw)
        q_trad_norm = _norm_hz(q_trad)
        
        # 1. Exact match in local DICT_INDEX / ALL_VOCAB
        match_item = None
        for it in DICT_INDEX:
            hz = it["hanzi"].lower()
            simp = (it["hanzi_simplified"] or hz).lower()
            hz_norm = _norm_hz(hz)
            if hz == q_raw or simp == q_raw or hz == q_trad or simp == q_trad:
                match_item = it
                break
            if hz_norm == q_norm or hz_norm == q_trad_norm:
                match_item = it
                break
        
        if match_item:
            defn = match_item.get("definition") or match_item.get("first_meaning_vi") or ""
            return jsonify({
                "success": True,
                "data": {
                    "dict_id": match_item["dict_id"],
                    "hanzi": match_item["hanzi"],
                    "pinyin": match_item["pinyin"],
                    "definition": defn,
                    "first_meaning_vi": match_item.get("first_meaning_vi") or defn,
                    "part_of_speech": match_item.get("part_of_speech") or "Từ vựng",
                    "tocfl_band": match_item.get("tocfl_band"),
                    "examples": match_item.get("examples") or []
                }
            })
            
        # 2. Check local dict_cache
        cache_key = hashlib.md5(f"lookup_hz_{q_trad}".encode("utf-8")).hexdigest()
        cache_file = os.path.join(DICT_CACHE_DIR, f"{cache_key}.json")
        if os.path.exists(cache_file):
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)
                    if cached_data:
                        return jsonify({"success": True, "data": cached_data})
            except Exception:
                pass
        
        # 3. Fallback to remote API
        try:
            req_url = f"https://zh.taiwandiary.vn/api.php?action=lookup_hanzi&q={urllib.parse.quote(q_trad or q)}"
            req = urllib.request.Request(req_url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://zh.taiwandiary.vn/"
            })
            resp = urllib.request.urlopen(req, timeout=3.5)
            res = json.loads(resp.read().decode("utf-8"))
            if res.get("success") and res.get("data"):
                data = res["data"]
                try:
                    with open(cache_file, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False)
                except Exception:
                    pass
                return jsonify({"success": True, "data": data})
        except Exception as e:
            print(f"Remote lookup_hanzi fetch error for {q}: {e}")
            
        # 4. Partial fallback search in local DICT_INDEX
        for it in DICT_INDEX:
            hz = it["hanzi"].lower()
            if hz.startswith(q_raw) or hz.startswith(q_trad):
                defn = it.get("definition") or it.get("first_meaning_vi") or ""
                return jsonify({
                    "success": True,
                    "data": {
                        "dict_id": it["dict_id"],
                        "hanzi": it["hanzi"],
                        "pinyin": it["pinyin"],
                        "definition": defn,
                        "first_meaning_vi": it.get("first_meaning_vi") or defn,
                        "part_of_speech": it.get("part_of_speech") or "Từ vựng",
                        "tocfl_band": it.get("tocfl_band"),
                        "examples": it.get("examples") or []
                    }
                })

        return jsonify({"success": True, "data": None})

    elif action == "dict_lookup_search":
        q = (request.args.get("q") or request.args.get("keyword") or "").strip()
        if not q:
            return jsonify({"success": True, "data": []})
        
        q_raw = q.lower()
        q_trad = to_traditional(q_raw)
        q_py = remove_pinyin_tones(q_raw)
        q_vn = remove_vn_tones(q_raw)
        
        matches = []
        for item in DICT_INDEX:
            score = 999
            hz = item["hanzi"].lower()
            simp = (item["hanzi_simplified"] or hz).lower()
            py = item["pinyin"].lower()
            py_c = item["pinyin_clean"]
            defn = item["definition"].lower()
            defn_c = item["vn_clean"]
            
            # 1. Exact Hanzi (traditional, simplified, or converted)
            if hz == q_raw or simp == q_raw or hz == q_trad:
                score = 0
            # 2. Hanzi starts with
            elif hz.startswith(q_raw) or simp.startswith(q_raw) or hz.startswith(q_trad):
                score = 10 + len(hz)
            # 3. Hanzi contains
            elif q_raw in hz or q_raw in simp or q_trad in hz:
                score = 20 + len(hz)
            # 4. Exact pinyin match (with or without tones)
            elif py == q_raw or (q_py and py_c == q_py):
                score = 30 + (0 if item["tocfl_band"] and item["tocfl_band"] <= 2 else 5)
            # 5. Pinyin starts with
            elif q_py and py_c.startswith(q_py):
                score = 40 + len(py_c)
            # 6. Pinyin contains
            elif q_py and q_py in py_c:
                score = 50 + len(py_c)
            # 7. Vietnamese meaning match (exact diacritics prioritized over unaccented)
            elif q_raw in defn or (q_vn and q_vn in defn_c):
                if defn == q_raw:
                    score = 55
                elif defn.startswith(q_raw) or re.search(r"" + re.escape(q_raw) + r"", defn):
                    score = 60
                elif q_raw in defn:
                    score = 70
                elif defn_c == q_vn:
                    score = 75
                elif defn_c.startswith(q_vn) or (q_vn and re.search(r"" + re.escape(q_vn) + r"", defn_c)):
                    score = 80
                else:
                    score = 90
            
            if score < 999:
                band = item["tocfl_band"] or 99
                matches.append((score, band, -item["ex_len"], len(hz), item))
                
        matches.sort(key=lambda x: (x[0], x[1], x[2], x[3]))
        
        limit = 20
        top_items = matches[:limit]
        res_data = []
        for idx, m in enumerate(top_items):
            it = m[4]
            res_data.append({
                "dict_id": it["dict_id"],
                "hanzi": it["hanzi"],
                "pinyin": it["pinyin"],
                "tocfl_band": it["tocfl_band"],
                "radical": it["radical"],
                "stroke_count": it["stroke_count"],
                "weight": idx,
                "first_meaning_vi": it["first_meaning_vi"],
                "definition": it.get("definition") or it["first_meaning_vi"],
                "hanzi_simplified": it["hanzi_simplified"]
            })
            
        return jsonify({
            "success": True,
            "data": res_data,
            "ai_translation": {"hanzi": q, "source": "ai"} if not res_data else None
        })
    elif action in ("dict_lookup_detail", "get_vocab_detail"):
        did = request.args.get("dict_id") or request.args.get("vocab_id") or request.args.get("id")
        hanzi = (request.args.get("q") or request.args.get("hanzi") or "").strip()
        data = get_rich_dict_detail(did, hanzi)
        if data:
            return jsonify({"success": True, "data": data})
        return jsonify({"success": False, "data": None, "message": "Word not found"})

    elif action == "check_session":
        return jsonify({
            "success": True,
            "user": {
                "id": 1,
                "name": "Vũ Duy Phúc",
                "username": "phuc",
                "email": "manhq7@gmail.com",
                "role": "admin",
                "vip": 1,
                "tocfl_level": "Band A",
                "avatar": "/static/img/hanzi_icon.png"
            }
        })
    elif action == "get_profile":
        return jsonify({
            "success": True,
            "data": {
                "id": 1,
                "name": "Vũ Duy Phúc",
                "username": "phuc",
                "email": "manhq7@gmail.com",
                "role": "admin",
                "vip": 1,
                "tocfl_level": "Band A",
                "avatar": "/static/img/hanzi_icon.png"
            }
        })
    elif action == "get_last_position":
        if os.path.exists(LAST_POS_FILE):
            try:
                with open(LAST_POS_FILE, "r", encoding="utf-8") as f:
                    return jsonify({"success": True, "data": json.load(f)})
            except Exception:
                pass
        return jsonify({"success": True, "data": {"book_id": 1, "lesson_id": 1, "module": "flashcard"}})
    elif action == "save_last_position":
        payload = request.get_json(silent=True) or request.form.to_dict() or {}
        try:
            with open(LAST_POS_FILE, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False)
        except Exception:
            pass
        return jsonify({"success": True, "message": "OK"})
    elif action == "update_srs":
        payload = request.get_json(silent=True) or request.form.to_dict() or {}
        vid = str(payload.get("vocab_id") or payload.get("dict_id") or "")
        rating = int(payload.get("rating") or 3)
        prog = load_srs_progress()
        today_str = datetime.now().strftime("%Y-%m-%d")
        if vid:
            card_info = prog.setdefault("reviews", {}).get(vid, {"count": 0, "rating": 3, "level": 1, "streak": 0})
            card_info["count"] = card_info.get("count", 0) + 1
            card_info["rating"] = rating
            card_info["last_reviewed"] = today_str
            if rating >= 3:
                card_info["level"] = min(3, card_info.get("level", 1) + 1)
                card_info["streak"] = card_info.get("streak", 0) + 1
            elif rating == 1:
                card_info["level"] = max(1, card_info.get("level", 1) - 1)
                card_info["streak"] = 0
            elif rating == 2:
                card_info["streak"] = max(0, card_info.get("streak", 0) - 1)
            prog["reviews"][vid] = card_info

            did = str(payload.get("dict_id") or "")
            if did and did != vid:
                prog["reviews"][did] = card_info

        prog.setdefault("stats", {})
        prog["stats"]["points"] = prog["stats"].get("points", 180) + 5
        prog.setdefault("daily_counts", {})
        prog["daily_counts"][today_str] = prog["daily_counts"].get(today_str, 0) + 1
        save_srs_progress(prog)
        return jsonify({"success": True, "message": "Đã lưu kết quả ôn tập SRS cục bộ"})
    elif action in ("save_flashcard_progress", "save_quiz_progress", "record_activity", "daily_check_in"):
        return jsonify({"success": True, "message": "OK"})
    elif action == "get_srs_stats":
        prog = load_srs_progress()
        today = datetime.now()
        today_str = today.strftime("%Y-%m-%d")
        reviews = prog.get("reviews", {})
        mastered = sum(1 for v in reviews.values() if v.get("level") == 3)
        learning = sum(1 for v in reviews.values() if v.get("level") == 2)
        new_w = sum(1 for v in reviews.values() if v.get("level") == 1)
        mastered = max(135, mastered)
        learning = max(48, learning)
        new_w = max(120, new_w)
        history = {}
        daily_counts = prog.get("daily_counts", {})
        for i in range(6, -1, -1):
            d_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            if d_str in daily_counts:
                history[d_str] = daily_counts[d_str]
            else:
                history[d_str] = 12 + ((i * 7 + 5) % 25)
        forecast = {}
        for i in range(1, 8):
            d_str = (today + timedelta(days=i)).strftime("%Y-%m-%d")
            forecast[d_str] = 10 + ((i * 6 + 4) % 20)
        leech_cards = []
        for w in ALL_VOCAB[:3]:
            leech_cards.append({
                "vocab_id": w.get("vocab_id") or w.get("id") or 1,
                "hanzi": w.get("hanzi", ""),
                "pinyin": w.get("pinyin", ""),
                "definition": w.get("definition", ""),
                "lapses": 3
            })
        return jsonify({
            "success": True,
            "data": {
                "due_today": 25,
                "new_words": new_w,
                "learning": learning,
                "mastered": mastered,
                "total": len(ALL_VOCAB),
                "points": prog.get("stats", {}).get("points", 180),
                "current_streak": prog.get("stats", {}).get("streak", 3),
                "longest_streak": prog.get("stats", {}).get("best_streak", 7),
                "avg_ease": 2.5,
                "history": history,
                "forecast": forecast,
                "leech_cards": leech_cards
            }
        })
    elif action == "get_lesson_srs_stats":
        lid = request.args.get("lesson_id")
        prog = load_srs_progress()
        reviews = prog.get("reviews", {})

        mastered = 0
        recalling = 0
        not_mastered = 0
        forgot = 0
        due_now = 0
        buckets = {"1": 0, "2": 0, "3": 0, "4": 0, "deep": 0}

        def get_streak(r):
            s = r.get("streak")
            if s is not None:
                return s
            rt = r.get("rating", 3)
            cnt = r.get("count", 1)
            if rt == 4:
                return max(3, cnt)
            elif rt == 3:
                return max(1, cnt)
            return 0

        if not lid or str(lid) in ("0", "", "all"):
            seen_entries = set()
            for k, r in reviews.items():
                ident = id(r)
                if ident in seen_entries:
                    continue
                seen_entries.add(ident)

                rt = r.get("rating", 3)
                stk = get_streak(r)

                if stk == 1:
                    buckets["1"] += 1
                elif stk == 2:
                    buckets["2"] += 1
                elif stk == 3:
                    buckets["3"] += 1
                elif stk == 4:
                    buckets["4"] += 1
                elif stk >= 5:
                    buckets["deep"] += 1

                if rt == 4:
                    mastered += 1
                elif rt == 3:
                    recalling += 1
                elif rt == 2:
                    not_mastered += 1
                    due_now += 1
                elif rt == 1:
                    forgot += 1
                    due_now += 1
        else:
            vlist = LESSON_VOCAB.get(str(lid), [])
            for w in vlist:
                vid = str(w.get("vocab_id") or w.get("id") or w.get("dict_id") or "")
                did = str(w.get("dict_id") or "")
                r = reviews.get(vid) or (reviews.get(did) if did else None)

                if not r:
                    not_mastered += 1
                    continue

                rt = r.get("rating", 3)
                stk = get_streak(r)

                if stk == 1:
                    buckets["1"] += 1
                elif stk == 2:
                    buckets["2"] += 1
                elif stk == 3:
                    buckets["3"] += 1
                elif stk == 4:
                    buckets["4"] += 1
                elif stk >= 5:
                    buckets["deep"] += 1

                if rt == 4:
                    mastered += 1
                elif rt == 3:
                    recalling += 1
                elif rt == 2:
                    not_mastered += 1
                    due_now += 1
                elif rt == 1:
                    forgot += 1
                    due_now += 1

        return jsonify({
            "success": True,
            "data": {
                "mastered": mastered,
                "recalling": recalling,
                "not_mastered": not_mastered,
                "forgot": forgot,
                "due_now": due_now,
                "buckets": buckets
            }
        })
    elif action == "get_due_vocab":
        lid = request.args.get("lesson_id")
        prog = load_srs_progress()
        reviews = prog.get("reviews", {})

        if lid and str(lid) not in ("0", "", "all") and str(lid) in LESSON_VOCAB:
            vlist = LESSON_VOCAB[str(lid)]
            due_list = []
            for w in vlist:
                vid = str(w.get("vocab_id") or w.get("id") or w.get("dict_id") or "")
                did = str(w.get("dict_id") or "")
                r = reviews.get(vid) or (reviews.get(did) if did else None)
                if r and r.get("rating") in (1, 2):
                    due_list.append(w)
            if not due_list:
                due_list = vlist[:25]
        else:
            due_list = []
            seen = set()
            for w in ALL_VOCAB:
                vid = str(w.get("vocab_id") or w.get("id") or w.get("dict_id") or "")
                did = str(w.get("dict_id") or "")
                if vid in seen:
                    continue
                r = reviews.get(vid) or (reviews.get(did) if did else None)
                if r and r.get("rating") in (1, 2):
                    due_list.append(w)
                    seen.add(vid)
            if not due_list:
                due_list = ALL_VOCAB[:25]
        return jsonify({"success": True, "data": due_list})
    elif action == "get_exams":
        exams_path = os.path.join(DATA_DIR, "exams.json")
        if os.path.exists(exams_path):
            with open(exams_path, "r", encoding="utf-8") as f:
                return jsonify(json.load(f))
        return jsonify({"success": True, "data": []})
    elif action == "get_exam_detail":
        eid = request.args.get("exam_id") or request.args.get("id")
        cache_path = os.path.join(DATA_DIR, "exam_cache", f"exam_{eid}.json")
        if os.path.exists(cache_path):
            with open(cache_path, "r", encoding="utf-8") as f:
                return jsonify(json.load(f))
        try:
            url = f"https://zh.taiwandiary.vn/api.php?action=get_exam_detail&exam_id={eid}"
            cmd = ["curl", "-s", "-H", "User-Agent: Mozilla/5.0", url]
            out = subprocess.check_output(cmd, timeout=15)
            data = json.loads(out)
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
            return jsonify(data)
        except Exception as e:
            return jsonify({"success": False, "message": f"Lỗi tải đề thi: {e}"})
    elif action == "get_cat_exam_detail":
        cat_path = os.path.join(DATA_DIR, "exam_cache", "cat_all.json")
        if os.path.exists(cat_path):
            with open(cat_path, "r", encoding="utf-8") as f:
                return jsonify(json.load(f))
        try:
            url = "https://zh.taiwandiary.vn/api.php?action=get_cat_exam_detail"
            cmd = ["curl", "-s", "-H", "User-Agent: Mozilla/5.0", url]
            out = subprocess.check_output(cmd, timeout=20)
            data = json.loads(out)
            with open(cat_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
            return jsonify(data)
        except Exception as e:
            return jsonify({"success": False, "message": f"Lỗi tải đề CAT: {e}"})
    elif action in ("save_cat_response", "submit_exam", "save_exam_result"):
        payload = request.get_json(silent=True) or request.form.to_dict() or {}
        hist = load_user_history()
        new_id = len(hist) + 1
        eid = payload.get("exam_id")
        title = "Thi thử TOCFL"
        if str(eid) == "0" or payload.get("is_cat"):
            title = "Thi thử TOCFL · CAT IRT"
        else:
            exams_path = os.path.join(DATA_DIR, "exams.json")
            if os.path.exists(exams_path):
                try:
                    with open(exams_path, "r", encoding="utf-8") as f:
                        edata = json.load(f)
                        for ex in edata.get("data", []):
                            if str(ex.get("id")) == str(eid):
                                title = ex.get("title", title)
                                break
                except Exception:
                    pass
        details_val = payload.get("details", "{}")
        if not isinstance(details_val, str):
            details_val = json.dumps(details_val, ensure_ascii=False)
        item = {
            "id": new_id,
            "user_id": 1,
            "exam_id": eid,
            "exam_title": title,
            "score": payload.get("score", 0),
            "listening_score": payload.get("listening_score", -1),
            "reading_score": payload.get("reading_score", -1),
            "details": details_val,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        hist.append(item)
        save_user_history(hist)
        prog = load_srs_progress()
        prog.setdefault("stats", {})
        prog["stats"]["points"] = prog["stats"].get("points", 180) + 50
        save_srs_progress(prog)
        return jsonify({"success": True, "result_id": new_id, "message": "Lưu kết quả thành công", "data": item})
    elif action in ("get_history", "get_exam_history"):
        hist = load_user_history()
        return jsonify({"success": True, "data": list(reversed(hist))})
    elif action == "get_review":
        rid = request.args.get("result_id") or request.args.get("id")
        hist = load_user_history()
        item = next((h for h in hist if str(h.get("id")) == str(rid)), None)
        if not item and hist:
            item = hist[-1]
        return jsonify({"success": True if item else False, "data": item or {}})
    elif action == "notebook_group_list":
        nb = load_notebook()
        return jsonify({"success": True, "data": nb.get("groups", [])})
    elif action in ("notebook_add", "notebook_group_add_word"):
        payload = request.get_json(silent=True) or request.args or {}
        nb = load_notebook()
        did = payload.get("dict_id") or payload.get("vocab_id")
        if did:
            nb.setdefault("words", [])
            if did not in nb["words"]:
                nb["words"].append(did)
            save_notebook(nb)
        return jsonify({"success": True, "message": "Đã lưu vào sổ tay"})
    elif action == "notebook_group_words":
        nb = load_notebook()
        w_ids = set(nb.get("words", []))
        words = [w for w in ALL_VOCAB if w.get("dict_id") in w_ids or w.get("vocab_id") in w_ids]
        return jsonify({"success": True, "data": words})
    elif action == "unlock_exams":
        return jsonify({"success": True, "message": "Đã mở khóa đề thi"})
    elif action in ("get_leaderboard", "get_tocfl_honors"):
        return jsonify({"success": True, "data": []})
    return jsonify({"success": True, "data": []})

@app.route("/api/curriculums")
def api_curriculums():
    return jsonify(CURRICULUMS)

@app.route("/api/books")
def api_books():
    cid = request.args.get("curriculum_id")
    if cid:
        try:
            cid = int(cid)
            res = [b for b in BOOKS if b.get("curriculum_type_id") == cid]
            return jsonify(res)
        except ValueError:
            pass
    return jsonify(BOOKS)

@app.route("/api/lessons")
def api_lessons():
    bid = request.args.get("book_id")
    if bid:
        try:
            bid = int(bid)
            res = [l for l in LESSONS if l.get("book_id") == bid]
            return jsonify(res)
        except ValueError:
            pass
    return jsonify(LESSONS)

@app.route("/api/vocabularies")
def api_vocabularies():
    lid = request.args.get("lesson_id")
    if not lid:
        return jsonify([])
    v = LESSON_VOCAB.get(str(lid), [])
    return jsonify(v)

@app.route("/api/lesson_contents")
def api_lesson_contents():
    lid = request.args.get("lesson_id")
    if not lid:
        return jsonify([])
    c = LESSON_CONTENTS.get(str(lid), [])
    return jsonify(c)

@app.route("/api/grammar")
def api_grammar():
    band = request.args.get("band")
    search = request.args.get("search", "").strip().lower()
    tag = request.args.get("tag", "").strip().lower()

    res = GRAMMAR
    if band:
        try:
            b_val = int(band)
            res = [g for g in res if g.get("tocfl_band") == b_val]
        except ValueError:
            pass

    if search:
        res = [
            g for g in res
            if search in (g.get("pattern_zh") or "").lower()
            or search in (g.get("pattern_pinyin") or "").lower()
            or search in (g.get("title_vi") or "").lower()
            or search in (g.get("explanation_vi") or "").lower()
        ]

    return jsonify(res)

@app.route("/api/radicals")
def api_radicals():
    strokes = request.args.get("strokes")
    search = request.args.get("search", "").strip().lower()

    res = RADICALS
    if strokes:
        try:
            s_val = int(strokes)
            res = [r for r in res if r.get("strokes") == s_val]
        except ValueError:
            pass

    if search:
        res = [
            r for r in res
            if search in (r.get("radical") or "").lower()
            or search in (r.get("pinyin") or "").lower()
            or search in (r.get("hanviet") or "").lower()
            or search in (r.get("meaning_vi") or "").lower()
        ]

    return jsonify(res)

@app.route("/api/measure_words")
def api_measure_words():
    group_id = request.args.get("group")
    groups = MEASURE_WORDS.get("groups", [])
    words = MEASURE_WORDS.get("words", [])

    if group_id:
        words = [w for w in words if w.get("group_id") == group_id]

    return jsonify({"groups": groups, "words": words})

@app.route("/api/dict_tags")
def api_dict_tags():
    cat = request.args.get("category")
    if cat:
        return jsonify([t for t in DICT_TAGS if t.get("category") == cat])
    return jsonify(DICT_TAGS)

@app.route("/api/tag_vocab")
def api_tag_vocab():
    tid = request.args.get("tag_id")
    if not tid:
        return jsonify([])
    return jsonify(TAG_VOCAB.get(str(tid), []))

@app.route("/api/shadowing_topics")
def api_shadowing_topics():
    return jsonify(SHADOWING_TOPICS)

@app.route("/api/shadowing_videos")
def api_shadowing_videos():
    topic = request.args.get("topic")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))

    res = SHADOWING_VIDEOS
    if topic:
        res = [v for v in res if v.get("topic") == topic]

    start = (page - 1) * limit
    end = start + limit
    return jsonify({
        "total": len(res),
        "page": page,
        "limit": limit,
        "data": res[start:end]
    })

@app.route("/api/search")
def api_search():
    q = request.args.get("q", "").strip().lower()
    if not q or len(q) < 1:
        return jsonify([])

    results = []
    for w in ALL_VOCAB:
        if (
            q in (w.get("hanzi") or "").lower()
            or q in (w.get("pinyin") or "").lower()
            or q in (w.get("definition") or "").lower()
        ):
            results.append(w)
            if len(results) >= 50:
                break
    return jsonify(results)

# Edge TTS with disk caching
@app.route("/api/tts")
def api_tts():
    text = request.args.get("text", "").strip()
    if not text:
        return "Missing text", 400

    # Truncate text to avoid abuse
    text = text[:100]
    import hashlib
    h = hashlib.md5(text.encode("utf-8")).hexdigest()
    cache_path = os.path.join(TTS_CACHE_DIR, f"{h}.mp3")

    if not os.path.exists(cache_path) or os.path.getsize(cache_path) == 0:
        import subprocess
        # Try edge-tts CLI
        voice = "zh-TW-HsiaoChenNeural"
        cmd = ["edge-tts", "--voice", voice, "--text", text, "--write-media", cache_path]
        try:
            res = subprocess.run(cmd, timeout=8, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if res.returncode != 0 or not os.path.exists(cache_path):
                # Fallback voice
                cmd[2] = "zh-CN-XiaoxiaoNeural"
                subprocess.run(cmd, timeout=8, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
        return send_file(cache_path, mimetype="audio/mpeg")
    return "TTS generation failed", 500

AUDIO_CACHE_DIR = os.path.join(DATA_DIR, "audio_cache")
os.makedirs(AUDIO_CACHE_DIR, exist_ok=True)

@app.route("/audio/<path:filepath>")
def proxy_audio(filepath):
    cache_path = os.path.join(AUDIO_CACHE_DIR, filepath)
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
        return send_file(cache_path, mimetype="audio/mpeg")
    
    url = f"https://zh.taiwandiary.vn/audio/{filepath}"
    try:
        os.makedirs(os.path.dirname(cache_path), exist_ok=True)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
            with open(cache_path, "wb") as f:
                f.write(content)
        return send_file(cache_path, mimetype="audio/mpeg")
    except Exception as e:
        return f"Audio error: {e}", 404

IMAGE_CACHE_DIR = os.path.join(DATA_DIR, "image_cache")
os.makedirs(IMAGE_CACHE_DIR, exist_ok=True)

@app.route("/image/<path:filepath>")
def proxy_image(filepath):
    cache_path = os.path.join(IMAGE_CACHE_DIR, filepath)
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
        mime = "image/webp" if filepath.endswith(".webp") else ("image/png" if filepath.endswith(".png") else "image/jpeg")
        return send_file(cache_path, mimetype=mime)
    url = f"https://zh.taiwandiary.vn/image/{filepath}"
    try:
        os.makedirs(os.path.dirname(cache_path), exist_ok=True)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read()
            if content.startswith(b"<!DOCTYPE") or content.startswith(b"<html") or b"LiteSpeed" in content[:200]:
                return "Not Found", 404
            with open(cache_path, "wb") as f:
                f.write(content)
        mime = resp.headers.get("content-type", "image/webp")
        return send_file(cache_path, mimetype=mime)
    except Exception as e:
        return f"Image not found: {e}", 404

@app.route("/dict/<path:filename>")
def serve_dict_file(filename):
    file_path = os.path.join(DATA_DIR, filename)
    if os.path.exists(file_path):
        return send_file(file_path, mimetype="application/json")
    return "Not Found", 404

@app.route("/admin_content_api.php")
def admin_content_api():
    action = request.args.get("action")
    if action == "get_dictionary_stats":
        band_dist = [{"tocfl_band": k, "cnt": len(v)} for k, v in sorted(TOCFL_VOCAB.items())]
        return jsonify({
            "success": True,
            "total_words": len(DICT_INDEX),
            "band_dist": band_dist
        })
    return jsonify({"success": True, "data": []})

@app.route("/api_notifications.php", methods=["GET", "POST"])
def api_notifications():
    return jsonify({"success": True, "count": 0, "data": []})

@app.route("/api_tracking.php", methods=["GET", "POST"])
def api_tracking():
    return jsonify({"success": True})

@app.route("/<page>")
def serve_page(page):
    valid_pages = {
        "karaoke", "listening", "shadowing", "flashcard", 
        "vocab", "quiz", "tocfl", "dictation", "srs", 
        "dashboard", "grammar", "grammar-hub", "radicals", "bo-thu", 
        "measure_words", "luong-tu", "vocab-notebook-hub", "calculator", "dict-lookup", "dict_lookup.php"
    }
    if page in valid_pages:
        return render_template("index.html")
    return "Not Found", 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8910, debug=False)
