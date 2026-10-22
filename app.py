import os
import json
import asyncio
import urllib.request
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

@app.route("/")
def index():
    return render_template("index.html")

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
    elif action == "get_vocab_contexts":
        vid = request.args.get("vocab_id")
        word = next((w for w in ALL_VOCAB if str(w.get("vocab_id") or w.get("id") or w.get("dict_id")) == str(vid)), None)
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
                            "lesson_title": c.get("dropdown_option", f"Bài {lid}"),
                            "lines": [{"line": l} for l in matching_lines[:3]]
                        })
                        if len(contexts) >= 3:
                            break
                if len(contexts) >= 3:
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
        limit = int(request.args.get("limit", 20))
        return jsonify({"success": True, "data": res[:limit], "total": len(res)})
    elif action == "get_shadowing_video":
        vid = request.args.get("id")
        cache_dir = os.path.join(DATA_DIR, "shadowing_cache")
        os.makedirs(cache_dir, exist_ok=True)
        cache_file = os.path.join(cache_dir, f"{vid}.json")
        if os.path.exists(cache_file):
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    return jsonify(json.load(f))
            except Exception:
                pass
        try:
            url = f"https://zh.taiwandiary.vn/api.php?action=get_shadowing_video&id={vid}"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10) as r:
                data = json.loads(r.read())
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False)
                return jsonify(data)
        except Exception as e:
            v_local = next((v for v in SHADOWING_VIDEOS if str(v.get("id")) == str(vid)), None)
            return jsonify({"success": True if v_local else False, "data": v_local})
    elif action in ("dict_lookup_search", "dict_search_token", "lookup_hanzi"):
        q = (request.args.get("q") or request.args.get("keyword") or "").strip().lower()
        if not q:
            return jsonify({"success": True, "data": []})
        results = [w for w in ALL_VOCAB if q in (w.get("hanzi") or "").lower() or q in (w.get("pinyin") or "").lower() or q in (w.get("definition") or "").lower()]
        return jsonify({"success": True, "data": results[:50]})
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
                "avatar": "/static/img/taiwandiary.png"
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
                "avatar": "/static/img/taiwandiary.png"
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
            card_info = prog.setdefault("reviews", {}).get(vid, {"count": 0, "rating": 3, "level": 1})
            card_info["count"] += 1
            card_info["rating"] = rating
            card_info["last_reviewed"] = today_str
            if rating >= 3:
                card_info["level"] = min(3, card_info.get("level", 1) + 1)
            elif rating == 1:
                card_info["level"] = max(1, card_info.get("level", 1) - 1)
            prog["reviews"][vid] = card_info
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
        vlist = LESSON_VOCAB.get(str(lid), []) if lid else []
        t = len(vlist)
        return jsonify({
            "success": True,
            "data": {
                "due_count": min(8, t),
                "learning_count": min(5, t),
                "mastered_count": max(0, t - 13)
            }
        })
    elif action == "get_due_vocab":
        lid = request.args.get("lesson_id")
        if lid and str(lid) in LESSON_VOCAB:
            due_list = LESSON_VOCAB[str(lid)]
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
        band_counts = {}
        for w in ALL_VOCAB:
            b = w.get("tocfl_band")
            if b:
                band_counts[b] = band_counts.get(b, 0) + 1
        band_dist = [{"tocfl_band": k, "cnt": v} for k, v in sorted(band_counts.items())]
        return jsonify({
            "success": True,
            "total_words": len(ALL_VOCAB),
            "band_dist": band_dist
        })
    return jsonify({"success": True, "data": []})

@app.route("/<page>")
def serve_page(page):
    valid_pages = {
        "karaoke", "listening", "shadowing", "flashcard", 
        "vocab", "quiz", "tocfl", "dictation", "srs", 
        "dashboard", "grammar", "grammar-hub", "radicals", "bo-thu", 
        "measure_words", "luong-tu", "vocab-notebook-hub", "calculator"
    }
    if page in valid_pages:
        return render_template("index.html")
    return "Not Found", 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8910, debug=False)
