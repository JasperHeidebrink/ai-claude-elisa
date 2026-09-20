# ai-claude-elisa

Oefentool voor het voorbereiden op wiskundetoetsen in 3 vwo. Vier onderwerpen,
elk met oplopende niveaus:

1. **Vergelijkingen oplossen**
   1. Eenvoudige vergelijkingen (`3x + 5 = 20`)
   2. De onbekende aan beide kanten (`5x - 3 = 2x + 9`)
   3. Vergelijkingen met haakjes (`4(x - 2) = 16`)
   4. Vergelijkingen met breuken (`(x + 3) / 4 = 2`)
   5. Kwadratische vergelijkingen, oplossen door ontbinden (`x² - x - 6 = 0`)
2. **Parabolen (kwadratische functies)**
   1. De top van een parabool berekenen
   2. Nulpunten vinden door te ontbinden (met een gemeenschappelijke factor x)
   3. Functievoorschrift opstellen uit een gegeven punt
3. **Lineaire functies**
   1. Snijpunten met de assen en de oppervlakte van driehoek OPQ
   2. Een onbekende parameter berekenen uit een gegeven oppervlakte
   3. Hellingsgetal en functievoorschrift bepalen uit twee punten
4. **Exponentiële groei en afname**
   1. De waarde na n stappen berekenen
   2. De groeifactor berekenen
   3. Het aantal stappen tot een grenswaarde bepalen

Elk onderwerp heeft ook een "Gemengd"-niveau dat de eigen niveaus door elkaar
oefent.

Er zijn twee modi:

- **Oefenen** — onbeperkt opgaven met directe feedback.
- **Toets** — 10 opgaven achter elkaar, met een eindresultaat zoals bij een echte toets.

Na elk antwoord wordt altijd de volledige uitwerking getoond. Bij een fout
antwoord probeert de tool te herkennen welk denkpatroon waarschijnlijk fout
ging (bijv. een teken niet omgedraaid, een macht vergeten, de negatieve
oplossing niet verworpen) en legt dat concreet uit. In oefenmodus krijgt de
volgende opgave een korte herinnering als zo'n denkfout is herkend, en
herhaalde denkfouten worden zichtbaar op het startscherm.

Voortgang (score per niveau, beste toetsscore, veelgemaakte denkfouten) wordt
lokaal in de browser opgeslagen (`localStorage`), dus per apparaat/browser.
Op het startscherm staat een knop om alle voortgang te wissen en fris te
beginnen.

## Gebruiken

Dit is een statische site zonder build-stap. Open `index.html` via een lokale
webserver, bijvoorbeeld:

```bash
python3 -m http.server 8000
```

en ga naar `http://localhost:8000`.

## Uitbreiden

De opgave-generatoren staan los van de UI in `js/generators.js`, geordend per
onderwerp in `TOPICS`. Elk onderwerp heeft een lijst `levels`, en elk niveau
een `generate()`-functie die een opgave teruggeeft:

```js
{
  text,          // de opgavetekst
  kind,          // 'single' | 'unordered-set' | 'ordered-pair'
  answer,        // getal, of array van getallen (zie kind)
  answerText,    // kant-en-klare tekst met het juiste antwoord
  steps,         // array met uitwerkingsstappen
  mistakes,      // array met herkenbare denkfouten { id, title, explanation, value }
  inputLabel,    // label boven het invoerveld
  inputPlaceholder,
}
```

Nieuw onderwerp toevoegen: maak een `levels`-array met generate-functies en
voeg `{ id, title, levels }` toe aan `TOPICS`.
