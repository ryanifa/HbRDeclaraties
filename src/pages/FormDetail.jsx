import React, { useState } from 'react'
import { useApp, fmtEUR, fmtDate, formTotal, formDeclarations, STATUS_LABELS } from '../store.jsx'
import { Card, Button, StatusBadge, RouteBadge, StatusTimeline, ReceiptThumb, PageTitle, Modal, Input } from '../ui.jsx'

export default function FormDetail({ params }) {
  const { state, dispatch, toast } = useApp()
  const form = state.forms.find((f) => f.id === params?.id)
  const [editTitle, setEditTitle] = useState(false)
  const [title, setTitle] = useState(form?.title || '')
  const [zoomReceipt, setZoomReceipt] = useState(null)

  if (!form) {
    return <div className="text-slate-400">Formulier niet gevonden.</div>
  }

  const decls = formDeclarations(state, form)
  const total = formTotal(state, form)
  const catName = (id) => state.categories.find((c) => c.id === id)?.name || id
  const pmName = (id) => state.paymentMethods.find((m) => m.id === id)?.name || id
  const go = (page, p) => dispatch({ type: 'NAVIGATE', page, params: p })

  function submit() {
    if (decls.length === 0) {
      toast('Dit formulier bevat nog geen declaraties.', 'error')
      return
    }
    dispatch({
      type: 'FORM_SET_STATUS', id: form.id, status: 'ingediend',
      by: state.people.find((p) => p.id === form.ownerId)?.name,
      patch: { submittedAt: new Date().toISOString().slice(0, 10) },
    })
    toast('Formulier ingediend — Chris van Dam (lijnmanager) heeft een goedkeuringstaak ontvangen.')
    go('forms')
  }

  function reopen() {
    dispatch({
      type: 'FORM_SET_STATUS', id: form.id, status: 'concept',
      by: state.people.find((p) => p.id === form.ownerId)?.name,
    })
    toast('Formulier teruggezet naar concept — corrigeer en dien opnieuw in.', 'info')
  }

  function saveTitle() {
    dispatch({ type: 'FORM_UPDATE', id: form.id, patch: { title } })
    setEditTitle(false)
  }

  return (
    <div className="fade-up max-w-4xl">
      <button onClick={() => go('forms')} className="text-sm text-accent-600 font-semibold hover:underline mb-3">
        ← Terug naar formulieren
      </button>

      <Card className="p-5 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            {editTitle ? (
              <div className="flex gap-2">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="!w-72" />
                <Button onClick={saveTitle}>Opslaan</Button>
              </div>
            ) : (
              <h1 className="text-xl font-bold text-hbr-800 flex items-center gap-2">
                {form.title}
                {form.status === 'concept' && (
                  <button onClick={() => setEditTitle(true)} className="text-slate-300 hover:text-accent-600 text-sm" title="Titel bewerken">✏️</button>
                )}
              </h1>
            )}
            <div className="text-xs text-slate-400 mt-1 font-mono">{form.id.replace('f-', 'F-')}</div>
          </div>
          <div className="flex items-center gap-2">
            <RouteBadge route={form.route} />
            <StatusBadge status={form.status} />
          </div>
        </div>

        <StatusTimeline form={form} />

        {/* Accordeurs */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1">
            1e goedkeurder: <b className="text-slate-700">Chris van Dam</b> (lijnmanager)
          </span>
          {form.route === 'SPC' && (
            <span className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1">
              2e goedkeurder: <b className="text-slate-700">Sandra Willems</b> (SPC Declaraties)
            </span>
          )}
        </div>

        {form.status === 'afgewezen' && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <b>Afgewezen:</b> {form.rejectComment || 'Zie opmerking goedkeurder.'}
          </div>
        )}
      </Card>

      {/* Declaratieregels */}
      <Card className="p-5 mb-4">
        <h2 className="font-bold text-hbr-800 mb-3">Declaratieregels ({decls.length})</h2>
        <div className="divide-y divide-slate-100">
          {decls.map((d) => (
            <div key={d.id} className="py-3 flex items-center gap-4">
              {d.type === 'bon' ? (
                d.receipt ? (
                  <ReceiptThumb supplier={d.supplier} amount={d.amount} onClick={() => setZoomReceipt(d)} />
                ) : (
                  <div className="w-14 h-[4.5rem] rounded-md border-2 border-dashed border-red-200 bg-red-50/50 flex items-center justify-center text-[9px] text-red-400 text-center leading-tight shrink-0">
                    bon<br />ontbreekt
                  </div>
                )
              ) : (
                <div className="w-14 h-[4.5rem] rounded-md bg-hbr-50 border border-hbr-100 flex items-center justify-center text-xl shrink-0">🚗</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-800">{d.description}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {fmtDate(d.date)} · {catName(d.categoryId)}
                </div>
                {d.type === 'km' && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {d.from?.split(',')[0]} → {d.to?.split(',')[0]}{d.retour ? ' (retour)' : ''} · {d.km} km
                  </div>
                )}
                {d.currency !== 'EUR' && (
                  <div className="text-xs text-accent-600 mt-0.5">
                    {d.currency} {d.amountForeign?.toFixed(2)} → omgerekend {fmtEUR(d.amount)}
                  </div>
                )}
                <div className="text-xs text-slate-400 mt-0.5">{pmName(d.paymentMethodId)}</div>
              </div>
              <div className="text-sm font-bold text-hbr-800 shrink-0">{fmtEUR(d.amount)}</div>
              {form.status === 'concept' && (
                <button
                  onClick={() => go(d.type === 'km' ? 'km-new' : 'bon-new', { editId: d.id })}
                  className="text-slate-300 hover:text-accent-600" title="Bewerken"
                >✏️</button>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 mt-2 pt-3 flex justify-between text-sm">
          <span className="font-semibold text-slate-500">Totaal</span>
          <span className="font-bold text-hbr-800 text-lg">{fmtEUR(total)}</span>
        </div>
      </Card>

      {/* Acties */}
      <div className="flex gap-2 mb-6">
        {form.status === 'concept' && (
          <Button variant="accent" onClick={submit}>📤 Indienen</Button>
        )}
        {form.status === 'afgewezen' && (
          <Button onClick={reopen}>↩ Corrigeren en opnieuw indienen</Button>
        )}
      </div>

      {/* Historie */}
      <Card className="p-5">
        <h2 className="font-bold text-hbr-800 mb-3">Historie</h2>
        <div className="space-y-2">
          {[...form.history].reverse().map((h, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-xs text-slate-400 w-20 shrink-0">{fmtDate(h.date)}</span>
              <StatusBadge status={h.status} />
              <span className="text-slate-500 text-xs truncate">door {h.by}{h.comment ? ` — "${h.comment}"` : ''}</span>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={!!zoomReceipt} onClose={() => setZoomReceipt(null)} title={zoomReceipt?.supplier}>
        <div className="flex justify-center">
          {zoomReceipt && <ReceiptThumb supplier={zoomReceipt.supplier} amount={zoomReceipt.amount} size="lg" />}
        </div>
        <p className="text-center text-xs text-slate-400 mt-3">Gesimuleerde bon-afbeelding (demo)</p>
      </Modal>
    </div>
  )
}
