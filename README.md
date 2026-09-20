# ai-claude-elisa

Oefentool voor het voorbereiden op wiskundetoetsen in 3 vwo.

Het eerste onderwerp is **vergelijkingen oplossen**, met vijf oplopende niveaus:

1. Eenvoudige vergelijkingen (`3x + 5 = 20`)
2. De onbekende aan beide kanten (`5x - 3 = 2x + 9`)
3. Vergelijkingen met haakjes (`4(x - 2) = 16`)
4. Vergelijkingen met breuken (`(x + 3) / 4 = 2`)
5. Kwadratische vergelijkingen, oplossen door ontbinden (`x² - x - 6 = 0`)

Er zijn twee modi:

- **Oefenen** — onbeperkt opgaven met directe feedback en een uitwerking op aanvraag.
- **Toets** — 10 opgaven achter elkaar, met een eindresultaat zoals bij een echte toets.

Voortgang (score per niveau, beste toetsscore) wordt lokaal in de browser
opgeslagen (`localStorage`), dus per apparaat/browser.

## Gebruiken

Dit is een statische site zonder build-stap. Open `index.html` via een lokale
webserver, bijvoorbeeld:

```bash
python3 -m http.server 8000
```

en ga naar `http://localhost:8000`.

## Uitbreiden

De opgave-generatoren staan los van de UI in `js/generators.js`, zodat er
later makkelijk nieuwe onderwerpen (bijv. Pythagoras, procenten, functies)
bij te zetten zijn: voeg een item toe aan `LEVELS` en een bijbehorende
`genLevelX()`-functie die `{ text, level, isSingle, answer, steps }`
teruggeeft.
