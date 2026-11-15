function initWriting() {
        if (!vocabData || vocabData.length === 0) {
            const les = document.getElementById('select-lesson');
            const lid = les ? les.value : null;
            if (lid) {
                loadVocabulariesAndContent(lid).then(() => {
                    currentWriteIdx = 0;
                    updateWritingUI();
                });
                return;
            }
        }
        currentWriteIdx = 0;
        updateWritingUI();
    }

    function navWriting(direction) {
        if(vocabData.length === 0) return;

        if (direction === 1 && currentWriteIdx === vocabData.length - 1) {
            showCompletionModal('listening', vocabData.length);
            currentWriteIdx = 0; 
            updateWritingUI();
            return;
        }

        currentWriteIdx = (currentWriteIdx + direction + vocabData.length) % vocabData.length;
        updateWritingUI();
    }

    function playWritingTTS(event) {
        if (event) {
            try { event.stopPropagation(); } catch (e) {}
        }
        const btn = document.getElementById('write-tts-btn') || (event ? (event.currentTarget || event.target?.closest?.('button')) : null);
        if (btn) {
            if (typeof wsFlashBtn === 'function') {
                wsFlashBtn(btn);
            } else {
                btn.classList.add('ws-btn-flash');
                setTimeout(() => btn.classList.remove('ws-btn-flash'), 260);
            }
        }
        if (!vocabData || vocabData.length === 0 || !vocabData[currentWriteIdx]) return;
        const v = vocabData[currentWriteIdx];
        const char = getChar(v.hanzi);
        if (char) {
            if (typeof playTTS === 'function') {
                playTTS(encodeURIComponent(char), event);
            }
        }
    }

    let typingHintTimer = null;
    let isTypingHintVisible = false;

    function showWritingHint() {
        if (!vocabData || vocabData.length === 0 || !vocabData[currentWriteIdx]) return;
        const feedback = document.getElementById('typing-feedback');
        if (!feedback) return;

        // Nếu gợi ý đang hiển thị, bấm lại (tái kích hoạt) sẽ ẩn gợi ý ngay lập tức
        if (isTypingHintVisible) {
            if (typingHintTimer) {
                clearTimeout(typingHintTimer);
                typingHintTimer = null;
            }
            feedback.classList.remove('opacity-100');
            feedback.classList.add('opacity-0');
            isTypingHintVisible = false;
            setTimeout(() => {
                if (!isTypingHintVisible && feedback.classList.contains('opacity-0')) {
                    feedback.innerHTML = '';
                }
            }, 250);
            return;
        }

        // Nếu chưa hiển thị, hiển thị và tự động ẩn sau 2s
        if (typingHintTimer) {
            clearTimeout(typingHintTimer);
            typingHintTimer = null;
        }

        const v = (vocabData && vocabData[currentWriteIdx]) ? vocabData[currentWriteIdx] : null;
        if (!v) return;
        const rawHanzi = v.hanzi || '';
        let targetVariant = rawHanzi.split(/[\/\uff0f]/)[0].trim();
        if (typeof charMode !== 'undefined' && charMode === 'simplified') {
            const parts = rawHanzi.split(/[\/\uff0f]/).map(s => s.trim()).filter(Boolean);
            if (parts.length > 1) {
                targetVariant = parts[1];
            } else if (typeof converterT2S === 'function') {
                targetVariant = converterT2S(parts[0] || '');
            }
        }
        const displayChar = (typeof getChar === 'function') ? getChar(targetVariant) : targetVariant;
        feedback.innerHTML = `<span class="text-xs sm:text-sm font-semibold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 inline-flex items-center gap-1.5 shadow-2xs transition-all"><i class="fa-solid fa-lightbulb text-amber-500"></i> Gợi ý: <strong class="text-base sm:text-lg text-primary font-tc mx-1">${displayChar}</strong> (hãy gõ theo Pinyin)</span>`;
        feedback.classList.remove('opacity-0', 'text-td-green', 'text-td-red');
        feedback.classList.add('opacity-100');
        isTypingHintVisible = true;

        typingHintTimer = setTimeout(() => {
            feedback.classList.remove('opacity-100');
            feedback.classList.add('opacity-0');
            isTypingHintVisible = false;
            setTimeout(() => {
                if (!isTypingHintVisible && feedback.classList.contains('opacity-0')) {
                    feedback.innerHTML = '';
                }
            }, 250);
        }, 2000);
    }

    function clearTypingInput() {
        const inp = document.getElementById('typing-input');
        if (inp) {
            inp.value = '';
            inp.focus();
            const clearBtn = document.getElementById('typing-clear-btn');
            if (clearBtn) clearBtn.classList.add('hidden');
        }
    }

    function togglePinyinVisibility(event) {
        if (event) {
            try { event.stopPropagation(); } catch (e) {}
        }
        const pinyinEl = document.getElementById('write-pinyin');
        const toggleBtn = document.getElementById('write-pinyin-toggle');
        const icon = toggleBtn ? toggleBtn.querySelector('i') : null;
        const hidden = pinyinEl.classList.toggle('pinyin-hidden');
        if (icon) {
            icon.classList.toggle('fa-eye', !hidden);
            icon.classList.toggle('fa-eye-slash', hidden);
            icon.classList.add('scale-125');
            setTimeout(() => icon.classList.remove('scale-125'), 200);
        }
        if (toggleBtn) toggleBtn.title = hidden ? 'Hiện pinyin (Alt+P)' : 'Ẩn pinyin (Alt+P)';
    }

    let tsmWriter = null;
    let tsmChars = [];
    let tsmCharIdx = 0;
    let tsmCurrentVocab = null;

    function openDictFromTyping() {
        let v = null;
        if (typeof vocabData !== 'undefined' && Array.isArray(vocabData) && vocabData.length > 0 && typeof currentWriteIdx !== 'undefined' && vocabData[currentWriteIdx]) {
            v = vocabData[currentWriteIdx];
        }
        if (!v) {
            const pyEl = document.getElementById('write-pinyin');
            const defEl = document.getElementById('write-def');
            if (pyEl && pyEl.dataset.hanzi) {
                v = {
                    hanzi: pyEl.dataset.hanzi,
                    pinyin: pyEl.innerText.trim(),
                    definition: defEl ? defEl.innerText.trim() : ''
                };
            }
        }
        if (!v) return;
        openTypingStrokeModal(v);
    }

    function openTypingStrokeModal(v) {
        if (!v) return;
        tsmCurrentVocab = v;
        const modal = document.getElementById('typing-stroke-modal');
        if (!modal) return;

        // Cập nhật thông tin Pinyin và nghĩa
        const pyEl = document.getElementById('tsm-word-pinyin');
        if (pyEl) pyEl.innerText = v.pinyin || '';
        const defEl = document.getElementById('tsm-word-meaning');
        if (defEl) defEl.innerText = v.definition || '';

        // Tách các chữ Hán thực sự từ từ vựng, tương thích chế độ Giản/Phồn thể theo setting hiện tại
        const rawHanzi = v.hanzi || '';
        let targetVariant = rawHanzi.split(/[\/\uff0f]/)[0].trim();
        if (typeof charMode !== 'undefined' && charMode === 'simplified') {
            const parts = rawHanzi.split(/[\/\uff0f]/).map(s => s.trim()).filter(Boolean);
            if (parts.length > 1) {
                targetVariant = parts[1];
            } else if (typeof converterT2S === 'function') {
                targetVariant = converterT2S(parts[0] || '');
            }
        }
        const converted = (typeof getChar === 'function') ? getChar(targetVariant) : targetVariant;
        const hanziList = [];
        for (const ch of converted) {
            if (/[\u4e00-\u9fa5]/.test(ch)) {
                hanziList.push(ch);
            }
        }
        tsmChars = hanziList.length > 0 ? hanziList : (converted ? Array.from(converted) : ['字']);
        tsmCharIdx = 0;

        // Render tab chọn chữ cho từ 2-4 ký tự mượt mà
        const tabsEl = document.getElementById('tsm-char-tabs');
        if (tabsEl) {
            if (tsmChars.length > 1) {
                tabsEl.innerHTML = tsmChars.map((ch, idx) => `
                    <button type="button" onclick="tsmSelectChar(${idx})" class="tsm-char-pill px-3.5 py-1.5 rounded-xl text-base font-bold font-tc transition-all active:scale-95 cursor-pointer ${idx === 0 ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'}">
                        ${ch}
                    </button>
                `).join('');
                tabsEl.classList.remove('hidden');
            } else {
                tabsEl.innerHTML = '';
                tabsEl.classList.add('hidden');
            }
        }

        // Mở modal trước, dùng double rAF để DOM reflow chuẩn kích thước thật của ô Mễ tự rồi mới nạp nét
        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                tsmLoadChar(tsmChars[0]);
            });
        });
    }

    function tsmSelectChar(idx) {
        if (idx < 0 || idx >= tsmChars.length) return;
        tsmCharIdx = idx;
        const pills = document.querySelectorAll('.tsm-char-pill');
        pills.forEach((p, i) => {
            if (i === idx) {
                p.className = 'tsm-char-pill px-3.5 py-1.5 rounded-xl text-base font-bold font-tc transition-all active:scale-95 cursor-pointer bg-primary text-white shadow-sm ring-2 ring-primary/30';
            } else {
                p.className = 'tsm-char-pill px-3.5 py-1.5 rounded-xl text-base font-bold font-tc transition-all active:scale-95 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900';
            }
        });
        tsmLoadChar(tsmChars[idx]);
    }

    function tsmLoadChar(char) {
        const target = document.getElementById('tsm-writer-target');
        if (!target) return;
        target.innerHTML = '';

        if (typeof HanziWriter === 'undefined') {
            target.innerHTML = `<span class="text-6xl font-bold text-slate-700 font-tc">${char}</span>`;
            return;
        }

        const box = document.getElementById('tsm-pad-box');
        let boxSize = 210;
        if (box && box.clientWidth > 0) {
            boxSize = Math.min(box.clientWidth, box.clientHeight || box.clientWidth);
        }
        const size = Math.max(180, Math.min(boxSize - 10, 240));

        try {
            if (tsmWriter) {
                try { tsmWriter.cancelQuiz(); } catch (e) {}
                tsmWriter = null;
            }

            const totEl = document.getElementById('tsm-stroke-total');
            if (totEl) totEl.innerText = '--';
            const curEl = document.getElementById('tsm-stroke-current');
            if (curEl) curEl.innerText = '0';

            let isDataLoaded = false;
            let writerInstance = null;
            writerInstance = HanziWriter.create(target, char, {
                width: size,
                height: size,
                padding: 12,
                showOutline: true,
                showCharacter: true,
                strokeAnimationSpeed: 1.2,
                strokeHighlightSpeed: 1.5,
                delayBetweenStrokes: 180,
                strokeColor: '#b91c1c',
                radicalColor: '#1d4ed8',
                outlineColor: '#94a3b8',
                drawingColor: '#0f172a',
                drawingWidth: Math.max(16, Math.round(size / 14)),
                highlightColor: '#f59e0b',
                onLoadCharDataSuccess: function (charData) {
                    isDataLoaded = true;
                    const totalStrokes = (charData && charData.strokes) ? charData.strokes.length : 0;
                    if (totEl) totEl.innerText = totalStrokes;
                    if (curEl) curEl.innerText = '0';

                    // Tự động phát hoạt ảnh nét bút an toàn
                    const activeWriter = tsmWriter || writerInstance;
                    if (activeWriter) {
                        try {
                            activeWriter.cancelQuiz();
                            activeWriter.hideCharacter();
                            activeWriter.animateCharacter();
                        } catch (err) {}
                    }
                },
                onLoadCharDataError: function () {
                    target.innerHTML = `<div class="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                        <span class="text-5xl font-bold text-slate-700 mb-1 font-tc">${char}</span>
                        <span class="text-[11px] text-slate-400">Không có dữ liệu nét chữ này</span>
                    </div>`;
                }
            });
            tsmWriter = writerInstance;

            // Nếu onLoadCharDataSuccess đã kích hoạt đồng bộ trước khi gán xong tsmWriter
            if (isDataLoaded && tsmWriter) {
                try {
                    tsmWriter.cancelQuiz();
                    tsmWriter.hideCharacter();
                    tsmWriter.animateCharacter();
                } catch (err) {}
            }
        } catch (e) {
            console.error('Lỗi khởi tạo HanziWriter modal:', e);
        }
    }

    function tsmReplayAnimation() {
        if (!tsmWriter) return;
        try {
            tsmWriter.cancelQuiz();
            tsmWriter.hideCharacter();
            const curEl = document.getElementById('tsm-stroke-current');
            if (curEl) curEl.innerText = '0';
            tsmWriter.animateCharacter();
        } catch (e) {
            console.error('Lỗi phát lại nét:', e);
        }
    }

    function tsmStartQuiz() {
        if (!tsmWriter) return;
        try {
            tsmWriter.cancelQuiz();
            tsmWriter.hideCharacter();
            const curEl = document.getElementById('tsm-stroke-current');
            if (curEl) curEl.innerText = '0';
            tsmWriter.quiz({
                onCorrectStroke: function (strokeData) {
                    const sNum = (strokeData.strokeNum || 0) + 1;
                    const cEl = document.getElementById('tsm-stroke-current');
                    if (cEl) cEl.innerText = sNum;
                },
                onComplete: function () {
                    const totEl = document.getElementById('tsm-stroke-total');
                    const cEl = document.getElementById('tsm-stroke-current');
                    if (cEl && totEl) cEl.innerText = totEl.innerText;
                }
            });
        } catch (e) {
            console.error('Lỗi tập viết nét:', e);
        }
    }

    function closeTypingStrokeModal() {
        const modal = document.getElementById('typing-stroke-modal');
        if (modal) modal.classList.add('hidden');
        if (tsmWriter) {
            try { tsmWriter.cancelQuiz(); } catch (e) {}
            tsmWriter = null;
        }
    }

    // Đảm bảo gắn sẵn ra window để các nút onclick inline luôn gọi được
    window.openDictFromTyping = openDictFromTyping;
    window.openTypingStrokeModal = openTypingStrokeModal;
    window.tsmSelectChar = tsmSelectChar;
    window.tsmLoadChar = tsmLoadChar;
    window.tsmReplayAnimation = tsmReplayAnimation;
    window.tsmStartQuiz = tsmStartQuiz;
    window.closeTypingStrokeModal = closeTypingStrokeModal;
    window.showWritingHint = showWritingHint;

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('typing-stroke-modal');
            if (modal && !modal.classList.contains('hidden')) {
                closeTypingStrokeModal();
            }
        }
    });

    function tsmOpenFullWriting() {
        const targetVocab = tsmCurrentVocab;
        closeTypingStrokeModal();
        if (typeof switchTab === 'function') {
            switchTab('writing');
            if (targetVocab && typeof wsVocabList !== 'undefined' && Array.isArray(wsVocabList)) {
                const fIdx = wsVocabList.findIndex(item => item.id === targetVocab.id || item.hanzi === targetVocab.hanzi);
                if (fIdx >= 0 && typeof wsLoadWord === 'function') {
                    setTimeout(() => wsLoadWord(fIdx, 0), 200);
                }
            }
        }
    }

    function updateWritingUI() {
        if(vocabData.length === 0) return;
        const v = vocabData[currentWriteIdx];
        document.getElementById('write-counter').innerText = `${currentWriteIdx + 1} / ${vocabData.length}`;
        const pyEl = document.getElementById('write-pinyin');
        if (pyEl) {
            pyEl.innerText = v.pinyin || '';
            pyEl.dataset.hanzi = v.hanzi || '';
        }
        document.getElementById('write-def').innerText = `${v.definition || ''}`;

        const targetLenEl = document.getElementById('write-target-len');
        if (targetLenEl && v.hanzi) {
            const firstTrad = v.hanzi.split('/')[0].trim();
            targetLenEl.innerText = getChar(firstTrad).length;
        }
        
        const input = document.getElementById('typing-input');
        input.value = '';
        input.classList.remove('border-td-green', 'bg-emerald-50', 'text-td-green', 'border-td-red', 'bg-red-50', 'text-td-red', 'ring-td-green/20', 'ring-td-red/20');
        input.classList.add('text-primary');

        const clearBtn = document.getElementById('typing-clear-btn');
        if (clearBtn) clearBtn.classList.add('hidden');
        
        const feedback = document.getElementById('typing-feedback');
        if (typingHintTimer) {
            clearTimeout(typingHintTimer);
            typingHintTimer = null;
        }
        isTypingHintVisible = false;
        feedback.classList.add('opacity-0');
        feedback.innerHTML = '';
        // Chỉ auto-focus trên Desktop/PC; không tự bật bàn phím ảo che màn hình trên Mobile
        if (window.innerWidth >= 768 && !('ontouchstart' in window && window.innerWidth < 1024)) {
            input.focus();
        }
    }

    // Tự động kiểm tra: khi bật, chấm ngay lúc gõ đủ số ký tự đáp án (khỏi bấm nút / Enter).
    function maybeAutoCheckWriting() {
        const auto = document.getElementById('write-auto-check');
        if (!auto || !auto.checked) return;
        if (vocabData.length === 0) return;
        const v = vocabData[currentWriteIdx];
        if (!v || !v.hanzi) return;
        // Report #302/307/306: field hanzi có thể chứa nhiều biến thể chấp nhận được
        // nối bằng "/" (VD "臺灣/台灣") — phải tách ra, không so cả chuỗi kèm dấu "/".
        const variants = v.hanzi.split('/').map(s => s.trim()).filter(Boolean);
        const val = document.getElementById('typing-input').value.trim();
        // Đủ độ dài của biến thể NGẮN NHẤT (phồn hoặc giản) thì chốt (chọn ngưỡng ngắn hơn để chấm sớm)
        const targetLen = variants.reduce((min, trad) => {
            const simp = converterT2S ? converterT2S(trad) : trad;
            return Math.min(min, trad.length || 99, (simp || trad).length || 99);
        }, 99);
        if (val.length > 0 && val.length >= targetLen) checkTyping();
    }

    document.addEventListener('DOMContentLoaded', () => {
        const inputTyping = document.getElementById('typing-input');
        if(inputTyping) {
            inputTyping.addEventListener('keydown', function(e) {
                if (e.isComposing || e.keyCode === 229) return;
                
                // Phím tắt phát âm: Alt+S hoặc Ctrl+Space
                if ((e.altKey && (e.key === 's' || e.key === 'S')) || (e.ctrlKey && e.code === 'Space')) {
                    e.preventDefault();
                    playWritingTTS(e);
                    return;
                }
                // Phím tắt gợi ý: Alt+H
                if (e.altKey && (e.key === 'h' || e.key === 'H')) {
                    e.preventDefault();
                    showWritingHint();
                    return;
                }
                // Phím tắt ẩn/hiện Pinyin: Alt+P
                if (e.altKey && (e.key === 'p' || e.key === 'P')) {
                    e.preventDefault();
                    togglePinyinVisibility();
                    return;
                }
                // Phím tắt chuyển câu: Mũi tên Phải / Enter (khi đã kiểm tra hoặc khi trống) / Alt+Phải / Ctrl+Phải / PageDown
                if (e.key === 'ArrowRight' && (e.altKey || e.ctrlKey || !this.value.trim() || this.selectionStart === this.value.length)) {
                    e.preventDefault();
                    navWriting(1);
                    return;
                }
                // Phím tắt lùi câu: Mũi tên Trái / Alt+Trái / Ctrl+Trái / PageUp
                if (e.key === 'ArrowLeft' && (e.altKey || e.ctrlKey || !this.value.trim() || this.selectionStart === 0)) {
                    e.preventDefault();
                    navWriting(-1);
                    return;
                }
                if (e.key === 'PageDown') {
                    e.preventDefault();
                    navWriting(1);
                    return;
                }
                if (e.key === 'PageUp') {
                    e.preventDefault();
                    navWriting(-1);
                    return;
                }

                if (e.key === 'Enter') {
                    e.preventDefault();
                    const feedback = document.getElementById('typing-feedback');
                    const hasResult = feedback && feedback.classList.contains('opacity-100');
                    if (hasResult) {
                        navWriting(1);
                    } else if (!inputTyping.value.trim()) {
                        navWriting(1);
                    } else {
                        checkTyping();
                    }
                }
            });
            // Gõ thường: bỏ qua khi đang soạn IME (pinyin chưa chốt) để không chấm nhầm.
            inputTyping.addEventListener('input', function(e) {
                const clearBtn = document.getElementById('typing-clear-btn');
                if (clearBtn) clearBtn.classList.toggle('hidden', !this.value.trim());
                if (e.isComposing) return;
                maybeAutoCheckWriting();
            });
            // Chốt xong 1 ký tự Hán qua IME -> kiểm tra lại độ dài.
            inputTyping.addEventListener('compositionend', function() {
                const clearBtn = document.getElementById('typing-clear-btn');
                if (clearBtn) clearBtn.classList.toggle('hidden', !this.value.trim());
                maybeAutoCheckWriting();
            });

            // Hotkey cấp trang (khi không focus vào ô input): Mũi tên Trái/Phải, Enter, Space, PageUp/PageDown
            document.addEventListener('keydown', function(e) {
                const view = document.getElementById('view-listening');
                if (!view || view.classList.contains('hidden')) return;
                if (document.activeElement && document.activeElement.id !== 'typing-input' && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
                if (e.isComposing || e.keyCode === 229) return;

                if (document.activeElement?.id !== 'typing-input') {
                    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navWriting(1);
                    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                        e.preventDefault();
                        navWriting(-1);
                    }
                }
            });
        }
    });

    let typingTimeout = null;
    function checkTyping() {
        if(vocabData.length === 0) return;
        clearTimeout(typingTimeout);
        if (typingHintTimer) {
            clearTimeout(typingHintTimer);
            typingHintTimer = null;
        }
        isTypingHintVisible = false; 
        
        const input = document.getElementById('typing-input');
        const feedback = document.getElementById('typing-feedback');
        const value = input.value.trim();
        
        const currentVocab = vocabData[currentWriteIdx];
        // Report #302/307/306: hanzi có thể chứa nhiều biến thể chấp nhận được, nối bằng "/"
        // (VD "臺灣/台灣", "姐姐/姊姊"). Trước đây so sánh nguyên chuỗi kể cả dấu "/" nên
        // gõ đúng bất kỳ biến thể nào cũng luôn báo sai. Tách ra và chấp nhận mọi biến thể.
        const hanziVariants = currentVocab.hanzi.split('/').map(s => s.trim()).filter(Boolean);
        const correctHanziTrad = hanziVariants[0]; // biến thể chính, dùng để hiển thị đáp án/phát âm
        const correctHanziSimp = converterT2S ? converterT2S(correctHanziTrad) : correctHanziTrad;
        const vId = currentVocab.vocab_id || currentVocab.id; // Lấy ID an toàn

        feedback.classList.remove('opacity-0', 'text-td-green', 'text-td-red');
        feedback.classList.add('opacity-100');
        const autoNextCheckbox = document.getElementById('write-auto-next');

        // Chuẩn hoá Unicode NFC trước khi so khớp (report #140 "đánh đúng nhưng báo sai"):
        // một số bàn phím/IME (đặc biệt trên di động) gõ ra dạng tổ hợp NFD hoặc biến thể
        // chữ Hán khác codepoint nhưng hiển thị giống hệt (VD 內 U+5167 vs 内 U+5185) —
        // so sánh chuỗi thô sẽ luôn sai dù mắt nhìn thấy đúng, không phải lỗi phông chữ.
        const valueNorm = value.normalize('NFC');
        const acceptedNorm = hanziVariants.flatMap(trad => {
            const simp = converterT2S ? converterT2S(trad) : trad;
            return [trad.normalize('NFC'), simp.normalize('NFC')];
        });
        const isCorrect = acceptedNorm.includes(valueNorm);

        // Cập nhật SRS: Đúng = Nhớ (3) -> 1 ngày | Sai = Quên (1) -> 10 phút
        if (currentUser && value !== '') {
            const rating = isCorrect ? 3 : 1;
            fetch('/api.php?action=update_srs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    vocab_id: vId,
                    rating: rating
                })
            }).catch(e=>console.error(e));
        }

        if (isCorrect) {
            let successHtml = '<span class="flex items-center gap-1.5 sm:gap-2"><i class="fa-solid fa-circle-check"></i> Chính xác!</span>';
            if (value === correctHanziSimp && correctHanziSimp !== correctHanziTrad) successHtml += `<span class="text-[10px] sm:text-xs text-slate-500 font-medium block mt-1.5 bg-white px-2 py-1 sm:px-3 sm:py-1 rounded-full border border-slate-200">(Phồn thể: <strong class="text-primary text-xs sm:text-sm">${correctHanziTrad}</strong>)</span>`;
            if (value === correctHanziTrad && correctHanziSimp !== correctHanziTrad && charMode === 'simplified') successHtml += `<span class="text-[10px] sm:text-xs text-slate-500 font-medium block mt-1.5 bg-white px-2 py-1 sm:px-3 sm:py-1 rounded-full border border-slate-200">(Giản thể: <strong class="text-primary text-xs sm:text-sm">${correctHanziSimp}</strong>)</span>`;
            
            feedback.innerHTML = successHtml;
            feedback.classList.add('text-td-green');
            input.classList.remove('text-primary', 'border-td-red', 'bg-red-50', 'text-td-red', 'ring-td-red/20');
            input.classList.add('border-td-green', 'bg-emerald-50', 'text-td-green', 'ring-2', 'sm:ring-4', 'ring-td-green/20');
            
            playWritingTTS(); 
            if (autoNextCheckbox && autoNextCheckbox.checked) typingTimeout = setTimeout(() => navWriting(1), 800);
        } else {
            feedback.innerHTML = value === '' 
                ? '<span class="flex items-center gap-1.5 sm:gap-2"><i class="fa-solid fa-circle-exclamation"></i> Vui lòng nhập từ vựng!</span>' 
                : `<span class="flex items-center justify-center gap-1.5 sm:gap-2 mb-1"><i class="fa-solid fa-circle-xmark"></i> Sai rồi!</span><span class="text-xs sm:text-sm font-medium text-slate-600 bg-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-slate-200 inline-block shadow-sm">Đáp án: <strong class="text-lg sm:text-2xl mx-1 font-tc text-td-red">${getChar(correctHanziTrad)}</strong></span>`;
            feedback.classList.add('text-td-red');
            input.classList.remove('text-primary', 'border-td-green', 'bg-emerald-50', 'text-td-green', 'ring-td-green/20');
            input.classList.add('border-td-red', 'bg-red-50', 'text-td-red', 'ring-2', 'sm:ring-4', 'ring-td-red/20');
            
            if(value !== '') input.value = ''; 
            // Giữ nguyên câu khi làm sai để người học kịp nhìn đáp án, ghi nhớ mặt chữ và chủ động bấm tiếp
        }
    }
