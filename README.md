# HbR Declaraties — PoC / demo-mockup

Klikbare frontend-mockup van een moderne, AI-ondersteunde declaratie-app voor
Havenbedrijf Rotterdam. Conceptuele vervanger van SRXP — bedoeld als demo voor
collega's en management. **Geen productiecode**: alle data is in-memory
seed-data, er is geen backend en de AI-features zijn gesimuleerd.

## Starten

```bash
npm install
npm run dev        # ontwikkelserver
npm run build      # productie-build in dist/
```

## Demo-flow (suggestie)

1. **Declarant (Ryan Douglas)** — dashboard → *📷 Bon scannen* (AI leest de bon
   en vult de velden) → *🚗 Kilometers declareren* (route wordt berekend, kaartje
   rechts) → *Formulieren* → *✨ Bundel automatisch* → formulier openen → *Indienen*.
2. **Persona-switcher rechtsboven** → **Chris van Dam (lijnmanager)** —
   goedkeurings-inbox met AI-check per taak → goedkeuren of afwijzen.
3. **Sandra Willems (SPC)** — tweede goedkeurstap voor SPC-route-formulieren
   (let op de ⚠-melding dubbele bon bij "Congres Smart Ports").
4. **Beheerder** — proces-KPI's, audit-view, *💶 Simuleer uitbetaling* en
   masterdata-beheer (categorieën / betaalmethodes / tags).
5. Maak het browservenster smal (of open op een telefoon): indienen én
   goedkeuren werken volledig mobiel — in tegenstelling tot SRXP.

Extra: via *Assistenten* kan Ryan namens **Jan de Vries** declareren
(namens-modus met gele indicatiebalk).

## Techniek

- React 18 + Vite + Tailwind CSS 4, single-page app zonder router-dependency
- Volledig in-memory state (React context/reducer), seed-data in `src/seed.js`
- Gesimuleerde AI: bonherkenning, routeberekening, automatisch bundelen en
  goedkeurings-assist (dubbele-bon-detectie + beleidscheck) — met realistische
  vertragingen, zonder echte API-calls
- Statussen: Concept → Ingediend → Goedgekeurd lijnmanager → (SPC-route:
  Goedgekeurd SPC) → Wacht op uitbetaling → Uitbetaald, met zijpad Afgewezen

Buiten scope (bewust): echte authenticatie/SSO, echte AI- en maps-API's,
persistentie, Payroll/ECP-koppeling, e-mailnotificaties.
