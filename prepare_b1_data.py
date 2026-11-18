# -*- coding: utf-8 -*-
import json
import re
from prepare_b1_translations import B1_TRANSLATIONS

with open('data/lesson_contents.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open('b1_cuts_plan.json', 'r', encoding='utf-8') as f:
    plan = json.load(f)

with open('b1_yt_segments.json', 'r', encoding='utf-8') as f:
    all_segs = json.load(f)['segments']

S2T = {
    '国': '國', '学': '學', '们': '們', '个': '個', '么': '麼', '谁': '誰',
    '这': '這', '点': '點', '见': '見', '请': '請', '问': '問', '间': '間',
    '话': '話', '车': '車', '东': '東', '写': '寫', '书': '書', '门': '門',
    '开': '開', '会': '會', '欢': '歡', '还': '還', '动': '動', '物': '物',
    '买': '買', '卖': '賣', '两': '兩', '后': '後', '进': '進', '远': '遠',
    '过': '過', '时': '時', '候': '候', '样': '樣', '机': '機', '电': '電',
    '视': '視', '饭': '飯', '馆': '館', '节': '節', '听': '聽', '说': '說',
    '网': '網', '路': '路', '给': '給', '让': '讓', '对': '對', '带': '帶',
    '难': '難', '体': '體', '乐': '樂', '题': '題', '虽': '雖', '然': '然',
    '气': '氣', '张': '張', '热': '熱', '闹': '鬧', '计': '計', '划': '劃'
}

def to_trad(text):
    return ''.join(S2T.get(ch, ch) for ch in text)

def clean(s):
    return to_trad(re.sub(r'[^\u4e00-\u9fa5]', '', s))

def split_sentences(text):
    parts = re.split(r'([。？！；]+)', text)
    sentences = []
    curr = ''
    for p in parts:
        curr += p
        if re.search(r'[。？！；]', p):
            if curr.strip():
                sentences.append(curr.strip())
            curr = ''
    if curr.strip():
        sentences.append(curr.strip())
    return [s for s in sentences if s.strip()]

def partition_segs_to_lines(lines, segs, cut_start):
    n_lines = len(lines)
    n_segs = len(segs)
    line_clean = [clean(l) for l in lines]
    seg_clean = [clean(s['text']) for s in segs]
    
    if n_segs < n_lines:
        tot_dur = segs[-1]['end'] - cut_start
        tot_chars = sum(len(l) for l in line_clean) or 1
        res = []
        cur_t = 0.05
        for idx, l in enumerate(lines):
            dur = (len(line_clean[idx]) / tot_chars) * tot_dur
            st = round(cur_t, 2)
            et = round(cur_t + dur, 2)
            cur_t += dur
            res.append({'id': idx+1, 'text': l, 'start_time': st, 'end_time': et})
        return res
    
    def overlap_score(line_str, seg_slice):
        merged_seg = "".join(seg_clean[k] for k in seg_slice)
        score = 0
        seg_chars = list(merged_seg)
        for ch in line_str:
            if ch in seg_chars:
                score += 1
                seg_chars.remove(ch)
        return score

    dp = {}
    parent = {}
    for j in range(1, n_segs - n_lines + 2):
        dp[(1, j)] = overlap_score(line_clean[0], range(0, j))
        parent[(1, j)] = 0

    for i in range(2, n_lines + 1):
        for j in range(i, n_segs - (n_lines - i) + 1):
            best_score = -1e9
            best_k = i - 1
            for k in range(i - 1, j):
                sc = dp.get((i - 1, k), -1e9) + overlap_score(line_clean[i - 1], range(k, j))
                if sc > best_score:
                    best_score = sc
                    best_k = k
            dp[(i, j)] = best_score
            parent[(i, j)] = best_k

    curr_j = n_segs
    splits = []
    for i in range(n_lines, 0, -1):
        prev_j = parent[(i, curr_j)]
        splits.append((prev_j, curr_j))
        curr_j = prev_j
    splits.reverse()
    
    res = []
    for idx, (sj_start, sj_end) in enumerate(splits):
        st = round(max(0.0, segs[sj_start]['start'] - cut_start), 2)
        et = round(max(st + 0.5, segs[sj_end - 1]['end'] - cut_start), 2)
        res.append({'id': idx+1, 'text': lines[idx], 'start_time': st, 'end_time': et})
    return res

updated_count = 0
for p in plan:
    lid = str(p['lid'])
    if lid not in data:
        continue
    items = data[lid]
    
    # 1. Track 0: Dialogue 1
    t0_rng = p['tracks'][0]['range']
    item0 = items[0]
    key0 = f"{lid}_0"
    
    # Clean L90_0 content if needed
    if lid == '90':
        raw_c = item0.get('content', '')
        if raw_c.startswith('（放假以前）\n'):
            item0['content'] = raw_c.replace('（放假以前）\n', '', 1)
        elif raw_c.startswith('（放假以前）'):
            item0['content'] = raw_c.replace('（放假以前）', '', 1).lstrip()
    
    item0['vietnamese'] = B1_TRANSLATIONS[key0]
    c_lines0 = [l.strip() for l in item0.get('content', '').splitlines() if l.strip()]
    spoken0 = [l.split('：')[-1].strip() if '：' in l else l.strip() for l in c_lines0]
    track_segs0 = all_segs[t0_rng[0]:t0_rng[1]+1]
    cut_start0 = max(0.0, track_segs0[0]['start'] - 0.05)
    item0['script_json'] = partition_segs_to_lines(spoken0, track_segs0, cut_start0)
    updated_count += 1
    
    # 2. Track 1: Dialogue 2
    t1_rng = p['tracks'][1]['range']
    item1 = items[1]
    key1 = f"{lid}_1"
    item1['vietnamese'] = B1_TRANSLATIONS[key1]
    c_lines1 = [l.strip() for l in item1.get('content', '').splitlines() if l.strip()]
    spoken1 = [l.split('：')[-1].strip() if '：' in l else l.strip() for l in c_lines1]
    track_segs1 = all_segs[t1_rng[0]:t1_rng[1]+1]
    cut_start1 = max(0.0, track_segs1[0]['start'] - 0.05)
    item1['script_json'] = partition_segs_to_lines(spoken1, track_segs1, cut_start1)
    updated_count += 1
    
    # 3. Track 2: Reading (bd3)
    t2_rng = p['tracks'][2]['range']
    item2 = items[2]
    key2 = f"{lid}_2"
    item2['vietnamese'] = B1_TRANSLATIONS[key2]
    sentences2 = split_sentences(item2.get('content', ''))
    track_segs2 = all_segs[t2_rng[0]:t2_rng[1]+1]
    cut_start2 = max(0.0, track_segs2[0]['start'] - 0.05)
    item2['script_json'] = partition_segs_to_lines(sentences2, track_segs2, cut_start2)
    updated_count += 1

print(f"Updated {updated_count} items across 16 lessons of Book 1!")

# Save to data/lesson_contents.json
with open('data/lesson_contents.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Saved successfully to data/lesson_contents.json!")
