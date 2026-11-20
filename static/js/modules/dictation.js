(function () {
    let lessonItems = [], videos = [], topics = [], filterTopic = '';
    let savedDictLibraryScroll = 0;
    let cur = null, cues = [], curCueIdx = 0;
    let player = null, audioEl = null, isAudioMode = false;
    let poll = null, loopSentence = false, playUntil = null;
    let dictShowVi = false, dictInputMode = 'type';
    let tileState = {};
    let scoredCount = 0, correctCount = 0;

    const gc = (s) => (typeof getChar === 'function' ? getChar(s || '') : (s || ''));
    const esc = (s) => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };
    const normHanzi = (s) => (String(s || '').match(/[一-龥]/g) || []).join('');
    const fmtTime = (s) => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    const thumbOf = (v) => {
        if (v.thumbnail && v.thumbnail.trim()) return v.thumbnail;
        if (v.youtube_id) return `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`;
        return '';
    };

    // ================= THƯ VIỆN =================
    let dictCurrentFilterType = 'all';
    let dictAllLessonItems = [];
    let dictBooksList = [];
    let dictLessonsList = [];

    window.dictFilterType = function(type) {
        dictCurrentFilterType = type;
        ['all', 'dialogue', 'paragraph'].forEach(t => {
            const btn = document.getElementById('dict-btn-filter-' + t);
            if (!btn) return;
            if (t === type) {
                btn.className = 'px-2.5 py-1 text-xs font-bold rounded-lg bg-white text-primary shadow-xs transition-all';
            } else {
                btn.className = 'px-2.5 py-1 text-xs font-bold rounded-lg text-slate-600 hover:text-primary transition-all';
            }
        });
        filterAndRenderLessonGrid();
    };

    function filterAndRenderLessonGrid() {
        const wrap = document.getElementById('dict-lesson-grid-wrap');
        const countEl = document.getElementById('dict-lesson-count');
        if (!wrap) return;

        const curLessonId = window.currentLessonId || null;
        lessonItems = curLessonId 
            ? dictAllLessonItems.filter(d => d.lesson_id == curLessonId)
            : dictAllLessonItems;

        if (countEl) countEl.textContent = lessonItems.length;

        if (!lessonItems.length) {
            wrap.innerHTML = '<div class="text-center text-slate-400 py-10 text-sm">Không có nội dung bài học nào.</div>';
            return;
        }
        wrap.innerHTML = `<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">${lessonItems.map((d, i) => lessonCardHTML(d, i)).join('')}</div>`;
    }

    async function initDictLessonSelectors() {
        const wrap = document.getElementById('dict-lesson-grid-wrap');
        if (!wrap) return;
        wrap.innerHTML = '<div class="text-center text-slate-400 py-10 text-sm"><i class="fa-solid fa-spinner fa-spin mr-2 text-primary"></i>Đang tải hội thoại & bài khóa…</div>';
        
        try {
            const r = await fetch('/api.php?action=get_all_dictation_contents');
            const j = await r.json();
            dictAllLessonItems = (j && j.success && Array.isArray(j.data)) ? j.data : [];
            filterAndRenderLessonGrid();
        } catch (e) {
            wrap.innerHTML = '<div class="text-center text-rose-500 py-10 text-sm">Lỗi tải nội dung.</div>';
        }
    }



    window.initDictationTab = function () {
        initDictLessonSelectors();
        loadTopics();
        loadVideos();
    };

    window.addEventListener('lessonChanged', () => {
        if (window.currentTab === 'dictation') {
            filterAndRenderLessonGrid();
        }
    });

    function renderLessonGrid() {
        const srcData = (typeof window.rawKaraokeData !== 'undefined' && Array.isArray(window.rawKaraokeData))
            ? window.rawKaraokeData
            : ((typeof rawKaraokeData !== 'undefined' && Array.isArray(rawKaraokeData)) ? rawKaraokeData : []);
        dictAllLessonItems = srcData.filter(d => d.type === 'dialogue' || d.type === 'paragraph' || d.type === 'passage' || !d.type);
        filterAndRenderLessonGrid();
    }

    function lessonCardHTML(d, i) {
        const isDialogue = d.type === 'dialogue';
        const tag = isDialogue ? 'Hội thoại' : 'Bài khóa';
        const icon = isDialogue ? 'fa-comments' : 'fa-align-left';
        const sub = d.dropdown_option || (isDialogue ? 'Hội thoại bài học' : 'Bài đọc chính khóa');
        return `
        <button onclick="dictOpenLesson(${i})" class="group text-left bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-soft hover:-translate-y-1 transition-all duration-200">
            <div class="relative w-full aspect-video overflow-hidden bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center p-3">
                <span class="absolute top-3 left-3 z-10 text-[10px] font-black px-2 py-1 rounded-md bg-accent text-brandNavy shadow-sm">${tag}</span>
                <i class="fa-solid ${icon} text-white/40 text-3xl"></i>
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"><div class="w-12 h-12 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-lg"><i class="fa-solid fa-headphones"></i></div></div>
            </div>
            <div class="p-4">
                <div class="font-tc font-black text-brandNavy text-base leading-snug line-clamp-2">${esc(gc(d.title || tag))}</div>
                <div class="text-[11px] text-slate-400 font-semibold mt-1 flex items-center gap-1.5"><i class="fa-solid fa-book-open text-[10px]"></i> ${esc(sub)}</div>
            </div>
        </button>`;
    }

    async function loadTopics() {
        if (topics && topics.length > 0) { renderTopicChips(); return; }
        try { const r = await fetch('/api.php?action=get_shadowing_topics'); const j = await r.json(); topics = j.success ? (j.data || []) : []; }
        catch (e) { topics = []; }
        renderTopicChips();
    }
    function chip(label, active, onclick, count) {
        const cls = active ? 'bg-primary text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-td-lightBlue hover:text-primary';
        const badge = (count != null) ? `<span class="ml-1 opacity-60">(${count})</span>` : '';
        return `<button onclick="${onclick}" class="px-4 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95 ${cls}">${esc(label)}${badge}</button>`;
    }
    function renderTopicChips() {
        let html = `<h3 class="w-full font-black text-brandNavy text-lg mb-1">Video &amp; bài luyện nghe (Shadowing)</h3>`;
        html += chip('Tất cả', filterTopic === '', `dictSetTopic('')`);
        topics.forEach(t => { html += chip(t.topic, filterTopic === t.topic, `dictSetTopic('${esc(t.topic).replace(/'/g, "\\'")}')`, t.cnt); });
        document.getElementById('dict-topic-chips').innerHTML = html;
    }
    window.dictSetTopic = function (t) { filterTopic = t; renderTopicChips(); renderVideoGrid(); };

    async function loadVideos() {
        if (videos && videos.length > 0) { renderVideoGrid(); return; }
        try { const r = await fetch('/api.php?action=get_shadowing_videos'); const j = await r.json(); videos = j.success ? (j.data || []) : []; }
        catch (e) { videos = []; }
        renderVideoGrid();
    }
    function coverHTML(v) {
        const thumb = thumbOf(v);
        return thumb
            ? `<img src="${esc(thumb)}" alt="" loading="lazy" onerror="this.style.display='none'" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">`
            : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primaryDark p-3">
                   <span class="font-tc font-black text-white/95 text-sm leading-snug line-clamp-3 text-center">${esc(gc(v.title))}</span>
               </div>`;
    }
    function videoCardHTML(v) {
        const lv = v.hsk_level ? `<span class="absolute top-3 left-3 z-10 text-[10px] font-black px-2 py-1 rounded-md bg-accent text-brandNavy shadow-sm">${esc(v.hsk_level)}</span>` : '';
        const seg = v.segments ? `${v.segments} câu` : 'Chưa có phụ đề';
        return `
        <button onclick="dictOpenVideo(${v.id})" class="group text-left bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-soft hover:-translate-y-1 transition-all duration-200">
            <div class="relative w-full aspect-video overflow-hidden bg-gradient-to-br from-td-lightBlue/40 to-primary/20">
                ${lv}${coverHTML(v)}
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"><div class="w-12 h-12 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-lg"><i class="fa-solid fa-headphones"></i></div></div>
            </div>
            <div class="p-4">
                <div class="font-tc font-black text-brandNavy text-base leading-snug line-clamp-2 mb-1">${esc(gc(v.title))}</div>
                <div class="text-[11px] text-slate-400 font-semibold flex items-center gap-1"><i class="fa-solid fa-list-ul"></i> ${seg}</div>
            </div>
        </button>`;
    }
    function renderVideoGrid() {
        const wrap = document.getElementById('dict-video-grid-wrap');
        const list = videos.filter(v => (!filterTopic || v.topic === filterTopic));
        if (!list.length) { wrap.innerHTML = '<div class="text-center text-slate-400 py-16 text-sm">Chưa có video phù hợp bộ lọc.</div>'; return; }
        wrap.innerHTML = `<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">${list.map(videoCardHTML).join('')}</div>`;
    }

    // ================= MỞ NỘI DUNG =================
    // Nguồn "Hội thoại/bài khóa": dùng lại prepareDialogueData()/prepareDictationPassage() đã có
    // sẵn trong karaoke.php để ghép thời gian audio theo từng câu — không viết lại logic đó.
    window.dictOpenLesson = function (i) {
        let data = lessonItems[i];
        if (!data) return;
        // script_json gốc canh theo audio TTS cũ, không khớp timeline video YouTube thật —
        // dùng video_script_json (đã đo riêng theo video) khi có youtube_id.
        if (data.youtube_id && Array.isArray(data.video_script_json) && data.video_script_json.length > 0) {
            data = Object.assign({}, data, { script_json: data.video_script_json });
        }
        let lines = (data.type === 'dialogue') ? prepareDialogueData(data) : prepareDictationPassage(data);
        if (!lines || lines.length === 0) {
            if (Array.isArray(data.script_json) && data.script_json.length > 0) {
                lines = data.script_json.map(s => ({
                    speaker: '',
                    text: (typeof getChar === 'function' ? getChar(s.text) : s.text),
                    vi: '',
                    startTime: s.start_time != null ? s.start_time : 0,
                    endTime: s.end_time != null ? s.end_time : 0
                }));
            }
        }
        cur = {
            source: 'karaoke', id: data.id, title: data.title || (data.type === 'dialogue' ? 'Hội thoại' : 'Bài khóa'),
            badge: data.type === 'dialogue' ? 'Hội thoại' : 'Bài khóa', youtube_id: data.youtube_id || null, audio_url: data.audio_url,
            video_start_offset: data.video_start_offset || 0
        };
        cues = lines.map(l => ({ text: l.text, _vi: l.vi || '', start_time: l.startTime, end_time: l.endTime }));
        openDetail();
    };

    window.dictOpenVideo = async function (id) {
        try {
            const r = await fetch('/api.php?action=get_shadowing_video&id=' + encodeURIComponent(id));
            const j = await r.json();
            if (!j.success) return;
            const d = j.data;
            cur = { source: 'shadowing', id: d.id, title: d.title, badge: d.hsk_level || 'Video luyện nghe', youtube_id: d.youtube_id, audio_url: d.audio_url };
            const viLines = d.vietnamese ? String(d.vietnamese).split('\n') : [];
            const raw = Array.isArray(d.script_json) ? d.script_json : [];
            cues = raw.map((c, idx) => ({ text: c.text, _vi: viLines[idx] || '', start_time: c.start_time, end_time: c.end_time }));
            openDetail();
            fetch('/api.php?action=bump_shadowing_video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => {});
        } catch (e) { console.error(e); }
    };

    function openDetail() {
        curCueIdx = 0; playUntil = null; tileState = {}; scoredCount = 0; correctCount = 0;
        document.getElementById('dt-title').textContent = gc(cur.title);
        document.getElementById('dt-badge').textContent = cur.badge || '';

        const mc = document.getElementById('mainContent');
        if (!document.getElementById('dict-library').classList.contains('hidden') && mc) {
            savedDictLibraryScroll = mc.scrollTop;
        }

        document.getElementById('dict-library').classList.add('hidden');
        document.getElementById('dict-detail').classList.remove('hidden');

        if (mc) {
            mc.scrollTo({ top: 0, behavior: 'instant' });
            mc.scrollTop = 0;
        }
        window.scrollTo(0, 0);
        requestAnimationFrame(() => {
            if (mc) {
                mc.scrollTo({ top: 0, behavior: 'instant' });
                mc.scrollTop = 0;
            }
        });
        setTimeout(() => {
            if (mc) {
                mc.scrollTo({ top: 0, behavior: 'instant' });
                mc.scrollTop = 0;
            }
        }, 60);

        const cueListEl = document.getElementById('dt-cue-list');
        if (cueListEl) {
            cueListEl.scrollTo({ top: 0, behavior: 'instant' });
            cueListEl.scrollTop = 0;
        }

        const mediaEl = document.getElementById('dt-media-sticky');
        if (mediaEl) mediaEl.classList.remove('dt-hide-title');
        lastDictCueScrollY = 0;
        lastDictPageScrollY = 0;

        updateModeButtons();
        renderCueList();
        bindDictCueListAutoHide();
        bindDictPageAutoHide();
        updateCurrentPanel();
        setupPlayer();
        fitDictCueListHeight();
    }

    window.dictStopAll = function () {
        try { stopPoll(); } catch (e) {}
        try { if (media.ready()) media.stop(); } catch (e) {}
    };
    window.dictBackToLibrary = function () {
        window.dictStopAll();
        document.getElementById('dict-detail').classList.add('hidden');
        document.getElementById('dict-library').classList.remove('hidden');
        const mc = document.getElementById('mainContent');
        if (mc && savedDictLibraryScroll) {
            mc.scrollTo({ top: savedDictLibraryScroll, behavior: 'instant' });
            mc.scrollTop = savedDictLibraryScroll;
            requestAnimationFrame(() => {
                if (mc) {
                    mc.scrollTo({ top: savedDictLibraryScroll, behavior: 'instant' });
                    mc.scrollTop = savedDictLibraryScroll;
                }
            });
        }
        renderLessonGrid();
    };

    // ================= DANH SÁCH CÂU CHÉP CHÍNH TẢ =================
    function updateModeButtons() {
        const tBtn = document.getElementById('dt-mode-type'), gBtn = document.getElementById('dt-mode-tiles');
        tBtn.className = 'flex-1 h-9 rounded-lg text-xs font-bold transition-all ' + (dictInputMode === 'type' ? 'bg-white shadow-sm text-primary' : 'text-slate-500');
        gBtn.className = 'flex-1 h-9 rounded-lg text-xs font-bold transition-all ' + (dictInputMode === 'tiles' ? 'bg-white shadow-sm text-primary' : 'text-slate-500');
    }
    window.dictSetInputMode = function (m) {
        dictInputMode = m;
        updateModeButtons();
        renderCueList();
    };
    window.dictToggleVi = function () {
        dictShowVi = !!document.getElementById('dt-vi-toggle').checked;
        document.querySelectorAll('.dt-vi').forEach(el => el.classList.toggle('hidden', !dictShowVi));
        requestAnimationFrame(() => {
            const activeEl = document.getElementById('dt-cue-' + curCueIdx);
            if (activeEl) {
                activeEl.classList.add('dt-cue-active');
                scrollDictCueIntoPosition(activeEl);
            }
        });
    };

    function shuffleArr(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
    function getTileState(idx) {
        if (!tileState[idx]) {
            const chars = normHanzi(cues[idx].text).split('');
            tileState[idx] = { answer: chars, bankOrder: shuffleArr(chars.map((_, i) => i)), order: [] };
        }
        return tileState[idx];
    }

    function cueCardHTML(c, i) {
        const active = i === curCueIdx;
        const vi = c._vi ? `<div id="dt-vi-${i}" class="dt-vi ${dictShowVi ? '' : 'hidden'} text-[13px] text-slate-500 mt-2 pt-2 border-t border-slate-100 leading-relaxed">${esc(c._vi)}</div>` : '';
        const bodyHTML = dictInputMode === 'tiles' ? tileBodyHTML(i) : typeBodyHTML(i);
        return `<div class="dt-cue rounded-2xl border px-4 py-3.5 transition-all ${active ? 'border-primary bg-td-lightBlue/10 shadow-sm dt-cue-active' : 'border-slate-100 bg-white hover:border-slate-200'}" id="dt-cue-${i}" data-idx="${i}" onclick="if(!event.target.closest('button,input'))dictGoCue(${i})">
            <div class="flex items-center justify-between mb-3">
                <span class="text-[11px] font-black text-slate-300">Câu #${i + 1}</span>
                <button onclick="dictPlayCue(${i})" class="h-8 px-3 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center gap-1.5 hover:bg-primary/20 active:scale-95 transition-all outline-none">
                    <i class="fa-solid fa-volume-high"></i> Nghe
                </button>
            </div>
            <div id="dt-body-${i}" class="w-full">${bodyHTML}</div>
            <div class="flex items-center gap-2 mt-3">
                ${dictInputMode === 'type' ? `<button onclick="dictCheckType(${i})" class="h-9 px-4 rounded-lg bg-primary text-white font-bold text-xs active:scale-95 transition-all outline-none">Kiểm tra</button>` : ''}
                <button id="dt-reveal-btn-${i}" onclick="dictRevealCue(${i})" class="dt-reveal-btn h-9 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 active:scale-95 transition-all outline-none">Hiện đáp án</button>
                <span id="dt-score-${i}" class="ml-auto text-xs font-bold"></span>
            </div>
            <div id="dt-result-${i}" class="hidden mt-3 pt-3 border-t border-slate-100 text-[20px] font-tc leading-relaxed"></div>
            ${vi}
        </div>`;
    }
    function typeBodyHTML(i) {
        return `<div class="relative w-full">
            <input type="text" id="dt-input-${i}" placeholder="Gõ chữ Hán bạn nghe được..."
                class="w-full border-2 border-slate-200 focus:border-primary rounded-xl px-4 py-3 pr-10 text-[20px] sm:text-[22px] font-tc text-brandNavy bg-white shadow-xs focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300 placeholder:text-sm sm:placeholder:text-base placeholder:font-sans"
                autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                onfocus="if(curCueIdx !== ${i}) setCurCue(${i}, false);"
                oninput="const clr=document.getElementById('dt-clear-${i}');if(clr)clr.classList.toggle('hidden',!this.value);"
                onkeydown="if(event.key==='Enter' && !event.isComposing && event.keyCode !== 229){event.preventDefault();dictCheckType(${i});}">
            <button id="dt-clear-${i}" type="button" onclick="const inp=document.getElementById('dt-input-${i}');if(inp){inp.value='';inp.focus();this.classList.add('hidden');}" title="Xóa gõ lại" class="hidden absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center text-xs transition-all outline-none">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>`;
    }
    function tileBodyHTML(i) {
        const st = getTileState(i);
        const slot = st.answer.map((_, pos) => {
            const id = st.order[pos];
            if (id === undefined) return `<span class="dt-tile inline-flex items-center justify-center w-11 h-11 rounded-xl border-2 border-dashed border-slate-200 text-slate-300 font-tc text-xl">?</span>`;
            return `<button type="button" onclick="dictTileRemove(${i},${pos})" class="dt-tile inline-flex items-center justify-center w-11 h-11 rounded-xl border-2 border-primary bg-primary/10 text-brandNavy font-tc text-xl active:scale-95 transition-all shadow-xs">${esc(st.answer[id])}</button>`;
        }).join('');
        const bank = st.bankOrder.filter(id => !st.order.includes(id))
            .map(id => `<button type="button" onclick="dictTileAdd(${i},${id})" class="dt-tile inline-flex items-center justify-center w-11 h-11 rounded-xl border border-slate-200 bg-white hover:border-primary hover:bg-primary/5 text-brandNavy font-tc text-xl active:scale-95 transition-all shadow-xs">${esc(st.answer[id])}</button>`).join('');
        const hasOrder = st.order.length > 0;
        return `
            <div class="relative flex flex-wrap gap-2 mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 min-h-[58px] items-center">
                ${slot}
                ${hasOrder ? `<button type="button" onclick="dictTileReset(${i})" class="ml-auto text-xs font-bold text-slate-400 hover:text-td-red px-2 py-1 rounded-lg hover:bg-slate-200/50 transition-all shrink-0" title="Ghép lại từ đầu"><i class="fa-solid fa-rotate-left mr-1"></i>Ghép lại</button>` : ''}
            </div>
            <div class="flex flex-wrap gap-2">${bank}</div>`;
    }

    window.dictTileReset = function (idx) {
        const st = getTileState(idx);
        st.order = [];
        rerenderCueBody(idx);
        const res = document.getElementById('dt-result-' + idx);
        if (res) res.classList.add('hidden');
        const sc = document.getElementById('dt-score-' + idx);
        if (sc) sc.innerHTML = '';
    };
    window.dictTileAdd = function (idx, id) {
        if (curCueIdx !== idx) setCurCue(idx, false);
        const st = getTileState(idx);
        if (st.order.includes(id)) return;
        st.order.push(id);
        rerenderCueBody(idx);
        if (st.order.length === st.answer.length) checkTileResult(idx);
    };
    window.dictTileRemove = function (idx, pos) {
        const st = getTileState(idx);
        st.order.splice(pos, 1);
        rerenderCueBody(idx);
        document.getElementById('dt-result-' + idx).classList.add('hidden');
        document.getElementById('dt-score-' + idx).innerHTML = '';
    };
    function rerenderCueBody(idx) {
        const body = document.getElementById('dt-body-' + idx);
        if (body) {
            body.innerHTML = tileBodyHTML(idx);
        } else {
            const card = document.getElementById('dt-cue-' + idx);
            if (!card) return;
            const bodyWrap = card.querySelector('.flex.flex-wrap.gap-2.mb-3')?.parentElement;
            if (bodyWrap) bodyWrap.innerHTML = tileBodyHTML(idx);
        }
    }
    function checkTileResult(idx) {
        const st = getTileState(idx);
        const ans = st.answer;
        let correct = 0, html = '';
        st.order.forEach((id, pos) => {
            const ch = ans[id];
            if (ch === ans[pos]) { correct++; html += `<span class="text-emerald-600 font-bold">${esc(ch)}</span>`; }
            else { html += `<span class="text-td-red font-bold border-b-2 border-td-red/40">${esc(ch)}</span>`; }
        });
        showScore(idx, correct, ans.length, html);
    }

    window.dictCheckType = function (idx) {
        const c = cues[idx]; if (!c) return;
        const ansRaw = normHanzi(c.text);
        const ansTarget = normHanzi(gc(c.text));
        const inpEl = document.getElementById('dt-input-' + idx);
        const inp = normHanzi(inpEl ? inpEl.value : '');
        let ans = ansTarget;
        if (ansRaw !== ansTarget) {
            let mRaw = 0, mTarget = 0;
            for (let i = 0; i < inp.length; i++) {
                if (inp[i] === ansRaw[i]) mRaw++;
                if (inp[i] === ansTarget[i]) mTarget++;
            }
            if (mRaw > mTarget) ans = ansRaw;
        }
        let correct = 0, html = '';
        for (let i = 0; i < ans.length; i++) {
            const a = ans[i], u = inp[i] || '';
            if (u === a) { correct++; html += `<span class="text-emerald-600 font-bold">${esc(a)}</span>`; }
            else html += `<span class="text-td-red font-bold border-b-2 border-td-red/40">${esc(a)}</span>`;
        }
        if (inp.length > ans.length) html += `<span class="text-slate-300 line-through">${esc(inp.slice(ans.length))}</span>`;
        showScore(idx, correct, ans.length, html);
    };

    function showScore(idx, correct, total, html) {
        const res = document.getElementById('dt-result-' + idx);
        res.innerHTML = html || '<span class="text-slate-400 text-sm">Không có chữ Hán để chấm.</span>';
        res.classList.remove('hidden');
        const btn = document.getElementById('dt-reveal-btn-' + idx);
        if (btn) btn.textContent = 'Hiện đáp án';
        const pct = total ? Math.round(correct / total * 100) : 0;
        const score = document.getElementById('dt-score-' + idx);
        score.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${pct}% (${correct}/${total})`;
        score.className = 'ml-auto text-xs font-bold ' + (pct === 100 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-td-red');

        scoredCount++; if (pct === 100) correctCount++;
        document.getElementById('dt-progress-summary').textContent = `Đã kiểm tra ${scoredCount}/${cues.length} câu · ${correctCount} câu đúng 100%.`;

        if (pct === 100 && total > 0) {
            window._dictRewarded = window._dictRewarded || new Set();
            const key = (cur ? cur.source + ':' + cur.id : 'x') + ':' + idx;
            if (!window._dictRewarded.has(key) && typeof recordLearningActivity === 'function') {
                window._dictRewarded.add(key);
                recordLearningActivity('dictation');
            }
        }
    }

    window.dictRevealCue = function (idx) {
        const c = cues[idx]; if (!c) return;
        const res = document.getElementById('dt-result-' + idx);
        const btn = document.getElementById('dt-reveal-btn-' + idx);
        if (!res) return;
        const isShowing = !res.classList.contains('hidden') && btn && btn.textContent.trim() === 'Ẩn đáp án';
        if (isShowing) {
            res.classList.add('hidden');
            if (btn) btn.textContent = 'Hiện đáp án';
        } else {
            res.innerHTML = `<span class="text-brandNavy">${esc(gc(c.text))}</span>`;
            res.classList.remove('hidden');
            if (btn) btn.textContent = 'Ẩn đáp án';
        }
    };

    let _isDtAutoScrolling = false;
    let _dtAutoScrollTimer = null;
    let lastDictCueScrollY = 0;
    let _dtCueRaf = null;
    function bindDictCueListAutoHide() {
        const list = document.getElementById('dt-cue-list');
        const media = document.getElementById('dt-media-sticky');
        if (!list || !media || list.dataset.autohide === '1') return;
        list.dataset.autohide = '1';
        list.addEventListener('scroll', () => {
            if (_isDtAutoScrolling) return; // Không can thiệp khi hệ thống đang tự cuộn
            if (_dtCueRaf) return;
            _dtCueRaf = requestAnimationFrame(() => {
                _dtCueRaf = null;
                const y = list.scrollTop;
                const diff = y - lastDictCueScrollY;
                if (diff > 20 && y > 40) {
                    if (!media.classList.contains('dt-hide-title')) media.classList.add('dt-hide-title');
                } else if (y <= 15 || diff < -25) {
                    if (media.classList.contains('dt-hide-title')) media.classList.remove('dt-hide-title');
                }
                lastDictCueScrollY = y;
            });
        }, { passive: true });
    }

    let lastDictPageScrollY = 0;
    let _dtPageRaf = null;
    function bindDictPageAutoHide() {
        const handleScroll = (y) => {
            const detail = document.getElementById('dict-detail');
            if (!detail || detail.classList.contains('hidden')) return;
            const media = document.getElementById('dt-media-sticky');
            if (!media || _isDtAutoScrolling) return;
            const diff = y - lastDictPageScrollY;
            if (diff > 25 && y > 45) {
                if (!media.classList.contains('dt-hide-title')) media.classList.add('dt-hide-title');
            } else if (y <= 15 || diff < -30) {
                if (media.classList.contains('dt-hide-title')) media.classList.remove('dt-hide-title');
            }
            lastDictPageScrollY = y;
        };

        const mc = document.getElementById('mainContent');
        if (mc && !window._dtMcScrollBound) {
            window._dtMcScrollBound = true;
            mc.addEventListener('scroll', () => {
                if (_dtPageRaf) return;
                _dtPageRaf = requestAnimationFrame(() => {
                    _dtPageRaf = null;
                    handleScroll(mc.scrollTop || 0);
                });
            }, { passive: true });
        }
    }

    // Cuộn TRONG khung danh sách: luôn đưa câu đang phát lên vị trí tiêu điểm đọc (khoảng 28% từ đỉnh)
    // giúp người học theo dõi liên tục, thấy rõ câu hiện tại và 2-3 câu tiếp theo mà không bị giật cục.
    function scrollDictCueIntoPosition(el, immediate = false) {
        const list = document.getElementById('dt-cue-list');
        if (!el || !list) return;

        // Vị trí tiêu điểm đọc tối ưu (~28% từ đỉnh danh sách câu)
        const targetOffset = Math.max(16, (list.clientHeight - el.offsetHeight) * 0.28);
        const targetScrollTop = Math.max(0, el.offsetTop - targetOffset);

        // Tự động thu gọn tiêu đề của media khi câu phát cuộn xuống tiếp theo để tối ưu diện tích hiển thị
        const media = document.getElementById('dt-media-sticky');
        if (media) {
            if (targetScrollTop > 20 || curCueIdx > 0) {
                if (!media.classList.contains('dt-hide-title')) media.classList.add('dt-hide-title');
            } else if (targetScrollTop <= 10 && curCueIdx === 0) {
                if (media.classList.contains('dt-hide-title')) media.classList.remove('dt-hide-title');
            }
        }
        lastDictCueScrollY = targetScrollTop;

        // Chỉ cuộn nếu độ lệch vượt quá ngưỡng nhỏ (8px) để tránh rung lắc vi mô
        if (Math.abs(list.scrollTop - targetScrollTop) > 8) {
            _isDtAutoScrolling = true;
            list.scrollTo({
                top: targetScrollTop,
                behavior: immediate ? 'auto' : 'smooth'
            });
            clearTimeout(_dtAutoScrollTimer);
            _dtAutoScrollTimer = setTimeout(() => {
                _isDtAutoScrolling = false;
                lastDictCueScrollY = list.scrollTop;
            }, 380);
        }
    }

    function renderCueList() {
        const el = document.getElementById('dt-cue-list');
        if (!cues.length) { el.innerHTML = '<div class="text-center text-slate-400 py-6 text-sm">Nội dung này chưa có dữ liệu để chép chính tả.</div>'; document.getElementById('dt-progress').textContent = '0/0'; return; }
        document.getElementById('dt-progress').textContent = `${curCueIdx + 1}/${cues.length}`;
        el.innerHTML = cues.map((c, i) => cueCardHTML(c, i)).join('');
        bindDictCueListAutoHide();
        requestAnimationFrame(() => {
            fitDictCueListHeight();
            const activeEl = document.getElementById('dt-cue-' + curCueIdx);
            if (activeEl) {
                activeEl.classList.add('dt-cue-active', 'border-primary', 'bg-td-lightBlue/10');
                scrollDictCueIntoPosition(activeEl, true);
            }
        });
    }

    function highlightCue(i) {
        document.querySelectorAll('.dt-cue').forEach(el => el.classList.remove('dt-cue-active', 'border-primary', 'bg-td-lightBlue/10'));
        const el = document.getElementById('dt-cue-' + i);
        if (el) {
            el.classList.add('dt-cue-active', 'border-primary', 'bg-td-lightBlue/10');
            scrollDictCueIntoPosition(el);
        }
        document.getElementById('dt-progress').textContent = `${i + 1}/${cues.length}`;
    }
    function updateCurrentPanel() { /* placeholder for future extensions */ }

    // Tính toán mốc thời gian an toàn để tránh nuốt âm đầu / cụt âm đuôi
    function getCueSafeStart(idx) {
        if (!cues[idx]) return 0;
        const rawStart = cues[idx].start_time > 0 ? cues[idx].start_time : 0;
        const prevEnd = (idx > 0 && cues[idx - 1] && cues[idx - 1].end_time > 0) ? cues[idx - 1].end_time : 0;
        // Đệm đầu: lùi 120ms để không bị nuốt âm đầu (phụ âm vô thanh b/p/m/f...), không lấn sang câu trước
        return Math.max(0, Math.max(prevEnd, rawStart - 0.12));
    }

    function getCueSafeEnd(idx) {
        if (!cues[idx]) return 3;
        const rawStart = cues[idx].start_time > 0 ? cues[idx].start_time : 0;
        const rawEnd = cues[idx].end_time > rawStart ? cues[idx].end_time : rawStart + 3;
        const nextStart = (idx < cues.length - 1 && cues[idx + 1] && cues[idx + 1].start_time > 0) ? cues[idx + 1].start_time : Infinity;
        // Đệm đuôi: nới 250ms để nghe trọn vẹn ngữ điệu và âm đuôi, không lấn sang câu sau
        return Math.min(rawEnd + 0.25, nextStart > rawEnd ? nextStart - 0.05 : rawEnd + 0.25);
    }

    function setCurCue(i, seek) {
        if (i < 0 || i >= cues.length) return;
        curCueIdx = i; highlightCue(i);
        if (seek && media.ready()) media.seek(getCueSafeStart(i));
    }
    window.dictGoCue = function (i) { setCurCue(i, true); };
    window.dictPrevCue = function () { setCurCue(curCueIdx - 1, true); };
    window.dictNextCue = function () { setCurCue(curCueIdx + 1, true); };
    window.dictReplayCue = function () { dictPlayCue(curCueIdx); };
    window.dictPlayCue = function (idx) {
        const c = cues[idx]; if (!c || !media.ready()) return;
        setCurCue(idx, false);
        const start = getCueSafeStart(idx);
        const end = getCueSafeEnd(idx);
        playUntil = end;
        media.seek(start);
        media.play();
    };
    window.dictToggleLoop = function () {
        loopSentence = !loopSentence;
        const b = document.getElementById('dt-loop-btn');
        b.className = 'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center active:scale-95 transition-all ' + (loopSentence ? 'bg-primary text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100');
    };

    // Player YouTube khởi tạo bất đồng bộ; nếu user bấm nghe 1 câu ngay lúc vừa mở bài
    // (player chưa kịp sẵn sàng), lưu lại yêu cầu để tự áp dụng khi onReady bắn ra.
    let ytPendingSeek = null;
    function onDtPlayerReady() {
        if (ytPendingSeek !== null) {
            const t = ytPendingSeek;
            ytPendingSeek = null;
            player.seekTo(t, true);
            player.playVideo();
        }
    }

    // ================= MEDIA ADAPTER (YouTube hoặc audio) =================
    const media = {
        play() { isAudioMode ? audioEl && audioEl.play().catch(() => {}) : player && player.playVideo(); },
        pause() { isAudioMode ? audioEl && audioEl.pause() : player && player.pauseVideo(); },
        seek(t) {
            if (isAudioMode) { if (audioEl) audioEl.currentTime = t; }
            else if (player && player.seekTo) player.seekTo(t, true);
            else ytPendingSeek = t;
        },
        time() { return isAudioMode ? (audioEl ? audioEl.currentTime : 0) : (player && player.getCurrentTime ? player.getCurrentTime() : 0); },
        duration() { return isAudioMode ? (audioEl ? audioEl.duration || 0 : 0) : (player && player.getDuration ? player.getDuration() : 0); },
        playing() { if (isAudioMode) return !!(audioEl && !audioEl.paused); return !!(player && player.getPlayerState && player.getPlayerState() === YT.PlayerState.PLAYING); },
        stop() { if (isAudioMode) { if (audioEl) { audioEl.pause(); } } else if (player && player.pauseVideo) { try { player.pauseVideo(); } catch (e) {} } },
        ready() { return isAudioMode ? !!audioEl : !!player; }
    };

    function setPlayBtn(playing) {
        const btn = document.getElementById('dt-play-btn');
        if (btn) btn.innerHTML = playing ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play ml-0.5"></i>';
    }
    function setupPlayer() {
        isAudioMode = !cur.youtube_id;
        document.getElementById('dt-video-wrap').classList.toggle('hidden', isAudioMode);
        document.getElementById('dt-audio-wrap').classList.toggle('hidden', !isAudioMode);
        if (isAudioMode) {
            if (player && player.pauseVideo) { try { player.pauseVideo(); } catch (e) {} }
            setupAudio();
        } else {
            if (audioEl) audioEl.pause();
            setupYouTube();
        }
    }
    function setupYouTube() {
        ytPendingSeek = null;
        loadYouTubeApiOnce(() => {
            const wrap = document.getElementById('dt-video-wrap');
            if (!wrap) return;
            if (!document.getElementById('dt-player')) {
                wrap.innerHTML = '<div id="dt-player" class="absolute inset-0 w-full h-full"></div>';
            }
            if (player && typeof player.loadVideoById === 'function') {
                try {
                    player.loadVideoById({ videoId: cur.youtube_id, startSeconds: Math.floor(cur.video_start_offset || 0) });
                    return;
                } catch(err) {
                    try { player.destroy(); } catch(e) {}
                    player = null;
                }
            }
            let pDiv = document.getElementById('dt-player');
            if (!pDiv || pDiv.tagName === 'IFRAME') {
                if (pDiv) pDiv.remove();
                pDiv = document.createElement('div');
                pDiv.id = 'dt-player';
                pDiv.className = 'absolute inset-0 w-full h-full';
                const firstChild = wrap.firstChild;
                wrap.insertBefore(pDiv, firstChild);
            }
            const appOrigin = window.location.origin || (window.location.protocol + '//' + window.location.host);
            player = new YT.Player('dt-player', {
                videoId: cur.youtube_id,
                playerVars: {
                    origin: appOrigin,
                    enablejsapi: 1,
                    start: Math.floor(cur.video_start_offset || 0),
                    rel: 0,
                    modestbranding: 1,
                    controls: 1,
                    fs: 1,
                    playsinline: 1,
                    'webkit-playsinline': 1,
                    iv_load_policy: 3,
                    cc_load_policy: 0,
                    disablekb: 0
                },
                events: {
                    onStateChange: onPlayerState,
                    onError: onPlayerError,
                    onReady: (e) => {
                        ensureIframePermissions(wrap);
                        onDtPlayerReady(e);
                    }
                }
            });
            setTimeout(() => { ensureIframePermissions(wrap); }, 300);
        });
    }
    function onPlayerState(e) {
        if (e.data === YT.PlayerState.PLAYING) { setPlayBtn(true); startPoll(); }
        else { setPlayBtn(false); if (e.data === YT.PlayerState.ENDED) stopPoll(); }
    }
    function onPlayerError(e) {
        console.warn('Dictation YouTube error:', e.data);
        if (![2, 5, 100, 101, 150].includes(e.data)) return;
        if (cur.audio_url && String(cur.audio_url).trim()) {
            cur.youtube_id = null;
            isAudioMode = true;
            document.getElementById('dt-video-wrap').classList.add('hidden');
            document.getElementById('dt-audio-wrap').classList.remove('hidden');
            setupAudio();
            return;
        }
        const wrap = document.getElementById('dt-video-wrap');
        if (wrap && cur.youtube_id) {
            wrap.innerHTML = '<div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/95 text-white z-10">' +
                '<i class="fa-brands fa-youtube text-red-500 text-4xl sm:text-5xl mb-3"></i>' +
                '<div class="font-bold text-sm sm:text-base mb-1">Video YouTube bị hạn chế nhúng trên thiết bị này</div>' +
                '<div class="text-xs text-slate-300 mb-4 max-w-sm">Chủ sở hữu video hoặc trình duyệt giới hạn phát trực tiếp trong ứng dụng. Bạn vẫn có thể mở xem trực tiếp trên YouTube hoặc tiếp tục luyện nghe chép chính tả.</div>' +
                '<div class="flex items-center gap-2 flex-wrap justify-center">' +
                    '<a href="https://www.youtube.com/watch?v=' + encodeURIComponent(cur.youtube_id) + '" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition-transform active:scale-95">' +
                        '<i class="fa-solid fa-arrow-up-right-from-square"></i> Mở trên YouTube' +
                    '</a>' +
                    '<button type="button" onclick="setupPlayer()" class="px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors">' +
                        '<i class="fa-solid fa-rotate-right"></i> Thử lại' +
                    '</button>' +
                '</div>' +
            '</div>';
        }
    }
    function setupAudio() {
        if (!audioEl) {
            audioEl = new Audio();
            audioEl.preload = 'metadata';
            audioEl.onplay = () => { setPlayBtn(true); startPoll(); };
            audioEl.onpause = () => { setPlayBtn(false); };
            audioEl.onended = () => { setPlayBtn(false); stopPoll(); };
            audioEl.onloadedmetadata = () => { document.getElementById('dt-audio-dur').textContent = fmtTime(audioEl.duration); };
            document.getElementById('dt-audio-progress').onclick = function (ev) {
                if (!audioEl.duration) return;
                media.seek((ev.offsetX / this.clientWidth) * audioEl.duration);
            };
        }
        try { if (typeof globalAudioPlayer !== 'undefined' && globalAudioPlayer) globalAudioPlayer.pause(); } catch (e) {}
        try { if (typeof karaokeAudio !== 'undefined' && karaokeAudio) karaokeAudio.pause(); } catch (e) {}
        audioEl.src = (typeof AUDIO_BASE_URL !== 'undefined' ? AUDIO_BASE_URL : '') + (cur.audio_url || '');
        audioEl.load();
        document.getElementById('dt-audio-title').textContent = gc(cur.title);
        document.getElementById('dt-audio-bar').style.width = '0%';
        document.getElementById('dt-audio-cur').textContent = '0:00';
        document.getElementById('dt-audio-dur').textContent = '0:00';
        setPlayBtn(false);
    }
    window.dictTogglePlay = function () {
        if (!media.ready()) return;
        if (media.playing()) { media.pause(); return; }
        playUntil = null;
        media.play();
    };
    // Trả về chỉ số câu chứa thời điểm t, hoặc -1 nếu không khớp câu nào
    function dictCueIdxAt(t) {
        const LEAD_IN = 0.25;
        for (let i = 0; i < cues.length; i++) {
            const st = Math.max(0, cues[i].start_time - LEAD_IN);
            const nextSt = (i < cues.length - 1) ? Math.max(0, cues[i + 1].start_time - LEAD_IN) : Infinity;
            const en = Math.min((i < cues.length - 1) ? Math.min(cues[i].end_time + 0.3, cues[i + 1].start_time) : cues[i].end_time + 0.3, nextSt);
            if (t >= st && t <= en) return i;
        }
        return -1;
    }

    function startPoll() {
        stopPoll();
        poll = setInterval(() => {
            if (!media.ready()) return;
            const t = media.time();
            if (isAudioMode) {
                const d = media.duration() || 1;
                document.getElementById('dt-audio-bar').style.width = (t / d * 100) + '%';
                document.getElementById('dt-audio-cur').textContent = fmtTime(t);
            }
            if (playUntil != null && t >= playUntil) {
                if (loopSentence && cues[curCueIdx]) { media.seek(getCueSafeStart(curCueIdx)); }
                else { media.pause(); playUntil = null; }
                return;
            }
            if (loopSentence && playUntil == null && cues[curCueIdx] && t >= getCueSafeEnd(curCueIdx)) {
                media.seek(getCueSafeStart(curCueIdx));
                return;
            }
            const idx = dictCueIdxAt(t);
            if (idx !== -1 && idx !== curCueIdx) {
                curCueIdx = idx;
                highlightCue(idx);
            }
        }, 35);
    }
    function stopPoll() { if (poll) { clearInterval(poll); poll = null; } }

    document.addEventListener('visibilitychange', () => { if (document.hidden && media.ready()) { try { media.pause(); } catch (e) {} } });

    // Đặt chiều cao khung câu = phần màn hình còn lại (sau khi trừ header app + khối video + header thẻ).
    // Nhờ vậy KHỐI chép chính tả đứng yên, chỉ danh sách câu bên trong cuộn độc lập.
    function fitDictCueListHeight() {
        const list = document.getElementById('dt-cue-list');
        const detail = document.getElementById('dict-detail');
        if (!list || !detail || detail.classList.contains('hidden')) return;

        const isDesktop = window.matchMedia('(min-width: 768px)').matches;
        const appHeader = document.getElementById('main-app-header');
        const headerH = appHeader ? appHeader.getBoundingClientRect().height : 0;
        const headEl = document.getElementById('dt-cue-head');
        const cueHeadH = headEl ? headEl.getBoundingClientRect().height : 0;

        if (isDesktop) {
            const mc = document.getElementById('mainContent');
            const containerH = mc ? mc.clientHeight : (window.innerHeight - headerH);
            // 96px = padding top/bottom của mainContent (64px) + padding thẻ phụ đề (24px) + khoảng thở an toàn (8px)
            const h = containerH - cueHeadH - 96;
            list.style.height = Math.max(280, h) + 'px';
        } else {
            const mediaEl = document.getElementById('dt-media-sticky');
            const mediaH = mediaEl ? mediaEl.getBoundingClientRect().height : 0;
            const chrome = 24; // padding của thẻ + khoảng thở đáy
            // Trên mobile: đảm bảo chiều cao khung câu thoáng rộng (tối thiểu 380px hoặc ~48% màn hình)
            const remainingH = window.innerHeight - headerH - mediaH - cueHeadH - chrome;
            const minMobileH = Math.max(380, Math.round(window.innerHeight * 0.48));
            const h = Math.max(minMobileH, remainingH);
            list.style.height = h + 'px';
        }
    }

    let _dtFitHeightTimer = null;
    function debouncedFitDictCueListHeight() {
        clearTimeout(_dtFitHeightTimer);
        _dtFitHeightTimer = setTimeout(() => {
            fitDictCueListHeight();
        }, 50);
    }
    window.addEventListener('resize', debouncedFitDictCueListHeight);
    if (window.ResizeObserver) {
        const dtMediaRO = new ResizeObserver(() => debouncedFitDictCueListHeight());
        const dtMediaEl = document.getElementById('dt-media-sticky');
        if (dtMediaEl) dtMediaRO.observe(dtMediaEl);
    }

    // Hotkeys máy tính: Space (Phát/Dừng), ArrowLeft/Right (Đổi câu), L (Lặp), P (Nghe lại)
    window.addEventListener('keydown', (e) => {
        const view = document.getElementById('view-dictation');
        const detail = document.getElementById('dict-detail');
        if (!view || view.classList.contains('hidden') || !detail || detail.classList.contains('hidden')) return;

        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;

        if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
            e.preventDefault();
            dictTogglePlay();
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            dictPrevCue();
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            dictNextCue();
        } else if (e.code === 'KeyL' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            dictToggleLoop();
        } else if (e.code === 'KeyP' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            dictReplayCue();
        }
    });
})();
