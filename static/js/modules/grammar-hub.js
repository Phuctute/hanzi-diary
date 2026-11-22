(function () {
    'use strict';

    // Bảng màu "hub" — dùng chung công thức với vocab_notebook_hub.php (đồng bộ giao diện toàn site).
    var GMH_HUB_THEMES = [
        { grad: 'from-sky-50 to-white',     ring: 'ring-sky-100/70',     iconBg: 'from-sky-400 to-sky-600',       iconShadow: 'shadow-sky-500/30',     text: 'text-sky-600',     wm: 'text-sky-500/10',     hover: 'rgba(2,122,179,.35)' },
        { grad: 'from-blue-50 to-white',    ring: 'ring-blue-100/70',    iconBg: 'from-blue-400 to-blue-500',     iconShadow: 'shadow-blue-500/30',    text: 'text-blue-600',    wm: 'text-blue-500/10',    hover: 'rgba(2,122,179,.35)' },
        { grad: 'from-purple-50 to-white',  ring: 'ring-purple-100/70',  iconBg: 'from-purple-400 to-purple-500', iconShadow: 'shadow-purple-500/30',  text: 'text-purple-600',  wm: 'text-purple-500/10',  hover: 'rgba(2,122,179,.35)' },
        { grad: 'from-amber-50 to-white',   ring: 'ring-amber-100/70',   iconBg: 'from-amber-400 to-amber-500',   iconShadow: 'shadow-amber-500/30',   text: 'text-amber-600',   wm: 'text-amber-500/10',   hover: 'rgba(2,122,179,.35)' },
        { grad: 'from-rose-50 to-white',    ring: 'ring-rose-100/70',    iconBg: 'from-rose-400 to-rose-500',     iconShadow: 'shadow-rose-500/30',    text: 'text-rose-600',    wm: 'text-rose-500/10',    hover: 'rgba(2,122,179,.35)' },
        { grad: 'from-emerald-50 to-white', ring: 'ring-emerald-100/70', iconBg: 'from-emerald-400 to-emerald-500', iconShadow: 'shadow-emerald-500/30', text: 'text-emerald-600', wm: 'text-emerald-500/10', hover: 'rgba(2,122,179,.35)' }
    ];
    // Band TOCFL 1-6 -> [nền, chữ, viền] pastel dựa trên tông primary #027AB3
    var GMH_BAND_COLORS = {
        1: ['#EAF3FA', '#027AB3', '#B7DCEE'], 2: ['#EEFAF3', '#2E8B57', '#CDEEDD'],
        3: ['#FFF4E5', '#C05E10', '#FAE0C0'], 4: ['#F3EEFF', '#7C4DDC', '#E0D4FB'],
        5: ['#FFEEF5', '#B83573', '#FAD3E4'], 6: ['#EEFAFA', '#187A80', '#CCEBED']
    };
    var GMH_PAGE_SIZE = 10;
    // State phân trang riêng cho từng khối: 'topn', 'tocfl', 'curriculum'
    var gmhBlockState = {
        topn:        { params: null, page: 1, title: '' },
        tocfl:       { params: null, page: 1, title: '' },
        curriculum:  { params: null, page: 1, title: '' }
    };

    window.gmhOnOpen = function () {
        gmhLoadTopNTabs();
        gmhLoadTocflGrid();
        gmhLoadCurriculumTags();
        gmhCheckDeepLink();
    };

    // Mở thẳng modal chi tiết nếu URL có #grammar-<id> (chia sẻ link).
    function gmhCheckDeepLink() {
        var m = /^#grammar-(\d+)/.exec(window.location.hash || '');
        if (m) {
            if (typeof switchTab === 'function' && window.currentTab !== 'grammar-hub') {
                switchTab('grammar-hub', false);
            }
            gmhOpenDetail(parseInt(m[1], 10));
        }
    }

    // Lắng nghe hashchange khi người dùng click vào link ngữ pháp hoặc dùng nút Back/Forward
    window.addEventListener('hashchange', function () {
        var m = /^#grammar-(\d+)/.exec(window.location.hash || '');
        if (m) {
            if (typeof switchTab === 'function' && window.currentTab !== 'grammar-hub') {
                switchTab('grammar-hub', false);
            }
            gmhOpenDetail(parseInt(m[1], 10));
        } else if (window.gmhCurrentDetailId) {
            var overlay = document.getElementById('gmh-detail-overlay');
            if (overlay && !overlay.classList.contains('hidden')) {
                window.gmhCloseDetail();
            }
        }
    });

    // Tự động kiểm tra deep link ngay khi script tải xong
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', gmhCheckDeepLink);
    } else {
        gmhCheckDeepLink();
    }

    function gmhHubCardHtml(t, i, onclickFn, blockKey) {
        var th = GMH_HUB_THEMES[i % GMH_HUB_THEMES.length];
        var cnt = parseInt(t.grammar_count, 10) || 0;
        var empty = cnt === 0;
        var safeName = String(t.tag_name).replace(/'/g, "\\'");
        return '<button type="button" class="gmh-hub-card' + (empty ? ' is-empty' : '') + ' group relative overflow-hidden bg-gradient-to-br ' + th.grad + ' ring-1 ' + th.ring + ' shadow-[0_8px_30px_rgb(0,0,0,0.04)]" id="gmh-card-' + blockKey + '-' + t.tag_id + '" style="--hub-shadow:' + th.hover + '"' +
            (empty ? ' disabled' : ' onclick="' + onclickFn + '(' + t.tag_id + ',\'' + safeName + '\')"') + '>' +
                '<i class="fa-solid fa-book absolute -right-2 -bottom-2 text-5xl ' + th.wm + ' group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500 pointer-events-none"></i>' +
                '<span class="relative z-10 w-9 h-9 rounded-xl bg-gradient-to-br ' + th.iconBg + ' text-white flex items-center justify-center text-xs shadow-lg ' + th.iconShadow + ' mb-2.5 group-hover:scale-110 group-hover:-rotate-3 transition-transform"><i class="fa-solid fa-book"></i></span>' +
                '<h4 class="relative z-10 font-black text-slate-800 text-[12.5px] sm:text-[13px] leading-tight">' + t.tag_name + '</h4>' +
                '<p class="relative z-10 text-slate-500 text-[11px] mt-1 font-medium">' + (cnt > 0 ? cnt + ' điểm ngữ pháp' : 'Đang cập nhật') + '</p>' +
                (empty ? '' : '<span class="hub-arrow relative z-10 mt-auto pt-1.5 inline-flex items-center gap-1 ' + th.text + ' text-[10.5px] font-black">Xem <i class="fa-solid fa-arrow-right text-[8px]"></i></span>') +
            '</button>';
    }

    // ============ 1. Top hay dùng: Tab Bar ============
    var _gmhTopnCache = null;
    function gmhLoadTopNTabs() {
        var wrap = document.getElementById('gmh-topn-tabbar');
        if (!wrap) return;
        if (_gmhTopnCache) {
            renderTopnTags(_gmhTopnCache);
            return;
        }
        function renderTopnTags(tags) {
            wrap.innerHTML = tags.length ? tags.map(function (t) {
                var safeName = String(t.tag_name).replace(/'/g, "\\'");
                var cnt = parseInt(t.grammar_count, 10) || 0;
                return '<button type="button" class="gmh-tab" id="gmh-tab-' + t.tag_id + '" onclick="gmhSelectTopTab(' + t.tag_id + ',\'' + safeName + '\')">' + t.tag_name + ' <span class="opacity-70">(' + cnt + ')</span></button>';
            }).join('') : '<div class="text-slate-400 text-xs py-2">Chưa có dữ liệu Top ngữ pháp.</div>';
        }
        fetch('/api.php?action=get_grammar_tags&tag_type=top_n').then(function (r) { return r.json(); }).then(function (res) {
            var tags = (res && res.success && Array.isArray(res.data)) ? res.data : [];
            _gmhTopnCache = tags;
            renderTopnTags(tags);
        }).catch(function () { if (!wrap.innerHTML) wrap.innerHTML = ''; });
    }
    window.gmhSelectTopTab = function (tagId, tagName) {
        var st = gmhBlockState.topn;
        var resultEl = document.getElementById('gmh-topn-result');
        var sig = JSON.stringify({ tag_id: tagId });
        var isSame = st.params && JSON.stringify(st.params) === sig && resultEl && resultEl.innerHTML.trim().length > 0;
        document.querySelectorAll('#gmh-topn-tabbar .gmh-tab').forEach(function (b) { b.classList.remove('is-active'); });
        if (isSame) {
            resultEl.innerHTML = '';
            st.params = null; st.page = 1; st.title = '';
            return;
        }
        var btn = document.getElementById('gmh-tab-' + tagId);
        if (btn) btn.classList.add('is-active');
        gmhLoadBlock('topn', 'Ngữ pháp · ' + tagName, { tag_id: tagId }, 1);
    };

    // ============ 2. Theo Level TOCFL ============
    function gmhLoadTocflGrid() {
        var row = document.getElementById('gmh-tocfl-grid');
        var html = '';
        for (var lvl = 1; lvl <= 6; lvl++) {
            var th = GMH_HUB_THEMES[(lvl - 1) % GMH_HUB_THEMES.length];
            html += '<button type="button" class="gmh-hub-card group relative overflow-hidden bg-gradient-to-br ' + th.grad + ' ring-1 ' + th.ring + ' shadow-[0_8px_30px_rgb(0,0,0,0.04)]" id="gmh-band-btn-' + lvl + '" style="--hub-shadow:' + th.hover + '" onclick="gmhSelectBand(' + lvl + ')">' +
                    '<i class="fa-solid fa-certificate absolute -right-2 -bottom-2 text-5xl ' + th.wm + ' group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500 pointer-events-none"></i>' +
                    '<span class="relative z-10 w-9 h-9 rounded-xl bg-gradient-to-br ' + th.iconBg + ' text-white flex items-center justify-center text-xs shadow-lg ' + th.iconShadow + ' mb-2.5 group-hover:scale-110 group-hover:-rotate-3 transition-transform"><i class="fa-solid fa-certificate"></i></span>' +
                    '<h4 class="relative z-10 font-black text-slate-800 text-[12.5px] sm:text-[13px] leading-tight">TOCFL ' + lvl + '</h4>' +
                    '<span class="hub-arrow relative z-10 mt-auto pt-1.5 inline-flex items-center gap-1 ' + th.text + ' text-[10.5px] font-black">Xem <i class="fa-solid fa-arrow-right text-[8px]"></i></span>' +
                '</button>';
        }
        row.innerHTML = html;
    }
    window.gmhSelectBand = function (level) {
        var st = gmhBlockState.tocfl;
        var resultEl = document.getElementById('gmh-tocfl-result');
        var sig = JSON.stringify({ band: level });
        var isSame = st.params && JSON.stringify(st.params) === sig && resultEl && resultEl.innerHTML.trim().length > 0;
        for (var lvl = 1; lvl <= 6; lvl++) {
            var btn = document.getElementById('gmh-band-btn-' + lvl);
            if (btn) btn.classList.toggle('is-active', !isSame && lvl === level);
        }
        if (isSame) {
            resultEl.innerHTML = '';
            st.params = null; st.page = 1; st.title = '';
            return;
        }
        gmhLoadBlock('tocfl', 'Ngữ pháp · TOCFL Level ' + level, { band: level }, 1);
    };

    // ============ 3. Theo giáo trình ============
    function gmhLoadCurriculumTags() {
        fetch('/api.php?action=get_grammar_tags&tag_type=curriculum').then(function (r) { return r.json(); }).then(function (res) {
            var grid = document.getElementById('gmh-curriculum-grid');
            var tags = (res && res.success && Array.isArray(res.data)) ? res.data : [];
            grid.innerHTML = tags.length ? tags.map(function (t, i) { return gmhHubCardHtml(t, i, 'gmhSelectCurriculum', 'cur'); }).join('')
                : '<div class="col-span-full text-center text-slate-400 text-xs py-6">Chưa có giáo trình nào.</div>';
        }).catch(function () { document.getElementById('gmh-curriculum-grid').innerHTML = ''; });
    }
    window.gmhSelectCurriculum = function (tagId, tagName) {
        var st = gmhBlockState.curriculum;
        var resultEl = document.getElementById('gmh-curriculum-result');
        var sig = JSON.stringify({ tag_id: tagId });
        var isSame = st.params && JSON.stringify(st.params) === sig && resultEl && resultEl.innerHTML.trim().length > 0;
        
        var grid = document.getElementById('gmh-curriculum-grid');
        if (grid) {
            grid.querySelectorAll('.gmh-hub-card').forEach(function (c) { c.classList.remove('is-active'); });
            if (!isSame) {
                var card = document.getElementById('gmh-card-cur-' + tagId);
                if (card) card.classList.add('is-active');
            }
        }
        
        if (isSame) {
            resultEl.innerHTML = '';
            st.params = null; st.page = 1; st.title = '';
            return;
        }
        gmhLoadBlock('curriculum', 'Ngữ pháp · ' + tagName, { tag_id: tagId }, 1);
    };

    window.gmhCloseBlock = function (blockKey) {
        var st = gmhBlockState[blockKey];
        var resultEl = document.getElementById('gmh-' + blockKey + '-result');
        if (resultEl) resultEl.innerHTML = '';
        if (st) { st.params = null; st.page = 1; st.title = ''; }
        if (blockKey === 'curriculum') {
            var grid = document.getElementById('gmh-curriculum-grid');
            if (grid) grid.querySelectorAll('.gmh-hub-card').forEach(function (c) { c.classList.remove('is-active'); });
        } else if (blockKey === 'tocfl') {
            for (var lvl = 1; lvl <= 6; lvl++) {
                var btn = document.getElementById('gmh-band-btn-' + lvl);
                if (btn) btn.classList.remove('is-active');
            }
        } else if (blockKey === 'topn') {
            document.querySelectorAll('#gmh-topn-tabbar .gmh-tab').forEach(function (b) { b.classList.remove('is-active'); });
        }
    };

    // ============ Danh sách kết quả trong từng khối (kèm phân trang, 10/trang) ============
    function gmhBandBadge(band) {
        if (!band) return '';
        var c = GMH_BAND_COLORS[band] || ['#f1f5f9', '#475569', '#cbd5e1'];
        return '<span class="gmh-band-badge" style="background:' + c[0] + ';color:' + c[1] + ';border-color:' + c[2] + '">TOCFL ' + band + '</span>';
    }
    function gmhItemHtml(g) {
        return '<div class="gmh-item" onclick="gmhOpenDetail(' + g.grammar_id + ')">' +
            '<div class="flex items-start justify-between gap-3">' +
                '<div class="min-w-0">' +
                    '<div class="g-pattern">' + g.pattern_zh + '</div>' +
                    (g.pattern_pinyin ? '<div class="g-pinyin">' + g.pattern_pinyin + '</div>' : '') +
                    '<div class="g-title">' + g.title_vi + '</div>' +
                '</div>' +
                gmhBandBadge(g.tocfl_band) +
            '</div>' +
            '<div class="g-explain">' + g.explanation_vi + '</div>' +
        '</div>';
    }
    function gmhPagerHtml(blockKey, page, total) {
        var totalPages = Math.max(1, Math.ceil(total / GMH_PAGE_SIZE));
        if (totalPages <= 1) return '';
        return '<div class="gmh-pager">' +
            '<button type="button" class="gmh-pager-btn" ' + (page <= 1 ? 'disabled' : '') + ' onclick="gmhGotoPage(\'' + blockKey + '\',' + (page - 1) + ')"><i class="fa-solid fa-chevron-left"></i></button>' +
            '<span class="gmh-pager-info">Trang <input type="number" min="1" max="' + totalPages + '" value="' + page + '" class="gmh-pager-input" id="gmh-pageinput-' + blockKey + '" onkeydown="if(event.key===\'Enter\') gmhJumpPage(\'' + blockKey + '\',' + totalPages + ')"> / ' + totalPages + '</span>' +
            '<button type="button" class="gmh-pager-btn" ' + (page >= totalPages ? 'disabled' : '') + ' onclick="gmhGotoPage(\'' + blockKey + '\',' + (page + 1) + ')"><i class="fa-solid fa-chevron-right"></i></button>' +
            '<button type="button" class="gmh-pager-btn" style="width:auto;padding:0 10px;font-size:11px;font-weight:800;" onclick="gmhJumpPage(\'' + blockKey + '\',' + totalPages + ')">Đi</button>' +
        '</div>';
    }
    window.gmhJumpPage = function (blockKey, totalPages) {
        var input = document.getElementById('gmh-pageinput-' + blockKey);
        var p = parseInt(input.value, 10) || 1;
        p = Math.min(Math.max(1, p), totalPages);
        gmhGotoPage(blockKey, p);
    };
    window.gmhGotoPage = function (blockKey, page) {
        var st = gmhBlockState[blockKey];
        if (!st || !st.params) return;
        gmhLoadBlock(blockKey, st.title, st.params, page);
    };
    function gmhScrollToResult(el) {
        if (!el) return;
        try {
            var mainScrollEl = document.getElementById('mainContent');
            if (mainScrollEl) {
                var cardRect = el.getBoundingClientRect();
                var mainRect = mainScrollEl.getBoundingClientRect();
                var targetY = mainScrollEl.scrollTop + (cardRect.top - mainRect.top) - 16;
                mainScrollEl.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
            } else {
                var cardRect = el.getBoundingClientRect();
                var header = document.getElementById('main-app-header');
                var hHeight = header ? header.offsetHeight : 0;
                var targetY = window.scrollY + cardRect.top - hHeight - 16;
                window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
            }
        } catch (e) {
            try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(err) {}
        }
    }

    function gmhLoadBlock(blockKey, title, params, page) {
        var st = gmhBlockState[blockKey];
        st.params = params; st.page = page; st.title = title;
        var resultEl = document.getElementById('gmh-' + blockKey + '-result');
        if (!resultEl) return;
        resultEl.innerHTML = '<div class="text-center text-slate-400 text-sm py-6"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải ngữ pháp...</div>';
        gmhScrollToResult(resultEl);
        var qs = Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
        qs += '&page=' + page + '&page_size=' + GMH_PAGE_SIZE;
        fetch('/api.php?action=get_grammar_list&' + qs).then(function (r) { return r.json(); }).then(function (res) {
            var rows = (res && res.success && Array.isArray(res.data)) ? res.data : [];
            var total = (res && res.success) ? (res.total || 0) : 0;
            if (!rows.length) {
                resultEl.innerHTML = '<div class="text-center text-slate-400 text-sm py-6">Chưa có ngữ pháp nào trong mục này.</div>';
                return;
            }
            var headerHtml = '<div class="flex items-center justify-between mb-3.5 px-0.5">' +
                '<div class="font-extrabold text-[13.5px] text-slate-700 flex items-center gap-2">' +
                    '<span class="w-1.5 h-3.5 bg-primary rounded-full inline-block"></span>' + (title || 'Danh sách ngữ pháp') +
                '</div>' +
                '<div class="flex items-center gap-2 sm:gap-3 shrink-0">' +
                    '<span class="text-xs font-bold text-slate-400">' + total + ' điểm ngữ pháp</span>' +
                    '<button type="button" onclick="gmhCloseBlock(\'' + blockKey + '\')" class="text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs font-bold w-7 h-7 sm:w-auto sm:px-2.5 sm:py-1 rounded-lg transition-colors flex items-center justify-center gap-1 border border-slate-200 shadow-xs shrink-0" title="Thu gọn danh sách"><i class="fa-solid fa-xmark text-[13px] sm:text-[11px]"></i><span class="hidden sm:inline"> Thu gọn</span></button>' +
                '</div>' +
            '</div>';
            resultEl.innerHTML = headerHtml + '<div class="grid sm:grid-cols-2 gap-3">' + rows.map(gmhItemHtml).join('') + '</div>' + gmhPagerHtml(blockKey, page, total);
            setTimeout(function () {
                gmhScrollToResult(resultEl);
            }, 60);
        }).catch(function () {
            resultEl.innerHTML = '<div class="text-center text-slate-400 text-sm py-6">Lỗi tải dữ liệu.</div>';
        });
    }

    // ============ Modal chi tiết (deep link + audio + bookmark + dễ nhầm + feedback) ============
    // Dùng chung playTTS() của toàn site (index.php): ưu tiên mp3 Edge TTS giọng nữ
    // zh-TW-HsiaoChenNeural đã generate sẵn (audio/tts/<text>.mp3, xem
    // staging/gen_grammar_audio.py), rơi xuống Google Translate TTS rồi Web Speech API
    // nếu chưa có file — KHÔNG tự phát âm bằng speechSynthesis trực tiếp nữa (chất
    // lượng kém, giọng máy).
    function gmhSpeak(text, event = null) {
        if (typeof window.playTTS === 'function') { window.playTTS(encodeURIComponent(text), event); }
    }
    window.gmhSpeak = gmhSpeak;

    window.gmhOpenDetail = function (grammarId) {
        window.gmhCurrentDetailId = grammarId;
        var overlay = document.getElementById('gmh-detail-overlay');
        var body = document.getElementById('gmh-detail-body');
        if (!overlay || !body) return;
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        body.innerHTML = '<div class="text-center text-slate-400 text-sm py-16"><i class="fa-solid fa-spinner fa-spin"></i></div>';
        if (window.location.hash !== '#grammar-' + grammarId) {
            history.replaceState(null, '', '#grammar-' + grammarId);
        }
        fetch('/api.php?action=grammar_detail&grammar_id=' + grammarId).then(function (r) { return r.json(); }).then(function (res) {
            if (!res || !res.success) { body.innerHTML = '<div class="text-center text-slate-400 text-sm py-16">Không tải được nội dung.</div>'; return; }
            var data = res.data;
            try {
                var bm = JSON.parse(localStorage.getItem('tocfl_grammar_bookmarks') || '[]');
                if (Array.isArray(bm)) data.is_bookmarked = bm.map(String).includes(String(grammarId));
            } catch (e) {}
            body.innerHTML = gmhDetailHtml(data);
            gmhLoadContexts(grammarId);
        }).catch(function () { body.innerHTML = '<div class="text-center text-slate-400 text-sm py-16">Lỗi tải dữ liệu.</div>'; });
    };
    window.gmhCloseDetail = function () {
        window.gmhCurrentDetailId = null;
        var overlay = document.getElementById('gmh-detail-overlay');
        if (overlay) overlay.classList.add('hidden');
        document.body.style.overflow = '';
        if (/^#grammar-/.test(window.location.hash)) {
            var targetPath = window.location.pathname.includes('github.io') ? window.location.pathname : (window.location.pathname || '/grammar-hub');
            history.replaceState(null, '', targetPath + window.location.search);
        }
    };

    function gmhDetailHtml(g) {
        var examplesHtml = (g.examples || []).map(function (ex) {
            var safeZh = String(ex.example_zh).replace(/'/g, "\\'").replace(/"/g, '&quot;');
            return '<div class="gmh-example">' +
                '<button type="button" class="gmh-speak-btn" onclick="gmhSpeak(\'' + safeZh + '\', event)" title="Nghe phát âm"><i class="fa-solid fa-volume-high pointer-events-none transition-transform"></i></button>' +
                '<div class="min-w-0"><div class="e-zh">' + ex.example_zh + '</div>' +
                (ex.example_pinyin ? '<div class="e-pinyin">' + ex.example_pinyin + '</div>' : '') +
                '<div class="e-vi">' + ex.example_vi + '</div></div>' +
            '</div>';
        }).join('');

        var confusableHtml = (g.confusable || []).length ? (
            '<div class="mt-6">' +
                '<div class="text-[11.5px] font-black text-amber-600 uppercase tracking-wide mb-2"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Ngữ pháp dễ nhầm (cùng cấp độ)</div>' +
                '<div class="flex flex-wrap gap-2">' +
                (g.confusable || []).map(function (c) {
                    return '<div class="gmh-confusable-chip" onclick="gmhOpenDetail(' + c.grammar_id + ')"><span class="c-pattern">' + c.pattern_zh + '</span><span class="text-[10.5px] text-amber-700 font-semibold">' + c.title_vi + '</span></div>';
                }).join('') +
                '</div>' +
            '</div>'
        ) : '';

        var safePattern = String(g.pattern_zh).replace(/'/g, "\\'").replace(/"/g, '&quot;');
        var safeTitle = String(g.title_vi || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

        return (
            '<div class="flex items-start justify-between gap-3 flex-wrap pr-10">' +
                '<div>' +
                    '<div class="gmh-detail-hanzi">' + g.pattern_zh + '</div>' +
                    (g.pattern_pinyin ? '<div class="gmh-detail-pinyin">' + g.pattern_pinyin + '</div>' : '') +
                    '<div class="gmh-detail-title">' + g.title_vi + '</div>' +
                '</div>' +
                gmhBandBadge(g.tocfl_band) +
            '</div>' +
            '<div class="flex flex-wrap gap-2 mt-4">' +
                '<button type="button" class="gmh-bookmark-btn' + (g.is_bookmarked ? ' is-saved' : '') + '" id="gmh-bookmark-btn" onclick="gmhToggleBookmark(' + g.grammar_id + ')"><i class="fa-solid fa-bookmark"></i> ' + (g.is_bookmarked ? 'Đã lưu Flashcard' : 'Lưu vào Flashcard') + '</button>' +
                '<button type="button" class="gmh-bookmark-btn" onclick="gmhSpeak(\'' + safePattern + '\')"><i class="fa-solid fa-volume-high"></i> Nghe cấu trúc</button>' +
                '<button type="button" class="gmh-bookmark-btn" onclick="gmhShareGrammar(' + g.grammar_id + ', \'' + safePattern + '\', \'' + safeTitle + '\', this)"><i class="fa-solid fa-share-nodes"></i> Chia sẻ link</button>' +
            '</div>' +
            '<div class="gmh-detail-explain">' + g.explanation_vi + '</div>' +
            (g.structure_note ? '<div class="gmh-detail-structure"><i class="fa-solid fa-diagram-project mr-1.5"></i>Cấu trúc: ' + g.structure_note + '</div>' : '') +
            (examplesHtml ? '<div class="mt-5"><div class="text-[11.5px] font-black text-slate-400 uppercase tracking-wide mb-2">Ví dụ</div>' + examplesHtml + '</div>' : '') +
            confusableHtml +
            '<div id="gmh-contexts-box" class="mt-6"></div>'
        );
    }

    // "Ngữ pháp này dùng trong hội thoại nào" — liên kết ngược Ngữ pháp -> Hội thoại,
    // load riêng (không nằm trong grammar_detail) vì phải quét lesson_contents.content.
    function gmhLoadContexts(grammarId) {
        var box = document.getElementById('gmh-contexts-box');
        if (!box) return;
        fetch('/api.php?action=get_grammar_contexts&grammar_id=' + grammarId).then(function (r) { return r.json(); }).then(function (res) {
            if (!res || !res.success || !res.data || !res.data.length) return;
            var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
            var html = '<div class="text-[11.5px] font-black text-slate-400 uppercase tracking-wide mb-2"><i class="fa-solid fa-comments mr-1"></i>Dùng trong hội thoại nào</div>';
            res.data.forEach(function (ctx) {
                var linesHtml = (ctx.lines || []).map(function (l) {
                    return '<div class="text-sm font-bold text-slate-700 font-tc leading-relaxed">' + esc(l.line) + '</div>' +
                        (l.vi ? '<div class="text-xs text-slate-400 mb-1">' + esc(l.vi) + '</div>' : '');
                }).join('');
                var canJump = ctx.book_id && ctx.lesson_id;
                var firstLine = (ctx.lines && ctx.lines[0]) ? ctx.lines[0].line : '';
                html += '<div class="border border-slate-100 bg-slate-50/60 rounded-xl p-3 mb-2 last:mb-0' + (canJump ? ' cursor-pointer hover:bg-slate-100 active:scale-[0.99] transition-all' : '') + '"' +
                    (canJump ? ' onclick="window.gmhCloseDetail(); window.tdJumpToLesson(' + ctx.book_id + ',' + ctx.lesson_id + ',' + ctx.content_id + ',' + JSON.stringify(firstLine) + ');"' : '') + '>' +
                    '<div class="flex items-center justify-between gap-2 mb-1"><div class="text-[10px] font-bold text-primary uppercase tracking-widest">' + esc(ctx.title || 'Hội thoại') + '</div>' +
                    (canJump ? '<i class="fa-solid fa-arrow-up-right-from-square text-primary/50 text-[10px]"></i>' : '') + '</div>' +
                    linesHtml + '</div>';
            });
            box.innerHTML = html;
        }).catch(function () {});
    }
    window.gmhShareGrammar = function (grammarId, patternZh, titleVi, btnEl) {
        var origin = window.location.origin;
        var isGh = window.location.hostname.includes('github.io');
        var path = isGh ? window.location.pathname : '/grammar-hub';
        var shareUrl = origin + path + '#grammar-' + grammarId;

        var cleanPattern = (patternZh || '').replace(/\\'/g, "'").replace(/&quot;/g, '"');
        var cleanTitle = (titleVi || '').replace(/\\'/g, "'").replace(/&quot;/g, '"');
        var shareTitle = 'Ngữ pháp: ' + cleanPattern + (cleanTitle ? ' (' + cleanTitle + ')' : '');
        var shareText = 'Học ngữ pháp tiếng Trung: ' + cleanPattern + (cleanTitle ? ' - ' + cleanTitle : '');

        // 1. Thử dùng Web Share API (native share sheet trên mobile: Zalo, Messenger, Copy link...)
        if (navigator.share) {
            var shareData = {
                title: shareTitle,
                text: shareText,
                url: shareUrl
            };
            navigator.share(shareData).then(function () {
                if (btnEl) gmhToast(btnEl, 'Đã chia sẻ');
            }).catch(function (err) {
                if (err && err.name === 'AbortError') return;
                gmhCopyFallback(shareUrl, btnEl);
            });
            return;
        }

        // 2. Fallback sang Clipboard Copy nếu không có Web Share API
        gmhCopyFallback(shareUrl, btnEl);
    };

    function gmhCopyFallback(text, btnEl) {
        if (navigator.clipboard && window.isSecureContext && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                if (btnEl) gmhToast(btnEl, 'Đã copy link');
            }).catch(function () {
                execCopy(text, btnEl);
            });
        } else {
            execCopy(text, btnEl);
        }
    }

    function execCopy(text, btnEl) {
        try {
            var textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            textArea.style.top = '-9999px';
            textArea.setAttribute('readonly', '');
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            textArea.setSelectionRange(0, 99999);
            var successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (btnEl) gmhToast(btnEl, successful ? 'Đã copy link' : 'Không thể copy');
        } catch (err) {
            if (btnEl) gmhToast(btnEl, 'Không thể copy');
        }
    }

    window.gmhToast = function (el, msg) {
        if (!el) return;
        if (!el.dataset.originalHtml) {
            el.dataset.originalHtml = el.innerHTML;
        }
        el.innerHTML = '<i class="fa-solid fa-check mr-1"></i> ' + msg;
        clearTimeout(el._toastTimer);
        el._toastTimer = setTimeout(function () {
            if (el.dataset.originalHtml) {
                el.innerHTML = el.dataset.originalHtml;
                delete el.dataset.originalHtml;
            }
        }, 1800);
    };

    window.gmhToggleBookmark = function (grammarId) {
        var gid = String(grammarId);
        fetch('/api.php?action=grammar_bookmark_toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grammar_id: grammarId }) })
            .then(function (r) { return r.json(); }).then(function (res) {
                var isSaved = false;
                if (res && res.success) {
                    isSaved = (res.bookmarked !== undefined) ? res.bookmarked : (res.is_bookmarked !== undefined ? res.is_bookmarked : false);
                } else {
                    var bm = [];
                    try { bm = JSON.parse(localStorage.getItem('tocfl_grammar_bookmarks') || '[]'); } catch (e) {}
                    bm = bm.map(String);
                    if (bm.includes(gid)) {
                        bm = bm.filter(function (x) { return x !== gid; });
                        isSaved = false;
                    } else {
                        bm.push(gid);
                        isSaved = true;
                    }
                    localStorage.setItem('tocfl_grammar_bookmarks', JSON.stringify(bm));
                }
                gmhUpdateBookmarkButton(isSaved);
            }).catch(function () {
                var bm = [];
                try { bm = JSON.parse(localStorage.getItem('tocfl_grammar_bookmarks') || '[]'); } catch (e) {}
                bm = bm.map(String);
                var isSaved = false;
                if (bm.includes(gid)) {
                    bm = bm.filter(function (x) { return x !== gid; });
                    isSaved = false;
                } else {
                    bm.push(gid);
                    isSaved = true;
                }
                localStorage.setItem('tocfl_grammar_bookmarks', JSON.stringify(bm));
                gmhUpdateBookmarkButton(isSaved);
            });
    };

    function gmhUpdateBookmarkButton(isSaved) {
        var btn = document.getElementById('gmh-bookmark-btn');
        if (!btn) return;
        if (isSaved) {
            btn.classList.add('is-saved');
            btn.innerHTML = '<i class="fa-solid fa-check mr-1.5"></i> Đã lưu Flashcard';
            gmhToast(btn, 'Đã lưu vào Flashcard');
        } else {
            btn.classList.remove('is-saved');
            btn.innerHTML = '<i class="fa-solid fa-bookmark mr-1.5"></i> Lưu vào Flashcard';
            gmhToast(btn, 'Đã xóa khỏi Flashcard');
        }
    }

    // ============ Tìm kiếm ============
    var gmhSearchTimer = null;
    window.gmhSearchDebounced = function () {
        clearTimeout(gmhSearchTimer);
        gmhSearchTimer = setTimeout(function () {
            var q = document.getElementById('gmh-search-input').value.trim();
            var dd = document.getElementById('gmh-search-dropdown');
            if (!q) { dd.classList.add('hidden'); dd.innerHTML = ''; return; }
            fetch('/api.php?action=search_grammar&q=' + encodeURIComponent(q)).then(function (r) { return r.json(); }).then(function (res) {
                var rows = (res && res.success && Array.isArray(res.data)) ? res.data : [];
                if (!rows.length) { dd.innerHTML = '<div class="p-3 text-xs text-slate-400 font-medium">Không tìm thấy ngữ pháp phù hợp.</div>'; dd.classList.remove('hidden'); return; }
                dd.innerHTML = rows.map(function (g) {
                    return '<button type="button" class="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-slate-50 border-b border-slate-50 last:border-none text-xs" onclick="gmhSearchPick(' + g.grammar_id + ')">' +
                        '<span class="font-black text-slate-700">' + g.pattern_zh + '</span>' +
                        '<span class="text-slate-500 truncate flex-1">' + g.title_vi + '</span>' +
                        gmhBandBadge(g.tocfl_band) +
                    '</button>';
                }).join('');
                dd.classList.remove('hidden');
            }).catch(function () {});
        }, 200);
    };
    window.gmhSearchClose = function () {
        document.getElementById('gmh-search-dropdown').classList.add('hidden');
    };
    window.gmhSearchPick = function (grammarId) {
        gmhSearchClose();
        document.getElementById('gmh-search-input').value = '';
        gmhOpenDetail(grammarId);
    };
    document.addEventListener('click', function (e) {
        var wrap = document.getElementById('gmh-search-input');
        var dd = document.getElementById('gmh-search-dropdown');
        if (!wrap || !dd) return;
        if (e.target !== wrap && !dd.contains(e.target)) dd.classList.add('hidden');
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            var ov = document.getElementById('gmh-detail-overlay'); if (ov && !ov.classList.contains('hidden')) gmhCloseDetail();
            var fc = document.getElementById('gmh-fc-overlay'); if (fc && !fc.classList.contains('hidden')) gmhCloseFlashcards();
        }
    });
    // Đóng modal khi bấm ra ngoài (nền mờ) — gắn qua JS thay vì thuộc tính onclick=""
    // trên chính div overlay, vì hanzi_popup.php coi mọi tổ tiên có [onclick] là "phần tử
    // tương tác" và tắt popup tra chữ Hán bên trong. Overlay bọc toàn bộ nội dung modal nên
    // nếu gắn onclick trực tiếp lên nó, không click nào bên trong modal tra được nghĩa nữa.
    (function () {
        var detailOv = document.getElementById('gmh-detail-overlay');
        if (detailOv) detailOv.addEventListener('click', function (e) { if (e.target === detailOv) gmhCloseDetail(); });
        var fcOv = document.getElementById('gmh-fc-overlay');
        if (fcOv) fcOv.addEventListener('click', function (e) { if (e.target === fcOv) gmhCloseFlashcards(); });
    })();

    // ============ Flashcard đã lưu — lật thẻ (mặt trước: hán tự + pinyin + tên ngữ pháp;
    // mặt sau: giải thích + cấu trúc + ví dụ). Bấm nút bookmark trong modal chi tiết để lưu. ============
    var gmhFcCards = [];
    var gmhFcIndex = 0;
    var gmhFcFlipped = false;
    var gmhFcMode = 'card';

    window.gmhSetFcMode = function (mode) {
        gmhFcMode = mode;
        var btnCard = document.getElementById('gmh-btn-mode-card');
        var btnList = document.getElementById('gmh-btn-mode-list');
        if (btnCard && btnList) {
            if (mode === 'card') {
                btnCard.className = 'px-2.5 py-1 rounded-lg bg-white shadow-sm text-primary transition-all';
                btnList.className = 'px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-700 transition-all';
            } else {
                btnList.className = 'px-2.5 py-1 rounded-lg bg-white shadow-sm text-primary transition-all';
                btnCard.className = 'px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-700 transition-all';
            }
        }
        gmhRenderFlashcards();
    };

    window.gmhOpenFlashcards = function () {
        var overlay = document.getElementById('gmh-fc-overlay');
        var body = document.getElementById('gmh-fc-body');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        body.innerHTML = '<div class="text-center text-slate-400 text-sm py-16"><i class="fa-solid fa-spinner fa-spin"></i></div>';
        fetch('/api.php?action=get_grammar_bookmarks').then(function (r) { return r.json(); }).then(function (res) {
            var rawCards = (res && res.success && Array.isArray(res.data)) ? res.data : [];
            if (rawCards.length > 0 && typeof rawCards[0] === 'object') {
                gmhFcCards = rawCards;
                gmhFcIndex = 0;
                gmhFcFlipped = false;
                gmhRenderFlashcards();
            } else if (rawCards.length > 0) {
                fetch('/api.php?action=get_grammar_by_ids&ids=' + encodeURIComponent(rawCards.join(','))).then(function(r2){ return r2.json(); }).then(function(res2){
                    gmhFcCards = (res2 && res2.success && Array.isArray(res2.data)) ? res2.data : [];
                    gmhFcIndex = 0;
                    gmhFcFlipped = false;
                    gmhRenderFlashcards();
                }).catch(function() {
                    body.innerHTML = '<div class="text-center text-slate-400 text-sm py-16">Lỗi tải dữ liệu.</div>';
                });
            } else {
                gmhFcCards = [];
                gmhFcIndex = 0;
                gmhFcFlipped = false;
                gmhRenderFlashcards();
            }
        }).catch(function () { body.innerHTML = '<div class="text-center text-slate-400 text-sm py-16">Lỗi tải dữ liệu.</div>'; });
    };
    window.gmhCloseFlashcards = function () {
        document.getElementById('gmh-fc-overlay').classList.add('hidden');
        document.body.style.overflow = '';
    };

    function gmhRenderFlashcards() {
        var body = document.getElementById('gmh-fc-body');
        var cntEl = document.getElementById('gmh-fc-count');
        if (cntEl) cntEl.textContent = gmhFcCards.length;

        if (!gmhFcCards.length) {
            body.innerHTML =
                '<div class="text-center py-14 px-4">' +
                    '<div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center text-2xl mb-3 shadow-inner">' +
                        '<i class="fa-regular fa-bookmark"></i>' +
                    '</div>' +
                    '<h5 class="font-extrabold text-slate-700 text-sm mb-1">Chưa có ngữ pháp nào được lưu</h5>' +
                    '<p class="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">' +
                        'Mở bất kỳ điểm ngữ pháp nào và bấm <span class="text-primary font-bold">"Lưu vào Flashcard"</span> để gom lại ôn tập tại đây.' +
                    '</p>' +
                '</div>';
            return;
        }

        if (gmhFcMode === 'list') {
            var listHtml = '<div class="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">' +
                gmhFcCards.map(function (g) {
                    return '<div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all gap-3">' +
                        '<div class="min-w-0 cursor-pointer flex-1" onclick="gmhOpenDetail(' + g.grammar_id + ')">' +
                            '<div class="flex items-center gap-2">' +
                                '<span class="font-black text-slate-800 text-[14.5px] font-tc">' + g.pattern_zh + '</span>' +
                                gmhBandBadge(g.tocfl_band) +
                            '</div>' +
                            (g.pattern_pinyin ? '<div class="text-[11px] text-slate-400 font-semibold mt-0.5">' + g.pattern_pinyin + '</div>' : '') +
                            '<div class="text-xs font-bold text-slate-600 truncate mt-1">' + g.title_vi + '</div>' +
                        '</div>' +
                        '<div class="flex items-center gap-1.5 shrink-0">' +
                            '<button type="button" onclick="gmhOpenDetail(' + g.grammar_id + ')" class="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all shadow-sm">Xem</button>' +
                            '<button type="button" onclick="gmhRemoveFlashcard(' + g.grammar_id + ')" class="w-8 h-8 rounded-xl bg-white border border-rose-200 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center text-xs shadow-sm" title="Xóa khỏi lưu"><i class="fa-solid fa-trash-can"></i></button>' +
                        '</div>' +
                    '</div>';
                }).join('') +
            '</div>' +
            '<div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">' +
                '<span class="text-xs font-bold text-slate-400">Tổng cộng: ' + gmhFcCards.length + ' điểm ngữ pháp</span>' +
                '<button type="button" onclick="gmhClearAllFlashcards()" class="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1"><i class="fa-solid fa-trash-can"></i> Xóa tất cả</button>' +
            '</div>';
            body.innerHTML = listHtml;
            return;
        }

        var g = gmhFcCards[gmhFcIndex];
        var examplesHtml = (g.examples || []).map(function (ex) {
            return '<div class="gmh-example" style="margin-top:8px;"><div class="min-w-0"><div class="e-zh">' + ex.example_zh + '</div>' +
                (ex.example_pinyin ? '<div class="e-pinyin">' + ex.example_pinyin + '</div>' : '') +
                '<div class="e-vi">' + ex.example_vi + '</div></div></div>';
        }).join('');

        body.innerHTML =
            '<div class="gmh-fc-scene">' +
                '<div class="gmh-fc-card' + (gmhFcFlipped ? ' is-flipped' : '') + '" id="gmh-fc-card" onclick="gmhFlipCard()">' +
                    '<div class="gmh-fc-face front">' +
                        gmhBandBadge(g.tocfl_band) +
                        '<div class="gmh-fc-hanzi" style="margin-top:10px;">' + g.pattern_zh + '</div>' +
                        (g.pattern_pinyin ? '<div class="gmh-fc-pinyin">' + g.pattern_pinyin + '</div>' : '') +
                        '<div class="gmh-fc-title">' + g.title_vi + '</div>' +
                        '<div class="gmh-fc-hint"><i class="fa-solid fa-rotate mr-1"></i>Bấm để lật xem giải thích</div>' +
                    '</div>' +
                    '<div class="gmh-fc-face back">' +
                        '<div class="gmh-detail-explain" style="margin-top:0;font-size:13.5px;">' + g.explanation_vi + '</div>' +
                        (g.structure_note ? '<div class="gmh-detail-structure" style="font-size:13px;padding:10px 12px;">' + g.structure_note + '</div>' : '') +
                        examplesHtml +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="flex items-center justify-between mt-4">' +
                '<button type="button" class="gmh-pager-btn" style="width:auto;padding:0 14px;" onclick="event.stopPropagation();gmhFcNav(-1)" ' + (gmhFcIndex <= 0 ? 'disabled' : '') + '><i class="fa-solid fa-chevron-left mr-1"></i>Trước</button>' +
                '<span class="gmh-pager-info font-black">' + (gmhFcIndex + 1) + ' / ' + gmhFcCards.length + '</span>' +
                '<button type="button" class="gmh-pager-btn" style="width:auto;padding:0 14px;" onclick="event.stopPropagation();gmhFcNav(1)" ' + (gmhFcIndex >= gmhFcCards.length - 1 ? 'disabled' : '') + '>Tiếp<i class="fa-solid fa-chevron-right ml-1"></i></button>' +
            '</div>' +
            '<div class="flex justify-center mt-3">' +
                '<button type="button" onclick="event.stopPropagation();gmhRemoveFlashcard(' + g.grammar_id + ')" class="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">' +
                    '<i class="fa-solid fa-trash-can text-[11px]"></i> Xóa khỏi Flashcard' +
                '</button>' +
            '</div>';
    }

    window.gmhFlipCard = function () {
        gmhFcFlipped = !gmhFcFlipped;
        var card = document.getElementById('gmh-fc-card');
        if (card) card.classList.toggle('is-flipped', gmhFcFlipped);
    };

    window.gmhFcNav = function (delta) {
        var next = gmhFcIndex + delta;
        if (next < 0 || next >= gmhFcCards.length) return;
        gmhFcIndex = next;
        gmhFcFlipped = false;
        gmhRenderFlashcards();
    };

    window.gmhRemoveFlashcard = function (grammarId) {
        var gid = String(grammarId);
        try {
            var bm = JSON.parse(localStorage.getItem('tocfl_grammar_bookmarks') || '[]');
            bm = bm.map(String).filter(function (x) { return x !== gid; });
            localStorage.setItem('tocfl_grammar_bookmarks', JSON.stringify(bm));
        } catch (e) {}

        fetch('/api.php?action=grammar_bookmark_remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grammar_id: grammarId })
        }).catch(function () {});

        gmhFcCards = gmhFcCards.filter(function (c) {
            return String(c.grammar_id || c.id) !== gid;
        });

        if (gmhFcIndex >= gmhFcCards.length) {
            gmhFcIndex = Math.max(0, gmhFcCards.length - 1);
        }
        gmhFcFlipped = false;
        gmhRenderFlashcards();

        if (typeof window.gmhCurrentDetailId !== 'undefined' && String(window.gmhCurrentDetailId) === gid) {
            var btn = document.getElementById('gmh-bookmark-btn');
            if (btn) {
                btn.classList.remove('is-saved');
                btn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Lưu vào Flashcard';
            }
        }
    };

    window.gmhClearAllFlashcards = function () {
        if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ ngữ pháp đã lưu khỏi Flashcard?')) return;
        try {
            localStorage.setItem('tocfl_grammar_bookmarks', JSON.stringify([]));
        } catch (e) {}
        fetch('/api.php?action=grammar_bookmark_clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).catch(function () {});
        gmhFcCards = [];
        gmhFcIndex = 0;
        gmhFcFlipped = false;
        gmhRenderFlashcards();

        var btn = document.getElementById('gmh-bookmark-btn');
        if (btn) {
            btn.classList.remove('is-saved');
            btn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Lưu vào Flashcard';
        }
    };
})();
