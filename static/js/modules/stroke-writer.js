// ==========================================
                // MODULE: LUYỆN VIẾT CHỮ HÁN (STROKE WRITING STUDIO)
                // ==========================================
                let wsVocabList = [];
                let wsWordIndex = 0;
                let wsCharIndex = 0;
                let wsWriter = null;
                let wsAutoCheck = true;
                let wsAutoNext = true;
                let wsAutoSpeak = false;
                let wsOutline = true;
                let wsNextTimer = null;
                let wsCurrentStrokesTotal = 0;
                let wsCurrentChars = [];

                function wsExtractHanzi(str) {
                    if (!str) return [];
                    const matches = str.match(/[\u3400-\u9FBF\uF900-\uFAFF]/g);
                    return (matches && matches.length > 0) ? matches : str.trim().split('');
                }

                function initWritingStudio() {
                    // Read preferences
                    wsAutoCheck = localStorage.getItem('ws_autocheck') !== 'false';
                    wsAutoNext = localStorage.getItem('ws_autonext') !== 'false';
                    wsAutoSpeak = localStorage.getItem('ws_autospeak') === 'true';
                    wsOutline = localStorage.getItem('ws_outline') !== 'false';

                    wsUpdateToggleUI();

                    // Check vocabData
                    if (!vocabData || vocabData.length === 0) {
                        const les = document.getElementById('select-lesson');
                        const lid = les ? les.value : null;
                        if (lid && typeof loadVocabulariesAndContent === 'function') {
                            loadVocabulariesAndContent(lid).then(() => {
                                wsVocabList = Array.isArray(vocabData) ? vocabData : [];
                                wsRenderStudio();
                            }).catch(err => {
                                console.error('Lỗi nạp từ vựng cho Luyện viết:', err);
                            });
                            return;
                        }
                    }

                    wsVocabList = Array.isArray(vocabData) ? vocabData : [];
                    wsRenderStudio();
                }

                function cleanupWritingStudio() {
                    if (wsNextTimer) {
                        clearTimeout(wsNextTimer);
                        wsNextTimer = null;
                    }
                    if (wsWriter) {
                        try { wsWriter.cancelQuiz(); } catch (e) {}
                        wsWriter = null;
                    }
                    const target = document.getElementById('ws-writer-target');
                    if (target) target.innerHTML = '';
                }

                function wsUpdateToggleUI() {
                    // Auto-Check toggle
                    const chkCheck = document.getElementById('ws-auto-check');
                    if (chkCheck) chkCheck.checked = !!wsAutoCheck;

                    // Auto-Next toggle
                    const chkNext = document.getElementById('ws-auto-next');
                    if (chkNext) chkNext.checked = !!wsAutoNext;

                    // Outline button (Nét mờ - kích thước chuẩn có chữ)
                    const btnOutline = document.getElementById('ws-btn-outline');
                    if (btnOutline) {
                        if (wsOutline) {
                            btnOutline.className = 'h-9 sm:h-10 flex items-center justify-center gap-1.5 px-3 sm:px-3.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-primary transition-all active:scale-95 shadow-2xs cursor-pointer shrink-0';
                            btnOutline.innerHTML = '<i id="ws-outline-icon" class="fa-solid fa-eye text-primary text-xs sm:text-sm"></i><span>Nét mờ</span>';
                            btnOutline.title = 'Ẩn nét mờ';
                        } else {
                            btnOutline.className = 'h-9 sm:h-10 flex items-center justify-center gap-1.5 px-3 sm:px-3.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-400 transition-all active:scale-95 shadow-2xs cursor-pointer shrink-0';
                            btnOutline.innerHTML = '<i id="ws-outline-icon" class="fa-solid fa-eye-slash text-xs sm:text-sm"></i><span>Nét mờ</span>';
                            btnOutline.title = 'Hiện nét mờ';
                        }
                    }
                }

                function wsToggleAutoCheck(e) {
                    if (e && e.target && typeof e.target.checked === 'boolean') {
                        wsAutoCheck = e.target.checked;
                    } else {
                        wsAutoCheck = !wsAutoCheck;
                    }
                    localStorage.setItem('ws_autocheck', wsAutoCheck ? 'true' : 'false');
                    wsUpdateToggleUI();
                    if (wsAutoCheck) {
                        wsStartQuiz();
                    } else if (wsWriter) {
                        try {
                            wsWriter.cancelQuiz();
                            wsWriter.showCharacter();
                        } catch (e) {}
                    }
                }

                function wsToggleAutoNext(e) {
                    if (e && e.target && typeof e.target.checked === 'boolean') {
                        wsAutoNext = e.target.checked;
                    } else {
                        wsAutoNext = !wsAutoNext;
                    }
                    localStorage.setItem('ws_autonext', wsAutoNext ? 'true' : 'false');
                    wsUpdateToggleUI();
                }

                function wsToggleAutoSpeak() {
                    wsAutoSpeak = !wsAutoSpeak;
                    localStorage.setItem('ws_autospeak', wsAutoSpeak);
                    wsUpdateToggleUI();
                }

                function wsToggleOutline() {
                    wsOutline = !wsOutline;
                    localStorage.setItem('ws_outline', wsOutline);
                    wsUpdateToggleUI();
                    if (wsWriter) {
                        try {
                            if (wsOutline) wsWriter.showOutline();
                            else wsWriter.hideOutline();
                        } catch (e) {}
                    }
                }

                function wsRenderStudio() {
                    if (!wsVocabList || wsVocabList.length === 0) {
                        const cnt = document.getElementById('ws-counter');
                        if (cnt) cnt.innerText = '0 / 0';
                        const lcnt = document.getElementById('ws-list-count');
                        if (lcnt) lcnt.innerText = '0 từ';
                        const wp = document.getElementById('ws-word-pinyin');
                        if (wp) wp.innerText = 'Chưa có từ';
                        const wm = document.getElementById('ws-word-meaning');
                        if (wm) wm.innerText = 'Vui lòng chọn giáo trình và bài học ở thanh menu trên';
                        const ch = document.getElementById('ws-word-chips-container');
                        if (ch) ch.innerHTML = '<div class="text-xs text-slate-400 italic py-2">Không có từ vựng trong bài này</div>';
                        const target = document.getElementById('ws-writer-target');
                        if (target) target.innerHTML = '';
                        return;
                    }

                    if (wsWordIndex >= wsVocabList.length) wsWordIndex = 0;
                    if (wsWordIndex < 0) wsWordIndex = 0;

                    const lcnt = document.getElementById('ws-list-count');
                    if (lcnt) lcnt.innerText = wsVocabList.length + ' từ';

                    // Render chips
                    const chipsContainer = document.getElementById('ws-word-chips-container');
                    if (chipsContainer) {
                        let html = '';
                        wsVocabList.forEach((item, idx) => {
                            const isAct = idx === wsWordIndex;
                            html += `<button type="button" onclick="wsLoadWord(${idx}, 0)" id="ws-chip-${idx}" class="shrink-0 flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${isAct ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs' : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700'}">
                                <span class="text-base sm:text-lg font-bold dict-hanzi-big leading-tight">${item.hanzi || ''}</span>
                                <span class="text-[10px] sm:text-[11px] font-mono text-slate-400 leading-tight">${item.pinyin || ''}</span>
                            </button>`;
                        });
                        chipsContainer.innerHTML = html;
                    }

                    wsLoadWord(wsWordIndex, 0);
                }

                function wsLoadWord(wordIdx, charIdx = 0) {
                    if (wsNextTimer) {
                        clearTimeout(wsNextTimer);
                        wsNextTimer = null;
                    }

                    if (!wsVocabList || wsVocabList.length === 0) return;
                    if (wordIdx < 0) wordIdx = 0;
                    if (wordIdx >= wsVocabList.length) wordIdx = wsVocabList.length - 1;

                    wsWordIndex = wordIdx;
                    const item = wsVocabList[wsWordIndex];
                    if (!item) return;

                    // Tự động cuộn vừa đủ che đi thanh Tự kiểm tra, đưa card luyện viết lên sát đỉnh tầm nhìn
                    const wsCardEl = document.getElementById('ws-card');
                    const mainScrollEl = document.getElementById('mainContent');
                    if (wsCardEl) {
                        if (mainScrollEl) {
                            const cardRect = wsCardEl.getBoundingClientRect();
                            const mainRect = mainScrollEl.getBoundingClientRect();
                            const targetY = mainScrollEl.scrollTop + (cardRect.top - mainRect.top) - 8;
                            mainScrollEl.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
                        } else {
                            const cardRect = wsCardEl.getBoundingClientRect();
                            const header = document.getElementById('main-app-header');
                            const hHeight = header ? header.offsetHeight : 0;
                            const targetY = window.scrollY + cardRect.top - hHeight - 8;
                            window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
                        }
                    }

                    // Update counter
                    const cnt = document.getElementById('ws-counter');
                    if (cnt) cnt.innerText = `${wsWordIndex + 1} / ${wsVocabList.length}`;

                    // Update active chip in carousel
                    const chipsContainer = document.getElementById('ws-word-chips-container');
                    if (chipsContainer) {
                        Array.from(chipsContainer.children).forEach((chip, i) => {
                            if (i === wsWordIndex) {
                                chip.className = 'shrink-0 flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border transition-all cursor-pointer bg-primary/10 border-primary text-primary font-bold shadow-2xs';
                                // Chỉ cuộn ngang thanh danh sách chip, không dùng scrollIntoView gây cuộn trang làm che nội dung
                                const cLeft = chip.offsetLeft;
                                const cWidth = chip.offsetWidth;
                                const contWidth = chipsContainer.clientWidth;
                                chipsContainer.scrollTo({
                                    left: cLeft - (contWidth / 2) + (cWidth / 2),
                                    behavior: 'smooth'
                                });
                            } else {
                                chip.className = 'shrink-0 flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700';
                            }
                        });
                    }

                    // Pinyin, Han-Viet, Meaning
                    const wp = document.getElementById('ws-word-pinyin');
                    if (wp) wp.innerText = item.pinyin || '';
                    const hvEl = document.getElementById('ws-word-hanviet');
                    if (hvEl) {
                        if (item.han_viet) {
                            hvEl.innerText = item.han_viet;
                            hvEl.classList.remove('hidden');
                        } else {
                            hvEl.classList.add('hidden');
                        }
                    }
                    const wm = document.getElementById('ws-word-meaning');
                    if (wm) wm.innerText = item.definition || item.first_meaning_vi || '';

                    // Extract characters
                    wsCurrentChars = wsExtractHanzi(item.hanzi);
                    if (wsCurrentChars.length === 0) wsCurrentChars = ['字'];

                    if (charIdx < 0) charIdx = 0;
                    if (charIdx >= wsCurrentChars.length) charIdx = wsCurrentChars.length - 1;
                    wsCharIndex = charIdx;

                    // Render Character Tabs / Pills (luôn hiển thị kể cả từ 1 chữ để cố định chiều cao, tránh thụt thò layout)
                    const charTabs = document.getElementById('ws-char-tabs');
                    if (charTabs) {
                        if (wsCurrentChars.length > 0) {
                            let tabsHtml = '';
                            wsCurrentChars.forEach((c, ci) => {
                                const isActChar = ci === wsCharIndex;
                                tabsHtml += `<button type="button" onclick="wsSelectChar(${ci})" class="ws-char-btn px-4 py-1.5 rounded-xl text-base sm:text-lg font-bold transition-all cursor-pointer active:scale-95 ${isActChar ? 'active bg-primary text-white shadow-sm ring-2 ring-primary/20' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60'}" style="${isActChar ? 'background-color:var(--primary,#027AB3)!important;color:#ffffff!important;' : 'color:#1e293b!important;'}">
                                    <span style="${isActChar ? 'color:#ffffff!important;' : 'color:#1e293b!important;'}">${c}</span>
                                </button>`;
                            });
                            charTabs.innerHTML = tabsHtml;
                            charTabs.classList.remove('hidden');
                        } else {
                            charTabs.innerHTML = '';
                            charTabs.classList.add('hidden');
                        }
                    }

                    // Auto speak if enabled
                    if (wsAutoSpeak) {
                        wsSpeakCurrentWord();
                    }

                    // Render pad
                    wsRenderPad(wsCurrentChars[wsCharIndex]);
                }

                function wsSelectChar(ci) {
                    if (ci < 0 || ci >= wsCurrentChars.length) return;
                    wsCharIndex = ci;

                    // Update pills
                    const charTabs = document.getElementById('ws-char-tabs');
                    if (charTabs) {
                        Array.from(charTabs.children).forEach((btn, idx) => {
                            const isAct = idx === wsCharIndex;
                            if (isAct) {
                                btn.className = 'ws-char-btn active px-4 py-1.5 rounded-xl text-base sm:text-lg font-bold transition-all cursor-pointer bg-primary text-white shadow-sm ring-2 ring-primary/20';
                                btn.setAttribute('style', 'background-color:var(--primary,#027AB3)!important;color:#ffffff!important;');
                                const s = btn.querySelector('span');
                                if (s) s.setAttribute('style', 'color:#ffffff!important;');
                            } else {
                                btn.className = 'ws-char-btn px-4 py-1.5 rounded-xl text-base sm:text-lg font-bold transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60';
                                btn.setAttribute('style', 'color:#1e293b!important;');
                                const s = btn.querySelector('span');
                                if (s) s.setAttribute('style', 'color:#1e293b!important;');
                            }
                        });
                    }

                    wsRenderPad(wsCurrentChars[wsCharIndex]);
                }

                function wsRenderPad(char) {
                    if (wsNextTimer) {
                        clearTimeout(wsNextTimer);
                        wsNextTimer = null;
                    }

                    // Update position badge
                    const posBadge = document.getElementById('ws-char-pos-badge');
                    if (posBadge) {
                        posBadge.innerText = `Chữ ${wsCharIndex + 1}/${wsCurrentChars.length}`;
                    }

                    // Reset celebration badge
                    const celBadge = document.getElementById('ws-celebration-badge');
                    if (celBadge) {
                        celBadge.classList.add('hidden', 'opacity-0');
                    }

                    const target = document.getElementById('ws-writer-target');
                    const loading = document.getElementById('ws-loading-overlay');
                    if (!target) return;

                    if (loading) loading.classList.remove('hidden');

                    // Clean previous writer
                    if (wsWriter) {
                        try { wsWriter.cancelQuiz(); } catch (e) {}
                        wsWriter = null;
                    }
                    target.innerHTML = '';

                    const padBox = document.getElementById('ws-pad-box');
                    const boxWidth = padBox ? padBox.clientWidth : 270;
                    const size = Math.min(Math.max(boxWidth - 10, 240), 310);

                    try {
                        wsWriter = HanziWriter.create(target, char, {
                            width: size,
                            height: size,
                            padding: 14,
                            showOutline: wsOutline,
                            showCharacter: !wsAutoCheck,
                            strokeAnimationSpeed: 1.2,
                            strokeHighlightSpeed: 1.5,
                            delayBetweenStrokes: 180,
                            strokeColor: '#b91c1c',
                            radicalColor: '#1d4ed8',
                            outlineColor: '#e2e8f0',
                            drawingColor: '#0f172a',
                            drawingWidth: Math.max(18, Math.round(size / 14)),
                            highlightColor: '#f59e0b',
                            highlightCompleteColor: '#10b981',
                            leniency: 1.3,
                            showHintAfterMisses: 2,
                            onLoadCharDataSuccess: function (charData) {
                                if (loading) loading.classList.add('hidden');
                                wsCurrentStrokesTotal = (charData && charData.strokes) ? charData.strokes.length : 0;
                                const totEl = document.getElementById('ws-stroke-total');
                                if (totEl) totEl.innerText = wsCurrentStrokesTotal;
                                const curEl = document.getElementById('ws-stroke-current');
                                if (curEl) curEl.innerText = '0';

                                if (wsAutoCheck) {
                                    wsStartQuiz();
                                }
                            },
                            onLoadCharDataError: function () {
                                if (loading) loading.classList.add('hidden');
                                target.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-slate-400 p-4 text-center">
                                    <span class="text-6xl font-bold dict-hanzi-big text-slate-700 mb-2">${char}</span>
                                    <span class="text-xs text-slate-400">Không có dữ liệu nét chữ này</span>
                                </div>`;
                            }
                        });
                    } catch (err) {
                        if (loading) loading.classList.add('hidden');
                        console.error('Lỗi khởi tạo HanziWriter:', err);
                    }
                }

                function wsStartQuiz() {
                    if (!wsWriter) return;
                    try {
                        wsWriter.cancelQuiz();
                        wsWriter.hideCharacter();
                        const curEl = document.getElementById('ws-stroke-current');
                        if (curEl) curEl.innerText = '0';

                        wsWriter.quiz({
                            onCorrectStroke: function (strokeData) {
                                const sNum = (strokeData.strokeNum || 0) + 1;
                                const cEl = document.getElementById('ws-stroke-current');
                                if (cEl) cEl.innerText = sNum;
                            },
                            onMistake: function () {
                                if (navigator.vibrate) {
                                    try { navigator.vibrate(40); } catch (e) {}
                                }
                            },
                            onComplete: function () {
                                const cEl = document.getElementById('ws-stroke-current');
                                if (cEl) cEl.innerText = wsCurrentStrokesTotal;
                                wsHandleComplete();
                            }
                        });
                    } catch (e) {
                        console.error('Lỗi bắt đầu quiz nét:', e);
                    }
                }

                function wsHandleComplete() {
                    const celBadge = document.getElementById('ws-celebration-badge');
                    const celSub = document.getElementById('ws-celebration-sub');

                    const hasNextCharInWord = wsCharIndex < wsCurrentChars.length - 1;
                    const hasNextWord = wsWordIndex < wsVocabList.length - 1;

                    if (celBadge) {
                        if (celSub) {
                            if (hasNextCharInWord) {
                                celSub.innerText = 'Chuẩn bị viết chữ tiếp theo...';
                            } else if (hasNextWord) {
                                celSub.innerText = 'Chuyển sang từ kế tiếp...';
                            } else {
                                celSub.innerText = 'Đã hoàn thành toàn bộ bài học! 🎉';
                            }
                        }
                        celBadge.classList.remove('hidden');
                        requestAnimationFrame(() => {
                            celBadge.classList.remove('opacity-0');
                        });
                    }

                    if (wsAutoNext) {
                        wsNextTimer = setTimeout(() => {
                            if (celBadge) {
                                celBadge.classList.add('opacity-0');
                                setTimeout(() => celBadge.classList.add('hidden'), 250);
                            }

                            if (hasNextCharInWord) {
                                wsSelectChar(wsCharIndex + 1);
                            } else if (hasNextWord) {
                                wsLoadWord(wsWordIndex + 1, 0);
                            } else {
                                wsLoadWord(0, 0);
                            }
                        }, hasNextCharInWord ? 850 : 1200);
                    }
                }

                function wsAnimate() {
                    if (!wsWriter) return;
                    try {
                        wsWriter.cancelQuiz();
                        wsWriter.animateCharacter({
                            onComplete: function () {
                                if (wsAutoCheck) {
                                    setTimeout(wsStartQuiz, 400);
                                }
                            }
                        });
                    } catch (e) {}
                }

                function wsShowHint() {
                    if (!wsWriter) return;
                    try {
                        // Nếu chưa ở chế độ quiz/tập viết, tự động kích hoạt chế độ tập viết
                        if (!wsWriter._quiz || !wsWriter._quiz._isActive) {
                            wsStartQuiz();
                        }
                        let strokeIdx = 0;
                        if (wsWriter._quiz && typeof wsWriter._quiz._currentStrokeIndex === 'number') {
                            strokeIdx = wsWriter._quiz._currentStrokeIndex;
                        } else {
                            const curEl = document.getElementById('ws-stroke-current');
                            strokeIdx = curEl ? parseInt(curEl.innerText || '0', 10) : 0;
                        }
                        if (strokeIdx < wsCurrentStrokesTotal && typeof wsWriter.highlightStroke === 'function') {
                            wsWriter.highlightStroke(strokeIdx);
                        }
                    } catch (e) {
                        console.warn('Lỗi highlightStroke gợi ý:', e);
                    }
                }

                function wsFlashBtn(btn) {
                    if (!btn) return;
                    btn.classList.add('ws-btn-flash');
                    setTimeout(() => {
                        btn.classList.remove('ws-btn-flash');
                    }, 260);
                }

                function wsResetCurrentChar(event) {
                    const btn = event ? (event.currentTarget || event.target?.closest?.('button')) : document.getElementById('ws-btn-reset');
                    if (btn) wsFlashBtn(btn);
                    if (wsCurrentChars && wsCurrentChars[wsCharIndex]) {
                        wsRenderPad(wsCurrentChars[wsCharIndex]);
                    }
                }

                function wsPrevWord() {
                    if (wsWordIndex > 0) {
                        wsLoadWord(wsWordIndex - 1, 0);
                    } else if (wsVocabList.length > 0) {
                        wsLoadWord(wsVocabList.length - 1, 0);
                    }
                }

                function wsNextWord() {
                    if (wsWordIndex < wsVocabList.length - 1) {
                        wsLoadWord(wsWordIndex + 1, 0);
                    } else if (wsVocabList.length > 0) {
                        wsLoadWord(0, 0);
                    }
                }

                function wsSpeakCurrentWord(event) {
                    if (event) {
                        try { event.stopPropagation(); } catch (e) {}
                    }
                    const btn = document.getElementById('ws-word-audio-btn');
                    if (btn) wsFlashBtn(btn);
                    if (wsVocabList && wsVocabList[wsWordIndex]) {
                        const hanzi = wsVocabList[wsWordIndex].hanzi;
                        if (typeof playTTS === 'function' && hanzi) {
                            playTTS(hanzi, event);
                        }
                    }
                }

                // Hotkey navigation: Mũi tên trái / phải để chuyển từ
                if (!window._wsHotkeyBound) {
                    window._wsHotkeyBound = true;
                    document.addEventListener('keydown', function (e) {
                        const view = document.getElementById('view-writing');
                        if (!view || view.classList.contains('hidden')) return;
                        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
                        if (e.key === 'ArrowLeft') {
                            e.preventDefault();
                            wsPrevWord();
                        } else if (e.key === 'ArrowRight') {
                            e.preventDefault();
                            wsNextWord();
                        }
                    });
                }
