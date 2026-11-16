let radData = null;          // full array
    let radByChar = {};          // radical char -> obj
    let radDecomp = {};          // traditional char -> decomposition obj
    let radLoaded = false;
    let radMode = 'learn';
    let radGroupFilter = null;   // group key or null
    const RAD_COMMON_N = 50;

    // Nhóm chủ đề (theo số Kangxi) — giúp học sinh hình dung theo trường nghĩa
    const RAD_GROUPS = {
        nature:  { label: 'Thiên nhiên', icon: 'fa-mountain-sun', ids: [32,46,47,72,74,75,84,85,86,102,112,115,118,119,140,167,173,15,99,201,203,106,174] },
        human:   { label: 'Con người & cơ thể', icon: 'fa-person', ids: [9,10,19,29,30,37,38,39,61,64,80,82,88,92,107,109,117,125,128,130,132,135,143,157,158,176,181,185,188,190,209,211] },
        animal:  { label: 'Động vật', icon: 'fa-paw', ids: [93,94,123,124,142,148,152,153,172,187,195,196,198,205,208,212,213] },
        object:  { label: 'Đồ vật & công cụ', icon: 'fa-toolbox', ids: [16,18,50,57,62,63,68,69,91,98,108,110,111,121,122,127,134,137,145,154,159,164,169,184,193,206,207,214,120] },
        action:  { label: 'Hành động & khái niệm', icon: 'fa-bolt', ids: [60,66,76,77,144,147,149,156,162,113,100,101,180,182,183] }
    };
    function radGroupOf(id) {
        for (const k in RAD_GROUPS) if (RAD_GROUPS[k].ids.includes(id)) return k;
        return 'other';
    }

    // ---- tiến độ (localStorage) ----
    function radLoadSet(key) { try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch (e) { return new Set(); } }
    function radSaveSet(key, s) { try { localStorage.setItem(key, JSON.stringify([...s])); } catch (e) {} }
    let radSeen = radLoadSet('radSeen');
    let radKnown = radLoadSet('radKnown');

    async function initRadicals() {
        setRadMode('learn');
        if (radLoaded) { renderRadicals(); updateRadSidebar(); return; }
        try {
            const [r1, r2] = await Promise.all([
                fetch('/dict/radicals.json').then(r => r.json()),
                fetch('/dict/char_decomp.json').then(r => r.json())
            ]);
            radData = r1;
            radDecomp = r2;
            radByChar = {};
            radData.forEach(r => { radByChar[r.radical] = r; });
            radLoaded = true;
            document.getElementById('rad-loading').classList.add('hidden');
            renderGroupChips();
            renderRadicals();
            updateRadSidebar();
        } catch (e) {
            document.getElementById('rad-loading').innerHTML = '<p class="text-sm text-red-400 font-medium">Không tải được dữ liệu bộ thủ.</p>';
        }
    }

    function setRadMode(mode) {
        radMode = mode;
        ['learn', 'write', 'quiz'].forEach(m => {
            const btn = document.getElementById('rad-mode-' + m);
            const panel = document.getElementById('rad-panel-' + m);
            const active = m === mode;
            if (panel) panel.classList.toggle('hidden', !active);
            if (btn) {
                btn.classList.toggle('bg-white', active);
                btn.classList.toggle('text-primary', active);
                btn.classList.toggle('shadow-sm', active);
                btn.classList.toggle('text-slate-500', !active);
            }
        });
        if (mode === 'write' && radLoaded) radWriteNext();
    }

    // ---------- SIDEBAR ----------
    function radDailyPick() {
        const d = new Date();
        const seed = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
        const pool = [...radData].sort((a, b) => a.rank - b.rank).slice(0, RAD_COMMON_N);
        return pool[seed % pool.length];
    }

    let dailyRadWriter = null;
    function updateRadSidebar() {
        if (!radLoaded) return;
        // daily
        const daily = radDailyPick();
        const dailyDisp = getChar(daily.radical);
        const charEl = document.getElementById('rad-daily-char');
        if (charEl) charEl.textContent = dailyDisp;
        const bgEl = document.getElementById('rad-daily-bg');
        if (bgEl) bgEl.textContent = dailyDisp;
        document.getElementById('rad-daily-name').textContent = `${daily.hanviet} · ${daily.pinyin}`;
        document.getElementById('rad-daily-meaning').textContent = daily.meaning_vi;
        document.getElementById('rad-daily-open').onclick = () => openRadDetail(daily.radical);

        const dailyWriterBox = document.getElementById('rad-daily-writer');
        if (dailyWriterBox) {
            dailyWriterBox.onclick = () => openRadDetail(daily.radical);
            dailyWriterBox.classList.add('cursor-pointer', 'hover:scale-105', 'transition-transform');
            dailyWriterBox.title = 'Bấm để xem chi tiết bộ thủ';
        }

        // Animate nét viết HanziWriter mượt mà, sắc nét trên nền gradient
        if (typeof HanziWriter !== 'undefined') {
            if (dailyRadWriter) {
                try { dailyRadWriter.cancelQuiz && dailyRadWriter.cancelQuiz(); } catch (e) {}
                dailyRadWriter = null;
            }
            dailyRadWriter = drawWriter('rad-daily-writer', dailyDisp, {
                width: 88,
                height: 88,
                padding: 10,
                showCharacter: false,
                strokeColor: '#ffffff',
                radicalColor: '#ffffff',
                showOutline: true,
                outlineColor: 'rgba(255, 255, 255, 0.20)',
                delayBetweenLoops: 1400,
                delayBetweenStrokes: 130,
                strokeAnimationSpeed: 1.2,
                onLoadCharDataError: function () {
                    const el = document.getElementById('rad-daily-writer');
                    if (el) el.innerHTML = `<span id="rad-daily-char" class="text-5xl font-black font-tc text-white select-none drop-shadow-sm">${dailyDisp}</span>`;
                }
            });
            if (dailyRadWriter) dailyRadWriter.loopCharacterAnimation();
        }
        // progress
        const top50 = new Set([...radData].sort((a, b) => a.rank - b.rank).slice(0, RAD_COMMON_N).map(r => r.id));
        const knownTop = [...radKnown].filter(id => top50.has(id)).length;
        const knownAll = [...radKnown].filter(id => radData.some(r => r.id === id)).length;
        document.getElementById('rad-progress-top-num').textContent = `${knownTop}/50`;
        document.getElementById('rad-progress-top-bar').style.width = `${(knownTop / 50) * 100}%`;
        document.getElementById('rad-progress-all-num').textContent = `${knownAll}/214`;
        document.getElementById('rad-progress-all-bar').style.width = `${(knownAll / 214) * 100}%`;
        document.getElementById('rad-hero-known').innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i>${knownAll} đã thuộc`;
        document.getElementById('rad-progress-badge').textContent = radSeen.size ? `${radSeen.size} đã xem` : '';
    }

    function renderGroupChips() {
        const wrap = document.getElementById('rad-group-chips');
        if (!wrap) return;
        const chip = (key, label, icon) => {
            const active = radGroupFilter === key;
            return `<button onclick="setRadGroup(${key ? `'${key}'` : 'null'})" class="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${active ? 'bg-primary text-white shadow-sm' : 'bg-white ring-1 ring-slate-200 text-slate-500 hover:ring-primary/40 hover:text-primary'}">${icon ? `<i class="fa-solid ${icon} mr-1"></i>` : ''}${label}</button>`;
        };
        let html = chip(null, 'Tất cả', 'fa-border-all');
        for (const k in RAD_GROUPS) html += chip(k, RAD_GROUPS[k].label, RAD_GROUPS[k].icon);
        wrap.innerHTML = html;
    }

    function setRadGroup(key) {
        radGroupFilter = key;
        renderGroupChips();
        renderRadicals();
    }

    // ---------- LEARN grid ----------
    function radCardHtml(r, ctx) {
        const disp = getChar(r.radical);
        const known = radKnown.has(r.id);
        const seen = radSeen.has(r.id);
        const dot = known
            ? '<span class="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center text-[9px]"><i class="fa-solid fa-check"></i></span>'
            : (seen ? '<span class="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-sky-300"></span>' : '');
        const wid = `rad-w-${ctx}-${r.id}`;
        const boxClass = 'bg-gradient-to-br from-[#0A93D4] via-[#027AB3] to-[#015E8C] ring-1 ring-primary/20';
        const charClass = 'text-white';
        const strokeColor = '#ffffff';
        const radicalColor = '#ffd166';
        return `<button onclick="openRadDetail('${r.radical}')" class="group relative text-left bg-white ring-1 ring-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_30px_-8px_rgba(0,114,188,0.25)] hover:ring-primary/30 hover:-translate-y-0.5 transition-all duration-300">
            ${dot}
            <div class="flex items-start gap-3.5 sm:gap-4">
                <div id="${wid}" data-rad-char="${disp}" data-rad-stroke="${strokeColor}" data-rad-radical="${radicalColor}" data-rad-text-class="${charClass}" class="w-16 h-16 sm:w-[72px] sm:h-[72px] shrink-0 rounded-2xl ${boxClass} flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform">
                    <span class="text-[38px] sm:text-[46px] leading-none font-black ${charClass} font-tc">${disp}</span>
                </div>
                <div class="min-w-0 pt-1">
                    <div class="text-[15px] sm:text-base font-black text-slate-700 truncate">${r.hanviet}</div>
                    <div class="text-[12px] sm:text-[13px] text-slate-400 font-bold truncate">${r.pinyin}</div>
                </div>
            </div>
            <div class="text-[12px] sm:text-[13px] text-slate-500 font-semibold truncate mt-3">${r.meaning_vi}</div>
            <div class="mt-2 flex items-center gap-2.5 text-[10.5px] sm:text-[11px] text-slate-400 font-bold">
                <span class="${r.rank <= RAD_COMMON_N ? 'text-amber-500' : ''}">#${r.rank}</span>
                <span><i class="fa-solid fa-pen-nib mr-0.5"></i>${r.strokes} nét</span>
                <span><i class="fa-solid fa-font mr-0.5"></i>${r.char_count} chữ</span>
            </div>
        </button>`;
    }

    // Chạy HanziWriter (nét trắng, nền gradient) trên từng card khi card lọt vào khung hình — lazy render mượt mà
    let radCardObserver = null;
    function initRadCardWriters() {
        if (typeof HanziWriter === 'undefined') return;
        if (!radCardObserver) {
            radCardObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    const el = entry.target;
                    radCardObserver.unobserve(el);
                    const char = el.dataset.radChar;
                    const textClass = el.dataset.radTextClass || 'text-white';
                    const w = drawWriter(el.id, char, {
                        width: el.clientWidth || 72,
                        height: el.clientHeight || 72,
                        padding: 10,
                        showCharacter: false,
                        strokeColor: el.dataset.radStroke || '#ffffff',
                        radicalColor: el.dataset.radRadical || '#ffffff',
                        showOutline: true,
                        outlineColor: 'rgba(255, 255, 255, 0.20)',
                        delayBetweenStrokes: 180,
                        delayBetweenLoops: 1800,
                        strokeAnimationSpeed: 1.2,
                        onLoadCharDataError: function () {
                            el.innerHTML = `<span class="text-[38px] sm:text-[46px] leading-none font-black ${textClass} font-tc">${char}</span>`;
                        }
                    });
                    if (w) w.loopCharacterAnimation();
                });
            }, { rootMargin: '150px' });
        }
        document.querySelectorAll('[data-rad-char]:not([data-rad-observed])').forEach(el => {
            el.dataset.radObserved = '1';
            radCardObserver.observe(el);
        });
    }

    function renderRadicals() {
        if (!radLoaded) return;
        const term = (document.getElementById('rad-search').value || '').toLowerCase().trim();
        const match = (r) => {
            const okTerm = !term ||
                r.radical.includes(term) ||
                (r.hanviet || '').toLowerCase().includes(term) ||
                (r.pinyin || '').toLowerCase().includes(term) ||
                (r.meaning_vi || '').toLowerCase().includes(term);
            const okGroup = !radGroupFilter || radGroupOf(r.id) === radGroupFilter;
            return okTerm && okGroup;
        };

        const commonWrap = document.getElementById('rad-common-wrap');
        const allWrap = document.getElementById('rad-all-wrap');
        const empty = document.getElementById('rad-empty');

        if (term || radGroupFilter) {
            // danh sách phẳng đã lọc, ẩn khối Top 50
            const list = radData.filter(match).sort((a, b) => a.rank - b.rank);
            commonWrap.classList.add('hidden');
            document.getElementById('rad-all-grid').innerHTML = list.map(r => radCardHtml(r, 'flat')).join('');
            document.getElementById('rad-all-count').textContent = `(${list.length})`;
            allWrap.classList.toggle('hidden', list.length === 0);
            empty.classList.toggle('hidden', list.length !== 0);
            empty.classList.toggle('flex', list.length === 0);
            initRadCardWriters();
            return;
        }

        const byRank = [...radData].sort((a, b) => a.rank - b.rank);
        const common = byRank.slice(0, RAD_COMMON_N);
        document.getElementById('rad-common-grid').innerHTML = common.map(r => radCardHtml(r, 'common')).join('');
        commonWrap.classList.remove('hidden');
        document.getElementById('rad-all-grid').innerHTML = byRank.map(r => radCardHtml(r, 'all')).join('');
        document.getElementById('rad-all-count').textContent = '(214)';
        allWrap.classList.remove('hidden');
        empty.classList.add('hidden');
        initRadCardWriters();
    }

    // ---------- DETAIL modal (bố cục kiểu từ điển: trái viết nét, phải thông tin) ----------
    let radWriter = null;

    function openRadDetail(radChar) {
        const r = radByChar[radChar];
        if (!r) return;
        const disp = getChar(r.radical);
        const imgPath = `/image/radicals/${r.id}.png`;
        const known = radKnown.has(r.id);
        const groupKey = radGroupOf(r.id);
        const groupLabel = RAD_GROUPS[groupKey] ? RAD_GROUPS[groupKey].label : 'Khác';

        const ety = r.etymology_vi ? `<div class="mt-3 bg-amber-50/70 border border-amber-100 rounded-2xl p-3.5">
                <div class="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1"><i class="fa-solid fa-scroll mr-1"></i>Nguồn gốc & cách nhớ</div>
                <div class="text-[13px] text-slate-600 font-medium leading-relaxed font-tc">${r.etymology_vi}</div>
            </div>` : '';

        const chips = (r.example_chars || []).map(c => {
            const d = getChar(c);
            return `<div class="relative group/chip">
                <button onclick="showMoChu('${c}')" class="mo-chu-chip w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-50 ring-1 ring-slate-200 text-xl sm:text-2xl font-bold text-slate-700 hover:bg-primary hover:text-white hover:ring-primary transition-all font-tc" title="Bấm để mổ chữ">${d}</button>
                <button data-text="${encodeURIComponent(d)}" onclick="event.stopPropagation(); playTTS(this.getAttribute('data-text'), event)" title="Nghe phát âm" class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center text-[9px] opacity-0 group-hover/chip:opacity-100 transition-opacity border-0"><i class="fa-solid fa-volume-high"></i></button>
            </div>`;
        }).join('');

        document.getElementById('rad-detail-body').innerHTML = `
            <div class="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 px-5 py-3 flex items-center justify-between z-10">
                <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[10px] font-black px-2 py-0.5 rounded-md ${r.rank <= RAD_COMMON_N ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200' : 'bg-slate-100 text-slate-400'}"><i class="fa-solid fa-star mr-0.5"></i>Bộ #${r.rank}</span>
                    <span class="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">Kangxi ${r.id}</span>
                    <span class="text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-50 text-sky-600 ring-1 ring-sky-100">${groupLabel}</span>
                </div>
                <button onclick="closeRadDetail()" class="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-all shrink-0"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="p-5 sm:p-7">
                <div class="flex flex-col sm:flex-row gap-5 sm:gap-7">
                    <!-- Cột trái: khung viết + ảnh minh hoạ -->
                    <div class="flex flex-col items-center shrink-0">
                        <div class="rounded-2xl ring-1 ring-sky-100/70 bg-gradient-to-br from-sky-50 to-white mb-2.5 flex items-center justify-center relative overflow-hidden" style="width:190px;height:190px;">
                            <span class="absolute inset-0 pointer-events-none opacity-[0.06]" style="background-image:linear-gradient(to right,#94a3b8 1px,transparent 1px),linear-gradient(to bottom,#94a3b8 1px,transparent 1px);background-size:50% 50%;background-position:center;"></span>
                            <div id="rad-detail-writer" class="relative z-10 w-full h-full flex items-center justify-center">
                                <span class="text-[100px] leading-none font-black text-primary font-tc">${disp}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button onclick="radDetailAnimate('${r.radical}')" class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-slate-200 transition-all"><i class="fa-solid fa-play mr-1"></i>Cách viết</button>
                            <button onclick="radDetailQuizWrite('${r.radical}')" class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary hover:text-white transition-all"><i class="fa-solid fa-pen mr-1"></i>Viết thử</button>
                            <button data-text="${encodeURIComponent(disp)}" onclick="playTTS(this.getAttribute('data-text'), event)" class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 active:bg-primary active:text-white text-[11px] font-bold transition-all border-0 outline-none" title="Phát âm"><i class="fa-solid fa-volume-high pointer-events-none transition-transform"></i></button>
                        </div>
                        <img src="${imgPath}" alt="minh hoạ ${r.hanviet}" onerror="this.style.display='none'" class="mt-3 max-w-[190px] rounded-2xl ring-1 ring-slate-100">
                    </div>
                    <!-- Cột phải: thông tin -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-baseline gap-2 flex-wrap">
                            <span class="text-3xl font-black text-slate-800">${r.hanviet}</span>
                            <span class="text-lg font-bold text-primary">${r.pinyin}</span>
                        </div>
                        <div class="text-base text-slate-600 font-semibold mt-0.5 mb-3">${r.meaning_vi} <span class="text-slate-400 font-medium text-sm">· ${r.english}</span></div>
                        <div class="flex items-center gap-1.5 flex-wrap text-[11px] font-bold mb-1">
                            <span class="px-2.5 py-1 rounded-lg bg-slate-50 ring-1 ring-slate-100 text-slate-600"><i class="fa-solid fa-pen-nib mr-1 text-slate-400"></i>${r.strokes} nét</span>
                            <span class="px-2.5 py-1 rounded-lg bg-slate-50 ring-1 ring-slate-100 text-slate-600"><i class="fa-solid fa-font mr-1 text-slate-400"></i>${r.char_count} chữ chứa bộ</span>
                        </div>
                        ${ety}
                        <div class="mt-4 flex items-center gap-2 flex-wrap">
                            <button id="rad-known-btn" onclick="toggleRadKnown(${r.id})" class="px-5 py-2.5 rounded-xl text-sm font-black transition-all ${known ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : 'bg-white ring-2 ring-emerald-200 text-emerald-600 hover:bg-emerald-50'}">
                                <i class="fa-solid ${known ? 'fa-circle-check' : 'fa-circle-plus'} mr-1.5"></i>${known ? 'Đã thuộc bộ này' : 'Đánh dấu đã thuộc'}
                            </button>
                            </div>
                    </div>
                </div>

                ${(r.example_chars && r.example_chars.length) ? `
                <div class="mt-7">
                    <div class="flex items-center gap-2 mb-2.5">
                        <span class="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs"><i class="fa-solid fa-scissors"></i></span>
                        <span class="text-xs font-black text-slate-600 uppercase tracking-widest">Chữ chứa bộ này — bấm để mổ chữ</span>
                    </div>
                    <div class="flex flex-wrap gap-2">${chips}</div>
                    <div id="mo-chu-panel" class="hidden mt-4"></div>
                </div>` : ''}


            </div>`;

        document.getElementById('rad-detail-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        

        radWriter = drawWriter('rad-detail-writer', disp, { width: 190, height: 190, padding: 42, showCharacter: false, strokeColor: '#027AB3', radicalColor: '#e8794b', showOutline: true, delayBetweenStrokes: 300 });
        if (radWriter) radWriter.loopCharacterAnimation();

        // đánh dấu đã xem
        if (!radSeen.has(r.id)) { radSeen.add(r.id); radSaveSet('radSeen', radSeen); }
        updateRadSidebar();
    }

    function toggleRadKnown(id) {
        if (radKnown.has(id)) radKnown.delete(id); else radKnown.add(id);
        radSaveSet('radKnown', radKnown);
        const known = radKnown.has(id);
        const btn = document.getElementById('rad-known-btn');
        if (btn) {
            btn.className = `mt-4 w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-black transition-all ${known ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : 'bg-white ring-2 ring-emerald-200 text-emerald-600 hover:bg-emerald-50'}`;
            btn.innerHTML = `<i class="fa-solid ${known ? 'fa-circle-check' : 'fa-circle-plus'} mr-1.5"></i>${known ? 'Đã thuộc bộ này' : 'Đánh dấu đã thuộc'}`;
        }
        updateRadSidebar();
    }

    function closeRadDetail() {
        document.getElementById('rad-detail-modal').classList.add('hidden');
        document.body.style.overflow = '';
        if (radWriter) { try { radWriter.cancelQuiz && radWriter.cancelQuiz(); } catch (e) {} radWriter = null; }
        renderRadicals(); // cập nhật dot trạng thái trên card
    }

    // Vẽ HanziWriter vào target; fallback im lặng nếu không có data
    function drawWriter(targetId, char, opts) {
        if (typeof HanziWriter === 'undefined') return null;
        const el = document.getElementById(targetId);
        if (!el) return null;
        el.innerHTML = '';
        try {
            return HanziWriter.create(targetId, char, Object.assign({
                width: el.clientWidth || 180,
                height: el.clientHeight || 180,
                padding: Math.round((el.clientWidth || 180) * 0.18),
                strokeColor: '#0072bc',
                radicalColor: '#e8794b',
                showOutline: true,
                outlineColor: '#e2e8f0',
                delayBetweenStrokes: 180,
                onLoadCharDataError: function () {
                    el.innerHTML = `<span class="text-6xl font-black text-primary font-tc flex items-center justify-center h-full">${char}</span>`;
                }
            }, opts || {}));
        } catch (e) { return null; }
    }

    function radDetailAnimate(radChar) {
        radWriter = drawWriter('rad-detail-writer', getChar(radChar), { width: 190, height: 190, showCharacter: false });
        if (radWriter) radWriter.animateCharacter();
    }

    function radDetailQuizWrite(radChar) {
        radWriter = drawWriter('rad-detail-writer', getChar(radChar), { width: 190, height: 190, showCharacter: false, showHintAfterMisses: 2 });
        if (radWriter) radWriter.quiz();
    }

    // ---------- MỔ CHỮ ----------
    function showMoChu(tradChar) {
        const key = tradChar; // lưu phồn thể
        const d = radDecomp[key] || radDecomp[getChar(key)] || null;
        const disp = getChar(tradChar);
        const panel = document.getElementById('mo-chu-panel');
        if (!panel) return;

        let compHtml = '';
        if (d && d.components && d.components.length) {
            compHtml = d.components.map(c => {
                const rc = radByChar[c];
                const sub = rc ? `${rc.hanviet} · ${rc.meaning_vi}` : 'thành phần';
                const cd = getChar(c);
                return `<div class="flex items-center gap-2.5 bg-white ring-1 ring-slate-200 rounded-xl px-3 py-2">
                    <span class="text-2xl font-black ${rc ? 'text-primary' : 'text-slate-600'} font-tc">${cd}</span>
                    <div class="min-w-0">
                        <div class="text-xs font-bold text-slate-700 truncate">${sub}</div>
                        ${rc ? `<div class="text-[10px] text-amber-600 font-bold">bộ thủ #${rc.rank}</div>` : ''}
                    </div>
                </div>`;
            }).join('');
        } else {
            compHtml = '<p class="text-xs text-slate-400 italic">Chưa có dữ liệu phân tách cho chữ này.</p>';
        }

        panel.innerHTML = `
            <div class="bg-gradient-to-br from-slate-50 to-white ring-1 ring-slate-200 rounded-2xl p-4">
                <div class="flex items-start gap-4">
                    <div id="mo-chu-writer" class="rounded-xl ring-2 ring-slate-100 bg-white shrink-0 flex items-center justify-center" style="width:110px;height:110px;">
                        <span class="text-6xl font-black text-primary font-tc">${disp}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-lg font-black text-slate-800">${disp} <span class="text-primary text-sm font-bold">${d ? d.pinyin : ''}</span></div>
                        <div class="text-xs text-slate-500 font-medium mb-1.5">${d && d.definition ? d.definition : ''}</div>
                        <div class="flex items-center gap-1.5">
                            <button onclick="moChuAnimate('${tradChar}')" class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-slate-200 transition-all"><i class="fa-solid fa-play mr-1"></i>Cách viết</button>
                            <button data-text="${encodeURIComponent(disp)}" onclick="playTTS(this.getAttribute('data-text'), event)" class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 active:bg-primary active:text-white text-[11px] font-bold transition-all border-0 outline-none" title="Phát âm"><i class="fa-solid fa-volume-high pointer-events-none transition-transform"></i></button>
                        </div>
                    </div>
                </div>
                <div class="mt-3">
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Chữ này gồm các thành phần</div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">${compHtml}</div>
                </div>
                <div class="mt-3">
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Từ ghép thường gặp</div>
                    <div id="mo-chu-words" class="flex flex-wrap gap-2"><span class="text-xs text-slate-400 italic">Đang tải...</span></div>
                </div>
            </div>`;
        panel.classList.remove('hidden');
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        loadMoChuWords(disp);
    }

    function moChuAnimate(tradChar) {
        const w = drawWriter('mo-chu-writer', getChar(tradChar), { width: 110, height: 110, padding: 24, showCharacter: false });
        if (w) w.animateCharacter();
    }

    // Từ ghép chứa chữ này — dùng lại API tra từ điển trung tâm (dict_lookup_search),
    // xin token ngắn hạn giống dict_lookup.php để qua được lớp chống-cào.
    let _moChuToken = null, _moChuTokenAt = 0;
    async function moChuGetToken() {
        if (_moChuToken && (Date.now() - _moChuTokenAt) < 100000) return _moChuToken;
        const res = await fetch('/api.php?action=dict_search_token');
        const json = await res.json();
        _moChuToken = { ts: json.ts, token: json.token };
        _moChuTokenAt = Date.now();
        return _moChuToken;
    }

    async function loadMoChuWords(char) {
        const wrap = document.getElementById('mo-chu-words');
        if (!wrap) return;
        try {
            const t = await moChuGetToken();
            const res = await fetch(`/api.php?action=dict_lookup_search&q=${encodeURIComponent(char)}&ts=${t.ts}&token=${t.token}`, { referrerPolicy: 'same-origin' });
            const json = await res.json();
            const words = (json.data || []).filter(e => e.hanzi && e.hanzi.length > 1).slice(0, 8);
            if (!words.length) {
                wrap.innerHTML = '<span class="text-xs text-slate-400 italic">Chưa tìm thấy từ ghép.</span>';
                return;
            }
            wrap.innerHTML = words.map(w => `
                <button onclick="if (typeof dictLookupOpenDetail === 'function') { switchTab('dict-lookup'); dictLookupOpenDetail(${w.dict_id}); }" class="group/word flex items-center gap-1.5 bg-white ring-1 ring-slate-200 rounded-xl pl-3 pr-1.5 py-1.5 hover:ring-primary/40 hover:bg-primary/5 transition-all text-left">
                    <span class="min-w-0">
                        <span class="block text-sm font-black text-slate-800 font-tc">${w.hanzi}</span>
                        <span class="block text-[10px] text-slate-400 font-bold truncate max-w-[110px]">${w.pinyin || ''}${w.first_meaning_vi ? ' · ' + w.first_meaning_vi : ''}</span>
                    </span>
                    <span data-text="${encodeURIComponent(w.hanzi)}" onclick="event.stopPropagation(); playTTS(this.getAttribute('data-text'), event)" class="w-6 h-6 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center text-[10px] shrink-0 border-0"><i class="fa-solid fa-volume-high"></i></span>
                </button>`).join('');
        } catch (err) {
            wrap.innerHTML = '<span class="text-xs text-slate-400 italic">Không tải được từ ghép.</span>';
        }
    }

    // ---------- LUYỆN VIẾT ----------
    let radWriteObj = null;
    let radWriteInstance = null;

    function radWritePickPool() {
        return [...radData].sort((a, b) => a.rank - b.rank).slice(0, RAD_COMMON_N);
    }

    function radWriteNext() {
        if (!radLoaded) return;
        const pool = radWritePickPool();
        radWriteObj = pool[Math.floor(Math.random() * pool.length)];
        document.getElementById('rad-write-info').innerHTML =
            `<div class="text-2xl font-black text-slate-800">${radWriteObj.hanviet} <span class="text-slate-400 text-lg">${radWriteObj.pinyin}</span></div>
             <div class="text-sm text-slate-500 font-semibold">${radWriteObj.meaning_vi}</div>`;
        document.getElementById('rad-write-status').textContent = '';
        radWriteQuiz();
    }

    function radWriteAnimate() {
        if (!radWriteObj) return;
        radWriteInstance = drawWriter('rad-write-target', getChar(radWriteObj.radical), { width: 240, height: 240, padding: 52, showCharacter: false });
        if (radWriteInstance) radWriteInstance.animateCharacter();
        else document.getElementById('rad-write-status').textContent = 'Bộ này chưa có dữ liệu nét.';
    }

    function radWriteQuiz() {
        if (!radWriteObj) return;
        const status = document.getElementById('rad-write-status');
        radWriteInstance = drawWriter('rad-write-target', getChar(radWriteObj.radical), {
            width: 240, height: 240, padding: 52, showCharacter: false, showHintAfterMisses: 2
        });
        if (!radWriteInstance) { status.textContent = 'Bộ này chưa có dữ liệu nét — bấm "Bộ khác".'; return; }
        status.textContent = 'Dùng chuột/ngón tay viết theo nét.';
        radWriteInstance.quiz({
            onComplete: function () {
                status.innerHTML = '<span class="text-emerald-500"><i class="fa-solid fa-circle-check mr-1"></i>Chính xác! Giỏi lắm.</span>';
            }
        });
    }

    // ---------- QUIZ ----------
    let radQuizQs = [];
    let radQuizIdx = 0;
    let radQuizScore = 0;
    let radQuizLock = false;

    function startRadQuiz() {
        if (!radLoaded) return;
        const pool = [...radData].sort((a, b) => a.rank - b.rank).slice(0, 80);
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        radQuizQs = shuffled.slice(0, 10).map(correct => {
            const cMeaning = (correct.meaning_vi || '').trim().toLowerCase();
            const cRad = (correct.radical || '').trim();
            const others = pool.filter(x => x.id !== correct.id).sort(() => Math.random() - 0.5);
            const distractors = [];
            const usedMeanings = new Set([cMeaning]);
            const usedRads = new Set([cRad]);
            for (const x of others) {
                if (distractors.length >= 3) break;
                const m = (x.meaning_vi || '').trim().toLowerCase();
                const r = (x.radical || '').trim();
                if (!m || usedMeanings.has(m) || usedRads.has(r)) continue;
                usedMeanings.add(m);
                usedRads.add(r);
                distractors.push(x);
            }
            const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
            return { correct, options };
        });
        radQuizIdx = 0; radQuizScore = 0;
        document.getElementById('rad-quiz-start').classList.add('hidden');
        document.getElementById('rad-quiz-result').classList.add('hidden');
        document.getElementById('rad-quiz-play').classList.remove('hidden');
        renderRadQuiz();
    }

    function renderRadQuiz() {
        radQuizLock = false;
        const q = radQuizQs[radQuizIdx];
        document.getElementById('rad-quiz-progress').textContent = `Câu ${radQuizIdx + 1}/${radQuizQs.length}`;
        document.getElementById('rad-quiz-score').textContent = `Điểm: ${radQuizScore}`;
        document.getElementById('rad-quiz-bar').style.width = `${(radQuizIdx / radQuizQs.length) * 100}%`;
        document.getElementById('rad-quiz-char').textContent = getChar(q.correct.radical);
        document.getElementById('rad-quiz-options').innerHTML = q.options.map(o =>
            `<button onclick="answerRadQuiz(${o.id})" data-id="${o.id}" class="rad-quiz-opt text-left px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-700 hover:border-primary hover:bg-primary/5 transition-all">
                ${o.meaning_vi} <span class="text-slate-400 font-semibold">(${o.hanviet})</span>
            </button>`).join('');
    }

    function answerRadQuiz(pickedId) {
        if (radQuizLock) return;
        radQuizLock = true;
        const q = radQuizQs[radQuizIdx];
        const correctId = q.correct.id;
        if (pickedId === correctId) radQuizScore++;
        document.querySelectorAll('.rad-quiz-opt').forEach(btn => {
            const id = parseInt(btn.dataset.id);
            if (id === correctId) { btn.classList.add('border-emerald-400', 'bg-emerald-50', 'text-emerald-700'); }
            else if (id === pickedId) { btn.classList.add('border-red-300', 'bg-red-50', 'text-red-600'); }
            btn.disabled = true;
        });
        document.getElementById('rad-quiz-score').textContent = `Điểm: ${radQuizScore}`;
        setTimeout(() => {
            radQuizIdx++;
            if (radQuizIdx >= radQuizQs.length) finishRadQuiz();
            else renderRadQuiz();
        }, 850);
    }

    function finishRadQuiz() {
        document.getElementById('rad-quiz-play').classList.add('hidden');
        const res = document.getElementById('rad-quiz-result');
        res.classList.remove('hidden');
        const pct = radQuizScore / radQuizQs.length;
        document.getElementById('rad-quiz-result-icon').textContent = pct >= 0.8 ? '🏆' : pct >= 0.5 ? '👍' : '📚';
        document.getElementById('rad-quiz-result-score').textContent = `Bạn trả lời đúng ${radQuizScore}/${radQuizQs.length} câu.`;
        // Gamification: chỉ cộng điểm khi làm đúng >= 50% (tránh bấm bừa để farm)
        if (pct >= 0.5 && typeof recordLearningActivity === 'function') recordLearningActivity('radicals');
    }
