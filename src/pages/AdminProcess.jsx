import React from 'react'
import { useApp, fmtEUR, fmtDate, formTotal, formDeclarations, todayISO } from '../store.jsx'
import { Card, Button, StatusBadge, RouteBadge, PageTitle } from '../ui.jsx'

export default function AdminProcess() {
  const { state, dispatch, toast } = useApp()

  // KPI's
  const paidForms = state.forms.filter((f) => f.status === 'uitbetaald' && f.submittedAt && f.paidAt)
  const avgDays = paidForms.length
    ? Math.round(paidForms.reduce((s, f) => s + (new Date(f.paidAt) - new Date(f.submittedAt)) / 86400000, 0) / paidForms.length)
    : 0
  const openTasks = state.forms.filter((f) => ['ingediend', 'goedgekeurd_lm'].includes(f.status)).length
  const month = todayISO().slice(0, 7)
  const monthTotal = state.declarations
    .filter((d) => d.status !== 'concept' && d.status !== 'afgewezen' && d.date.startsWith(month))
    .reduce((s, d) => s + d.amount, 0)
  const waiting = state.forms.filter((f) => f.status === 'wacht_uitbetaling')

  function payout(form) {
    dispatch({ type: 'FORM_SET_STATUS', id: form.id, status: 'uitbetaald', by: 'Payroll/SPC (simulatie)', patch: { paidAt: todayISO() } })
    toast(`"${form.title}" is uitbetaald (${fmtEUR(formTotal(state, form))}).`)
  }

  return (
    <div className="fade-up max-w-5xl">
      <PageTitle
        title="Proces-overzicht"
        subtitle="Live inzicht in het declaratieproces — van indienen tot uitbetaling."
      />

      {/* KPI-tegels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gem. doorlooptijd</div>
          <div className="text-3xl font-bold text-hbr-800 mt-1">{avgDays} <span className="text-base font-semibold text-slate-400">dagen</span></div>
          <div className="text-xs text-slate-400 mt-1">indienen → uitbetaald</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Open taken</div>
          <div className="text-3xl font-bold text-hbr-800 mt-1">{openTasks}</div>
          <div className="text-xs text-slate-400 mt-1">wachten op goedkeuring</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Deze maand</div>
          <div className="text-3xl font-bold text-accent-600 mt-1">{fmtEUR(monthTotal)}</div>
          <div className="text-xs text-slate-400 mt-1">totaal gedeclareerd</div>
        </Card>
      </div>

      {/* Wacht op uitbetaling */}
      {waiting.length > 0 && (
        <Card className="p-5 mb-5 border-emerald-200">
          <h2 className="font-bold text-hbr-800 mb-3">Klaar voor uitbetaling ({waiting.length})</h2>
          <div className="space-y-2">
            {waiting.map((f) => (
              <div key={f.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800">{f.title}</div>
                  <div className="text-xs text-slate-400">{state.people.find((p) => p.id === f.ownerId)?.name} · {fmtEUR(formTotal(state, f))}</div>
                </div>
                <RouteBadge route={f.route} />
                <Button variant="success" onClick={() => payout(f)}>💶 Simuleer uitbetaling</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Audit-view: alle formulieren */}
      <Card className="overflow-hidden">
        <div className="px-5 pt-4 pb-2 font-bold text-hbr-800">Alle formulieren (audit-view)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Titel</th>
                <th className="px-4 py-3 font-semibold">Declarant</th>
                <th className="px-4 py-3 font-semibold text-center">Regels</th>
                <th className="px-4 py-3 font-semibold text-right">Totaal</th>
                <th className="px-4 py-3 font-semibold">Route</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Uitbetaald</th>
              </tr>
            </thead>
            <tbody>
              {[...state.forms].reverse().map((f) => (
                <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{f.id.replace('f-', 'F-')}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{f.title}</td>
                  <td className="px-4 py-3 text-slate-500">{state.people.find((p) => p.id === f.ownerId)?.name}</td>
                  <td className="px-4 py-3 text-center">{formDeclarations(state, f).length}</td>
                  <td className="px-4 py-3 text-right font-semibold text-hbr-800">{fmtEUR(formTotal(state, f))}</td>
                  <td className="px-4 py-3"><RouteBadge route={f.route} /></td>
                  <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                  <td className="px-4 py-3 text-slate-500">{fmtDate(f.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
