import React, { useState } from 'react'
import { Modal, RouteBadge, StatusBadge } from './ui.jsx'

function Section({ icon, title, children }) {
  return (
    <section className="mb-5">
      <h4 className="flex items-center gap-2 font-bold text-hbr-800 mb-2">
        <span className="w-7 h-7 rounded-lg bg-hbr-50 flex items-center justify-center text-sm shrink-0">{icon}</span>
        {title}
      </h4>
      <div className="text-sm text-slate-600 space-y-2 pl-9">{children}</div>
    </section>
  )
}

function Step({ n, children }) {
  return (
    <li className="flex gap-3">
      <span className="w-5 h-5 rounded-full bg-accent-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
      <span>{children}</span>
    </li>
  )
}

export default function HelpButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:border-accent-500/50 transition shadow-sm text-xs font-semibold text-slate-600"
        title="Uitleg over deze demo"
      >
        <span className="w-4 h-4 rounded-full bg-hbr-800 text-white text-[10px] font-bold flex items-center justify-center">?</span>
        <span className="hidden sm:inline">Uitleg</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Zo werkt deze demo" wide>
        <Section icon="🎯" title="Wat is dit?">
          <p>
            Een klikbare <b>proof-of-concept</b> van een zelfgebouwde, AI-ondersteunde declaratie-app voor
            Havenbedrijf Rotterdam — als conceptuele vervanger van SRXP. Alles wat je ziet werkt echt
            (indienen, goedkeuren, uitbetalen), maar er is bewust géén echte backend: de data staat als
            JSON-bestand in een GitHub-repository en de AI-features zijn gesimuleerd. Doel: laten zien
            wat er kan, niet hoe het uiteindelijk gebouwd wordt.
          </p>
        </Section>

        <Section icon="🎭" title="Persona's — de kern van de demo">
          <p>
            Rechtsboven zit een <b>persona-switcher</b> (klik op de naam). Daarmee wissel je tussen de
            rollen in het declaratieproces, zonder in of uit te loggen:
          </p>
          <ul className="space-y-1">
            <li><b>Ryan Douglas</b> — declarant: dient bonnen en kilometers in</li>
            <li><b>Chris van Dam</b> — lijnmanager: eerste goedkeurder</li>
            <li><b>Sandra Willems</b> — SPC Declaraties: tweede goedkeurder (alleen SPC-route)</li>
            <li><b>Beheerder</b> — masterdata en proces-overzicht</li>
          </ul>
          <p className="text-xs text-slate-400">
            In een echte app zou iedereen natuurlijk zijn eigen account hebben; de switcher is een demo-hulpmiddel.
          </p>
        </Section>

        <Section icon="🗺" title="Aanbevolen route door de demo (± 5 min)">
          <ol className="space-y-2">
            <Step n="1">
              Als <b>Ryan</b>: klik <b>📷 Bon scannen</b> en klik op het foto-vak — de AI "leest" de bon
              en vult leverancier, datum, bedrag en BTW automatisch in, met een categorievoorstel dat je
              kunt accepteren. Sla op als concept.
            </Step>
            <Step n="2">
              Klik <b>🚗 Kilometers declareren</b>: kies een vertrek- en aankomstadres (er verschijnen
              suggesties) — de afstand wordt berekend en de route verschijnt op het kaartje. Let op de
              retour-knop en "Kopieer naar andere datum" (handig voor terugkerende ritten).
            </Step>
            <Step n="3">
              Ga naar <b>📋 Formulieren</b> en klik <b>✨ Bundel automatisch</b>: losse declaraties worden
              per uitbetaalroute (HR/Payroll of SPC) in formulieren gegroepeerd. Open een formulier en
              klik <b>Indienen</b>.
            </Step>
            <Step n="4">
              Wissel naar <b>Chris van Dam</b>: in de goedkeurings-inbox staat per taak een <b>AI-check</b>{' '}
              (dubbele-bon-detectie, beleidsregels — puur adviserend). Open een taak en keur goed of wijs
              af (afwijzen vraagt om een toelichting die de declarant terugziet).
            </Step>
            <Step n="5">
              Wissel naar <b>Sandra Willems</b> voor de tweede goedkeurstap van SPC-formulieren — bekijk
              daar de ⚠-melding bij "Congres Smart Ports" (zelfde parkeerbetaling als vorige maand).
            </Step>
            <Step n="6">
              Wissel naar <b>Beheerder</b>: KPI's (doorlooptijd, open taken), audit-overzicht en de knop
              <b> 💶 Simuleer uitbetaling</b> die de laatste processtap afrondt. Onder Masterdata beheer je
              zelf categorieën, betaalmethodes en tags — zonder externe leverancier.
            </Step>
            <Step n="7">
              Maak je browservenster smal of open de link op je telefoon: <b>indienen én goedkeuren werken
              volledig mobiel</b> — in tegenstelling tot de huidige SRXP-oplossing.
            </Step>
          </ol>
        </Section>

        <Section icon="🔀" title="Routes en statussen">
          <p>
            Elke categorie bepaalt de uitbetaalroute: <RouteBadge route="HR" /> loopt via HR/Payroll
            (bijv. kilometers, OV, studiekosten), <RouteBadge route="SPC" /> via het Service Punt met een
            extra goedkeurstap (bijv. lunches, congressen, hotels). Een formulier doorloopt:
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status="concept" /> → <StatusBadge status="ingediend" /> →
            <StatusBadge status="goedgekeurd_lm" /> → <StatusBadge status="wacht_uitbetaling" /> →
            <StatusBadge status="uitbetaald" />
          </div>
          <p>
            Elke goedkeurstap kan ook naar <StatusBadge status="afgewezen" /> — de declarant kan dan
            corrigeren en opnieuw indienen.
          </p>
        </Section>

        <Section icon="🤖" title="De AI-features (gesimuleerd)">
          <ul className="space-y-1">
            <li><b>Bonherkenning</b> — foto uploaden vult de velden automatisch, met betrouwbaarheidsscore</li>
            <li><b>Routeberekening</b> — van/naar-adressen worden een afstand + kaartweergave</li>
            <li><b>Automatisch bundelen</b> — losse declaraties worden per route in formulieren gegroepeerd</li>
            <li><b>Goedkeurings-assist</b> — dubbele bonnen en beleidsafwijkingen worden gesignaleerd; de beslissing blijft altijd bij de goedkeurder</li>
          </ul>
          <p className="text-xs text-slate-400">
            In deze PoC met vaste vertraging en voorgeprogrammeerde uitkomst; in een echte versie zouden
            hier AI-diensten achter zitten.
          </p>
        </Section>

        <Section icon="🗄" title="Data: GitHub als database">
          <p>
            De demo-data staat als <code className="text-xs bg-slate-100 rounded px-1 py-0.5">db/db.json</code> in
            de GitHub-repository. Iedereen die de link opent, ziet automatisch de laatste stand (status
            "Meelezen" rechtsboven). Wijzigingen worden pas gedeeld opgeslagen als er via de statusindicator
            een GitHub-token is gekoppeld — anders blijven ze alleen in je eigen browsertabblad. Handig om te
            weten: <b>klik gerust overal op</b>, je kunt niets kapotmaken; met F5 sta je weer op de gedeelde stand.
          </p>
        </Section>

        <Section icon="🚧" title="Bewust buiten scope">
          <p>
            Echte authenticatie/SSO, echte AI- en kaart-API's, koppeling met Payroll/ECP en
            e-mailnotificaties. Dit is een demo van de gebruikerservaring en het proces — geen productiecode.
          </p>
        </Section>

        <div className="mt-2 pt-4 border-t border-slate-100 text-xs text-slate-400">
          Vragen of ideeën? Neem contact op met Ryan Douglas (Digitalisering).
        </div>
      </Modal>
    </>
  )
}
