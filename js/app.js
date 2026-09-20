import {
  TOPICS,
  generateProblem,
  generateMixedProblem,
  checkAnswer,
  diagnoseMistake,
  formatAnswer,
  MISTAKE_TIPS,
} from './generators.js';

const STORAGE_KEY = 'wiskunde3vwo-oefentool-v1';
const TOETS_LENGTH = 10;
const MIXED_ID = 0; // pseudo-niveau: gemengd door elkaar, binnen één onderwerp

// Deze diagnose-ids zijn geen echt herkend denkpatroon (leeg antwoord of
// "vergelijk maar met de uitwerking") en tellen daarom niet mee als
// veelgemaakte fout in de statistieken.
const UNTRACKED_MISTAKE_IDS = new Set(['algemeen', 'geen-antwoord']);

function statsKey(topicId, levelId) {
  return `${topicId}:${levelId}`;
}

// --- Voortgang opslaan (localStorage) --------------------------------------

function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { levels: {}, bestToets: {}, mistakes: {} };
    const parsed = JSON.parse(raw);
    return { levels: parsed.levels || {}, bestToets: parsed.bestToets || {}, mistakes: parsed.mistakes || {} };
  } catch (e) {
    return { levels: {}, bestToets: {}, mistakes: {} };
  }
}

function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    // localStorage niet beschikbaar (bv. privénavigatie) - gewoon negeren
  }
}

function recordAnswer(topicId, levelId, wasCorrect) {
  const stats = loadStats();
  const key = statsKey(topicId, levelId);
  if (!stats.levels[key]) stats.levels[key] = { correct: 0, wrong: 0 };
  if (wasCorrect) stats.levels[key].correct += 1;
  else stats.levels[key].wrong += 1;
  saveStats(stats);
}

function recordMistake(topicId, levelId, diagnosis) {
  if (!diagnosis || UNTRACKED_MISTAKE_IDS.has(diagnosis.id)) return;
  const stats = loadStats();
  const key = statsKey(topicId, levelId);
  if (!stats.mistakes[key]) stats.mistakes[key] = {};
  const existing = stats.mistakes[key][diagnosis.id];
  stats.mistakes[key][diagnosis.id] = {
    title: diagnosis.title,
    count: existing ? existing.count + 1 : 1,
  };
  saveStats(stats);
}

function hasAnyStats(stats) {
  return (
    Object.keys(stats.levels).length > 0 ||
    Object.keys(stats.bestToets).length > 0 ||
    Object.keys(stats.mistakes || {}).length > 0
  );
}

function clearStats() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // localStorage niet beschikbaar - niets te wissen
  }
}

function recordToetsResult(topicId, levelId, score, total) {
  const stats = loadStats();
  const key = statsKey(topicId, levelId);
  const existing = stats.bestToets[key];
  if (!existing || score / total > existing.score / existing.total) {
    stats.bestToets[key] = { score, total, date: new Date().toLocaleDateString('nl-NL') };
  }
  saveStats(stats);
}

// --- Status -----------------------------------------------------------------

const state = {
  selectedTopic: null,
  selectedLevel: null,
  selectedMode: null,
  session: null, // gevuld bij start van oefenen/toets
};

// --- DOM-referenties ----------------------------------------------------------

const el = {
  setupScreen: document.getElementById('setup-screen'),
  practiceScreen: document.getElementById('practice-screen'),
  resultsScreen: document.getElementById('results-screen'),

  topicList: document.getElementById('topic-list'),
  levelList: document.getElementById('level-list'),
  uitlegBox: document.getElementById('level-uitleg'),
  uitlegTitle: document.getElementById('uitleg-title'),
  uitlegList: document.getElementById('uitleg-list'),
  uitlegExample: document.getElementById('uitleg-example'),
  modeButtons: Array.from(document.querySelectorAll('.mode-btn')),
  startBtn: document.getElementById('start-btn'),
  statsBox: document.getElementById('stats-box'),
  resetBtn: document.getElementById('reset-btn'),

  stopBtn: document.getElementById('stop-btn'),
  progressIndicator: document.getElementById('progress-indicator'),
  problemLevelLabel: document.getElementById('problem-level-label'),
  focusTip: document.getElementById('focus-tip'),
  problemText: document.getElementById('problem-text'),
  answerLabel: document.getElementById('answer-label'),
  answerInput: document.getElementById('answer-input'),
  feedback: document.getElementById('feedback'),
  mistakeFeedback: document.getElementById('mistake-feedback'),
  mistakeTitle: document.getElementById('mistake-title'),
  mistakeText: document.getElementById('mistake-text'),
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

function currentTopic() {
  return TOPICS.find((t) => t.id === state.selectedTopic) || null;
}

function levelName(topicId, levelId) {
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic) return `${topicId} / ${levelId}`;
  if (levelId === MIXED_ID) return `${topic.title} (gemengd)`;
  const lvl = topic.levels.find((l) => l.id === levelId);
  return lvl ? `${topic.title} – niveau ${lvl.id}: ${lvl.title}` : `${topic.title} / ${levelId}`;
}

function renderTopicList() {
  el.topicList.innerHTML = '';
  TOPICS.forEach((topic) => {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    btn.dataset.topic = topic.id;
    if (state.selectedTopic === topic.id) btn.classList.add('selected');
    btn.innerHTML = `<strong>${topic.title}</strong>`;
    btn.addEventListener('click', () => selectTopic(topic.id));
    el.topicList.appendChild(btn);
  });
}

function selectTopic(topicId) {
  state.selectedTopic = topicId;
  state.selectedLevel = null;
  renderTopicList();
  renderLevelList();
  updateUitlegBox();
  updateStartButton();
}

function renderLevelList() {
  const topic = currentTopic();
  el.levelList.innerHTML = '';

  if (!topic) {
    const hint = document.createElement('p');
    hint.className = 'level-hint';
    hint.textContent = 'Kies eerst een onderwerp hierboven.';
    el.levelList.appendChild(hint);
    return;
  }

  const stats = loadStats();
  const allButtons = [
    ...topic.levels,
    { id: MIXED_ID, title: 'Gemengd (alle niveaus)', example: `Een mix van alle soorten opgaven binnen ${topic.title.toLowerCase()}, zoals bij een echte toets.` },
  ];

  allButtons.forEach((lvl) => {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    btn.dataset.level = String(lvl.id);
    if (state.selectedLevel === lvl.id) btn.classList.add('selected');

    const s = stats.levels[statsKey(topic.id, lvl.id)];
    const statsText = s && s.correct + s.wrong > 0 ? `${s.correct}/${s.correct + s.wrong} goed` : '';

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
  const topic = currentTopic();
  if (!topic || state.selectedLevel === null) {
    el.uitlegBox.hidden = true;
    return;
  }
  if (state.selectedLevel === MIXED_ID) {
    el.uitlegTitle.textContent = 'Gemengd (alle niveaus)';
    el.uitlegList.innerHTML = `<li>Bij elke opgave wordt willekeurig één van de niveaus binnen ${topic.title.toLowerCase()} gekozen. Handig als algehele toetsvoorbereiding.</li>`;
    el.uitlegExample.textContent = '';
    el.uitlegBox.hidden = false;
    return;
  }
  const lvl = topic.levels.find((l) => l.id === state.selectedLevel);
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
  el.startBtn.disabled = state.selectedTopic === null || state.selectedLevel === null || state.selectedMode === null;
}

function renderStatsBox() {
  const stats = loadStats();
  const lines = [];

  Object.entries(stats.bestToets).forEach(([key, best]) => {
    const [topicId, levelId] = key.split(':');
    lines.push(`Beste toetsscore ${levelName(topicId, Number(levelId))}: ${best.score}/${best.total} (${best.date})`);
  });

  Object.entries(stats.mistakes || {}).forEach(([key, mistakeCounts]) => {
    const [topicId, levelId] = key.split(':');
    const entries = Object.values(mistakeCounts);
    if (entries.length === 0) return;
    const top = entries.reduce((best, m) => (m.count > best.count ? m : best));
    if (top.count < 2) return; // pas tonen als het patroon zich echt herhaalt
    lines.push(`Veelgemaakte denkfout bij ${levelName(topicId, Number(levelId))}: “${top.title}” (${top.count}×)`);
  });

  el.statsBox.innerHTML = lines.join('<br>');
  el.resetBtn.hidden = !hasAnyStats(stats);
}

el.modeButtons.forEach((btn) => btn.addEventListener('click', () => selectMode(btn.dataset.mode)));
el.startBtn.addEventListener('click', startSession);
el.resetBtn.addEventListener('click', () => {
  const ok = window.confirm(
    'Weet je zeker dat je alle voortgang wilt wissen? Je scores, beste toetsresultaten en bijgehouden denkfouten worden dan permanent verwijderd. Dit kan niet ongedaan gemaakt worden.'
  );
  if (!ok) return;
  clearStats();
  renderLevelList();
  renderStatsBox();
});

// --- Sessie starten -------------------------------------------------------------

function makeProblem(topicId, levelId) {
  return levelId === MIXED_ID ? generateMixedProblem(topicId) : generateProblem(topicId, levelId);
}

function startSession() {
  const { selectedTopic, selectedLevel, selectedMode } = state;
  if (selectedMode === 'toets') {
    const questions = [];
    for (let i = 0; i < TOETS_LENGTH; i++) questions.push(makeProblem(selectedTopic, selectedLevel));
    state.session = {
      mode: 'toets',
      topic: selectedTopic,
      level: selectedLevel,
      questions,
      index: 0,
      results: [],
    };
  } else {
    state.session = {
      mode: 'oefenen',
      topic: selectedTopic,
      level: selectedLevel,
      correct: 0,
      wrong: 0,
      current: makeProblem(selectedTopic, selectedLevel),
      pendingFocusTip: null,
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
  const topic = TOPICS.find((t) => t.id === problem.topic);
  const lvl = topic?.levels.find((l) => l.id === problem.level);

  el.problemLevelLabel.textContent = topic ? `${topic.title}${lvl ? ` – niveau ${lvl.id}: ${lvl.title}` : ''}` : '';
  el.problemText.textContent = problem.text;
  el.answerLabel.textContent = problem.inputLabel || 'Antwoord:';
  el.answerInput.placeholder = problem.inputPlaceholder || '';
  el.answerInput.value = '';
  el.answerInput.disabled = false;
  el.feedback.hidden = true;
  el.feedback.className = 'feedback';
  el.mistakeFeedback.hidden = true;
  el.stepsBox.hidden = true;
  el.stepsList.innerHTML = problem.steps.map((step) => `<li>${step}</li>`).join('');
  el.checkBtn.hidden = false;
  el.checkBtn.disabled = false;
  el.nextBtn.hidden = true;
  el.hintBtn.hidden = false;
  el.hintBtn.textContent = 'Laat uitwerking zien';

  if (s.mode === 'oefenen' && s.pendingFocusTip) {
    const tip = MISTAKE_TIPS[s.pendingFocusTip.id] || s.pendingFocusTip.explanation;
    el.focusTip.innerHTML = `<strong>Let op bij deze opgave</strong>Vorige keer ging het mis met: ${s.pendingFocusTip.title.toLowerCase()}. ${tip}`;
    el.focusTip.hidden = false;
    s.pendingFocusTip = null;
  } else {
    el.focusTip.hidden = true;
  }

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
  const diagnosis = isCorrect ? null : diagnoseMistake(problem, userInput);

  el.feedback.hidden = false;
  el.feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
  el.feedback.textContent = isCorrect
    ? 'Goed zo!'
    : `Helaas, niet goed. Het juiste antwoord is: ${formatAnswer(problem)}.`;

  if (diagnosis) {
    el.mistakeFeedback.hidden = false;
    el.mistakeTitle.textContent = `Wat ging er waarschijnlijk mis? ${diagnosis.title}`;
    el.mistakeText.textContent = diagnosis.explanation;
  } else {
    el.mistakeFeedback.hidden = true;
  }

  // Altijd de volledige uitwerking tonen, zodat duidelijk is hoe de opgave
  // wél gemaakt had moeten worden - niet alleen op verzoek via de hint-knop.
  el.stepsBox.hidden = false;
  el.hintBtn.hidden = true;

  el.answerInput.disabled = true;
  el.checkBtn.hidden = true;
  el.nextBtn.hidden = false;
  el.nextBtn.textContent = s.mode === 'toets' && s.index === s.questions.length - 1 ? 'Bekijk resultaat' : 'Volgende →';

  recordAnswer(problem.topic, problem.level, isCorrect);
  if (diagnosis) recordMistake(problem.topic, problem.level, diagnosis);

  if (s.mode === 'toets') {
    s.results.push({ problem, userInput, isCorrect, diagnosis });
  } else {
    if (isCorrect) s.correct += 1;
    else s.wrong += 1;
    el.sessionScore.textContent = `Score: ${s.correct} goed, ${s.wrong} fout`;
    s.pendingFocusTip = diagnosis && !UNTRACKED_MISTAKE_IDS.has(diagnosis.id) ? diagnosis : null;
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
    s.current = makeProblem(s.topic, s.level);
  }
  renderProblem();
}

function finishToets() {
  const s = state.session;
  const score = s.results.filter((r) => r.isCorrect).length;
  recordToetsResult(s.topic, s.level, score, s.questions.length);

  el.resultsSummary.textContent = `Je hebt ${score} van de ${s.questions.length} opgaven goed (${Math.round((score / s.questions.length) * 100)}%).`;
  el.resultsList.innerHTML = s.results
    .map((r, i) => {
      const cls = r.isCorrect ? 'r-correct' : 'r-incorrect';
      const yourAnswer = r.userInput.trim() === '' ? '(geen antwoord)' : r.userInput;
      const mistakeHtml =
        !r.isCorrect && r.diagnosis
          ? `<div class="r-mistake">Wat ging er waarschijnlijk mis? <strong>${r.diagnosis.title}.</strong> ${r.diagnosis.explanation}</div>`
          : '';
      return `
        <li>
          <div class="r-question">${i + 1}. ${r.problem.text}</div>
          <div class="r-your-answer ${cls}">${r.isCorrect ? '✔' : '✘'} Jouw antwoord: ${yourAnswer}${
        r.isCorrect ? '' : ` — Juiste antwoord: ${formatAnswer(r.problem)}`
      }</div>
          ${mistakeHtml}
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
    renderTopicList();
    renderLevelList();
    renderStatsBox();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Init -------------------------------------------------------------

renderTopicList();
renderLevelList();
renderStatsBox();
updateUitlegBox();
updateStartButton();
