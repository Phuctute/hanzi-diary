window.addEventListener('beforeunload', function (e) {
        if (typeof isExamRunning !== 'undefined' && isExamRunning && !isReviewMode) {
            e.preventDefault(); e.returnValue = 'Bạn đang làm bài thi. Rời khỏi trang sẽ làm mất kết quả chưa lưu. Bạn có chắc chắn muốn thoát?'; return e.returnValue;
        }
    });

    // Lưu kết quả thi ĐÁNG TIN CẬY: kiểm tra phản hồi server, thử lại, và báo cho người dùng nếu thất bại.
    // Trước đây là fire-and-forget nên khi session PHP hết hạn -> lưu thất bại trong im lặng, mất bài thi.
    if (typeof window.saveExamResultReliable === 'undefined') {
        window.saveExamResultReliable = function(payload, onDone, attempt) {
            try {
                let lh = JSON.parse(localStorage.getItem('td_local_exam_history') || '[]');
                lh.unshift({
                    id: Date.now(),
                    exam_id: payload.exam_id,
                    score: payload.score,
                    listening_score: payload.listening_score,
                    reading_score: payload.reading_score,
                    details: payload.details,
                    created_at: new Date().toLocaleString('vi-VN')
                });
                localStorage.setItem('td_local_exam_history', JSON.stringify(lh.slice(0, 50)));
            } catch(e) {}
            attempt = attempt || 1;
            fetch('/api.php?action=save_exam_result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json().catch(() => ({ success: false })))
            .then(res => {
                if (res && res.success) {
                    if (typeof onDone === 'function') onDone();
                    return;
                }
                // Server từ chối (thường do session PHP đã hết hạn -> uid=0)
                if (attempt < 2) {
                    // Thử xác thực lại session rồi lưu lại 1 lần
                    fetch('/api.php?action=check_session')
                        .then(r => r.json()).catch(() => ({ success: false }))
                        .then(() => window.saveExamResultReliable(payload, onDone, attempt + 1));
                } else {
                    showExamSaveError(payload);
                }
            })
            .catch(() => {
                if (attempt < 2) {
                    setTimeout(() => window.saveExamResultReliable(payload, onDone, attempt + 1), 1200);
                } else {
                    showExamSaveError(payload);
                }
            });
        };

        // Hiện cảnh báo + nút thử lại thủ công khi không lưu được (thay vì mất im lặng)
        window.showExamSaveError = function(payload) {
            var old = document.getElementById('exam-save-error-toast');
            if (old) old.remove();
            var box = document.createElement('div');
            box.id = 'exam-save-error-toast';
            box.className = 'fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] bg-white border border-red-200 shadow-float rounded-2xl px-5 py-4 flex items-center gap-4 max-w-[92vw] animate-fade-in';
            box.innerHTML = '<div class="w-10 h-10 rounded-xl bg-red-50 text-td-red flex items-center justify-center shrink-0"><i class="fa-solid fa-triangle-exclamation"></i></div>'
                + '<div class="text-sm"><div class="font-black text-slate-700">Chưa lưu được kết quả</div>'
                + '<div class="text-slate-500 font-medium text-xs mt-0.5">Kết nối hoặc phiên đăng nhập gặp sự cố. Điểm số vẫn hiển thị nhưng chưa được lưu.</div></div>'
                + '<button id="exam-save-retry-btn" class="shrink-0 px-4 h-10 rounded-xl bg-primary text-white font-bold text-sm active:scale-95 transition-all">Lưu lại</button>';
            document.body.appendChild(box);
            document.getElementById('exam-save-retry-btn').onclick = function() {
                box.remove();
                window.saveExamResultReliable(payload, function() {
                    var ok = document.createElement('div');
                    ok.className = 'fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] bg-td-green text-white shadow-float rounded-2xl px-5 py-3 font-bold text-sm animate-fade-in';
                    ok.innerHTML = '<i class="fa-solid fa-circle-check mr-2"></i>Đã lưu kết quả thành công!';
                    document.body.appendChild(ok);
                    setTimeout(() => ok.remove(), 2500);
                });
            };
        };
    }

    window.addEventListener('popstate', function (e) {
        if (typeof isExamRunning !== 'undefined' && isExamRunning && !isReviewMode) {
            if (confirm('Bạn đang làm bài thi. Bấm quay lại (Back) sẽ làm mất kết quả chưa lưu. Bạn có chắc chắn muốn thoát?')) {
                if (typeof showExamResult === 'function') showExamResult(); 
            } else { history.pushState({ inExam: true }, document.title, window.location.href); }
        }
    });

    if (typeof window.toggleCharMode === 'function' && !window.toggleCharModeHijacked) {
        const originalToggle = window.toggleCharMode;
        window.toggleCharMode = function(force) {
            window.isTogglingCharMode = true; 
            originalToggle(force);
            window.isTogglingCharMode = false;
        };
        window.toggleCharModeHijacked = true;
    }

    function getTOCFLLevel(lScore, rScore, totalScore) {
        if (lScore >= 620 && rScore >= 655 && totalScore >= 1345) return '精通級 TOCFL 6 (C2)';
        if (lScore >= 580 && rScore >= 585 && totalScore >= 1210) return '流利級 TOCFL 5 (C1)';
        if (lScore >= 515 && rScore >= 530 && totalScore >= 1125) return '高階級 TOCFL 4 (B2)';
        if (lScore >= 460 && rScore >= 470 && totalScore >= 970) return '進階級 TOCFL 3 (B1)';
        if (lScore >= 395 && rScore >= 415 && totalScore >= 885) return '基礎級 TOCFL 2 (A2)';
        if (lScore >= 335 && rScore >= 340 && totalScore >= 710) return '入門級 TOCFL 1 (A1)';
        if (totalScore >= 600) return '準備級二級 NOVICE 2';
        if (totalScore >= 385) return '準備級一級 NOVICE 1';
        return 'Chưa đạt chuẩn (Dưới Novice 1)';
    }

    // Xếp loại theo điểm 1 kỹ năng (dùng cho đề CAT chỉ Nghe hoặc chỉ Đọc — thang 0-700)
    function getSingleSkillLevel(score) {
        if (score >= 637) return '精通級 TOCFL 6 (C2)';
        if (score >= 582) return '流利級 TOCFL 5 (C1)';
        if (score >= 522) return '高階級 TOCFL 4 (B2)';
        if (score >= 465) return '進階級 TOCFL 3 (B1)';
        if (score >= 405) return '基礎級 TOCFL 2 (A2)';
        if (score >= 337) return '入門級 TOCFL 1 (A1)';
        if (score >= 250) return '準備級 NOVICE';
        return 'Chưa đạt chuẩn (Dưới Novice)';
    }

    // Xếp loại đề thường theo % câu đúng (đề band cố định, không có thang CAT 700)
    function getRegularExamLevel(correct, total) {
        if (!total || total <= 0) return { label: 'Chưa xác định', desc: '', boxClass: 'bg-slate-50 border-slate-200 text-slate-600' };
        const pct = Math.round((correct / total) * 100);
        if (pct >= 85) return { label: 'Xuất sắc · ' + pct + '%', desc: 'Bạn nắm rất vững nội dung đề này. Sẵn sàng thử band cao hơn!', boxClass: 'bg-gradient-to-r from-emerald-400 to-td-green border-emerald-300 text-white' };
        if (pct >= 70) return { label: 'Đạt tốt · ' + pct + '%', desc: 'Bạn đã đạt yêu cầu của đề này. Luyện thêm để chắc chắn hơn.', boxClass: 'bg-gradient-to-r from-primary to-blue-500 border-blue-300 text-white' };
        if (pct >= 55) return { label: 'Trung bình · ' + pct + '%', desc: 'Bạn nắm cơ bản nhưng cần ôn lại các câu còn sai.', boxClass: 'bg-gradient-to-r from-accent to-yellow-400 border-yellow-300 text-primaryDark' };
        if (pct >= 40) return { label: 'Cần cố gắng · ' + pct + '%', desc: 'Bạn cần luyện lại kỹ nội dung đề này.', boxClass: 'bg-gradient-to-r from-orange-400 to-orange-500 border-orange-300 text-white' };
        return { label: 'Chưa đạt · ' + pct + '%', desc: 'Hãy học lại từ cơ bản rồi thử lại nhé.', boxClass: 'bg-gradient-to-r from-td-red to-red-500 border-red-300 text-white' };
    }

    // ===== QUY ĐỔI CÂU ĐÚNG → LƯỢNG XÍCH (SCALE SCORE) CHO ĐỀ THƯỜNG =====
    // Bảng tham khảo dựa trên模擬試題分數對照表 của华测会, thang 0-80 mỗi kỹ năng.
    // Mỗi entry: [rawCorrect, scaleScore]. Nội suy tuyến tính cho các giá trị ở giữa.
    const SCALE_TABLES = {
        // Band A: 50 câu/kỹ năng, thang 0-80, Level 1 (A1) & Level 2 (A2)
        'A': [
            [0,0],[1,10],[3,15],[5,18],[8,22],[10,27],[13,30],[15,33],[17,36],[20,39],
            [22,41],[23,42],[24,43],[25,44],[26,45],[28,47],[30,49],[32,51],[34,53],
            [35,55],[37,57],[38,58],[40,62],[42,65],[44,68],[45,72],[47,75],[48,78],[50,80]
        ],
        // Band B: 50 câu/kỹ năng, thang 0-80, Level 3 (B1) & Level 4 (B2)
        'B': [
            [0,0],[1,10],[3,15],[5,18],[8,22],[10,27],[13,30],[15,33],[17,36],[20,39],
            [22,41],[23,42],[24,43],[25,44],[26,45],[28,47],[30,49],[32,51],[34,53],
            [35,55],[37,57],[38,58],[40,62],[42,65],[44,68],[45,72],[47,75],[48,78],[50,80]
        ],
        // Band C: 50 câu/kỹ năng, thang 0-80, Level 5 (C1) & Level 6 (C2)
        'C': [
            [0,0],[1,10],[3,15],[5,18],[8,22],[10,27],[13,30],[15,33],[17,36],[20,39],
            [22,41],[23,42],[24,43],[25,44],[26,45],[28,47],[30,49],[32,51],[34,53],
            [35,55],[37,57],[38,58],[40,62],[42,65],[44,68],[45,72],[47,75],[48,78],[50,80]
        ]
    };

    // Ngưỡng đạt chính thức TOCFL (thang lượng xích 80, mỗi kỹ năng)
    const TOCFL_THRESHOLDS = {
        'A': [
            { level: 2, label: '基礎級 TOCFL 2 (A2)', listening: 60, reading: 60 },
            { level: 1, label: '入門級 TOCFL 1 (A1)', listening: 41, reading: 42 }
        ],
        'B': [
            { level: 4, label: '高階級 TOCFL 4 (B2)', listening: 60, reading: 60 },
            { level: 3, label: '進階級 TOCFL 3 (B1)', listening: 41, reading: 42 }
        ],
        'C': [
            { level: 6, label: '精通級 TOCFL 6 (C2)', listening: 60, reading: 60 },
            { level: 5, label: '流利級 TOCFL 5 (C1)', listening: 41, reading: 42 }
        ]
    };

    // Nội suy tuyến tính: câu đúng (raw) → lượng xích (scale score)
    function rawToScale(correct, total, band) {
        const table = SCALE_TABLES[band] || SCALE_TABLES['A'];
        // Nếu tổng câu != 50 → chuẩn hóa về thang 50 trước
        const norm = (total && total !== 50) ? Math.round(correct * 50 / total) : correct;
        const c = Math.max(0, Math.min(50, norm));
        // Tìm 2 điểm nội suy
        for (let i = 0; i < table.length - 1; i++) {
            if (c >= table[i][0] && c <= table[i + 1][0]) {
                const [x0, y0] = table[i];
                const [x1, y1] = table[i + 1];
                if (x0 === x1) return y0;
                return Math.round(y0 + (y1 - y0) * (c - x0) / (x1 - x0));
            }
        }
        return table[table.length - 1][1]; // max
    }

    // Xếp cấp TOCFL cho đề thường dựa trên lượng xích
    function getRegularTOCFLLevel(lScale, rScale, band) {
        const thresholds = TOCFL_THRESHOLDS[band] || TOCFL_THRESHOLDS['A'];
        const lValid = lScale !== null && lScale >= 0;
        const rValid = rScale !== null && rScale >= 0;
        // Phải có ít nhất 1 kỹ năng
        if (!lValid && !rValid) return null;
        // Kiểm tra từ cấp cao nhất xuống
        for (const t of thresholds) {
            let pass = true;
            if (lValid && lScale < t.listening) pass = false;
            if (rValid && rScale < t.reading) pass = false;
            // Nếu chỉ thi 1 kỹ năng → xét kỹ năng đó thôi
            if (pass) return { level: t.level, label: t.label };
        }
        // Dưới mức thấp nhất
        const bandDesc = { A: 'A1', B: 'B1', C: 'C1' };
        return { level: 0, label: `Chưa đạt ${bandDesc[band] || 'A1'}` };
    }

    function openExamReviewList() {
        renderExamReviewList();
        const modal = document.getElementById('exam-review-list-modal');
        if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
    }

    function closeExamReviewList() {
        const modal = document.getElementById('exam-review-list-modal');
        if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
    }

    // Render danh sách chi tiết toàn bộ câu: đúng (xanh) / sai (đỏ) / chưa trả lời + đáp án đúng
    // Bỏ tiền tố số gốc ở đầu câu hỏi ("47." / "16、" / "3."). Số tuần tự đã hiển thị ở sidebar/counter.
    function stripLeadingQNum(t) {
        return (t || '').replace(/^\s*第?\s*\d+\s*[.．、。:：]\s*/u, '').trim();
    }

    // Với các đoạn văn có nhiều ô trống dạng ___(11)___ / (11) / 11), tô sáng đúng ô trống
    // tương ứng với câu hỏi đang làm (số lấy từ question_text) để người dùng dễ định vị.
    function highlightActiveBlank(passageHtml, questionText) {
        const m = (questionText || '').match(/\d+/);
        if (!m) return passageHtml;
        const num = m[0];
        const re = new RegExp('([（(]\\s*' + num + '\\s*[）)])');
        if (re.test(passageHtml)) {
            return passageHtml.replace(re, '<span class="exam-active-blank">$1</span>');
        }
        return passageHtml;
    }

    // Render 1 thẻ câu hỏi trong phần xem lại: audio (Nghe), ảnh minh hoạ, câu hỏi, các đáp án đối chiếu.
    function renderReviewCard(qObj, idx, isFirstOfGroup, skill) {
        const labels = ['A', 'B', 'C', 'D'];
        const q = qObj.question, group = qObj.group || {};
        const correctOpt = q.options.find(o => parseInt(o.is_correct) === 1);
        const userOptId  = userAnswers[q.id];
        const answered   = userOptId !== undefined && userOptId !== null && userOptId !== '';
        const isCorrect  = correctOpt && userOptId == correctOpt.id;

        let stClass, stIcon, stBorder;
        if (!answered)      { stClass = 'text-slate-400 bg-slate-100'; stIcon = 'fa-minus'; stBorder = 'border-slate-200'; }
        else if (isCorrect) { stClass = 'text-td-green bg-emerald-50'; stIcon = 'fa-check'; stBorder = 'border-emerald-200'; }
        else                { stClass = 'text-td-red bg-red-50';       stIcon = 'fa-xmark'; stBorder = 'border-red-200'; }

        const qStripped = stripLeadingQNum(q.question_text);
        const qText = qStripped ? getChar(qStripped) : (group.shared_text ? '' : 'Câu ' + idx);

        // Audio (chỉ phần Nghe): audio đoạn dùng chung (1 lần/nhóm) + audio câu hỏi
        let audioHtml = '';
        if (skill === 'Listening') {
            if (isFirstOfGroup && group.shared_audio_url) audioHtml += `<div class="mb-2"><div class="text-[10px] font-bold text-slate-400 uppercase mb-1"><i class="fa-solid fa-music mr-1"></i>Audio đoạn</div><audio controls preload="none" src="${group.shared_audio_url}" class="w-full h-9 outline-none"></audio></div>`;
            if (q.question_audio_url) audioHtml += `<div class="mb-2"><div class="text-[10px] font-bold text-slate-400 uppercase mb-1"><i class="fa-solid fa-headphones mr-1"></i>Audio câu hỏi</div><audio controls preload="none" src="${q.question_audio_url}" class="w-full h-9 outline-none"></audio></div>`;
        }

        // Ảnh minh hoạ — không viền, nền trắng rộng thoáng
        let imgHtml = '';
        const hasSharedImg = isFirstOfGroup && group.shared_image_url;
        if (hasSharedImg || q.question_image_url) {
            imgHtml = `<div class="bg-white rounded-xl p-3 sm:p-5 flex flex-col items-center gap-3 mb-2">
                ${hasSharedImg ? `<img src="${group.shared_image_url}" loading="lazy" class="max-w-full max-h-72 object-contain">` : ''}
                ${q.question_image_url ? `<img src="${q.question_image_url}" loading="lazy" class="max-w-full max-h-72 object-contain">` : ''}
            </div>`;
        }

        const optsHtml = q.options.map((o, oi) => {
            const oLabel = o.label || labels[oi];
            const oText  = o.option_text ? getChar(o.option_text) : '';
            const oImg   = o.option_image_url ? `<img src="${o.option_image_url}" class="max-h-24 rounded mt-1 object-contain">` : '';
            const isC    = correctOpt && o.id == correctOpt.id;
            const isU    = answered && o.id == userOptId;
            const cls    = isC ? 'border-emerald-300 bg-emerald-50' : (isU ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white');
            const mk     = isC ? 'bg-td-green text-white' : (isU ? 'bg-td-red text-white' : 'bg-slate-100 text-slate-500');
            const badge  = isC ? `<span class="ml-auto shrink-0 text-[10px] font-black uppercase text-td-green self-center">Đáp án đúng</span>` : (isU ? `<span class="ml-auto shrink-0 text-[10px] font-black uppercase text-td-red self-center">Bạn chọn</span>` : '');
            return `<div class="flex items-start gap-2 rounded-lg border ${cls} px-2.5 py-1.5">
                <span class="shrink-0 w-5 h-5 rounded ${mk} flex items-center justify-center font-black text-[11px] mt-0.5">${oLabel}</span>
                <span class="font-tc text-[13px] sm:text-sm text-slate-700 flex-1 min-w-0 break-words">${oText}${oImg}</span>
                ${badge}
            </div>`;
        }).join('');

        return `<div class="mb-2.5 rounded-xl border ${stBorder} bg-white p-3 sm:p-4 shadow-sm">
            <div class="flex items-start gap-3">
                <div class="shrink-0 w-8 h-8 rounded-lg ${stClass} flex items-center justify-center font-black text-sm"><i class="fa-solid ${stIcon}"></i></div>
                <div class="min-w-0 flex-1">
                    <div class="text-[11px] font-bold text-slate-400 mb-1">Câu ${idx}</div>
                    ${isFirstOfGroup && group.shared_text ? `<div class="text-[13px] sm:text-sm text-slate-600 font-tc leading-relaxed mb-2 bg-slate-50 rounded-lg p-2.5 break-words">${getChar(group.shared_text).replace(/\n/g, '<br>')}</div>` : ''}
                    ${audioHtml}
                    ${imgHtml}
                    ${qText ? `<div class="text-sm sm:text-[15px] font-bold text-slate-800 font-tc leading-relaxed mb-2 break-words">${qText}</div>` : ''}
                    <div class="flex flex-col gap-1.5">
                        ${optsHtml}
                        ${!answered ? `<div class="mt-0.5 text-slate-400 font-medium italic text-[13px]">Bạn chưa trả lời câu này</div>` : ''}
                    </div>
                </div>
            </div>
        </div>`;
    }

    function reviewTabClass(active) {
        return active
            ? 'flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-primary text-white shadow transition-all outline-none'
            : 'flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-white text-slate-500 border border-slate-200 hover:text-primary transition-all outline-none';
    }

    function switchReviewTab(skill) {
        ['Listening', 'Reading'].forEach(s => {
            const pane = document.getElementById('review-pane-' + s);
            const tab  = document.getElementById('review-tab-' + s);
            const on = (s === skill);
            if (pane) pane.classList.toggle('hidden', !on);
            if (tab)  tab.className = reviewTabClass(on);
        });
    }

    // Render 1 phần (Nghe/Đọc) thành pane: tóm tắt số câu đúng + danh sách thẻ câu hỏi.
    function renderReviewPane(skill, qs) {
        let correct = 0, prevGroupId = null, cards = '';
        qs.forEach((qObj, i) => {
            const q = qObj.question;
            const correctOpt = q.options.find(o => parseInt(o.is_correct) === 1);
            if (correctOpt && userAnswers[q.id] == correctOpt.id) correct++;
            const gid = qObj.group ? qObj.group.id : null;
            const isFirstOfGroup = gid !== prevGroupId; prevGroupId = gid;
            cards += renderReviewCard(qObj, i + 1, isFirstOfGroup, skill);
        });
        const summary = `<div class="mb-4 rounded-xl bg-white border border-slate-200 shadow-sm p-4 text-center">
            <span class="text-3xl font-black text-primary">${correct}</span><span class="text-slate-400 font-bold text-lg">/${qs.length}</span>
            <span class="text-sm font-medium text-slate-500 ml-1">câu đúng</span></div>`;
        return summary + cards;
    }

    function renderExamReviewList() {
        const body = document.getElementById('exam-review-list-body');
        if (!body) return;
        const skillChoice = userAnswers['_skillChoice'] || 'both';
        const hasL = (skillChoice !== 'reading')  && listeningQuestions.length > 0;
        const hasR = (skillChoice !== 'listening') && readingQuestions.length > 0;

        if (!hasL && !hasR) { body.innerHTML = '<div class="text-center text-slate-400 py-10 font-medium">Không có dữ liệu câu hỏi để hiển thị.</div>'; return; }

        // Tab Nghe / Đọc — chỉ hiện tab của phần có câu hỏi. Mặc định mở Nghe (nếu có), ngược lại Đọc.
        let tabsBar = '';
        if (hasL && hasR) {
            tabsBar = `<div class="flex gap-2 mb-4 sticky top-0 z-10 bg-slate-50 pb-1 pt-1">
                <button id="review-tab-Listening" onclick="switchReviewTab('Listening')" class="${reviewTabClass(true)}"><i class="fa-solid fa-headphones mr-1"></i> Phần Nghe</button>
                <button id="review-tab-Reading" onclick="switchReviewTab('Reading')" class="${reviewTabClass(false)}"><i class="fa-solid fa-book mr-1"></i> Phần Đọc</button>
            </div>`;
        }

        let panes = '';
        if (hasL) panes += `<div id="review-pane-Listening">${renderReviewPane('Listening', listeningQuestions)}</div>`;
        if (hasR) panes += `<div id="review-pane-Reading" class="${hasL ? 'hidden' : ''}">${renderReviewPane('Reading', readingQuestions)}</div>`;

        body.innerHTML = tabsBar + panes;
    }

    function renderTOCFLList() {
        const container = document.getElementById('tocfl-list-container');
        container.innerHTML = `<div class="col-span-full flex justify-center py-10"><i class="fa-solid fa-spinner fa-spin text-4xl text-primary"></i></div>`;
        fetch('/api.php?action=get_exams')
            .then(res => res.json())
            .then(data => {
                let exams = [];
                if (Array.isArray(data)) exams = data;
                else if (data.success && Array.isArray(data.data)) exams = data.data;
                else if (!data.success) {
                    console.error(data.message);
                    container.innerHTML = `<div class="col-span-full text-center text-red-500 py-10 font-medium">Lỗi tải danh sách đề: ${data.message || 'Lỗi không xác định'}</div>`;
                    return;
                }
                
                if(exams.length === 0) {
                    container.innerHTML = `<div class="col-span-full text-center text-slate-500 py-10 font-medium">Chưa có bộ đề thi nào được tạo.</div>`;
                    return;
                }

                // Nhóm đề theo Band, giữ thứ tự xuất hiện
                const bandMeta = {
                    'Band A': { color: 'rose',  grad: 'from-rose-500 to-rose-600',   img: '/image/bandA.jpg', desc: 'Cơ bản · Sơ cấp (A1–A2)' },
                    'Band B': { color: 'amber', grad: 'from-amber-500 to-amber-600', img: '/image/bandB.jpg', desc: 'Trung cấp (B1–B2)' },
                    'Band C': { color: 'teal',  grad: 'from-teal-500 to-teal-600',   img: '/image/bandC.jpg', desc: 'Cao cấp (C1–C2)' }
                };
                const order = [];
                const groups = {};
                exams.forEach(ex => {
                    if (!groups[ex.band_name]) { groups[ex.band_name] = []; order.push(ex.band_name); }
                    groups[ex.band_name].push(ex);
                });

                let html = '';
                order.forEach(bandName => {
                    const meta = bandMeta[bandName] || { color: 'slate', grad: 'from-slate-500 to-slate-600', img: '', desc: '' };
                    const color = meta.color;
                    const bandKey = bandName.replace('Band ', '').trim().toLowerCase();
                    const items = groups[bandName];

                    const imgHtml = meta.img
                        ? `<img src="${meta.img}" alt="${bandName}" class="w-full h-full object-cover">`
                        : `<div class="w-full h-full bg-gradient-to-br from-${color}-400 to-${color}-600"></div>`;

                    // Đề đầy đủ (50 phút) — thi cả Nghe + Đọc
                    const fullHtml = items.map((ex, i) => {
                        const isLocked = !!ex.locked;
                        return `
                        <div onclick="openTestSetup(${ex.id}, '${bandName} · Đề ${i+1} (đầy đủ · ~140 phút)', false, false, null, '${bandName}', ${isLocked ? 1 : 0})" class="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-100 flex items-center gap-3 md:hover:shadow-md md:hover:border-${color}-200 active:bg-slate-50 transition-all cursor-pointer group">
                            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-${color}-50 text-${color}-600 flex items-center justify-center font-black text-sm sm:text-base shrink-0 group-hover:scale-110 transition-transform">${i+1}</div>
                            <div class="flex-1 min-w-0"><h4 class="font-bold text-slate-800 text-[13px] sm:text-[14px] truncate group-hover:text-${color}-600 transition-colors">${bandName} · Đề ${i+1}${isLocked ? ' <i class="fa-solid fa-lock text-[10px] text-amber-500 ml-1"></i>' : ''}</h4><p class="text-[10px] sm:text-[11px] font-medium text-slate-400">${isLocked ? 'Cần mật khẩu · ' : ''}Nghe + Đọc · ~140 phút</p></div>
                            <button class="w-7 h-7 sm:w-8 sm:h-8 rounded-full ${isLocked ? 'bg-amber-50 text-amber-500' : `bg-${color}-50 text-${color}-400`} flex items-center justify-center shrink-0 md:group-hover:bg-${color}-500 md:group-hover:text-white transition-all shadow-sm outline-none"><i class="fa-solid ${isLocked ? 'fa-lock text-[9px]' : 'fa-play text-[9px] ml-0.5'}"></i></button>
                        </div>`;
                    }).join('');

                    html += `
                    <div id="band-${bandKey}" class="scroll-mt-24 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col sm:flex-row">
                        <!-- Ảnh Band bên trái -->
                        <div class="relative sm:w-[200px] lg:w-[230px] shrink-0 h-40 sm:h-auto overflow-hidden">
                            ${imgHtml}
                            <div class="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/55 via-black/10 to-transparent"></div>
                            <div class="absolute bottom-0 left-0 p-4">
                                <span class="inline-block bg-${color}-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md mb-1.5">${bandName}</span>
                                <div class="text-white text-xs font-bold drop-shadow">${meta.desc}</div>
                            </div>
                        </div>
                        <!-- Danh sách đề bên phải -->
                        <div class="flex-1 p-4 sm:p-5">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center gap-2">
                                    <div class="w-1.5 h-5 bg-${color}-500 rounded-full"></div>
                                    <h4 class="font-black text-slate-700 text-sm tracking-wide">Đề đầy đủ</h4>
                                </div>
                                <span class="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">50 phút</span>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">${fullHtml}</div>

                            <!-- Đề nhanh = 1 bài CAT thích ứng giới hạn trong band (không phải đề cố định) -->
                            <button onclick="openBandQuickCat('${bandName}')" class="w-full mt-4 flex items-center gap-3 rounded-2xl p-3.5 bg-gradient-to-r ${meta.grad} text-white shadow-sm md:hover:shadow-lg active:scale-[0.99] transition-all text-left group">
                                <span class="w-11 h-11 rounded-2xl bg-white/25 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform"><i class="fa-solid fa-bolt"></i></span>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <h4 class="font-black text-[15px] leading-tight">Thi nhanh 25 phút</h4>
                                        <span class="bg-white/25 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide">Thích ứng · IRT</span>
                                    </div>
                                    <p class="text-white/85 text-[11px] font-bold mt-0.5">Đề tự điều chỉnh độ khó trong ${bandName} · ~15-22 câu · chọn Nghe/Đọc</p>
                                </div>
                                <i class="fa-solid fa-chevron-right text-white/70 shrink-0 group-hover:translate-x-0.5 transition-transform"></i>
                            </button>
                        </div>
                    </div>`;
                });
                container.innerHTML = html;
            }).catch(err => { container.innerHTML = `<div class="col-span-full text-center text-slate-500 py-10 font-medium">Lỗi tải đề thi: Không kết nối được API.</div>`; });
    }

    function scrollToBand(key) {
        const el = document.getElementById('band-' + key);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const HONOR_META = {
        'Band A': { color: '#f43f5e', soft: '#fff1f2', tab: '#f43f5e' },
        'Band B': { color: '#f59e0b', soft: '#fffbeb', tab: '#f59e0b' },
        'Band C': { color: '#14b8a6', soft: '#f0fdfa', tab: '#14b8a6' },
        'Quick25': { color: '#6366f1', soft: '#eef2ff', tab: '#6366f1' }
    };
    const HONOR_NOTE = {
        'Band A': 'Điểm tổng Nghe + Đọc, thang 0-1400 (không phải điểm/kỹ năng).',
        'Band B': 'Điểm tổng Nghe + Đọc, thang 0-1400 (không phải điểm/kỹ năng).',
        'Band C': 'Điểm tổng Nghe + Đọc, thang 0-1400 (không phải điểm/kỹ năng).',
        'Quick25': 'Thi nhanh 25 phút là điểm luyện tập, không xếp cấp TOCFL.'
    };
    window.tocflHonorsData = null;
    window.activeHonorBand = 'Band A';

    function honorEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function honorNum(n) { return Number(n || 0).toLocaleString('vi-VN'); }
    function honorAvatar(avatar, name, cls, ring) {
        return avatar
            ? `<img src="${honorEsc(avatar)}" class="${cls} rounded-full object-cover shrink-0 ${ring}">`
            : `<div class="${cls} rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 shrink-0 ${ring}">${honorEsc((name || 'U').charAt(0).toUpperCase())}</div>`;
    }

    function buildHonorHTML(band) {
        const m = HONOR_META[band] || { color: '#64748b', soft: '#f8fafc' };
        const list = ((window.tocflHonorsData || {})[band] || []);
        const unit = band === 'Quick25' ? ' điểm' : 'đ';
        const note = HONOR_NOTE[band]
            ? `<p class="text-[11px] text-slate-400 font-semibold mb-2">${honorEsc(HONOR_NOTE[band])}</p>`
            : '';

        if (list.length === 0) {
            return `${note}<div class="text-center py-14 text-slate-400"><i class="fa-regular fa-face-meh text-3xl mb-3 block opacity-50"></i><p class="text-sm font-medium">Chưa có thí sinh ${band === 'Quick25' ? 'THI NHANH 25 PHÚT' : band} tháng này.</p><p class="text-xs mt-1">Hãy là người đầu tiên!</p></div>`;
        }

        // Xếp hạng có trang trí: #1 vương miện (nền vàng gold + vòng nguyệt quế), #2 bạc, #3 đồng.
        const medalBg = ['linear-gradient(135deg,#fbbf24,#f59e0b)', 'linear-gradient(135deg,#cbd5e1,#94a3b8)', 'linear-gradient(135deg,#fbb47a,#d97706)'];
        const medalIcon = ['fa-crown', 'fa-medal', 'fa-medal'];
        const rowHtml = list.map((p, i) => {
            const rank = i + 1;
            const top = rank <= 3;
            const badge = top
                ? `<span class="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] shadow-md shrink-0" style="background:${medalBg[i]}"><i class="fa-solid ${medalIcon[i]}"></i></span>`
                : `<span class="w-8 text-center text-[13px] font-black text-slate-400 shrink-0 tabular-nums">${rank}</span>`;
            const rowBg = rank === 1
                ? 'bg-gradient-to-r from-amber-50 via-amber-50/40 to-transparent ring-1 ring-amber-200/60'
                : 'hover:bg-slate-50';
            const avRing = rank === 1 ? 'ring-2 ring-amber-300' : (top ? 'ring-1 ring-slate-200' : '');
            // Vòng nguyệt quế cho quán quân
            const laurel = rank === 1
                ? `<i class="fa-solid fa-leaf text-amber-400/80 text-[11px] -scale-x-100 shrink-0"></i>`
                : '';
            const laurelR = rank === 1
                ? `<i class="fa-solid fa-leaf text-amber-400/80 text-[11px] shrink-0"></i>`
                : '';
            return `
                <div class="flex items-center gap-2 py-2 px-2 rounded-xl ${rowBg} transition-colors">
                    ${badge}
                    ${laurel}${honorAvatar(p.avatar, p.full_name, 'w-9 h-9 text-xs', avRing)}${laurelR}
                    <div class="flex-1 min-w-0 text-[13px] font-bold text-brandNavy truncate ${rank === 1 ? 'pl-0.5' : ''}">${honorEsc(p.full_name || 'Học viên')}</div>
                    <div class="text-sm font-black shrink-0" style="color:${m.color}">${honorNum(p.score)}<span class="text-[10px] font-bold text-slate-400 ml-0.5">${unit}</span></div>
                </div>`;
        }).join('');

        return `${note}<div class="space-y-0.5">${rowHtml}</div>`;
    }

    function renderHonorTab(band) {
        window.activeHonorBand = band;
        // cập nhật trạng thái tab (cả sidebar lẫn modal mobile)
        document.querySelectorAll('.honor-tab').forEach(btn => {
            const on = btn.dataset.band === band;
            btn.style.background = on ? '#ffffff' : 'transparent';
            btn.style.color = on ? (HONOR_META[band] ? HONOR_META[band].color : '#334155') : 'rgba(255,255,255,0.9)';
            btn.style.boxShadow = on ? '0 2px 6px rgba(0,0,0,0.12)' : 'none';
        });
        if (!window.tocflHonorsData) return;
        const html = buildHonorHTML(band);
        const box = document.getElementById('tocfl-honors');
        if (box) box.innerHTML = html;
        const boxM = document.getElementById('tocfl-honors-m');
        if (boxM) boxM.innerHTML = html;
        renderHonorMyRank();
    }

    // Hàng "hạng của bạn" ở cuối bảng Cao thủ TOCFL (desktop + modal mobile)
    function renderHonorMyRank() {
        const isQuick = window.activeHonorBand === 'Quick25';
        const mr = isQuick
            ? (window.tocflMyQuickRank ? Object.assign({ band: 'Quick25' }, window.tocflMyQuickRank) : null)
            : window.tocflMyRank;
        const unit = isQuick ? ' điểm' : 'đ';
        ['tocfl-myrank', 'tocfl-myrank-m'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (!mr) { el.classList.add('hidden'); el.innerHTML = ''; return; }
            const col = (HONOR_META[mr.band] || {}).color || '#027AB3';
            el.classList.remove('hidden');
            el.innerHTML = `
                <div class="flex items-center gap-2 py-2 px-2.5 rounded-xl bg-primary/5 ring-1 ring-primary/10">
                    <span class="w-8 text-center text-[13px] font-black text-primary shrink-0 tabular-nums">#${mr.rank}</span>
                    ${honorAvatar(mr.avatar, mr.full_name, 'w-9 h-9 text-xs', 'ring-1 ring-primary/25')}
                    <div class="flex-1 min-w-0">
                        <div class="text-[13px] font-black text-primary truncate">Bạn <span class="text-[10px] font-bold text-slate-400">· ${isQuick ? 'THI NHANH 25 PHÚT' : honorEsc(mr.band)}</span></div>
                    </div>
                    <div class="text-sm font-black shrink-0" style="color:${col}">${honorNum(mr.score)}<span class="text-[10px] font-bold text-slate-400 ml-0.5">${unit}</span></div>
                </div>`;
        });
    }

    function openHonorModal() {
        const md = document.getElementById('tocfl-honor-modal');
        if (!md) return;
        // Đưa modal ra thẳng <body> để position:fixed bám theo màn hình
        // (tránh bị lệch xuống chân trang do phần tử cha có transform/animate)
        if (md.parentElement !== document.body) document.body.appendChild(md);
        md.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        if (window.tocflHonorsData) renderHonorTab(window.activeHonorBand);
        else {
        const hm = document.getElementById('tocfl-honors-m');
        if (hm) hm.innerHTML = `<div class="text-center py-14 text-slate-400 text-sm"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
        loadTocflHonors();
    }
    }
    function closeHonorModal() {
        const md = document.getElementById('tocfl-honor-modal');
        if (md) md.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function honorsDesktopError() {
        ['tocfl-honors', 'tocfl-honors-m'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = `<div class="text-center py-10 text-slate-400 text-sm">Không tải được dữ liệu.</div>`;
        });
    }

    function loadTocflHonors() {
        fetch('/api.php?action=get_tocfl_honors')
            .then(r => r.json())
            .then(res => {
                if (!res.success) { honorsDesktopError(); return; }
                const monthTxt = res.month ? 'tháng ' + res.month : '';
                const mEl = document.getElementById('honor-month');
                if (mEl) mEl.textContent = monthTxt;
                const mElM = document.getElementById('honor-month-m');
                if (mElM) mElM.textContent = monthTxt;
                window.tocflHonorsData = res.data || {};
                window.tocflHonorsData['Quick25'] = res.quick25 || [];
                window.tocflMyRank = res.my_rank || null;
                window.tocflMyQuickRank = res.my_quick_rank || null;
                // Tab mặc định: ưu tiên band của chính người dùng, nếu không thì band đầu có dữ liệu.
                let band = (window.tocflMyRank && window.tocflMyRank.band) || window.activeHonorBand;
                if (!(window.tocflHonorsData[band] || []).length) {
                    band = ['Band A', 'Band B', 'Band C'].find(b => (window.tocflHonorsData[b] || []).length) || 'Band A';
                }
                renderHonorTab(band);
            })
            .catch(() => { honorsDesktopError(); });
    }

    function renderHistory() {
        if (!currentUser) currentUser = { id: 1, full_name: "Vũ Duy Phúc", role: "admin", vip: 1 };
        const container = document.getElementById('history-container');
        fetch(`/api.php?action=get_history&user_id=${currentUser.id}`)
            .then(res => res.json())
            .then(res => {
                if(res.success && res.data && res.data.length > 0) {
                    let rows = res.data.map(item => {
                        let isCat = item.details.includes('"_isCatMode":true');
                        // Đề NHANH (ôn tập, đánh dấu _practice): chấm theo số câu, KHÔNG /700, KHÔNG xếp cấp.
                        let isPractice = item.details.includes('"_practice":true');
                        // Đề thi thử bản mới cũng chấm thang scaled 700 (đánh dấu _scaledScoring).
                        // Bản ghi cũ (không có dấu) vẫn hiển thị theo "câu" như trước để không sai lệch.
                        let isScaled = (isCat || item.details.includes('"_scaledScoring":true')) && !isPractice;

                        let totalScore = Math.round(parseFloat(item.score));
                        let parsedL = Math.round(parseFloat(item.listening_score));
                        let parsedR = Math.round(parseFloat(item.reading_score));

                        // --- NỔI BẬT LỊCH SỬ KẾT QUẢ CHO TỪNG LOẠI ---
                        let lScoreHtml = item.listening_score == -1 ? '-' : (isScaled
                            ? `<div class="flex items-center gap-1"><span class="text-primary font-black text-sm sm:text-base">${parsedL}</span><span class="text-[10px] text-slate-400 font-bold">/700</span></div>`
                            : `<div class="flex items-center gap-1"><span class="text-primary font-black text-sm sm:text-base">${parsedL}</span><span class="text-[10px] text-slate-500 font-medium whitespace-nowrap">câu</span></div>`);

                        let rScoreHtml = item.reading_score == -1 ? '-' : (isScaled
                            ? `<div class="flex items-center gap-1"><span class="text-td-green font-black text-sm sm:text-base">${parsedR}</span><span class="text-[10px] text-slate-400 font-bold">/700</span></div>`
                            : `<div class="flex items-center gap-1"><span class="text-td-green font-black text-sm sm:text-base">${parsedR}</span><span class="text-[10px] text-slate-500 font-medium whitespace-nowrap">câu</span></div>`);

                        let catLevelHtml = '';
                        if (isScaled) {
                            // Đề 1 kỹ năng → xếp loại theo kỹ năng đó; đề đủ 2 kỹ năng → xếp loại tổng.
                            let level = (item.listening_score == -1)
                                ? getSingleSkillLevel(parsedR)
                                : (item.reading_score == -1 ? getSingleSkillLevel(parsedL) : getTOCFLLevel(parsedL, parsedR, totalScore));
                            catLevelHtml = `<div class="text-[10px] font-bold text-accent mt-1 bg-primaryDark/5 border border-primaryDark/10 px-2 py-0.5 rounded inline-block whitespace-nowrap">${level}</div>`;
                        }

                        let displayScoreHtml = isScaled
                            ? `<div class="flex flex-col items-start"><div class="inline-flex items-center gap-1.5">${isCat ? '<span class="bg-gradient-to-r from-accent to-yellow-500 text-primaryDark px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow-sm hidden sm:inline-block">CAT</span>' : ''}<span class="text-brandNavy font-black text-sm sm:text-base">${totalScore}</span><span class="text-[10px] text-slate-400 font-bold">/1400</span></div>${catLevelHtml}</div>`
                            : `<div class="flex items-center gap-1"><span class="text-brandNavy font-black text-sm sm:text-base">${totalScore}</span><span class="text-[10px] text-slate-500 font-medium whitespace-nowrap">câu đúng</span></div>`;

                        let titleHtml = isCat 
                            ? `<span class="text-primaryDark font-black flex items-center gap-1.5"><i class="fa-solid fa-robot text-accent text-lg"></i> ${item.exam_title || 'TOCFL Mock Test'}</span>` 
                            : `<span class="text-slate-700 font-bold">${item.exam_title || 'TOCFL Mock Test'}</span>`;

                        return `
                            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td class="p-3 sm:p-4 md:p-5 text-xs sm:text-sm min-w-[150px]">${titleHtml}</td>
                                <td class="p-3 sm:p-4 md:p-5 text-xs sm:text-sm text-slate-500 hidden md:table-cell">${item.created_at || 'Không có ngày'}</td>
                                <td class="p-3 sm:p-4 md:p-5">${lScoreHtml}</td>
                                <td class="p-3 sm:p-4 md:p-5">${rScoreHtml}</td>
                                <td class="p-3 sm:p-4 md:p-5">${displayScoreHtml}</td>
                                <td class="p-3 sm:p-4 md:p-5 text-right">
                                    <button onclick="startReview(${item.id}, ${item.exam_id})" class="px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 bg-td-lightBlue/20 text-primary rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-bold hover:bg-primary hover:text-white transition-colors shadow-sm outline-none">Xem lại</button>
                                </td>
                            </tr>
                        `;
                    }).join('');
                    container.innerHTML = `
                        <div class="overflow-x-auto custom-scrollbar">
                            <table class="w-full text-left border-collapse min-w-[450px] sm:min-w-[600px]">
                                <thead>
                                    <tr class="bg-slate-50 border-b border-slate-200">
                                        <th class="p-3 sm:p-4 md:p-5 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Tên đề thi</th>
                                        <th class="p-3 sm:p-4 md:p-5 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Thời gian nộp</th>
                                        <th class="p-3 sm:p-4 md:p-5 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Nghe</th>
                                        <th class="p-3 sm:p-4 md:p-5 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Đọc</th>
                                        <th class="p-3 sm:p-4 md:p-5 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Kết quả</th>
                                        <th class="p-3 sm:p-4 md:p-5 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>${rows}</tbody>
                            </table>
                        </div>
                    `;
                } else container.innerHTML = `<div class="p-6 sm:p-8 md:p-12 text-center text-slate-500 font-medium bg-slate-50 text-sm sm:text-base">Bạn chưa có lịch sử làm bài thi nào.</div>`;
            }).catch(e => { container.innerHTML = `<div class="p-6 sm:p-8 text-center text-red-500 font-medium text-sm sm:text-base">Lỗi tải lịch sử.</div>`; });
    }

    let catShortMode = false;
    let catBand = ''; // '' = CAT toàn dải; 'A'|'B'|'C' = CAT nhanh giới hạn trong band
    async function openCatTestSetup(short = false) {
        catBand = ''; // CAT chung (khối gradient trên cùng) không giới hạn band
        openTestSetup(0, short ? 'Đề CAT nhanh (~20-25 phút)' : 'Bài thi CAT (Theo năng lực)', true, short);
    }
    // Bài "nhanh 25 phút" theo band = CAT thích ứng nhưng pool giới hạn trong độ khó của band.
    async function openBandQuickCat(band) {
        catBand = String(band || '').replace(/^Band\s*/i, '').trim().toUpperCase(); // 'A'|'B'|'C'
        openTestSetup(0, `Thi nhanh TOCFL ${band} (25 phút)`, true, true, 'reading');
    }
    // Theta khởi tạo theo tâm độ khó của band → hội tụ nhanh hơn trong ngân sách ~22 câu.
    function catSeedTheta() {
        if (!catBand) return 0;
        return ({ A: -1.5, B: 0.4, C: 1.8 })[catBand] ?? 0;
    }

    // Xáo vị trí đáp án (A/B/C/D) mỗi lần thi để tránh học vẹt theo vị trí cố định.
    // Nhãn A/B/C/D sau đó luôn được gán lại theo vị trí MỚI khi render (không dùng opt.label gốc từ DB).
    function shuffleQuestionOptions(q) {
        if (!q || !Array.isArray(q.options) || q.options.length < 2) return;
        const arr = q.options;
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    let selectedExamId = null;
    let currentExamBand = ''; // 'Band A' | 'Band B' | 'Band C'
    // ── Khóa đề mới: hỏi mật khẩu, xác thực với server (lưu theo session) ──
        let examPwOk = true;
    async function ensureExamUnlocked() {
        return true;
    }

    function openTestSetup(examId, title, catFlag, shortFlag = false, presetSkill = null, bandName = '', locked = 0) {
        if (locked && !examPwOk) {
            ensureExamUnlocked().then(ok => {
                if (ok) openTestSetup(examId, title, catFlag, shortFlag, presetSkill, bandName, 0);
            });
            return;
        }
        selectedExamId = examId;
        isCatMode = catFlag;
        catShortMode = !!shortFlag;
        currentExamBand = bandName; // Lưu band cho đề thường
        document.getElementById('setup-exam-title').innerText = title;

        const skillContainer = document.getElementById('setup-skill-container');
        const catNotice = document.getElementById('setup-cat-notice');
        // Hiện nút chọn kỹ năng khi: đề thường HOẶC CAT nhanh. Ẩn khi CAT đầy đủ (luôn thi cả 2).
        const showSkill = !isCatMode || catShortMode;
        if (skillContainer) skillContainer.style.display = showSkill ? 'block' : 'none';
        if (catNotice) catNotice.style.display = isCatMode ? 'block' : 'none';

        // Đề nhanh 25 phút (đề thường): mặc định 1 kỹ năng để mỗi phần ~25 phút.
        const skillSel = document.getElementById('setup-skill');
        if (presetSkill && skillSel) skillSel.value = presetSkill;

        document.getElementById('test-setup-modal').classList.remove('hidden');
    }

    async function saveCatResponseToServer(qObj, isCorrect) {
        if (!currentUser || !currentUser.id) return;
        const curState = irtState[currentSkill] || {};
        const payload = {
            user_id: currentUser.id,
            session_id: currentCatSessionId,
            group_id: qObj.group.id,
            question_id: qObj.question.id,
            is_correct: isCorrect ? 1 : 0,
            is_anchor: 0,
            time_taken_group: 0,
            estimated_level: Math.round((curState.theta ?? 0) * 10) // theta×10 để lưu vào INT
        };

        try {
            const res = await fetch('/api.php?action=save_cat_response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success && currentCatSessionId === 0 && data.session_id) {
                currentCatSessionId = data.session_id; 
            }
        } catch (err) {
            console.error("Lỗi khi lưu đáp án CAT:", err);
        }
    }

    async function confirmStartTest() {
        document.getElementById('test-setup-modal').classList.add('hidden');
        // CAT đầy đủ luôn thi cả 2; CAT nhanh và đề thường lấy theo lựa chọn kỹ năng của người dùng.
        let skillChoice = (isCatMode && !catShortMode) ? 'both' : document.getElementById('setup-skill').value;
        // Bài nhanh theo band chỉ thi 1 kỹ năng (đúng 25 phút). 'both' -> mặc định Đọc.
        if (catShortMode && catBand && skillChoice === 'both') skillChoice = 'reading';
        charMode = document.getElementById('setup-char').value;
        document.getElementById('exam-char-mode-text').innerText = charMode === 'traditional' ? 'Giản thể' : 'Phồn thể';

        document.getElementById('floating-lang-toggle')?.classList.add('hidden');
        document.getElementById('exam-mode').classList.remove('hidden');
        document.getElementById('exam-content-area').innerHTML = `<div class="flex h-full items-center justify-center"><i class="fa-solid fa-spinner fa-spin text-3xl sm:text-4xl text-primary"></i></div>`;
        
        isReviewMode = false;
        
        // Reset tracking vars for CAT
        currentCatSessionId = 0;
        savedCatQuestions = new Set();
        
        document.getElementById('exam-timer').parentElement.classList.remove('hidden');
        const actionBtn = document.getElementById('exam-action-btn');
        if (actionBtn) { actionBtn.setAttribute('onclick', 'confirmExitExam()'); actionBtn.innerHTML = 'Nộp bài'; }
        document.getElementById('exam-title-display').innerText = document.getElementById('setup-exam-title').innerText;

        try {
            let apiUrl = isCatMode
                ? `/api.php?action=get_cat_exam_detail${catBand ? '&band=' + encodeURIComponent(catBand) : ''}`
                : `/api.php?action=get_exam_detail&exam_id=${selectedExamId}`;
            const res = await fetch(apiUrl);
            if (!res.ok) throw new Error("HTTP " + res.status);
            const data = await res.json();
            
            if(data.success) {
                currentExamId = selectedExamId;
                listeningQuestions = []; readingQuestions = [];
                
                if (isCatMode) {
                    // IRT: flatten pool → mảng phẳng sắp xếp theo b_param
                    catPoolFlat = { Listening: [], Reading: [] };
                    irtState = {
                        Listening: { theta: catSeedTheta(), responses: [], itemCount: 0, groupCount: 0, currentGroupStartIdx: 0, se: 999 },
                        Reading:   { theta: catSeedTheta(), responses: [], itemCount: 0, groupCount: 0, currentGroupStartIdx: 0, se: 999 }
                    };
                    for (let skill in data.pool) {
                        let allItems = [];
                        for (let lvl in data.pool[skill]) {
                            data.pool[skill][lvl].forEach(item => {
                                const g = item.group || {};
                                const qs = item.questions || [];
                                // Câu Nghe: audio đã đọc cố định theo đúng thứ tự A/B/C/D gốc trong DB,
                                // xáo trộn ở đây sẽ làm nhãn hiển thị không khớp với thứ tự đọc trong audio.
                                if (skill !== 'Listening') qs.forEach(shuffleQuestionOptions);
                                // Debug: cờ lỗi cấu trúc nhóm để rà soát thủ công
                                const noQuestions = qs.length === 0;
                                const noCorrect = qs.some(q => !(q.options || []).some(o => parseInt(o.is_correct) === 1));
                                // Guard: nhóm NGHE phải có audio phát được (shared hoặc audio câu). Nếu không → loại khỏi pool.
                                const hasAnyAudio = !!(g.shared_audio_url && String(g.shared_audio_url).trim())
                                    || qs.some(q => q.question_audio_url && String(q.question_audio_url).trim());
                                const noAudio = (skill === 'Listening') && !hasAnyAudio;
                                if (noQuestions || noCorrect || noAudio) {
                                    console.warn('[CAT debug] group', g.id, 'thiếu:', { noQuestions, noCorrect, noAudio });
                                }
                                if (noQuestions || noAudio) return; // bỏ khỏi pool thích ứng
                                allItems.push(item);
                            });
                        }
                        // Đề NHANH 25 phút (catShortMode): loại nhóm ĐỌC dạng "đoạn văn + điền nhiều đáp án"
                        // (cloze/passage) để hạn chế sai sót — chỉ giữ câu Đọc đứng lẻ. Nếu loại xong pool quá
                        // mỏng (vd Band C chỉ toàn passage) thì GIỮ lại để không cạn đề (nhóm này đã sửa đúng thứ tự).
                        if (skill === 'Reading' && catShortMode) {
                            const isCloze = it => !!(it.group && it.group.shared_text && String(it.group.shared_text).trim())
                                && (it.questions || []).length > 1;
                            const nonCloze = allItems.filter(it => !isCloze(it));
                            const nonClozeQ = nonCloze.reduce((s, it) => s + (it.questions || []).length, 0);
                            if (nonCloze.length >= 8 && nonClozeQ >= 15) {
                                allItems = nonCloze; // đủ câu lẻ → bỏ hẳn passage-cloze
                            } else if (nonCloze.length < allItems.length) {
                                console.warn('[CAT] Đề nhanh: giữ nhóm đoạn văn vì pool câu lẻ quá mỏng (' + nonCloze.length + ' nhóm / ' + nonClozeQ + ' câu).');
                            }
                        }
                        // Sort by b_param ascending (dễ → khó) để binary-search gần nhất nhanh hơn
                        allItems.sort((a, b) => (a.group.b_param ?? 0) - (b.group.b_param ?? 0));
                        catPoolFlat[skill] = allItems;
                    }
                } else {
                    data.parts.forEach(part => {
                        let skillKey = part.skill_key || (part.skill_id == 1 ? 'Listening' : 'Reading');
                        part.groups.forEach(group => {
                            group.questions.forEach(q => {
                                // Câu Nghe: giữ nguyên thứ tự A/B/C/D gốc để khớp với audio đã ghi âm cố định.
                                if (skillKey !== 'Listening') shuffleQuestionOptions(q);
                                let obj = { part, group, question: q };
                                if(skillKey === 'Listening') { if(skillChoice === 'both' || skillChoice === 'listening') listeningQuestions.push(obj); }
                                else { if(skillChoice === 'both' || skillChoice === 'reading') readingQuestions.push(obj); }
                            });
                        });
                    });
                }

                userAnswers = { _skillChoice: skillChoice, _catShortMode: catShortMode, _examBand: currentExamBand };
                isExamRunning = true;
                // Bắt đầu ở phần Đọc khi chỉ thi Đọc (cả CAT nhanh reading-only lẫn đề thường), ngược lại bắt đầu ở Nghe.
                if (skillChoice === 'reading' && ((isCatMode && (catPoolFlat.Reading || []).length > 0) || (!isCatMode && readingQuestions.length > 0))) currentSkill = 'Reading'; else currentSkill = 'Listening';
                
                currentTestIdx = 0; userScore = { listening: 0, reading: 0 };
                examTimerInitialized = false; // Đếm ngược 1 lần duy nhất cho TOÀN BÀI (Nghe+Đọc), không reset khi chuyển kỹ năng.
                if (isExamRunning) history.pushState({ inExam: true }, document.title, window.location.href);
                startSkillSection();
            } else if (data.code === 'EXAM_LOCKED') {
                // Phòng thủ tầng 2: session server chưa mở khóa (vd hết session) → hỏi lại mật khẩu rồi thử lại
                document.getElementById('exam-mode').classList.add('hidden');
                const ok = await ensureExamUnlocked();
                if (ok) { confirmStartTest(); }
            } else {
                alert('Lỗi tải đề thi: ' + (data.message || data.error || 'Lỗi không xác định'));
                window.location.href = '/';
            }
        } catch(e) { 
            console.error(e);
            alert('Lỗi kết nối khi tải chi tiết đề thi! Chi tiết: ' + e.message); 
            window.location.href = '/'; 
        }
    }

    async function startReview(resultId, examId) {
        document.getElementById('exam-content-area').innerHTML = `<div class="flex h-full items-center justify-center"><i class="fa-solid fa-spinner fa-spin text-3xl sm:text-4xl text-primary"></i></div>`;
        document.getElementById('exam-mode').classList.remove('hidden');
        document.getElementById('floating-lang-toggle')?.classList.add('hidden');

        try {
            let res1 = await fetch(`/api.php?action=get_review&result_id=${resultId}`);
            let resultData = await res1.json();
            if (!resultData.success) { alert("Không thể tải chi tiết bài làm."); exitExam(); return; }

            isReviewMode = true; isExamRunning = false;
            currentReviewTitle = resultData.data.exam_title || 'TOCFL Mock Test';
            userAnswers = {}; let skillChoice = 'both';
            
            if(resultData.data.details && resultData.data.details !== '{}') {
                try { 
                    userAnswers = JSON.parse(resultData.data.details); 
                    if(userAnswers['_skillChoice']) skillChoice = userAnswers['_skillChoice'];
                    if(userAnswers['_isCatMode']) isCatMode = true; else isCatMode = false;
                } catch(e) {}
            }

            listeningQuestions = []; readingQuestions = [];

            if (isCatMode && userAnswers['_catPath']) {
                listeningQuestions = userAnswers['_catPath'].Listening || [];
                readingQuestions = userAnswers['_catPath'].Reading || [];
            } else {
                let res2 = await fetch(`/api.php?action=get_exam_detail&exam_id=${examId}`);
                let examData = await res2.json();
                if (examData.success === false) {
                    if (examData.code === 'EXAM_LOCKED') {
                        const ok = await ensureExamUnlocked();
                        if (ok) { startReview(resultId, examId); return; }
                    } else {
                        alert('Không thể tải đề thi: ' + (examData.message || 'Lỗi không xác định'));
                    }
                    exitExam(); return;
                }
                examData.parts.forEach(part => {
                    let skillKey = part.skill_key || (part.skill_id == 1 ? 'Listening' : 'Reading');
                    part.groups.forEach(group => {
                        group.questions.forEach(q => {
                            // Câu Nghe: giữ nguyên thứ tự A/B/C/D gốc để khớp với audio đã ghi âm cố định.
                            if (skillKey !== 'Listening') shuffleQuestionOptions(q);
                            let obj = { part, group, question: q };
                            if(skillKey === 'Listening') { if(skillChoice === 'both' || skillChoice === 'listening') listeningQuestions.push(obj); }
                            else { if(skillChoice === 'both' || skillChoice === 'reading') readingQuestions.push(obj); }
                        });
                    });
                });
            }

            if (listeningQuestions.length > 0) currentSkill = 'Listening'; else currentSkill = 'Reading';
            currentSkillQs = currentSkill === 'Listening' ? listeningQuestions : readingQuestions;
            currentTestIdx = 0;
            
            document.getElementById('exam-icon').className = currentSkill === 'Listening' ? 'fa-solid fa-headphones text-sm' : 'fa-solid fa-book text-sm';
            document.getElementById('exam-timer').parentElement.classList.add('hidden');
            
            const actionBtn = document.getElementById('exam-action-btn');
            if (actionBtn) { actionBtn.innerHTML = 'Đóng lại'; actionBtn.setAttribute('onclick', 'exitExam()'); }
            document.getElementById('exam-title-display').innerText = "Xem lại: " + currentReviewTitle;

            lastGroupId = null;
            renderExamSidebar(); renderExamQuestion();
        } catch (e) { alert("Lỗi kết nối."); exitExam(); }
    }

    function startSkillSection() {
        if (isCatMode && !isReviewMode) {
            currentSkillQs = [];
            irtState[currentSkill] = { theta: catSeedTheta(), responses: [], itemCount: 0, groupCount: 0, currentGroupStartIdx: 0, se: 999 };
            loadNextCatGroup();
            if (!isExamRunning) return;
        } else {
            currentSkillQs = currentSkill === 'Listening' ? listeningQuestions : readingQuestions;
            if(currentSkillQs.length === 0) {
                if(currentSkill === 'Listening' && (userAnswers['_skillChoice'] === 'both' || userAnswers['_skillChoice'] === 'reading')) { currentSkill = 'Reading'; startSkillSection(); } 
                else { showExamResult(); }
                return;
            }
        }
        
        // Đếm ngược 1 LẦN DUY NHẤT cho TOÀN BÀI thi (Nghe + Đọc gộp chung), không reset
        // riêng từng phần nữa — chuyển từ Nghe sang Đọc giữa bài sẽ giữ nguyên thời gian còn lại.
        if (!examTimerInitialized) {
            examTimerInitialized = true;
            timeLeft = Math.max(300, computeTotalExamSeconds());
            updateExamTimerDisplay();
            clearInterval(examTimerInterval);
            examTimerInterval = setInterval(() => {
                timeLeft--; updateExamTimerDisplay();
                if(timeLeft <= 0) {
                    clearInterval(examTimerInterval);
                    alert('Hết giờ làm bài!');
                    if(!isReviewMode) showExamResult(); else exitExam();
                }
            }, 1000);
        }

        document.getElementById('exam-icon').className = currentSkill === 'Listening' ? 'fa-solid fa-headphones text-sm' : 'fa-solid fa-book text-sm';
        lastGroupId = null;
        if(!isCatMode || isReviewMode) { renderExamSidebar(); renderExamQuestion(); }
    }

    // Tham số dừng CAT theo chế độ.
    // floor = số câu tối thiểu, minGroups = số nhóm tối thiểu trước khi cho dừng-theo-SE
    // (đảm bảo theta được ước lượng từ đủ điểm độ khó khác nhau = thực sự thích ứng).
    function catStopParams(skill = currentSkill) {
        const sc = userAnswers['_skillChoice'] || 'both';
        if (!catShortMode) return { targetSE: 0.32, cap: 40, floor: 8, minGroups: 3 };
        const single = (sc === 'listening' || sc === 'reading');
        // Bài nhanh theo band (1 kỹ năng, thích ứng): 15-22 câu, SE 0.40.
        if (catBand && single) return { targetSE: 0.40, cap: 22, floor: 12, minGroups: 4 };
        let cap;
        if (single) cap = 26;
        else cap = (skill === 'Listening') ? 12 : 18;
        return { targetSE: 0.42, cap, floor: 6, minGroups: 2 };
    }

    // Tổng thời gian cho CẢ BÀI thi (Nghe + Đọc gộp), tính 1 lần khi bắt đầu — không phải mỗi phần.
    function computeTotalExamSeconds() {
        const sc = userAnswers['_skillChoice'] || 'both';
        const secL = 100, secR = 70; // Nghe cần thêm thời gian nghe audio
        if (isCatMode) {
            let total = 0;
            if (sc !== 'reading') total += catStopParams('Listening').cap * secL;
            if (sc !== 'listening') total += catStopParams('Reading').cap * secR;
            return total;
        }
        return listeningQuestions.length * secL + readingQuestions.length * secR;
    }

    // Trộn mảng (Fisher-Yates) — chọn ngẫu nhiên câu trong nhóm.
    function shuffleArr(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

    function loadNextCatGroup() {
        let state = irtState[currentSkill];
        let pool = catPoolFlat[currentSkill];
        let sc = userAnswers['_skillChoice'];
        const { targetSE, cap, floor, minGroups } = catStopParams();

        // Chỉ cho dừng-theo-SE khi đã đủ số câu (floor) VÀ đủ số nhóm (minGroups).
        const seEligible = state.itemCount >= (floor || 0) && (state.groupCount || 0) >= (minGroups || 0);
        // IRT stopping rule: (đủ điều kiện & SE nhỏ) OR chạm trần số câu OR pool rỗng
        if ((seEligible && state.se < targetSE) || state.itemCount >= cap || !pool || pool.length === 0) {
            if (currentSkill === 'Listening' && (sc === 'both' || sc === undefined || sc === null)) {
                currentSkill = 'Reading'; startSkillSection();
            } else {
                showExamResult();
            }
            return;
        }

        // Chọn group có b_param gần theta hiện tại nhất
        let theta = state.theta;
        let bestIdx = 0, bestDiff = Infinity;
        pool.forEach((item, i) => {
            let diff = Math.abs((item.group.b_param ?? 0) - theta);
            if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
        });

        let groupItem = pool.splice(bestIdx, 1)[0];

        // P1: giới hạn testlet.
        // - ĐỌC: giữ NGUYÊN thứ tự & đủ câu (API đã trả theo question_num) — không trộn, không cắt 3,
        //   để chỗ trống/câu hỏi khớp đúng đoạn văn cha (tránh loạn câu / lệch đáp án).
        // - NGHE: trộn & lấy tối đa 3 câu/nhóm (giữ adaptive, tránh phình đề).
        const stopSkill = () => {
            if (currentSkill === 'Listening' && (sc === 'both' || sc === undefined || sc === null)) { currentSkill = 'Reading'; startSkillSection(); }
            else { showExamResult(); }
        };

        let picked;
        if (currentSkill === 'Reading') {
            // ĐỌC: giữ NGUYÊN cả đoạn — KHÔNG cắt giữa passage (tránh câu hỏi mất ngữ cảnh đoạn văn).
            picked = groupItem.questions.slice();
            // Chặn trần ở BIÊN nhóm: nếu đã đạt tối thiểu (floor) mà thêm cả nhóm sẽ vượt cap → dừng hẳn,
            // không nhồi nửa đoạn. Nếu chưa đủ floor thì nhận trọn nhóm dù hơi vượt cap (để đo đủ tin cậy).
            if (state.itemCount >= (floor || 0) && state.itemCount + picked.length > cap) {
                pool.splice(bestIdx, 0, groupItem); // trả nhóm về pool (không dùng dở)
                stopSkill();
                return;
            }
        } else {
            // NGHE: trộn & lấy tối đa 3 câu/nhóm (câu độc lập, cắt giữa nhóm là an toàn).
            picked = shuffleArr(groupItem.questions.slice()).slice(0, 3);
            picked = picked.slice(0, Math.max(0, cap - state.itemCount));
        }
        if (picked.length === 0) { stopSkill(); return; } // đã đủ cap → dừng

        state.currentGroupStartIdx = currentSkillQs.length;
        picked.forEach(q => {
            currentSkillQs.push({ part: groupItem.part, group: groupItem.group, question: q, bParam: groupItem.group.b_param ?? 0, isAnchor: false });
        });

        currentTestIdx = state.currentGroupStartIdx;
        lastGroupId = null;
        renderExamSidebar(); renderExamQuestion();
    }

    function submitCatGroup() {
        let state = irtState[currentSkill];
        let groupQs = currentSkillQs.slice(state.currentGroupStartIdx);

        let unanswered = groupQs.filter(qObj => !userAnswers[qObj.question.id]);
        if (unanswered.length > 0) {
            let msg = groupQs.length === 1
                ? `Bạn chưa chọn đáp án cho câu này. Bài thi thích ứng (CAT) không cho phép sửa lại. Bạn chắc chắn muốn tiếp tục?`
                : `Bạn còn ${unanswered.length} câu chưa chọn đáp án trong cụm này. Bài thi thích ứng (CAT) không cho phép sửa lại. Bạn vẫn muốn tiếp tục?`;
            if (!confirm(msg)) return;
        }

        let bParam = groupQs[0].bParam;

        groupQs.forEach(qObj => {
            let qId = qObj.question.id;
            let uAns = userAnswers[qId];
            let correctOpt = qObj.question.options.find(o => parseInt(o.is_correct) === 1);
            let isCorrect = !!(correctOpt && uAns == correctOpt.id);

            // Mỗi câu trong group đóng góp 1 response vào IRT (dùng b_param của group); lưu group id để hiệu chỉnh LD.
            state.responses.push({ b: bParam, correct: isCorrect ? 1 : 0, g: qObj.group.id });

            if (uAns && !savedCatQuestions.has(qId)) {
                savedCatQuestions.add(qId);
                saveCatResponseToServer(qObj, isCorrect);
            }
        });

        // Cập nhật theta và SE sau khi nộp group
        state.theta = mleTheta(state.responses);
        state.se    = irtSE(state.theta, state.responses);
        state.itemCount += groupQs.length;
        state.groupCount = (state.groupCount || 0) + 1;

        loadNextCatGroup();
    }

    // ── IRT Rasch 1PL Math ──────────────────────────────────────────
    function raschP(theta, b) {
        return 1 / (1 + Math.exp(-(theta - b)));
    }

    // MAP = MLE + prior N(0, 2.5²). Hội tụ cho MỌI chuỗi đáp án (kể cả toàn đúng/toàn sai) mà KHÔNG cần
    // hack ±2; prior yếu nên ước lượng nội bộ ≈ MLE thuần, chỉ ổn định phần biên.
    function mleTheta(responses) {
        if (responses.length === 0) return 0;
        const PRIOR_VAR = 6.25; // sigma = 2.5
        let theta = 0;
        for (let i = 0; i < 50; i++) {
            let grad = -theta / PRIOR_VAR, hess = 1 / PRIOR_VAR;
            responses.forEach(r => {
                const p = raschP(theta, r.b);
                grad += (r.correct - p);
                hess += p * (1 - p);
            });
            if (hess === 0) break;
            const delta = grad / hess;
            theta = Math.max(-4, Math.min(4, theta + delta));
            if (Math.abs(delta) < 0.001) break;
        }
        return Math.round(theta * 1000) / 1000;
    }

    // SE của theta — hiệu chỉnh phụ thuộc cục bộ (local dependence): câu chung group_id bị tương quan →
    // chia info của mỗi nhóm cho sqrt(số câu cùng nhóm) để SE phản ánh trung thực sai số (tránh tự tin ảo).
    function irtSE(theta, responses) {
        if (responses.length === 0) return 999;
        const byGroup = {};
        responses.forEach(r => {
            const p = raschP(theta, r.b);
            const key = (r.g != null) ? ('g' + r.g) : ('b' + r.b);
            if (!byGroup[key]) byGroup[key] = { info: 0, n: 0 };
            byGroup[key].info += p * (1 - p);
            byGroup[key].n += 1;
        });
        let info = 0;
        for (const k in byGroup) info += byGroup[k].info / Math.sqrt(byGroup[k].n);
        return info > 0 ? 1 / Math.sqrt(info) : 999;
    }

    // Chuyển theta (thang độ khó b_param) → điểm TOCFL 0–700, hiệu chỉnh theo TÂM các cấp độ (level 1-6):
    // θ≈-1.85→L1(A1), -0.75→L2(A2), 0→L3(B1), 0.85→L4(B2), 1.6→L5(C1), 2.5→L6(C2).
    // Giúp năng lực trung bình (θ=0) ra ~B1 (~470) thay vì tụt về dưới A1, và giảm lệch điểm quá sâu.
    function thetaToScore(theta) {
        const A = [[-3.0, 0], [-2.0, 250], [-1.0, 375], [0.0, 470], [1.0, 555], [2.0, 630], [3.0, 700]];
        if (theta <= A[0][0]) return 0;
        if (theta >= A[A.length - 1][0]) return 700;
        for (let i = 1; i < A.length; i++) {
            if (theta <= A[i][0]) {
                const [x0, y0] = A[i - 1], [x1, y1] = A[i];
                return Math.round(y0 + (y1 - y0) * (theta - x0) / (x1 - x0));
            }
        }
        return 700;
    }
    // ────────────────────────────────────────────────────────────────

    // ── Gợi ý khi làm bài: Pinyin (dùng local pinyin-pro) + Dịch/Mẹo ──
    let __pinyinLoadPromise = null;
    function loadPinyinPro() {
        if (window.pinyinPro && window.pinyinPro.pinyin) return Promise.resolve();
        if (__pinyinLoadPromise) return __pinyinLoadPromise;
        __pinyinLoadPromise = new Promise((resolve, reject) => {
            let s = document.createElement('script');
            s.src = '/static/js/pinyin-pro.js';
            s.onload = () => {
                if (window.pinyinPro && window.pinyinPro.pinyin) {
                    if (typeof initPinyinCustomDict === 'function') {
                        try { initPinyinCustomDict(); } catch (e) {}
                    }
                    resolve();
                } else {
                    __pinyinLoadPromise = null;
                    reject(new Error('no global'));
                }
            };
            s.onerror = () => {
                __pinyinLoadPromise = null;
                reject(new Error('load fail'));
            };
            document.head.appendChild(s);
        });
        return __pinyinLoadPromise;
    }

    // Trạng thái gợi ý — giữ xuyên suốt các câu (bật 1 lần, câu sau tự áp dụng)
    let hintPanelOpen = false, hintShowPinyin = false, hintShowTranslate = false;
    let hintTranslateCache = {}; // chữ Hán -> bản dịch VN (cache để đỡ gọi API lặp)

    // Tự động chuyển sang câu tiếp theo ngay khi chọn đáp án (áp dụng cả Nghe lẫn Đọc).
    // Mặc định BẬT; người thi có thể tắt để tự kiểm tra lại câu trả lời trước khi qua câu mới.
    let autoNextOnAnswer = localStorage.getItem('exam_auto_next') !== null ? (localStorage.getItem('exam_auto_next') === '1') : true;
    function toggleAutoNext() {
        autoNextOnAnswer = !autoNextOnAnswer;
        localStorage.setItem('exam_auto_next', autoNextOnAnswer ? '1' : '0');
        renderExamQuestion(true);
    }

    function toggleExamHint() {
        hintPanelOpen = !hintPanelOpen;
        const panel = document.getElementById('exam-hint-panel');
        if (panel) panel.classList.toggle('hidden', !hintPanelOpen);
    }

    // 2 công tắc phân cấp: Dịch (cấp cao) bao hàm Pinyin (cấp thấp)
    function onHintToggle(which) {
        const cbP = document.getElementById('hint-toggle-pinyin');
        const cbT = document.getElementById('hint-toggle-translate');
        if (which === 'pinyin') {
            hintShowPinyin = cbP.checked;
            if (!hintShowPinyin) { hintShowTranslate = false; if (cbT) cbT.checked = false; } // tắt pinyin thì tắt luôn dịch
        } else {
            hintShowTranslate = cbT.checked;
            if (hintShowTranslate) { hintShowPinyin = true; if (cbP) cbP.checked = true; } // bật dịch thì bật luôn pinyin
        }
        applyExamHint();
    }

    // Gom chữ Hán của câu hiện tại: đề bài + câu hỏi (bỏ nếu chỉ là số câu) + toàn bộ đáp án
    function examHintSegments() {
        let qObj = currentSkillQs[currentTestIdx];
        if (!qObj) return [];
        let segs = [];
        let st = qObj.group && qObj.group.shared_text;
        if (st && st.trim()) segs.push({ label: 'Đề', zh: getChar(st) });
        let qt = (qObj.question && qObj.question.question_text) ? qObj.question.question_text.trim() : '';
        // Bỏ qua question_text chỉ là số câu (vd "46." hoặc "第46題") — không có nghĩa để phiên âm
        if (qt && !/^[\s\d.．、]+$/.test(qt) && !/^第?\s*\d+\s*題[。.\s]*$/.test(qt)) segs.push({ label: 'Hỏi', zh: getChar(qt) });
        (qObj.question.options || []).forEach((opt, i) => {
            // Luôn dùng nhãn theo VỊ TRÍ SAU KHI XÁO (giống renderExamQuestion), không dùng opt.label gốc
            // từ DB — nếu không, gợi ý nghĩa sẽ bị lệch nhãn so với đáp án thật hiển thị trên màn hình.
            if (opt.option_text && opt.option_text.trim()) segs.push({ label: ['A','B','C','D'][i] || '•', zh: getChar(opt.option_text) });
        });
        return segs;
    }

    async function applyExamHint() {
        const box = document.getElementById('exam-hint-content');
        if (!box) return;
        if (!hintShowPinyin && !hintShowTranslate) { box.classList.add('hidden'); box.innerHTML = ''; return; }
        box.classList.remove('hidden');

        let segs = examHintSegments();
        if (!segs.length) { box.innerHTML = '<span class="text-slate-400 text-xs">Câu này không có chữ Hán để hiển thị gợi ý.</span>'; return; }

        let pyReady = true;
        if (hintShowPinyin) { try { await loadPinyinPro(); } catch (e) { pyReady = false; } }

        let html = '';
        segs.forEach((s, idx) => {
            let py = (hintShowPinyin && pyReady && window.pinyinPro) ? window.pinyinPro.pinyin(s.zh, { toneType: 'symbol', type: 'string' }) : '';
            html += `<div class="py-1.5 ${idx > 0 ? 'border-t border-slate-100' : ''} flex gap-2">
                <span class="text-[10px] font-black text-slate-400 uppercase mt-0.5 shrink-0 w-8">${s.label}</span>
                <div class="flex-1 min-w-0">
                    <div class="font-tc text-slate-800" style="font-size:15px">${s.zh}</div>
                    ${py ? `<div class="text-primary text-xs font-semibold mt-0.5">${py}</div>` : (hintShowPinyin && !pyReady ? '<div class="text-td-red text-xs mt-0.5">Không tải được phiên âm (mạng?)</div>' : '')}
                    ${hintShowTranslate ? `<div class="text-td-green text-xs font-medium mt-0.5 hint-vi" data-zh="${encodeURIComponent(s.zh)}"><i class="fa-solid fa-spinner fa-spin"></i></div>` : ''}
                </div>
            </div>`;
        });
        box.innerHTML = html;

        if (hintShowTranslate) {
            box.querySelectorAll('.hint-vi').forEach(async el => {
                let zh = decodeURIComponent(el.getAttribute('data-zh'));
                let vi = await translateToVi(zh);
                el.innerHTML = vi ? vi : '<span class="text-slate-400">(chưa dịch được)</span>';
            });
        }
    }

    // Dịch chữ Hán -> tiếng Việt. Ưu tiên Backend (/api.php?action=translate_zh), chỉ fallback trực tiếp khi API cục bộ lỗi.
    async function translateToVi(zh) {
        if (hintTranslateCache[zh] !== undefined) return hintTranslateCache[zh];
        let vi = '';
        // 1) Ưu tiên Backend API (/api.php?action=translate_zh — có từ điển + cache server chuẩn Đài Loan)
        try {
            let res0 = await fetch('/api.php?action=translate_zh&q=' + encodeURIComponent(zh));
            if (res0.ok) {
                let d0 = await res0.json();
                if (d0 && d0.success && d0.data && d0.data.vi) vi = d0.data.vi;
            }
        } catch (e) { }
        // 2) Fallback duy nhất nếu API cục bộ lỗi / chưa có bản dịch
        if (!vi) {
            try {
                let url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-TW&tl=vi&dt=t&q=' + encodeURIComponent(zh);
                let res = await fetch(url);
                if (res.ok) {
                    let data = await res.json();
                    if (Array.isArray(data) && Array.isArray(data[0])) vi = data[0].map(seg => (seg && seg[0]) ? seg[0] : '').join('');
                }
            } catch (e) { vi = ''; }
        }
        if (vi) hintTranslateCache[zh] = vi;
        return vi;
    }
    // ────────────────────────────────────────────────────────────────

    function updateExamTimerDisplay() {
        let m = Math.floor(timeLeft / 60); let s = timeLeft % 60;
        const tEl = document.getElementById('exam-timer');
        if (tEl) tEl.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        // Cảnh báo trực quan khi còn <= 60 giây
        const pill = document.getElementById('exam-timer-pill');
        if (pill) {
            if (timeLeft <= 60 && timeLeft > 0) {
                pill.classList.add('bg-red-500/40', 'ring-red-300', 'animate-pulse');
            } else {
                pill.classList.remove('bg-red-500/40', 'ring-red-300', 'animate-pulse');
            }
        }
    }

    function updateExamProgress() {
        const bar = document.getElementById('exam-progress-bar');
        const total = (currentSkillQs && currentSkillQs.length) ? currentSkillQs.length : 0;
        const pct = total > 0 ? Math.min(100, Math.round(((currentTestIdx + 1) / total) * 100)) : 0;
        if (bar) bar.style.width = pct + '%';
        const pctEl = document.getElementById('exam-progress-pct');
        if (pctEl) pctEl.textContent = pct + '%';
    }

    // Cỡ chữ đề bài cố định 100% (tính năng tăng/giảm cỡ chữ đã bỏ)
    function applyExamFont() {
        const area = document.getElementById('exam-content-area');
        if (area) area.style.setProperty('--exam-fs', 1);
    }

    function renderExamSidebar() {
        let html = '';
        currentSkillQs.forEach((q, idx) => {
            let isAnswered = userAnswers[q.question.id] !== undefined;
            let isActive = idx === currentTestIdx;
            let stateClass = '';

            if (isReviewMode) {
                let uAns = userAnswers[q.question.id];
                let correctOpt = q.question.options.find(o => parseInt(o.is_correct) === 1);
                if (uAns == (correctOpt ? correctOpt.id : -1)) stateClass = 'bg-emerald-50 text-td-green shadow-sm';
                else stateClass = 'bg-red-50 text-td-red shadow-sm';
            } else if (isActive) {
                stateClass = 'bg-gradient-to-br from-[#0A93D4] via-[#027AB3] to-[#015E8C] text-white shadow-lg font-black scale-105';
            } else if (isAnswered) {
                stateClass = 'bg-accent/30 text-primaryDark font-bold';
            } else {
                stateClass = 'bg-white text-slate-400 font-bold shadow-sm md:hover:text-primary';
            }

            // TRONG CHẾ ĐỘ CAT: KHÔNG CHO PHÉP NHẤN VÀO SIDEBAR ĐỂ ĐỔI CÂU
            let clickEvt = (isCatMode && !isReviewMode) ? '' : `onclick="jumpToExamQuestion(${idx})"`;
            let cursorCls = (isCatMode && !isReviewMode) ? (idx === currentTestIdx ? 'cursor-default' : 'cursor-not-allowed opacity-40') : 'cursor-pointer';

            html += `<button ${clickEvt} class="${cursorCls} h-9 sm:h-10 rounded-xl ${stateClass} transition-all text-xs sm:text-sm flex items-center justify-center outline-none">${idx+1}</button>`;
        });
        document.getElementById('exam-q-grid').innerHTML = html;
    }

    function jumpToExamQuestion(idx) {
        // Bài CAT: khóa nhảy câu ở phần Nghe (đáp án đã gửi server, xem navExam()).
        // Bài cố định (non-CAT) thì cho phép quay lại sửa.
        if(currentSkill === 'Listening' && !isReviewMode && isCatMode) return;
        currentTestIdx = idx;
        if(window.innerWidth < 768) {
            const sidebar = document.getElementById('exam-sidebar');
            if(!sidebar.classList.contains('-translate-x-full')) toggleExamSidebar();
        }
        renderExamQuestion();
    }

    function renderExamQuestion(preserveState = false) {
        if (typeof preloadAudio === 'function' && currentSkill === 'Listening' && Array.isArray(currentSkillQs)) {
            const nextAudio = [];
            for (let i = currentTestIdx + 1; i <= currentTestIdx + 2 && i < currentSkillQs.length; i++) {
                const nq = currentSkillQs[i];
                if (nq) {
                    if (nq.question_audio_url) nextAudio.push(nq.question_audio_url);
                    if (nq.shared_audio_url) nextAudio.push(nq.shared_audio_url);
                }
            }
            if (nextAudio.length > 0) preloadAudio(nextAudio);
        }
        if (window.isTogglingCharMode) preserveState = true;

        if (!preserveState) {
            clearTimeout(nextQuestionTimeout); 
            globalAudioPlayer.pause(); 
            audioIsPlaying = false;
        }
        
        if(currentTestIdx >= currentSkillQs.length) {
            if(currentSkill === 'Listening' && (userAnswers['_skillChoice'] === 'both' || userAnswers['_skillChoice'] === 'reading' || userAnswers['_skillChoice'] === undefined)) {
                currentSkill = 'Reading'; currentTestIdx = 0; currentSkillQs = readingQuestions;
                if(!isReviewMode) { alert('Đã hoàn thành phần Nghe. Hệ thống chuyển sang phần Đọc.'); startSkillSection(); }
                else { document.getElementById('exam-icon').className = 'fa-solid fa-book text-sm'; renderExamSidebar(); renderExamQuestion(); }
            } else {
                if(!isReviewMode) showExamResult(); else exitExam(); 
            }
            return;
        }
        
        renderExamSidebar();
        updateExamProgress();
        applyExamFont();
        const qObj = currentSkillQs[currentTestIdx];
        const group = qObj.group;
        const q = qObj.question;

        let shouldResetScroll = (!preserveState && lastGroupId !== group.id);
        lastGroupId = group.id;

        const btnPrev = document.getElementById('exam-btn-prev');
        // TRONG CHẾ ĐỘ CAT: KHÓA NÚT QUAY LẠI HOÀN TOÀN
        if (isCatMode && !isReviewMode) {
            btnPrev.style.display = 'none';
        } else {
            // Bài thi cố định (không CAT): cho phép quay lại sửa cả câu Nghe lẫn Đọc.
            btnPrev.style.display = currentTestIdx > 0 ? 'flex' : 'none';
        }

        let contentHtml = `
            <div class="max-w-6xl mx-auto w-full p-4 md:p-6 lg:p-8">
                <div class="mb-6">
                    <div class="flex flex-col gap-3">
                        <div class="flex items-center justify-between gap-2.5 flex-wrap">
                            <div class="flex items-center gap-2.5">
                                <div class="px-3.5 py-1.5 rounded-full bg-white shadow-sm text-${currentSkill === 'Listening' ? 'primary' : 'td-green'} font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5">
                                    <i class="${currentSkill === 'Listening' ? 'fa-solid fa-headphones' : 'fa-solid fa-book-open'}"></i> Phần ${currentSkill === 'Listening' ? 'Nghe' : 'Đọc'}
                                </div>
                                <div class="px-3.5 py-1.5 rounded-full bg-primary/10 text-sm font-black text-primary">Câu ${currentTestIdx + 1} <span class="text-primary/50 font-bold">/ ${currentSkillQs.length}</span></div>
                            </div>
                            </div>
                        ${qObj.part && qObj.part.instruction ? `<div class="text-sm sm:text-base font-bold text-slate-600 bg-white shadow-sm px-4 py-3 rounded-2xl w-full font-tc leading-relaxed">${getChar(qObj.part.instruction)}</div>` : ''}
                    </div>
                </div>
        `;

        let hasOptionImages = q.options.some(opt => opt.option_image_url && opt.option_image_url.trim() !== '');

        // ===== Bố cục 1 cột dọc, full chiều ngang =====
        // Thứ tự: Đề bài → Thanh âm thanh → Câu hỏi → Ảnh minh hoạ → Đáp án
        contentHtml += `<div class="max-w-3xl mx-auto w-full flex flex-col gap-5 sm:gap-6">`;

        // 0) Nút Gợi ý — 2 công tắc phân cấp (Pinyin / Pinyin + Dịch), phủ cả câu hỏi + đáp án.
        //    Chỉ hiện ở phần ĐỌC (phần Nghe gần như vô nghĩa vì kỹ năng là nghe hiểu).
        if (!isReviewMode) {
            contentHtml += `
            <div class="flex flex-col gap-2 -mb-1">
                <div class="flex justify-end items-center gap-2">
                    <button type="button" id="exam-autonext-btn" onclick="toggleAutoNext()"
                        class="inline-flex items-center gap-1.5 rounded-full ${autoNextOnAnswer ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-500 hover:text-primary hover:border-primary/40'} border shadow-sm px-3 py-1.5 text-xs font-bold transition-all active:scale-95">
                        <i class="fa-solid ${autoNextOnAnswer ? 'fa-forward' : 'fa-hand'}"></i> ${autoNextOnAnswer ? 'Tự động chuyển câu' : 'Chuyển câu thủ công'}
                    </button>
                    ${currentSkill === 'Reading' ? `
                    <button type="button" id="exam-hint-btn" onclick="toggleExamHint()"
                        class="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/40 shadow-sm px-3 py-1.5 text-xs font-bold transition-all active:scale-95">
                        <i class="fa-regular fa-lightbulb"></i> Gợi ý
                    </button>` : ''}
                </div>
                ${currentSkill === 'Reading' ? `
                <div id="exam-hint-panel" class="${hintPanelOpen ? '' : 'hidden'} rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
                    <div class="flex flex-col divide-y divide-slate-100">
                        <label class="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none">
                            <span class="flex items-center gap-2 text-sm font-bold text-slate-700"><i class="fa-solid fa-language text-primary w-4 text-center"></i> Phiên âm Pinyin</span>
                            <input type="checkbox" id="hint-toggle-pinyin" onchange="onHintToggle('pinyin')" ${hintShowPinyin ? 'checked' : ''} class="sr-only peer">
                            <span class="relative w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow after:transition-all peer-checked:after:translate-x-4"></span>
                        </label>
                        <label class="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none">
                            <span class="flex items-center gap-2 text-sm font-bold text-slate-700"><i class="fa-solid fa-earth-asia text-td-green w-4 text-center"></i> Pinyin + Dịch tiếng Việt</span>
                            <input type="checkbox" id="hint-toggle-translate" onchange="onHintToggle('translate')" ${hintShowTranslate ? 'checked' : ''} class="sr-only peer">
                            <span class="relative w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-td-green transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow after:transition-all peer-checked:after:translate-x-4"></span>
                        </label>
                    </div>
                    <div id="exam-hint-content" class="hidden px-4 py-3 border-t border-slate-100 bg-slate-50/60 text-sm text-slate-700 leading-relaxed"></div>
                </div>` : ''}
            </div>`;
        }

        // 1) Đề bài (đoạn văn đọc / hội thoại)
        if (group.shared_text) {
            contentHtml += `<div class="bg-white rounded-3xl shadow-lg border-b-4 border-primary/20 p-6 md:p-8">
                <div class="text-slate-800 leading-[1.9] font-tc font-bold" style="font-size:calc(var(--exam-fs,1) * 21px)">${highlightActiveBlank(getChar(group.shared_text), q.question_text).replace(/\n/g, '<br>')}</div>
            </div>`;
        }

        // 2) Thanh âm thanh — ngay dưới đề bài, kéo dài full chiều ngang
        if (currentSkill === 'Listening') {
            if (isReviewMode) {
                let audioHtml = '';
                if (group.shared_audio_url && (currentTestIdx === 0 || currentSkillQs[currentTestIdx-1].group.id !== group.id)) {
                    audioHtml += `<p class="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide"><i class="fa-solid fa-music mr-1"></i> Audio chung:</p><audio controls src="${group.shared_audio_url}" class="w-full h-9 sm:h-10 mb-4 outline-none"></audio>`;
                }
                if (q.question_audio_url) {
                    audioHtml += `<p class="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide"><i class="fa-solid fa-headphones mr-1"></i> Audio câu hỏi:</p><audio controls src="${q.question_audio_url}" class="w-full h-9 sm:h-10 outline-none"></audio>`;
                }
                if (audioHtml) contentHtml += `<div class="bg-white p-4 sm:p-5 rounded-2xl shadow-md border-b-4 border-primary/20">${audioHtml}</div>`;
            } else {
                contentHtml += `
                <div id="exam-audio-container" class="bg-white p-4 sm:p-5 rounded-2xl shadow-md border-b-4 border-primary/20 flex items-center gap-4 w-full">
                    <div class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0"><i class="fa-solid fa-volume-high"></i></div>
                    <div class="flex-1"><div class="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden"><div id="exam-audio-bar" class="h-full bg-accent w-0 transition-all duration-200 rounded-full"></div></div></div>
                    <div id="exam-audio-time" class="text-[11px] font-bold text-slate-400 font-mono w-10 text-right">00:00</div>
                </div>`;
            }
        }

        // 3) Câu hỏi — bỏ số gốc ở đầu ("47." / "16、"), số tuần tự đã có ở sidebar/counter
        let qDisplayText = stripLeadingQNum(q.question_text);
        if (qDisplayText) contentHtml += `<div class="bg-primaryDark/[0.04] border-2 border-primary/20 rounded-3xl px-5 py-5 sm:px-7 sm:py-6">
            <h3 class="font-black text-brandNavy leading-relaxed font-tc" style="font-size:calc(var(--exam-fs,1) * 27px)">${getChar(qDisplayText)}</h3>
        </div>`;

        // 4) Ảnh minh hoạ — đặt sau câu hỏi, trên nền trắng thoáng
        if (group.shared_image_url || q.question_image_url) {
            contentHtml += `<div class="bg-white rounded-3xl shadow-sm p-5 sm:p-8 flex flex-col items-center gap-5">`;
            if (group.shared_image_url) contentHtml += `<img src="${group.shared_image_url}" loading="lazy" class="exam-zoomable-img cursor-zoom-in max-w-full max-h-[360px] object-contain rounded-xl">`;
            if (q.question_image_url) contentHtml += `<img src="${q.question_image_url}" loading="lazy" class="exam-zoomable-img cursor-zoom-in max-w-full max-h-[360px] object-contain rounded-xl">`;
            contentHtml += `</div>`;
        }

        // 5) Đáp án
        let gridCols = hasOptionImages ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1';
        
        let optsHtml = '';

        optsHtml += `<div class="grid ${gridCols} gap-3.5 sm:gap-4">`;
        let optionLabels = ['A', 'B', 'C', 'D'];
        
        q.options.forEach((opt, index) => {
            let isSelected = userAnswers[q.id] == opt.id;
            let isActuallyCorrect = parseInt(opt.is_correct) === 1;
            let lbl = optionLabels[index];
            let wrapperClass = 'bg-white border-b-4 border-slate-200 shadow-sm md:hover:border-primary/40 md:hover:-translate-y-0.5 transition-all';
            let circleClass = 'bg-slate-100 text-slate-500';

            if (isReviewMode) {
                wrapperClass = 'bg-white border-b-4 border-slate-200 opacity-60';
                if (isActuallyCorrect) { wrapperClass = (hasOptionImages ? 'bg-white' : 'bg-emerald-50') + ' border-b-4 border-td-green shadow-sm relative overflow-hidden'; circleClass = 'bg-td-green text-white'; }
                else if (isSelected && !isActuallyCorrect) { wrapperClass = (hasOptionImages ? 'bg-white' : 'bg-red-50') + ' border-b-4 border-td-red shadow-sm relative overflow-hidden'; circleClass = 'bg-td-red text-white'; }
            } else {
                if (isSelected) { wrapperClass = (hasOptionImages ? 'bg-white' : 'bg-primary/5') + ' border-b-4 border-primary ring-2 ring-primary shadow-md -translate-y-0.5'; circleClass = 'bg-primary text-white'; }
            }

            let optTextContent = opt.option_text ? getChar(opt.option_text) : '';
            let clickEvt = isReviewMode ? '' : `onclick="selectExamOption(${q.id}, ${opt.id})"`;
            let cursorCls = isReviewMode ? 'cursor-default' : 'cursor-pointer';
            let flexDir = hasOptionImages ? 'flex-col items-center text-center justify-center p-4 sm:p-6' : 'flex-row items-center p-4 md:p-5';
            let markerMargin = hasOptionImages ? 'mb-3' : 'mr-3.5 sm:mr-4';

            optsHtml += `
            <label class="${cursorCls} flex ${flexDir} rounded-2xl ${wrapperClass}" ${clickEvt}>
                ${isReviewMode && isActuallyCorrect ? `<div class="absolute right-0 top-0 w-0 h-0 border-[16px] border-transparent border-t-td-green border-r-td-green z-0"></div><i class="fa-solid fa-check absolute right-1.5 top-1.5 text-white text-[8px] z-10"></i>` : ''}
                ${isReviewMode && isSelected && !isActuallyCorrect ? `<div class="absolute right-0 top-0 w-0 h-0 border-[16px] border-transparent border-t-td-red border-r-td-red z-0"></div><i class="fa-solid fa-xmark absolute right-2 top-1.5 text-white text-[8px] z-10"></i>` : ''}

                <div class="exam-opt-marker w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-black text-base sm:text-xl shrink-0 transition-colors z-10 ${markerMargin} ${circleClass}">${lbl}</div>
                <div class="flex-1 font-bold text-slate-700 font-tc leading-relaxed z-10 w-full" style="font-size:calc(var(--exam-fs,1) * 20px)">
                    ${optTextContent ? `<span>${optTextContent}</span>` : ''}
                    ${opt.option_image_url ? `<img src="${opt.option_image_url}" loading="lazy" class="exam-zoomable-img cursor-zoom-in max-w-full ${hasOptionImages ? 'h-[150px] sm:h-[170px]' : 'max-h-[110px]'} object-contain mx-auto rounded-xl ${optTextContent ? 'mt-3' : ''}">` : ''}
                </div>
                ${!isReviewMode ? `<input type="radio" name="q_${q.id}" value="${opt.id}" class="hidden" ${isSelected ? 'checked' : ''}>` : ''}
            </label>`;
        });
        optsHtml += '</div>';
        contentHtml += optsHtml;
        contentHtml += `</div>`; // đóng cột đơn
        contentHtml += `</div>`; // đóng container ngoài
        
        const contentArea = document.getElementById('exam-content-area');
        let savedContentScroll = contentArea ? contentArea.scrollTop : 0;
        contentArea.innerHTML = contentHtml;
        if (!shouldResetScroll) contentArea.scrollTop = savedContentScroll; else contentArea.scrollTop = 0;

        // Áp dụng lại gợi ý (pinyin/dịch) cho câu mới nếu người dùng đã bật công tắc
        if (!isReviewMode && (hintShowPinyin || hintShowTranslate)) applyExamHint();

        const btnNext = document.getElementById('exam-btn-next');

        if(currentSkill === 'Listening' && !isReviewMode) {
            btnNext.classList.add('opacity-50', 'pointer-events-none'); 
            
            if (!preserveState) {
                let audioList = [];
                let isFirstInGroup = currentTestIdx === 0 || currentSkillQs[currentTestIdx-1].group.id !== group.id;
                if(isFirstInGroup && group.shared_audio_url) audioList.push(group.shared_audio_url);
                if(q.question_audio_url) audioList.push(q.question_audio_url);
                // Dừng 800ms trước khi phát audio câu mới, tránh cảm giác dồn dập khi chuyển câu.
                clearTimeout(window._examAudioStartTimeout);
                window._examAudioStartTimeout = setTimeout(() => playExamAudioSequence(audioList), 800);
            }
        } else {
            btnNext.classList.remove('opacity-50', 'pointer-events-none');
        }

        if (isCatMode && !isReviewMode && currentTestIdx === currentSkillQs.length - 1) {
            // Ở CHẾ ĐỘ CAT, NẾU LÀ CÂU CUỐI CỦA CỤM THÌ BẤM ĐỂ NỘP CỤM / ĐI TIẾP
            btnNext.innerHTML = `<span class="hidden sm:inline">Tiếp tục</span> <i class="fa-solid fa-arrow-right md:ml-2 text-xs"></i>`;
            btnNext.setAttribute('onclick', 'submitCatGroup()');
            btnNext.className = 'px-8 py-3 sm:px-10 bg-accent text-primaryDark rounded-2xl font-black hover:bg-accentHover active:scale-95 transition-all shadow-lg flex items-center gap-2 text-sm sm:text-base outline-none';
        } else if (currentTestIdx === currentSkillQs.length - 1) {
            if (currentSkill === 'Reading' || (currentSkill === 'Listening' && (userAnswers['_skillChoice'] === 'listening'))) {
                btnNext.innerHTML = isReviewMode ? `Hoàn tất <i class="fa-solid fa-check"></i>` : `Nộp bài <i class="fa-solid fa-check"></i>`;
                btnNext.setAttribute('onclick', isReviewMode ? "window.location.href='/'" : 'confirmExitExam()');
                btnNext.className = 'px-8 py-3 sm:px-10 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black hover:shadow-xl active:scale-95 transition-all shadow-lg flex items-center gap-2 text-sm sm:text-base outline-none';
            } else {
                btnNext.innerHTML = `<span class="hidden md:inline">Chuyển sang Đọc</span> <i class="fa-solid fa-arrow-right md:ml-2 text-xs"></i>`;
                btnNext.setAttribute('onclick', 'navExam(1)');
                btnNext.className = 'px-8 py-3 sm:px-10 bg-gradient-to-r from-[#0A93D4] via-[#027AB3] to-[#015E8C] text-white rounded-2xl font-black hover:shadow-xl active:scale-95 transition-all shadow-lg flex items-center gap-2 text-sm sm:text-base outline-none';
            }
        } else {
            // ĐANG Ở GIỮA CỤM
            btnNext.innerHTML = `<span class="hidden sm:inline">Câu tiếp</span> <i class="fa-solid fa-arrow-right md:ml-2 text-xs"></i>`;
            btnNext.setAttribute('onclick', 'navExam(1)');
            btnNext.className = 'px-8 py-3 sm:px-10 bg-gradient-to-r from-[#0A93D4] via-[#027AB3] to-[#015E8C] text-white rounded-2xl font-black hover:shadow-xl active:scale-95 transition-all shadow-lg flex items-center gap-2 text-sm sm:text-base outline-none';
        }
    }

    function selectExamOption(qId, optId) {
        // Chặn sự kiện click "cũ" (VD: timeout tự-chuyển-câu vừa chuyển sang câu mới
        // ngay trước khi click này được xử lý) để không bị nhảy/bỏ qua câu kế tiếp.
        if(!currentSkillQs[currentTestIdx] || currentSkillQs[currentTestIdx].question.id !== qId) return;
        userAnswers[qId] = optId;
        if(currentSkill === 'Reading') renderExamSidebar();
        
        const labels = document.querySelectorAll(`input[name="q_${qId}"]`);
        labels.forEach(inp => {
            const parent = inp.closest('label');
            const marker = parent.querySelector('.exam-opt-marker');
            const hasOptImg = parent.querySelector('img') !== null;
            if(inp.value == optId) {
                parent.classList.add('border-primary', 'ring-2', 'ring-primary', 'shadow-md', '-translate-y-0.5');
                parent.classList.remove('border-slate-200', 'shadow-sm', 'md:hover:border-primary/40', 'md:hover:-translate-y-0.5');
                if (hasOptImg) { parent.classList.add('bg-white'); parent.classList.remove('bg-primary/5'); }
                else { parent.classList.add('bg-primary/5'); parent.classList.remove('bg-white'); }
                marker.classList.add('bg-primary', 'text-white');
                marker.classList.remove('bg-slate-100', 'text-slate-500');
            } else {
                parent.classList.remove('bg-primary/5', 'border-primary', 'ring-2', 'ring-primary', 'shadow-md', '-translate-y-0.5');
                parent.classList.add('bg-white', 'border-slate-200', 'shadow-sm', 'md:hover:border-primary/40', 'md:hover:-translate-y-0.5');
                marker.classList.remove('bg-primary', 'text-white');
                marker.classList.add('bg-slate-100', 'text-slate-500');
            }
        });

        if(autoNextOnAnswer && (currentSkill !== 'Listening' || !audioIsPlaying)) {
            clearTimeout(nextQuestionTimeout);
            if(isCatMode && currentTestIdx === currentSkillQs.length - 1) return;
            navExam(1);
        }
    }

    // Phóng to ảnh minh hoạ/đáp án khi click (ảnh trong đề thi thường nhỏ, khó xem chi tiết).
    function openExamImageLightbox(url) {
        let lb = document.getElementById('exam-img-lightbox');
        if (!lb) {
            lb = document.createElement('div');
            lb.id = 'exam-img-lightbox';
            lb.className = 'fixed inset-0 bg-black/85 z-[999] flex items-center justify-center p-4 sm:p-8 cursor-zoom-out';
            lb.innerHTML = `<img id="exam-img-lightbox-img" class="max-w-full max-h-full object-contain rounded-xl shadow-2xl">`;
            lb.onclick = () => lb.remove();
            document.body.appendChild(lb);
        }
        document.getElementById('exam-img-lightbox-img').src = url;
    }
    // Ủy quyền sự kiện 1 lần duy nhất — vẫn hoạt động với ảnh được render lại mỗi câu hỏi.
    document.addEventListener('click', (e) => {
        const img = e.target.closest('.exam-zoomable-img');
        if (img) { e.stopPropagation(); openExamImageLightbox(img.src); }
    });

    function playExamAudioSequence(urlList) {
        if(isReviewMode) return;
        const indicator = document.getElementById('audio-indicator');
        if(urlList.length === 0) { audioFinished(); return; }
        
        let currentIdx = 0;
        audioIsPlaying = true;
        if(indicator) indicator.classList.add('animate-pulse', 'shadow-[0_0_15px_rgba(0,113,184,0.5)]');
        
        const playNext = () => {
            if(currentIdx >= urlList.length) { audioFinished(); return; }
            globalAudioPlayer.src = urlList[currentIdx];
            // Nếu play() bị từ chối (VD trình duyệt chặn autoplay), PHẢI tăng currentIdx trước khi
            // gọi lại playNext() — nếu không sẽ lặp vô hạn cùng 1 audio, audioIsPlaying kẹt mãi ở true
            // và phần Nghe không bao giờ tự chuyển câu được nữa.
            globalAudioPlayer.play().catch(e => { currentIdx++; playNext(); });
            
            globalAudioPlayer.ontimeupdate = () => {
                let p = (globalAudioPlayer.currentTime / globalAudioPlayer.duration) * 100;
                let bar = document.getElementById('exam-audio-bar');
                let timeDisp = document.getElementById('exam-audio-time');
                if(bar && p >= 0 && p <= 100) bar.style.width = p + '%';
                if(timeDisp) {
                    let s = Math.floor(globalAudioPlayer.currentTime);
                    timeDisp.innerText = `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
                }
            };
            globalAudioPlayer.onended = () => { currentIdx++; playNext(); };
            // Nếu audio bị lỗi tải/phát giữa chừng, vẫn phải tiếp tục để tránh audioIsPlaying
            // bị kẹt ở true mãi mãi (chặn auto-chuyển-câu vĩnh viễn cho hết phần Nghe).
            globalAudioPlayer.onerror = () => { currentIdx++; playNext(); };
        };
        playNext();
    }

    function audioFinished() {
        audioIsPlaying = false;
        let bar = document.getElementById('exam-audio-bar');
        let indicator = document.getElementById('audio-indicator');
        if(bar) bar.style.width = '100%';
        if(indicator) indicator.classList.remove('animate-pulse', 'shadow-[0_0_15px_rgba(0,113,184,0.5)]');
        
        document.getElementById('exam-btn-next').classList.remove('opacity-50', 'pointer-events-none');
        
        let qId = currentSkillQs[currentTestIdx].question.id;
        if(userAnswers[qId]) {
            if(!autoNextOnAnswer) return;
            if(isCatMode && currentTestIdx === currentSkillQs.length - 1) return;
            navExam(1);
        }
        else {
            nextQuestionTimeout = setTimeout(() => {
                if(isCatMode && currentTestIdx === currentSkillQs.length - 1) return;
                navExam(1);
            }, 5000);
        }
    }

    function navExam(dir) {
        // Bài CAT: khóa quay lại phần Nghe vì đáp án đã gửi server để tính điểm thích ứng (theta),
        // sửa đáp án cũ sẽ làm sai lệch dữ liệu IRT. Bài cố định (non-CAT) thì cho phép quay lại sửa.
        if(currentSkill === 'Listening' && dir === -1 && !isReviewMode && isCatMode) return;
        globalAudioPlayer.pause(); audioIsPlaying = false; clearTimeout(nextQuestionTimeout);
        
        // LƯU CÂU HỎI VÀO DB NGAY LẬP TỨC KHI CHUYỂN CÂU TRONG LÚC THI CAT
        if (isCatMode && !isReviewMode && dir === 1) {
            let qId = currentSkillQs[currentTestIdx].question.id;
            if (userAnswers[qId] && !savedCatQuestions.has(qId)) {
                savedCatQuestions.add(qId);
                let qObj = currentSkillQs[currentTestIdx];
                let correctOpt = qObj.question.options.find(o => parseInt(o.is_correct) === 1);
                let isCorrect = correctOpt && userAnswers[qId] == correctOpt.id;
                saveCatResponseToServer(qObj, isCorrect);
            }
        }
        
        if(currentTestIdx === currentSkillQs.length - 1 && dir === 1) {
            if (currentSkill === 'Reading' || (currentSkill === 'Listening' && (userAnswers['_skillChoice'] === 'listening'))) {
                if (!isReviewMode) confirmExitExam(); else exitExam(); 
            } else if (currentSkill === 'Listening' && (userAnswers['_skillChoice'] === 'both' || userAnswers['_skillChoice'] === 'reading' || userAnswers['_skillChoice'] === undefined)) {
                currentSkill = 'Reading'; currentTestIdx = 0; currentSkillQs = readingQuestions;
                if(!isReviewMode) { alert('Đã hoàn thành phần Nghe. Hệ thống chuyển ngay sang phần Đọc.'); startSkillSection(); }
                else { document.getElementById('exam-icon').className = 'fa-solid fa-book text-sm'; renderExamQuestion(); }
            } else {
                if(!isReviewMode) showExamResult(); else exitExam(); 
            }
            return;
        }
        currentTestIdx += dir; renderExamQuestion();
    }

    function confirmExitExam() {
        if(confirm('Bạn có chắc chắn muốn nộp bài hoặc thoát không?\n(Kết quả sẽ được chấm và lưu ngay lập tức)')) showExamResult();
    }

    function showExamResult() {
        clearInterval(examTimerInterval); globalAudioPlayer.pause(); isExamRunning = false; clearTimeout(nextQuestionTimeout);
        
        let skillChoice = userAnswers['_skillChoice'] || 'both';
        let lCorrect = skillChoice === 'reading' ? -1 : 0;
        let rCorrect = skillChoice === 'listening' ? -1 : 0;

        if (currentSkill === 'Listening') listeningQuestions = currentSkillQs;
        if (currentSkill === 'Reading') readingQuestions = currentSkillQs;

        if (isCatMode) {
            let lState = irtState.Listening || {};
            let rState = irtState.Reading  || {};
            let lResp = lState.responses || [];
            let rResp = rState.responses || [];
            let lTheta = lState.theta || 0;
            let rTheta = rState.theta || 0;

            // Kỹ năng CHƯA có câu trả lời nào = chưa thi (vd: nộp sớm khi mới thi Nghe).
            // Không bịa 318 điểm cho phần chưa làm → để -1 (hiển thị "Chưa thi").
            if (catShortMode) {
                // ĐỀ NHANH 25 PHÚT = ÔN TẬP: chấm theo SỐ CÂU ĐÚNG, KHÔNG quy thang 700 / KHÔNG xếp cấp TOCFL
                // (pool giới hạn, không đủ để đo cấp độ). Chỉ phản hồi mức độ luyện tập.
                lCorrect = lResp.length > 0 ? lResp.filter(r => r.correct === 1).length : -1;
                rCorrect = rResp.length > 0 ? rResp.filter(r => r.correct === 1).length : -1;
                userAnswers['_practice'] = true;
                userAnswers['_totalListening'] = lResp.length;
                userAnswers['_totalReading']   = rResp.length;
            } else {
                lCorrect = lResp.length > 0 ? thetaToScore(lTheta) : -1;
                rCorrect = rResp.length > 0 ? thetaToScore(rTheta) : -1;
            }

            // "Thi nhanh 25 phút" là ôn tập (chấm theo số câu đúng thô), không tính vào bảng Band/CAT nên không gắn cờ _isCatMode.
            if (!catShortMode) userAnswers['_isCatMode'] = true;
            userAnswers['_catPath']   = { Listening: listeningQuestions, Reading: readingQuestions };
            userAnswers['_irtTheta']  = { Listening: lTheta, Reading: rTheta };
        } else {
            if (lCorrect !== -1) {
                listeningQuestions.forEach(q => {
                    let uAns = userAnswers[q.question.id], correctOpt = q.question.options.find(o => parseInt(o.is_correct) === 1);
                    if(correctOpt && uAns == correctOpt.id) lCorrect++;
                });
            }
            if (rCorrect !== -1) {
                readingQuestions.forEach(q => {
                    let uAns = userAnswers[q.question.id], correctOpt = q.question.options.find(o => parseInt(o.is_correct) === 1);
                    if(correctOpt && uAns == correctOpt.id) rCorrect++;
                });
            }
            // Lưu tổng số câu để lịch sử có thể quy đổi mà không cần tải lại đề
            userAnswers['_totalListening'] = listeningQuestions.length;
            userAnswers['_totalReading'] = readingQuestions.length;
        }

        lCorrect = Math.round(lCorrect);
        rCorrect = Math.round(rCorrect);
        let totalScore = (lCorrect > 0 ? lCorrect : 0) + (rCorrect > 0 ? rCorrect : 0);

        // --- Độ tin cậy CAT ---
        // Kết quả KHÔNG đáng tin khi: (a) thi dở/nộp sớm nên SE còn cao hoặc quá ít câu,
        // hoặc (b) trả lời gần như ngẫu nhiên (~25% đúng) khiến MLE đẩy theta xuống sàn.
        // Đây không phải lỗi tính toán — chỉ là dữ liệu chưa đủ để đo đúng năng lực.
        const CAT_MIN_ITEMS = 6;      // dưới mức này coi như chưa đủ để chấm chắc chắn
        const CAT_SE_OK     = 0.5;    // SE lớn hơn = chưa hội tụ (thi dở)
        let catUnreliable = false;
        if (isCatMode && !catShortMode) { // Đề nhanh = ôn tập, không đánh giá "độ tin cậy" (lCorrect là số câu, không phải điểm 700)
            const rate = arr => arr.length ? arr.filter(r => r.correct === 1).length / arr.length : 1;
            const skillBad = (state, score) => {
                let resp = (state && state.responses) || [];
                if (resp.length === 0) return false; // chưa thi thì xử lý riêng, không tính vào cảnh báo
                // Đề ngắn cố ý dừng sớm (ít câu, SE cao hơn) → không coi SE cao / ít câu là "không tin cậy".
                let convergenceBad = !catShortMode && (resp.length < CAT_MIN_ITEMS || (state.se ?? 999) > CAT_SE_OK);
                return convergenceBad || score <= 180 || rate(resp) <= 0.30;
            };
            catUnreliable = skillBad(irtState.Listening, lCorrect) || skillBad(irtState.Reading, rCorrect);
        }

        const grid = document.getElementById('result-score-grid');
        const listenBlock = document.getElementById('score-listening-block');
        const readBlock = document.getElementById('score-reading-block');

        // --- XẾP LOẠI NĂNG LỰC (null-safe, áp dụng cho cả CAT lẫn đề thường) ---
        const levelBox  = document.getElementById('cat-level-result');
        const levelText = document.getElementById('cat-level-text');
        const levelDesc = document.getElementById('exam-level-desc');
        if (levelBox && levelText) {
            if (isCatMode) {
                // "Chưa hoàn thành" chỉ tính trên các kỹ năng TRONG PHẠM VI thi (tránh báo sai cho bài chỉ Nghe/chỉ Đọc).
                let catIncomplete = (skillChoice !== 'reading' && lCorrect === -1) || (skillChoice !== 'listening' && rCorrect === -1);
                // Cảnh báo: nền vàng pastel dịu, chữ amber. Bình thường: nền accent.
                const warnBox = 'mb-5 sm:mb-6 rounded-2xl p-5 sm:p-6 text-center bg-amber-50 border border-amber-200 shadow-sm';
                const okBox   = 'mb-5 sm:mb-6 rounded-2xl p-5 sm:p-6 text-center bg-gradient-to-r from-accent to-yellow-400 border border-yellow-300 shadow-sm';
                const setTone = (headTone, textTone, descTone) => {
                    const head = document.getElementById('cat-level-head');
                    if (head) head.className = 'text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1 ' + headTone;
                    levelText.className = 'text-lg sm:text-2xl font-black ' + textTone;
                    if (levelDesc) levelDesc.className = 'text-[11px] sm:text-xs font-medium mt-1.5 leading-relaxed ' + descTone;
                };
                if (catShortMode) {
                    // ĐỀ NHANH = ÔN TẬP: chỉ tổng kết số câu đúng, KHÔNG xếp cấp/level TOCFL.
                    const lc = lCorrect === -1 ? 0 : lCorrect, rc = rCorrect === -1 ? 0 : rCorrect;
                    const lt = userAnswers['_totalListening'] || 0, rt = userAnswers['_totalReading'] || 0;
                    const totC = lc + rc, totT = lt + rt;
                    levelText.innerText = 'Ôn tập xong · ' + totC + '/' + totT + ' câu đúng';
                    if (levelDesc) levelDesc.innerText = 'Đề nhanh 25 phút chỉ để LUYỆN TẬP — không xếp cấp độ/level TOCFL. Hãy thi bản đầy đủ để đánh giá đúng trình độ.';
                    levelBox.className = okBox;
                    setTone('text-primaryDark/70', 'text-primaryDark', 'text-primaryDark/80');
                } else if (catIncomplete || catUnreliable) {
                    levelText.innerText = catIncomplete ? 'Bài thi chưa hoàn thành' : 'Kết quả chưa đủ tin cậy';
                    if (levelDesc) levelDesc.innerText = catIncomplete
                        ? 'Bạn đã thoát trước khi làm xong phần thi. Chỉ phần đã làm được ghi nhận — hãy thi lại đầy đủ để nhận xếp loại chính xác.'
                        : 'Điểm rất thấp (có thể do trả lời quá nhanh/ngẫu nhiên). Hãy làm lại nghiêm túc để hệ thống đo đúng năng lực.';
                    levelBox.className = warnBox;
                    setTone('text-amber-500', 'text-amber-800', 'text-amber-700');
                } else {
                    // Đơn kỹ năng xếp loại theo điểm kỹ năng đó; cả 2 kỹ năng dùng thang TOCFL kết hợp.
                    if (skillChoice === 'listening')      levelText.innerText = getSingleSkillLevel(lCorrect);
                    else if (skillChoice === 'reading')   levelText.innerText = getSingleSkillLevel(rCorrect);
                    else                                  levelText.innerText = getTOCFLLevel(lCorrect, rCorrect, totalScore);
                    if (levelDesc) levelDesc.innerText = catShortMode
                        ? 'Điểm ước lượng nhanh (đề rút gọn) — thi bản đầy đủ để có kết quả chính xác hơn.'
                        : 'Đánh giá theo thang điểm CAT (thang 700 mỗi kỹ năng).';
                    levelBox.className = okBox;
                    setTone('text-primaryDark/70', 'text-primaryDark', 'text-primaryDark/80');
                }
            } else {
                // Đề thường: xếp loại theo % câu đúng trên các phần đã thi
                let totalQ = 0, totalCorrectCount = 0;
                if (lCorrect !== -1) { totalQ += listeningQuestions.length; totalCorrectCount += lCorrect; }
                if (rCorrect !== -1) { totalQ += readingQuestions.length; totalCorrectCount += rCorrect; }
                const lv = getRegularExamLevel(totalCorrectCount, totalQ);

                // --- [MỚI] Ước lượng cấp TOCFL cho đề thường ---
                const examBand = (userAnswers['_examBand'] || 'Band A').replace(/^Band\s*/i, '').trim().toUpperCase() || 'A';
                const lScale = lCorrect !== -1 ? rawToScale(lCorrect, listeningQuestions.length, examBand) : null;
                const rScale = rCorrect !== -1 ? rawToScale(rCorrect, readingQuestions.length, examBand) : null;
                const tocflResult = getRegularTOCFLLevel(lScale, rScale, examBand);

                const boxIsDarkText = lv.boxClass.includes('text-white');
                const subTone = boxIsDarkText ? 'text-white/75' : 'text-primaryDark/60';

                let tocflBadgeHtml = '';
                if (tocflResult) {
                    tocflBadgeHtml = `<div class="mt-3 inline-flex items-center gap-1.5 bg-white/95 border border-white/40 text-primaryDark px-3 py-1.5 rounded-full text-[11px] font-black shadow-sm"><i class="fa-solid fa-award text-accent"></i> ≈ ${tocflResult.label}</div><div class="mt-1.5 text-[10px] font-semibold ${subTone}">Ước lượng tham khảo · Nghe: ${lScale ?? '—'}/80 · Đọc: ${rScale ?? '—'}/80</div>`;
                }

                levelText.innerHTML = lv.label + tocflBadgeHtml;
                if (levelDesc) {
                    levelDesc.innerText = lv.desc;
                    levelDesc.className = 'text-[11px] sm:text-xs font-semibold mt-2 leading-relaxed ' + (boxIsDarkText ? 'text-white/85' : 'text-primaryDark/70');
                }
                levelBox.className = 'mb-5 sm:mb-6 rounded-2xl p-5 sm:p-6 text-center shadow-md border ' + lv.boxClass;
            }
            levelBox.classList.remove('hidden');
        }

        // --- ĐIỂM TRONG MODAL — cấu trúc dọc căn giữa, không tràn ---
        const catUntested = `<span class="text-2xl sm:text-3xl font-black text-slate-300">—</span><span class="mt-2 text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wide">Chưa thi</span>`;
        const catScore = (val, gradient, badgeBg) =>
            `<div class="flex items-baseline justify-center gap-0.5"><span class="text-[32px] sm:text-4xl leading-none font-black text-transparent bg-clip-text bg-gradient-to-r ${gradient}">${val}</span><span class="text-xs font-bold text-slate-400">/700</span></div>`
            + `<span class="mt-2 inline-flex items-center gap-1 text-[9px] font-black text-white ${badgeBg} px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wide"><i class="fa-solid fa-chart-line"></i> Điểm CAT</span>`;
        const rawScore = (val, total, color) =>
            `<div class="flex items-baseline justify-center gap-0.5"><span class="text-[32px] sm:text-4xl leading-none font-black ${color}">${val}</span><span class="text-xs font-bold text-slate-400">/ ${total}</span></div><span class="mt-1 text-xs font-medium text-slate-500">câu đúng</span>`;

        // Đề nhanh (ôn tập): hiển thị SỐ CÂU ĐÚNG, không hiển thị điểm /700.
        const catShort = isCatMode && catShortMode;
        let lDisplay = isCatMode
            ? (lCorrect === -1 ? catUntested : (catShort ? rawScore(lCorrect, userAnswers['_totalListening'] || listeningQuestions.length, 'text-primary') : catScore(lCorrect, 'from-primary to-blue-500', 'bg-primary')))
            : rawScore(lCorrect, listeningQuestions.length, 'text-primary');
        let rDisplay = isCatMode
            ? (rCorrect === -1 ? catUntested : (catShort ? rawScore(rCorrect, userAnswers['_totalReading'] || readingQuestions.length, 'text-td-green') : catScore(rCorrect, 'from-td-green to-emerald-500', 'bg-td-green')))
            : rawScore(rCorrect, readingQuestions.length, 'text-td-green');

        if (skillChoice === 'reading') {
            grid.className = 'grid grid-cols-1 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-xs mx-auto';
            listenBlock.style.display = 'none'; readBlock.style.display = 'flex';
            document.getElementById('score-reading').innerHTML = rDisplay;
        } else if (skillChoice === 'listening') {
            grid.className = 'grid grid-cols-1 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-xs mx-auto';
            listenBlock.style.display = 'flex'; readBlock.style.display = 'none';
            document.getElementById('score-listening').innerHTML = lDisplay;
        } else {
            grid.className = 'grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8';
            listenBlock.style.display = 'flex'; readBlock.style.display = 'flex';
            document.getElementById('score-listening').innerHTML = lDisplay;
            document.getElementById('score-reading').innerHTML = rDisplay;
        }
        // ------------------------------------------
        
        document.getElementById('exam-result-modal').classList.remove('hidden');

        if(currentUser && currentUser.id) {
            saveExamResultReliable({
                user_id: currentUser.id, exam_id: currentExamId, score: totalScore,
                listening_score: lCorrect, reading_score: rCorrect, details: JSON.stringify(userAnswers)
            }, () => { renderHistory(); });
        }
    }

    function closeExamResult() { document.getElementById('exam-result-modal').classList.add('hidden'); exitExam(); }

    function exitExam() {
        clearInterval(examTimerInterval); globalAudioPlayer.pause(); isExamRunning = false; isReviewMode = false; clearTimeout(nextQuestionTimeout);
        document.getElementById('exam-mode').classList.add('hidden');
        document.getElementById('floating-lang-toggle')?.classList.remove('hidden');
        document.getElementById('mainContent').scrollTo({ top: document.getElementById('history-section')?.offsetTop - 50 || 0, behavior: 'smooth' });
    }
