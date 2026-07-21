import React, { useState } from 'react'
import { useApp, fmtEUR, fmtDate, formTotal, formDeclarations, approvalAssist } from '../store.jsx'
import { Card, Button, StatusBadge, RouteBadge, StatusTimeline, ReceiptThumb, Modal, Textarea, RouteMap } from '../ui.jsx'

export default function ApprovalDetail({ params }) {
  const { state, dispatch, toast } = useApp()
  const persona = state.people.find((p) => p.id === state.personaId)
  const form = state.forms.find((f) => f.id === params?.id)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [zoomReceipt, setZoomReceipt] = useState(null)

  if (!form) return <div className="text-slate-400">Taak niet gevonden.</div>

  const decls = formDeclarations(state, form)
  const assist = approvalAssist(state, form)
  const ownerName = state.people.find((p) => p.id === form.ownerId)?.name
  const catName = (id) => state.categories.find((c) => c.id === id)?.name || id
  const pmName = (id) => state.paymentMethods.find((m) => m.id === id)?.name || id
  const asSpc = persona.role === 'spc'
  const go = () => dispatch({ type: 'NAVIGATE', page: 'inbox' })

  function approve() {
    const next = asSpc ? 'wacht_uitbetaling' : form.route === 'HR' ? 'wacht_uitbetaling' : 'goedgekeurd_lm'
    dispatch({ type: 'FORM_SET_STATUS', id: form.id, status: next, by: persona.name })
    toast(
      next === 'goedgekeurd_lm'
        ? `Goedgekeurd — doorgestuurd naar SPC Declaraties (Sandra Willems).`
        : `Goedgekeurd — "${form.title}" wacht op uitbetaling.`
    )
    go()
  }

  function reject() {
    if (!comment.trim()) return
    dispatch({
      type: 'FORM_SET_STATUS', id: form.id, status: 'afgewezen', by: persona.name,
      comment, patch: { rejectComment: comment },
    })
    toast(`Formulier afgewezen — ${ownerName} ontvangt je toelichting.`, 'info')
    setRejectOpen(false)
    go()
  }

  return (
    <div className="fade-up max-w-4xl">
      <button onClick={go} className="text-sm text-accent-600 font-semibold hover:underline mb-3">
        ← Terug naar inbox
      </button>

      <Card className="p-5 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-hbr-800">{form.title}</h1>
            <div className="text-xs text-slate-400 mt-1">
              {form.id.replace('f-', 'F-')} · aangevraagd door <b className="text-slate-600">{ownerName}</b> · ingediend {fmtDate(form.submittedAt)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RouteBadge route={form.route} />
            <StatusBadge status={form.status} />
          </div>
        </div>
        <StatusTimeline form={form} />
      </Card>

      {/* AI-assist */}
      <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
        assist.hasWarning ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
      }`}>
        <div className="font-bold">
          {assist.hasWarning ? '⚠ AI-check: controleer deze punten' : '✓ AI-check: geen bijzonderheden'}
          <span className="font-normal text-xs opacity-70 ml-2">adviserend — de beslissing blijft bij jou</span>
        </div>
        {assist.findings.length > 0 && (
          <ul className="mt-1 space-y-0.5 text-xs">
            {assist.findings.map((f, i) => <li key={i}>{f.level === 'warn' ? '•' : '✓'} {f.text}</li>)}
          </ul>
        )}
      </div>

      {/* Regels */}
      <Card className="p-5 mb-4">
        <h2 className="font-bold text-hbr-800 mb-3">Declaratieregels ({decls.length})</h2>
        <div className="divide-y divide-slate-100">
          {decls.map((d) => (
            <div key={d.id} className="py-4">
              <div className="flex items-start gap-4">
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
                  <div className="text-xs text-slate-400 mt-0.5">{fmtDate(d.date)} · {catName(d.categoryId)}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{pmName(d.paymentMethodId)}</div>
                  {d.currency !== 'EUR' && (
                    <div className="text-xs text-accent-600 mt-0.5">
                      {d.currency} {d.amountForeign?.toFixed(2)} → omgerekend {fmtEUR(d.amount)}
                    </div>
                  )}
                  {d.type === 'km' && (
                    <div className="mt-2 max-w-sm">
                      <RouteMap from={d.from} to={d.to} hasRoute retour={d.retour} />
                      <div className="text-xs text-slate-500 mt-1">{d.km} km × € 0,36</div>
                    </div>
                  )}
                </div>
                <div className="text-sm font-bold text-hbr-800 shrink-0">{fmtEUR(d.amount)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 mt-2 pt-3 flex justify-between text-sm">
          <span className="font-semibold text-slate-500">Totaal</span>
          <span className="font-bold text-hbr-800 text-lg">{fmtEUR(formTotal(state, form))}</span>
        </div>
      </Card>

      {/* Acties */}
      <div className="flex gap-2 sticky bottom-20 md:bottom-4">
        <Button variant="success" className="flex-1 sm:flex-none sm:px-8 py-3" onClick={approve}>
          ✓ Goedkeuren
        </Button>
        <Button variant="danger" className="flex-1 sm:flex-none sm:px-8 py-3 !bg-white" onClick={() => setRejectOpen(true)}>
          ✕ Afwijzen
        </Button>
      </div>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Formulier afwijzen">
        <p className="text-sm text-slate-500 mb-3">
          Een toelichting is verplicht — de declarant ziet dit commentaar en kan daarna corrigeren en opnieuw indienen.
        </p>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Bijv. Bon ontbreekt…" />
        <div className="mt-4 flex gap-2">
          <Button variant="danger" onClick={reject} disabled={!comment.trim()}>Afwijzen</Button>
          <Button variant="secondary" onClick={() => setRejectOpen(false)}>Annuleren</Button>
        </div>
      </Modal>

      <Modal open={!!zoomReceipt} onClose={() => setZoomReceipt(null)} title={zoomReceipt?.supplier}>
        <div className="flex justify-center">
          {zoomReceipt && <ReceiptThumb supplier={zoomReceipt.supplier} amount={zoomReceipt.amount} size="lg" />}
        </div>
        <p className="text-center text-xs text-slate-400 mt-3">Gesimuleerde bon-afbeelding (demo)</p>
      </Modal>
    </div>
  )
}
