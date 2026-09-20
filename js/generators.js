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

  const mistakes = [
    {
      id: 'niet-gedeeld',
      title: 'Niet gedeeld door de coëfficiënt',
      explanation: `Je bent gestopt bij "${a}x = ${c - b}", maar bent vergeten om daarna nog door ${a} te delen om x alleen te krijgen.`,
      value: c - b,
    },
  ];
  if (b !== 0) {
    mistakes.push(
      {
        id: 'teken-niet-omgedraaid',
        title: 'Teken niet omgedraaid',
        explanation: `Je verplaatste ${fmtTerm(b)} niet goed naar de andere kant. Als een getal naar de andere kant van het =-teken gaat, verandert het teken: van + wordt -, en van - wordt +.`,
        value: (c + b) / a,
      },
      {
        id: 'los-getal-genegeerd',
        title: 'Het losse getal genegeerd',
        explanation: `Het lijkt erop dat je de ${fmtTerm(b)} niet hebt meegenomen. Werk eerst het losse getal weg, en deel dan pas door ${a}.`,
        value: c / a,
      }
    );
  }

  return { text, level: 1, isSingle: true, answer: xt, steps, mistakes };
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

  const mistakes = [
    {
      id: 'verkeerde-coefficient',
      title: 'Door de verkeerde coëfficiënt gedeeld',
      explanation: `Je deelde door ${a} (de coëfficiënt vóór het verplaatsen), maar nadat je ${c}x van beide kanten hebt afgetrokken, is de coëfficiënt van x nog maar ${diff}. Deel door ${diff}, niet door ${a}.`,
      value: a === 0 ? null : (d - b) / a,
    },
    {
      id: 'x-term-verkeerd-verplaatst',
      title: 'De x-term verkeerd verplaatst',
      explanation: `Je hebt ${c}x er waarschijnlijk bij opgeteld in plaats van van beide kanten afgetrokken. Om de x-termen samen te voegen, trek je ${c}x van beide kanten af: dat geeft (${a} - ${c})x, dus ${diff}x.`,
      value: a + c === 0 ? null : (d - b) / (a + c),
    },
  ];
  if (b !== 0) {
    mistakes.push({
      id: 'teken-niet-omgedraaid',
      title: 'Teken niet omgedraaid',
      explanation: `Je verplaatste ${fmtTerm(b)} niet goed naar de andere kant. Als een getal naar de andere kant van het =-teken gaat, verandert het teken.`,
      value: (d + b) / diff,
    });
  }

  return { text, level: 2, isSingle: true, answer: xt, steps, mistakes: mistakes.filter((m) => m.value !== null) };
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

  const mistakes = [
    {
      id: 'haakjes-niet-goed-weggewerkt',
      title: 'Haakjes niet goed weggewerkt',
      explanation: `${a}(x ${fmtTerm(b)}) betekent dat je ${a} met álles binnen de haakjes vermenigvuldigt: ${a}x ${fmtTerm(ab)}. Je hebt waarschijnlijk alleen de x vermenigvuldigd en het getal ${b} laten staan.`,
      value: (c - b) / a,
    },
    {
      id: 'niet-gedeeld',
      title: 'Niet gedeeld door de coëfficiënt',
      explanation: `Je bent gestopt bij "${a}x = ${c - ab}", maar bent vergeten om daarna nog door ${a} te delen.`,
      value: c - ab,
    },
  ];
  if (ab !== 0) {
    mistakes.push({
      id: 'teken-niet-omgedraaid',
      title: 'Teken niet omgedraaid',
      explanation: `Na het wegwerken van de haakjes moest je ${fmtTerm(ab)} naar de andere kant brengen. Daarbij verandert het teken.`,
      value: (c + ab) / a,
    });
  }

  return { text, level: 3, isSingle: true, answer: xt, steps, mistakes };
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

  const mistakes = [
    {
      id: 'niet-vermenigvuldigd',
      title: 'Niet met de noemer vermenigvuldigd',
      explanation: `Om van de breuk af te komen moet je beide kanten met de noemer (${a}) vermenigvuldigen: x ${fmtTerm(b)} = ${a} × ${c}. Het lijkt erop dat je dat niet hebt gedaan.`,
      value: c - b,
    },
    {
      id: 'gedeeld-in-plaats-van-vermenigvuldigd',
      title: 'Gedeeld in plaats van vermenigvuldigd',
      explanation: `Je hebt waarschijnlijk door ${a} gedeeld in plaats van ermee vermenigvuldigd. Bij een breuk x/${a} = ${c} moet je met ${a} vermenigvuldigen om x vrij te maken.`,
      value: a === 0 ? null : c / a - b,
    },
  ];
  if (b !== 0) {
    mistakes.push({
      id: 'teken-niet-omgedraaid',
      title: 'Teken niet omgedraaid',
      explanation: `Je verplaatste ${fmtTerm(b)} niet goed naar de andere kant. Als een getal naar de andere kant van het =-teken gaat, verandert het teken.`,
      value: ac + b,
    });
  }

  return { text, level: 4, isSingle: true, answer: xt, steps, mistakes: mistakes.filter((m) => m.value !== null) };
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

  const mistakes = [];
  if (r1 !== r2) {
    const flipped = [-r1, -r2].sort((x, y) => x - y);
    if (flipped[0] !== flipped[1]) {
      mistakes.push({
        id: 'teken-oplossingen-omgedraaid',
        title: 'Teken van de oplossingen omgedraaid',
        explanation: `Bij (x ${fmtTerm(-r1)})(x ${fmtTerm(-r2)}) = 0 geldt x = ${r1} en x = ${r2} (met het tegenovergestelde teken van wat er in de factor staat), niet ${flipped[0]} en ${flipped[1]}.`,
        value: flipped,
      });
    }
  }

  return { text, level: 5, isSingle: answer.length === 1, answer, steps, mistakes };
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

// --- Foutpatronen herkennen -------------------------------------------------

// Algemene tip per niveau, gebruikt als een fout antwoord niet overeenkomt
// met een van de specifiek herkende foutpatronen hierboven.
const MISTAKE_FALLBACK = {
  1: 'Reken de opgave rustig opnieuw uit, stap voor stap: eerst het losse getal wegwerken, dan pas delen. Vergelijk elke stap met de uitwerking hieronder.',
  2: 'Zet eerst alle x-termen aan één kant en alle losse getallen aan de andere kant, stap voor stap. Vergelijk je aanpak met de uitwerking hieronder.',
  3: 'Controleer of je de haakjes goed hebt weggewerkt: vermenigvuldig het getal vóór de haakjes met élke term binnen de haakjes. Vergelijk daarna met de uitwerking hieronder.',
  4: 'Controleer of je eerst beide kanten met de noemer hebt vermenigvuldigd voordat je verder rekende. Vergelijk daarna met de uitwerking hieronder.',
  5: 'Ontbind eerst in twee factoren die vermenigvuldigd de losse term geven en opgeteld de x-term. Vergelijk daarna met de uitwerking hieronder.',
};

// Algemene (niet-instantie-specifieke) herinnering per herkend denkpatroon,
// te gebruiken als tip vóórdat de leerling aan een volgende, vergelijkbare
// opgave begint.
export const MISTAKE_TIPS = {
  'teken-niet-omgedraaid': 'Let op het teken: als je een term naar de andere kant van het =-teken brengt, verandert + in - en - in +.',
  'niet-gedeeld': 'Vergeet aan het eind niet om nog door de coëfficiënt vóór de x te delen.',
  'los-getal-genegeerd': 'Neem élke term uit de vergelijking mee in je berekening, ook de losse getallen.',
  'verkeerde-coefficient': 'Bepaal pas ná het samenvoegen van de x-termen door welk getal je moet delen.',
  'x-term-verkeerd-verplaatst': 'Als je een x-term naar de andere kant verplaatst, trek je hem af aan beide kanten (niet optellen).',
  'haakjes-niet-goed-weggewerkt': 'Vermenigvuldig het getal vóór de haakjes met élke term binnen de haakjes, niet alleen met de x.',
  'niet-vermenigvuldigd': 'Vermenigvuldig eerst beide kanten met de noemer om van de breuk af te komen.',
  'gedeeld-in-plaats-van-vermenigvuldigd': 'Om een breuk weg te werken, vermenigvuldig je met de noemer — je deelt er niet door.',
  'maar-een-oplossing': 'Een ontbonden kwadratische vergelijking (x - p)(x - q) = 0 heeft meestal twéé oplossingen: zoek ze allebei.',
  'teken-oplossingen-omgedraaid': 'Bij de factor (x - p) is de oplossing x = p, niet x = -p. Check steeds het teken.',
};

function fallbackMistake(level) {
  return {
    id: 'algemeen',
    title: 'Vergelijk met de uitwerking',
    explanation: MISTAKE_FALLBACK[level] || 'Vergelijk je berekening stap voor stap met de uitwerking hieronder.',
  };
}

// Probeert te herkennen welk denkpatroon tot een fout antwoord heeft geleid,
// door het leerling-antwoord te vergelijken met bekende, veelgemaakte
// rekenfouten voor dit type opgave (zie de `mistakes`-lijst per generator).
// Geeft altijd een uitleg terug (met een generieke tip als er geen specifiek
// patroon herkend is), zodat de leerling altijd feedback krijgt.
export function diagnoseMistake(problem, userInput) {
  const mistakes = problem.mistakes || [];

  if (problem.isSingle) {
    const value = parseAnswer(userInput);
    if (value === null) {
      return {
        id: 'geen-antwoord',
        title: 'Geen geldig antwoord ingevuld',
        explanation: 'Vul een getal in, bijvoorbeeld 4 of -2,5.',
      };
    }
    const match = mistakes.find((m) => typeof m.value === 'number' && Math.abs(m.value - value) < TOLERANCE);
    return match || fallbackMistake(problem.level);
  }

  const parts = String(userInput)
    .toLowerCase()
    .split(/of|,|;/)
    .map((p) => parseAnswer(p))
    .filter((v) => v !== null);

  if (parts.length === 0) {
    return {
      id: 'geen-antwoord',
      title: 'Geen geldig antwoord ingevuld',
      explanation: 'Vul beide x-waarden in, gescheiden door een komma, bijvoorbeeld "2, -3".',
    };
  }

  if (parts.length === 1 && problem.answer.some((a) => Math.abs(a - parts[0]) < TOLERANCE)) {
    return {
      id: 'maar-een-oplossing',
      title: 'Maar één van de twee oplossingen gevonden',
      explanation: `x = ${parts[0]} klopt, maar er is nog een tweede oplossing. Een kwadratische vergelijking die je ontbindt in twee verschillende factoren heeft twee x-waarden: als (x - p)(x - q) = 0, dan is x = p óf x = q.`,
    };
  }

  const sorted = [...parts].sort((a, b) => a - b);
  const match = mistakes.find(
    (m) =>
      Array.isArray(m.value) &&
      m.value.length === sorted.length &&
      m.value.every((v, i) => Math.abs(v - sorted[i]) < TOLERANCE)
  );
  return match || fallbackMistake(problem.level);
}

export function formatAnswer(problem) {
  if (problem.isSingle) {
    return problem.isSingle && Array.isArray(problem.answer)
      ? `x = ${problem.answer[0]}`
      : `x = ${problem.answer}`;
  }
  return problem.answer.map((v) => `x = ${v}`).join(' of ');
}
