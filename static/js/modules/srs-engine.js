    window.copyFcExample = function(btn, text) {
        if (!text) return;
        const cleanText = text.replace(/&quot;/g, '"');
        function onSuccess() {
            if (btn) {
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = 'fa-solid fa-check text-xs sm:text-sm text-emerald-600';
                    setTimeout(() => { icon.className = 'fa-regular fa-copy text-xs sm:text-sm pointer-events-none'; }, 1500);
                }
            }
            if (typeof showToast === 'function') showToast('Đã sao chép ví dụ!');
        }
        function fallback() {
            const ta = document.createElement('textarea');
            ta.value = cleanText;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); onSuccess(); } catch (e) {}
            document.body.removeChild(ta);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(cleanText).then(onSuccess).catch(fallback);
        } else {
            fallback();
        }
    };

let fcSrsScope = 'lesson';
    let fcSrsDonut = null, fcSrsBucketChart = null;
    let fcDueNowVocab = [];
    var flashcardList = [];

    function isTradSimpVariantOnly(hanziParts) {
        if (!Array.isArray(hanziParts) || hanziParts.length < 2) return false;
        if (typeof ensureOpenCC === 'function') ensureOpenCC();
        const clean = hanziParts.map(s => (s || '').replace(/[^\u4e00-\u9fa5]/g, '').trim()).filter(Boolean);
        if (clean.length < 2) return false;
        const firstLen = clean[0].length;
        if (!clean.every(s => s.length === firstLen)) return false;

        if (typeof converterT2S === 'function') {
            const simps = clean.map(s => converterT2S(s));
            if (simps.every(s => s === simps[0])) return true;
        }
        if (typeof converterS2T === 'function') {
            const trads = clean.map(s => converterS2T(s));
            if (trads.every(s => s === trads[0])) return true;
        }
        return false;
    }

    function resetFlashcardScroll() {
        const doReset = () => {
            const backScroll = document.getElementById('fc-back-scroll') || document.querySelector('#fc-face-back .overflow-y-auto');
            if (backScroll) {
                backScroll.scrollTop = 0;
                if (typeof backScroll.scrollTo === 'function') {
                    try { backScroll.scrollTo(0, 0); } catch (e) {}
                }
            }
            const backFace = document.getElementById('fc-face-back');
            if (backFace) {
                backFace.scrollTop = 0;
                if (typeof backFace.scrollTo === 'function') {
                    try { backFace.scrollTo(0, 0); } catch (e) {}
                }
            }
            const frontFace = document.getElementById('fc-face-front');
            if (frontFace) frontFace.scrollTop = 0;
            const cardWrapper = document.getElementById('fc-card-wrapper');
            if (cardWrapper) cardWrapper.scrollTop = 0;
            const ctxBox = document.getElementById('fc-contexts');
            if (ctxBox) ctxBox.scrollTop = 0;
        };

        doReset();
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => {
                doReset();
                requestAnimationFrame(doReset);
            });
        }
        setTimeout(doReset, 50);
        setTimeout(doReset, 150);
        setTimeout(doReset, 350);
        setTimeout(doReset, 500);
    }

    function pickSplitVocabPinyin(partHanzi, idx, hanziParts, pinyinParts, rawPinyin) {
        if (!pinyinParts || pinyinParts.length === 0) return rawPinyin;
        if (pinyinParts.length === hanziParts.length) return pinyinParts[idx];

        const trimmedH = (partHanzi || '').trim();
        // 1. Kết thúc bằng '兒' / '儿' và có pinyin tương ứng kết thúc bằng 'r'
        if (/[兒儿]$/.test(trimmedH)) {
            const rPart = pinyinParts.find(p => /r$/i.test(p.trim()));
            if (rPart) return rPart;
        }
        // 2. Kết thúc bằng '子' và có pinyin tương ứng kết thúc bằng 'zi'
        if (/子$/.test(trimmedH)) {
            const ziPart = pinyinParts.find(p => /zi$/i.test(p.trim()));
            if (ziPart) return ziPart;
        }
        // 3. Khớp số âm tiết theo số chữ Hán
        const cleanH = trimmedH.replace(/[^\u4e00-\u9fa5]/g, '');
        const hLen = cleanH.length || trimmedH.length;
        const countSyllables = (p) => {
            const m = (p || '').toLowerCase().match(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜaeiouü]+/g);
            return m ? m.length : 1;
        };
        const matchingLen = pinyinParts.filter(p => countSyllables(p) === hLen);
        if (matchingLen.length >= 1) {
            return matchingLen[0];
        }

        // 4. Dự phòng: nếu chỉ số hợp lệ lấy theo index, còn lại lấy phần pinyin cuối
        if (idx < pinyinParts.length) return pinyinParts[idx];
        return pinyinParts[pinyinParts.length - 1];
    }

    // Tách phần định nghĩa tương ứng cho từng từ (ví dụ "Như thế này / Như thế kia" -> ["Như thế này", "Như thế kia"])
    // Bỏ qua dấu gạch chéo nằm trong dấu ngoặc chú thích như (trong nước/chất lỏng)
    function splitDefinitionParts(defStr, expectedLen) {
        if (!defStr || typeof defStr !== 'string') return [defStr || ''];
        let depth = 0;
        let masked = '';
        for (let i = 0; i < defStr.length; i++) {
            const c = defStr[i];
            if (c === '(' || c === '（' || c === '[' || c === '【') {
                depth++;
                masked += c;
            } else if (c === ')' || c === '）' || c === ']' || c === '】') {
                depth = Math.max(0, depth - 1);
                masked += c;
            } else if ((c === '/' || c === '／') && depth > 0) {
                masked += '\u0000';
            } else {
                masked += c;
            }
        }
        const parts = masked.split(/[/／]/).map(p => p.replace(/\u0000/g, '/').trim()).filter(Boolean);
        if (parts.length === expectedLen) {
            return parts;
        }
        const arr = [];
        for (let i = 0; i < expectedLen; i++) arr.push(defStr.trim());
        return arr;
    }

    function splitPinyinSyllables(p) {
        if (!p || typeof p !== 'string') return [];
        const trimmed = p.trim();
        if (trimmed.includes(' ')) {
            return trimmed.split(/\s+/).filter(Boolean);
        }
        const matches = trimmed.match(/(?:[bcdfghjklmnpqrstwxyz]|zh|ch|sh)*(?:[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜaeiouüv]+(?:ng|n|r)?)(?:r)?/gi);
        return matches ? matches.filter(Boolean) : [trimmed];
    }

    function escRegex(s) {
        return (s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Tự động chuyển đổi câu ví dụ sang từ đang học (ví dụ: chuyển từ chứa "這麼" sang "那麼")
    function adaptVocabExample(ex, partHanzi, partPinyin, partDef, allHanziParts, allPinyinParts, allDefParts, origDef) {
        if (!ex || typeof ex !== 'object') return ex;
        let hanzi = (ex.examples_hanzi || '').trim();
        let pinyin = (ex.examples_pinyin || '').trim();
        let translation = (ex.examples_translation || '').trim();

        if (hanzi.includes(partHanzi)) {
            return {
                ...ex,
                examples_hanzi: hanzi,
                examples_pinyin: pinyin,
                examples_translation: translation
            };
        }

        let matchedOtherIdx = -1;
        let matchedOtherHanzi = '';
        for (let i = 0; i < allHanziParts.length; i++) {
            const otherH = allHanziParts[i];
            if (otherH !== partHanzi && otherH && hanzi.includes(otherH)) {
                matchedOtherIdx = i;
                matchedOtherHanzi = otherH;
                break;
            }
        }

        if (!matchedOtherHanzi) {
            return ex;
        }

        const otherPinyin = allPinyinParts[matchedOtherIdx] || '';
        const otherDef = allDefParts[matchedOtherIdx] || '';

        // Thay thế chữ Hán trong câu ví dụ (xử lý cả dạng gạch chéo kép như "腳踏車/自行車")
        const slashComboRegex = new RegExp(`${escRegex(matchedOtherHanzi)}\\s*[/／]\\s*${escRegex(partHanzi)}|${escRegex(partHanzi)}\\s*[/／]\\s*${escRegex(matchedOtherHanzi)}`, 'g');
        if (slashComboRegex.test(hanzi)) {
            hanzi = hanzi.replace(slashComboRegex, partHanzi);
        } else {
            hanzi = hanzi.replace(new RegExp(escRegex(matchedOtherHanzi), 'g'), partHanzi);
        }

        // Thay thế Pinyin trong câu ví dụ
        if (otherPinyin && partPinyin) {
            const srcClean = otherPinyin.trim();
            const targetClean = partPinyin.trim();
            const srcSyllables = splitPinyinSyllables(srcClean);
            const targetSyllables = splitPinyinSyllables(targetClean);

            const srcSpaced = srcSyllables.join(' ');
            const targetSpaced = targetSyllables.join(' ');
            const srcJoined = srcClean.replace(/\s+/g, '');
            const targetJoined = targetClean.replace(/\s+/g, '');

            const pSlashRegex = new RegExp(`${escRegex(srcSpaced)}\\s*[/／]\\s*${escRegex(targetSpaced)}|${escRegex(targetSpaced)}\\s*[/／]\\s*${escRegex(srcSpaced)}`, 'gi');
            if (pSlashRegex.test(pinyin)) {
                pinyin = pinyin.replace(pSlashRegex, targetSpaced);
            } else {
                if (srcSpaced && targetSpaced) {
                    pinyin = pinyin.replace(new RegExp(escRegex(srcSpaced), 'gi'), (match) => {
                        if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
                            return targetSpaced.charAt(0).toUpperCase() + targetSpaced.slice(1);
                        }
                        return targetSpaced;
                    });
                }
                if (srcJoined && targetJoined) {
                    pinyin = pinyin.replace(new RegExp(escRegex(srcJoined), 'gi'), (match) => {
                        if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
                            return targetJoined.charAt(0).toUpperCase() + targetJoined.slice(1);
                        }
                        return targetJoined;
                    });
                }
            }
        }

        // Thay thế nghĩa trong bản dịch ví dụ khi định nghĩa được tách riêng
        if (partDef && otherDef && partDef !== origDef && otherDef !== origDef) {
            const srcDefClean = otherDef.trim();
            const targetDefClean = partDef.trim();
            if (srcDefClean && targetDefClean) {
                const defRegex = new RegExp(escRegex(srcDefClean), 'gi');
                if (defRegex.test(translation)) {
                    translation = translation.replace(defRegex, (m) => {
                        if (m[0] === m[0].toUpperCase()) {
                            return targetDefClean.charAt(0).toUpperCase() + targetDefClean.slice(1);
                        }
                        return targetDefClean.toLowerCase();
                    });
                } else {
                    if (/như thế này|như này|như vậy|thế này/i.test(translation) && /kia|đó/i.test(targetDefClean)) {
                        translation = translation.replace(/như thế này|như này|như vậy/gi, 'như thế kia')
                                                 .replace(/thế này/gi, 'thế kia');
                    } else if (/như thế kia|như kia|thế kia/i.test(translation) && /này/i.test(targetDefClean)) {
                        translation = translation.replace(/như thế kia|như kia/gi, 'như thế này')
                                                 .replace(/thế kia/gi, 'thế này');
                    }
                }
            }
        }

        return {
            ...ex,
            examples_hanzi: hanzi,
            examples_pinyin: pinyin,
            examples_translation: translation
        };
    }

    function adaptVocabExampleList(examples, partHanzi, partPinyin, partDef, allHanziParts, allPinyinParts, allDefParts, origDef) {
        if (!Array.isArray(examples) || examples.length === 0) return [];
        const directMatches = [];
        const adaptedMatches = [];
        const others = [];

        examples.forEach(ex => {
            if (!ex) return;
            const h = (ex.examples_hanzi || '');
            if (h.includes(partHanzi)) {
                directMatches.push(ex);
            } else {
                const hasOther = allHanziParts.some(otherH => otherH && otherH !== partHanzi && h.includes(otherH));
                if (hasOther) {
                    adaptedMatches.push(adaptVocabExample(ex, partHanzi, partPinyin, partDef, allHanziParts, allPinyinParts, allDefParts, origDef));
                } else {
                    others.push(ex);
                }
            }
        });

        return [...directMatches, ...adaptedMatches, ...others];
    }

    // Tách 1 mục từ vựng có dấu gạch chéo thành các mục độc lập, gán nghĩa và ví dụ chính xác tương ứng
    function splitVocabItemForLearning(v, splitType) {
        if (!v) return [];
        const rawHanzi = (v.hanzi || '').trim();
        if (!/[/／]/.test(rawHanzi)) {
            return [v];
        }
        const hanziParts = rawHanzi.split(/[/／]/).map(s => s.trim()).filter(Boolean);
        if (hanziParts.length <= 1) {
            return [v];
        }
        // Biến thể Phồn/Giản của cùng 1 từ (như 老闆/老板, 計劃/計畫) giữ nguyên 1 thẻ duy nhất
        if (typeof isTradSimpVariantOnly === 'function' && isTradSimpVariantOnly(hanziParts)) {
            return [v];
        }
        const rawPinyin = (v.pinyin || '').trim();
        const pinyinParts = /[/／]/.test(rawPinyin)
            ? rawPinyin.split(/[/／]/).map(s => s.trim()).filter(Boolean)
            : [];
        const rawDef = (v.definition || '').trim();
        const defParts = splitDefinitionParts(rawDef, hanziParts.length);

        const resolvedPinyins = hanziParts.map((partH, i) =>
            pickSplitVocabPinyin(partH, i, hanziParts, pinyinParts, rawPinyin)
        );

        const baseId = v.vocab_id || v.id || `v_split`;
        return hanziParts.map((partHanzi, idx) => {
            const partPinyin = resolvedPinyins[idx];
            const partDef = defParts[idx] || rawDef;
            const adaptedExs = adaptVocabExampleList(v.examples, partHanzi, partPinyin, partDef, hanziParts, resolvedPinyins, defParts, rawDef);

            const item = {
                ...v,
                vocab_id: `${baseId}_part_${idx + 1}`,
                id: `${baseId}_part_${idx + 1}`,
                original_vocab_id: baseId,
                hanzi: partHanzi,
                pinyin: partPinyin,
                definition: partDef,
                examples: adaptedExs
            };
            if (splitType === 'flashcard') item._is_split_flashcard = true;
            if (splitType === 'quiz') item._is_split_question = true;
            return item;
        });
    }

    // Tách các từ đồng nghĩa có dấu / hoặc ／ (ví dụ "相片/照片", "哪裡/哪兒", "這麼/那麼") thành các thẻ flashcard riêng biệt
    // Đồng thời tách nghĩa tương ứng và chuyển đổi ví dụ minh hoạ theo từ đang học
    function expandFlashcardVocab(vocabList) {
        if (!Array.isArray(vocabList)) return [];
        const cards = [];
        vocabList.forEach((v) => {
            if (!v || v.is_proper_noun) return;
            cards.push(...splitVocabItemForLearning(v, 'flashcard'));
        });
        return cards;
    }

    function setFcSrsScope(scope) {
        fcSrsScope = scope;
        document.getElementById('fc-scope-lesson-btn')?.classList.toggle('bg-white', scope === 'lesson');
        document.getElementById('fc-scope-lesson-btn')?.classList.toggle('shadow-sm', scope === 'lesson');
        document.getElementById('fc-scope-lesson-btn')?.classList.toggle('text-primary', scope === 'lesson');
        document.getElementById('fc-scope-all-btn')?.classList.toggle('bg-white', scope === 'all');
        document.getElementById('fc-scope-all-btn')?.classList.toggle('shadow-sm', scope === 'all');
        document.getElementById('fc-scope-all-btn')?.classList.toggle('text-primary', scope === 'all');
        loadFcSrsPanel();
    }

    async function loadFcSrsPanel() {
        const panel = document.getElementById('fc-srs-panel');
        if (!panel) return;
        if (!currentUser || isSrsMode) { panel.classList.add('hidden'); return; }
        const lessonId = fcCurrentLessonId();
        const effectiveScope = (fcSrsScope === 'lesson' && !lessonId) ? 'all' : fcSrsScope;
        panel.classList.remove('hidden');
        const url = effectiveScope === 'lesson'
            ? `/api.php?action=get_lesson_srs_stats&lesson_id=${lessonId}`
            : `/api.php?action=get_lesson_srs_stats&lesson_id=0`;
        try {
            const res = await fetch(url);
            const json = await res.json();
            if (!json.success) return;
            renderFcSrsPanel(json.data);
        } catch (e) {}
    }

    // 4 màu đồng bộ với 4 nút đánh giá SRS (Đã quên/Chưa thuộc/Đang nhớ/Thuộc lòng) — cùng bảng
    // màu red/orange/blue/emerald-500 dùng trên các nút để học viên liên hệ trực quan donut <-> nút.
    const FC_SRS_COLORS = { forgot: '#ef4444', notMastered: '#f97316', recalling: '#3b82f6', mastered: '#10b981' };

    function renderFcSrsPanel(d) {
        if (!d) return;
        const m = d.mastered || 0;
        const r = d.recalling || 0;
        const nm = d.not_mastered || 0;
        const f = d.forgot || 0;
        const due = d.due_now || 0;

        document.getElementById('fc-stat-mastered').textContent = m;
        document.getElementById('fc-stat-recalling').textContent = r;
        document.getElementById('fc-stat-notmastered').textContent = nm;
        document.getElementById('fc-stat-forgot').textContent = f;

        const reviewBtn = document.getElementById('fc-review-now-btn');
        document.getElementById('fc-review-now-count').textContent = due;
        if (due > 0) { reviewBtn.classList.remove('hidden'); reviewBtn.classList.add('flex'); }
        else { reviewBtn.classList.add('hidden'); reviewBtn.classList.remove('flex'); }

        const ctxDonut = document.getElementById('fc-mastery-donut');
        if (fcSrsDonut) fcSrsDonut.destroy();
        if (typeof Chart !== 'undefined' && ctxDonut) {
            const total = m + r + nm + f;
            fcSrsDonut = new Chart(ctxDonut, {
                type: 'doughnut',
                data: total > 0 ? {
                    labels: ['Thuộc lòng', 'Đang nhớ', 'Chưa thuộc', 'Đã quên'],
                    datasets: [{
                        data: [m, r, nm, f],
                        backgroundColor: [FC_SRS_COLORS.mastered, FC_SRS_COLORS.recalling, FC_SRS_COLORS.notMastered, FC_SRS_COLORS.forgot],
                        borderWidth: 0,
                        borderRadius: 8,
                        spacing: 2,
                    }]
                } : {
                    labels: ['Chưa có dữ liệu'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#e2e8f0'],
                        borderWidth: 0
                    }]
                },
                options: { cutout: '72%', plugins: { legend: { display: false } }, maintainAspectRatio: false }
            });
        }

        const ctxBar = document.getElementById('fc-srs-bucket-bar');
        const b = d.buckets || {};
        if (fcSrsBucketChart) fcSrsBucketChart.destroy();
        if (typeof Chart !== 'undefined' && ctxBar) {
            fcSrsBucketChart = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: ['1', '2', '3', '4', 'Nhớ sâu'],
                    datasets: [{ data: [b['1'] || 0, b['2'] || 0, b['3'] || 0, b['4'] || 0, b.deep || 0], backgroundColor: ['#f87171', '#fb923c', '#60a5fa', '#818cf8', '#a78bfa'], borderRadius: 6 }]
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, suggestedMax: 5, ticks: { precision: 0, stepSize: 1 } } }
                }
            });
        }
    }

    // Bấm "Ôn ngay N từ" — chỉ nạp đúng các từ đang due của bài học (hoặc toàn tài khoản nếu đang
    // ở chế độ "Tất cả"), không phải lật lại toàn bộ danh sách như học bình thường.
    async function reviewForgottenNow() {
        if (!currentUser) return;
        const lessonId = fcCurrentLessonId();
        const url = (fcSrsScope === 'lesson' && lessonId)
            ? `/api.php?action=get_due_vocab&lesson_id=${lessonId}`
            : `/api.php?action=get_due_vocab`;
        try {
            const res = await fetch(url);
            const json = await res.json();
            if (!json.success || !json.data || json.data.length === 0) return;
            isSrsMode = true;
            vocabData = json.data;
            filteredVocabData = [...vocabData];
            document.getElementById('fc-srs-panel').classList.add('hidden');
            initFlashcard();
        } catch (e) {}
    }

    function initFlashcard() {
        if (window.__isNotebookFlashcard && window.__customFlashcardList && window.__customFlashcardList.length > 0) {
            flashcardList = window.__customFlashcardList.slice();
        } else {
            window.__isNotebookFlashcard = false;
            flashcardList = expandFlashcardVocab(vocabData);
        }
        currentFlashcardIdx = 0; currentExamplePlayIdx = 0;
        resetFlashcardScroll();
        updateFlashcardUI();
        if (typeof preloadLessonAudio === 'function') preloadLessonAudio(flashcardList);
        document.getElementById('flashcard-inner').classList.remove('rotate-y-180');
        document.getElementById('flashcard-nav-btns').classList.remove('hidden');
        if (currentUser) {
            document.getElementById('srs-rating-controls').classList.remove('hidden');
        } else {
            document.getElementById('srs-rating-controls').classList.add('hidden');
        }
        initSwipeGesture();
        restoreFlashcardProgress();
        document.getElementById('fc-scope-lesson-btn')?.classList.toggle('bg-white', fcSrsScope === 'lesson');
        document.getElementById('fc-scope-lesson-btn')?.classList.toggle('shadow-sm', fcSrsScope === 'lesson');
        document.getElementById('fc-scope-lesson-btn')?.classList.toggle('text-primary', fcSrsScope === 'lesson');
        document.getElementById('fc-scope-all-btn')?.classList.toggle('bg-white', fcSrsScope === 'all');
        document.getElementById('fc-scope-all-btn')?.classList.toggle('shadow-sm', fcSrsScope === 'all');
        document.getElementById('fc-scope-all-btn')?.classList.toggle('text-primary', fcSrsScope === 'all');
        window.__flashcardLessonId = String(fcCurrentLessonId() || window.currentLessonId || '');
        window.__resetFlashcardSession = false;
        loadFcSrsPanel();
    }

    // ------- LƯU / KHÔI PHỤC TIẾN TRÌNH HỌC FLASHCARD (report #85) -------
    // Học dở tới thẻ N thì lần sau mở lại bài đó tiếp tục từ thẻ N, không quay về thẻ 1.
    let __fcSaveTimer = null;
    function fcCurrentLessonId() {
        const les = document.getElementById('select-lesson');
        if (les && les.value) return parseInt(les.value, 10);
        if (typeof vocabData !== 'undefined' && vocabData && vocabData.length > 0 && vocabData[0].lesson_id) {
            return parseInt(vocabData[0].lesson_id, 10);
        }
        return 0;
    }
    function saveFlashcardProgress() {
        // Không lưu khi: chưa đăng nhập, đang ôn SRS (bộ thẻ động), hoặc đang xáo trộn (index vô nghĩa)
        if (!currentUser || isSrsMode || isFlashcardShuffle) return;
        const lessonId = fcCurrentLessonId();
        if (!lessonId || !flashcardList || flashcardList.length === 0) return;
        clearTimeout(__fcSaveTimer);
        __fcSaveTimer = setTimeout(() => {
            fetch('/api.php?action=save_flashcard_progress', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lesson_id: lessonId, last_viewed_index: currentFlashcardIdx, total_cards: flashcardList.length })
            }).catch(() => {});
        }, 800);
    }
    async function restoreFlashcardProgress() {
        if (!currentUser || isSrsMode || isFlashcardShuffle) return;
        const lessonId = fcCurrentLessonId();
        if (!lessonId || !flashcardList || flashcardList.length === 0) return;
        try {
            const r = await fetch(`/api.php?action=get_flashcard_progress&lesson_id=${lessonId}`);
            const j = await r.json();
            const idx = j && j.success && j.data ? parseInt(j.data.last_viewed_index, 10) : 0;
            // Chỉ khôi phục khi index hợp lệ và user chưa tự chuyển thẻ trong lúc chờ fetch
            if (idx > 0 && idx < flashcardList.length && currentFlashcardIdx === 0 && lessonId === fcCurrentLessonId()) {
                currentFlashcardIdx = idx;
                updateFlashcardUI();
                const counter = document.getElementById('fc-counter');
                if (counter) { counter.classList.add('text-primary', 'font-black'); setTimeout(() => counter.classList.remove('text-primary', 'font-black'), 2000); }
            }
        } catch (e) {}
    }
    // ----------------------------------------------------------------------

    function animateCardSlide(direction) {
        const wrapper = document.getElementById('fc-card-wrapper');
        if (!wrapper) return;
        wrapper.classList.remove('fc-slide-next', 'fc-slide-prev', 'fc-card-enter');
        wrapper.style.transition = 'none';
        wrapper.style.transform = '';
        wrapper.style.opacity = '';
        void wrapper.offsetWidth;

        const animClass = direction >= 0 ? 'fc-slide-next' : 'fc-slide-prev';
        requestAnimationFrame(() => {
            wrapper.classList.add(animClass);
            const onEnd = () => {
                wrapper.classList.remove(animClass);
                wrapper.removeEventListener('animationend', onEnd);
            };
            wrapper.addEventListener('animationend', onEnd, { once: true });
            setTimeout(onEnd, 280);
        });
    }

    function initSwipeGesture() {
        const wrapper = document.getElementById('fc-card-wrapper');
        if (!wrapper || wrapper._swipeInited) return;
        wrapper._swipeInited = true;

        let startX = 0, startY = 0, dx = 0, isDragging = false, didSwipe = false, swipeDir = null;
        const THRESHOLD = 60;

        wrapper.addEventListener('touchstart', (e) => {
            wrapper.classList.remove('fc-slide-next', 'fc-slide-prev', 'fc-card-enter');
            wrapper.classList.add('is-swiping');
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            dx = 0; isDragging = true; didSwipe = false; swipeDir = null;
            wrapper.style.transition = 'none';
        }, { passive: true });

        wrapper.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const curX = e.touches[0].clientX;
            const curY = e.touches[0].clientY;
            dx = curX - startX;
            const dy = curY - startY;
            if (!swipeDir && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
                swipeDir = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
            }
            if (swipeDir !== 'h') return;
            if (Math.abs(dx) > 10) didSwipe = true;
            // Hoạt ảnh trượt mượt: theo tay có độ nghiêng nhẹ tự nhiên
            const rotate = dx * 0.035;
            const opacity = Math.max(0.2, 1 - Math.abs(dx) / 360);
            wrapper.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;
            wrapper.style.opacity = opacity;
        }, { passive: true });

        wrapper.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;

            if (dx < -THRESHOLD) {
                // Trượt lướt ra bên trái -> thẻ mới trượt mờ vào
                wrapper.style.transition = 'transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.16s ease-out';
                wrapper.style.transform = 'translateX(-110px) rotate(-4deg)';
                wrapper.style.opacity = '0';
                setTimeout(() => {
                    wrapper.style.transition = 'none';
                    wrapper.style.transform = '';
                    wrapper.style.opacity = '';
                    wrapper.classList.remove('is-swiping');
                    didSwipe = false;
                    navFlashcard(1);
                }, 140);
            } else if (dx > THRESHOLD) {
                // Trượt lướt ra bên phải -> thẻ mới trượt mờ vào
                wrapper.style.transition = 'transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.16s ease-out';
                wrapper.style.transform = 'translateX(110px) rotate(4deg)';
                wrapper.style.opacity = '0';
                setTimeout(() => {
                    wrapper.style.transition = 'none';
                    wrapper.style.transform = '';
                    wrapper.style.opacity = '';
                    wrapper.classList.remove('is-swiping');
                    didSwipe = false;
                    navFlashcard(-1);
                }, 140);
            } else {
                // Hồi phục lại vị trí với Apple Spring Bounce
                wrapper.style.transition = 'transform 0.28s cubic-bezier(0.34, 1.35, 0.64, 1), opacity 0.22s ease-out';
                wrapper.style.transform = '';
                wrapper.style.opacity = '';
                setTimeout(() => {
                    wrapper.style.transition = 'none';
                    wrapper.classList.remove('is-swiping');
                    didSwipe = false;
                }, 280);
            }
        });

        wrapper.addEventListener('click', (e) => {
            if (didSwipe) { e.stopImmediatePropagation(); didSwipe = false; return; }
            const sel = window.getSelection && window.getSelection();
            if (sel && !sel.isCollapsed && sel.toString().trim()) {
                e.stopImmediatePropagation();
                return;
            }
        }, true);
    }

    function flipFlashcard(event) {
        if (event && event.target && event.target.closest('#fc-card-wrapper')) {
            if (event.target.closest('button, a, input, select, textarea, .fc-example-item, #fc-examples, #fc-contexts-section, .fc-interactive-text, .char-hanzi')) {
                return;
            }
        }
        const inner = document.getElementById('flashcard-inner');
        if (inner) {
            inner.classList.toggle('rotate-y-180');
        }
        resetFlashcardScroll();
        currentExamplePlayIdx = 0; 
        removeExampleHighlights();
    }

    function removeExampleHighlights() {
        document.querySelectorAll('.fc-example-item').forEach(el => el.classList.remove('ring-2', 'ring-primary', 'bg-blue-50/50'));
    }

    function navFlashcard(direction) {
        if (!flashcardList || flashcardList.length === 0) {
            flashcardList = expandFlashcardVocab(vocabData);
        }
        if (flashcardList.length === 0) return;
        if (isSrsMode && direction === 1 && currentFlashcardIdx >= flashcardList.length - 1) {
            showCompletionModal('flashcard', flashcardList.length);
            return;
        }
        currentFlashcardIdx = (currentFlashcardIdx + direction + flashcardList.length) % flashcardList.length;
        const inner = document.getElementById('flashcard-inner');
        if (inner) inner.classList.remove('rotate-y-180');
        resetFlashcardScroll();
        currentExamplePlayIdx = 0;
        removeExampleHighlights();
        updateFlashcardUI();
        animateCardSlide(direction);
        saveFlashcardProgress();
    }



    // Xáo trộn: phá thứ tự chronological của danh sách từ, reset về thẻ đầu (Fisher-Yates)
    let isFlashcardShuffle = false;
    function toggleFlashcardShuffle() {
        isFlashcardShuffle = !isFlashcardShuffle;
        const btn = document.getElementById('fc-shuffle-btn');
        if (btn) {
            btn.classList.toggle('bg-primary', isFlashcardShuffle);
            btn.classList.toggle('text-white', isFlashcardShuffle);
            btn.classList.toggle('border-primary', isFlashcardShuffle);
            btn.setAttribute('aria-pressed', isFlashcardShuffle ? 'true' : 'false');
        }
        if (!flashcardList || flashcardList.length === 0) {
            flashcardList = expandFlashcardVocab(vocabData);
        }
        if (isFlashcardShuffle && flashcardList.length > 1) {
            for (let i = flashcardList.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [flashcardList[i], flashcardList[j]] = [flashcardList[j], flashcardList[i]];
            }
        } else if (!isFlashcardShuffle) {
            flashcardList = expandFlashcardVocab(vocabData);
        }
        currentFlashcardIdx = 0;
        document.getElementById('flashcard-inner').classList.remove('rotate-y-180');
        currentExamplePlayIdx = 0;
        removeExampleHighlights();
        if (typeof updateFlashcardUI === 'function') updateFlashcardUI();
    }

    function flashCardBorder(colorRgb) {
        const face = document.getElementById('fc-face-front');
        face.style.boxShadow = `inset 0 0 0 3px ${colorRgb}`;
        setTimeout(() => { face.style.boxShadow = ''; }, 200);
    }

    function submitSrsRating(rating, event) {
        if(event) event.stopPropagation();
        if(!currentUser) return;
        const flashColors = { 1: 'rgba(239,68,68,1)', 2: 'rgba(249,115,22,1)', 3: 'rgba(59,130,246,1)', 4: 'rgba(16,185,129,1)' };
        if (flashColors[rating]) flashCardBorder(flashColors[rating]);
        if (!flashcardList || flashcardList.length === 0) {
            flashcardList = expandFlashcardVocab(vocabData);
        }
        const currentVocab = flashcardList[currentFlashcardIdx];
        if (!currentVocab) return;
        const vId = currentVocab.original_vocab_id || currentVocab.vocab_id || currentVocab.id;

        // Chuyển sang từ tiếp theo NGAY LẬP TỨC, lưu kết quả chạy nền (optimistic UI).
        // Nếu update_srs thất bại (mạng chập chờn, mất session...), trước đây chỉ
        // console.error âm thầm -> người dùng tưởng đã lưu, hôm sau từ đó lại hiện lại
        // y nguyên trong FSRS dù đã bấm "nhớ" (báo lỗi người dùng: ôn xong 50 từ vẫn lặp
        // lại). Giờ tự retry 2 lần (lỗi mạng thường là thoáng qua), chỉ báo cho người
        // dùng biết khi đã thử lại mà vẫn không lưu được, để họ chủ động học lại từ đó.
        navFlashcard(1);
        srsSubmitWithRetry({ vocab_id: vId, dict_id: currentVocab.dict_id, rating: rating });
    }

    let srsSyncToastTimer = null;
    function srsShowSyncError(msg) {
        let el = document.getElementById('srs-sync-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'srs-sync-toast';
            el.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[999] bg-td-red text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 max-w-[92vw] text-center transition-opacity duration-300';
            document.body.appendChild(el);
        }
        el.innerHTML = `<i class="fa-solid fa-triangle-exclamation shrink-0"></i><span>${msg}</span>`;
        el.style.opacity = '1';
        clearTimeout(srsSyncToastTimer);
        srsSyncToastTimer = setTimeout(() => { el.style.opacity = '0'; }, 5000);
    }

    function srsSubmitWithRetry(payload, attempt) {
        attempt = attempt || 0;
        fetch('/api.php?action=update_srs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(result => {
            if (result && result.success) {
                if (typeof loadFcSrsPanel === 'function') loadFcSrsPanel();
                return;
            }
            if (result && result.code === 'NO_SESSION') {
                localStorage.removeItem('td_user');
                currentUser = null;
                
                return;
            }
            throw new Error((result && result.message) || 'update_srs failed');
        })
        .catch(() => {
            if (attempt < 2) {
                setTimeout(() => srsSubmitWithRetry(payload, attempt + 1), 1500 * (attempt + 1));
            } else {
                srsShowSyncError('Không lưu được tiến độ 1 từ vừa ôn — kiểm tra mạng, từ đó sẽ hiện lại để ôn lại.');
            }
        });
    }

    function handleFlashcardEnterAudio() {
        if (!flashcardList || flashcardList.length === 0) return;
        const isFlipped = document.getElementById('flashcard-inner').classList.contains('rotate-y-180');

        if (!isFlipped) {
            const btn = document.getElementById('fc-audio-btn');
            if (btn) {
                btn.classList.add('bg-primary', 'text-white', 'scale-110');
                setTimeout(() => btn.classList.remove('bg-primary', 'text-white', 'scale-110'), 200);
                playTTS(btn.getAttribute('data-text'));
            }
        } else {
            const examples = document.querySelectorAll('.fc-example-item');
            if (examples.length === 0) return;
            if (currentExamplePlayIdx >= examples.length) currentExamplePlayIdx = 0;
            removeExampleHighlights();
            const currentEx = examples[currentExamplePlayIdx];
            currentEx.classList.add('ring-2', 'ring-primary', 'bg-blue-50/50');
            const audioBtn = currentEx.querySelector('.fc-ex-audio-btn');
            if (audioBtn) {
                audioBtn.classList.add('text-primary', 'scale-110');
                setTimeout(() => audioBtn.classList.remove('text-primary', 'scale-110'), 200);
                playTTS(audioBtn.getAttribute('data-text'));
            }
            currentExamplePlayIdx++;
        }
    }

    // ===== Tự động phát âm =====
    let fcAutoPlay = localStorage.getItem('td_fc_autoplay') === '1';
    function applyFcAutoPlayUI() {
        const btn = document.getElementById('fc-autoplay-toggle');
        const icon = document.getElementById('fc-autoplay-icon');
        if (!btn || !icon) return;
        if (fcAutoPlay) {
            btn.classList.add('bg-primary', 'text-white'); btn.classList.remove('bg-slate-100', 'text-slate-500');
            icon.classList.add('fa-volume-high'); icon.classList.remove('fa-volume-xmark');
            btn.setAttribute('aria-pressed', 'true');
        } else {
            btn.classList.remove('bg-primary', 'text-white'); btn.classList.add('bg-slate-100', 'text-slate-500');
            icon.classList.add('fa-volume-xmark'); icon.classList.remove('fa-volume-high');
            btn.setAttribute('aria-pressed', 'false');
        }
    }
    function toggleFcAutoPlay(event) {
        if (event) event.stopPropagation();
        fcAutoPlay = !fcAutoPlay;
        localStorage.setItem('td_fc_autoplay', fcAutoPlay ? '1' : '0');
        applyFcAutoPlayUI();
        // Bật lên thì đọc luôn từ đang hiển thị
        if (fcAutoPlay) {
            const btn = document.getElementById('fc-audio-btn');
            if (btn && btn.getAttribute('data-text')) playTTS(btn.getAttribute('data-text'));
        }
    }
    applyFcAutoPlayUI();

    function flashcardSaveToggle(ev) {
        ev.stopPropagation();
        if (!flashcardList || flashcardList.length === 0) {
            flashcardList = expandFlashcardVocab(vocabData);
        }
        const v = flashcardList[currentFlashcardIdx];
        if (!v || !v.dict_id || typeof vnhOpenSaveModal !== 'function') return;
        const icons = document.querySelectorAll('.fc-save-btn i');
        vnhOpenSaveModal(v.dict_id, () => {
            icons.forEach(icon => { icon.classList.remove('fa-regular'); icon.classList.add('fa-solid'); });
            document.querySelectorAll('.fc-save-btn').forEach(b => b.classList.add('is-saved'));
        });
    }

    function updateFlashcardUI() {
        resetFlashcardScroll();
        if (!flashcardList || flashcardList.length === 0) {
            flashcardList = expandFlashcardVocab(vocabData);
        }
        if (typeof preloadAudio === 'function' && Array.isArray(flashcardList)) {
            const nextCards = flashcardList.slice(currentFlashcardIdx + 1, currentFlashcardIdx + 5);
            const preloadList = nextCards.map(c => ttsLocalPath(c.hanzi));
            // Đồng thời preload các câu ví dụ của thẻ hiện tại và thẻ kế tiếp để nghe tức thì
            const cardsToCheck = [flashcardList[currentFlashcardIdx], flashcardList[currentFlashcardIdx + 1]].filter(Boolean);
            cardsToCheck.forEach(card => {
                if (card && card.examples && card.examples.length > 0) {
                    card.examples.slice(0, 2).forEach(ex => {
                        const parsed = parseExamplePattern(getChar(ex.examples_hanzi));
                        if (parsed && parsed.sentence) preloadList.push(ttsLocalPath(parsed.sentence));
                    });
                }
            });
            preloadAudio(preloadList);
        }
        document.getElementById('fc-face-front').style.boxShadow = '';
        if(flashcardList.length === 0) return;
        const v = flashcardList[currentFlashcardIdx] || flashcardList[0];
        document.getElementById('fc-counter').innerText = `${currentFlashcardIdx + 1} / ${flashcardList.length}`;
        const displayVHanzi = getChar(v.hanzi);
        const ttsVHanzi = (displayVHanzi || '').split(/[/／]/)[0].trim();
        document.getElementById('fc-hanzi').innerText = displayVHanzi;
        document.getElementById('fc-audio-btn').setAttribute('data-text', encodeURIComponent(ttsVHanzi));
        let isSaved = false;
        try {
            const nbData = (typeof safeGet === 'function' && typeof STORAGE_KEYS !== 'undefined') ? safeGet(STORAGE_KEYS.NOTEBOOK, { words: [] }) : null;
            if (nbData && Array.isArray(nbData.words)) {
                isSaved = nbData.words.map(String).includes(String(v.dict_id || v.vocab_id));
            }
        } catch (e) {}
        document.querySelectorAll('.fc-save-btn i').forEach(icon => {
            icon.classList.toggle('fa-solid', !!isSaved);
            icon.classList.toggle('fa-regular', !isSaved);
        });
        document.querySelectorAll('.fc-save-btn').forEach(b => b.classList.toggle('is-saved', !!isSaved));
        // Tự động phát âm từ mới khi bật
        if (fcAutoPlay) playTTS(encodeURIComponent(ttsVHanzi));
        document.getElementById('fc-pinyin').innerText = v.pinyin;
        document.getElementById('fc-pos').innerText = v.part_of_speech || 'N/A';
        const tocflWrap = document.getElementById('fc-tocfl-wrap');
        if (v.tocfl_band) {
            document.getElementById('fc-tocfl').innerText = 'TOCFL ' + v.tocfl_band;
            tocflWrap.classList.remove('hidden');
        } else {
            tocflWrap.classList.add('hidden');
        }
        document.getElementById('fc-def').innerText = v.definition;
        let exHtml = '';
        if(v.examples && v.examples.length > 0){
            const maxPrimary = 2; // Giữ 1-2 ví dụ tiêu biểu nhất để phản xạ nhanh
            const primaryList = v.examples.slice(0, maxPrimary);
            const extraList = v.examples.slice(maxPrimary);

            function renderInteractiveFcSentence(sent) {
                if (!sent) return '';
                return sent.split('').map(ch => {
                    if (/[\u4e00-\u9fa5]/.test(ch)) {
                        return `<span class="char-hanzi hover:text-primary transition-colors cursor-pointer select-text">${ch}</span>`;
                    }
                    return `<span class="prose-punct select-text">${ch}</span>`;
                }).join('');
            }

            const buildExampleCard = (ex) => {
                const parsedEx = parseExamplePattern(getChar(ex.examples_hanzi));
                const interactiveSentence = renderInteractiveFcSentence(parsedEx.sentence);
                let uiHanzi = parsedEx.role ? `<span class="inline-block bg-primary/10 text-primary text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded-md mr-1 sm:mr-2 align-middle border border-primary/20 select-none">[${parsedEx.role}]</span>${interactiveSentence}` : interactiveSentence;
                const safeTextEx = parsedEx.sentence.replace(/"/g, '&quot;');
                return `
                <div class="fc-example-item border border-slate-200/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 relative bg-[#f8fbff] mb-2 sm:mb-2.5 last:mb-0 transition-all duration-300 select-text cursor-default" onclick="event.stopPropagation();" style="user-select: text; -webkit-user-select: text;">
                    <div class="flex justify-between items-start gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                        <div class="text-sm sm:text-base text-slate-800 leading-relaxed pr-2 font-bold font-tc tracking-wide flex-wrap flex-1 select-text">${uiHanzi}</div>
                        <div class="flex items-center gap-1.5 shrink-0" onclick="event.stopPropagation();">
                            <button type="button" class="fc-ex-copy-btn bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-primary active:scale-95 transition-all shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-sm flex items-center justify-center border-0 outline-none cursor-pointer" onclick="event.stopPropagation(); copyFcExample(this, '${safeTextEx}')" title="Sao chép câu ví dụ">
                                <i class="fa-regular fa-copy text-xs sm:text-sm pointer-events-none"></i>
                            </button>
                            <button type="button" class="fc-ex-audio-btn bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 active:bg-primary active:text-white transition-all shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-sm flex items-center justify-center border-0 outline-none cursor-pointer" data-text="${encodeURIComponent(safeTextEx)}" onpointerenter="if(typeof preloadAudio==='function')preloadAudio(ttsLocalPath(decodeURIComponent(this.getAttribute('data-text'))))" onclick="event.stopPropagation(); playTTS(this.getAttribute('data-text'), event)" title="Nghe ví dụ">
                                <i class="fa-solid fa-volume-high text-xs sm:text-sm pointer-events-none transition-transform"></i>
                            </button>
                        </div>
                    </div>
                    <div class="text-primary font-bold text-xs sm:text-sm mb-1 select-text" style="user-select: text; -webkit-user-select: text;">${ex.examples_pinyin}</div>
                    <div class="text-xs sm:text-sm text-slate-600 font-medium select-text" style="user-select: text; -webkit-user-select: text;">${ex.examples_translation}</div>
                </div>`;
            };

            primaryList.forEach(ex => { exHtml += buildExampleCard(ex); });

            if (extraList.length > 0) {
                exHtml += `
                <div class="mt-2" onclick="event.stopPropagation();">
                    <button type="button" onclick="event.stopPropagation(); toggleFcMoreExamples();" id="fc-more-ex-btn" class="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-primary flex items-center justify-center gap-1.5 transition-all outline-none">
                        <span>Xem thêm ${extraList.length} ví dụ khác</span>
                        <i id="fc-more-ex-icon" class="fa-solid fa-chevron-down text-[10px] transition-transform"></i>
                    </button>
                    <div id="fc-more-examples" class="hidden mt-2 space-y-2">
                        ${extraList.map(buildExampleCard).join('')}
                    </div>
                </div>`;
            }
        } else { exHtml = '<p class="text-xs sm:text-sm text-slate-400 italic bg-slate-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-100">Không có ví dụ.</p>'; }
        document.getElementById('fc-examples').innerHTML = exHtml;
        loadVocabContexts(v.original_vocab_id || v.vocab_id || v.id, v.hanzi);
        resetFlashcardScroll();
    }

    // Escape HTML tối thiểu (nội dung chèn dạng text, không cần escape dấu ngoặc kép)
    function ctxEscHtml(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Đóng/mở thêm ví dụ trên mặt sau Flashcard
    function toggleFcMoreExamples() {
        const box = document.getElementById('fc-more-examples');
        const icon = document.getElementById('fc-more-ex-icon');
        const btnText = document.querySelector('#fc-more-ex-btn span');
        if (!box) return;
        const isHidden = box.classList.contains('hidden');
        box.classList.toggle('hidden', !isHidden);
        if (icon) icon.classList.toggle('rotate-180', isHidden);
        if (btnText) {
            if (isHidden) {
                if (!btnText.dataset.origText) btnText.dataset.origText = btnText.textContent;
                btnText.textContent = 'Thu gọn ví dụ';
            } else {
                btnText.textContent = btnText.dataset.origText || 'Xem thêm ví dụ';
            }
        }
    }

    // Đóng/mở ngữ cảnh hội thoại trên mặt sau Flashcard
    function toggleFcContexts() {
        const box = document.getElementById('fc-contexts');
        const actionText = document.getElementById('fc-contexts-action-text');
        const chevron = document.getElementById('fc-contexts-chevron');
        if (!box) return;
        const isHidden = box.classList.contains('hidden');
        box.classList.toggle('hidden', !isHidden);
        if (actionText) actionText.innerText = isHidden ? 'Thu gọn' : 'Mở xem';
        if (chevron) chevron.classList.toggle('rotate-180', isHidden);
    }

    // Nạp & hiển thị "Từ này trong hội thoại" dạng Accordion (không làm tràn mặt thẻ)
    async function loadVocabContexts(vocabId, overrideHanzi) {
        const section = document.getElementById('fc-contexts-section');
        const box = document.getElementById('fc-contexts');
        const badgeText = document.getElementById('fc-contexts-badge-text');
        const actionText = document.getElementById('fc-contexts-action-text');
        const chevron = document.getElementById('fc-contexts-chevron');
        if (!section || !box) return;
        section.classList.add('hidden');
        box.classList.add('hidden');
        if (actionText) actionText.innerText = 'Mở xem';
        if (chevron) chevron.classList.remove('rotate-180');
        box.innerHTML = '';
        if (!vocabId) return;
        const reqId = ++loadVocabContexts._seq;
        try {
            const res = await fetch(`/api.php?action=get_vocab_contexts&vocab_id=${vocabId}`);
            const json = await res.json();
            if (reqId !== loadVocabContexts._seq) return;
            if (!json.success || !json.data || json.data.length === 0) return;
            if (badgeText) badgeText.innerText = `Ngữ cảnh hội thoại (${json.data.length} đoạn)`;
            let html = '';
            json.data.forEach(ctx => {
                const hz = getChar(overrideHanzi || ctx.hanzi || '');
                let linesHtml = '';
                (ctx.lines || []).forEach(l => {
                    const disp = ctxEscHtml(getChar(l.line || ''));
                    const marked = hz ? disp.split(ctxEscHtml(hz)).join(`<mark class="bg-amber-200/70 text-brandNavy rounded px-0.5">${ctxEscHtml(hz)}</mark>`) : disp;
                    linesHtml += `<div class="text-sm text-slate-700 font-medium font-tc leading-relaxed">${marked}</div>`;
                    if (l.vi) linesHtml += `<div class="text-xs text-slate-400 mb-1">${ctxEscHtml(l.vi)}</div>`;
                });
                const firstLine = (ctx.lines && ctx.lines[0]) ? ctx.lines[0].line : '';
                const canJump = ctx.book_id && ctx.lesson_id && typeof window.tdJumpToLesson === 'function';
                html += `<div class="border border-amber-100 bg-amber-50/40 rounded-xl p-3 ${canJump ? 'cursor-pointer hover:bg-amber-50 active:scale-[0.99] transition-all' : ''}"
                    ${canJump ? `onclick="window.tdJumpToLesson(${ctx.book_id}, ${ctx.lesson_id}, ${ctx.content_id}, ${JSON.stringify(firstLine)})"` : ''}>
                    <div class="flex items-center justify-between gap-2 mb-1.5">
                        <div class="text-[10px] font-bold text-amber-600 uppercase tracking-widest">${ctxEscHtml(ctx.title || 'Hội thoại')}</div>
                        ${canJump ? '<i class="fa-solid fa-arrow-up-right-from-square text-amber-400 text-[10px]"></i>' : ''}
                    </div>
                    ${linesHtml}
                </div>`;
            });
            box.innerHTML = html;
            section.classList.remove('hidden');
        } catch (e) { /* im lặng, không phá luồng flashcard */ }
    }
    loadVocabContexts._seq = 0;
