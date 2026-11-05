// Hanzi Diary - Mandarin Learning App (p.vql.vn)
// Complete Frontend SPA Logic

let state = {
  currentTab: 'dashboard',
  curriculums: [],
  books: [],
  lessons: [],
  currentCurriculumId: 1,
  currentBookId: 1,
  currentLessonId: 1,
  vocabList: [],
  dialogueList: [],
  filteredVocab: [],
  fcIndex: 0,
  fcFlipped: false,
  writingIndex: 0,
  writer: null,
  quizQuestions: [],
  quizIdx: 0,
  quizScore: 0,
  quizAnswered: false,
  dictationIndex: 0,
  showPinyin: true,
  showMeaning: true,
  charType: 'traditional', // 'traditional' or 'simplified'
  openccT2S: null,
  openccS2T: null,
  currentShadowingTopic: '',
  grammarList: [],
  radicalsList: [],
  measureWordsData: null,
  notebookTags: [],
  activeNotebookCategory: 'doi-song',
};

window.state = state;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  window.currentTab = 'dashboard';
  state.currentTab = 'dashboard';
  initOpenCC();
  initSidebar();
  initShortcuts();
  try {
    const swMatch = 'hanzi-pwa-v1.5.5'.match(/v1\.\d+\.\d+/);
    if (swMatch) {
      const el = document.getElementById('app-version-badge');
      if (el) el.innerText = swMatch[0];
    }
  } catch(e){}
  await loadCurriculums();
  await loadRadicalStrokePills();
  await loadMeasureWords();
  await loadNotebookTags();
});

// OpenCC conversion setup
function initOpenCC() {
  try {
    if (typeof OpenCC !== 'undefined') {
      state.openccT2S = OpenCC.Converter({ from: 't', to: 'cn' });
      state.openccS2T = OpenCC.Converter({ from: 'cn', to: 't' });
    }
  } catch (e) {
    console.warn('OpenCC init error:', e);
  }
}

function convertHanzi(text) {
  if (!text) return '';
  if (state.charType === 'simplified' && state.openccT2S) {
    return state.openccT2S(text);
  }
  return text;
}

// Sidebar & Tabs
function initSidebar() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
  }
  function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
  }

  mobileMenuBtn?.addEventListener('click', openSidebar);
  closeSidebarBtn?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);
}

function switchTab(tabId) {
  state.currentTab = tabId;
  window.currentTab = tabId;

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('bg-emerald-50', 'text-emerald-700', 'font-bold');
      btn.classList.remove('text-slate-600', 'hover:bg-slate-100');
    } else {
      btn.classList.remove('bg-emerald-50', 'text-emerald-700', 'font-bold');
      btn.classList.add('text-slate-600', 'hover:bg-slate-100');
    }
  });

  // Update view visibility
  document.querySelectorAll('[id^="view-"]').forEach(section => {
    section.classList.add('hidden');
  });
  const activeView = document.getElementById(`view-${tabId}`);
  if (activeView) activeView.classList.remove('hidden');

  // Title update
  const titles = {
    vocab: 'Từ vựng bài học',
    flashcard: 'Luyện Flashcard',
    writing: 'Luyện viết nét Hán tự',
    quiz: 'Trắc nghiệm bài học',
    dialogue: 'Bài hội thoại thực tế',
    dictation: 'Luyện viết chính tả',
    shadowing: 'Luyện nói (Shadowing)',
    notebook: 'Sổ tay từ vựng theo chủ đề',
    grammar: 'Kho ngữ pháp tiếng Trung',
    radicals: '214 Bộ thủ Hán tự',
    'measure-words': 'Lượng từ tiếng Trung'
  };
  const titleEl = document.getElementById('currentTabTitle');
  if (titleEl) titleEl.innerText = titles[tabId] || 'Học tiếng Trung';

  // Specific tab initializers
  if (tabId === 'flashcard') initFlashcard();
  if (tabId === 'writing') initWritingTab();
  if (tabId === 'quiz') initQuiz();
  if (tabId === 'dialogue') renderDialogue();
  if (tabId === 'dictation') initDictation();
  if (tabId === 'shadowing') loadShadowingTopics();
  if (tabId === 'notebook') renderNotebookTags();
  if (tabId === 'grammar') loadGrammar();
  if (tabId === 'radicals') loadRadicals();
  if (tabId === 'measure-words') renderMeasureWords();

  if (typeof updateUIBadge === 'function') updateUIBadge();

  // Close mobile sidebar
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (window.innerWidth < 768 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
  }
}

// Data loaders: Curriculums, Books, Lessons
async function loadCurriculums() {
  try {
    const res = await fetch('/api/curriculums');
    state.curriculums = await res.json();
    const sel = document.getElementById('curriculumSelect');
    sel.innerHTML = state.curriculums.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    sel.onchange = (e) => onCurriculumChange(e.target.value);

    if (state.curriculums.length > 0) {
      await onCurriculumChange(state.curriculums[0].id);
    }
  } catch (e) {
    console.error('Error loading curriculums:', e);
  }
}

async function onCurriculumChange(curriculumId) {
  state.currentCurriculumId = parseInt(curriculumId);
  try {
    const res = await fetch(`/api/books?curriculum_id=${curriculumId}`);
    state.books = await res.json();
    const sel = document.getElementById('bookSelect');
    sel.innerHTML = state.books.map(b => `<option value="${b.book_id}">${b.book}</option>`).join('');
    sel.onchange = (e) => onBookChange(e.target.value);

    if (state.books.length > 0) {
      await onBookChange(state.books[0].book_id);
    }
  } catch (e) {
    console.error('Error loading books:', e);
  }
}

async function onBookChange(bookId) {
  state.currentBookId = parseInt(bookId);
  try {
    const res = await fetch(`/api/lessons?book_id=${bookId}`);
    state.lessons = await res.json();
    const sel = document.getElementById('lessonSelect');
    sel.innerHTML = state.lessons.map(l => `<option value="${l.lesson_id}">${l.lesson} (${l.vocab_count || 0} từ)</option>`).join('');
    sel.onchange = (e) => onLessonChange(e.target.value);

    if (state.lessons.length > 0) {
      await onLessonChange(state.lessons[0].lesson_id);
    }
  } catch (e) {
    console.error('Error loading lessons:', e);
  }
}

async function onLessonChange(lessonId) {
  const spinner = document.getElementById('ios-lesson-spinner');
  if (spinner) spinner.classList.add('active');

  state.currentLessonId = parseInt(lessonId);
  const curLesson = state.lessons.find(l => l.lesson_id === state.currentLessonId);
  const curBook = state.books.find(b => b.book_id === state.currentBookId);
  
  window.dispatchEvent(new CustomEvent('lessonChanged', { detail: { lessonId } }));

  // Update badge
  const badge = document.getElementById('currentLessonBadge');
  if (badge && curLesson && curBook) {
    badge.innerText = `${curBook.book.split('|')[0].trim()} · ${curLesson.lesson.split('-')[0].trim()}`;
  }

  // Load vocab and contents
  try {
    await Promise.all([loadVocabularies(), loadLessonContents()]);
  } finally {
    if (spinner) spinner.classList.remove('active');
  }
}

async function loadVocabularies() {
  try {
    const res = await fetch(`/api/vocabularies?lesson_id=${state.currentLessonId}`);
    state.vocabList = await res.json();
    state.filteredVocab = [...state.vocabList];
    renderVocab();
  } catch (e) {
    console.error('Error loading vocabularies:', e);
  }
}

async function loadLessonContents() {
  try {
    const res = await fetch(`/api/lesson_contents?lesson_id=${state.currentLessonId}`);
    state.dialogueList = await res.json();
    if (state.currentTab === 'dialogue') renderDialogue();
  } catch (e) {
    console.error('Error loading lesson contents:', e);
  }
}

// 1. VOCAB RENDER
function renderVocab() {
  const container = document.getElementById('vocabListContainer');
  const countTitle = document.getElementById('vocabHeaderSubtitle');
  if (countTitle) {
    countTitle.innerText = `${state.filteredVocab.length} từ vựng trong bài học này`;
  }
  if (!container) return;

  if (state.filteredVocab.length === 0) {
    container.innerHTML = '<div class="text-center py-12 text-slate-400 font-medium">Không tìm thấy từ vựng nào.</div>';
    return;
  }

  container.innerHTML = state.filteredVocab.map((w, idx) => {
    const hanziDisplay = convertHanzi(w.hanzi);
    const examples = Array.isArray(w.examples) ? w.examples : [];
    return `
      <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:border-emerald-200 transition">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <div class="flex items-baseline gap-2.5 flex-wrap mb-1">
              <span class="hanzi-text text-2xl font-black text-slate-800 tracking-wide">${hanziDisplay}</span>
              <span class="text-sm font-bold text-emerald-600 pinyin-elem ${state.showPinyin ? '' : 'hidden'}">${w.pinyin || ''}</span>
              ${w.part_of_speech ? `<span class="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">${w.part_of_speech}</span>` : ''}
              ${w.tocfl_band ? `<span class="text-[11px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md">Band A${w.tocfl_band}</span>` : ''}
            </div>
            <div class="text-sm font-semibold text-slate-700 mb-3 meaning-elem ${state.showMeaning ? '' : 'hidden'}">
              ${w.definition || ''}
            </div>

            ${examples.length > 0 ? `
              <div class="space-y-2 mt-2 pt-2 border-t border-slate-50">
                ${examples.map(ex => `
                  <div class="text-xs bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex items-start justify-between gap-2">
                    <div>
                      <div class="hanzi-text font-bold text-slate-800 text-sm mb-0.5">${convertHanzi(ex.examples_hanzi || '')}</div>
                      <div class="text-emerald-600 font-medium pinyin-elem ${state.showPinyin ? '' : 'hidden'} mb-0.5">${ex.examples_pinyin || ''}</div>
                      <div class="text-slate-600 meaning-elem ${state.showMeaning ? '' : 'hidden'}">${ex.examples_translation || ''}</div>
                    </div>
                    <button onclick="speak('${ex.examples_hanzi || ''}')" class="w-7 h-7 rounded-full bg-white text-slate-500 hover:text-emerald-600 shadow-sm flex items-center justify-center shrink-0">
                      <i class="fa-solid fa-volume-high text-[11px]"></i>
                    </button>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <button onclick="speak('${w.hanzi}')" title="Phát âm" class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center shadow-sm transition">
              <i class="fa-solid fa-volume-high text-sm"></i>
            </button>
            <button onclick="practiceWritingChar('${w.hanzi}')" title="Tập viết nét" class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center shadow-sm transition">
              <i class="fa-solid fa-pen-nib text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Filter vocab in current lesson
document.getElementById('vocabFilterInput')?.addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) {
    state.filteredVocab = [...state.vocabList];
  } else {
    state.filteredVocab = state.vocabList.filter(w =>
      (w.hanzi || '').toLowerCase().includes(q) ||
      (w.pinyin || '').toLowerCase().includes(q) ||
      (w.definition || '').toLowerCase().includes(q)
    );
  }
  renderVocab();
});

// 2. FLASHCARD
function initFlashcard() {
  state.fcIndex = 0;
  state.fcFlipped = false;
  updateFlashcardUI();
}

function updateFlashcardUI() {
  const card = document.getElementById('fcCard');
  if (card) {
    card.classList.remove('flipped');
    state.fcFlipped = false;
  }

  const counter = document.getElementById('fcCounter');
  if (state.vocabList.length === 0) {
    if (counter) counter.innerText = '0 / 0';
    return;
  }

  const w = state.vocabList[state.fcIndex] || state.vocabList[0];
  if (counter) counter.innerText = `Thẻ ${state.fcIndex + 1} / ${state.vocabList.length}`;

  const hanzi = convertHanzi(w.hanzi);
  document.getElementById('fcFrontHanzi').innerText = hanzi;
  document.getElementById('fcFrontPinyin').innerText = w.pinyin || '';
  document.getElementById('fcFrontPos').innerText = w.part_of_speech || 'Từ vựng';

  document.getElementById('fcBackHanzi').innerText = hanzi;
  document.getElementById('fcBackPinyin').innerText = w.pinyin || '';
  document.getElementById('fcBackPos').innerText = w.part_of_speech || 'Từ vựng';
  document.getElementById('fcBackMeaning').innerText = w.definition || '';

  const exWrap = document.getElementById('fcBackExampleWrap');
  const examples = Array.isArray(w.examples) ? w.examples : [];
  if (examples.length > 0) {
    exWrap.classList.remove('hidden');
    document.getElementById('fcBackExHanzi').innerText = convertHanzi(examples[0].examples_hanzi || '');
    document.getElementById('fcBackExPinyin').innerText = examples[0].examples_pinyin || '';
    document.getElementById('fcBackExVi').innerText = examples[0].examples_translation || '';
  } else {
    exWrap.classList.add('hidden');
  }
}

function flipFlashcard() {
  const card = document.getElementById('fcCard');
  if (!card) return;
  state.fcFlipped = !state.fcFlipped;
  card.classList.toggle('flipped', state.fcFlipped);
}

function navFlashcard(delta) {
  if (state.vocabList.length === 0) return;
  state.fcIndex = (state.fcIndex + delta + state.vocabList.length) % state.vocabList.length;
  updateFlashcardUI();
}

function shuffleFlashcards() {
  for (let i = state.vocabList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.vocabList[i], state.vocabList[j]] = [state.vocabList[j], state.vocabList[i]];
  }
  state.fcIndex = 0;
  updateFlashcardUI();
}

function markFcStatus(mastered) {
  navFlashcard(1);
}

function playCurrentFcAudio() {
  if (state.vocabList.length === 0) return;
  const w = state.vocabList[state.fcIndex];
  if (w && w.hanzi) speak(w.hanzi);
}

// 3. HANZI WRITER (LUYỆN VIẾT NÉT)
function initWritingTab() {
  if (state.vocabList.length === 0) return;
  state.writingIndex = 0;
  renderWritingChar();
}

function practiceWritingChar(hanzi) {
  switchTab('writing');
  const idx = state.vocabList.findIndex(w => w.hanzi === hanzi);
  if (idx !== -1) {
    state.writingIndex = idx;
  }
  renderWritingChar();
}

function renderWritingChar() {
  if (state.vocabList.length === 0) return;
  const w = state.vocabList[state.writingIndex] || state.vocabList[0];
  const char = (w.hanzi || '').charAt(0) || '好';

  document.getElementById('writingChar').innerText = convertHanzi(char);
  document.getElementById('writingPinyin').innerText = w.pinyin || '';
  document.getElementById('writingMeaning').innerText = w.definition || '';
  document.getElementById('writingCounter').innerText = `${state.writingIndex + 1} / ${state.vocabList.length}`;

  const target = document.getElementById('writerTarget');
  target.innerHTML = '';

  try {
    if (typeof HanziWriter !== 'undefined') {
      state.writer = HanziWriter.create('writerTarget', char, {
        width: 240,
        height: 240,
        padding: 15,
        showOutline: true,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 150,
        strokeColor: '#0fa968',
        radicalColor: '#027ab3',
        drawingColor: '#1e293b'
      });
      state.writer.animateCharacter();
    }
  } catch (e) {
    console.error('HanziWriter error:', e);
  }
}

function animateWriting() {
  if (state.writer) state.writer.animateCharacter();
}

function startWritingQuiz() {
  if (state.writer) {
    state.writer.quiz({
      onComplete: () => {
        alert('Chúc mừng! Bạn đã hoàn thành đúng thứ tự nét chữ Hán này! 🎉');
      }
    });
  }
}

function resetWriting() {
  renderWritingChar();
}

function navWritingChar(delta) {
  if (state.vocabList.length === 0) return;
  state.writingIndex = (state.writingIndex + delta + state.vocabList.length) % state.vocabList.length;
  renderWritingChar();
}

function playCurrentWritingAudio() {
  const w = state.vocabList[state.writingIndex];
  if (w && w.hanzi) speak(w.hanzi);
}

// 4. QUIZ (TRẮC NGHIỆM)
function initQuiz() {
  if (state.vocabList.length < 4) {
    document.getElementById('quizCard').innerHTML = '<div class="py-8 text-slate-400">Bài học này cần tối thiểu 4 từ vựng để tạo bài thi trắc nghiệm.</div>';
    return;
  }
  document.getElementById('quizCard').classList.remove('hidden');
  document.getElementById('quizResultCard').classList.add('hidden');

  // Generate 10 questions
  state.quizQuestions = [];
  const pool = [...state.vocabList];
  const qCount = Math.min(10, pool.length);

  for (let i = 0; i < qCount; i++) {
    const targetIdx = i;
    const targetWord = pool[targetIdx];

    // Pick 3 distractors with non-colliding definitions
    const cleanDef = (s) => (s || '').toString().toLowerCase().replace(/\([^\)]*\)|（[^）]*）|\[[^\]]*\]/g, ' ').replace(/^[\s.,;!?:，。！？；/、]+|[\s.,;!?:，。！？；/、]+$/g, '').replace(/\s+/g, ' ').trim();
    const isColliding = (d1, d2) => {
      const c1 = cleanDef(d1), c2 = cleanDef(d2);
      if (!c1 || !c2) return false;
      if (c1 === c2) return true;
      if ((c1.length >= 4 && (` ${c2} `).includes(` ${c1} `)) || (c2.length >= 4 && (` ${c1} `).includes(` ${c2} `))) return true;
      const parts1 = c1.split(/[,;\/，；、\n]+/).map(p => p.trim()).filter(p => p.length >= 2);
      const parts2 = c2.split(/[,;\/，；、\n]+/).map(p => p.trim()).filter(p => p.length >= 2);
      return parts1.some(p => parts2.includes(p));
    };

    const distractors = [];
    const others = pool.filter((_, idx) => idx !== targetIdx).sort(() => 0.5 - Math.random());
    for (const other of others) {
      if (distractors.length >= 3) break;
      if (!other.definition) continue;
      if (isColliding(targetWord.definition, other.definition)) continue;
      if (distractors.some(d => isColliding(d.definition, other.definition))) continue;
      distractors.push(other);
    }

    const options = [targetWord, ...distractors];
    // Shuffle options
    for (let k = options.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [options[k], options[j]] = [options[j], options[k]];
    }

    state.quizQuestions.push({
      target: targetWord,
      options: options,
      correctId: targetWord.vocab_id || targetWord.hanzi
    });
  }

  state.quizIdx = 0;
  state.quizScore = 0;
  renderQuizQuestion();
}

function renderQuizQuestion() {
  state.quizAnswered = false;
  const q = state.quizQuestions[state.quizIdx];
  if (!q) return;

  document.getElementById('quizProgressText').innerText = `Câu ${state.quizIdx + 1} / ${state.quizQuestions.length}`;
  document.getElementById('quizProgressBar').style.width = `${((state.quizIdx + 1) / state.quizQuestions.length) * 100}%`;
  document.getElementById('quizScoreDisplay').innerText = `Điểm: ${state.quizScore}`;
  document.getElementById('quizNextBtn').classList.add('hidden');

  document.getElementById('quizQuestionHanzi').innerText = convertHanzi(q.target.hanzi);
  document.getElementById('quizQuestionPinyin').innerText = q.target.pinyin || '';

  const optsContainer = document.getElementById('quizOptionsContainer');
  const letters = ['A', 'B', 'C', 'D'];
  optsContainer.innerHTML = q.options.map((opt, i) => `
    <button onclick="selectQuizOption('${opt.vocab_id || opt.hanzi}', this)" class="quiz-opt-btn w-full p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-left font-medium text-slate-700 shadow-sm transition flex items-center gap-3">
      <span class="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs shrink-0">${letters[i]}</span>
      <span class="text-sm">${opt.definition || opt.hanzi}</span>
    </button>
  `).join('');
}

function selectQuizOption(selectedId, btnEl) {
  if (state.quizAnswered) return;
  state.quizAnswered = true;

  const q = state.quizQuestions[state.quizIdx];
  const isCorrect = selectedId === q.correctId;

  document.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.disabled = true;
  });

  if (isCorrect) {
    state.quizScore += 10;
    btnEl.classList.remove('bg-white', 'border-slate-200');
    btnEl.classList.add('bg-emerald-50', 'border-emerald-500', 'text-emerald-800');
    document.getElementById('quizScoreDisplay').innerText = `Điểm: ${state.quizScore}`;
  } else {
    btnEl.classList.remove('bg-white', 'border-slate-200');
    btnEl.classList.add('bg-rose-50', 'border-rose-500', 'text-rose-800');
    // Highlight correct
    document.querySelectorAll('.quiz-opt-btn').forEach(btn => {
      if (btn.innerText.includes(q.target.definition)) {
        btn.classList.add('bg-emerald-50', 'border-emerald-500', 'text-emerald-800');
      }
    });
  }

  document.getElementById('quizNextBtn').classList.remove('hidden');
}

function nextQuizQuestion() {
  state.quizIdx++;
  if (state.quizIdx >= state.quizQuestions.length) {
    // Show result
    document.getElementById('quizCard').classList.add('hidden');
    document.getElementById('quizResultCard').classList.remove('hidden');
    const total = state.quizQuestions.length;
    const correctCount = state.quizScore / 10;
    const pct = Math.round((correctCount / total) * 100);
    document.getElementById('quizResultScore').innerText = `Bạn đạt ${correctCount}/${total} câu đúng (${pct}%) · Tổng điểm: ${state.quizScore}`;
  } else {
    renderQuizQuestion();
  }
}

function playQuizQuestionAudio() {
  const q = state.quizQuestions[state.quizIdx];
  if (q && q.target && q.target.hanzi) speak(q.target.hanzi);
}

// 5. DIALOGUE (HỘI THOẠI)
function renderDialogue() {
  const tabsContainer = document.getElementById('dialogueTabsContainer');
  const contentContainer = document.getElementById('dialogueContentContainer');
  if (!contentContainer) return;

  if (state.dialogueList.length === 0) {
    contentContainer.innerHTML = '<div class="text-center py-12 text-slate-400 font-medium">Không có bài hội thoại cho bài học này.</div>';
    if (tabsContainer) tabsContainer.innerHTML = '';
    return;
  }

  // Render tabs for multiple dialogues in lesson
  if (tabsContainer) {
    tabsContainer.innerHTML = state.dialogueList.map((d, idx) => `
      <button onclick="selectDialogueTab(${idx})" class="diag-tab-btn px-3 py-1.5 rounded-xl text-xs font-bold ${idx === 0 ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'} shadow-sm whitespace-nowrap">
        ${d.dropdown_option || d.title || `Hội thoại ${idx + 1}`}
      </button>
    `).join('');
  }

  renderDialogueItem(0);
}

function selectDialogueTab(index) {
  document.querySelectorAll('.diag-tab-btn').forEach((btn, idx) => {
    if (idx === index) {
      btn.classList.add('bg-emerald-600', 'text-white');
      btn.classList.remove('bg-white', 'text-slate-600', 'border');
    } else {
      btn.classList.remove('bg-emerald-600', 'text-white');
      btn.classList.add('bg-white', 'text-slate-600', 'border');
    }
  });
  renderDialogueItem(index);
}

function renderDialogueItem(index) {
  const contentContainer = document.getElementById('dialogueContentContainer');
  const d = state.dialogueList[index];
  if (!d || !contentContainer) return;

  const content = d.content || '';
  const vietnamese = d.vietnamese || '';
  const contentLines = content.split('\n').filter(l => l.trim().length > 0);
  const viLines = vietnamese.split('\n').filter(l => l.trim().length > 0);

  contentContainer.innerHTML = `
    <div class="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_10px_30px_rgb(0,0,0,0.04)] border border-slate-200/80 mb-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div>
          <h3 class="text-base sm:text-lg font-black text-slate-800">${d.title || d.dropdown_option || 'Hội thoại'}</h3>
          <span class="text-xs text-emerald-600 font-semibold">${d.dropdown_option || ''}</span>
        </div>
        <button onclick="speakDialogueAll(${index})" class="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition flex items-center gap-1.5">
          <i class="fa-solid fa-volume-high"></i>
          <span>Đọc cả bài</span>
        </button>
      </div>

      <div class="space-y-4">
        ${contentLines.map((line, i) => {
          const parts = line.split('：');
          const role = parts.length > 1 ? parts[0] : '';
          const sentence = parts.length > 1 ? parts.slice(1).join('：') : line;
          const viLine = viLines[i] || '';
          return `
            <div class="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                ${role.slice(0, 2) || '话'}
              </div>
              <div class="flex-1">
                <div class="text-xs font-bold text-slate-400 mb-0.5">${role}</div>
                <div class="hanzi-text text-base sm:text-lg font-black text-slate-800 mb-1">${convertHanzi(sentence)}</div>
                <div class="text-xs sm:text-sm text-slate-600 font-medium meaning-elem ${state.showMeaning ? '' : 'hidden'}">${viLine}</div>
              </div>
              <button onclick="speak('${sentence}')" class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center shrink-0 transition">
                <i class="fa-solid fa-volume-high text-xs"></i>
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function speakDialogueAll(index) {
  const d = state.dialogueList[index];
  if (d && d.content) speak(d.content);
}

// 6. DICTATION (CHÍNH TẢ)
function initDictation() {
  if (state.vocabList.length === 0) return;
  state.dictationIndex = 0;
  loadDictationWord();
}

function loadDictationWord() {
  if (state.vocabList.length === 0) return;
  const w = state.vocabList[state.dictationIndex] || state.vocabList[0];
  document.getElementById('dictationPinyin').innerText = w.pinyin || '';
  document.getElementById('dictationMeaning').innerText = w.definition || '';
  document.getElementById('dictationInput').value = '';
  const fb = document.getElementById('dictationFeedback');
  fb.classList.add('hidden');
  fb.innerText = '';
}

function checkDictation(e) {
  e.preventDefault();
  const input = document.getElementById('dictationInput').value.trim();
  const w = state.vocabList[state.dictationIndex];
  const fb = document.getElementById('dictationFeedback');
  fb.classList.remove('hidden');

  if (input === w.hanzi || input === convertHanzi(w.hanzi)) {
    fb.className = 'mt-4 text-sm font-bold text-emerald-600';
    fb.innerText = 'Chính xác! 🎉 Rất giỏi!';
    setTimeout(() => {
      nextDictationWord();
    }, 1200);
  } else {
    fb.className = 'mt-4 text-sm font-bold text-rose-600';
    fb.innerText = `Chưa đúng! Đáp án đúng là: ${convertHanzi(w.hanzi)} (${w.pinyin})`;
  }
}

function showDictationHint() {
  const w = state.vocabList[state.dictationIndex];
  const fb = document.getElementById('dictationFeedback');
  fb.classList.remove('hidden');
  fb.className = 'mt-4 text-sm font-bold text-amber-600';
  fb.innerText = `Gợi ý: ${convertHanzi(w.hanzi)} (${w.pinyin})`;
}

function nextDictationWord() {
  state.dictationIndex = (state.dictationIndex + 1) % state.vocabList.length;
  loadDictationWord();
}

function playDictationAudio() {
  const w = state.vocabList[state.dictationIndex];
  if (w && w.hanzi) speak(w.hanzi);
}

// 7. SHADOWING
async function loadShadowingTopics() {
  try {
    const res = await fetch('/api/shadowing_topics');
    const topics = await res.json();
    const sel = document.getElementById('shadowingTopicSelect');
    sel.innerHTML = topics.map(t => `<option value="${t.topic}">${t.topic} (${t.cnt})</option>`).join('');
    if (topics.length > 0) {
      loadShadowingVideos(topics[0].topic);
    }
  } catch (e) {
    console.error('Error loading shadowing topics:', e);
  }
}

async function loadShadowingVideos(topic) {
  try {
    const res = await fetch(`/api/shadowing_videos?topic=${encodeURIComponent(topic)}&page=1&limit=20`);
    const data = await res.json();
    const container = document.getElementById('shadowingListContainer');
    if (!container) return;

    container.innerHTML = (data.data || []).map(v => `
      <div class="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-200/80 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span class="font-bold text-emerald-600">${v.hsk_level || 'TOCFL'}</span>
            <span>${v.duration || ''}</span>
          </div>
          <h4 class="hanzi-text text-base sm:text-lg font-black text-slate-800 mb-1">${convertHanzi(v.title || '')}</h4>
          <p class="text-xs sm:text-sm text-slate-600 font-medium meaning-elem mb-4">${v.title_vi || ''}</p>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100">
          <span class="text-xs text-slate-400"><i class="fa-solid fa-play mr-1"></i>${v.play_count || 0} lượt học</span>
          <button onclick="speak('${v.title || ''}')" class="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-700 flex items-center gap-1.5">
            <i class="fa-solid fa-microphone"></i>
            <span>Luyện đọc</span>
          </button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('Error loading shadowing videos:', e);
  }
}

// 8. NOTEBOOK (SỔ TAY TỪ VỰNG)
async function loadNotebookTags() {
  try {
    const res = await fetch('/api/dict_tags');
    state.notebookTags = await res.json();
  } catch (e) {
    console.error('Error loading dict tags:', e);
  }
}

function filterNotebookCategory(cat) {
  state.activeNotebookCategory = cat;
  const btnDoiSong = document.getElementById('nbTabDoiSong');
  const btnChuyenNganh = document.getElementById('nbTabChuyenNganh');

  if (cat === 'doi-song') {
    btnDoiSong.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-sm transition';
    btnChuyenNganh.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-600 hover:bg-slate-100 transition';
  } else {
    btnChuyenNganh.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-sm transition';
    btnDoiSong.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-600 hover:bg-slate-100 transition';
  }
  renderNotebookTags();
}

function renderNotebookTags() {
  const container = document.getElementById('notebookTagsGrid');
  if (!container) return;

  const tags = state.notebookTags.filter(t => t.category === state.activeNotebookCategory);
  container.innerHTML = tags.map(t => `
    <button onclick="openNotebookTagVocab(${t.tag_id}, '${t.tag_name}')" class="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-200/80 hover:border-emerald-300 text-left transition group">
      <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg mb-3 group-hover:scale-105 transition">
        <i class="${t.icon_class || 'fa-solid fa-book'}"></i>
      </div>
      <div class="font-black text-slate-800 text-sm mb-1">${t.tag_name}</div>
      <div class="text-xs text-slate-400 font-semibold">${t.word_count || 0} từ vựng</div>
    </button>
  `).join('');
}

async function openNotebookTagVocab(tagId, tagName) {
  try {
    const res = await fetch(`/api/tag_vocab?tag_id=${tagId}`);
    const words = await res.json();

    document.getElementById('notebookVocabArea').classList.remove('hidden');
    document.getElementById('notebookTagTitle').innerText = `Chủ đề: ${tagName} (${words.length} từ)`;

    const list = document.getElementById('notebookVocabList');
    list.innerHTML = words.map(w => `
      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-3">
        <div>
          <div class="flex items-baseline gap-2">
            <span class="hanzi-text text-xl font-black text-slate-800">${convertHanzi(w.hanzi)}</span>
            <span class="text-xs font-bold text-emerald-600 pinyin-elem ${state.showPinyin ? '' : 'hidden'}">${w.pinyin || ''}</span>
            ${w.part_of_speech ? `<span class="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">${w.part_of_speech}</span>` : ''}
          </div>
          <div class="text-xs text-slate-600 font-medium meaning-elem ${state.showMeaning ? '' : 'hidden'}">${w.definition || ''}</div>
        </div>
        <button onclick="speak('${w.hanzi}')" class="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center shrink-0">
          <i class="fa-solid fa-volume-high text-xs"></i>
        </button>
      </div>
    `).join('');

    document.getElementById('notebookVocabArea').scrollIntoView({ behavior: 'smooth' });
  } catch (e) {
    console.error('Error loading tag vocab:', e);
  }
}

function closeNotebookVocab() {
  document.getElementById('notebookVocabArea').classList.add('hidden');
}

// 9. GRAMMAR (KHO NGỮ PHÁP 505)
let grammarDebounceTimer = null;
function debounceGrammarSearch() {
  clearTimeout(grammarDebounceTimer);
  grammarDebounceTimer = setTimeout(() => {
    loadGrammar();
  }, 300);
}

function filterGrammarBand(band) {
  document.querySelectorAll('.gm-band-btn').forEach(b => {
    if (b.dataset.band === band) {
      b.className = 'gm-band-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-sm';
    } else {
      b.className = 'gm-band-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 hover:bg-slate-50 border border-slate-200';
    }
  });
  loadGrammar(band);
}

async function loadGrammar(band = null) {
  const search = document.getElementById('grammarSearchInput')?.value.trim() || '';
  let url = `/api/grammar?search=${encodeURIComponent(search)}`;
  if (band !== null) {
    url += `&band=${encodeURIComponent(band)}`;
  } else {
    const activeBtn = document.querySelector('.gm-band-btn.bg-emerald-600');
    if (activeBtn && activeBtn.dataset.band) {
      url += `&band=${encodeURIComponent(activeBtn.dataset.band)}`;
    }
  }

  try {
    const res = await fetch(url);
    const list = await res.json();
    renderGrammarList(list);
  } catch (e) {
    console.error('Error loading grammar:', e);
  }
}

function renderGrammarList(list) {
  const container = document.getElementById('grammarListContainer');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = '<div class="text-center py-12 text-slate-400 font-medium">Không tìm thấy ngữ pháp phù hợp.</div>';
    return;
  }

  container.innerHTML = list.map(g => {
    const examples = Array.isArray(g.examples) ? g.examples : [];
    return `
      <div class="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-200/80">
        <div class="flex items-start justify-between gap-3 mb-2">
          <div>
            <div class="flex items-baseline gap-2.5 flex-wrap">
              <span class="hanzi-text text-xl sm:text-2xl font-black text-slate-800">${convertHanzi(g.pattern_zh)}</span>
              <span class="text-sm font-bold text-emerald-600">${g.pattern_pinyin || ''}</span>
              <span class="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md">TOCFL Band A${g.tocfl_band || 1}</span>
            </div>
            <h4 class="text-sm sm:text-base font-bold text-slate-800 mt-1">${g.title_vi || ''}</h4>
          </div>
          <button onclick="speak('${g.pattern_zh}')" class="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center shrink-0">
            <i class="fa-solid fa-volume-high text-xs"></i>
          </button>
        </div>

        ${g.structure_note ? `
          <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-mono font-semibold text-emerald-800 my-3">
            Cấu trúc: ${convertHanzi(g.structure_note)}
          </div>
        ` : ''}

        <p class="text-xs sm:text-sm text-slate-600 font-medium mb-4 leading-relaxed">${g.explanation_vi || ''}</p>

        ${examples.length > 0 ? `
          <div class="space-y-2 border-t border-slate-100 pt-3">
            <div class="text-[11px] font-bold text-slate-400 uppercase">Ví dụ minh họa:</div>
            ${examples.map(ex => `
              <div class="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 text-xs flex items-start justify-between gap-2">
                <div>
                  <div class="hanzi-text font-bold text-slate-800 text-sm mb-0.5">${convertHanzi(ex.example_zh || '')}</div>
                  <div class="text-emerald-600 font-medium mb-0.5">${ex.example_pinyin || ''}</div>
                  <div class="text-slate-600">${ex.example_vi || ''}</div>
                </div>
                <button onclick="speak('${ex.example_zh || ''}')" class="w-6 h-6 rounded-full bg-white text-slate-500 hover:text-emerald-600 shadow-sm flex items-center justify-center shrink-0">
                  <i class="fa-solid fa-volume-high text-[10px]"></i>
                </button>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// 10. RADICALS (214 BỘ THỦ)
async function loadRadicalStrokePills() {
  const container = document.getElementById('radicalStrokePills');
  if (!container) return;

  const strokes = ['Tất cả', ...Array.from({ length: 17 }, (_, i) => `${i + 1} nét`)];
  container.innerHTML = strokes.map((s, idx) => `
    <button onclick="filterRadicalsStroke(${idx === 0 ? "''" : idx})" class="rad-stroke-btn px-3 py-1.5 rounded-xl text-xs font-bold ${idx === 0 ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'} whitespace-nowrap shadow-sm">
      ${s}
    </button>
  `).join('');
}

let radicalDebounceTimer = null;
function debounceRadicalSearch() {
  clearTimeout(radicalDebounceTimer);
  radicalDebounceTimer = setTimeout(() => {
    loadRadicals();
  }, 300);
}

function filterRadicalsStroke(stroke) {
  document.querySelectorAll('.rad-stroke-btn').forEach((btn, idx) => {
    const isTarget = (stroke === '' && idx === 0) || (stroke === idx);
    if (isTarget) {
      btn.className = 'rad-stroke-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white whitespace-nowrap shadow-sm';
    } else {
      btn.className = 'rad-stroke-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-200 whitespace-nowrap shadow-sm';
    }
  });
  loadRadicals(stroke);
}

async function loadRadicals(strokes = '') {
  const search = document.getElementById('radicalSearchInput')?.value.trim() || '';
  let url = `/api/radicals?search=${encodeURIComponent(search)}`;
  if (strokes) url += `&strokes=${encodeURIComponent(strokes)}`;

  try {
    const res = await fetch(url);
    const list = await res.json();
    renderRadicalsGrid(list);
  } catch (e) {
    console.error('Error loading radicals:', e);
  }
}

function renderRadicalsGrid(list) {
  const container = document.getElementById('radicalsGridContainer');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = '<div class="col-span-full text-center py-12 text-slate-400 font-medium">Không tìm thấy bộ thủ nào.</div>';
    return;
  }

  container.innerHTML = list.map(r => `
    <div class="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-200/80 flex flex-col justify-between hover:border-emerald-200 transition">
      <div>
        <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span class="font-bold text-emerald-600">${r.strokes} nét</span>
          <span>#${r.id}</span>
        </div>
        <div class="flex items-baseline gap-2 mb-1">
          <span class="hanzi-text text-3xl font-black text-slate-800">${r.radical}</span>
          <span class="text-xs font-bold text-emerald-600">${r.pinyin || ''}</span>
          <span class="text-xs font-semibold text-slate-500">${r.hanviet || ''}</span>
        </div>
        <div class="text-xs font-bold text-slate-700 mb-2">${r.meaning_vi || ''}</div>
        <p class="text-[11px] text-slate-500 font-medium leading-relaxed mb-3">${r.etymology_vi || ''}</p>
      </div>

      ${Array.isArray(r.example_chars) && r.example_chars.length > 0 ? `
        <div class="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] text-slate-400 font-bold uppercase">Ví dụ:</span>
          ${r.example_chars.slice(0, 6).map(c => `
            <span class="hanzi-text text-xs font-bold px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-700">${c}</span>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');
}

// 11. MEASURE WORDS (LƯỢNG TỪ)
async function loadMeasureWords() {
  try {
    const res = await fetch('/api/measure_words');
    state.measureWordsData = await res.json();
  } catch (e) {
    console.error('Error loading measure words:', e);
  }
}

function renderMeasureWords() {
  if (!state.measureWordsData) return;
  const groups = state.measureWordsData.groups || [];
  const words = state.measureWordsData.words || [];

  const tabsContainer = document.getElementById('mwGroupTabs');
  if (tabsContainer) {
    tabsContainer.innerHTML = [
      { id: '', label: 'Tất cả lượng từ' },
      ...groups
    ].map((g, idx) => `
      <button onclick="filterMeasureWordsGroup('${g.id}')" class="mw-tab-btn px-3 py-1.5 rounded-xl text-xs font-bold ${idx === 0 ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'} whitespace-nowrap shadow-sm">
        ${g.label}
      </button>
    `).join('');
  }

  renderMeasureWordsList(words);
}

function filterMeasureWordsGroup(groupId) {
  document.querySelectorAll('.mw-tab-btn').forEach(btn => {
    const isTarget = (groupId === '' && btn.innerText.includes('Tất cả')) || (btn.innerText.includes(groupId));
    if (isTarget) {
      btn.className = 'mw-tab-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white whitespace-nowrap shadow-sm';
    } else {
      btn.className = 'mw-tab-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-200 whitespace-nowrap shadow-sm';
    }
  });

  const allWords = state.measureWordsData?.words || [];
  const filtered = groupId ? allWords.filter(w => w.group_id === groupId) : allWords;
  renderMeasureWordsList(filtered);
}

function renderMeasureWordsList(words) {
  const container = document.getElementById('mwGridContainer');
  if (!container) return;

  if (words.length === 0) {
    container.innerHTML = '<div class="col-span-full text-center py-12 text-slate-400 font-medium">Không tìm thấy lượng từ nào.</div>';
    return;
  }

  container.innerHTML = words.map(w => `
    <div class="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-200/80 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-baseline gap-2">
            <span class="hanzi-text text-3xl font-black text-slate-800">${convertHanzi(w.word || w.hanzi)}</span>
            <span class="text-sm font-bold text-emerald-600">${w.pinyin || ''}</span>
            <span class="text-xs font-semibold text-slate-500">${w.hanviet || ''}</span>
          </div>
          <button onclick="speak('${w.word || w.hanzi}')" class="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center shrink-0">
            <i class="fa-solid fa-volume-high text-xs"></i>
          </button>
        </div>

        <div class="text-xs font-bold text-slate-700 mb-1">${w.usage || w.meaning || ''}</div>
        <p class="text-xs text-slate-500 font-medium mb-3">${w.nuance || ''}</p>

        ${w.nouns ? `
          <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-3">
            <span class="font-bold text-slate-400 uppercase text-[10px]">Danh từ đi kèm:</span>
            <div class="font-semibold text-slate-700 mt-0.5">${convertHanzi(w.nouns)}</div>
          </div>
        ` : ''}
      </div>

      ${w.example_zh ? `
        <div class="pt-3 border-t border-slate-100 text-xs">
          <div class="hanzi-text font-bold text-slate-800 mb-0.5">${convertHanzi(w.example_zh)}</div>
          <div class="text-emerald-600 font-medium mb-0.5">${w.example_pinyin || ''}</div>
          <div class="text-slate-600">${w.example_vi || ''}</div>
        </div>
      ` : ''}
    </div>
  `).join('');
}

// Global quick search
let quickSearchTimer = null;
function toggleQuickSearch(open) {
  const modal = document.getElementById('quickSearchModal');
  if (!modal) return;
  if (open) {
    modal.classList.remove('hidden');
    document.getElementById('quickSearchInput')?.focus();
  } else {
    modal.classList.add('hidden');
  }
}

function debounceQuickSearch() {
  clearTimeout(quickSearchTimer);
  quickSearchTimer = setTimeout(async () => {
    const q = document.getElementById('quickSearchInput')?.value.trim();
    const resultsContainer = document.getElementById('quickSearchResults');
    if (!q || !resultsContainer) return;

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const results = await res.json();
      if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="text-xs text-slate-400 text-center py-6">Không tìm thấy từ nào phù hợp.</div>';
        return;
      }
      resultsContainer.innerHTML = results.map(w => `
        <div onclick="locateWord('${w.hanzi}')" class="p-3 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl cursor-pointer transition border border-slate-100 flex items-center justify-between">
          <div>
            <div class="flex items-baseline gap-2">
              <span class="hanzi-text text-base font-black text-slate-800">${convertHanzi(w.hanzi)}</span>
              <span class="text-xs font-bold text-emerald-600">${w.pinyin || ''}</span>
              <span class="text-[10px] font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">${w.part_of_speech || ''}</span>
            </div>
            <div class="text-xs text-slate-600 font-medium">${w.definition || ''}</div>
          </div>
          <button onclick="event.stopPropagation(); speak('${w.hanzi}')" class="w-7 h-7 rounded-full bg-white text-emerald-600 shadow-sm flex items-center justify-center">
            <i class="fa-solid fa-volume-high text-xs"></i>
          </button>
        </div>
      `).join('');
    } catch (e) {
      console.error('Error during search:', e);
    }
  }, 250);
}

function locateWord(hanzi) {
  toggleQuickSearch(false);
  switchTab('vocab');
  practiceWritingChar(hanzi);
}

// Global Toggles (Pinyin, Meaning, Char Type)
function togglePinyin() {
  state.showPinyin = !state.showPinyin;
  const btn = document.getElementById('togglePinyinBtn');
  if (btn) btn.innerHTML = `Pinyin: <span class="${state.showPinyin ? 'text-emerald-600' : 'text-slate-400'}">${state.showPinyin ? 'BẬT' : 'TẮT'}</span>`;
  document.querySelectorAll('.pinyin-elem').forEach(el => {
    el.classList.toggle('hidden', !state.showPinyin);
  });
}

function toggleMeaning() {
  state.showMeaning = !state.showMeaning;
  const btn = document.getElementById('toggleMeaningBtn');
  if (btn) btn.innerHTML = `Nghĩa: <span class="${state.showMeaning ? 'text-emerald-600' : 'text-slate-400'}">${state.showMeaning ? 'BẬT' : 'TẮT'}</span>`;
  document.querySelectorAll('.meaning-elem').forEach(el => {
    el.classList.toggle('hidden', !state.showMeaning);
  });
}

function toggleCharType() {
  state.charType = state.charType === 'traditional' ? 'simplified' : 'traditional';
  const btn = document.getElementById('toggleCharTypeBtn');
  if (btn) {
    if (state.charType === 'traditional') {
      btn.innerText = 'Phồn thể (繁)';
      btn.className = 'px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-sm transition';
    } else {
      btn.innerText = 'Giản thể (简)';
      btn.className = 'px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm transition';
    }
  }
  // Re-render current tab
  switchTab(state.currentTab);
}

// Audio Pronunciation Engine
function speak(text) {
  if (!text) return;

  // Try Web Speech API first (instant 0 latency)
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-TW';
      u.rate = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const twVoice = voices.find(v => v.lang.includes('zh-TW') || v.lang.includes('zh-HK') || v.lang.includes('zh'));
      if (twVoice) u.voice = twVoice;
      window.speechSynthesis.speak(u);
      return;
    } catch (e) {
      console.warn('SpeechSynthesis error, falling back to server TTS:', e);
    }
  }

  // Fallback to server Edge TTS
  try {
    const audio = new Audio();
    audio.src = `/api/tts?text=${encodeURIComponent(text)}`;
    audio.play().catch(e => console.warn('Audio play failed:', e));
  } catch (e) {
    console.warn('Fallback audio failed:', e);
  }
}

// Play all vocabularies sequentially
async function playAllVocabAudio() {
  for (const w of state.filteredVocab) {
    if (w.hanzi) {
      speak(w.hanzi);
      await new Promise(r => setTimeout(r, 1600));
    }
  }
}

// Keyboard shortcuts
function initShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === ' ' && state.currentTab === 'flashcard') {
      e.preventDefault();
      flipFlashcard();
    } else if (e.key === 'ArrowRight' && state.currentTab === 'flashcard') {
      navFlashcard(1);
    } else if (e.key === 'ArrowLeft' && state.currentTab === 'flashcard') {
      navFlashcard(-1);
    } else if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      toggleQuickSearch(true);
    } else if (e.key === 'Escape') {
      toggleQuickSearch(false);
    }
  });
}
