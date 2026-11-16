const DICT_REGISTER_LABEL = { textbook: 'Giáo trình', formal: 'Trang trọng, văn viết', colloquial: 'Khẩu ngữ', slang: 'Lóng/GenZ' };
let dictDebounceTimer = null;
let dictDropdownEntries = [];
let dictDropdownActiveIdx = -1;

function dictLookupDebounced() {
    const inp = document.getElementById('dict-search-input');
    const btn = document.getElementById('dict-lookup-clear');
    if (btn && inp) btn.classList.toggle('hidden', !inp.value.trim());
    clearTimeout(dictDebounceTimer);
    // 200ms: đủ nhanh để cảm giác tức thì, nhưng tránh bắn API dồn dập khi gõ nhanh
    dictDebounceTimer = setTimeout(dictSearchDropdownRun, 200);
}

function dictLookupClearInput() {
    const inp = document.getElementById('dict-search-input');
    if (inp) {
        inp.value = '';
        inp.focus();
    }
    const btn = document.getElementById('dict-lookup-clear');
    if (btn) btn.classList.add('hidden');
    dictCloseDropdown();
}

function dictLookupInputKeydown(ev) {
    const dd = document.getElementById('dict-search-dropdown');
    const ddOpen = dd && !dd.classList.contains('hidden');
    if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        if (!ddOpen || !dictDropdownEntries.length) return;
        dictDropdownActiveIdx = Math.min(dictDropdownActiveIdx + 1, dictDropdownEntries.length - 1);
        dictRenderDropdownActive();
    } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        if (!ddOpen || !dictDropdownEntries.length) return;
        dictDropdownActiveIdx = Math.max(dictDropdownActiveIdx - 1, 0);
        dictRenderDropdownActive();
    } else if (ev.key === 'Enter') {
        ev.preventDefault();
        if (ddOpen && dictDropdownActiveIdx >= 0 && dictDropdownEntries[dictDropdownActiveIdx]) {
            dictLookupOpenDetail(dictDropdownEntries[dictDropdownActiveIdx].dict_id);
        } else {
            dictSearchDropdownRun(true);
        }
    } else if (ev.key === 'Escape') {
        dictCloseDropdown();
    }
}

function dictCloseDropdown() {
    const dd = document.getElementById('dict-search-dropdown');
    if (dd) { dd.classList.add('hidden'); dd.innerHTML = ''; }
    dictDropdownEntries = []; dictDropdownActiveIdx = -1;
}

function dictRenderDropdownActive() {
    document.querySelectorAll('#dict-search-dropdown .dict-dd-item').forEach((el, i) => {
        el.classList.toggle('active', i === dictDropdownActiveIdx);
    });
    const activeEl = document.querySelector('#dict-search-dropdown .dict-dd-item.active');
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
}

// Không có mục từ điển khớp — nếu API đã dịch được (cụm/câu dài), hiển thị bản dịch thô
// kèm nhãn rõ ràng thay vì báo "không tìm thấy". Không có dict_id nên không cho click mở chi tiết.
function dictRenderAiTranslationFallback(aiTranslation) {
    if (!aiTranslation || !aiTranslation.hanzi) {
        return '<div class="p-4 text-sm text-slate-400 text-center">Không tìm thấy kết quả.</div>';
    }
    return `<div class="p-4 border-b border-slate-100 bg-amber-50/60">
        <div class="text-[11px] font-bold text-amber-600 uppercase tracking-wide mb-1">
            <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>Bản dịch AI (chưa có trong từ điển)
        </div>
        <div class="text-hanzi-sm font-black text-slate-800">${aiTranslation.hanzi}</div>
    </div>`;
}

// Token ngắn hạn cho các request tra cứu từ điển (chống cào). Cache lại và chỉ xin token
// mới khi hết hạn (server TTL 120s, xin lại sau mỗi 100s để có biên an toàn).
let _dictToken = null, _dictTokenAt = 0;
async function dictGetToken() {
    if (_dictToken && (Date.now() - _dictTokenAt) < 100000) return _dictToken;
    try {
        const res = await fetch('/api.php?action=dict_search_token');
        const json = await res.json();
        _dictToken = { ts: json.ts, token: json.token };
        _dictTokenAt = Date.now();
        return _dictToken;
    } catch (e) {
        return { ts: Math.floor(Date.now() / 1000), token: '' };
    }
}
async function dictAuthedFetch(url) {
    try {
        const t = await dictGetToken();
        const sep = url.includes('?') ? '&' : '?';
        return fetch(`${url}${sep}ts=${t?.ts || ''}&token=${t?.token || ''}`, { referrerPolicy: 'same-origin' });
    } catch (e) {
        return fetch(url, { referrerPolicy: 'same-origin' });
    }
}

async function dictSearchDropdownRun(forceOpenFirst) {
    const q = document.getElementById('dict-search-input').value.trim();
    const dd = document.getElementById('dict-search-dropdown');
    if (!q) { dictCloseDropdown(); return; }
    try {
        const res = await dictAuthedFetch(`/api.php?action=dict_lookup_search&q=${encodeURIComponent(q)}`);
        const json = await res.json();
        const entries = (json.data || []).slice(0, 10);
        dictDropdownEntries = entries;
        dictDropdownActiveIdx = -1;
        if (!entries.length) {
            dd.innerHTML = dictRenderAiTranslationFallback(json.ai_translation);
            dd.classList.remove('hidden');
            return;
        }
        dd.innerHTML = entries.map((e, i) => {
            const firstVi = e.first_meaning_vi || '';
            return `<div class="dict-dd-item" data-idx="${i}" onclick="dictLookupOpenDetail(${e.dict_id})">
                <span class="text-hanzi-sm font-black text-slate-800 dict-hanzi-big shrink-0">${dictDualOrtho(e.hanzi, e.hanzi_simplified)}</span>
                <span class="min-w-0 flex-1">
                    <span class="block text-xs font-bold text-slate-500">${dictHighlightQuery(e.pinyin || '', q)}</span>
                    ${firstVi ? `<span class="block text-xs text-slate-400 truncate">${dictHighlightQuery(firstVi, q)}</span>` : ''}
                </span>
            </div>`;
        }).join('');
        dd.classList.remove('hidden');
        if (forceOpenFirst) dictLookupOpenDetail(entries[0].dict_id);
    } catch (e) { dictCloseDropdown(); }
}

document.addEventListener('click', (ev) => {
    const wrap = document.getElementById('dict-search-wrap');
    if (wrap && !wrap.contains(ev.target)) dictCloseDropdown();
});

async function dictLookupOpenDetail(dictId, updateUrl) {
    if (updateUrl === undefined) updateUrl = true;
    dictCloseDropdown();
    document.getElementById('dict-lookup-empty').classList.add('hidden');
    const box = document.getElementById('dict-lookup-detail');
    box.classList.remove('hidden');
    box.innerHTML = '<div class="text-center text-slate-400 py-16"><i class="fa-solid fa-spinner fa-spin text-2xl"></i></div>';
    try {
        const res = await dictAuthedFetch(`/api.php?action=dict_lookup_detail&dict_id=${dictId}`);
        const json = await res.json();
        renderDictLookupDetail(json.data);
        // Deep-link riêng cho từng từ: URL phản ánh đúng dict_id đang xem (chia sẻ được, F5
        // không mất, cảm giác "trang riêng" thay vì luôn dừng ở /dict-lookup chung chung).
        if (updateUrl && json.data) {
            const url = `/dict-lookup?dict_id=${dictId}`;
            window.history.pushState({ tab: 'dict-lookup', dict_id: dictId }, '', url);
            document.title = `${json.data.hanzi}${json.data.pinyin ? ' (' + json.data.pinyin + ')' : ''} là gì? | Từ điển Trung-Việt Hanzi Diary`;
        }
    } catch (e) {
        box.innerHTML = '<p class="text-center text-red-400 py-16">Lỗi tải dữ liệu. Vui lòng thử lại.</p>';
    }
}

function dictEmptySection(label) {
    return `<div class="text-center text-slate-300 text-xs font-medium py-6 border border-dashed border-slate-200 rounded-xl">Chưa có dữ liệu ${label}</div>`;
}

// Chọn màu pastel cho badge Từ loại — từ loại thường gặp có màu cố định (dễ nhớ), từ loại lạ
// dùng hash ổn định để luôn ra cùng 1 màu cho cùng 1 tên (không đổi màu ngẫu nhiên mỗi lần render).
const DICT_POS_COLOR_MAP = {
    'danh từ': 'pos-blue', 'động từ': 'pos-rose', 'tính từ': 'pos-amber',
    'trạng từ': 'pos-teal', 'phó từ': 'pos-teal', 'liên từ': 'pos-indigo',
    'giới từ': 'pos-lime', 'đại từ': 'pos-violet', 'lượng từ': 'pos-cyan',
    'thán từ': 'pos-rose', 'trợ từ': 'pos-slate', 'số từ': 'pos-amber'
};
const DICT_POS_COLOR_CYCLE = ['pos-blue', 'pos-rose', 'pos-amber', 'pos-teal', 'pos-indigo', 'pos-lime', 'pos-violet', 'pos-cyan'];
function dictPosPillClass(name) {
    const key = String(name || '').trim().toLowerCase();
    if (DICT_POS_COLOR_MAP[key]) return DICT_POS_COLOR_MAP[key];
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return DICT_POS_COLOR_CYCLE[h % DICT_POS_COLOR_CYCLE.length];
}

// Escape HTML rồi bọc từ khóa Hán tự đang tra bằng span highlight (đỏ cam đậm)
function dictHighlightKeyword(text, keyword) {
    if (!text) return '';
    const convertedText = getChar(text);
    const convertedKw = keyword ? getChar(keyword) : '';
    const safe = String(convertedText).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (!convertedKw) return safe;
    const esc = convertedKw.replace(/[.*+?^${}()|[\]\\]/g, '\$&');
    if (!esc) return safe;
    return safe.replace(new RegExp(esc, 'g'), m => `<span class="dict-kw-hl">${m}</span>`);
}

// Giống dictHighlightKeyword nhưng so khớp không phân biệt hoa/thường — dùng cho dropdown gợi ý
// (khớp cả pinyin không dấu/nghĩa tiếng Việt lẫn hanzi), kiểu Hanzii.
function dictHighlightQuery(text, q) {
    if (!text) return '';
    const safe = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (!q) return safe;
    const esc = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\$&');
    if (!esc) return safe;
    return safe.replace(new RegExp(esc, 'gi'), m => `<span class="dict-kw-hl">${m}</span>`);
}

// Hiển thị song song Phồn (chính) / Giản (mở ngoặc bên cạnh), kiểu Hanzii — tự động thích ứng với charMode
function dictDualOrtho(hanzi, simplified) {
    if (!hanzi) return '';
    ensureOpenCC();
    let trad = converterS2T ? converterS2T(hanzi) : hanzi;
    let simp = simplified || (converterT2S ? converterT2S(trad) : trad);
    if (charMode === 'simplified') {
        return (simp && simp !== trad)
            ? `${simp} <span class="text-slate-400 font-normal">(${trad})</span>`
            : (simp || trad);
    } else {
        return (simp && simp !== trad)
            ? `${trad} <span class="text-slate-400 font-normal">(${simp})</span>`
            : trad;
    }
}

function renderDictLookupDetail(entry) {
    const box = document.getElementById('dict-lookup-detail');
    if (!entry) { box.innerHTML = '<p class="text-center text-slate-400 py-16">Không tìm thấy từ này.</p>'; return; }
    window.dictCurrentEntry = entry;
    window.dictCurrentCharsInfo = entry.chars_info || [];

    // Label pastel dưới chữ Hán: chủ đề (từ loại gộp), nguồn dữ liệu, cấp độ — kiểu Hanzii.
    // (Trước đây có thêm 1 badge "TOCFL cấp N" riêng biệt trùng với badge TOCFL trong pastelLabels
    // bên dưới — gộp lại chỉ còn 1 badge TOCFL duy nhất để tránh hiển thị lặp.)
    const sourceLabels = [...new Set((entry.senses || []).map(s => s.source).filter(Boolean))];
    const pastelLabels = [
        entry.tocfl_band ? `<span class="dict-pastel dict-pastel-blue">TOCFL ${entry.tocfl_band}</span>` : '',
        entry.hsk_level ? `<span class="dict-pastel dict-pastel-purple">HSK ${entry.hsk_level}</span>` : '',
        ...sourceLabels.map(src => `<span class="dict-pastel dict-pastel-amber">${src === 'tocfl_textbook' ? 'Giáo trình TOCFL' : (src === 'moedict' ? 'Từ điển MOE' : src)}</span>`),
        ...(entry.tags || []).map(t => `<button type="button" onclick="if(typeof vnhSelectDictTag==='function') vnhSelectDictTag(${t.tag_id},'${String(t.tag_name || '').replace(/'/g, "\\'")}');" class="dict-pastel dict-pastel-green hover:opacity-80 transition-opacity cursor-pointer text-left">${t.tag_name}</button>`)
    ].filter(Boolean).join('');

    // Nhóm theo từ loại (pos) — tính trước để header "Nghĩa tiếng Việt" và khối "Từ vựng" bên dưới
    // dùng chung 1 thứ tự sense toàn cục (đánh số & id neo #dict-sense-N phải khớp nhau tuyệt đối).
    const senseGroupsForFlat = entry.sense_groups && entry.sense_groups.length ? entry.sense_groups : null;
    const allSensesFlat = senseGroupsForFlat ? senseGroupsForFlat.flatMap(g => g.senses) : [];

    // Nghĩa cơ bản (tóm tắt nhanh, hiện dưới cùng khối nhãn cấp độ/nguồn): 1 nghĩa → 1 dòng chữ;
    // nhiều nghĩa → danh sách đánh số 1/2/3..., mỗi nghĩa 1 khối nền trắng riêng, bấm số để
    // cuộn mượt xuống đúng khối chi tiết tương ứng ở "Từ vựng" bên dưới (tự mở "Xem thêm" nếu ẩn).
    const quickMeaningsHtml = allSensesFlat.length === 0 ? '' : allSensesFlat.length === 1
        ? `<p class="mt-3 text-lg sm:text-xl font-bold text-slate-800">${allSensesFlat[0].meaning_vi || ''}</p>`
        : `<div class="mt-3 space-y-2">${allSensesFlat.map((s, i) => `
            <a href="#dict-sense-${i + 1}" onclick="dictScrollToSense(event, ${i + 1})" class="flex items-start gap-3 bg-white border border-slate-200 shadow-sm hover:border-primary/40 hover:bg-primary/5 rounded-xl px-3.5 py-2.5 transition-colors cursor-pointer">
                <span class="shrink-0 font-black text-primary">${i + 1}.</span>
                <span class="font-semibold text-base sm:text-lg text-slate-800">${s.meaning_vi || ''}</span>
            </a>`).join('')}</div>`;

    // Một sense giáo trình luôn kèm nhiều nhất 5 câu ví dụ minh họa: câu riêng của sense (nếu có)
    // + câu thực tế trích từ kho Shadowing (dùng chung cho cả từ, không tách riêng theo sense vì
    // DB không lưu quan hệ sense<->câu Shadowing).
    const senseExtraExamples = (entry.shadow_examples || []).slice(0, 4);
    const senseExampleHtml = (zh, vi, pending, py) => `
        <div class="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex items-start gap-3">
            <div class="min-w-0 flex-1 space-y-1">
                <p class="text-hanzi-md font-bold text-slate-800 dict-hanzi-big">${dictHighlightKeyword(zh, entry.hanzi)}</p>
                ${py ? `<p class="text-base font-normal text-slate-500">${py}</p>` : ''}
                ${vi ? `<p class="text-base font-semibold text-primary">${vi}</p>` : (pending ? `<p class="text-slate-300 text-sm italic">(học viên bổ sung bản dịch sau)</p>` : '')}
            </div>
            <button type="button" onclick="playTTS(encodeURIComponent('${zh.replace(/'/g, "\\'")}'), event)" class="ml-auto flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 active:bg-primary active:text-white transition-all shadow-sm flex items-center justify-center outline-none border-0" title="Phát âm">
                <i class="fa-solid fa-volume-high text-xs pointer-events-none transition-transform"></i>
            </button>
        </div>`;

    // Nhóm theo từ loại (pos) — mỗi nhóm là 1 khối "Động từ / Danh từ / ..." kiểu Hanzii/Flashcard,
    // mỗi sense trong nhóm gắn nhãn pastel TỪ LOẠI/NGHĨA TIẾNG VIỆT/VÍ DỤ MINH HỌA, có "Xem thêm"
    // khi nhóm có >2 sense.
    const SENSE_GROUP_VISIBLE = 2;
    const senseGroups = senseGroupsForFlat;
    let globalSenseIdx = 0;
    const senses = senseGroups ? senseGroups.map((g, gi) => `
        <div class="${gi > 0 ? 'border-t border-slate-100 pt-6 mt-6' : ''}">
            <div class="flex items-center gap-2 flex-wrap mb-4">
                <span class="dict-tag dict-tag-pos shrink-0">Từ loại</span>
                ${(g.pos || 'Khác').split(/[,、]+/).map(p => p.trim()).filter(Boolean).map(p => `<span class="dict-pos-pill ${dictPosPillClass(p)}">${p}</span>`).join('')}
            </div>
            ${g.senses.map((s, i) => {
                globalSenseIdx++;
                const senseAnchorId = globalSenseIdx;
                const sExamples = (s.examples && s.examples.length) ? s.examples : (s.example_zh ? [{example_zh: s.example_zh, example_vi: s.example_vi, example_pinyin: s.example_pinyin}] : []);
                const hasExtra = gi === 0 && i === 0 && senseExtraExamples.length > 0;
                const hasExample = sExamples.length > 0 || hasExtra;
                return `
                <div id="dict-sense-${senseAnchorId}" class="scroll-mt-24 ${i > 0 ? 'mt-6 pt-6 border-t border-slate-100' : ''} ${i >= SENSE_GROUP_VISIBLE ? 'dict-more-sense hidden' : ''}">
                    <div class="flex items-center gap-2 mb-2 flex-wrap">
                        <span class="shrink-0 w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-xs font-black flex items-center justify-center">${i + 1}</span>
                        <span class="dict-register-badge dict-register-${s.register}">${DICT_REGISTER_LABEL[s.register] || s.register}</span>
                        <span class="dict-tag dict-tag-mean">Nghĩa tiếng Việt</span>
                    </div>
                    <p class="text-lg font-bold text-slate-800 mb-1">${s.meaning_vi || '<span class="text-slate-400 italic font-normal">(chưa có bản dịch tiếng Việt)</span>'}</p>
                    ${s.meaning_zh ? `<p class="text-slate-400 text-xs mb-3">${s.meaning_zh}</p>` : '<div class="mb-3"></div>'}
                    ${hasExample ? `<span class="dict-tag dict-tag-example mb-2 inline-block">Ví dụ minh họa</span>
                    <div class="space-y-3 mt-2">
                        ${sExamples.map(ex => senseExampleHtml(ex.example_zh || ex.examples_hanzi, ex.example_vi || ex.examples_translation, false, ex.example_pinyin || ex.examples_pinyin)).join('')}
                        ${hasExtra ? senseExtraExamples.map(ex => senseExampleHtml(ex.zh, ex.vi, true, ex.py)).join('') : ''}
                    </div>` : ''}
                </div>`;
            }).join('')}
            ${g.senses.length > SENSE_GROUP_VISIBLE ? `<button type="button" class="dict-more-toggle mt-4" onclick="dictToggleMore(this,'.dict-more-sense')">Xem thêm ${g.senses.length - SENSE_GROUP_VISIBLE} nghĩa <i class="fa-solid fa-chevron-down text-[10px] ml-1"></i></button>` : ''}
        </div>
    `).join('') : '<p class="text-slate-400 text-sm italic">Chưa có nghĩa nào được duyệt hiển thị.</p>';

    // Từ ghép: danh sách 2 cột đánh số kiểu Hanzii (Phồn(Giản) + PINYIN VIẾT HOA), có "Xem thêm"
    // khi nhiều hơn 6 từ để không kéo dài trang quá mức.
    const RELATED_VISIBLE = 6;
    const relatedItems = entry.related || [];
    const relatedRow = (r, i) => `
        <button type="button" onclick="dictLookupOpenDetail(${r.dict_id})" class="group text-left bg-slate-50/70 hover:bg-primary/5 border border-slate-100 hover:border-primary/30 rounded-2xl px-4 py-3.5 transition-colors ${i >= RELATED_VISIBLE ? 'dict-more-related hidden' : ''}">
            <div class="flex items-center gap-2.5">
                <span class="shrink-0 w-6 h-6 rounded-md bg-white text-slate-400 group-hover:text-primary group-hover:bg-primary/10 text-xs font-black flex items-center justify-center transition-colors">${i + 1}</span>
                <span class="font-bold text-slate-800 group-hover:text-primary dict-hanzi-big text-hanzi-sm truncate">${dictDualOrtho(r.hanzi, r.hanzi_simplified)}</span>
            </div>
            <span class="block text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wide mt-1 ml-8">${r.pinyin || ''}</span>
            ${r.definition ? `<span class="block text-xs text-slate-600 truncate mt-0.5 ml-8">${r.definition}</span>` : ''}
        </button>`;
    const related = relatedItems.length
        ? `<div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">${relatedItems.map(relatedRow).join('')}</div>
           ${relatedItems.length > RELATED_VISIBLE ? `<button type="button" class="dict-more-toggle mt-3" onclick="dictToggleMore(this,'.dict-more-related')">Xem thêm ${relatedItems.length - RELATED_VISIBLE} từ <i class="fa-solid fa-chevron-down text-[10px] ml-1"></i></button>` : ''}`
        : dictEmptySection('từ ghép');

    // Từ đồng nghĩa / trái nghĩa: quan hệ đã được admin duyệt (DictionaryRelations), ẩn cả khối
    // nếu chưa có dữ liệu thay vì hiện khối rỗng.
    const relationChip = (r) => `
        <button type="button" onclick="${r.dict_id ? `dictLookupOpenDetail(${r.dict_id})` : `dictLookupOpenByHanzi('${r.hanzi}')`}" class="group text-left bg-slate-50/70 hover:bg-primary/5 border border-slate-100 hover:border-primary/30 rounded-xl px-3.5 py-2 transition-colors">
            <span class="font-bold text-slate-800 group-hover:text-primary dict-hanzi-big text-hanzi-sm">${dictDualOrtho(r.hanzi, r.hanzi_simplified)}</span>
            <span class="block text-[11px] font-bold text-slate-400 mt-0.5">${r.pinyin || ''}</span>
            ${r.definition ? `<span class="block text-[10px] text-slate-500 truncate max-w-[130px]">${r.definition}</span>` : ''}
        </button>`;
    const synonymsList = entry.synonyms || [];
    const antonymsList = entry.antonyms || [];
    const hasRelations = synonymsList.length > 0 || antonymsList.length > 0;
    const relationsHtml = !hasRelations ? dictEmptySection('từ đồng nghĩa/trái nghĩa') : `
        ${synonymsList.length ? `
        <div class="mb-4">
            <span class="dict-tag dict-tag-mean mb-2 inline-block">Đồng nghĩa</span>
            <div class="flex flex-wrap gap-2">${synonymsList.map(relationChip).join('')}</div>
        </div>` : ''}
        ${antonymsList.length ? `
        <div>
            <span class="dict-tag dict-tag-example mb-2 inline-block">Trái nghĩa</span>
            <div class="flex flex-wrap gap-2">${antonymsList.map(relationChip).join('')}</div>
        </div>` : ''}`;

    // Độ phổ biến: hạng + số lượt tra cứu (tăng dần mỗi lần mở trang, tính bởi backend).
    const pop = entry.popularity || { rank: null, lookup_count: 0 };
    const popularityHtml = `
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3.5">
            <div class="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <i class="fa-solid fa-fire shrink-0"></i>
                <span>Độ phổ biến trên hệ thống:</span>
                <span class="font-black text-base shrink-0">${pop.rank != null ? '#' + pop.rank : 'Đang cập nhật'}</span>
            </div>
            <div class="flex items-center gap-1.5 text-slate-500 text-xs font-bold shrink-0">
                <i class="fa-solid fa-magnifying-glass"></i> Được tra cứu ${pop.lookup_count} lần
            </div>
        </div>`;

    // Góp ý cộng đồng: list công khai (vote up/down, avatar) + ô nhập góp ý — bắt buộc đăng nhập.
    // Mỗi góp ý gửi lên cũng tự động vào error_reports để admin duyệt tại "Quản lý Báo lỗi".
    const feedbackItem = (fb) => {
        const avatar = fb.avatar ? `<img src="${fb.avatar}" class="w-8 h-8 rounded-full object-cover shrink-0" alt="">` : `<div class="w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">${(fb.full_name || fb.username || '?').charAt(0).toUpperCase()}</div>`;
        const name = fb.full_name || fb.username || 'Học viên';
        return `
        <div class="flex items-start gap-3 py-3 border-b border-slate-100 last:border-b-0">
            ${avatar}
            <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-slate-700 text-sm">${name}</span>
                    <span class="text-slate-300 text-[11px]">${new Date(fb.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <p class="text-slate-600 text-sm mt-0.5 whitespace-pre-line">${dictHighlightKeyword(fb.content, entry.hanzi)}</p>
                <div class="flex items-center gap-3 mt-1.5">
                    <button type="button" onclick="dictVoteFeedback(${fb.feedback_id},'up',${entry.dict_id})" class="dict-vote-btn ${fb.my_vote === 'up' ? 'dict-vote-active-up' : ''}">
                        <i class="fa-solid fa-thumbs-up"></i> ${fb.upvotes}
                    </button>
                    <button type="button" onclick="dictVoteFeedback(${fb.feedback_id},'down',${entry.dict_id})" class="dict-vote-btn ${fb.my_vote === 'down' ? 'dict-vote-active-down' : ''}">
                        <i class="fa-solid fa-thumbs-down"></i> ${fb.downvotes}
                    </button>
                </div>
            </div>
        </div>`;
    };
    const feedbackList = (entry.feedback || []).map(feedbackItem).join('') || '<p class="text-slate-400 text-sm italic py-2">Chưa có góp ý nào — hãy là người đầu tiên!</p>';
    const feedbackComposer = entry.is_logged_in
        ? `<div class="flex items-start gap-2 mt-3">
             <textarea id="dict-feedback-input" rows="2" placeholder="Thêm nghĩa, ví dụ hoặc góp ý cho từ này..." class="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"></textarea>
             <button type="button" onclick="dictSubmitFeedback(${entry.dict_id})" class="shrink-0 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:opacity-90"><i class="fa-solid fa-paper-plane"></i></button>
           </div>`
        : `<div class="mt-3 text-center text-xs font-bold text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl py-3">Đăng nhập để góp ý và vote cho từ này.</div>`;

    // Cột trái: điều hướng nhanh (anchor scroll mượt trong khung cuộn riêng)
    const navHtml = `
        <nav class="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-3 space-y-1">
            <a href="#sec-tu-vung"      class="dict-nav-link active" onclick="dictNavClick(event,this)">Từ vựng</a>
            <a href="#sec-tu-ghep"      class="dict-nav-link" onclick="dictNavClick(event,this)">Từ ghép</a>
            <a href="#sec-dong-nghia"   class="dict-nav-link" onclick="dictNavClick(event,this)">Đồng nghĩa / Trái nghĩa</a>
        </nav>`;

    // Cột phải: phân tích Hán tự + Nét bút/Tập viết tương tác (HanziWriter.js, đã load ở index.php).
    // Từ nhiều chữ có tab chuyển từng ký tự (giống ô "裝 修" của Hanzii).
    const strokeChars = Array.from(charMode === 'simplified' && entry.hanzi_simplified ? entry.hanzi_simplified : (getChar(entry.hanzi)));
    const charTabsHtml = strokeChars.length > 1
        ? `<div class="flex gap-1.5 mb-3 flex-wrap justify-center">${strokeChars.map((c, i) => `<button type="button" data-char-idx="${i}" onclick="dictSwitchStrokeChar(this,'${c}',${i})" class="dict-char-tab ${i === 0 ? 'active' : ''}">${c}</button>`).join('')}</div>`
        : '';
    const metaVal = (v) => v ? `<span class="font-bold text-slate-700">${v}</span>` : `<span class="text-slate-300 italic font-normal">Đang cập nhật</span>`;
    const charInfoHtml = `
        <aside class="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-5 flex flex-col items-center gap-3">
            <div class="w-full">
                <div class="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 text-center">Nét bút &amp; Tập viết</div>
                ${charTabsHtml}
                <div id="dict-stroke-target" class="w-full aspect-square rounded-xl border border-slate-100 bg-white flex items-center justify-center text-slate-300 text-xs"></div>
                <div class="flex gap-2 mt-2">
                    <button type="button" onclick="dictStrokeAnimate()" class="flex-1 text-xs font-bold text-slate-600 bg-white ring-1 ring-slate-200 rounded-lg py-2 hover:ring-primary hover:text-primary"><i class="fa-solid fa-play mr-1"></i>Xem nét</button>
                    <button type="button" onclick="dictStrokeQuiz()" class="flex-1 text-xs font-bold text-white bg-primary rounded-lg py-2 hover:opacity-90"><i class="fa-solid fa-pen-nib mr-1"></i>Tập viết</button>
                </div>
            </div>
            <button type="button" onclick="playTTS(encodeURIComponent('${entry.hanzi.replace(/'/g, "\\'")}'), event)" class="text-xs font-bold text-slate-500 hover:text-primary flex items-center gap-1.5">
                <i class="fa-solid fa-volume-high"></i> Nghe phát âm
            </button>
            <div class="w-full text-xs text-slate-500 space-y-2 mt-1 border-t border-slate-100 pt-3">
                <div class="flex justify-between"><span class="text-slate-400">Pinyin</span><span id="dict-meta-pinyin">${metaVal(entry.pinyin)}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Âm Hán Việt</span><span id="dict-meta-hanviet">${metaVal(entry.han_viet)}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Bộ thủ</span><span id="dict-meta-radical">${metaVal(entry.radical)}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Số nét</span><span id="dict-meta-strokes">${metaVal(entry.stroke_count ? (entry.stroke_count + ' nét') : null)}</span></div>
            </div>
        </aside>`;

    // Cột giữa: nội dung chính, đủ 7 section để nav trỏ tới.
    const mainHtml = `
        <main class="space-y-5">
            <div class="relative bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8">
                <div class="absolute top-6 right-6 sm:top-8 sm:right-8 flex items-center gap-1">
                    <button type="button" onclick="playTTS(encodeURIComponent('${entry.hanzi.replace(/'/g, "\\'")}'), event)" title="Nghe phát âm" class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 active:bg-primary active:text-white flex items-center justify-center transition-all border-0 outline-none shadow-2xs">
                        <i class="fa-solid fa-volume-high text-xs sm:text-sm pointer-events-none transition-transform"></i>
                    </button>
                    <button type="button" id="notebook-save-btn" data-dict-id="${entry.dict_id}" onclick="notebookSaveToggle(this)" title="Lưu vào sổ tay" class="w-8 h-8 rounded-full text-slate-400 hover:text-amber-500 hover:bg-slate-50 flex items-center justify-center transition-colors">
                        <i class="fa-regular fa-bookmark"></i>
                    </button>
                </div>
                <div class="pr-20">
                    <div class="mb-1.5">
                        <span class="font-black text-[#027AB3] dict-hanzi-big text-hanzi-xl">${dictDualOrtho(entry.hanzi, entry.hanzi_simplified)}</span>
                    </div>
                    <div class="flex items-center gap-2 flex-wrap text-base sm:text-lg mb-2.5">
                        ${entry.pinyin ? `<span class="text-slate-700 font-bold">${entry.pinyin}</span>` : ''}
                        ${entry.pinyin && entry.han_viet ? `<span class="text-slate-300">·</span>` : ''}
                        ${entry.han_viet ? `<span class="text-slate-700 font-black uppercase tracking-wide">${entry.han_viet}</span>` : ''}
                    </div>
                    <div class="flex flex-wrap items-center gap-1.5">
                        ${pastelLabels}
                    </div>
                    ${quickMeaningsHtml}
                </div>
            </div>

            <section id="sec-tu-vung" class="scroll-mt-24 bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8">
                <div class="text-slate-300 text-xs font-bold uppercase tracking-wider mb-3">Từ vựng</div>
                ${senses}
                <div class="dict-context-box mt-4" data-dict-id="${entry.dict_id}" data-loaded="0"></div>
            </section>

            <section id="sec-tu-ghep" class="scroll-mt-24 bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8">
                <div class="text-slate-300 text-xs font-bold uppercase tracking-wider mb-3">Từ ghép</div>
                ${related}
            </section>

            <section id="sec-dong-nghia" class="scroll-mt-24 bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8">
                <div class="text-slate-300 text-xs font-bold uppercase tracking-wider mb-3">Từ đồng nghĩa &amp; trái nghĩa</div>
                ${relationsHtml}
            </section>


        </main>`;

    box.innerHTML = `
        <div class="dict-3col">
            <div class="dict-nav-side hidden lg:block">${navHtml}</div>
            ${mainHtml}
            <div>${charInfoHtml}</div>
        </div>
    `;

    // Active state cho sidebar khi cuộn (chỉ desktop, dùng IntersectionObserver)
    dictSetupScrollSpy();

    dictCurrentEntry = entry;
    dictInitStrokeWriter(strokeChars[0]);

    const ctxBox = box.querySelector('.dict-context-box');
    if (ctxBox) dictLoadContextsInline(ctxBox);
}

// "Từ này trong hội thoại" — tái dùng API get_vocab_contexts (đã hỗ trợ sẵn nhận thẳng dict_id
// qua tham số vocab_id, tự fallback tra Dictionary khi không khớp Vocabularies) để hiện các câu
// hội thoại thực tế có chứa từ đang tra, giống hệt khối "Từ này trong hội thoại" ở tab Từ vựng.
async function dictLoadContextsInline(box) {
    if (!box || box.getAttribute('data-loaded') === '1') return;
    box.setAttribute('data-loaded', '1');
    const dictId = box.getAttribute('data-dict-id');
    if (!dictId) return;
    try {
        const res = await fetch(`/api.php?action=get_vocab_contexts&dict_id=${dictId}`);
        const json = await res.json();
        if (!json.success || !json.data || json.data.length === 0) return;
        const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        let html = `<span class="inline-block bg-amber-50 text-amber-600 font-bold text-[11px] px-2 py-1 rounded-md uppercase tracking-wider mb-3 border border-amber-100"><i class="fa-solid fa-comments mr-1"></i>Từ này trong hội thoại</span>`;
        json.data.forEach(ctx => {
            const hz = ctx.hanzi || '';
            let linesHtml = '';
            (ctx.lines || []).forEach(l => {
                const disp = esc(getChar(l.line || ''));
                const hzConv = getChar(hz);
                const marked = hzConv ? disp.split(esc(hzConv)).join(`<span class="dict-kw-hl">${esc(hzConv)}</span>`) : disp;
                linesHtml += `<div class="text-hanzi-md font-bold text-slate-800 dict-hanzi-big leading-relaxed">${marked}</div>`;
                if (l.vi) linesHtml += `<div class="text-base font-semibold text-primary mb-1.5">${esc(l.vi)}</div>`;
            });
            const firstLine = (ctx.lines && ctx.lines[0]) ? ctx.lines[0].line : '';
            const canJump = ctx.book_id && ctx.lesson_id && typeof window.tdJumpToLesson === 'function';
            html += `<div class="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 mb-3 last:mb-0 ${canJump ? 'cursor-pointer hover:bg-slate-100/60 active:scale-[0.99] transition-all' : ''}"
                ${canJump ? `onclick="window.tdJumpToLesson(${ctx.book_id}, ${ctx.lesson_id}, ${ctx.content_id}, ${JSON.stringify(firstLine)})"` : ''}>
                <div class="flex items-center justify-between gap-2 mb-2">
                    <div class="text-[10px] font-bold text-amber-600 uppercase tracking-widest">${esc(ctx.title || 'Hội thoại')}</div>
                    ${canJump ? '<i class="fa-solid fa-arrow-up-right-from-square text-amber-400 text-[10px]"></i>' : ''}
                </div>
                ${linesHtml}
            </div>`;
        });
        box.innerHTML = html;
    } catch (e) { box.setAttribute('data-loaded', '0'); }
}

// ============================================================
// Nét bút + Tập viết tương tác — dùng HanziWriter.js (đã tải sẵn ở index.php qua CDN
// jsdelivr, tự động lấy dữ liệu nét theo từng ký tự kể cả phồn thể). Từ nhiều chữ có
// tab chuyển ký tự; mỗi lần chuyển vẽ lại writer cho đúng ký tự đang chọn.
// ============================================================
let dictCurrentEntry = null;
let dictCurrentWriter = null;

// id "dict-stroke-target" có thể tồn tại 2 bản trên DOM (bản desktop ẩn qua CSS + bản trong
// drawer mobile) — chọn bản đang thực sự hiển thị để tránh vẽ nhầm vào khung bị ẩn.
function dictVisibleStrokeTarget() {
    const all = document.querySelectorAll('#dict-stroke-target');
    for (const el of all) { if (el.offsetParent !== null) return el; }
    return all[0] || null;
}

// Khởi tạo HanziWriter là tác vụ NẶNG (tải dữ liệu nét qua mạng + dựng canvas SVG), nên KHÔNG
// dựng ngay khi trang chi tiết render — chỉ hiện placeholder chữ tĩnh (rẻ, tức thì) trước, rồi
// dùng IntersectionObserver để dựng thật ngay khi khung "Nét bút & Tập viết" thực sự lọt vào
// khung nhìn (đa số trường hợp desktop vẫn nằm trong viewport nên vẫn hiện gần như tức thì, còn
// trên mobile/khi khối bị cuộn khuất thì hoãn hẳn tới khi cần, tránh chặn render trang chính).
let dictStrokeObserver = null;

function dictInitStrokeWriter(char) {
    const el = dictVisibleStrokeTarget();
    if (!el) return;
    el.innerHTML = `<span class="text-hanzi-2xl font-black text-slate-700 dict-hanzi-big flex items-center justify-center h-full">${char}</span>`;
    el.dataset.pendingChar = char;
    el.dataset.writerReady = '0';

    if (dictStrokeObserver) dictStrokeObserver.disconnect();
    setTimeout(() => { if (el && el.dataset.writerReady === '0') dictRealizeStrokeWriter(el, char); }, 60);
    if (typeof IntersectionObserver === 'undefined') { dictRealizeStrokeWriter(el, char); return; }
    dictStrokeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.dataset.writerReady === '0') {
                dictRealizeStrokeWriter(entry.target, entry.target.dataset.pendingChar);
            }
        });
    }, { threshold: 0.1 });
    dictStrokeObserver.observe(el);
}

function dictRealizeStrokeWriter(el, char) {
    if (!el || el.dataset.writerReady === '1' || typeof HanziWriter === 'undefined') return;
    el.dataset.writerReady = '1';
    el.innerHTML = '';
    try {
        dictCurrentWriter = HanziWriter.create(el, char, {
            width: el.clientWidth || 160,
            height: el.clientHeight || 160,
            padding: 10,
            strokeColor: '#c2410c',
            radicalColor: '#527bbe',
            showOutline: true,
            showCharacter: true,
            delayBetweenStrokes: 200,
            onLoadCharDataError: function () {
                el.innerHTML = `<span class="text-hanzi-2xl font-black text-slate-700 dict-hanzi-big flex items-center justify-center h-full">${char}</span>`;
            }
        });
    } catch (e) { dictCurrentWriter = null; }
}

function dictSwitchStrokeChar(btn, char, charIdx) {
    btn.parentElement.querySelectorAll('.dict-char-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    dictInitStrokeWriter(char);
    if (window.dictCurrentCharsInfo && window.dictCurrentCharsInfo.length) {
        const idx = (charIdx !== undefined) ? charIdx : parseInt(btn.dataset.charIdx || 0);
        const cInfo = window.dictCurrentCharsInfo[idx] || window.dictCurrentCharsInfo.find(c => c.char === char);
        if (cInfo) {
            const radEl = document.getElementById('dict-meta-radical');
            const strokeEl = document.getElementById('dict-meta-strokes');
            const hvEl = document.getElementById('dict-meta-hanviet');
            const metaVal = (v) => v ? `<span class="font-bold text-slate-700">${v}</span>` : `<span class="text-slate-300 italic font-normal">Đang cập nhật</span>`;
            if (radEl) radEl.innerHTML = metaVal(cInfo.radical_name || cInfo.radical);
            if (strokeEl) strokeEl.innerHTML = metaVal(cInfo.stroke_count ? (cInfo.stroke_count + ' nét') : null);
            if (hvEl) hvEl.innerHTML = metaVal(cInfo.han_viet ? cInfo.han_viet.toUpperCase() : null);
        }
    }
}

async function dictLookupOpenByHanzi(hanzi) {
    dictCloseDropdown();
    const emptyBox = document.getElementById('dict-lookup-empty');
    if (emptyBox) emptyBox.classList.add('hidden');
    const box = document.getElementById('dict-lookup-detail');
    if (box) {
        box.classList.remove('hidden');
        box.innerHTML = '<div class="text-center text-slate-400 py-16"><i class="fa-solid fa-spinner fa-spin text-2xl"></i></div>';
    }
    try {
        const res = await dictAuthedFetch(`/api.php?action=dict_lookup_detail&hanzi=${encodeURIComponent(hanzi)}`);
        const json = await res.json();
        if (json.success && json.data) {
            renderDictLookupDetail(json.data);
            if (json.data.dict_id) {
                window.history.pushState({ tab: 'dict-lookup', dict_id: json.data.dict_id }, '', `/dict-lookup?dict_id=${json.data.dict_id}`);
            }
        } else {
            const input = document.getElementById('dict-search-input');
            if (input) { input.value = hanzi; dictSearchInputChanged(); }
        }
    } catch (e) {
        if (box) box.innerHTML = '<div class="text-center text-slate-400 py-16">Không tìm thấy từ vựng</div>';
    }
}

// Bấm nút trước khi canvas kịp lazy-init (VD vừa mở trang, observer chưa kịp bắn) — dựng ngay
// tức thì thay vì im lặng bỏ qua thao tác của học viên.
function dictEnsureStrokeWriterReady() {
    const el = dictVisibleStrokeTarget();
    if (el && el.dataset.writerReady === '0') dictRealizeStrokeWriter(el, el.dataset.pendingChar);
}

function dictStrokeAnimate() {
    dictEnsureStrokeWriterReady();
    if (!dictCurrentWriter) return;
    dictCurrentWriter.showCharacter({ duration: 0 });
    dictCurrentWriter.animateCharacter();
}

function dictStrokeQuiz() {
    dictEnsureStrokeWriterReady();
    if (!dictCurrentWriter) return;
    dictCurrentWriter.quiz({ showHintAfterMisses: 2 });
}

function notebookSaveToggle(btn) {
    const dictId = btn.dataset.dictId;
    const icon = btn.querySelector('i');
    // Dùng chung popup "Chọn sổ tay" định nghĩa ở vocab_notebook_hub.php (luôn include cùng trang).
    if (typeof vnhOpenSaveModal !== 'function') { alert('Không mở được sổ tay. Vui lòng tải lại trang.'); return; }
    vnhOpenSaveModal(dictId, function () {
        icon.classList.remove('fa-regular'); icon.classList.add('fa-solid');
        btn.style.color = '#EAB942';
    });
}

// ============================================================
// Góp ý cộng đồng — vote (bắt buộc đăng nhập) + gửi góp ý mới. Sau khi thao tác thành công,
// tải lại chi tiết từ để đồng bộ số vote/danh sách mới nhất từ server (nguồn sự thật duy nhất).
// ============================================================
async function dictVoteFeedback(feedbackId, voteType, dictId) {
    try {
        const res = await fetch('/api.php?action=dict_feedback_vote', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback_id: feedbackId, vote_type: voteType })
        });
        const json = await res.json();
        if (!json.success) { alert(json.message || 'Có lỗi xảy ra.'); return; }
        dictLookupOpenDetail(dictId, false);
    } catch (e) { alert('Không thể kết nối server.'); }
}

async function dictSubmitFeedback(dictId) {
    const input = document.getElementById('dict-feedback-input');
    if (!input) return;
    const content = input.value.trim();
    if (!content) return;
    try {
        const res = await fetch('/api.php?action=dict_feedback_submit', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dict_id: dictId, content })
        });
        const json = await res.json();
        if (!json.success) { alert(json.message || 'Có lỗi xảy ra.'); return; }
        dictLookupOpenDetail(dictId, false);
    } catch (e) { alert('Không thể kết nối server.'); }
}

// "Xem thêm" dùng chung cho Phổ nghĩa và Từ ghép — hiện toàn bộ phần tử ẩn cùng selector
// trong phạm vi section cha rồi ẩn luôn nút bấm.
function dictToggleMore(btn, selector) {
    const scope = btn.closest('section') || document;
    scope.querySelectorAll(selector).forEach(el => el.classList.remove('hidden'));
    btn.remove();
}

// Bấm số thứ tự ở danh sách "Nghĩa tiếng Việt" trên đầu trang → cuộn mượt xuống đúng khối chi
// tiết tương ứng ở "Từ vựng" bên dưới. Nếu khối đó đang ẩn sau "Xem thêm" thì tự bung ra trước.
function dictScrollToSense(ev, n) {
    if (ev) ev.preventDefault();
    const el = document.getElementById('dict-sense-' + n);
    if (!el) return;
    if (el.classList.contains('hidden')) {
        document.querySelectorAll('#sec-tu-vung .dict-more-toggle').forEach(btn => dictToggleMore(btn, '.dict-more-sense'));
    }
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
}

function dictNavClick(ev, el) {
    ev.preventDefault();
    document.querySelectorAll('.dict-nav-link').forEach(a => a.classList.remove('active'));
    document.querySelectorAll(`.dict-nav-link[href="${el.getAttribute('href')}"]`).forEach(a => a.classList.add('active'));
    const target = document.querySelector(el.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function dictSetupScrollSpy() {
    const sections = document.querySelectorAll('#dict-lookup-detail section[id]');
    if (!sections.length || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            document.querySelectorAll('.dict-nav-link').forEach(a => a.classList.remove('active'));
            document.querySelectorAll(`.dict-nav-link[href="#${e.target.id}"]`).forEach(a => a.classList.add('active'));
        });
    }, { rootMargin: '-20% 0px -70% 0px' });
    sections.forEach(s => obs.observe(s));
}

// Cho phép mở trang này kèm sẵn 1 dict_id cụ thể (từ dropdown gợi ý ở Dashboard)
window.addEventListener('dict-lookup-open', (ev) => {
    const detail = ev.detail || {};
    if (detail.dict_id) { dictLookupOpenDetail(detail.dict_id); return; }
    if (detail.q) {
        const input = document.getElementById('dict-search-input');
        if (input) { input.value = detail.q; dictSearchDropdownRun(true); }
    }
});

// ============================================================
// Ô search từ điển dùng chung — gắn ở Trang chủ, Header (desktop + mobile) và tab Từ vựng.
// Mỗi ô truyền vào id input/dropdown riêng; gõ tới đâu gợi ý dropdown tới đó (toàn bộ
// 16.992+ từ trong Từ điển trung tâm, không giới hạn theo bài học đang chọn). Click 1 kết
// quả sẽ chuyển sang tab Từ điển và mở thẳng trang chi tiết từ đó.
// ============================================================
const dictQuickSearchTimers = {};
function dashDictSearchDebounced(inputId, dropdownId, clearBtnId) {
    inputId = inputId || 'dash-dict-search'; dropdownId = dropdownId || 'dash-dict-dropdown';
    const inp = document.getElementById(inputId);
    const btn = clearBtnId ? document.getElementById(clearBtnId) : (inp ? inp.parentElement?.querySelector('[id$="-clear"]') : null);
    if (btn && inp) {
        const hasVal = Boolean(inp.value && inp.value.trim().length > 0);
        btn.classList.toggle('hidden', !hasVal);
        btn.style.display = hasVal ? 'flex' : 'none';
    }
    clearTimeout(dictQuickSearchTimers[inputId]);
    dictQuickSearchTimers[inputId] = setTimeout(() => dashDictSearchRun(inputId, dropdownId), 200);
}
function dashDictClearInput(inputId, dropdownId, clearBtnId) {
    const inp = document.getElementById(inputId);
    if (inp) {
        inp.value = '';
        inp.focus();
    }
    const btn = clearBtnId ? document.getElementById(clearBtnId) : (inp ? inp.parentElement?.querySelector('[id$="-clear"]') : null);
    if (btn) {
        btn.classList.add('hidden');
        btn.style.display = 'none';
    }
    dashDictSearchClose(dropdownId);
}
function dashDictSearchClose(dropdownId) {
    const dd = document.getElementById(dropdownId || 'dash-dict-dropdown');
    if (dd) dd.classList.add('hidden');
}
function dashDictSearchEnter(inputId, dropdownId) {
    const dd = document.getElementById(dropdownId || 'dash-dict-dropdown');
    if (!dd || dd.classList.contains('hidden')) return;
    const firstBtn = dd.querySelector('button');
    if (firstBtn) firstBtn.click();
}
const _dashDictCache = new Map();

async function dashDictSearchRun(inputId, dropdownId) {
    inputId = inputId || 'dash-dict-search'; dropdownId = dropdownId || 'dash-dict-dropdown';
    const input = document.getElementById(inputId);
    const dd = document.getElementById(dropdownId);
    if (!input || !dd) return;
    const q = input.value.trim();
    if (!q) { dd.classList.add('hidden'); dd.innerHTML = ''; return; }

    function renderDashResults(json) {
        const entries = (json.data || []).slice(0, 8);
        if (!entries.length) {
            dd.innerHTML = dictRenderAiTranslationFallback(json.ai_translation);
        } else {
            dd.innerHTML = entries.map(e => {
                const firstVi = e.first_meaning_vi || '';
                return `<button type="button" onclick="dashDictSearchPick(${e.dict_id},'${dropdownId}')"
                    class="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-b-0">
                    <span class="text-hanzi-sm font-black text-slate-800 dict-hanzi-big shrink-0">${dictDualOrtho(e.hanzi, e.hanzi_simplified)}</span>
                    <span class="min-w-0 flex-1">
                        <span class="block text-xs font-bold text-slate-500">${dictHighlightQuery(e.pinyin || '', q)}</span>
                        ${firstVi ? `<span class="block text-xs text-slate-400 truncate">${dictHighlightQuery(firstVi, q)}</span>` : ''}
                    </span>
                </button>`;
            }).join('');
        }
        dd.classList.remove('hidden');
    }

    if (_dashDictCache.has(q)) {
        renderDashResults(_dashDictCache.get(q));
        return;
    }

    try {
        const res = await dictAuthedFetch(`/api.php?action=dict_lookup_search&q=${encodeURIComponent(q)}`);
        const json = await res.json();
        _dashDictCache.set(q, json);
        if (_dashDictCache.size > 80) {
            const firstK = _dashDictCache.keys().next().value;
            _dashDictCache.delete(firstK);
        }
        renderDashResults(json);
    } catch (e) { dd.classList.add('hidden'); }
}
function dashDictSearchPick(dictId, dropdownId) {
    dashDictSearchClose(dropdownId);
    document.querySelectorAll('.header-dict-panel').forEach(p => p.classList.add('hidden'));
    const bottomNav = document.getElementById('mobile-bottom-nav');
    if (bottomNav) bottomNav.classList.remove('hidden');
    document.body.classList.remove('search-open-mobile');
    if (typeof switchTab === 'function') switchTab('dict-lookup');
    setTimeout(() => window.dispatchEvent(new CustomEvent('dict-lookup-open', { detail: { dict_id: dictId } })), 150);
}

// Ô search Header: gọn 1 icon trên header, bấm mới bung panel search (không chiếm thêm dòng nào).
function toggleHeaderDictSearch(panelId, inputId) {
    document.querySelectorAll('.header-dict-panel').forEach(p => { if (p.id !== panelId) p.classList.add('hidden'); });
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const opening = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');
    const bottomNav = document.getElementById('mobile-bottom-nav');
    if (opening) {
        if (panelId === 'header-dict-mobile-panel') {
            if (bottomNav) bottomNav.classList.add('hidden');
            document.body.classList.add('search-open-mobile');
        }
        setTimeout(() => {
            const inp = document.getElementById(inputId);
            if (inp) {
                inp.focus();
                const clr = panel.querySelector('[id$="-clear"]');
                if (clr) clr.classList.toggle('hidden', !inp.value.trim());
            }
        }, 50);
    } else {
        if (panelId === 'header-dict-mobile-panel') {
            if (bottomNav) bottomNav.classList.remove('hidden');
            document.body.classList.remove('search-open-mobile');
        }
    }
}
document.addEventListener('click', (ev) => {
    document.querySelectorAll('.header-dict-panel').forEach(panel => {
        const btn = panel.previousElementSibling;
        if (!panel.contains(ev.target) && !(btn && btn.contains(ev.target))) {
            panel.classList.add('hidden');
            if (panel.id === 'header-dict-mobile-panel') {
                const bottomNav = document.getElementById('mobile-bottom-nav');
                if (bottomNav) bottomNav.classList.remove('hidden');
                document.body.classList.remove('search-open-mobile');
            }
        }
    });
});
document.addEventListener('click', (ev) => {
    ['dash-dict', 'header-dict-desktop', 'header-dict-mobile', 'vocab-dict'].forEach(prefix => {
        const box = document.getElementById(`${prefix}-search`);
        const dd = document.getElementById(`${prefix}-dropdown`);
        if (!box || !dd) return;
        if (!box.contains(ev.target) && !dd.contains(ev.target)) dd.classList.add('hidden');
    });
});
