let ltData = [];
    let ltGroups = [];
    let ltActiveGroup = 'all';
    let ltLoaded = false;

    // Bảng màu pastel theo nhóm — mỗi nhóm một sắc thái dịu mắt
    const LT_COLORS = {
        'chung':       { tile: 'from-amber-100 to-amber-50',     ring: 'ring-amber-200/60',   char: 'text-amber-600',   soft: 'bg-amber-50/70',   ic: 'bg-amber-100 text-amber-600',     chip: 'bg-amber-500' },
        'nguoi':       { tile: 'from-sky-100 to-sky-50',         ring: 'ring-sky-200/60',     char: 'text-sky-600',     soft: 'bg-sky-50/70',     ic: 'bg-sky-100 text-sky-600',         chip: 'bg-sky-500' },
        'dong-vat':    { tile: 'from-emerald-100 to-emerald-50', ring: 'ring-emerald-200/60', char: 'text-emerald-600', soft: 'bg-emerald-50/70', ic: 'bg-emerald-100 text-emerald-600', chip: 'bg-emerald-500' },
        'vat-det':     { tile: 'from-violet-100 to-violet-50',   ring: 'ring-violet-200/60',  char: 'text-violet-600',  soft: 'bg-violet-50/70',  ic: 'bg-violet-100 text-violet-600',   chip: 'bg-violet-500' },
        'vat-dai':     { tile: 'from-orange-100 to-orange-50',   ring: 'ring-orange-200/60',  char: 'text-orange-600',  soft: 'bg-orange-50/70',  ic: 'bg-orange-100 text-orange-600',   chip: 'bg-orange-500' },
        'sach-vo':     { tile: 'from-rose-100 to-rose-50',       ring: 'ring-rose-200/60',    char: 'text-rose-600',    soft: 'bg-rose-50/70',    ic: 'bg-rose-100 text-rose-600',       chip: 'bg-rose-500' },
        'phuong-tien': { tile: 'from-cyan-100 to-cyan-50',       ring: 'ring-cyan-200/60',    char: 'text-cyan-600',    soft: 'bg-cyan-50/70',    ic: 'bg-cyan-100 text-cyan-600',       chip: 'bg-cyan-500' },
        'an-uong':     { tile: 'from-fuchsia-100 to-fuchsia-50', ring: 'ring-fuchsia-200/60', char: 'text-fuchsia-600', soft: 'bg-fuchsia-50/70', ic: 'bg-fuchsia-100 text-fuchsia-600', chip: 'bg-fuchsia-500' },
        'quan-ao':     { tile: 'from-teal-100 to-teal-50',       ring: 'ring-teal-200/60',    char: 'text-teal-600',    soft: 'bg-teal-50/70',    ic: 'bg-teal-100 text-teal-600',       chip: 'bg-teal-500' },
        'nha-cua':     { tile: 'from-indigo-100 to-indigo-50',   ring: 'ring-indigo-200/60',  char: 'text-indigo-600',  soft: 'bg-indigo-50/70',  ic: 'bg-indigo-100 text-indigo-600',   chip: 'bg-indigo-500' },
        'truu-tuong':  { tile: 'from-lime-100 to-lime-50',       ring: 'ring-lime-200/60',    char: 'text-lime-600',    soft: 'bg-lime-50/70',    ic: 'bg-lime-100 text-lime-700',       chip: 'bg-lime-500' }
    };
    const LT_FALLBACK = { tile: 'from-slate-100 to-slate-50', ring: 'ring-slate-200/60', char: 'text-slate-600', soft: 'bg-slate-50/70', ic: 'bg-slate-100 text-slate-600', chip: 'bg-slate-500' };
    const ltColor = id => LT_COLORS[id] || LT_FALLBACK;

    function ltEsc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    async function initMeasureWords() {
        if (ltLoaded) return;
        ltLoaded = true;
        try {
            const res = await fetch('/dict/measure_words.json');
            const json = await res.json();
            ltGroups = json.groups || [];
            ltData = json.words || [];
            document.getElementById('lt-loading').classList.add('hidden');
            renderLtChips();
            renderMeasureWords();
        } catch (err) {
            ltLoaded = false;
            const l = document.getElementById('lt-loading');
            if (l) l.innerHTML = '<p class="text-sm font-medium text-rose-400">Không tải được dữ liệu lượng từ.</p>';
        }
    }

    function renderLtChips() {
        const wrap = document.getElementById('lt-group-chips');
        if (!wrap) return;
        const base = 'px-3.5 py-2 rounded-full text-xs sm:text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap ';
        const idle = 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-700 hover:ring-slate-300';
        let html = `<button onclick="filterLtGroup('all')" class="${base}${ltActiveGroup === 'all' ? 'bg-primary text-white shadow-sm shadow-primary/30' : idle}">Tất cả <span class="opacity-60">${ltData.length}</span></button>`;
        ltGroups.forEach(g => {
            const n = ltData.filter(w => w.group === g.id).length;
            if (!n) return;
            const c = ltColor(g.id);
            const on = ltActiveGroup === g.id;
            html += `<button onclick="filterLtGroup('${g.id}')" class="${base}${on ? c.chip + ' text-white shadow-sm' : idle}">${ltEsc(g.label)} <span class="opacity-60">${n}</span></button>`;
        });
        wrap.innerHTML = html;
    }

    function filterLtGroup(id) {
        ltActiveGroup = id;
        renderLtChips();
        renderMeasureWords();
    }

    function ltMatch(w, q) {
        if (!q) return true;
        const hay = [w.char, w.pinyin, w.meaning_vi, w.usage_vi]
            .concat((w.examples || []).flatMap(e => [e.hanzi, e.pinyin, e.vi]))
            .join(' ').toLowerCase();
        return hay.includes(q);
    }

    function ltCard(w) {
        const c = ltColor(w.group);
        const ex = (w.examples || []).map(e => `
            <div class="flex items-center justify-between gap-2 rounded-xl ${c.soft} px-3 py-2">
                <div class="min-w-0">
                    <div class="text-[15px] font-bold text-slate-800 truncate"><span class="font-tc">${ltEsc(e.hanzi)}</span> <span class="${c.char} font-semibold text-xs">${ltEsc(e.pinyin)}</span></div>
                    <div class="text-[11px] text-slate-500 truncate">${ltEsc(e.vi)}</div>
                </div>
                <button onclick="playTTS('${encodeURIComponent(e.hanzi)}', event)" aria-label="Phát âm ${ltEsc(e.hanzi)}" class="shrink-0 w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 active:bg-primary active:text-white flex items-center justify-center transition-all border-0 outline-none">
                    <i class="fa-solid fa-volume-high text-xs pointer-events-none transition-transform"></i>
                </button>
            </div>`).join('');
        return `
        <div class="relative bg-white rounded-[22px] ring-1 ring-slate-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 hover:-translate-y-1 hover:shadow-[0_20px_44px_-14px_rgba(0,0,0,0.14)] transition-all duration-300">
            <div class="flex items-start gap-4">
                <div class="shrink-0 w-[68px] h-[68px] rounded-[20px] bg-gradient-to-br ${c.tile} ring-1 ${c.ring} flex items-center justify-center shadow-inner">
                    <span class="font-tc text-[42px] font-black ${c.char} leading-none">${ltEsc(w.char)}</span>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                        <span class="${c.char} font-bold text-sm tracking-wide">${ltEsc(w.pinyin)}</span>
                        <button onclick="playTTS('${encodeURIComponent(w.char)}', event)" aria-label="Phát âm ${ltEsc(w.char)}" class="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 active:bg-primary active:text-white flex items-center justify-center transition-all border-0 outline-none">
                            <i class="fa-solid fa-volume-high text-xs pointer-events-none transition-transform"></i>
                        </button>
                    </div>
                    <div class="text-[15px] font-black text-slate-800 leading-snug mt-0.5">${ltEsc(w.meaning_vi)}</div>
                    <p class="text-slate-500 text-xs leading-relaxed mt-1.5">${ltEsc(w.usage_vi)}</p>
                </div>
            </div>
            <div class="mt-4 space-y-2">${ex}</div>

        </div>`;
    }


    function renderMeasureWords() {
        const host = document.getElementById('lt-sections');
        if (!host) return;
        const q = (document.getElementById('lt-search').value || '').trim().toLowerCase();
        const empty = document.getElementById('lt-empty');

        const visibleGroups = ltGroups.filter(g => ltActiveGroup === 'all' || g.id === ltActiveGroup);
        let html = '';
        let total = 0;
        visibleGroups.forEach(g => {
            const items = ltData.filter(w => w.group === g.id && ltMatch(w, q));
            if (!items.length) return;
            total += items.length;
            const c = ltColor(g.id);
            html += `
            <section class="mb-9">
                <div class="flex items-center gap-2.5 mb-3.5">
                    <span class="w-9 h-9 rounded-xl ${c.ic} flex items-center justify-center text-sm"><i class="fa-solid ${ltEsc(g.icon)}"></i></span>
                    <div>
                        <h3 class="text-[15px] sm:text-base font-black text-slate-800">${ltEsc(g.label)} <span class="text-slate-300 font-bold">${items.length}</span></h3>
                        <p class="text-[11px] text-slate-400 font-medium">${ltEsc(g.desc)}</p>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${items.map(ltCard).join('')}</div>
            </section>`;
        });

        host.innerHTML = html;
        if (empty) { empty.classList.toggle('hidden', total > 0); empty.classList.toggle('flex', total === 0); }
    }
