import React, { useState } from 'react'
import { useApp, fmtEUR, fmtDate, formTotal, formDeclarations, approvalTasks, daysOpen, approvalAssist } from '../store.jsx'
import { Card, StatusBadge, RouteBadge, PageTitle, EmptyState } from '../ui.jsx'

export default function Inbox() {
  const { state, dispatch } = useApp()
  const persona = state.people.find((p) => p.id === state.personaId)
  const [filter, setFilter] = useState('alles')

  const lmTasks = approvalTasks(state, 'lijnmanager').map((f) => ({ form: f, as: 'lijnmanager' }))
  const spcTasks = approvalTasks(state, 'spc').map((f) => ({ form: f, as: 'spc' }))

  // Taken voor deze persona; de filter maakt het onderscheid zichtbaar
  const own = persona.role === 'lijnmanager' ? lmTasks : persona.role === 'spc' ? spcTasks : [...lmTasks, ...spcTasks]
  const tasks = own.filter((t) =>
    filter === 'alles' ? true : filter === 'lm' ? t.as === 'lijnmanager' : t.as === 'spc'
  )

  const owner = (f) => state.people.find((p) => p.id === f.ownerId)?.name

  return (
    <div className="fade-up max-w-4xl">
      <PageTitle
        title="Goedkeurings-inbox"
        subtitle={`Openstaande taken voor ${persona.name} (${persona.role === 'spc' ? 'SPC Declaraties' : 'lijnmanager'}).`}
      />

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {[['alles', 'Alles'], ['lm', 'Als lijnmanager'], ['spc', 'Als SPC']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition ${
              filter === key
                ? 'bg-hbr-800 text-white border-hbr-800'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <Card>
          <EmptyState icon="🎉" title="Geen openstaande taken" subtitle="Alles is afgehandeld." />
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map(({ form, as }) => {
            const days = daysOpen(form)
            const urgent = days > 7
            const assist = approvalAssist(state, form)
            const decls = formDeclarations(state, form)
            return (
              <Card
                key={form.id}
                className="p-5"
                onClick={() => dispatch({ type: 'NAVIGATE', page: 'approval-detail', params: { id: form.id, as } })}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-hbr-100 text-hbr-800 text-xs font-bold flex items-center justify-center shrink-0">
                    {owner(form)?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800">{form.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {owner(form)} · {decls.length} {decls.length === 1 ? 'regel' : 'regels'} · ingediend {fmtDate(form.submittedAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {urgent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 px-2.5 py-0.5 text-xs font-semibold">
                        ⏱ {days} dagen open
                      </span>
                    )}
                    <RouteBadge route={form.route} />
                    <span className="text-lg font-bold text-hbr-800">{fmtEUR(formTotal(state, form))}</span>
                  </div>
                </div>

                {/* AI-assist */}
                <div className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
                  assist.hasWarning
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                }`}>
                  <div className="font-bold mb-0.5">
                    {assist.hasWarning ? '⚠ Controleer' : '✓ Geen bijzonderheden'}
                    <span className="font-normal text-[10px] opacity-70 ml-2">AI-check (adviserend)</span>
                  </div>
                  {assist.findings.length > 0 && (
                    <ul className="space-y-0.5">
                      {assist.findings.map((f, i) => (
                        <li key={i}>{f.level === 'warn' ? '•' : '✓'} {f.text}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
