// Genereert oefenopgaven voor het onderwerp "Vergelijkingen oplossen" (3 vwo).
// Puur functionele module (geen DOM), zodat hij ook los te testen is.

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randNonZero(min, max) {
  let v;
  do {
    v = randInt(min, max);
  } while (v === 0);
  return v;
}

// Geeft een netjes opgemaakte term met teken terug, bv. "+ 5" / "- 3", of ''
// als de waarde 0 is (term valt dan weg uit de vergelijking).
function fmtTerm(value) {
  if (value === 0) return '';
  return value > 0 ? `+ ${value}` : `- ${Math.abs(value)}`;
}

// Formatteert een coëfficiënt vóór de x, bv. 1 -> "x", -1 -> "-x", 5 -> "5x".
function fmtCoefX(coef) {
  if (coef === 1) return 'x';
  if (coef === -1) return '-x';
  return `${coef}x`;
}

export const LEVELS = [
  {
    id: 1,
    title: 'Eenvoudige vergelijkingen',
    example: 'bijv. 3x + 5 = 20',
    uitleg: [
      'Breng het losse getal naar de andere kant van het =-teken (teken verandert).',
      'Deel daarna beide kanten door het getal voor de x.',
    ],
  },
  {
    id: 2,
    title: 'De onbekende aan beide kanten',
    example: 'bijv. 5x - 3 = 2x + 9',
    uitleg: [
      'Breng alle x-termen naar één kant en alle losse getallen naar de andere kant.',
      'Tel op / trek af aan beide kanten, en deel daarna door het getal voor de x.',
    ],
  },
  {
    id: 3,
    title: 'Vergelijkingen met haakjes',
    example: 'bijv. 4(x - 2) = 16',
    uitleg: [
      'Werk eerst de haakjes weg door alles binnen de haakjes te vermenigvuldigen.',
      'Los daarna op zoals een gewone vergelijking.',
    ],
  },
  {
    id: 4,
    title: 'Vergelijkingen met breuken',
    example: 'bijv. (x + 3) / 4 = 2',
    uitleg: [
      'Vermenigvuldig beide kanten met de noemer om van de breuk af te komen.',
      'Los daarna op zoals een gewone vergelijking.',
    ],
  },
  {
    id: 5,
    title: 'Kwadratische vergelijkingen (ontbinden)',
    example: 'bijv. x² - x - 6 = 0',
    uitleg: [
      'Ontbind in factoren: (x - p)(x - q) = 0.',
      'Een product is 0 als één van de factoren 0 is, dus x = p of x = q.',
    ],
  },
];

function genLevel1() {
  const a = randNonZero(2, 9);
  const xt = randNonZero(-10, 10);
  const b = randInt(-15, 15);
  const c = a * xt + b;

  const text = b === 0 ? `${a}x = ${c}` : `${a}x ${fmtTerm(b)} = ${c}`;
  const steps = [text];
  if (b !== 0) {
    steps.push(`${a}x = ${c} ${b >= 0 ? '-' : '+'} ${Math.abs(b)}`);
    steps.push(`${a}x = ${c - b}`);
  }
  steps.push(`x = (${c - b}) : ${a} = ${xt}`);
  return { text, level: 1, isSingle: true, answer: xt, steps };
}

function genLevel2() {
  let a = randNonZero(2, 9);
  let c = randNonZero(2, 9);
  while (c === a) c = randNonZero(2, 9);
  const xt = randNonZero(-10, 10);
  const b = randInt(-15, 15);
  const d = a * xt + b - c * xt;

  const lhs = b === 0 ? `${a}x` : `${a}x ${fmtTerm(b)}`;
  const rhs = d === 0 ? `${c}x` : `${c}x ${fmtTerm(d)}`;
  const text = `${lhs} = ${rhs}`;
  const diff = a - c;
  const afterMove = b === 0 ? `${fmtCoefX(diff)}` : `${fmtCoefX(diff)} ${fmtTerm(b)}`;
  const steps = [
    text,
    `${afterMove} = ${d}  (${c}x is van beide kanten afgetrokken)`,
  ];
  if (b !== 0) {
    steps.push(`${fmtCoefX(diff)} = ${d} ${b >= 0 ? '-' : '+'} ${Math.abs(b)}`);
    steps.push(`${fmtCoefX(diff)} = ${d - b}`);
  }
  steps.push(`x = (${d - b}) : ${diff} = ${xt}`);
  return { text, level: 2, isSingle: true, answer: xt, steps };
}

function genLevel3() {
  const a = randNonZero(2, 9);
  const xt = randNonZero(-10, 10);
  const b = randInt(-10, 10);
  const c = a * (xt + b);

  const text = b === 0 ? `${a}(x) = ${c}` : `${a}(x ${fmtTerm(b)}) = ${c}`;
  const ab = a * b;
  const steps = [text, `${ab === 0 ? `${a}x` : `${a}x ${fmtTerm(ab)}`} = ${c}  (haakjes weggewerkt)`];
  if (ab !== 0) {
    steps.push(`${a}x = ${c} ${ab >= 0 ? '-' : '+'} ${Math.abs(ab)}`);
    steps.push(`${a}x = ${c - ab}`);
  }
  steps.push(`x = (${c - ab}) : ${a} = ${xt}`);
  return { text, level: 3, isSingle: true, answer: xt, steps };
}

function genLevel4() {
  const a = randInt(2, 5);
  const xt = randNonZero(-12, 12);
  const k = randInt(-8, 8);
  const b = a * k - xt;
  const c = k;

  const text = b === 0 ? `x / ${a} = ${c}` : `(x ${fmtTerm(b)}) / ${a} = ${c}`;
  const ac = a * c;
  const steps = [
    text,
    `${b === 0 ? 'x' : `x ${fmtTerm(b)}`} = ${a} × ${c} = ${ac}  (beide kanten × ${a})`,
  ];
  if (b !== 0) steps.push(`x = ${ac} ${b >= 0 ? '-' : '+'} ${Math.abs(b)}`);
  steps.push(`x = ${xt}`);
  return { text, level: 4, isSingle: true, answer: xt, steps };
}

function genLevel5() {
  const r1 = randNonZero(-9, 9);
  const r2 = randNonZero(-9, 9);
  const bcoef = -(r1 + r2);
  const ccoef = r1 * r2;

  const parts = ['x²'];
  if (bcoef !== 0) parts.push(`${fmtTerm(bcoef)}x`);
  if (ccoef !== 0) parts.push(fmtTerm(ccoef));
  const text = `${parts.join(' ')} = 0`.replace(/\s+/g, ' ').trim();

  const steps = [
    text,
    `(x ${fmtTerm(-r1)})(x ${fmtTerm(-r2)}) = 0  (ontbonden in factoren)`,
    `x = ${r1} of x = ${r2}`,
  ];

  const answer = r1 === r2 ? [r1] : [r1, r2].sort((x, y) => x - y);
  return { text, level: 5, isSingle: answer.length === 1, answer, steps };
}

const GENERATORS = {
  1: genLevel1,
  2: genLevel2,
  3: genLevel3,
  4: genLevel4,
  5: genLevel5,
};

export function generateProblem(level) {
  const gen = GENERATORS[level];
  if (!gen) throw new Error(`Onbekend niveau: ${level}`);
  return gen();
}

export function generateMixedProblem() {
  const level = randInt(1, 5);
  return generateProblem(level);
}

// --- Antwoorden controleren -------------------------------------------------

// Zet een door de leerling ingevoerde string om naar een getal.
// Ondersteunt gewone getallen, komma als decimaalteken, en breuken als "3/4".
export function parseAnswer(str) {
  if (typeof str !== 'string') return null;
  const s = str.trim().replace(',', '.');
  if (s === '') return null;
  if (s.includes('/')) {
    const [n, d] = s.split('/').map((part) => parseFloat(part));
    if (Number.isNaN(n) || Number.isNaN(d) || d === 0) return null;
    return n / d;
  }
  const val = parseFloat(s);
  return Number.isNaN(val) ? null : val;
}

const TOLERANCE = 1e-6;

// Controleert een leerling-antwoord tegen een opgave (uit generateProblem).
// Bij meerdere oplossingen (level 5) mag de leerling ze los, met komma of
// met "of" gescheiden invoeren, in willekeurige volgorde.
export function checkAnswer(problem, userInput) {
  if (problem.isSingle) {
    const value = parseAnswer(userInput);
    if (value === null) return false;
    return Math.abs(value - problem.answer) < TOLERANCE;
  }

  const parts = String(userInput)
    .toLowerCase()
    .split(/of|,|;/)
    .map((p) => parseAnswer(p))
    .filter((v) => v !== null);

  if (parts.length !== problem.answer.length) return false;
  const sorted = [...parts].sort((a, b) => a - b);
  return problem.answer.every((v, i) => Math.abs(v - sorted[i]) < TOLERANCE);
}

export function formatAnswer(problem) {
  if (problem.isSingle) {
    return problem.isSingle && Array.isArray(problem.answer)
      ? `x = ${problem.answer[0]}`
      : `x = ${problem.answer}`;
  }
  return problem.answer.map((v) => `x = ${v}`).join(' of ');
}
