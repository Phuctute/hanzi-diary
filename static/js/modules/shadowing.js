(function () {
    const SPEEDS = [0.5, 0.75, 1, 1.25];
    let videos = [], topics = [], filterTopic = '';
    let savedShadowLibraryScroll = 0;
    // ---- Quy tắc riêng cho topic 漢字說故事 ----
    // Khớp theo CHUỖI CON vì tên topic đầy đủ trong DB là:
    //   「漢字說故事」動畫 - Ý nghĩa chữ hán qua chiết tự
    const REVERSE_ORDER_TOPIC = '漢字說故事';   // đảo thứ tự: video mới nhất hiện trước
    // Mọi video của topic này có intro cố định ~21s, và phụ đề có thể bắt đầu ngay trong intro
    // nên không thể dựa vào câu đầu tiên -> ép mốc bắt đầu tối thiểu là giây 22 (chừa 1s an toàn).
    // Các topic khác: giữ nguyên cách cũ (tua tới câu phụ đề đầu tiên).
    const INTRO_SKIP_RULES = [{ match: '漢字說故事', at: 22 }];

    let cur = null, cues = [], curCueIdx = 0;
    let player = null, audioEl = null, isAudioMode = false;
    let poll = null, playbackRate = 1, loopSentence = false, playUntil = null;
    let showPinyin = true, showVi = false;
    let mediaRecorder = null, recChunks = [], recStream = null, recording = false;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null, recHeard = '';

    const gc = (s) => (typeof getChar === 'function' ? getChar(s || '') : (s || ''));
    const esc = (s) => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };
    const pyOf = (t) => { if (typeof pinyinPro === 'undefined') return ''; try { return pinyinPro.pinyin(gc(t), { nonZh: 'removed' }); } catch (e) { return ''; } };
    // Pinyin theo từng chữ (kiểu furigana, giống Hội thoại) — hỏi pinyin trên cả câu rồi cắt theo ký tự
    // để giữ đúng ngữ cảnh/đa âm (customPinyin global từ karaoke.php cũng áp dụng ở đây).
    // withPinyin=false -> vẫn tách từng chữ thành span (để highlight từng chữ chạy được), chỉ ẩn dòng pinyin.
    function cueCharsHTML(text, withPinyin = true) {
        const chars = gc(text).split('');
        let pyArray = [];
        if (withPinyin && typeof pinyinPro !== 'undefined') { try { pyArray = pinyinPro.pinyin(gc(text), { type: 'array', nonZh: 'removed' }); } catch (e) {} }
        let pyIdx = 0, html = '';
        for (const ch of chars) {
            if (/[一-龥]/.test(ch)) {
                const py = withPinyin ? (pyArray[pyIdx++] || '') : '';
                const pyLine = withPinyin
                    ? `<span class="text-[14px] sm:text-[15px] text-td-blue font-semibold font-sans mb-1 tracking-tight">${esc(py)}</span>`
                    : '';
                html += `<div class="inline-flex flex-col items-center mx-[1.5px]">
                    ${pyLine}
                    <span class="sd-ch font-tc text-[28px] sm:text-[32px] text-brandNavy leading-none">${esc(ch)}</span>
                </div>`;
            } else {
                html += `<div class="inline-flex flex-col items-center mx-[1.5px]">
                    <span class="text-[14px] sm:text-[15px] mb-1 opacity-0 select-none">&nbsp;</span>
                    <span class="text-[28px] sm:text-[32px] text-slate-700 leading-none">${esc(ch)}</span>
                </div>`;
            }
        }
        return html;
    }
    // Bài audio (giáo trình) không có thumbnail YouTube -> trả '' để card hiện nền gradient.
    const thumbOf = (v) => {
        if (v.thumbnail && v.thumbnail.trim()) return v.thumbnail;
        if (v.youtube_id) return `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`;
        return '';
    };
    const audioSrcOf = (v) => (typeof AUDIO_BASE_URL !== 'undefined' ? AUDIO_BASE_URL : '') + v.audio_url;
    const fmtTime = (s) => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    const normHanzi = (s) => (String(s || '').match(/[一-龥]/g) || []).join('');

    // ---------- YouTube IFrame API (loader dùng chung với karaoke.php) ----------
    function ytLoadApi(cb) {
        if (typeof window.loadYouTubeApiOnce === 'function') {
            window.loadYouTubeApiOnce(cb);
        } else if (window.YT && window.YT.Player) {
            cb();
        }
    }

    // ================= THƯ VIỆN =================
    window.initShadowing = function () { loadTopics(); loadVideos(); renderSpeedBtn(); syncCCBtnState(); };

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
        let html = chip('Tất cả', filterTopic === '', `shadowSetTopic('')`);
        topics.forEach(t => { html += chip(t.topic, filterTopic === t.topic, `shadowSetTopic('${esc(t.topic).replace(/'/g, "\\'")}')`, t.cnt); });
        document.getElementById('shadow-topic-chips').innerHTML = html;
    }
    window.shadowSetTopic = function (t) { filterTopic = t; renderTopicChips(); renderGrid(); };

    async function loadVideos() {
        if (videos && videos.length > 0) { renderGrid(); return; }
        try { const r = await fetch('/api.php?action=get_shadowing_videos'); const j = await r.json(); videos = j.success ? (j.data || []) : []; }
        catch (e) { videos = []; }
        const prevScroll = savedShadowLibraryScroll || (document.getElementById('mainContent')?.scrollTop || 0);
        renderGrid();
        if (prevScroll && !document.getElementById('shadow-library').classList.contains('hidden')) {
            const mc = document.getElementById('mainContent');
            if (mc) {
                mc.scrollTo({ top: prevScroll, behavior: 'instant' });
                mc.scrollTop = prevScroll;
            }
        }
    }

    function coverHTML(v) {
        const thumb = thumbOf(v);
        // Bài audio (không có thumbnail): nền gradient thương hiệu + chữ Hán làm ảnh bìa.
        return thumb
            ? `<img src="${esc(thumb)}" alt="" loading="lazy" onerror="this.style.display='none'" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">`
            : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primaryDark p-3">
                   <span class="font-tc font-black text-white/95 text-sm leading-snug line-clamp-3 text-center">${esc(gc(v.title))}</span>
                   <i class="fa-solid fa-headphones-simple absolute bottom-2 left-2 text-white/50 text-xs"></i>
               </div>`;
    }
    // Lấy nhãn "BÀI X - HỘI THOẠI/ĐOẠN VĂN K" từ title_vi
    // (định dạng "Bài X - tên bài · Hội thoại/Đoạn văn K — mô tả") để hiện ngay trên card,
    // không phải đoán qua text mô tả bị cắt dòng.
    function baiLabel(v) {
        const m = String(v.title_vi || '').match(/^Bài\s*(\d+)[^·]*·\s*(Hội thoại|Đoạn văn)\s*(\d+)?/);
        if (!m) return '';
        return `BÀI ${m[1]} - ${m[2].toUpperCase()} ${m[3] || '1'}`;
    }
    // Card ngang (dài theo chiều ngang) — dùng cho hàng cuộn mặc định, kiểu schinese playlist row.
    function cardHTMLWide(v) {
        const lv = v.hsk_level ? `<span class="absolute top-2 left-2 z-10 text-[10px] font-black px-2 py-0.5 rounded-md bg-accent text-brandNavy shadow-sm">${esc(v.hsk_level)}</span>` : '';
        const bai = baiLabel(v) ? `<span class="absolute top-2 right-2 z-10 text-xs font-black px-2 py-0.5 rounded-md bg-primary text-white shadow-sm whitespace-nowrap">${esc(baiLabel(v))}</span>` : '';
        const dur = v.duration ? `<span class="absolute bottom-2 right-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white flex items-center gap-1"><i class="fa-regular fa-clock"></i> ${esc(v.duration)}</span>` : '';
        const seg = v.segments ? `${v.segments} câu` : 'Chưa có phụ đề';
        return `
        <button onclick="shadowOpenVideo(${v.id})" class="group shrink-0 w-[300px] sm:w-[340px] text-left bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-soft hover:-translate-y-1 transition-all duration-200">
            <div class="relative w-full aspect-video overflow-hidden bg-gradient-to-br from-td-lightBlue/40 to-primary/20">
                ${lv}${bai}${dur}
                ${coverHTML(v)}
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"><div class="w-11 h-11 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-lg"><i class="fa-solid fa-play ml-0.5"></i></div></div>
            </div>
            <div class="p-3">
                <div class="font-tc font-black text-brandNavy text-sm leading-snug line-clamp-2 mb-1">${esc(gc(v.title))}</div>
                <div class="text-[11px] text-slate-400 font-semibold flex items-center gap-1"><i class="fa-solid fa-list-ul"></i> ${seg}</div>
            </div>
        </button>`;
    }
    // Card dạng lưới (khi bấm "Xem thêm") — giữ nguyên bố cục dọc quen thuộc.
    function cardHTML(v) {
        const lv = v.hsk_level ? `<span class="absolute top-3 left-3 z-10 text-[10px] font-black px-2 py-1 rounded-md bg-accent text-brandNavy shadow-sm">${esc(v.hsk_level)}</span>` : '';
        const bai = baiLabel(v) ? `<span class="absolute top-3 right-3 z-10 text-xs font-black px-2 py-1 rounded-md bg-primary text-white shadow-sm whitespace-nowrap">${esc(baiLabel(v))}</span>` : '';
        const dur = v.duration ? `<span class="absolute bottom-3 right-3 z-10 text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white flex items-center gap-1"><i class="fa-regular fa-clock"></i> ${esc(v.duration)}</span>` : '';
        const seg = v.segments ? `${v.segments} câu` : 'Chưa có phụ đề';
        return `
        <button onclick="shadowOpenVideo(${v.id})" class="group text-left bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-soft hover:-translate-y-1 transition-all duration-200">
            <div class="relative w-full aspect-video overflow-hidden bg-gradient-to-br from-td-lightBlue/40 to-primary/20">
                ${lv}${bai}${dur}
                ${coverHTML(v)}
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"><div class="w-12 h-12 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-lg"><i class="fa-solid fa-play ml-0.5"></i></div></div>
            </div>
            <div class="p-4">
                <div class="font-tc font-black text-brandNavy text-base leading-snug line-clamp-2 mb-1">${esc(gc(v.title))}</div>
                ${v.title_vi ? `<div class="text-xs text-slate-500 line-clamp-1 mb-2">${esc(v.title_vi)}</div>` : '<div class="mb-2"></div>'}
                <div class="text-[11px] text-slate-400 font-semibold flex items-center gap-1"><i class="fa-solid fa-list-ul"></i> ${seg}</div>
            </div>
        </button>`;
    }
    let expandedTopics = {};
    window.shadowToggleTopicExpand = function (topic) {
        expandedTopics[topic] = !expandedTopics[topic];
        renderGrid();
    };
    function renderGrid() {
        const wrap = document.getElementById('shadow-grid-wrap');
        let list = videos.filter(v => (!filterTopic || v.topic === filterTopic));
        if (!list.length) { wrap.innerHTML = '<div class="text-center text-slate-400 py-16 text-sm">Chưa có video phù hợp bộ lọc.</div>'; return; }
        const groups = {};
        list.forEach(v => { const k = v.topic || 'Khác'; (groups[k] = groups[k] || []).push(v); });

        // Riêng topic 漢字說故事: đảo thứ tự để video MỚI NHẤT hiển thị trước.
        // (API trả về theo sort_order ASC, id DESC -> mặc định là cũ trước.)
        Object.keys(groups).forEach(t => {
            if (t.includes(REVERSE_ORDER_TOPIC)) groups[t].reverse();
        });

        let html = '';
        Object.keys(groups).forEach(topic => {
            const items = groups[topic];
            const expanded = !!expandedTopics[topic];
            const tkey = esc(topic).replace(/'/g, "\\'");
            const toggleBtn = `<button onclick="shadowToggleTopicExpand('${tkey}')" class="text-xs font-bold text-primary hover:text-primaryDark flex items-center gap-1 shrink-0">
                    ${expanded ? '<i class="fa-solid fa-chevron-up"></i> Thu gọn' : `<i class="fa-solid fa-chevron-right"></i> Xem thêm (${items.length})`}
                </button>`;
            const body = expanded
                ? `<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">${items.map(cardHTML).join('')}</div>`
                : `<div class="flex gap-4 overflow-x-auto pb-2 custom-scrollbar -mx-1 px-1">${items.map(cardHTMLWide).join('')}</div>`;
            html += `<div class="mb-9">
                <div class="flex items-center gap-2 mb-4">
                    <h3 class="font-black text-brandNavy text-lg">${esc(topic)}</h3>
                    <span class="text-xs font-bold text-white bg-primary/80 rounded-full px-2 py-0.5">${items.length}</span>
                    <div class="flex-1"></div>
                    ${toggleBtn}
                </div>
                ${body}
            </div>`;
        });
        wrap.innerHTML = html;
    }

    function renderSpeedBtn() {
        const btn = document.getElementById('sd-speed-btn');
        if (!btn) return;
        btn.textContent = `${playbackRate}x`;
        btn.title = `Tốc độ: ${playbackRate}x (Bấm để đổi: 0.5x, 0.75x, 1x, 1.25x)`;
        if (playbackRate === 1) {
            btn.className = 'h-9 sm:h-10 px-2 sm:px-2.5 min-w-[38px] sm:min-w-[42px] rounded-full font-bold text-xs sm:text-[13px] flex items-center justify-center active:scale-95 transition-all shadow-sm bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 select-none';
        } else {
            btn.className = 'h-9 sm:h-10 px-2 sm:px-2.5 min-w-[38px] sm:min-w-[42px] rounded-full font-black text-xs sm:text-[13px] flex items-center justify-center active:scale-95 transition-all shadow-sm bg-primary text-white border border-primary hover:bg-primary/90 select-none';
        }
    }
    function renderSpeedChips() {
        renderSpeedBtn();
    }
    window.shadowCycleSpeed = function () {
        const idx = SPEEDS.indexOf(playbackRate);
        const nextIdx = idx >= 0 ? (idx + 1) % SPEEDS.length : 0;
        window.shadowSetSpeed(SPEEDS[nextIdx]);
    };
    window.shadowToggleCCMenu = function (e) {
        if (e) e.stopPropagation();
        const m = document.getElementById('sd-cc-menu');
        if (!m) return;
        m.classList.toggle('hidden');
        syncCCBtnState();
    };
    window.shadowCloseCCMenu = function (e) {
        if (e) e.stopPropagation();
        const m = document.getElementById('sd-cc-menu');
        if (m) m.classList.add('hidden');
        syncCCBtnState();
    };
    function syncCCBtnState() {
        const btn = document.getElementById('sd-cc-btn');
        const menu = document.getElementById('sd-cc-menu');
        if (!btn) return;
        const isOpen = menu && !menu.classList.contains('hidden');
        const hasCC = showPinyin || showVi;
        if (isOpen) {
            btn.className = 'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-md bg-primary text-white border border-primary';
        } else if (hasCC) {
            btn.className = 'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-sm bg-white text-primary border border-td-lightBlue/60 hover:bg-td-lightBlue/20';
        } else {
            btn.className = 'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-sm bg-white text-slate-400 border border-slate-200 hover:bg-slate-100';
        }
    }
    document.addEventListener('click', (e) => {
        const wrap = document.getElementById('sd-cc-dropdown-wrap');
        const menu = document.getElementById('sd-cc-menu');
        if (menu && !menu.classList.contains('hidden') && wrap && !wrap.contains(e.target)) {
            menu.classList.add('hidden');
            syncCCBtnState();
        }
    });

    // ---- Tối ưu kích thước khung phụ đề Shadowing khớp với media sticky ----
    function updateStickyHeightVar() {}
    let _sdFitHeightTimer = null;
    function debouncedFitCueListHeight() {
        clearTimeout(_sdFitHeightTimer);
        _sdFitHeightTimer = setTimeout(() => {
            fitCueListHeight();
        }, 50);
    }
    window.addEventListener('resize', debouncedFitCueListHeight);
    if (window.ResizeObserver) {
        const sdMediaRO = new ResizeObserver(() => debouncedFitCueListHeight());
        const sdMediaEl = document.getElementById('sd-media-sticky');
        if (sdMediaEl) sdMediaRO.observe(sdMediaEl);
    }

    // ================= TRANG CHI TIẾT =================
    window.shadowOpenVideo = async function (id) {
        try {
            const r = await fetch('/api.php?action=get_shadowing_video&id=' + encodeURIComponent(id));
            const j = await r.json();
            if (!j.success) return;
            cur = j.data;
            cues = Array.isArray(cur.script_json) ? cur.script_json : [];
            curCueIdx = 0; playUntil = null;
            const viLines = cur.vietnamese ? String(cur.vietnamese).split('\n') : [];
            cues.forEach((c, i) => { c._vi = viLines[i] || ''; });

            document.getElementById('sd-title').textContent = gc(cur.title);
            document.getElementById('sd-level').textContent = cur.hsk_level || '';
            document.getElementById('sd-level').style.display = cur.hsk_level ? '' : 'none';
            document.getElementById('sd-topic').textContent = cur.topic || '';
            resetRecordUI();

            const mc = document.getElementById('mainContent');
            if (!document.getElementById('shadow-library').classList.contains('hidden') && mc) {
                savedShadowLibraryScroll = mc.scrollTop;
            }

            document.getElementById('shadow-library').classList.add('hidden');
            document.getElementById('shadow-detail').classList.remove('hidden');

            if (mc) {
                mc.scrollTo({ top: 0, behavior: 'instant' });
                mc.scrollTop = 0;
            }
            const cueListEl = document.getElementById('sd-cue-list');
            if (cueListEl) {
                cueListEl.scrollTo({ top: 0, behavior: 'instant' });
                cueListEl.scrollTop = 0;
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
            

            // Mở video mới -> tiêu đề luôn hiện lại từ đầu
            const mediaEl2 = document.getElementById('sd-media-sticky');
            if (mediaEl2) mediaEl2.classList.remove('sd-hide-title');
            lastCueScrollY = 0;
            lastShadowPageScrollY = 0;

            renderCueList();
            bindCueListAutoHide();  // gắn auto-ẩn tiêu đề theo hướng cuộn
            bindShadowPageAutoHide();
            updateCurrentPanel();
            setupPlayer();
            loadTop();
            fetch('/api.php?action=bump_shadowing_video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => {});
        } catch (e) { console.error(e); }
    };

    // Dừng mọi thứ đang phát/ghi âm — gọi khi rời hẳn tab Shadowing (switchTab) hoặc bấm back,
    // nếu không video/audio vẫn tiếp tục kêu ở nền dù đã sang màn hình khác.
    window.shadowStopAll = function () {
        try { stopPoll(); } catch (e) {}
        try { if (media.ready()) media.stop(); } catch (e) {}
        try { stopRecordingHard(); } catch (e) {}
    };

    window.shadowBackToLibrary = function () {
        window.shadowStopAll();
        document.getElementById('shadow-detail').classList.add('hidden');
        document.getElementById('shadow-library').classList.remove('hidden');
        const mc = document.getElementById('mainContent');
        if (mc && savedShadowLibraryScroll) {
            mc.scrollTo({ top: savedShadowLibraryScroll, behavior: 'instant' });
            mc.scrollTop = savedShadowLibraryScroll;
            requestAnimationFrame(() => {
                if (mc) {
                    mc.scrollTo({ top: savedShadowLibraryScroll, behavior: 'instant' });
                    mc.scrollTop = savedShadowLibraryScroll;
                }
            });
        }
        loadVideos(); // refresh play_count / thứ tự
    };

    // ---- Top luyện nhiều ----
    async function loadTop() {
        const el = document.getElementById('sd-top-list');
        try {
            const r = await fetch('/api.php?action=get_top_shadowing_videos&limit=8');
            const j = await r.json();
            const list = j.success ? (j.data || []) : [];
            if (!list.length) { el.innerHTML = '<div class="text-xs text-slate-400 py-4 text-center">Chưa có dữ liệu.</div>'; return; }
            el.innerHTML = list.map((v, i) => {
                const rankCls = i === 0 ? 'bg-accent text-brandNavy' : i === 1 ? 'bg-td-lightBlue text-primary' : i === 2 ? 'bg-primary/15 text-primary' : 'bg-slate-100 text-slate-400';
                const th = thumbOf(v);
                const cover = th
                    ? `<img src="${esc(th)}" onerror="this.style.opacity=.15" class="w-16 h-10 rounded-lg object-cover shrink-0">`
                    : `<div class="w-16 h-10 rounded-lg shrink-0 bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center"><i class="fa-solid fa-headphones-simple text-white/70 text-xs"></i></div>`;
                return `
                <button onclick="shadowOpenVideo(${v.id})" class="flex items-center gap-3 text-left rounded-2xl p-2 hover:bg-slate-50 transition-all ${v.id == (cur && cur.id) ? 'ring-1 ring-primary/40 bg-td-lightBlue/10' : ''}">
                    <span class="w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0 ${rankCls}">${i + 1}</span>
                    ${cover}
                    <div class="min-w-0 flex-1">
                        <div class="font-tc font-bold text-brandNavy text-[13px] leading-snug line-clamp-1">${esc(gc(v.title))}</div>
                        <div class="text-[10px] text-slate-400 font-semibold flex items-center gap-1"><i class="fa-solid fa-headphones"></i> ${v.play_count || 0} lượt · ${esc(v.hsk_level || '')}</div>
                    </div>
                </button>`;
            }).join('');
        } catch (e) { el.innerHTML = '<div class="text-xs text-slate-400 py-4 text-center">Lỗi tải.</div>'; }
    }

    // ---- danh sách phụ đề ----
    function cueItemHTML(c, i) {
        const active = i === curCueIdx;
        const vi = showVi && c._vi ? `<div class="sd-ci-vi text-[14px] sm:text-[16px] text-slate-600 font-medium mt-1.5 sm:mt-2 leading-relaxed">${esc(c._vi)}</div>` : '';
        // Pinyin per-chữ (kiểu Hội thoại) khi bật; tắt thì chỉ hiện Hán tự thuần, nhẹ hơn.
        const body = `<div class="flex flex-wrap items-end gap-y-1 sm:gap-y-1.5">${cueCharsHTML(c.text, showPinyin)}</div>`;
        return `<button onclick="shadowGoCue(${i})" id="sd-cue-${i}" class="sd-cue w-full text-left rounded-xl sm:rounded-2xl border px-2.5 sm:px-4 py-2 sm:py-3.5 transition-all ${active ? 'sd-cue-active border-primary bg-td-lightBlue/20' : 'border-slate-100 bg-white hover:border-td-lightBlue/60'}">
            <div class="flex items-start gap-1.5 sm:gap-3">
                <span class="text-[10px] sm:text-[12px] font-bold text-slate-300 mt-1 sm:mt-1.5 shrink-0 select-none text-right w-5 sm:w-6">#${i + 1}</span>
                <div class="min-w-0 flex-1">${body}${vi}</div>
            </div>
        </button>`;
    }
    function renderCueList() {
        const el = document.getElementById('sd-cue-list');
        if (!cues.length) { el.innerHTML = '<div class="text-center text-slate-400 py-6 text-sm">Video này chưa có phụ đề.</div>'; document.getElementById('sd-progress').textContent = '0/0'; return; }
        document.getElementById('sd-progress').textContent = `1/${cues.length}`;
        el.innerHTML = cues.map((c, i) => cueItemHTML(c, i)).join('');
        requestAnimationFrame(() => { updateStickyHeightVar(); fitCueListHeight(); });
    }
    window.shadowToggleCC = function () {
        const pyEl = document.getElementById('sd-show-pinyin');
        const viEl = document.getElementById('sd-show-vi');
        if (pyEl) showPinyin = pyEl.checked;
        if (viEl) showVi = viEl.checked;
        syncCCBtnState();
        renderCueList();
        // Bật/tắt pinyin làm đổi chiều cao câu -> canh lại câu đang đọc về giữa khung.
        requestAnimationFrame(() => {
            const el = document.getElementById('sd-cue-' + curCueIdx);
            if (el) { el.classList.add('sd-cue-active'); scrollCueIntoPosition(el); }
        });
    };

    // Đặt chiều cao khung phụ đề = phần màn hình còn lại (sau khi trừ header app + khối video + header thẻ).
    // Nhờ vậy KHỐI phụ đề đứng yên, chỉ danh sách câu bên trong cuộn.
    function fitCueListHeight() {
        const list = document.getElementById('sd-cue-list');
        const detail = document.getElementById('shadow-detail');
        if (!list || !detail || detail.classList.contains('hidden')) return;

        const isDesktop = window.matchMedia('(min-width: 768px)').matches;
        const appHeader = document.getElementById('main-app-header');
        const headerH = appHeader ? appHeader.getBoundingClientRect().height : 0;
        const headEl = document.getElementById('sd-cue-head');
        const cueHeadH = headEl ? headEl.getBoundingClientRect().height : 0;

        if (isDesktop) {
            const mc = document.getElementById('mainContent');
            const containerH = mc ? mc.clientHeight : (window.innerHeight - headerH);
            // 96px = padding top/bottom của mainContent (64px) + padding thẻ phụ đề (24px) + khoảng thở an toàn (8px)
            const h = containerH - cueHeadH - 96;
            list.style.height = Math.max(280, h) + 'px';
        } else {
            const mediaEl = document.getElementById('sd-media-sticky');
            const mediaH = mediaEl ? mediaEl.getBoundingClientRect().height : 0;
            const chrome = 24; // padding của thẻ phụ đề + khoảng thở đáy
            // Trên mobile: đảm bảo chiều cao khung phụ đề thoáng rộng (tối thiểu 380px hoặc ~48% màn hình),
            // hiển thị thoải mái 4-6 câu để người học theo dõi trọn vẹn và không bị cụt.
            const remainingH = window.innerHeight - headerH - mediaH - cueHeadH - chrome;
            const minMobileH = Math.max(380, Math.round(window.innerHeight * 0.48));
            const h = Math.max(minMobileH, remainingH);
            list.style.height = h + 'px';
        }
    }

    // (Đã bỏ tính năng "thu gọn video" — dọn cả localStorage cũ để người dùng
    //  từng bật không bị kẹt video nhỏ vĩnh viễn khi không còn nút mở lại.)
    try { localStorage.removeItem('sd_compact'); } catch (e) {}

    // --- Tự ẩn thanh tiêu đề theo hướng cuộn & theo tự cuộn phát câu ---
    // Cuộn xuống (đang đọc tiếp) -> ẩn tiêu đề, nhường chỗ cho phụ đề.
    // Cuộn lên (xem lại) -> hiện lại tiêu đề + nút back.
    let _isSdAutoScrolling = false;
    let _sdAutoScrollTimer = null;
    let lastCueScrollY = 0;
    let _sdCueRaf = null;
    function bindCueListAutoHide() {
        const list = document.getElementById('sd-cue-list');
        const media = document.getElementById('sd-media-sticky');
        if (!list || !media || list.dataset.autohide === '1') return;
        list.dataset.autohide = '1';
        list.addEventListener('scroll', () => {
            if (_isSdAutoScrolling) return; // Không can thiệp khi hệ thống đang tự cuộn
            if (_sdCueRaf) return;
            _sdCueRaf = requestAnimationFrame(() => {
                _sdCueRaf = null;
                const y = list.scrollTop;
                const diff = y - lastCueScrollY;
                if (diff > 20 && y > 40) {
                    if (!media.classList.contains('sd-hide-title')) media.classList.add('sd-hide-title');
                } else if (y <= 15 || diff < -25) {
                    if (media.classList.contains('sd-hide-title')) media.classList.remove('sd-hide-title');
                }
                lastCueScrollY = y;
            });
        }, { passive: true });
    }

    let lastShadowPageScrollY = 0;
    let _sdPageRaf = null;
    function bindShadowPageAutoHide() {
        const handleScroll = (y) => {
            const detail = document.getElementById('shadow-detail');
            if (!detail || detail.classList.contains('hidden')) return;
            const media = document.getElementById('sd-media-sticky');
            if (!media || _isSdAutoScrolling) return;
            const diff = y - lastShadowPageScrollY;
            if (diff > 25 && y > 45) {
                if (!media.classList.contains('sd-hide-title')) media.classList.add('sd-hide-title');
            } else if (y <= 15 || diff < -30) {
                if (media.classList.contains('sd-hide-title')) media.classList.remove('sd-hide-title');
            }
            lastShadowPageScrollY = y;
        };

        const mc = document.getElementById('mainContent');
        if (mc && mc.dataset.sdAutohide !== '1') {
            mc.dataset.sdAutohide = '1';
            mc.addEventListener('scroll', () => {
                if (_sdPageRaf) return;
                _sdPageRaf = requestAnimationFrame(() => {
                    _sdPageRaf = null;
                    handleScroll(mc.scrollTop);
                });
            }, { passive: true });
        }
    }

    // Cuộn TRONG khung phụ đề: luôn đưa câu đang phát lên vị trí tiêu điểm đọc (khoảng 28% từ đỉnh)
    // giúp người học theo dõi liên tục, thấy rõ câu hiện tại và 2-3 câu tiếp theo mà không bị giật cục.
    function scrollCueIntoPosition(el, immediate = false) {
        const list = document.getElementById('sd-cue-list');
        if (!el || !list) return;

        // Vị trí tiêu điểm đọc tối ưu (~28% từ đỉnh danh sách phụ đề)
        const targetOffset = Math.max(16, (list.clientHeight - el.offsetHeight) * 0.28);
        const targetScrollTop = Math.max(0, el.offsetTop - targetOffset);

        // Tự động thu gọn tiêu đề của media khi câu phát cuộn xuống tiếp theo để tối ưu diện tích hiển thị
        const media = document.getElementById('sd-media-sticky');
        if (media) {
            if (targetScrollTop > 20 || curCueIdx > 0) {
                if (!media.classList.contains('sd-hide-title')) media.classList.add('sd-hide-title');
            } else if (targetScrollTop <= 10 && curCueIdx === 0) {
                if (media.classList.contains('sd-hide-title')) media.classList.remove('sd-hide-title');
            }
        }
        lastCueScrollY = targetScrollTop;

        // Chỉ cuộn nếu độ lệch vượt quá ngưỡng nhỏ (8px) để tránh rung lắc vi mô
        if (Math.abs(list.scrollTop - targetScrollTop) > 8) {
            _isSdAutoScrolling = true;
            list.scrollTo({
                top: targetScrollTop,
                behavior: immediate ? 'auto' : 'smooth'
            });
            clearTimeout(_sdAutoScrollTimer);
            _sdAutoScrollTimer = setTimeout(() => {
                _isSdAutoScrolling = false;
                lastCueScrollY = list.scrollTop;
            }, 380);
        }
    }

    // Tô sáng từng chữ theo tiến độ thời gian TRONG câu đang phát.
    // Lưu ý: phụ đề chỉ có mốc thời gian theo CÂU (start_time/end_time), không có mốc theo từng chữ,
    // nên đây là nội suy tuyến tính (giả định tốc độ nói đều). Đủ tốt về thị giác, có thể lệch ở câu ngắt quãng.
    function paintCueChars(i, t) {
        const el = document.getElementById('sd-cue-' + i);
        if (!el) return;
        const chars = el.querySelectorAll('.sd-ch');
        if (!chars.length) return;
        const c = cues[i];
        if (!c) return;
        const dur = Math.max(0.001, c.end_time - c.start_time);
        const p = Math.min(1, Math.max(0, (t - c.start_time) / dur));
        const n = Math.round(p * chars.length);
        chars.forEach((s, k) => s.classList.toggle('sd-ch-on', k < n));
    }

    function highlightCue(i) {
        document.querySelectorAll('.sd-cue').forEach(el => {
            el.classList.remove('sd-cue-active', 'border-primary', 'bg-td-lightBlue/20');
            el.querySelectorAll('.sd-ch-on').forEach(s => s.classList.remove('sd-ch-on'));
        });
        const el = document.getElementById('sd-cue-' + i);
        if (el) { el.classList.add('sd-cue-active', 'border-primary', 'bg-td-lightBlue/20'); scrollCueIntoPosition(el); }
        document.getElementById('sd-progress').textContent = `${i + 1}/${cues.length}`;
    }
    // Đổi câu -> chỉ cập nhật số thứ tự, thẻ kết quả trở về trạng thái trống
    // (nội dung câu chỉ hiện sau khi ghi âm xong, để người học không nhìn trộm đáp án).
    function updateCurrentPanel() {
        document.getElementById('sd-cur-idx').textContent = `Câu #${curCueIdx + 1}`;
        document.getElementById('sd-cur-total').textContent = cues.length ? `/ ${cues.length}` : '';
        resetRecordUI();
    }
    function setCurCue(i, seek) {
        if (i < 0 || i >= cues.length) return;
        curCueIdx = i; highlightCue(i); updateCurrentPanel();
        if (seek && media.ready()) media.seek(cues[i].start_time + 0.02);
    }
    window.shadowGoCue = function (i) { setCurCue(i, true); if (media.ready()) media.play(); };
    window.shadowPrevCue = function () { setCurCue(curCueIdx - 1, true); };
    window.shadowNextCue = function () { setCurCue(curCueIdx + 1, true); };
    window.shadowReplayCue = function () { const c = cues[curCueIdx]; if (!c || !media.ready()) return; playUntil = c.end_time; media.seek(c.start_time + 0.02); media.play(); };
    window.shadowToggleLoop = function () {
        loopSentence = !loopSentence;
        const cls = 'rounded-full flex items-center justify-center active:scale-95 transition-all ' + (loopSentence ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200');
        const b = document.getElementById('sd-loop-btn'); if (b) b.className = 'w-9 h-9 sm:w-10 sm:h-10 ' + cls;
        // Bật lặp -> có tác dụng NGAY: đồng bộ đúng câu đang phát rồi tua về đầu câu đó,
        // thay vì chỉ đổi cờ âm thầm và phải chờ video tự chạy tới cuối câu mới thấy lặp.
        if (loopSentence && media.ready()) {
            const t = media.time();
            const idx = cueIdxAt(t);
            if (idx !== -1) { curCueIdx = idx; highlightCue(idx); updateCurrentPanel(); }
            if (cues[curCueIdx]) {
                playUntil = null;
                media.seek(cues[curCueIdx].start_time + 0.02);
                media.play();
            }
        }
    };
    window.shadowSetSpeed = function (s) { playbackRate = s; if (media.ready()) media.rate(s); renderSpeedChips(); };

    // ---- Âm lượng: đồng bộ 2 thanh trượt (video + audio giáo trình) và icon loa ----
    function volIconClass(v, muted) {
        if (muted || v <= 0) return 'fa-solid fa-volume-xmark text-xs';
        if (v < 50) return 'fa-solid fa-volume-low text-xs';
        return 'fa-solid fa-volume-high text-xs';
    }
    function syncVolumeUI() {
        if (!media.ready()) return;
        const muted = media.isMuted();
        const v = muted ? 0 : media.getVolume();
        ['sd-volume-range', 'sd-volume-range-a'].forEach(id => { const el = document.getElementById(id); if (el) el.value = v; });
        ['sd-mute-btn', 'sd-mute-btn-a'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = `<i class="${volIconClass(v, muted)}"></i>`; });
    }
    window.shadowSetVolume = function (v) {
        if (!media.ready()) return;
        media.setVolume(parseInt(v, 10));
        syncVolumeUI();
    };
    window.shadowToggleMute = function () {
        if (!media.ready()) return;
        media.toggleMute();
        syncVolumeUI();
    };

    // ---------- MEDIA ADAPTER: YouTube hoặc audio (giáo trình) ----------
    // Toàn bộ logic karaoke/điều khiển bên dưới chỉ nói chuyện qua media.*,
    // nhờ đó dùng chung cho cả 2 nguồn phát.
    const media = {
        play() { isAudioMode ? audioEl && audioEl.play().catch(() => {}) : player && player.playVideo(); },
        pause() { isAudioMode ? audioEl && audioEl.pause() : player && player.pauseVideo(); },
        seek(t) { if (isAudioMode) { if (audioEl) audioEl.currentTime = t; } else if (player && player.seekTo) player.seekTo(t, true); },
        time() { return isAudioMode ? (audioEl ? audioEl.currentTime : 0) : (player && player.getCurrentTime ? player.getCurrentTime() : 0); },
        duration() { return isAudioMode ? (audioEl ? audioEl.duration || 0 : 0) : (player && player.getDuration ? player.getDuration() : 0); },
        rate(r) { if (isAudioMode) { if (audioEl) audioEl.playbackRate = r; } else if (player && player.setPlaybackRate) player.setPlaybackRate(r); },
        playing() {
            if (isAudioMode) return !!(audioEl && !audioEl.paused);
            return !!(player && player.getPlayerState && player.getPlayerState() === YT.PlayerState.PLAYING);
        },
        stop() { if (isAudioMode) { if (audioEl) { audioEl.pause(); audioEl.currentTime = 0; } } else if (player && player.stopVideo) { try { player.stopVideo(); } catch (e) {} } },
        ready() { return isAudioMode ? !!audioEl : !!player; },
        // Âm lượng: thang 0-100 dùng chung cho cả 2 nguồn (audio.volume vốn 0-1 -> quy đổi).
        getVolume() {
            if (isAudioMode) return audioEl ? Math.round((audioEl.muted ? 0 : audioEl.volume) * 100) : 100;
            if (player && player.isMuted && player.isMuted()) return 0;
            return (player && player.getVolume) ? player.getVolume() : 100;
        },
        setVolume(v) {
            v = Math.max(0, Math.min(100, v));
            if (isAudioMode) { if (audioEl) { audioEl.muted = false; audioEl.volume = v / 100; } }
            else if (player && player.setVolume) { player.unMute(); player.setVolume(v); }
        },
        isMuted() {
            if (isAudioMode) return !!(audioEl && (audioEl.muted || audioEl.volume === 0));
            return !!(player && player.isMuted && player.isMuted());
        },
        toggleMute() {
            if (isAudioMode) { if (audioEl) audioEl.muted = !audioEl.muted; return; }
            if (player && player.isMuted) { player.isMuted() ? player.unMute() : player.mute(); }
        }
    };

    function setPlayBtn(playing) {
        const btn = document.getElementById('sd-play-btn');
        if (btn) btn.innerHTML = playing ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play ml-0.5"></i>';
    }

    function setupPlayer() {
        isAudioMode = !cur.youtube_id;
        document.getElementById('sd-video-wrap').classList.toggle('hidden', isAudioMode);
        document.getElementById('sd-audio-wrap').classList.toggle('hidden', !isAudioMode);

        if (isAudioMode) {
            if (player && player.stopVideo) { try { player.stopVideo(); } catch (e) {} }
            setupAudio();
        } else {
            if (audioEl) { audioEl.pause(); }
            setupYouTube();
        }
    }

    function setupYouTube() {
        ytLoadApi(() => {
            const wrap = document.getElementById('sd-video-wrap');
            if (!wrap) return;
            if (!document.getElementById('sd-player')) {
                wrap.innerHTML = '<div id="sd-player" class="absolute inset-0 w-full h-full"></div>';
            }
            if (player && typeof player.loadVideoById === 'function') {
                try {
                    const startSec = Math.floor(cur.video_start_offset || (typeof startAt === 'function' ? startAt() : 0) || 0);
                    player.loadVideoById({ videoId: cur.youtube_id, startSeconds: startSec });
                    try { player.setPlaybackRate(playbackRate); } catch(e) {}
                    syncVolumeUI();
                    return;
                } catch(err) {
                    try { player.destroy(); } catch(e) {}
                    player = null;
                }
            }
            let pDiv = document.getElementById('sd-player');
            if (!pDiv || pDiv.tagName === 'IFRAME') {
                if (pDiv) pDiv.remove();
                pDiv = document.createElement('div');
                pDiv.id = 'sd-player';
                pDiv.className = 'absolute inset-0 w-full h-full';
                const firstChild = wrap.firstChild;
                wrap.insertBefore(pDiv, firstChild);
            }
            const appOrigin = window.location.origin || (window.location.protocol + '//' + window.location.host);
            const startSec = Math.floor(cur.video_start_offset || (typeof startAt === 'function' ? startAt() : 0) || 0);
            player = new YT.Player('sd-player', {
                videoId: cur.youtube_id,
                playerVars: {
                    origin: appOrigin,
                    enablejsapi: 1,
                    start: startSec,
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
                    onReady: (e) => {
                        try {
                            ensureIframePermissions(wrap);
                            e.target.setPlaybackRate(playbackRate);
                            syncVolumeUI();
                            requestAnimationFrame(updateStickyHeightVar);
                        } catch(err) {}
                    },
                    onStateChange: onPlayerState,
                    onError: onPlayerError
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
        console.warn('Shadowing YouTube error:', e.data);
        if (![2, 5, 100, 101, 150].includes(e.data)) return;
        if (cur.audio_url && String(cur.audio_url).trim()) {
            cur.youtube_id = null;
            isAudioMode = true;
            document.getElementById('sd-video-wrap').classList.add('hidden');
            document.getElementById('sd-audio-wrap').classList.remove('hidden');
            setupAudio();
            return;
        }
        const wrap = document.getElementById('sd-video-wrap');
        if (wrap && cur.youtube_id) {
            wrap.innerHTML = '<div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/95 text-white z-10">' +
                '<i class="fa-brands fa-youtube text-red-500 text-4xl sm:text-5xl mb-3"></i>' +
                '<div class="font-bold text-sm sm:text-base mb-1">Video YouTube bị hạn chế nhúng trên thiết bị này</div>' +
                '<div class="text-xs text-slate-300 mb-4 max-w-sm">Chủ sở hữu video hoặc trình duyệt giới hạn phát trực tiếp trong ứng dụng. Bạn vẫn có thể mở xem trực tiếp trên YouTube hoặc tiếp tục luyện tập theo phụ đề bên dưới.</div>' +
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
            audioEl.onloadedmetadata = () => {
                document.getElementById('sd-audio-dur').textContent = fmtTime(audioEl.duration);
                // Bỏ qua đoạn dẫn nhập: đặt kim ngay câu đầu tiên.
                const fs = firstCueStart();
                if (fs > 0 && audioEl.currentTime < fs) audioEl.currentTime = fs + 0.02;
                requestAnimationFrame(updateStickyHeightVar);
                syncVolumeUI();
            };
            document.getElementById('sd-audio-progress').onclick = function (ev) {
                if (!audioEl.duration) return;
                media.seek((ev.offsetX / this.clientWidth) * audioEl.duration);
            };
        }
        try { if (typeof globalAudioPlayer !== 'undefined' && globalAudioPlayer) globalAudioPlayer.pause(); } catch (e) {}
        audioEl.src = audioSrcOf(cur);
        audioEl.playbackRate = playbackRate;
        audioEl.load();
        document.getElementById('sd-audio-title').textContent = gc(cur.title);
        document.getElementById('sd-audio-bar').style.width = '0%';
        document.getElementById('sd-audio-cur').textContent = '0:00';
        document.getElementById('sd-audio-dur').textContent = '0:00';
        setPlayBtn(false);
    }

    // Audio giáo trình có đoạn dẫn nhập (đọc tên bài / giới thiệu) trước câu đầu tiên.
    // Luôn bắt đầu từ câu đầu của script_json để vào thẳng nội dung chính.
    function firstCueStart() { return cues.length ? Math.max(0, cues[0].start_time) : 0; }

    function startAt() {
        const fs = firstCueStart();
        const topic = (cur && cur.topic) || '';
        const rule = INTRO_SKIP_RULES.find(r => topic.includes(r.match));
        return Math.max(fs, rule ? rule.at : 0);
    }

    // Câu phụ đề đầu tiên nằm tại/sau mốc bắt đầu -> để highlight khớp với chỗ video thực sự phát.
    function startCueIdx() {
        const s = startAt();
        const i = cues.findIndex(c => c.end_time > s + 0.05);
        return i === -1 ? 0 : i;
    }

    window.shadowTogglePlay = function () {
        if (!media.ready()) return;
        if (media.playing()) { media.pause(); return; }
        const fs = startAt();
        const t = media.time();
        const d = media.duration();
        // Chưa tới mốc bắt đầu, hoặc đã phát hết -> tua về mốc bắt đầu thay vì đoạn dẫn nhập.
        if (t < fs - 0.05 || (d && t >= d - 0.05)) media.seek(fs + 0.02);
        media.play();
    };

    // Trả về chỉ số câu (cue) chứa thời điểm t, hoặc -1 nếu không khớp câu nào.
    function cueIdxAt(t) {
        for (let i = 0; i < cues.length; i++) {
            const st = cues[i].start_time;
            const en = (i < cues.length - 1) ? Math.min(cues[i].end_time + 0.3, cues[i + 1].start_time) : cues[i].end_time + 0.3;
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
                document.getElementById('sd-audio-bar').style.width = (t / d * 100) + '%';
                document.getElementById('sd-audio-cur').textContent = fmtTime(t);
            }

            if (playUntil != null && t >= playUntil) {
                if (loopSentence) media.seek(cues[curCueIdx].start_time + 0.02);
                else { media.pause(); playUntil = null; }
                return;
            }
            if (loopSentence && playUntil == null && cues[curCueIdx] && t >= cues[curCueIdx].end_time) { media.seek(cues[curCueIdx].start_time + 0.02); return; }
            const idx = cueIdxAt(t);
            if (idx !== -1 && idx !== curCueIdx) { curCueIdx = idx; highlightCue(idx); updateCurrentPanel(); }
            // Tô sáng từng chữ chạy theo audio trong câu hiện tại
            if (idx !== -1) paintCueChars(idx, t);
        }, 100);
    }
    function stopPoll() { if (poll) { clearInterval(poll); poll = null; } }

    // ---------- ghi âm + nhận diện giọng nói + so sánh ----------
    function setRecBtn(recording) {
        const btn = document.getElementById('sd-rec-btn');
        const hint = document.getElementById('sd-rec-hint');
        if (btn) btn.innerHTML = recording ? '<i class="fa-solid fa-stop text-xl"></i>' : '<i class="fa-solid fa-microphone text-2xl"></i>';
        if (hint) hint.textContent = recording ? 'Đang nghe… nhấn để dừng' : 'Nhấn để ghi âm';
        document.getElementById('sd-rec-ring1').classList.toggle('hidden', !recording);
        document.getElementById('sd-rec-ring2').classList.toggle('hidden', !recording);
    }

    function resetRecordUI() {
        document.getElementById('sd-result-filled').classList.add('hidden');
        document.getElementById('sd-result-empty').classList.remove('hidden');
        document.getElementById('sd-rec-audio').classList.add('hidden');
        document.getElementById('sd-rec-score').textContent = '';
        document.getElementById('sd-rec-warn').classList.add('hidden');
        setRecBtn(false);
    }
    window.shadowToggleRecord = async function () {
        const warn = document.getElementById('sd-rec-warn');
        if (recording) { stopRecordingHard(); return; }
        if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { warn.classList.remove('hidden'); warn.textContent = 'Trình duyệt không hỗ trợ ghi âm.'; return; }
        try { recStream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
        catch (e) { warn.classList.remove('hidden'); warn.textContent = 'Bạn chưa cấp quyền micro.'; return; }
        warn.classList.add('hidden');
        resetRecordUI();
        recHeard = '';

        // ghi âm để nghe lại
        if (window.MediaRecorder) {
            recChunks = [];
            try {
                mediaRecorder = new MediaRecorder(recStream);
                mediaRecorder.ondataavailable = (ev) => { if (ev.data.size) recChunks.push(ev.data); };
                mediaRecorder.onstop = () => {
                    if (!recChunks.length) return;
                    const blob = new Blob(recChunks, { type: recChunks[0].type || 'audio/webm' });
                    const a = document.getElementById('sd-rec-audio'); a.src = URL.createObjectURL(blob); a.classList.remove('hidden');
                };
                mediaRecorder.start();
            } catch (e) {}
        }

        // nhận diện giọng nói để chấm
        if (SR) {
            try {
                recognition = new SR(); recognition.lang = 'zh-CN'; recognition.interimResults = false; recognition.maxAlternatives = 1;
                recognition.onresult = (ev) => { recHeard = ev.results[0][0].transcript || ''; };
                recognition.onerror = (ev) => {
                    if (ev.error === 'not-allowed') { warn.classList.remove('hidden'); warn.textContent = 'Chưa cấp quyền micro.'; }
                    else if (ev.error === 'network') { warn.classList.remove('hidden'); warn.textContent = 'Không kết nối được máy chủ nhận diện (thử mạng ổn định).'; }
                };
                recognition.onend = () => { finishScoring(); };
                recognition.start();
            } catch (e) {}
        } else {
            warn.classList.remove('hidden'); warn.textContent = 'Trình duyệt không nhận diện giọng nói. Vẫn ghi âm để nghe lại.';
        }

        recording = true;
        setRecBtn(true);
    };
    function stopRecordingHard() {
        if (recognition) { try { recognition.stop(); } catch (e) {} }
        if (mediaRecorder && mediaRecorder.state === 'recording') { try { mediaRecorder.stop(); } catch (e) {} }
        if (recStream) { try { recStream.getTracks().forEach(t => t.stop()); } catch (e) {} }
        recording = false;
        setRecBtn(false);
    }

    function finishScoring() {
        recording = false;
        setRecBtn(false);
        const c = cues[curCueIdx]; if (!c) return;
        const ref = normHanzi(gc(c.text));
        const got = normHanzi(recHeard);
        const mask = lcsMask(ref, got);
        const matched = mask.filter(Boolean).length;
        const total = ref.length;
        let colored = '', k = 0;
        for (const ch of gc(c.text)) {
            if (/[一-龥]/.test(ch)) { colored += `<span class="${mask[k++] ? 'text-emerald-600' : 'text-td-red'}">${esc(ch)}</span>`; }
            else colored += `<span class="text-slate-400">${esc(ch)}</span>`;
        }
        document.getElementById('sd-cur-pinyin').textContent = pyOf(c.text);
        document.getElementById('sd-cur-vi').textContent = c._vi || '';
        document.getElementById('sd-rec-heard').innerHTML = recHeard ? esc(recHeard) : '<i class="text-slate-400">(không nghe rõ)</i>';
        document.getElementById('sd-rec-colored').innerHTML = colored;
        document.getElementById('sd-result-empty').classList.add('hidden');
        document.getElementById('sd-result-filled').classList.remove('hidden');

        const score = document.getElementById('sd-rec-score');
        const pct = total ? Math.round(matched / total * 100) : 0;
        const pctCls = pct >= 85 ? 'bg-emerald-100 text-emerald-700' : pct >= 60 ? 'bg-accent/25 text-accentHover' : 'bg-rose-100 text-rose-600';
        score.innerHTML = `<span class="px-3 py-1 rounded-full ${pctCls}">${matched}/${total} từ đúng · ${pct}%</span>`;
        score.className = 'mt-2 text-xs font-black';
        // Gamification: câu đọc đạt >= 60% mới được cộng điểm (điểm cố định ở server)
        if (pct >= 60 && typeof recordLearningActivity === 'function') recordLearningActivity('shadowing');
    }
    function lcsMask(a, b) {
        const n = a.length, m = b.length;
        const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
        for (let x = n - 1; x >= 0; x--) for (let y = m - 1; y >= 0; y--) dp[x][y] = a[x] === b[y] ? dp[x + 1][y + 1] + 1 : Math.max(dp[x + 1][y], dp[x][y + 1]);
        const mask = new Array(n).fill(false); let x = 0, y = 0;
        while (x < n && y < m) { if (a[x] === b[y]) { mask[x] = true; x++; y++; } else if (dp[x + 1][y] >= dp[x][y + 1]) x++; else y++; }
        return mask;
    }

    document.addEventListener('visibilitychange', () => { if (document.hidden && media.ready()) { try { media.pause(); } catch (e) {} } });

    // Hotkeys máy tính: Space (Phát/Dừng), R (Thu âm), ArrowLeft/Right (Đổi câu), L (Lặp), P (Nghe lại)
    window.addEventListener('keydown', (e) => {
        const view = document.getElementById('view-shadowing');
        const detail = document.getElementById('shadow-detail');
        if (!view || view.classList.contains('hidden') || !detail || detail.classList.contains('hidden')) return;

        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;

        const k = (e.key || '').toLowerCase();
        if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
            e.preventDefault();
            if (typeof window.shadowTogglePlay === 'function') window.shadowTogglePlay();
        } else if (e.code === 'KeyR' || k === 'r') {
            e.preventDefault();
            if (typeof window.shadowToggleRecord === 'function') window.shadowToggleRecord();
        } else if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft') {
            e.preventDefault();
            if (typeof window.shadowPrevCue === 'function') window.shadowPrevCue();
        } else if (e.code === 'ArrowRight' || e.key === 'ArrowRight') {
            e.preventDefault();
            if (typeof window.shadowNextCue === 'function') window.shadowNextCue();
        } else if (e.code === 'KeyL' || k === 'l') {
            e.preventDefault();
            if (typeof window.shadowToggleLoop === 'function') window.shadowToggleLoop();
        } else if (e.code === 'KeyP' || k === 'p') {
            e.preventDefault();
            if (typeof window.shadowReplayCue === 'function') window.shadowReplayCue();
        } else if (e.code === 'Escape' || e.key === 'Escape') {
            const m = document.getElementById('sd-cc-menu');
            if (m && !m.classList.contains('hidden')) {
                e.preventDefault();
                m.classList.add('hidden');
                syncCCBtnState();
                return;
            }
            if (recording && typeof window.shadowToggleRecord === 'function') {
                e.preventDefault();
                window.shadowToggleRecord();
            }
        }
    });
})();
