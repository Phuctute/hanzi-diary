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
import gzip
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template, send_from_directory, send_file, Response, redirect

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
GRAMMAR_TAGS = load_json("grammar_tags.json", {})
GRAMMAR_BY_ID = {g.get("grammar_id"): g for g in GRAMMAR}
RADICALS = load_json("radicals.json", [])
MEASURE_WORDS = load_json("measure_words.json", {"groups": [], "words": []})
DICT_TAGS = load_json("dict_tags.json", [])
TAG_VOCAB = load_json("tag_vocab.json", {})
SHADOWING_TOPICS = load_json("shadowing_topics.json", [])
SHADOWING_VIDEOS = load_json("shadowing_videos.json", [])
CN_VI_DICT = load_json("cn_vi.json", {})
HANVIET_DICT = load_json("hanviet.json", {})
TRANS_CACHE_DIR = os.path.join(DATA_DIR, "trans_cache")
os.makedirs(TRANS_CACHE_DIR, exist_ok=True)
TRANSLATE_MEM_CACHE = {}
print(f"Loaded: {len(CURRICULUMS)} curriculums, {len(BOOKS)} books, {len(LESSONS)} lessons, {len(GRAMMAR)} grammar points, {len(RADICALS)} radicals, {len(CN_VI_DICT)} cn_vi words.")

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
ALL_VOCAB_BY_ID = {}
for w in ALL_VOCAB:
    vid = str(w.get("vocab_id") or w.get("id") or w.get("dict_id") or "")
    if vid and vid not in ALL_VOCAB_BY_ID:
        ALL_VOCAB_BY_ID[vid] = w
    did = str(w.get("dict_id") or "")
    if did and did not in ALL_VOCAB_BY_ID:
        ALL_VOCAB_BY_ID[did] = w
print(f"Loaded {len(CHAR_META)} char metadata, {len(RELATIONS)} relation entries, {len(VOCAB_BY_HANZI)} unique vocab words, {len(ALL_VOCAB_BY_ID)} indexed by ID.")

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

_od_s2tw = None
_od_tw2s = None
_libopencc = None
for _libname in ["libopencc.so.1.1", "/usr/lib/x86_64-linux-gnu/libopencc.so.1.1", "libopencc.so.2", "libopencc.so"]:
    try:
        import ctypes
        _cand = ctypes.cdll.LoadLibrary(_libname)
        _cand.opencc_open.argtypes = [ctypes.c_char_p]
        _cand.opencc_open.restype = ctypes.c_void_p
        _cand.opencc_convert_utf8.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_size_t]
        _cand.opencc_convert_utf8.restype = ctypes.c_void_p
        _cand.opencc_convert_utf8_free.argtypes = [ctypes.c_void_p]
        _cand.opencc_convert_utf8_free.restype = None
        _cand.opencc_close.argtypes = [ctypes.c_void_p]
        _cand.opencc_close.restype = ctypes.c_int
        _s2tw = _cand.opencc_open(b"s2tw.json")
        _tw2s = _cand.opencc_open(b"tw2s.json")
        if _s2tw and _tw2s:
            _libopencc = _cand
            _od_s2tw = _s2tw
            _od_tw2s = _tw2s
            print(f"OpenCC library initialized via {_libname}")
            break
    except Exception:
        continue

def to_simplified(s):
    if not s: return ""
    if _libopencc and _od_tw2s:
        try:
            import ctypes
            b = s.encode("utf-8")
            p = _libopencc.opencc_convert_utf8(_od_tw2s, b, len(b))
            r = ctypes.cast(p, ctypes.c_char_p).value.decode("utf-8")
            _libopencc.opencc_convert_utf8_free(p)
            return r
        except Exception:
            pass
    return "".join(TS_MAP.get(c, c) for c in s)

def to_traditional(s):
    if not s: return ""
    if _libopencc and _od_s2tw:
        try:
            import ctypes
            b = s.encode("utf-8")
            p = _libopencc.opencc_convert_utf8(_od_s2tw, b, len(b))
            r = ctypes.cast(p, ctypes.c_char_p).value.decode("utf-8")
            _libopencc.opencc_convert_utf8_free(p)
            return r
        except Exception:
            pass
    return "".join(ST_MAP.get(c, c) for c in s)

# Normalize ALL_VOCAB entries to ensure Traditional Chinese hanzi + Simplified variant
for w in ALL_VOCAB:
    raw_hz = (w.get("hanzi") or "").strip()
    if "/" in raw_hz:
        parts = [p.strip() for p in raw_hz.split("/") if p.strip()]
        trad_parts = [to_traditional(p) or p for p in parts]
        if len(set(trad_parts)) == len(parts):
            w["hanzi"] = "/".join(trad_parts)
        else:
            w["hanzi"] = raw_hz
        simp_parts = [to_simplified(p) or p for p in parts]
        simp = "/".join(simp_parts)
        if simp and simp != w["hanzi"]:
            w["hanzi_simplified"] = simp
        else:
            w["hanzi_simplified"] = None
    else:
        trad = to_traditional(raw_hz)
        if trad:
            w["hanzi"] = trad
        simp = to_simplified(trad or raw_hz)
        if simp and simp != (trad or raw_hz):
            w["hanzi_simplified"] = simp
        else:
            w["hanzi_simplified"] = None

VOCAB_BY_HANZI.clear()
for w in ALL_VOCAB:
    raw_hz = (w.get("hanzi") or "").strip()
    for part in raw_hz.split("/"):
        hz = part.strip()
        if hz and hz not in VOCAB_BY_HANZI:
            VOCAB_BY_HANZI[hz] = w

VN_DIACRITICS_RE = re.compile(r'[ăâđêôơưàảãạằẳẵặầẩẫậèẻẽẹềểễệìỉĩịòỏõọồổỗộờởỡợùủũụừửữựỳỷỹỵ]', re.IGNORECASE)

def norm_hz(s):
    return (s or "").replace("臺", "台")

def remove_pinyin_tones(p):
    if not p: return ""
    p = p.lower().replace("ü", "v").replace("u:", "v")
    p = re.sub(r"[1-5]", "", p)
    p = unicodedata.normalize("NFD", p)
    p = "".join(c for c in p if unicodedata.category(c) != "Mn")
    return p.replace(" ", "").replace("-", "").replace("'", "")

def clean_pinyin_search(p):
    return remove_pinyin_tones(p)

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
    
    hz_vars = [v.strip().lower() for v in hz.split("/") if v.strip()]
    item = {
        "dict_id": did,
        "vocab_id": w.get("vocab_id") or did,
        "hanzi": hz,
        "hanzi_simplified": simp if simp != hz else None,
        "variants": hz_vars,
        "simp_variants": [to_simplified(v).lower() for v in hz_vars],
        "norm_variants": [norm_hz(v).lower() for v in hz_vars],
        "pinyin": py,
        "pinyin_clean": clean_pinyin_search(py),
        "pinyin_syllables": [clean_pinyin_search(s) for s in re.split(r'[\s\-]+', py) if s],
        "definition": defn,
        "first_meaning_vi": first_vi,
        "first_meaning_vi_clean": remove_vn_tones(first_vi).lower(),
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

def translate_chinese_to_vi(text):
    text = (text or "").strip()
    if not text:
        return None
    if text in TRANSLATE_MEM_CACHE:
        return TRANSLATE_MEM_CACHE[text]
    cache_key = hashlib.md5(text.encode("utf-8")).hexdigest()
    cache_file = os.path.join(TRANS_CACHE_DIR, f"{cache_key}.json")
    if os.path.exists(cache_file):
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                res = json.load(f)
                if res and isinstance(res, dict) and res.get("vi"):
                    TRANSLATE_MEM_CACHE[text] = res
                    return res
        except Exception:
            pass

    clean_text = re.sub(r'[\s\r\n]+', '', text)
    trad_text = to_traditional(clean_text)
    simp_text = to_simplified(clean_text)

    # 1. Local dictionary lookup for short words (<= 6 chars)
    has_sentence_punct = bool(re.search(r'[，。！？；：、“”‘’（）\n\r,!?;:.]', text))
    if len(clean_text) <= 6 and not has_sentence_punct:
        match_item = None
        for it in DICT_INDEX:
            hz = it["hanzi"]
            simp = it.get("hanzi_simplified") or hz
            if hz == clean_text or hz == trad_text or simp == simp_text or simp == clean_text:
                match_item = it
                break
        if match_item:
            res = {
                "q": text,
                "vi": match_item.get("definition") or match_item.get("first_meaning_vi") or "",
                "pinyin": match_item.get("pinyin") or "",
                "tocfl_band": match_item.get("tocfl_band"),
                "part_of_speech": match_item.get("part_of_speech") or "Từ vựng",
                "source": "dict_lesson"
            }
            TRANSLATE_MEM_CACHE[text] = res
            try:
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(res, f, ensure_ascii=False)
            except Exception:
                pass
            return res

        d_item = CN_VI_DICT.get(clean_text) or CN_VI_DICT.get(trad_text) or CN_VI_DICT.get(simp_text)
        if d_item and isinstance(d_item, dict) and d_item.get("vi"):
            res = {
                "q": text,
                "vi": d_item.get("vi"),
                "pinyin": d_item.get("py") or "",
                "tocfl_band": None,
                "part_of_speech": "Từ vựng",
                "source": "dict_cn_vi"
            }
            TRANSLATE_MEM_CACHE[text] = res
            try:
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(res, f, ensure_ascii=False)
            except Exception:
                pass
            return res

    # 2. Machine translation for phrases, sentences, or unlisted terms
    translated_vi = ""
    trans_source = ""

    # Primary: Google clients5 (no rate limit / 429)
    try:
        url = "https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=vi&q=" + urllib.parse.quote(text)
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        })
        with urllib.request.urlopen(req, timeout=3.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if isinstance(data, list) and len(data) > 0:
                first = data[0]
                if isinstance(first, list) and len(first) > 0 and isinstance(first[0], str):
                    translated_vi = "".join(seg[0] for seg in data if isinstance(seg, list) and seg and seg[0])
                elif isinstance(first, str):
                    translated_vi = " ".join(data)
            elif isinstance(data, str):
                translated_vi = data
            if translated_vi:
                trans_source = "google"
    except Exception as e:
        print(f"clients5 translate error for {text}: {e}")

    # Fallback 1: Google gtx
    if not translated_vi:
        try:
            url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=" + urllib.parse.quote(text)
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req, timeout=3.5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                    translated_vi = "".join(seg[0] for seg in data[0] if seg and seg[0])
                    if translated_vi:
                        trans_source = "google_gtx"
        except Exception:
            pass

    # Fallback 2: MyMemory API
    if not translated_vi:
        try:
            url = "https://api.mymemory.translated.net/get?q=" + urllib.parse.quote(text) + "&langpair=zh-TW|vi"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Referer": "https://zh.taiwandiary.vn/"})
            with urllib.request.urlopen(req, timeout=3.5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                mm_txt = data.get("responseData", {}).get("translatedText")
                if mm_txt and "MYMEMORY WARNING" not in mm_txt.upper():
                    translated_vi = mm_txt
                    trans_source = "mymemory"
        except Exception:
            pass

    # Fallback 3: Sino-Vietnamese reading for short characters
    if not translated_vi and len(clean_text) <= 4:
        hv_parts = []
        for c in trad_text:
            cm = CHAR_META.get(c)
            hv = (cm.get("han_viet") if cm else None) or HANVIET_DICT.get(c)
            if hv:
                hv_parts.append(hv)
        if hv_parts and len(hv_parts) == len(trad_text):
            translated_vi = "Âm Hán-Việt: " + " ".join(hv_parts)
            trans_source = "hanviet"

    if translated_vi:
        res = {
            "q": text,
            "vi": translated_vi,
            "pinyin": "",
            "source": trans_source
        }
        TRANSLATE_MEM_CACHE[text] = res
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(res, f, ensure_ascii=False)
        except Exception:
            pass
        return res

    return None

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/manifest.json")
def serve_manifest():
    response = send_from_directory(os.path.join(BASE_DIR, "static"), "manifest.json", mimetype="application/manifest+json")
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

@app.route("/sw.js")
@app.route("/service-worker.js")
def serve_sw():
    response = send_from_directory(os.path.join(BASE_DIR, "static"), "sw.js", mimetype="application/javascript")
    response.headers["Service-Worker-Allowed"] = "/"
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response

@app.route("/favicon.ico")
def serve_favicon():
    return send_from_directory(os.path.join(BASE_DIR, "static", "img"), "favicon.png", mimetype="image/png")

@app.route("/apple-touch-icon.png")
@app.route("/apple-touch-icon-precomposed.png")
def serve_apple_touch_icon():
    return send_from_directory(os.path.join(BASE_DIR, "static", "img"), "apple-touch-icon.png", mimetype="image/png")

@app.route("/pwa/sounds/<path:filename>")
def serve_pwa_sounds(filename):
    return send_from_directory(os.path.join(BASE_DIR, "static", "pwa", "sounds"), filename, mimetype="audio/mpeg")

def generate_tts_mp3(text):
    clean_text = text.strip()[:100]
    if not clean_text:
        return None
    import hashlib
    h = hashlib.md5(clean_text.encode("utf-8")).hexdigest()
    cache_path = os.path.join(TTS_CACHE_DIR, f"{h}.mp3")
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
        return cache_path

    import subprocess
    import time
    tmp_path = os.path.join(TTS_CACHE_DIR, f"{h}.tmp.{os.getpid()}_{int(time.time()*1000)}.mp3")
    voices = ["zh-TW-HsiaoChenNeural", "zh-TW-YunJheNeural", "zh-CN-XiaoxiaoNeural"]
    
    for voice in voices:
        try:
            cmd = ["edge-tts", "--voice", voice, "--text", clean_text, "--write-media", tmp_path]
            res = subprocess.run(cmd, timeout=5, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if res.returncode == 0 and os.path.exists(tmp_path) and os.path.getsize(tmp_path) > 0:
                os.replace(tmp_path, cache_path)
                return cache_path
        except Exception:
            pass
        finally:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass

    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
        return cache_path
    return None

@app.route("/audio/tts/<path:filename>")
def serve_audio_tts(filename):
    text = filename.replace(".mp3", "").strip()
    if not text:
        return "Missing text", 400
    cache_path = generate_tts_mp3(text)
    if cache_path and os.path.exists(cache_path):
        return send_file(cache_path, mimetype="audio/mpeg")
    return "Audio not available", 404

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
    # Progress is persisted client-side per device (localStorage). Server writes disabled to prevent sharing.
    pass

def load_srs_progress():
    return {"reviews": {}, "stats": {"points": 180, "streak": 3, "best_streak": 7}, "daily_counts": {}}

def save_srs_progress(prog):
    # Progress is persisted client-side per device (localStorage). Server writes disabled to prevent sharing.
    pass

def load_notebook():
    return {"groups": [{"id": 1, "name": "Từ vựng yêu thích", "words": []}], "words": []}

def save_notebook(nb):
    # Progress is persisted client-side per device (localStorage). Server writes disabled to prevent sharing.
    pass

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
        raw_hz = data.get("hanzi", "")
        if "/" in raw_hz:
            parts = [p.strip() for p in raw_hz.split("/") if p.strip()]
            trad_parts = [to_traditional(p) or p for p in parts]
            trad_hz = "/".join(trad_parts) if len(set(trad_parts)) == len(parts) else raw_hz
            data["hanzi"] = trad_hz
            simp_parts = [to_simplified(p) or p for p in parts]
            simp_hz = "/".join(simp_parts)
            if simp_hz and simp_hz != trad_hz:
                data["hanzi_simplified"] = simp_hz
            else:
                data["hanzi_simplified"] = None
        else:
            trad_hz = to_traditional(raw_hz) if raw_hz else ""
            if trad_hz:
                data["hanzi"] = trad_hz
            simp_hz = data.get("hanzi_simplified") or to_simplified(trad_hz or raw_hz)
            if simp_hz and simp_hz != (trad_hz or raw_hz):
                data["hanzi_simplified"] = simp_hz
            else:
                data["hanzi_simplified"] = None

        for s in data.get("senses", []):
            if s.get("example_zh"):
                s["example_zh"] = to_traditional(s["example_zh"])
            for ex in s.get("examples", []):
                if ex.get("example_zh"):
                    ex["example_zh"] = to_traditional(ex["example_zh"])
                if ex.get("examples_hanzi"):
                    ex["examples_hanzi"] = to_traditional(ex["examples_hanzi"])
        for g in data.get("sense_groups", []):
            for s in g.get("senses", []):
                if s.get("example_zh"):
                    s["example_zh"] = to_traditional(s["example_zh"])
                for ex in s.get("examples", []):
                    if ex.get("example_zh"):
                        ex["example_zh"] = to_traditional(ex["example_zh"])
                    if ex.get("examples_hanzi"):
                        ex["examples_hanzi"] = to_traditional(ex["examples_hanzi"])

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

_OFFLINE_BUNDLE_JSON = None
_OFFLINE_BUNDLE_GZ = None

def get_offline_bundle_data():
    global _OFFLINE_BUNDLE_JSON, _OFFLINE_BUNDLE_GZ
    if _OFFLINE_BUNDLE_JSON is None:
        bundle = {
            "version": "1.5.8",
            "curriculums": CURRICULUMS,
            "books": BOOKS,
            "lessons": LESSONS,
            "lesson_vocab": LESSON_VOCAB,
            "lesson_contents": LESSON_CONTENTS,
            "grammar": GRAMMAR,
            "radicals": RADICALS,
            "measure_words": MEASURE_WORDS,
            "dict_tags": DICT_TAGS,
            "tag_vocab": TAG_VOCAB,
            "shadowing_topics": SHADOWING_TOPICS,
            "char_meta": CHAR_META,
            "char_decomp": load_json("char_decomp.json", {})
        }
        _OFFLINE_BUNDLE_JSON = json.dumps(bundle, ensure_ascii=False)
        _OFFLINE_BUNDLE_GZ = gzip.compress(_OFFLINE_BUNDLE_JSON.encode("utf-8"), compresslevel=6)
    return _OFFLINE_BUNDLE_JSON, _OFFLINE_BUNDLE_GZ

@app.route("/api/offline_bundle", methods=["GET"])
@app.route("/api/offline-bundle", methods=["GET"])
def api_offline_bundle():
    bundle_json, bundle_gz = get_offline_bundle_data()
    accept_encoding = request.headers.get("Accept-Encoding", "")
    if "gzip" in accept_encoding:
        resp = Response(bundle_gz, mimetype="application/json")
        resp.headers["Content-Encoding"] = "gzip"
        resp.headers["Cache-Control"] = "public, max-age=86400"
        return resp
    resp = Response(bundle_json, mimetype="application/json")
    resp.headers["Cache-Control"] = "public, max-age=86400"
    return resp

@app.route("/api.php", methods=["GET", "POST"])
def api_php():
    action = request.args.get("action") or request.form.get("action") or ""
    if action in ("get_offline_bundle", "offline_bundle"):
        return api_offline_bundle()
    elif action == "get_curriculum_types":
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
        if lid and str(lid) not in ("0", "", "all"):
            return jsonify(LESSON_VOCAB.get(str(lid), []))
        return jsonify(ALL_VOCAB)
    elif action == "get_lesson_contents":
        lid = request.args.get("lesson_id")
        return jsonify({"success": True, "data": LESSON_CONTENTS.get(str(lid), []) if lid else []})
    elif action == "get_all_dictation_contents":
        out = []
        for lid, items in LESSON_CONTENTS.items():
            if not isinstance(items, list):
                continue
            for it in items:
                if isinstance(it, dict) and it.get("type") in ("dialogue", "paragraph", "passage"):
                    out.append(it)
        return jsonify({"success": True, "data": out})
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
    elif action == "get_char_meta":
        chars = request.args.get("chars") or request.args.get("char") or ""
        chars_res = {}
        for c in chars:
            if c in CHAR_META:
                chars_res[c] = CHAR_META[c]
        return jsonify({"success": True, "data": chars_res})
    elif action == "get_vocab_contexts":
        vid = request.args.get("dict_id") or request.args.get("vocab_id") or request.args.get("id")
        word = next((w for w in ALL_VOCAB if str(w.get("dict_id") or w.get("vocab_id") or w.get("id")) == str(vid)), None)
        contexts = []
        if word and word.get("hanzi"):
            hz_parts = [p.strip() for p in word["hanzi"].split("/") if p.strip()]
            for lid, clist in LESSON_CONTENTS.items():
                for c in clist:
                    content = c.get("content", "")
                    matching_lines = [line.strip() for line in content.split("\n") if any(hz in line for hz in hz_parts)]
                    if matching_lines:
                        contexts.append({
                            "hanzi": hz_parts[0] if hz_parts else "",
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
        if GRAMMAR_TAGS:
            tags_list = list(GRAMMAR_TAGS.values())
            if tag_type:
                tags_list = [t for t in tags_list if t.get("tag_type") == tag_type]
            tags_list.sort(key=lambda t: t.get("sort_order", 0))
            data = [
                {
                    "tag_id": t["tag_id"],
                    "tag_type": t.get("tag_type"),
                    "tag_name": t.get("tag_name"),
                    "sort_order": t.get("sort_order", 0),
                    "grammar_count": t.get("grammar_count", len(t.get("grammar_ids", [])))
                }
                for t in tags_list
            ]
        elif tag_type == "top_n":
            data = [
                {"tag_id": 6, "tag_type": "top_n", "tag_name": "Top 10 hay dùng", "sort_order": 1, "grammar_count": 10},
                {"tag_id": 7, "tag_type": "top_n", "tag_name": "Top 20 hay dùng", "sort_order": 2, "grammar_count": 20},
                {"tag_id": 8, "tag_type": "top_n", "tag_name": "Top 50 hay dùng", "sort_order": 3, "grammar_count": 50}
            ]
        else:
            data = [
                {"tag_id": 9, "tag_type": "curriculum", "tag_name": "TBCL Chính thức (Đài Loan)", "sort_order": 0, "grammar_count": 495},
                {"tag_id": 1, "tag_type": "curriculum", "tag_name": "Giáo trình Đương Đại 1", "sort_order": 1, "grammar_count": 3},
                {"tag_id": 2, "tag_type": "curriculum", "tag_name": "Giáo trình Đương Đại 2", "sort_order": 2, "grammar_count": 2},
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
                tid_str = str(int(tag_id))
                if GRAMMAR_TAGS and tid_str in GRAMMAR_TAGS:
                    target_ids = GRAMMAR_TAGS[tid_str].get("grammar_ids", [])
                    res = [GRAMMAR_BY_ID[gid] for gid in target_ids if gid in GRAMMAR_BY_ID]
                else:
                    tid = int(tag_id)
                    if tid == 6: res = res[:10]
                    elif tid == 7: res = res[:20]
                    elif tid == 8: res = res[:50]
                    else: res = []
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
    elif action in ("get_grammar_by_ids", "get_grammar_bookmarks"):
        ids_param = request.args.get("ids") or request.args.get("grammar_ids") or ""
        if not ids_param and request.is_json:
            payload = request.get_json(silent=True) or {}
            ids_param = payload.get("ids") or payload.get("grammar_ids") or []
        if isinstance(ids_param, str):
            id_list = [s.strip() for s in ids_param.split(",") if s.strip()]
        elif isinstance(ids_param, list):
            id_list = [str(s) for s in ids_param if s]
        else:
            id_list = []
        results = []
        for gid_str in id_list:
            try:
                gid = int(gid_str)
                item = GRAMMAR_BY_ID.get(gid)
                if item:
                    results.append(item)
            except ValueError:
                pass
        return jsonify({"success": True, "data": results, "total": len(results)})
    elif action in ("grammar_bookmark_toggle", "grammar_bookmark_remove", "grammar_bookmark_clear"):
        return jsonify({"success": True, "message": "OK"})
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
    elif action in ("get_words_by_ids", "get_vocab_by_ids"):
        ids_param = request.args.get("ids") or request.args.get("dict_ids") or ""
        if not ids_param and request.is_json:
            payload = request.get_json(silent=True) or {}
            ids_param = payload.get("ids") or payload.get("dict_ids") or []
        if isinstance(ids_param, str):
            id_list = [s.strip() for s in ids_param.split(",") if s.strip()]
        elif isinstance(ids_param, list):
            id_list = [str(s) for s in ids_param if s]
        else:
            id_list = []
        
        results = []
        for did_str in id_list:
            item = DICT_BY_ID.get(did_str)
            if not item:
                try:
                    item = DICT_BY_ID.get(int(did_str))
                except ValueError:
                    item = None
            if not item:
                detail = get_rich_dict_detail(did_str)
                if detail:
                    item = {
                        "dict_id": detail.get("dict_id") or did_str,
                        "vocab_id": detail.get("dict_id") or did_str,
                        "hanzi": detail.get("hanzi") or "",
                        "pinyin": detail.get("pinyin") or "",
                        "definition": detail.get("definition") or detail.get("first_meaning_vi") or "",
                        "first_meaning_vi": detail.get("first_meaning_vi") or detail.get("definition") or "",
                        "part_of_speech": detail.get("part_of_speech") or "Từ vựng",
                        "audio_url": detail.get("audio_url"),
                        "examples": detail.get("examples") or []
                    }
            if item:
                results.append(item)
        return jsonify({"success": True, "data": results, "items": results, "words": results})
    elif action in ("notebook_group_list", "get_notebook_groups"):
        nb = load_notebook()
        groups = nb.get("groups", [])
        return jsonify({"success": True, "groups": groups, "data": groups})
    elif action == "notebook_group_create":
        payload = request.get_json(silent=True) or request.form or {}
        name = (payload.get("name") or request.args.get("name") or "").strip() or "Sổ tay mới"
        nb = load_notebook()
        gid = int(time.time() * 1000)
        new_group = {"id": gid, "group_id": gid, "name": name, "word_count": 0, "color": "purple"}
        nb.setdefault("groups", []).append(new_group)
        save_notebook(nb)
        return jsonify({"success": True, "message": "Tạo sổ tay thành công", "group_id": gid, "group": new_group})
    elif action == "notebook_group_delete":
        gid = request.args.get("group_id") or (request.get_json(silent=True) or {}).get("group_id")
        if gid:
            nb = load_notebook()
            nb["groups"] = [g for g in nb.get("groups", []) if str(g.get("id") or g.get("group_id")) != str(gid)]
            save_notebook(nb)
        return jsonify({"success": True, "message": "Đã xóa sổ tay"})
    elif action in ("notebook_add", "notebook_group_add_word"):
        payload = request.get_json(silent=True) or request.args or {}
        did = payload.get("dict_id") or payload.get("vocab_id")
        gid = payload.get("group_id") or 1
        nb = load_notebook()
        if did:
            nb.setdefault("words", [])
            if did not in nb["words"]:
                nb["words"].append(did)
            save_notebook(nb)
        return jsonify({"success": True, "message": "Đã lưu vào sổ tay", "group_id": gid})
    elif action in ("notebook_group_remove_word", "notebook_remove_word"):
        payload = request.get_json(silent=True) or request.args or {}
        did = payload.get("dict_id") or payload.get("vocab_id")
        nb = load_notebook()
        if did and "words" in nb:
            nb["words"] = [w for w in nb["words"] if str(w) != str(did)]
            save_notebook(nb)
        return jsonify({"success": True, "message": "Đã xóa khỏi sổ tay"})
    elif action in ("notebook_group_words", "get_saved_vocab"):
        nb = load_notebook()
        w_ids = set(str(w) for w in nb.get("words", []))
        words = [DICT_BY_ID[k] for k in w_ids if k in DICT_BY_ID]
        return jsonify({"success": True, "data": words, "items": words, "words": words})
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
    elif action in ("translate_zh", "translate"):
        q = (request.args.get("q") or request.form.get("q") or request.args.get("text") or request.form.get("text") or "").strip()
        if not q:
            return jsonify({"success": False, "message": "Missing text", "data": None})
        res = translate_chinese_to_vi(q)
        if res:
            return jsonify({"success": True, "data": res})
        return jsonify({"success": False, "message": "Translation unavailable", "data": None})
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

        # 2.5 Check local CN_VI_DICT (12,223 words)
        d_item = CN_VI_DICT.get(q_raw) or CN_VI_DICT.get(q_trad) or CN_VI_DICT.get(q)
        if d_item and isinstance(d_item, dict) and d_item.get("vi"):
            return jsonify({
                "success": True,
                "data": {
                    "dict_id": None,
                    "hanzi": q_trad or q,
                    "pinyin": d_item.get("py") or "",
                    "definition": d_item.get("vi"),
                    "first_meaning_vi": d_item.get("vi"),
                    "part_of_speech": "Từ vựng",
                    "tocfl_band": None,
                    "examples": []
                }
            })
        
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
        is_vn = bool(VN_DIACRITICS_RE.search(q_raw))
        q_trad = to_traditional(q_raw)
        q_simp = to_simplified(q_raw)
        q_py = clean_pinyin_search(q_raw)
        q_vn = remove_vn_tones(q_raw)
        q_norm = norm_hz(q_raw)
        
        matches = []
        for item in DICT_INDEX:
            score = 999
            hz = item["hanzi"].lower()
            simp = (item["hanzi_simplified"] or hz).lower()
            py = item["pinyin"].lower()
            py_c = item["pinyin_clean"]
            defn = item["definition"].lower()
            defn_c = item["vn_clean"]
            first_vi = (item.get("first_meaning_vi") or "").lower()
            first_vi_c = item.get("first_meaning_vi_clean") or remove_vn_tones(first_vi)
            variants = item.get("variants") or [hz]
            simp_variants = item.get("simp_variants") or [simp]
            norm_variants = item.get("norm_variants") or [norm_hz(hz)]
            
            # 1. Exact Hanzi match (Traditional, Simplified, variants, normalized 台/臺)
            if (q_raw in variants or q_trad in variants or q_simp in simp_variants or
                q_norm in norm_variants or hz == q_raw or simp == q_raw or hz == q_trad or
                norm_hz(hz) == q_norm):
                score = 0
            # 2. Hanzi starts with
            elif (hz.startswith(q_raw) or simp.startswith(q_raw) or hz.startswith(q_trad) or
                  any(v.startswith(q_raw) or v.startswith(q_trad) for v in variants)):
                score = 10 + len(hz)
            # 3. Hanzi contains
            elif q_raw in hz or q_raw in simp or q_trad in hz or any(q_raw in v for v in variants):
                score = 20 + len(hz)
            else:
                if is_vn:
                    # Explicit Vietnamese with diacritics: prioritize semantic definition match
                    if first_vi == q_raw:
                        score = 5
                    elif re.search(r"\b" + re.escape(q_raw) + r"\b", first_vi):
                        score = 12
                    elif first_vi.startswith(q_raw):
                        score = 18
                    elif re.search(r"\b" + re.escape(q_raw) + r"\b", defn):
                        score = 25
                    elif q_raw in defn:
                        score = 40
                else:
                    # Unaccented or Pinyin: balanced scoring
                    if first_vi_c == q_vn:
                        score = 8
                    elif py == q_raw or (q_py and py_c == q_py):
                        score = 14 + (0 if item["tocfl_band"] and item["tocfl_band"] <= 2 else 5)
                    elif re.search(r"\b" + re.escape(q_vn) + r"\b", first_vi_c):
                        score = 20
                    elif first_vi_c.startswith(q_vn):
                        score = 26
                    elif q_py and len(q_py) >= 2 and py_c.startswith(q_py):
                        score = 32 + len(py_c)
                    elif re.search(r"\b" + re.escape(q_vn) + r"\b", defn_c):
                        score = 42
                    elif q_py and len(q_py) >= 2 and any(s.startswith(q_py) for s in item.get("pinyin_syllables", [])):
                        score = 50 + len(py_c)
                    elif q_vn in defn_c:
                        score = 65
            
            if score < 999:
                band = item["tocfl_band"] or 99
                matches.append((score, len(first_vi), band, -item["ex_len"], len(hz), item))
                
        matches.sort(key=lambda x: (x[0], x[1], x[2], x[3], x[4]))
        
        limit = 20
        top_items = matches[:limit]
        res_data = []
        for idx, m in enumerate(top_items):
            it = m[5]
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
        return jsonify({"success": True, "data": {"book_id": 1, "lesson_id": 1, "module": "flashcard"}})
    elif action == "save_last_position":
        # Progress is persisted client-side per device (localStorage). Server writes disabled to prevent sharing.
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
            if due_now == 0:
                due_now = 25
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
        lid = request.args.get("lesson_id") or request.form.get("lesson_id")
        ids_param = request.args.get("ids") or request.form.get("ids")
        if not ids_param and request.is_json:
            j = request.get_json(silent=True) or {}
            ids_param = j.get("ids")
            if not lid:
                lid = j.get("lesson_id")

        due_ids = []
        if isinstance(ids_param, list):
            due_ids = [str(x).strip() for x in ids_param if str(x).strip()]
        elif isinstance(ids_param, str) and ids_param.strip():
            due_ids = [x.strip() for x in ids_param.split(",") if x.strip()]

        due_list = []
        if due_ids:
            seen = set()
            for vid in due_ids:
                if vid in ALL_VOCAB_BY_ID and vid not in seen:
                    w = ALL_VOCAB_BY_ID[vid]
                    if lid and str(lid) not in ("0", "", "all"):
                        w_lid = str(w.get("lesson_id") or "")
                        if w_lid and w_lid != str(lid):
                            continue
                    due_list.append(w)
                    seen.add(vid)

        if not due_list and not due_ids:
            prog = load_srs_progress()
            reviews = prog.get("reviews", {})
            if lid and str(lid) not in ("0", "", "all") and str(lid) in LESSON_VOCAB:
                vlist = LESSON_VOCAB[str(lid)]
                for w in vlist:
                    vid = str(w.get("vocab_id") or w.get("id") or w.get("dict_id") or "")
                    did = str(w.get("dict_id") or "")
                    r = reviews.get(vid) or (reviews.get(did) if did else None)
                    if r and r.get("rating") in (1, 2):
                        due_list.append(w)
                if not due_list:
                    due_list = vlist[:25]
            else:
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
        elif not due_list and due_ids:
            if lid and str(lid) not in ("0", "", "all") and str(lid) in LESSON_VOCAB:
                due_list = LESSON_VOCAB[str(lid)][:25]
            else:
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
    cache_path = generate_tts_mp3(text)
    if cache_path and os.path.exists(cache_path):
        return send_file(cache_path, mimetype="audio/mpeg")
    return jsonify({"error": "TTS generation failed"}), 404

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
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Referer": "https://zh.taiwandiary.vn/"})
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
        resp = send_file(cache_path, mimetype=mime)
        resp.headers["Cache-Control"] = "public, max-age=2592000"
        return resp

    # Check alias Daidai <-> Dangdai locally before fetching
    base_name = os.path.basename(filepath)
    if "Daidai" in base_name:
        alt_path = os.path.join(IMAGE_CACHE_DIR, filepath.replace("Daidai", "Dangdai"))
        if os.path.exists(alt_path) and os.path.getsize(alt_path) > 0:
            resp = send_file(alt_path, mimetype="image/webp")
            resp.headers["Cache-Control"] = "public, max-age=2592000"
            return resp
    elif "Dangdai" in base_name:
        alt_path = os.path.join(IMAGE_CACHE_DIR, filepath.replace("Dangdai", "Daidai"))
        if os.path.exists(alt_path) and os.path.getsize(alt_path) > 0:
            resp = send_file(alt_path, mimetype="image/webp")
            resp.headers["Cache-Control"] = "public, max-age=2592000"
            return resp

    url = f"https://zh.taiwandiary.vn/image/{filepath}"
    try:
        os.makedirs(os.path.dirname(cache_path), exist_ok=True)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Referer": "https://zh.taiwandiary.vn/"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read()
            if content.startswith(b"<!DOCTYPE") or content.startswith(b"<html") or b"LiteSpeed" in content[:200]:
                return "Not Found", 404
            with open(cache_path, "wb") as f:
                f.write(content)
        mime = resp.headers.get("content-type", "image/webp")
        resp = send_file(cache_path, mimetype=mime)
        resp.headers["Cache-Control"] = "public, max-age=2592000"
        return resp
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

@app.route("/api_leaderboard.php", methods=["GET", "POST"])
def api_leaderboard():
    return jsonify({"success": True, "data": [], "me": None})

@app.route("/index.php")
def serve_index_php():
    return redirect("/", code=301)

@app.route("/api_tracking.php", methods=["GET", "POST"])
def api_tracking():
    return jsonify({"success": True})

@app.route("/<page>")
def serve_page(page):
    valid_pages = {
        "karaoke", "listening", "shadowing", "flashcard", 
        "vocab", "quiz", "tocfl", "dictation", "srs", "writing", 
        "dashboard", "grammar", "grammar-hub", "radicals", "bo-thu", 
        "measure_words", "luong-tu", "vocab-notebook-hub", "calculator", "dict-lookup", "dict_lookup.php"
    }
    if page in valid_pages:
        return render_template("index.html")
    return "Not Found", 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8910, debug=False, threaded=True)
