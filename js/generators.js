// Genereert oefenopgaven voor de toetsoefentool wiskunde 3 vwo.
// Puur functionele module (geen DOM), zodat hij ook los te testen is.
//
// Elke opgave (het object dat een generate()-functie teruggeeft) heeft:
//   - text: de opgavetekst
//   - kind: 'single' | 'unordered-set' | 'ordered-pair'
//       'single'        -> answer is één getal
//       'unordered-set' -> answer is een array getallen, volgorde maakt niet uit
//                           (bv. de twee oplossingen van een kwadratische vergelijking)
//       'ordered-pair'  -> answer is een array van precies 2 getallen, volgorde
//                           maakt wél uit (bv. (x, y) van een top, of (rico, b))
//   - answer: zie hierboven
//   - answerText: kant-en-klare, opgemaakte tekst met het juiste antwoord
//   - steps: array met uitwerkingsstappen (strings)
//   - mistakes: array met herkenbare, veelgemaakte denkfouten { id, title,
//     explanation, value } waarbij value dezelfde vorm heeft als answer
//   - inputLabel / inputPlaceholder: tekst voor het invoerveld

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

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
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

// Formatteert een ingevulde waarde die gekwadrateerd wordt, met haakjes bij een
// negatief getal (anders is bv. "-6²" verwarrend: lijkt op -(6²) i.s.v. (-6)²).
function fmtSq(value) {
  return value < 0 ? `(${value})²` : `${value}²`;
}

// Rond een getal netjes af op (maximaal) `digits` decimalen, zonder overbodige
// nullen (bv. 2.50 -> "2.5", 3.00 -> "3").
function fmtNum(value, digits = 2) {
  return Number(value.toFixed(digits)).toString();
}

// ============================================================================
// Onderwerp 1: Vergelijkingen oplossen
// ============================================================================

const VERGELIJKINGEN_LEVELS = [
  {
    id: 1,
    title: 'Eenvoudige vergelijkingen',
    example: 'bijv. 3x + 5 = 20',
    uitleg: [
      'Breng het losse getal naar de andere kant van het =-teken (teken verandert).',
      'Deel daarna beide kanten door het getal voor de x.',
    ],
    generate: genVergelijking1,
  },
  {
    id: 2,
    title: 'De onbekende aan beide kanten',
    example: 'bijv. 5x - 3 = 2x + 9',
    uitleg: [
      'Breng alle x-termen naar één kant en alle losse getallen naar de andere kant.',
      'Tel op / trek af aan beide kanten, en deel daarna door het getal voor de x.',
    ],
    generate: genVergelijking2,
  },
  {
    id: 3,
    title: 'Vergelijkingen met haakjes',
    example: 'bijv. 4(x - 2) = 16',
    uitleg: [
      'Werk eerst de haakjes weg door alles binnen de haakjes te vermenigvuldigen.',
      'Los daarna op zoals een gewone vergelijking.',
    ],
    generate: genVergelijking3,
  },
  {
    id: 4,
    title: 'Vergelijkingen met breuken',
    example: 'bijv. (x + 3) / 4 = 2',
    uitleg: [
      'Vermenigvuldig beide kanten met de noemer om van de breuk af te komen.',
      'Los daarna op zoals een gewone vergelijking.',
    ],
    generate: genVergelijking4,
  },
  {
    id: 5,
    title: 'Kwadratische vergelijkingen (ontbinden)',
    example: 'bijv. x² - x - 6 = 0',
    uitleg: [
      'Ontbind in factoren: (x - p)(x - q) = 0.',
      'Een product is 0 als één van de factoren 0 is, dus x = p of x = q.',
    ],
    generate: genVergelijking5,
  },
];

const ANSWER_LABEL_X = { inputLabel: 'Antwoord (x = ...):', inputPlaceholder: 'bijv. 4 of -2,5' };
const ANSWER_LABEL_X_MEERDERE = {
  inputLabel: 'Antwoord (x = ...), gescheiden door een komma:',
  inputPlaceholder: 'bijv. 2, -3',
};

function genVergelijking1() {
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

  return {
    text,
    kind: 'single',
    answer: xt,
    answerText: `x = ${xt}`,
    steps,
    mistakes,
    ...ANSWER_LABEL_X,
  };
}

function genVergelijking2() {
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
  const steps = [text, `${afterMove} = ${d}  (${c}x is van beide kanten afgetrokken)`];
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

  return {
    text,
    kind: 'single',
    answer: xt,
    answerText: `x = ${xt}`,
    steps,
    mistakes: mistakes.filter((m) => m.value !== null),
    ...ANSWER_LABEL_X,
  };
}

function genVergelijking3() {
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

  return { text, kind: 'single', answer: xt, answerText: `x = ${xt}`, steps, mistakes, ...ANSWER_LABEL_X };
}

function genVergelijking4() {
  const a = randInt(2, 5);
  const xt = randNonZero(-12, 12);
  const k = randInt(-8, 8);
  const b = a * k - xt;
  const c = k;

  const text = b === 0 ? `x / ${a} = ${c}` : `(x ${fmtTerm(b)}) / ${a} = ${c}`;
  const ac = a * c;
  const steps = [text, `${b === 0 ? 'x' : `x ${fmtTerm(b)}`} = ${a} × ${c} = ${ac}  (beide kanten × ${a})`];
  if (b !== 0) steps.push(`x = ${ac} ${b >= 0 ? '-' : '+'} ${Math.abs(b)}`);
  steps.push(`x = ${xt}`);

  const mistakes = [
    {
      id: 'niet-vermenigvuldigd',
      title: 'Niet met de noemer vermenigvuldigd',
      explanation: `Om van de breuk af te komen moet je beide kanten met de noemer (${a}) vermenigvuldigen: ${b === 0 ? 'x' : `x ${fmtTerm(b)}`} = ${a} × ${c}. Het lijkt erop dat je dat niet hebt gedaan.`,
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

  return {
    text,
    kind: 'single',
    answer: xt,
    answerText: `x = ${xt}`,
    steps,
    mistakes: mistakes.filter((m) => m.value !== null),
    ...ANSWER_LABEL_X,
  };
}

function genVergelijking5() {
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

  return {
    text,
    kind: answer.length === 1 ? 'single' : 'unordered-set',
    answer: answer.length === 1 ? answer[0] : answer,
    answerText: answer.map((v) => `x = ${v}`).join(' of '),
    steps,
    mistakes,
    ...(answer.length === 1 ? ANSWER_LABEL_X : ANSWER_LABEL_X_MEERDERE),
  };
}

// ============================================================================
// Onderwerp 2: Parabolen (kwadratische functies)
// ============================================================================

const PARABOLEN_LEVELS = [
  {
    id: 1,
    title: 'De top van een parabool berekenen',
    example: 'bijv. f(x) = 2x² - 8x + 3',
    uitleg: [
      'Bereken eerst de x-coördinaat van de top: x = -b / (2a).',
      'Vul die x-waarde in f(x) in om de y-coördinaat van de top te vinden.',
    ],
    generate: genParabolenTop,
  },
  {
    id: 2,
    title: 'Nulpunten vinden door te ontbinden',
    example: 'bijv. f(x) = 3x² - 12x, nulpunten van f',
    uitleg: [
      'Haal x buiten haakjes: ax² + bx = ax(x + ...).',
      'Een product is 0 als één van de factoren 0 is: dus x = 0 óf de andere factor is 0. Deel nooit door x weg, want dan raak je de oplossing x = 0 kwijt.',
    ],
    generate: genParabolenNulpunten,
  },
  {
    id: 3,
    title: 'Functievoorschrift opstellen',
    example: 'bijv. gaat door de oorsprong en door (2, 12)',
    uitleg: [
      'Vul de gegeven b in en gebruik dat de grafiek door de oorsprong gaat (dan is c = 0).',
      'Vul de coördinaten van het gegeven punt in voor x en y, en los de vergelijking op voor a.',
    ],
    generate: genParabolenFunctievoorschrift,
  },
];

function genParabolenTop() {
  const a = pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]);
  const xTop = randInt(-6, 6);
  const b = -2 * a * xTop;
  const c = randInt(-10, 10);
  const yTop = c - a * xTop * xTop;

  const parts = [`${a}x²`];
  if (b !== 0) parts.push(`${fmtTerm(b)}x`);
  if (c !== 0) parts.push(fmtTerm(c));
  const text = `f(x) = ${parts.join(' ')}`.replace(/\s+/g, ' ').trim();

  const substitutionParts = [`${a} × ${fmtSq(xTop)}`];
  if (b !== 0) substitutionParts.push(`${fmtTerm(b)} × ${xTop}`);
  if (c !== 0) substitutionParts.push(fmtTerm(c));
  const evaluationParts = [`${a * xTop * xTop}`];
  if (b * xTop !== 0) evaluationParts.push(fmtTerm(b * xTop));
  if (c !== 0) evaluationParts.push(fmtTerm(c));

  const steps = [
    `x-top = -b / (2a) = -(${b}) / (2 × ${a}) = ${xTop}`,
    `y-top = f(${xTop}) = ${substitutionParts.join(' ')} = ${evaluationParts.join(' ')} = ${yTop}`,
    `De top is (${xTop}, ${yTop})`,
  ];

  const mistakes = [];
  if (b !== 0) {
    const wrongX = b / (2 * a);
    const wrongY = a * wrongX * wrongX + b * wrongX + c;
    mistakes.push({
      id: 'geen-minteken-xtop',
      title: 'Minteken vergeten bij de x-top',
      explanation: `De formule is x-top = -b / (2a), mét een minteken. Jij hebt waarschijnlijk x = b / (2a) = ${fmtNum(wrongX)} gebruikt (zonder het minteken) in plaats van ${xTop}.`,
      value: [wrongX, wrongY],
    });
  }
  const wrongY2 = a * xTop * xTop + c;
  if (wrongY2 !== yTop) {
    const wrongParts = [`${a} × ${fmtSq(xTop)}`];
    if (c !== 0) wrongParts.push(fmtTerm(c));
    mistakes.push({
      id: 'bx-term-vergeten-bij-y',
      title: 'De bx-term vergeten bij het berekenen van y',
      explanation: `Bij het berekenen van y-top moet je ook de term ${fmtTerm(b)}x invullen, niet alleen ax² + c. Je bent waarschijnlijk gestopt bij y = ${wrongParts.join(' ')} = ${wrongY2}.`,
      value: [xTop, wrongY2],
    });
  }

  return {
    text,
    kind: 'ordered-pair',
    answer: [xTop, yTop],
    answerText: `top = (${xTop}, ${yTop})`,
    steps,
    mistakes,
    inputLabel: 'Coördinaten van de top (x, y):',
    inputPlaceholder: 'bijv. 2, 8 of -3, -5',
  };
}

function genParabolenNulpunten() {
  const a = pick([-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9]);
  const r = randNonZero(-9, 9);
  const b = -a * r;

  const text = `f(x) = ${a}x² ${fmtTerm(b)}x`;
  const steps = [
    `${a}x² ${fmtTerm(b)}x = 0`,
    `${a}x(x ${fmtTerm(-r)}) = 0`,
    `${a}x = 0 of x ${fmtTerm(-r)} = 0`,
    `x = 0 of x = ${r}`,
  ];

  const sorted = [0, r].sort((x, y) => x - y);
  const mistakes = [
    {
      id: 'gedeeld-door-x',
      title: 'Door x gedeeld (oplossing x = 0 kwijtgeraakt)',
      explanation: `Als je hier door x deelt, wordt ${a}x² ${fmtTerm(b)}x = 0 tot ${a}x ${fmtTerm(b)} = 0, en vind je alleen x = ${r}. Maar je mag nooit door een variabele delen zonder te checken of die 0 kan zijn — daarmee raak je de oplossing x = 0 kwijt. Ontbind in plaats daarvan in factoren: ${a}x(x ${fmtTerm(-r)}) = 0.`,
      value: [r],
    },
  ];

  return {
    text,
    kind: 'unordered-set',
    answer: sorted,
    answerText: sorted.map((v) => `x = ${v}`).join(' of '),
    steps,
    mistakes,
    ...ANSWER_LABEL_X_MEERDERE,
  };
}

function genParabolenFunctievoorschrift() {
  const a = pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]);
  const b = randInt(-9, 9);
  const p = randNonZero(-8, 8);
  const q = a * p * p + b * p;

  const bxTermText = b === 0 ? '' : ` ${fmtTerm(b)}x`;
  const text = `Een parabool met functievoorschrift f(x) = ax²${bxTermText} gaat door de oorsprong en door het punt (${p}, ${q}). Bereken a.`;

  const substitutionParts = [`a × ${fmtSq(p)}`];
  if (b !== 0) substitutionParts.push(`${fmtTerm(b)} × ${p}`);

  const steps = [`Invullen van x = ${p}, y = ${q}: ${q} = ${substitutionParts.join(' ')}`];
  if (b !== 0) {
    steps.push(`${q} = ${p * p}a ${fmtTerm(b * p)}`);
    steps.push(`${q - b * p} = ${p * p}a`);
  }
  steps.push(`a = ${q - b * p} : ${p * p} = ${a}`);

  const mistakes = [];
  if (b !== 0) {
    mistakes.push({
      id: 'bx-term-genegeerd',
      title: 'De bx-term genegeerd',
      explanation: `Je hebt waarschijnlijk alleen ${q} = a × ${fmtSq(p)} gebruikt en de term ${fmtTerm(b)} × ${p} niet meegenomen. Dat geeft a = ${q} : ${p * p}, maar je moet eerst ${fmtTerm(b * p)} verrekenen.`,
      value: q / (p * p),
    });
  }
  return {
    text,
    kind: 'single',
    answer: a,
    answerText: `a = ${a}`,
    steps,
    mistakes,
    inputLabel: 'Waarde van a:',
    inputPlaceholder: 'bijv. 3 of -2',
  };
}

// ============================================================================
// Onderwerp 3: Lineaire functies
// ============================================================================

const LINEAIR_LEVELS = [
  {
    id: 1,
    title: 'Snijpunten met de assen en oppervlakte',
    example: 'bijv. y = -2x + 8, oppervlakte driehoek OPQ',
    uitleg: [
      'Snijpunt met de x-as: vul y = 0 in en los x op.',
      'Snijpunt met de y-as: vul x = 0 in.',
      'Oppervlakte van de driehoek met de oorsprong: ½ × basis × hoogte.',
    ],
    generate: genLineairOppervlakte,
  },
  {
    id: 2,
    title: 'Een onbekende parameter berekenen',
    example: 'bijv. y = -2x + a, oppervlakte is 36, bereken a',
    uitleg: [
      'Druk de oppervlakte uit in de onbekende a.',
      'Los de (vaak kwadratische) vergelijking op, en verwerp oplossingen die niet aan de voorwaarden voldoen (bv. a > 0).',
    ],
    generate: genLineairParameter,
  },
  {
    id: 3,
    title: 'Hellingsgetal en functievoorschrift',
    example: 'bijv. door de punten (2, 17) en (8, 32)',
    uitleg: [
      'Hellingsgetal (rico) = toename y : toename x.',
      'Vul daarna één van de punten in om de constante b te vinden.',
    ],
    generate: genLineairRico,
  },
];

function genLineairOppervlakte() {
  const m = pick([-1, -2, -3, -4]);
  const xInt = randInt(2, 12);
  const b = -m * xInt;
  const area = 0.5 * xInt * b;

  const text = `Gegeven is de lijn y = ${m}x ${fmtTerm(b)}. Deze lijn snijdt de x-as in punt P en de y-as in punt Q. Bereken de oppervlakte van driehoek OPQ.`;
  const steps = [
    `y = 0: 0 = ${m}x ${fmtTerm(b)}, dus x = ${-b} : ${m} = ${xInt}. P = (${xInt}, 0)`,
    `x = 0: y = ${b}. Q = (0, ${b})`,
    `Oppervlakte = ½ × ${xInt} × ${b} = ${fmtNum(area)}`,
  ];

  const mistakes = [
    {
      id: 'geen-half',
      title: 'Vergeten te halveren',
      explanation: `De oppervlakte van een driehoek is ½ × basis × hoogte. Je hebt waarschijnlijk ${xInt} × ${b} = ${xInt * b} berekend, maar vergeten dit nog door 2 te delen.`,
      value: xInt * b,
    },
  ];

  return {
    text,
    kind: 'single',
    answer: area,
    answerText: `oppervlakte = ${fmtNum(area)}`,
    steps,
    mistakes,
    inputLabel: 'Oppervlakte:',
    inputPlaceholder: 'bijv. 24 of 7,5',
  };
}

function genLineairParameter() {
  const j = randInt(2, 12);
  const aTarget = 2 * j;
  const S = j * j;

  const text = `Gegeven is de lijn y = -2x + a, met a > 0. Deze lijn snijdt de x-as in P en de y-as in Q. De oppervlakte van driehoek OPQ is ${S}. Bereken a.`;
  const steps = [
    `P = (a/2, 0) en Q = (0, a)`,
    `Oppervlakte = ½ × (a/2) × a = ¼a² = ${S}`,
    `a² = ${4 * S}`,
    `a = ${aTarget} (a = -${aTarget} voldoet niet, want a > 0)`,
  ];

  const mistakes = [
    {
      id: 'negatieve-wortel-niet-verworpen',
      title: 'De negatieve oplossing niet verworpen',
      explanation: `a = -${aTarget} voldoet wiskundig ook aan a² = ${4 * S}, maar in deze situatie is a een lengte in de grafiek, dus moet a > 0 zijn. Die oplossing vervalt dus.`,
      value: -aTarget,
    },
    {
      id: 'kwart-vergeten',
      title: 'Met ½a² gerekend in plaats van ¼a²',
      explanation: `De oppervlakte is ¼a² (niet ½a²), omdat P = (a/2, 0) ligt — de helft van a. Je hebt waarschijnlijk ½a² = ${S} opgelost.`,
      value: Math.sqrt(2 * S),
    },
  ];

  return {
    text,
    kind: 'single',
    answer: aTarget,
    answerText: `a = ${aTarget}`,
    steps,
    mistakes,
    inputLabel: 'Waarde van a:',
    inputPlaceholder: 'bijv. 10',
  };
}

function genLineairRico() {
  let x1;
  let x2;
  let den;
  let ricoNum;
  let rico;
  do {
    den = pick([1, 2]);
    ricoNum = randNonZero(-12, 12);
    rico = ricoNum / den;
    x1 = den * randInt(-5, 5);
    x2 = den * randInt(-5, 5);
  } while (x1 === x2 || Math.abs(rico) > 6);

  const b = randInt(-20, 20);
  const y1 = rico * x1 + b;
  const y2 = rico * x2 + b;

  const text = `Een lineaire functie f gaat door de punten (${x1}, ${y1}) en (${x2}, ${y2}). Bereken het hellingsgetal (rico) en het functievoorschrift van f.`;
  const steps = [
    `Toename x: ${x2} - ${x1} = ${x2 - x1}`,
    `Toename y: ${y2} - ${y1} = ${y2 - y1}`,
    `Hellingsgetal = ${y2 - y1} : ${x2 - x1} = ${fmtNum(rico)}`,
    `Invullen van (${x1}, ${y1}) in f(x) = ${fmtNum(rico)}x + b: ${y1} = ${fmtNum(rico)} × ${x1} + b, dus b = ${y1} - ${fmtNum(rico * x1)} = ${b}`,
    `f(x) = ${b === 0 ? `${fmtNum(rico)}x` : `${fmtNum(rico)}x ${fmtTerm(b)}`}`,
  ];

  const mistakes = [];
  if (y1 !== b) {
    mistakes.push({
      id: 'punt-als-intercept-gebruikt',
      title: 'Het eerste punt direct als constante b gebruikt',
      explanation: `Je hebt waarschijnlijk gedacht dat b = ${y1} (de y-waarde van het eerste punt), maar dat klopt alleen als x = 0. Vul het punt in in f(x) = ${fmtNum(rico)}x + b om b = ${b} te vinden.`,
      value: [rico, y1],
    });
  }

  return {
    text,
    kind: 'ordered-pair',
    answer: [rico, b],
    answerText: `rico = ${fmtNum(rico)}, b = ${b}`,
    steps,
    mistakes,
    inputLabel: 'Rico, b (in die volgorde):',
    inputPlaceholder: 'bijv. 2.5, 2',
  };
}

// ============================================================================
// Onderwerp 4: Exponentiële groei en afname
// ============================================================================

const GROEIFACTOREN = [0.8, 0.85, 0.88, 0.9, 0.92, 1.05, 1.1, 1.15, 1.2, 1.25];
const AFNAME_FACTOREN = [0.8, 0.85, 0.88, 0.9, 0.92];

const EXPONENTIEEL_LEVELS = [
  {
    id: 1,
    title: 'De waarde na n stappen berekenen',
    example: 'bijv. beginwaarde 500, groeifactor 1,1, na 6 dagen',
    uitleg: [
      'Vermenigvuldig de beginwaarde n keer met de groeifactor: waarde = begin × groeifactor^n.',
      'Gebruik hiervoor de machtsknop van je rekenmachine, niet een gewone vermenigvuldiging met n.',
    ],
    generate: genExponentieelWaarde,
  },
  {
    id: 2,
    title: 'De groeifactor berekenen',
    example: 'bijv. van 500 naar 806 in 3 dagen',
    uitleg: [
      'begin × groeifactor^n = eind, dus groeifactor^n = eind : begin.',
      'Neem de n-de-machtswortel om de groeifactor te vinden: groeifactor = (eind : begin)^(1/n).',
    ],
    generate: genExponentieelGroeifactor,
  },
  {
    id: 3,
    title: 'Aantal stappen tot een grenswaarde',
    example: 'bijv. wanneer voor het eerst minder dan 600',
    uitleg: [
      'Probeer verschillende waarden van n (bijvoorbeeld met de rekenmachine) totdat je net over de grens heen bent.',
      'Check steeds het getal ervoor én erna: het antwoord is het eerste getal waarvoor het al klopt.',
    ],
    generate: genExponentieelDagenTotGrens,
  },
];

function genExponentieelWaarde() {
  const N0 = randInt(100, 2000);
  const g = pick(GROEIFACTOREN);
  const n = randInt(3, 10);
  const answer = Math.round(N0 * Math.pow(g, n));

  const text = `Een aantal begint bij ${N0} en heeft een groeifactor van ${g} per dag. Hoeveel is het na ${n} dagen? (rond af op een heel getal)`;
  const steps = [
    `aantal = ${N0} × ${g}^${n}`,
    `${g}^${n} ≈ ${fmtNum(Math.pow(g, n), 4)}`,
    `aantal ≈ ${N0} × ${fmtNum(Math.pow(g, n), 4)} ≈ ${answer}`,
  ];

  const mistakes = [
    {
      id: 'macht-vergeten',
      title: 'Niet met een macht, maar lineair gerekend',
      explanation: `Je hebt waarschijnlijk ${N0} × ${g} × ${n} = ${Math.round(N0 * g * n)} berekend. Maar bij een groeifactor vermenigvuldig je elke stap opnieuw: dat is ${g}^${n}, niet ${g} × ${n}.`,
      value: Math.round(N0 * g * n),
    },
    {
      id: 'macht-min-1',
      title: 'Eén dag te weinig gerekend',
      explanation: `Je hebt waarschijnlijk ${g}^${n - 1} gebruikt in plaats van ${g}^${n} — dat is één dag te weinig.`,
      value: Math.round(N0 * Math.pow(g, n - 1)),
    },
  ];

  return {
    text,
    kind: 'single',
    answer,
    answerText: `≈ ${answer}`,
    steps,
    mistakes: mistakes.filter((m) => m.value !== answer),
    tolerance: 1,
    inputLabel: 'Aantal (afgerond):',
    inputPlaceholder: 'bijv. 850',
  };
}

function genExponentieelGroeifactor() {
  const N0 = randInt(100, 1000);
  const g = pick(GROEIFACTOREN);
  const n = randInt(2, 5);
  const Nn = Math.round(N0 * Math.pow(g, n));

  const text = `Een aantal begint bij ${N0}. Na ${n} dagen is het ${Nn}. Bereken de (afgeronde) groeifactor per dag.`;
  const steps = [
    `groeifactor^${n} = ${Nn} : ${N0} = ${fmtNum(Nn / N0, 4)}`,
    `groeifactor = (${fmtNum(Nn / N0, 4)})^(1/${n}) ≈ ${g}`,
  ];

  const mistakes = [
    {
      id: 'macht-niet-omgekeerd',
      title: 'De n-de-machtswortel vergeten',
      explanation: `Je hebt waarschijnlijk ${Nn} : ${N0} : ${n} = ${fmtNum(Nn / N0 / n, 3)} berekend (gedeeld door n). Om de groeifactor te vinden moet je juist de n-de-machtswortel nemen: (${fmtNum(Nn / N0, 3)})^(1/${n}).`,
      value: Nn / N0 / n,
    },
  ];

  return {
    text,
    kind: 'single',
    answer: g,
    answerText: `≈ ${g}`,
    steps,
    mistakes,
    tolerance: 0.015,
    inputLabel: 'Groeifactor (afgerond op 2 decimalen):',
    inputPlaceholder: 'bijv. 1,1',
  };
}

function genExponentieelDagenTotGrens() {
  const N0 = randInt(1000, 10000);
  const g = pick(AFNAME_FACTOREN);
  const T = randInt(Math.floor(N0 * 0.2), Math.floor(N0 * 0.8));

  let n = 0;
  let val = N0;
  while (val >= T && n < 200) {
    n += 1;
    val = N0 * Math.pow(g, n);
  }
  const answer = n;

  const valBefore = Math.round(N0 * Math.pow(g, answer - 1));
  const valAfter = Math.round(N0 * Math.pow(g, answer));

  const text = `Een aantal van ${N0} neemt elke dag af met een factor ${g}. Na hoeveel dagen is het voor het eerst minder dan ${T}?`;
  const steps = [
    `Na ${answer - 1} dagen: ${N0} × ${g}^${answer - 1} ≈ ${valBefore} (nog niet minder dan ${T})`,
    `Na ${answer} dagen: ${N0} × ${g}^${answer} ≈ ${valAfter} (voor het eerst minder dan ${T})`,
    `Antwoord: na ${answer} dagen`,
  ];

  const mistakes = [
    {
      id: 'dag-te-vroeg',
      title: 'Eén dag te vroeg',
      explanation: `Na ${answer - 1} dagen zijn het er nog ${valBefore} — dat is nog niet minder dan ${T}. Pas na ${answer} dagen is het voor het eerst minder dan ${T}.`,
      value: answer - 1,
    },
    {
      id: 'dag-te-laat',
      title: 'Eén dag te laat',
      explanation: `Na ${answer} dagen is het al voor het eerst minder dan ${T} (namelijk ${valAfter}). Na ${answer - 1} dagen was het nog ${valBefore}, dus nog niet minder dan ${T}.`,
      value: answer + 1,
    },
  ];

  return {
    text,
    kind: 'single',
    answer,
    answerText: `${answer} dagen`,
    steps,
    mistakes: mistakes.filter((m) => m.value >= 1 && m.value !== answer),
    inputLabel: 'Aantal dagen:',
    inputPlaceholder: 'bijv. 12',
  };
}

// ============================================================================
// Onderwerpen bundelen
// ============================================================================

export const TOPICS = [
  { id: 'vergelijkingen', title: 'Vergelijkingen oplossen', levels: VERGELIJKINGEN_LEVELS },
  { id: 'parabolen', title: 'Parabolen (kwadratische functies)', levels: PARABOLEN_LEVELS },
  { id: 'lineair', title: 'Lineaire functies', levels: LINEAIR_LEVELS },
  { id: 'exponentieel', title: 'Exponentiële groei en afname', levels: EXPONENTIEEL_LEVELS },
];

function findLevel(topicId, levelId) {
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic) throw new Error(`Onbekend onderwerp: ${topicId}`);
  const level = topic.levels.find((l) => l.id === levelId);
  if (!level) throw new Error(`Onbekend niveau: ${topicId} / ${levelId}`);
  return { topic, level };
}

export function generateProblem(topicId, levelId) {
  const { level } = findLevel(topicId, levelId);
  const problem = level.generate();
  problem.topic = topicId;
  problem.level = levelId;
  return problem;
}

export function generateMixedProblem(topicId) {
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic) throw new Error(`Onbekend onderwerp: ${topicId}`);
  const level = pick(topic.levels);
  return generateProblem(topicId, level.id);
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

function splitParts(userInput) {
  return String(userInput)
    .toLowerCase()
    .split(/of|,|;/)
    .map((p) => parseAnswer(p))
    .filter((v) => v !== null);
}

const TOLERANCE = 1e-6;

function tol(problem) {
  return problem.tolerance ?? TOLERANCE;
}

// Controleert een leerling-antwoord tegen een opgave (uit generateProblem).
export function checkAnswer(problem, userInput) {
  const t = tol(problem);

  if (problem.kind === 'single') {
    const value = parseAnswer(userInput);
    if (value === null) return false;
    return Math.abs(value - problem.answer) < t;
  }

  const parts = splitParts(userInput);

  if (problem.kind === 'ordered-pair') {
    if (parts.length !== 2) return false;
    return Math.abs(parts[0] - problem.answer[0]) < t && Math.abs(parts[1] - problem.answer[1]) < t;
  }

  // 'unordered-set': volgorde maakt niet uit
  if (parts.length !== problem.answer.length) return false;
  const sorted = [...parts].sort((a, b) => a - b);
  return problem.answer.every((v, i) => Math.abs(v - sorted[i]) < t);
}

// --- Foutpatronen herkennen -------------------------------------------------

// Algemene tip per (onderwerp, niveau), gebruikt als een fout antwoord niet
// overeenkomt met een van de specifiek herkende foutpatronen.
const MISTAKE_FALLBACK = {
  'vergelijkingen:1': 'Reken de opgave rustig opnieuw uit, stap voor stap: eerst het losse getal wegwerken, dan pas delen. Vergelijk elke stap met de uitwerking hieronder.',
  'vergelijkingen:2': 'Zet eerst alle x-termen aan één kant en alle losse getallen aan de andere kant, stap voor stap. Vergelijk je aanpak met de uitwerking hieronder.',
  'vergelijkingen:3': 'Controleer of je de haakjes goed hebt weggewerkt: vermenigvuldig het getal vóór de haakjes met élke term binnen de haakjes. Vergelijk daarna met de uitwerking hieronder.',
  'vergelijkingen:4': 'Controleer of je eerst beide kanten met de noemer hebt vermenigvuldigd voordat je verder rekende. Vergelijk daarna met de uitwerking hieronder.',
  'vergelijkingen:5': 'Ontbind eerst in twee factoren die vermenigvuldigd de losse term geven en opgeteld de x-term. Vergelijk daarna met de uitwerking hieronder.',
  'parabolen:1': 'Gebruik eerst x-top = -b / (2a), en vul die x-waarde daarna in f(x) in voor y-top. Vergelijk elke stap met de uitwerking hieronder.',
  'parabolen:2': 'Haal x buiten haakjes en vergeet x = 0 niet als oplossing. Vergelijk je aanpak met de uitwerking hieronder.',
  'parabolen:3': 'Vul het gegeven punt in in het functievoorschrift en los stap voor stap op naar a. Vergelijk met de uitwerking hieronder.',
  'lineair:1': 'Bereken eerst de snijpunten met de assen, en gebruik dan ½ × basis × hoogte. Vergelijk met de uitwerking hieronder.',
  'lineair:2': 'Druk de oppervlakte eerst uit in de onbekende, en los daarna de vergelijking op. Vergelijk met de uitwerking hieronder.',
  'lineair:3': 'Bereken eerst het hellingsgetal met toename y : toename x, en vul dan een punt in om b te vinden. Vergelijk met de uitwerking hieronder.',
  'exponentieel:1': 'Gebruik begin × groeifactor^n, met de macht-knop van je rekenmachine. Vergelijk met de uitwerking hieronder.',
  'exponentieel:2': 'Gebruik groeifactor = (eind : begin)^(1/n). Vergelijk met de uitwerking hieronder.',
  'exponentieel:3': 'Probeer verschillende waarden van n en check steeds het getal ervoor en erna. Vergelijk met de uitwerking hieronder.',
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
  'geen-minteken-xtop': 'De top van een parabool ligt bij x = -b / (2a) — vergeet het minteken niet.',
  'bx-term-vergeten-bij-y': 'Vul bij het berekenen van y-top écht alle termen in: ax² + bx + c, niet alleen ax² + c.',
  'gedeeld-door-x': 'Deel nooit door x (of een andere variabele) — daarmee kun je de oplossing x = 0 kwijtraken. Haal x buiten haakjes in plaats daarvan.',
  'bx-term-genegeerd': 'Vul altijd élke term van het functievoorschrift in, ook de bx-term.',
  'geen-half': 'De oppervlakte van een driehoek is ½ × basis × hoogte — vergeet die ½ niet.',
  'negatieve-wortel-niet-verworpen': 'Een vergelijking als a² = ... heeft meestal twee oplossingen. Check of de context (bv. a > 0) één ervan uitsluit.',
  'kwart-vergeten': 'Werk de formule voor de oppervlakte helemaal uit voordat je gaat rekenen, en let op breuken als ¼ of ½.',
  'punt-als-intercept-gebruikt': 'b is alleen gelijk aan de y-waarde van een punt als dat punt bij x = 0 hoort. Vul anders altijd een punt in om b te berekenen.',
  'macht-vergeten': 'Bij groeifactoren gebruik je een macht (groeifactor^n), niet een vermenigvuldiging met n.',
  'macht-min-1': 'Tel het aantal stappen goed: na n dagen gebruik je de macht n, niet n - 1.',
  'macht-niet-omgekeerd': 'Om een groeifactor te vinden uit begin- en eindwaarde, neem je de n-de-machtswortel, niet een deling door n.',
  'dag-te-vroeg': 'Check altijd het getal vóór je antwoord: is dat nog niet over de grens, dan is je antwoord goed; is het al over de grens, dan is je antwoord één te laat.',
  'dag-te-laat': 'Check altijd het getal ná je antwoord: als dat al over de grens is, was je eigen antwoord nog niet ver genoeg.',
};

function fallbackMistake(problem) {
  const key = `${problem.topic}:${problem.level}`;
  return {
    id: 'algemeen',
    title: 'Vergelijk met de uitwerking',
    explanation: MISTAKE_FALLBACK[key] || 'Vergelijk je berekening stap voor stap met de uitwerking hieronder.',
  };
}

// Probeert te herkennen welk denkpatroon tot een fout antwoord heeft geleid,
// door het leerling-antwoord te vergelijken met bekende, veelgemaakte
// rekenfouten voor dit type opgave (zie de `mistakes`-lijst per generator).
// Geeft altijd een uitleg terug (met een generieke tip als er geen specifiek
// patroon herkend is), zodat de leerling altijd feedback krijgt.
export function diagnoseMistake(problem, userInput) {
  const mistakes = problem.mistakes || [];
  const t = tol(problem);

  if (problem.kind === 'single') {
    const value = parseAnswer(userInput);
    if (value === null) {
      return { id: 'geen-antwoord', title: 'Geen geldig antwoord ingevuld', explanation: 'Vul een getal in, bijvoorbeeld 4 of -2,5.' };
    }
    const match = mistakes.find((m) => typeof m.value === 'number' && Math.abs(m.value - value) < t);
    return match || fallbackMistake(problem);
  }

  if (problem.kind === 'ordered-pair') {
    const parts = splitParts(userInput);
    if (parts.length === 0) {
      return {
        id: 'geen-antwoord',
        title: 'Geen geldig antwoord ingevuld',
        explanation: `Vul beide waarden in, gescheiden door een komma, bijvoorbeeld "${problem.inputPlaceholder ? problem.inputPlaceholder.replace('bijv. ', '') : '2, 3'}".`,
      };
    }
    const match = mistakes.find(
      (m) => Array.isArray(m.value) && m.value.length === 2 && Math.abs(m.value[0] - parts[0]) < t && Math.abs(m.value[1] - (parts[1] ?? NaN)) < t
    );
    return match || fallbackMistake(problem);
  }

  // 'unordered-set'
  const parts = splitParts(userInput);
  if (parts.length === 0) {
    return {
      id: 'geen-antwoord',
      title: 'Geen geldig antwoord ingevuld',
      explanation: 'Vul beide x-waarden in, gescheiden door een komma, bijvoorbeeld "2, -3".',
    };
  }

  const sorted = [...parts].sort((a, b) => a - b);
  const exactMatch = mistakes.find(
    (m) => Array.isArray(m.value) && m.value.length === sorted.length && m.value.every((v, i) => Math.abs(v - sorted[i]) < t)
  );
  if (exactMatch) return exactMatch;

  if (parts.length === 1 && problem.answer.some((a) => Math.abs(a - parts[0]) < t)) {
    return {
      id: 'maar-een-oplossing',
      title: 'Maar één van de twee oplossingen gevonden',
      explanation: `x = ${parts[0]} klopt, maar er is nog een tweede oplossing. Een kwadratische vergelijking die je ontbindt in twee verschillende factoren heeft twee x-waarden: als (x - p)(x - q) = 0, dan is x = p óf x = q.`,
    };
  }

  return fallbackMistake(problem);
}

export function formatAnswer(problem) {
  return problem.answerText;
}
