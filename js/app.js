import { LEVELS, generateProblem, generateMixedProblem, checkAnswer, formatAnswer } from './generators.js';

const STORAGE_KEY = 'wiskunde3vwo-vergelijkingen-v1';
const TOETS_LENGTH = 10;
const MIXED_ID = 0; // pseudo-niveau: gemengd door elkaar

// --- Voortgang opslaan (localStorage) --------------------------------------

function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { levels: {}, bestToets: {} };
    const parsed = JSON.parse(raw);
    return { levels: parsed.levels || {}, bestToets: parsed.bestToets || {} };
  } catch (e) {
    return { levels: {}, bestToets: {} };
  }
}

function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    // localStorage niet beschikbaar (bv. privénavigatie) - gewoon negeren
  }
}

function recordAnswer(levelId, wasCorrect) {
  const stats = loadStats();
  const key = String(levelId);
  if (!stats.levels[key]) stats.levels[key] = { correct: 0, wrong: 0 };
  if (wasCorrect) stats.levels[key].correct += 1;
  else stats.levels[key].wrong += 1;
  saveStats(stats);
}

function recordToetsResult(levelId, score, total) {
  const stats = loadStats();
  const key = String(levelId);
  const existing = stats.bestToets[key];
  if (!existing || score / total > existing.score / existing.total) {
    stats.bestToets[key] = { score, total, date: new Date().toLocaleDateString('nl-NL') };
  }
  saveStats(stats);
}

// --- Status -----------------------------------------------------------------

const state = {
  selectedLevel: null,
  selectedMode: null,
  session: null, // gevuld bij start van oefenen/toets
};

// --- DOM-referenties ----------------------------------------------------------

const el = {
  setupScreen: document.getElementById('setup-screen'),
  practiceScreen: document.getElementById('practice-screen'),
  resultsScreen: document.getElementById('results-screen'),

  levelList: document.getElementById('level-list'),
  uitlegBox: document.getElementById('level-uitleg'),
  uitlegTitle: document.getElementById('uitleg-title'),
  uitlegList: document.getElementById('uitleg-list'),
  uitlegExample: document.getElementById('uitleg-example'),
  modeButtons: Array.from(document.querySelectorAll('.mode-btn')),
  startBtn: document.getElementById('start-btn'),
  statsBox: document.getElementById('stats-box'),

  stopBtn: document.getElementById('stop-btn'),
  progressIndicator: document.getElementById('progress-indicator'),
  problemLevelLabel: document.getElementById('problem-level-label'),
  problemText: document.getElementById('problem-text'),
  answerInput: document.getElementById('answer-input'),
  feedback: document.getElementById('feedback'),
  stepsBox: document.getElementById('steps-box'),
  stepsList: document.getElementById('steps-list'),
  hintBtn: document.getElementById('hint-btn'),
  checkBtn: document.getElementById('check-btn'),
  nextBtn: document.getElementById('next-btn'),
  sessionScore: document.getElementById('session-score'),

  resultsSummary: document.getElementById('results-summary'),
  resultsList: document.getElementById('results-list'),
  resultsBackBtn: document.getElementById('results-back-btn'),
};

// --- Setup-scherm -------------------------------------------------------------

function levelName(id) {
  if (id === MIXED_ID) return 'Gemengd (alle niveaus)';
  const lvl = LEVELS.find((l) => l.id === id);
  return lvl ? `Niveau ${lvl.id}: ${lvl.title}` : `Niveau ${id}`;
}

function renderLevelList() {
  const stats = loadStats();
  el.levelList.innerHTML = '';

  const allButtons = [...LEVELS, { id: MIXED_ID, title: 'Gemengd (alle niveaus)', example: 'Een mix van alle soorten vergelijkingen, zoals bij een echte toets.' }];

  allButtons.forEach((lvl) => {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    btn.dataset.level = String(lvl.id);
    if (state.selectedLevel === lvl.id) btn.classList.add('selected');

    const s = stats.levels[String(lvl.id)];
    const statsText = s && (s.correct + s.wrong > 0) ? `${s.correct}/${s.correct + s.wrong} goed` : '';

    btn.innerHTML = `
      <span class="level-stats">${statsText}</span>
      <strong>${lvl.id === MIXED_ID ? 'Gemengd' : `${lvl.id}. ${lvl.title}`}</strong>
    `;
    btn.addEventListener('click', () => selectLevel(lvl.id));
    el.levelList.appendChild(btn);
  });
}

function selectLevel(id) {
  state.selectedLevel = id;
  renderLevelList();
  updateUitlegBox();
  updateStartButton();
}

function updateUitlegBox() {
  if (state.selectedLevel === null) {
    el.uitlegBox.hidden = true;
    return;
  }
  if (state.selectedLevel === MIXED_ID) {
    el.uitlegTitle.textContent = 'Gemengd (alle niveaus)';
    el.uitlegList.innerHTML = '<li>Bij elke opgave wordt willekeurig een van de vijf niveaus gekozen. Handig als algehele toetsvoorbereiding.</li>';
    el.uitlegExample.textContent = '';
    el.uitlegBox.hidden = false;
    return;
  }
  const lvl = LEVELS.find((l) => l.id === state.selectedLevel);
  el.uitlegTitle.textContent = `${lvl.id}. ${lvl.title}`;
  el.uitlegList.innerHTML = lvl.uitleg.map((line) => `<li>${line}</li>`).join('');
  el.uitlegExample.textContent = lvl.example;
  el.uitlegBox.hidden = false;
}

function selectMode(mode) {
  state.selectedMode = mode;
  el.modeButtons.forEach((btn) => btn.classList.toggle('selected', btn.dataset.mode === mode));
  updateStartButton();
}

function updateStartButton() {
  el.startBtn.disabled = state.selectedLevel === null || state.selectedMode === null;
}

function renderStatsBox() {
  const stats = loadStats();
  const bestEntries = Object.entries(stats.bestToets);
  if (bestEntries.length === 0) {
    el.statsBox.textContent = '';
    return;
  }
  const lines = bestEntries
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([id, best]) => `Beste toetsscore ${levelName(Number(id))}: ${best.score}/${best.total} (${best.date})`);
  el.statsBox.innerHTML = lines.join('<br>');
}

el.modeButtons.forEach((btn) => btn.addEventListener('click', () => selectMode(btn.dataset.mode)));
el.startBtn.addEventListener('click', startSession);

// --- Sessie starten -------------------------------------------------------------

function makeProblem(levelId) {
  return levelId === MIXED_ID ? generateMixedProblem() : generateProblem(levelId);
}

function startSession() {
  const { selectedLevel, selectedMode } = state;
  if (selectedMode === 'toets') {
    const questions = [];
    for (let i = 0; i < TOETS_LENGTH; i++) questions.push(makeProblem(selectedLevel));
    state.session = {
      mode: 'toets',
      level: selectedLevel,
      questions,
      index: 0,
      results: [],
    };
  } else {
    state.session = {
      mode: 'oefenen',
      level: selectedLevel,
      correct: 0,
      wrong: 0,
      current: makeProblem(selectedLevel),
    };
  }
  showScreen('practice');
  renderProblem();
}

// --- Oefen-/toetsscherm -------------------------------------------------------------

function currentProblem() {
  const s = state.session;
  return s.mode === 'toets' ? s.questions[s.index] : s.current;
}

function renderProblem() {
  const s = state.session;
  const problem = currentProblem();

  el.problemLevelLabel.textContent =
    problem.level === undefined ? '' : `Niveau ${problem.level}: ${LEVELS.find((l) => l.id === problem.level)?.title ?? ''}`;
  el.problemText.textContent = problem.text;
  el.answerInput.value = '';
  el.answerInput.disabled = false;
  el.feedback.hidden = true;
  el.feedback.className = 'feedback';
  el.stepsBox.hidden = true;
  el.stepsList.innerHTML = problem.steps.map((step) => `<li>${step}</li>`).join('');
  el.checkBtn.hidden = false;
  el.nextBtn.hidden = true;
  el.hintBtn.textContent = 'Laat uitwerking zien';

  if (s.mode === 'toets') {
    el.progressIndicator.textContent = `Vraag ${s.index + 1} van ${s.questions.length}`;
    el.sessionScore.textContent = '';
  } else {
    el.progressIndicator.textContent = 'Oefenmodus';
    el.sessionScore.textContent = `Score: ${s.correct} goed, ${s.wrong} fout`;
  }

  el.answerInput.focus();
}

function checkCurrentAnswer() {
  const s = state.session;
  const problem = currentProblem();
  const userInput = el.answerInput.value;
  const isCorrect = checkAnswer(problem, userInput);

  el.feedback.hidden = false;
  el.feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
  el.feedback.textContent = isCorrect
    ? 'Goed zo!'
    : `Helaas, niet goed. Het juiste antwoord is: ${formatAnswer(problem)}.`;

  el.answerInput.disabled = true;
  el.checkBtn.hidden = true;
  el.nextBtn.hidden = false;
  el.nextBtn.textContent = s.mode === 'toets' && s.index === s.questions.length - 1 ? 'Bekijk resultaat' : 'Volgende →';

  const levelForStats = problem.level;
  recordAnswer(levelForStats, isCorrect);

  if (s.mode === 'toets') {
    s.results.push({ problem, userInput, isCorrect });
  } else {
    if (isCorrect) s.correct += 1;
    else s.wrong += 1;
    el.sessionScore.textContent = `Score: ${s.correct} goed, ${s.wrong} fout`;
  }

  el.nextBtn.focus();
}

function goToNext() {
  const s = state.session;
  if (s.mode === 'toets') {
    if (s.index + 1 >= s.questions.length) {
      finishToets();
      return;
    }
    s.index += 1;
  } else {
    s.current = makeProblem(s.level);
  }
  renderProblem();
}

function finishToets() {
  const s = state.session;
  const score = s.results.filter((r) => r.isCorrect).length;
  recordToetsResult(s.level, score, s.questions.length);

  el.resultsSummary.textContent = `Je hebt ${score} van de ${s.questions.length} opgaven goed (${Math.round((score / s.questions.length) * 100)}%).`;
  el.resultsList.innerHTML = s.results
    .map((r, i) => {
      const cls = r.isCorrect ? 'r-correct' : 'r-incorrect';
      const yourAnswer = r.userInput.trim() === '' ? '(geen antwoord)' : r.userInput;
      return `
        <li>
          <div class="r-question">${i + 1}. ${r.problem.text}</div>
          <div class="r-your-answer ${cls}">${r.isCorrect ? '✔' : '✘'} Jouw antwoord: ${yourAnswer}${
        r.isCorrect ? '' : ` — Juiste antwoord: ${formatAnswer(r.problem)}`
      }</div>
        </li>
      `;
    })
    .join('');

  showScreen('results');
}

el.hintBtn.addEventListener('click', () => {
  const showing = !el.stepsBox.hidden;
  el.stepsBox.hidden = showing;
  el.hintBtn.textContent = showing ? 'Laat uitwerking zien' : 'Verberg uitwerking';
});

el.checkBtn.addEventListener('click', checkCurrentAnswer);
el.nextBtn.addEventListener('click', goToNext);
el.answerInput.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  if (!el.checkBtn.hidden) checkCurrentAnswer();
  else if (!el.nextBtn.hidden) goToNext();
});

el.stopBtn.addEventListener('click', () => {
  state.session = null;
  showScreen('setup');
});

el.resultsBackBtn.addEventListener('click', () => {
  state.session = null;
  showScreen('setup');
});

// --- Schermbeheer -------------------------------------------------------------

function showScreen(name) {
  el.setupScreen.hidden = name !== 'setup';
  el.practiceScreen.hidden = name !== 'practice';
  el.resultsScreen.hidden = name !== 'results';
  if (name === 'setup') {
    renderLevelList();
    renderStatsBox();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Init -------------------------------------------------------------

renderLevelList();
renderStatsBox();
updateUitlegBox();
updateStartButton();
