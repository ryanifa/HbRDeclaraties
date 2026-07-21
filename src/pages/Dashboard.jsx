import React from 'react'
import { useApp, usePersona, fmtEUR, fmtDate } from '../store.jsx'
import { Card, StatusBadge, Button } from '../ui.jsx'

const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

export default function Dashboard() {
  const { state, dispatch } = useApp()
  const { actingFor, effectiveId } = usePersona()
  const me = state.people.find((p) => p.id === effectiveId)
  const go = (page, params) => dispatch({ type: 'NAVIGATE', page, params })

  const mine = state.declarations.filter((d) => d.ownerId === effectiveId)
  const pending = mine.filter(
    (d) => ['ingediend', 'goedgekeurd_lm', 'wacht_uitbetaling'].includes(d.status) && d.paymentMethodId !== 'pm-simpled'
  )
  const pendingAmount = pending.reduce((s, d) => s + d.amount, 0)
  const conceptCount = mine.filter((d) => d.status === 'concept').length
  const inProgress = state.forms.filter(
    (f) => f.ownerId === effectiveId && ['ingediend', 'goedgekeurd_lm'].includes(f.status)
  ).length

  const recent = [...mine].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  // Jaaroverzicht: gedeclareerd bedrag per maand (excl. concepten)
  const perMonth = Array(12).fill(0)
  let yearTotal = 0
  for (const d of mine) {
    if (d.status === 'concept' || !d.date.startsWith('2026')) continue
    const m = parseInt(d.date.slice(5, 7), 10) - 1
    perMonth[m] += d.amount
    yearTotal += d.amount
  }
  const maxMonth = Math.max(...perMonth, 1)

  const catName = (id) => state.categories.find((c) => c.id === id)?.name || id

  return (
    <div className="fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-hbr-800">
          Goedemiddag, {me.name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {actingFor
            ? `Je bekijkt en declareert namens ${actingFor.name}.`
            : 'Hier is de stand van je declaraties.'}
        </p>
      </div>

      {/* Samenvatting */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Te ontvangen</div>
          <div className="text-2xl font-bold text-hbr-800 mt-1">{fmtEUR(pendingAmount)}</div>
          <div className="text-xs text-slate-400 mt-1">openstaand, wacht op goedkeuring of uitbetaling</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Concepten</div>
          <div className="text-2xl font-bold text-hbr-800 mt-1">{conceptCount}</div>
          <div className="text-xs text-slate-400 mt-1">nog niet ingediend</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">In behandeling</div>
          <div className="text-2xl font-bold text-hbr-800 mt-1">{inProgress}</div>
          <div className="text-xs text-slate-400 mt-1">formulieren bij goedkeurder</div>
        </Card>
      </div>

      {/* Snelacties */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button variant="accent" className="text-base px-5 py-3" onClick={() => go('bon-new')}>
          📷 Bon scannen
        </Button>
        <Button variant="primary" onClick={() => go('km-new')}>🚗 Kilometers declareren</Button>
        <Button variant="secondary" onClick={() => go('forms', { openNew: true })}>＋ Nieuw formulier</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recente declaraties */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-hbr-800">Recente declaraties</h2>
            <button onClick={() => go('forms')} className="text-xs font-semibold text-accent-600 hover:underline">
              Alle formulieren →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recent.map((d) => (
              <div
                key={d.id}
                className="py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg transition"
                onClick={() => d.formId ? go('form-detail', { id: d.formId }) : go(d.type === 'km' ? 'km-new' : 'bon-new', { editId: d.id })}
              >
                <span className="w-9 h-9 rounded-xl bg-hbr-50 flex items-center justify-center text-base shrink-0">
                  {d.type === 'km' ? '🚗' : '🧾'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-800 truncate">{d.description}</div>
                  <div className="text-xs text-slate-400 truncate">{fmtDate(d.date)} · {catName(d.categoryId)}</div>
                </div>
                <div className="text-sm font-bold text-hbr-800 shrink-0">{fmtEUR(d.amount)}</div>
                <StatusBadge status={d.status} className="hidden sm:inline-flex" />
              </div>
            ))}
          </div>
        </Card>

        {/* Jaar-widget */}
        <Card className="p-5">
          <h2 className="font-bold text-hbr-800 mb-1">Dit jaar gedeclareerd</h2>
          <div className="text-2xl font-bold text-accent-600 mb-4">{fmtEUR(yearTotal)}</div>
          <div className="flex items-end gap-1.5 h-28">
            {perMonth.map((v, i) => (
              <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1 min-w-0" title={`${MONTHS[i]}: ${fmtEUR(v)}`}>
                <div
                  className={`w-full rounded-t-md ${v > 0 ? 'bg-accent-500' : 'bg-slate-100'}`}
                  style={{ height: `${Math.max((v / maxMonth) * 100, 3)}%` }}
                />
                <span className="text-[8px] text-slate-400">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
