(function () {
    'use strict';

    var vnhState = { currentGroupId: null, currentGroupName: '', currentGroupWords: [] };
    var vnhSaveModalCtx = { dictId: null, onDone: null };

    // Bảng pastel (đồng bộ tông với .pos-badge của vocab.php): [nền, chữ, viền]
    var PASTEL = [
        ['#EEF5FF', '#3B73C9', '#D6E4FA'], ['#FFF4E5', '#C05E10', '#FAE0C0'],
        ['#EEFAF3', '#2E8B57', '#CDEEDD'], ['#F3EEFF', '#7C4DDC', '#E0D4FB'],
        ['#FFEEF5', '#B83573', '#FAD3E4'], ['#EEFAFA', '#187A80', '#CCEBED'],
        ['#FFF0EE', '#D6503A', '#FBD8D2'], ['#FDFBEE', '#836C00', '#F0E9C2'],
        ['#F0F2F8', '#4A5580', '#DCE0EC'], ['#FFF7EE', '#C47818', '#F7E3C8']
    ];
    // Bảng màu "hub" đồng bộ với Learning Hub ở Trang chủ (gradient + shadow màu + icon watermark mờ)
    // — dùng cho mọi thẻ pastel kiểu mới: TOCFL theo Level, Từ vựng theo chủ đề, Sổ tay cá nhân.
    var HUB_THEMES = [
        { grad: 'from-sky-50 to-white',     ring: 'ring-sky-100/70',     iconBg: 'from-sky-400 to-sky-600',       iconShadow: 'shadow-sky-500/30',     text: 'text-sky-600',     wm: 'text-sky-500/10',     hover: 'rgba(14,165,233,.35)' },
        { grad: 'from-blue-50 to-white',    ring: 'ring-blue-100/70',    iconBg: 'from-blue-400 to-blue-500',     iconShadow: 'shadow-blue-500/30',    text: 'text-blue-600',    wm: 'text-blue-500/10',    hover: 'rgba(59,130,246,.35)' },
        { grad: 'from-purple-50 to-white',  ring: 'ring-purple-100/70',  iconBg: 'from-purple-400 to-purple-500', iconShadow: 'shadow-purple-500/30',  text: 'text-purple-600',  wm: 'text-purple-500/10',  hover: 'rgba(168,85,247,.35)' },
        { grad: 'from-amber-50 to-white',   ring: 'ring-amber-100/70',   iconBg: 'from-amber-400 to-amber-500',   iconShadow: 'shadow-amber-500/30',   text: 'text-amber-600',   wm: 'text-amber-500/10',   hover: 'rgba(245,158,11,.35)' },
        { grad: 'from-rose-50 to-white',    ring: 'ring-rose-100/70',    iconBg: 'from-rose-400 to-rose-500',     iconShadow: 'shadow-rose-500/30',    text: 'text-rose-600',    wm: 'text-rose-500/10',    hover: 'rgba(244,63,94,.35)' },
        { grad: 'from-emerald-50 to-white', ring: 'ring-emerald-100/70', iconBg: 'from-emerald-400 to-emerald-500', iconShadow: 'shadow-emerald-500/30', text: 'text-emerald-600', wm: 'text-emerald-500/10', hover: 'rgba(16,185,129,.35)' },
        { grad: 'from-cyan-50 to-white',    ring: 'ring-cyan-100/70',    iconBg: 'from-cyan-400 to-cyan-500',     iconShadow: 'shadow-cyan-500/30',    text: 'text-cyan-600',    wm: 'text-cyan-500/10',    hover: 'rgba(6,182,212,.35)' },
        { grad: 'from-teal-50 to-white',    ring: 'ring-teal-100/70',    iconBg: 'from-teal-400 to-teal-500',     iconShadow: 'shadow-teal-500/30',    text: 'text-teal-600',    wm: 'text-teal-500/10',    hover: 'rgba(20,184,166,.35)' },
        { grad: 'from-indigo-50 to-white',  ring: 'ring-indigo-100/70',  iconBg: 'from-indigo-400 to-indigo-500', iconShadow: 'shadow-indigo-500/30',  text: 'text-indigo-600',  wm: 'text-indigo-500/10',  hover: 'rgba(99,102,241,.35)' },
        { grad: 'from-fuchsia-50 to-white', ring: 'ring-fuchsia-100/70', iconBg: 'from-fuchsia-400 to-fuchsia-500', iconShadow: 'shadow-fuchsia-500/30', text: 'text-fuchsia-600', wm: 'text-fuchsia-500/10', hover: 'rgba(217,70,239,.35)' },
        { grad: 'from-orange-50 to-white',  ring: 'ring-orange-100/70',  iconBg: 'from-orange-400 to-orange-500', iconShadow: 'shadow-orange-500/30',  text: 'text-orange-600',  wm: 'text-orange-500/10',  hover: 'rgba(249,115,22,.35)' },
        { grad: 'from-violet-50 to-white',  ring: 'ring-violet-100/70',  iconBg: 'from-violet-400 to-violet-500', iconShadow: 'shadow-violet-500/30',  text: 'text-violet-600',  wm: 'text-violet-500/10',  hover: 'rgba(139,92,246,.35)' }
    ];
    // Đưa modal ra thẳng <body> (position:fixed không bị giới hạn bởi ancestor có transform,
    // và không bị ẩn theo khi #view-vocab-notebook-hub đang hidden).
    var saveModal = document.getElementById('vnh-save-modal-backdrop');
    if (saveModal && saveModal.parentElement !== document.body) document.body.appendChild(saveModal);

    window.vnhOnOpen = function () {
        vnhLoadGroups();
        vnhLoadRoadmap();
        vnhLoadTocflCounts();
        vnhLoadDictTags();
        vnhLoadDictTagsMajor();
    };

    // ============ Modal chọn sổ tay khi bấm bookmark ============
    window.vnhOpenSaveModal = function (dictId, onDone) {
        vnhSaveModalCtx = { dictId: dictId, onDone: onDone };
        document.getElementById('vnh-save-modal-backdrop').classList.remove('hidden');
        var box = document.getElementById('vnh-save-modal-groups');
        box.innerHTML = '<div class="text-center text-slate-400 text-xs py-3"><i class="fa-solid fa-spinner fa-spin"></i></div>';
        fetch('/api.php?action=notebook_group_list').then(function (r) { return r.json(); }).then(function (res) {
            var groups = (res.success && res.groups) ? res.groups : [];
            if (!groups.length) { box.innerHTML = '<div class="text-center text-slate-400 text-xs py-2">Chưa có sổ tay riêng nào.</div>'; return; }
            box.innerHTML = groups.map(function (g) {
                return '<button onclick="vnhSaveModalPick(' + g.group_id + ')" class="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-amber-50 font-bold text-sm text-slate-600 flex items-center justify-between transition-colors">' +
                    '<span><i class="fa-solid fa-book-bookmark text-primary mr-2"></i>' + g.name + '</span>' +
                    '<span class="text-xs text-slate-400">' + (g.word_count || 0) + ' từ</span></button>';
            }).join('');
        }).catch(function () { box.innerHTML = ''; });
    };
    window.vnhCloseSaveModal = function () { document.getElementById('vnh-save-modal-backdrop').classList.add('hidden'); };
    window.vnhSaveModalPick = function (groupId) {
        var dictId = vnhSaveModalCtx.dictId;
        var url = groupId ? '/api.php?action=notebook_group_add_word' : '/api.php?action=notebook_add';
        var body = groupId ? { group_id: groupId, dict_id: dictId } : { dict_id: dictId };
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            .then(function (r) { return r.json(); }).then(function (res) {
                vnhCloseSaveModal();
                if (res.success && typeof vnhSaveModalCtx.onDone === 'function') vnhSaveModalCtx.onDone();
                else if (!res.success) alert(res.message || 'Không thể lưu.');
            }).catch(function () { vnhCloseSaveModal(); });
    };
    window.vnhSaveModalCreateGroup = function () {
        var name = prompt('Đặt tên sổ tay mới (VD: Sổ tay du lịch):');
        if (!name || !name.trim()) return;
        fetch('/api.php?action=notebook_group_create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) })
            .then(function (r) { return r.json(); }).then(function (res) {
                var gid = res.group_id || (res.group && (res.group.id || res.group.group_id));
                if (res.success && gid) vnhSaveModalPick(gid); else alert(res.message || 'Không thể tạo.');
            }).catch(function () {});
    };

    // ============ Danh sách bài học INLINE (không popup) ============
    function vnhShowLessonInline(title, lessons) {
        var wrap = document.getElementById('vnh-lesson-inline');
        var list = document.getElementById('vnh-lesson-inline-list');
        document.getElementById('vnh-lesson-inline-title').textContent = title;
        wrap.classList.remove('hidden');
        if (!lessons) { list.innerHTML = '<div class="col-span-full text-center text-slate-400 text-sm py-6"><i class="fa-solid fa-spinner fa-spin"></i></div>'; return; }
        if (!lessons.length) { list.innerHTML = '<div class="col-span-full text-center text-slate-400 text-sm py-6">Chưa có bài học nào.</div>'; return; }
        list.innerHTML = lessons.map(function (l) {
            var label = l.lesson || ('Bài ' + l.lesson_id);
            return '<button type="button" class="vnh-lesson" onclick="vnhGoToVocab(' + l.lesson_id + ', ' + (l.book_id || 'null') + ')">' +
                '<span class="l-name truncate">' + label + '</span>' +
                '<span class="l-count">' + (l.vocab_count || 0) + ' từ</span>' +
            '</button>';
        }).join('');
        wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    window.vnhCloseLessonInline = function () {
        document.getElementById('vnh-lesson-inline').classList.add('hidden');
        document.querySelectorAll('.vnh-book').forEach(function (b) { b.classList.remove('active'); });
    };
    // Đi tới /vocab GỐC — tái dùng cơ chế "resume" của trang chính (đồng bộ dropdown
    // giáo trình + bài, tải từ vựng và render đúng theo thuật toán cũ).
    window.vnhGoToVocab = function (lessonId, bookId) {
        if (typeof switchTab === 'function') switchTab('vocab');
        window.__resume = { book_id: bookId, lesson_id: lessonId };
        var sb = document.getElementById('select-book');
        if (sb && sb.options && sb.options.length > 1 && bookId) {
            sb.value = bookId;
            if (typeof loadLessons === 'function') {
                loadLessons(bookId);
                return;
            }
        }
        if (bookId && typeof loadBooksAll === 'function') {
            loadBooksAll();
        } else if (typeof loadVocabulariesAndContent === 'function') {
            var sel = document.getElementById('select-lesson'); if (sel) sel.value = lessonId;
            var done = function () { if (typeof renderVocabList === 'function') renderVocabList(); };
            try { var p = loadVocabulariesAndContent(lessonId); if (p && p.then) p.then(done, done); else done(); }
            catch (e) { done(); }
        }
    };

    // ============ Giáo trình (có ảnh bìa) ============
    function vnhGetBookImage(book, typeLabel) {
        var numMatch = String((book && book.book) || '').match(/\d+/);
        var n = numMatch ? numMatch[0] : '';
        var t = (typeLabel || '') + ' ' + ((book && book.book) || '');
        if (!n) return null;
        if (/TOCFL/i.test(t)) return { src: '/image/tocfl-' + n + '.webp?v=2', alts: [] };
        if (/Đương\s*Đại|當代/i.test(t)) return { src: '/image/Daidai' + n + '.webp?v=2', alts: ['/image/Dangdai' + n + '.webp?v=2'] };
        if (/Thời\s*Đại|時代/i.test(t)) return { src: '/image/Shidai' + n + '.webp?v=2', alts: [] };
        return null;
    }

    function vnhBookCover(book, typeLabel, idx) {
        var p = PASTEL[idx % PASTEL.length];
        var fb = '<div class="w-full h-full flex items-center justify-center" style="background:' + p[0] + '"><i class="fa-solid fa-book text-lg" style="color:' + p[1] + '"></i></div>';
        var s = vnhGetBookImage(book, typeLabel);
        if (s && s.src) {
            var alts = s.alts ? JSON.stringify(s.alts).replace(/"/g, '&quot;') : '[]';
            return '<img src="' + s.src + '" data-alts=\'' + alts + '\' class="w-full h-full object-cover" onerror="vnhBookImgError(this)">' +
                '<div class="vnh-book-fb hidden absolute inset-0">' + fb + '</div>';
        }
        return fb;
    }
    window.vnhBookImgError = function (img) {
        var alts = [];
        try { alts = JSON.parse(img.getAttribute('data-alts') || '[]'); } catch (e) { alts = []; }
        if (alts.length) { var n = alts.shift(); img.setAttribute('data-alts', JSON.stringify(alts)); img.src = n; return; }
        img.style.display = 'none';
        var fb = img.parentElement ? img.parentElement.querySelector('.vnh-book-fb') : null;
        if (fb) fb.classList.remove('hidden');
    };

    function vnhLoadRoadmap() {
        fetch('/api.php?action=get_curriculum_types').then(function (r) { return r.json(); }).then(function (types) {
            var dd = (types || []).find(function (t) { return /đương\s*đại/i.test(t.name || ''); });
            var sd = (types || []).find(function (t) { return /thời\s*đại/i.test(t.name || ''); });
            if (dd) vnhLoadBooks(dd, 'vnh-daidai-row', 'vnh-daidai-count', 'Đương Đại'); else document.getElementById('vnh-daidai-count').textContent = '0 cuốn';
            if (sd) vnhLoadBooks(sd, 'vnh-shidai-row', 'vnh-shidai-count', 'Thời Đại'); else document.getElementById('vnh-shidai-count').textContent = '0 cuốn';
        }).catch(function () {});
    }
    function vnhLoadBooks(type, rowId, countId, label) {
        fetch('/api.php?action=get_books&curriculum_id=' + type.id).then(function (r) { return r.json(); }).then(function (books) {
            books = (books || []).slice().sort(function (a, b) { return parseInt(a.book_id, 10) - parseInt(b.book_id, 10); });
            document.getElementById(countId).textContent = books.length + ' cuốn';
            var row = document.getElementById(rowId);
            if (!books.length) { row.innerHTML = '<div class="col-span-full text-slate-400 text-xs py-3 text-center">Chưa có dữ liệu.</div>'; return; }
            row.innerHTML = books.map(function (b, i) {
                var name = (b.book || ('Sách ' + b.book_id)).split('|')[0].trim();
                return '<button type="button" class="vnh-book" data-book-id="' + b.book_id + '" onclick="vnhSelectBook(' + b.book_id + ', \'' + name.replace(/'/g, "\\'") + '\', this)">' +
                    '<div class="b-cover">' + vnhBookCover(b, label, i) + '<div class="b-play"><i class="fa-solid fa-play"></i></div></div>' +
                    '<div class="b-label">' + name + '</div>' +
                '</button>';
            }).join('');
        }).catch(function () {});
    }
    window.vnhSelectBook = function (bookId, bookName, el) {
        document.querySelectorAll('.vnh-book').forEach(function (b) { b.classList.remove('active'); });
        if (el) el.classList.add('active');
        vnhShowLessonInline('Bài học — ' + bookName, null);
        fetch('/api.php?action=get_lessons&book_id=' + bookId).then(function (r) { return r.json(); }).then(function (ls) {
            vnhShowLessonInline('Bài học — ' + bookName, ls);
        }).catch(function () { vnhShowLessonInline('Bài học — ' + bookName, []); });
    };

    // ============ TOCFL theo Level ============
    function vnhLoadTocflCounts() {
        var row = document.getElementById('vnh-tocfl-row');
        var bandNames = ['Band A1', 'Band A2', 'Band B1', 'Band B2', 'Band C1', 'Band C2'];
        var render = function (counts) {
            var html = '';
            for (var lvl = 1; lvl <= 6; lvl++) {
                var th = HUB_THEMES[(lvl - 1) % HUB_THEMES.length];
                var cnt = counts[String(lvl)];
                var bandLabel = bandNames[lvl - 1];
                html += '<button type="button" class="vnh-hub-card group relative overflow-hidden text-left flex flex-col rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br ' + th.grad + ' ring-1 ' + th.ring + ' shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer" style="--hub-shadow:' + th.hover + '" onclick="vnhSelectTocflLevel(' + lvl + ')">' +
                        '<i class="fa-solid fa-certificate absolute -right-2 -bottom-2 text-5xl ' + th.wm + ' group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500 pointer-events-none"></i>' +
                        '<span class="relative z-10 w-9 h-9 rounded-xl bg-gradient-to-br ' + th.iconBg + ' text-white flex items-center justify-center text-xs shadow-lg ' + th.iconShadow + ' mb-2.5 group-hover:scale-110 group-hover:-rotate-3 transition-transform"><i class="fa-solid fa-certificate"></i></span>' +
                        '<h4 class="relative z-10 font-black text-slate-800 text-[12.5px] sm:text-[13px] leading-tight">TOCFL ' + lvl + '</h4>' +
                        '<p class="relative z-10 text-slate-500 text-[11px] mt-1 font-medium">' + bandLabel + ' · ' + (cnt !== undefined ? cnt + ' từ' : '—') + '</p>' +
                        '<span class="hub-arrow relative z-10 mt-auto pt-1.5 inline-flex items-center gap-1 ' + th.text + ' text-[10.5px] font-black">Học từ vựng <i class="fa-solid fa-arrow-right text-[8px]"></i></span>' +
                    '</button>';
            }
            row.innerHTML = html;
        };
        fetch('/admin_content_api.php?action=get_dictionary_stats').then(function (r) { return r.json(); }).then(function (res) {
            var c = {};
            if (res && res.success && res.band_dist) res.band_dist.forEach(function (r2) { c[String(r2.tocfl_band)] = r2.cnt; });
            render(c);
        }).catch(function () { render({}); });
    }

    // Bấm thẻ TOCFL Level -> chuyển thẳng sang tab Từ vựng với giáo trình TOCFL tương ứng
    window.vnhSelectTocflLevel = function (level) {
        var map = {
            1: { book_id: 11, lesson_id: 139 },
            2: { book_id: 12, lesson_id: 140 },
            3: { book_id: 13, lesson_id: 141 },
            4: { book_id: 14, lesson_id: 142 },
            5: { book_id: 15, lesson_id: 143 },
            6: { book_id: 16, lesson_id: 144 }
        };
        var target = map[level];
        if (target && typeof vnhGoToVocab === 'function') {
            vnhGoToVocab(target.lesson_id, target.book_id);
        }
    };

    // ============ Từ vựng theo chủ đề (Dictionary tag) — thẻ "hub" pastel + icon chìm ============
    function vnhHubCard(t, i) {
        var th = HUB_THEMES[i % HUB_THEMES.length];
        var cnt = parseInt(t.word_count, 10) || 0;
        var icon = t.icon_class || 'fa-solid fa-tag';
        var safeName = String(t.tag_name).replace(/'/g, "\\'");
        var empty = cnt === 0;
        return '<button type="button" class="vnh-hub-card' + (empty ? ' is-empty' : '') + ' group relative overflow-hidden text-left flex flex-col rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br ' + th.grad + ' ring-1 ' + th.ring + ' shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1.5 transition-all duration-300" style="--hub-shadow:' + th.hover + '"' +
            (empty ? ' disabled' : ' onclick="vnhSelectDictTag(' + t.tag_id + ',\'' + safeName + '\')"') + '>' +
                '<i class="' + icon + ' absolute -right-2 -bottom-2 text-5xl ' + th.wm + ' group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500 pointer-events-none"></i>' +
                '<span class="relative z-10 w-9 h-9 rounded-xl bg-gradient-to-br ' + th.iconBg + ' text-white flex items-center justify-center text-xs shadow-lg ' + th.iconShadow + ' mb-2.5 group-hover:scale-110 group-hover:-rotate-3 transition-transform"><i class="' + icon + '"></i></span>' +
                '<h4 class="relative z-10 font-black text-slate-800 text-[12.5px] sm:text-[13px] leading-tight">' + t.tag_name + '</h4>' +
                '<p class="relative z-10 text-slate-500 text-[11px] mt-1 font-medium">' + (cnt > 0 ? cnt + ' từ' : 'Đang cập nhật') + '</p>' +
                (empty ? '' : '<span class="hub-arrow relative z-10 mt-auto pt-1.5 inline-flex items-center gap-1 ' + th.text + ' text-[10.5px] font-black">Xem <i class="fa-solid fa-arrow-right text-[8px]"></i></span>') +
            '</button>';
    }
    function vnhLoadDictTags() {
        fetch('/api.php?action=get_dict_tags&category=doi-song').then(function (r) { return r.json(); }).then(function (res) {
            var grid = document.getElementById('vnh-tag-grid');
            var tags = (res && res.success && Array.isArray(res.data)) ? res.data : [];
            grid.innerHTML = tags.map(vnhHubCard).join('');
        }).catch(function () { document.getElementById('vnh-tag-grid').innerHTML = ''; });
    }
    function vnhLoadDictTagsMajor() {
        fetch('/api.php?action=get_dict_tags&category=chuyen-nganh').then(function (r) { return r.json(); }).then(function (res) {
            var grid = document.getElementById('vnh-major-grid');
            var tags = (res && res.success && Array.isArray(res.data)) ? res.data : [];
            grid.innerHTML = tags.map(vnhHubCard).join('');
        }).catch(function () { document.getElementById('vnh-major-grid').innerHTML = ''; });
    }
    // Bấm thẻ chủ đề -> điều hướng thẳng sang tab /vocab với đúng danh sách từ của chủ đề đó
    // (tái dùng vocabData/filteredVocabData toàn cục của vocab.php + switchTab('vocab') tự gọi renderVocabList()).
    window.vnhSelectDictTag = function (tagId, tagName) {
        fetch('/api.php?action=get_vocab_by_tag&tag_id=' + tagId).then(function (r) { return r.json(); }).then(function (res) {
            var words = (res && res.success && Array.isArray(res.data)) ? res.data : [];
            if (!words.length) { alert('Chủ đề "' + tagName + '" chưa có từ vựng.'); return; }
            window.__isCustomVocabActive = true;
            window.__lastLoadedLessonId = null;
            vocabData = words.map(function (w) { return Object.assign({}, w, { vocab_id: w.dict_id }); });
            if (typeof filteredVocabData !== 'undefined') filteredVocabData = vocabData.slice();
            if (typeof selectedBand !== 'undefined') selectedBand = 0;
            switchTab('vocab');
        }).catch(function () { alert('Lỗi tải từ vựng theo chủ đề.'); });
    };

    // ============ Sổ tay cá nhân — cùng style thẻ "hub" pastel + icon chìm với khối chủ đề ============
    function vnhGroupCard(g, i) {
        var th = HUB_THEMES[i % HUB_THEMES.length];
        var icon = 'fa-solid fa-book-bookmark';
        var safeName = String(g.name).replace(/'/g, "\\'");
        return '<button type="button" class="vnh-hub-card group relative overflow-hidden text-left flex flex-col rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br ' + th.grad + ' ring-1 ' + th.ring + ' shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1.5 transition-all duration-300" style="--hub-shadow:' + th.hover + '" onclick="vnhOpenGroupDetail(' + g.group_id + ', \'' + safeName + '\')">' +
                '<i class="' + icon + ' absolute -right-2 -bottom-2 text-5xl ' + th.wm + ' group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500 pointer-events-none"></i>' +
                '<span class="relative z-10 w-9 h-9 rounded-xl bg-gradient-to-br ' + th.iconBg + ' text-white flex items-center justify-center text-xs shadow-lg ' + th.iconShadow + ' mb-2.5 group-hover:scale-110 group-hover:-rotate-3 transition-transform"><i class="' + icon + '"></i></span>' +
                '<h4 class="relative z-10 font-black text-slate-800 text-[12.5px] sm:text-[13px] leading-tight truncate">' + g.name + '</h4>' +
                '<p class="relative z-10 text-slate-500 text-[11px] mt-1 font-medium">' + (g.word_count || 0) + ' từ</p>' +
                '<span class="hub-arrow relative z-10 mt-auto pt-1.5 inline-flex items-center gap-1 ' + th.text + ' text-[10.5px] font-black">Mở <i class="fa-solid fa-arrow-right text-[8px]"></i></span>' +
            '</button>';
    }
    function vnhLoadGroups() {
        fetch('/api.php?action=notebook_group_list').then(function (r) { return r.json(); }).then(function (res) {
            var grid = document.getElementById('vnh-groups-grid');
            var empty = document.getElementById('vnh-groups-empty');
            var groups = (res && res.success) ? (res.groups || res.data || []) : [];
            if (!groups.length) { grid.innerHTML = ''; if (empty) empty.classList.remove('hidden'); return; }
            if (empty) empty.classList.add('hidden');
            grid.innerHTML = groups.map(vnhGroupCard).join('');
        }).catch(function () {});
    }
    window.vnhCreateGroup = function () {
        var name = prompt('Đặt tên sổ tay mới (VD: Sổ tay du lịch):');
        if (!name || !name.trim()) return;
        fetch('/api.php?action=notebook_group_create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) })
            .then(function (r) { return r.json(); }).then(function (res) {
                if (res.success) vnhLoadGroups(); else alert(res.message || 'Không thể tạo sổ tay.');
            }).catch(function () {});
    };
    window.vnhOpenGroupDetail = function (groupId, name) {
        vnhState.currentGroupId = groupId;
        vnhState.currentGroupName = name;
        document.getElementById('vnh-group-detail-name').textContent = name;
        document.getElementById('vnh-groups-view').classList.add('hidden');
        document.getElementById('vnh-group-detail').classList.remove('hidden');
        document.getElementById('vnh-add-word-input').value = '';
        document.getElementById('vnh-add-word-dropdown').classList.add('hidden');
        vnhLoadGroupWords();
    };
    window.vnhCloseGroupDetail = function () {
        vnhState.currentGroupId = null;
        document.getElementById('vnh-group-detail').classList.add('hidden');
        document.getElementById('vnh-groups-view').classList.remove('hidden');
        vnhLoadGroups();
    };
    function vnhLoadGroupWords() {
        var box = document.getElementById('vnh-group-words');
        var empty = document.getElementById('vnh-group-words-empty');
        box.innerHTML = '<div class="text-center text-slate-400 text-xs py-4"><i class="fa-solid fa-spinner fa-spin"></i></div>';
        fetch('/api.php?action=notebook_group_words&group_id=' + vnhState.currentGroupId).then(function (r) { return r.json(); }).then(function (res) {
            if (!res.success) { box.innerHTML = ''; return; }
            vnhState.currentGroupWords = res.items || res.data || [];
            if (!vnhState.currentGroupWords.length) { box.innerHTML = ''; empty.classList.remove('hidden'); return; }
            empty.classList.add('hidden');
            box.innerHTML = vnhState.currentGroupWords.map(function (v) {
                var simp = (typeof converterT2S === 'function') ? converterT2S(v.hanzi) : '';
                var dual = (simp && simp !== v.hanzi) ? (v.hanzi + '（' + simp + '）') : v.hanzi;
                var meaning = v.first_meaning_vi || v.definition || v.meaning_vi || '';
                var did = v.dict_id || v.vocab_id;
                return '<div class="vnh-word-row hover:border-primary/40 transition-all" data-dict-id="' + did + '" data-hanzi="' + encodeURIComponent(v.hanzi || '') + '">' +
                    '<div class="min-w-0 flex-1 cursor-pointer" onclick="vnhWordClick(this)">' +
                        '<div class="vnh-word-hanzi truncate font-tc text-slate-800">' + dual + '</div>' +
                        '<div class="text-[11px] text-slate-400 truncate mt-0.5">' + (v.pinyin || '') + (meaning ? ' · ' + meaning : '') + '</div>' +
                    '</div>' +
                    '<button type="button" class="w-8 h-8 rounded-full text-slate-400 hover:text-primary hover:bg-slate-100 flex items-center justify-center shrink-0 transition-colors" onclick="vnhWordAudio(this, event)" title="Phát âm"><i class="fa-solid fa-volume-high text-xs pointer-events-none"></i></button>' +
                    '<button type="button" class="w-7 h-7 rounded-full text-slate-300 hover:text-td-red hover:bg-red-50 flex items-center justify-center shrink-0 transition-colors" onclick="vnhRemoveGroupWord(' + did + ')" title="Xóa khỏi sổ tay"><i class="fa-solid fa-trash-can text-xs pointer-events-none"></i></button>' +
                '</div>';
            }).join('');
        }).catch(function () { box.innerHTML = ''; });
    }
    window.vnhWordClick = function(el) {
        var row = el.closest('.vnh-word-row');
        var did = row ? row.dataset.dictId : null;
        if (did && typeof openDictDetailModal === 'function') openDictDetailModal(did);
    };
    window.vnhWordAudio = function(btn, ev) {
        if (ev) ev.stopPropagation();
        var row = btn.closest('.vnh-word-row');
        var hz = row ? decodeURIComponent(row.dataset.hanzi || '') : '';
        if (hz && typeof playTTS === 'function') playTTS(encodeURIComponent(hz), ev);
    };
    window.vnhRemoveGroupWord = function (dictId) {
        fetch('/api.php?action=notebook_group_remove_word&group_id=' + vnhState.currentGroupId + '&dict_id=' + dictId, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_id: vnhState.currentGroupId, dict_id: dictId })
        })
        .then(function (r) { return r.json(); })
        .then(function () { vnhLoadGroupWords(); })
        .catch(function () {});
    };
    window.vnhDeleteGroup = function () {
        if (!confirm('Xóa sổ tay "' + vnhState.currentGroupName + '"? Toàn bộ từ đã lưu trong sổ tay này sẽ mất.')) return;
        fetch('/api.php?action=notebook_group_delete&group_id=' + vnhState.currentGroupId, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_id: vnhState.currentGroupId })
        })
        .then(function (r) { return r.json(); })
        .then(function (res) {
            if (res.success) vnhCloseGroupDetail(); else alert(res.message || 'Không thể xóa.');
        }).catch(function () {});
    };
    var vnhAddWordTimer = null;
    var vnhLastSearchResults = [];
    window.vnhAddWordSearch = function () {
        clearTimeout(vnhAddWordTimer);
        vnhAddWordTimer = setTimeout(function () {
            var q = document.getElementById('vnh-add-word-input').value.trim();
            var dd = document.getElementById('vnh-add-word-dropdown');
            if (!q) { dd.classList.add('hidden'); dd.innerHTML = ''; return; }
            fetch('/api.php?action=dict_lookup_search&q=' + encodeURIComponent(q)).then(function (r) { return r.json(); }).then(function (res) {
                var entries = (res.success && res.data) ? res.data : [];
                vnhLastSearchResults = entries;
                if (!entries.length) { dd.innerHTML = '<div class="p-3 text-xs text-slate-400 font-medium">Không tìm thấy từ phù hợp.</div>'; dd.classList.remove('hidden'); return; }
                dd.innerHTML = entries.slice(0, 10).map(function (e) {
                    return '<button type="button" class="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 border-b border-slate-50 last:border-none text-xs" onclick="vnhAddWordToGroup(' + e.dict_id + ')">' +
                        '<span class="font-black text-slate-700">' + e.hanzi + '</span>' +
                        '<span class="text-slate-400">' + (e.pinyin || '') + '</span>' +
                        '<span class="text-slate-500 truncate flex-1">' + (e.first_meaning_vi || e.definition || '') + '</span>' +
                    '</button>';
                }).join('');
                dd.classList.remove('hidden');
            }).catch(function () {});
        }, 150);
    };
    window.vnhAddWordToGroup = function (dictId) {
        var foundEntry = (vnhLastSearchResults || []).find(function (x) { return String(x.dict_id) === String(dictId); });
        var payload = { group_id: vnhState.currentGroupId, dict_id: dictId };
        if (foundEntry) {
            payload.entry = {
                dict_id: foundEntry.dict_id,
                vocab_id: foundEntry.dict_id,
                hanzi: foundEntry.hanzi,
                pinyin: foundEntry.pinyin,
                first_meaning_vi: foundEntry.first_meaning_vi || foundEntry.definition || '',
                definition: foundEntry.definition || foundEntry.first_meaning_vi || '',
                part_of_speech: foundEntry.part_of_speech || 'Từ vựng'
            };
        }
        fetch('/api.php?action=notebook_group_add_word', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(function (r) { return r.json(); }).then(function (res) {
            if (res.success) {
                document.getElementById('vnh-add-word-input').value = '';
                document.getElementById('vnh-add-word-dropdown').classList.add('hidden');
                vnhLoadGroupWords();
            } else { alert(res.message || 'Không thể thêm từ.'); }
        }).catch(function () {});
    };
    window.vnhReviewFlashcard = function () {
        if (!vnhState.currentGroupWords.length) { alert('Sổ tay này chưa có từ nào để ôn tập.'); return; }
        var customWords = vnhState.currentGroupWords.map(function (it) {
            return Object.assign({}, it, {
                vocab_id: it.vocab_id || it.dict_id,
                dict_id: it.dict_id || it.vocab_id,
                definition: it.definition || it.first_meaning_vi || it.meaning_vi || ''
            });
        });
        window.__isNotebookFlashcard = true;
        window.__customFlashcardList = (typeof expandFlashcardVocab === 'function') ? expandFlashcardVocab(customWords) : customWords.slice();
        flashcardList = window.__customFlashcardList.slice();
        currentFlashcardIdx = 0;
        currentExamplePlayIdx = 0;
        var inner = document.getElementById('flashcard-inner');
        if (inner) inner.classList.remove('rotate-y-180');
        if (typeof updateFlashcardUI === 'function') updateFlashcardUI();
        switchTab('flashcard');
    };
})();
