import React, { useState } from 'react'
import { useApp, fmtDate } from '../store.jsx'
import { Card, Button, Field, Input, Select, PageTitle, Modal, EmptyState } from '../ui.jsx'

export default function Assistants() {
  const { state, dispatch, toast } = useApp()
  const me = state.personaId
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState({ personId: '', role: 'Declareren', from: '', until: '' })

  // Machtigingen die ík heb gekregen (ik mag namens anderen werken)
  const receivedGrants = state.assistants.filter((a) => a.granteeId === me && a.active)
  // Machtigingen die ík heb uitgedeeld (mijn assistenten)
  const myAssistants = state.assistants.filter((a) => a.grantorId === me)

  const person = (id) => state.people.find((p) => p.id === id)
  const colleagues = state.people.filter((p) => p.id !== me && p.role !== 'admin')

  function addAssistant() {
    if (!draft.personId || !draft.from || !draft.until) {
      toast('Kies een collega en vul beide datums in.', 'error')
      return
    }
    dispatch({
      type: 'ASSISTANT_ADD',
      assistant: {
        id: `a-${state.assistants.length + 1}-${draft.personId}`,
        grantorId: me, granteeId: draft.personId,
        role: draft.role, from: draft.from, until: draft.until, active: true,
      },
    })
    setAddOpen(false)
    setDraft({ personId: '', role: 'Declareren', from: '', until: '' })
    toast(`${person(draft.personId)?.name} is toegevoegd als assistent (${draft.role.toLowerCase()}).`)
  }

  return (
    <div className="fade-up max-w-3xl">
      <PageTitle
        title="Assistenten beheren"
        subtitle="Machtig een collega om namens jou te declareren of te accorderen — bijvoorbeeld voor een directielid of bij afwezigheid."
        actions={<Button onClick={() => setAddOpen(true)}>＋ Assistent toevoegen</Button>}
      />

      {/* Namens iemand anders werken */}
      <Card className="p-5 mb-4">
        <h2 className="font-bold text-hbr-800 mb-1">Werken namens een collega</h2>
        <p className="text-xs text-slate-500 mb-4">Collega's die jou hebben gemachtigd:</p>
        {receivedGrants.length === 0 ? (
          <EmptyState icon="🤝" title="Geen machtigingen ontvangen" />
        ) : (
          <div className="space-y-2">
            {receivedGrants.map((a) => {
              const grantor = person(a.grantorId)
              const activeNow = state.actingForId === a.grantorId
              return (
                <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <span className="w-9 h-9 rounded-full bg-hbr-100 text-hbr-800 text-xs font-bold flex items-center justify-center">
                    {grantor.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800">{grantor.name}</div>
                    <div className="text-xs text-slate-400">
                      Rol: {a.role} · geldig {fmtDate(a.from)} t/m {fmtDate(a.until)}
                    </div>
                  </div>
                  {activeNow ? (
                    <Button variant="secondary" onClick={() => { dispatch({ type: 'SET_ACTING_FOR', personId: null }); toast('Je werkt weer als jezelf.', 'info') }}>
                      Stop namens-modus
                    </Button>
                  ) : (
                    <Button variant="accent" onClick={() => {
                      dispatch({ type: 'SET_ACTING_FOR', personId: a.grantorId })
                      dispatch({ type: 'NAVIGATE', page: 'dashboard' })
                      toast(`Je declareert nu namens ${grantor.name}.`, 'info')
                    }}>
                      Declareer namens {grantor.name.split(' ')[0]}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Mijn assistenten */}
      <Card className="p-5">
        <h2 className="font-bold text-hbr-800 mb-1">Mijn assistenten</h2>
        <p className="text-xs text-slate-500 mb-4">Collega's die namens jou mogen werken:</p>
        {myAssistants.length === 0 ? (
          <EmptyState icon="👥" title="Nog geen assistenten" subtitle="Voeg een collega toe met de knop rechtsboven." />
        ) : (
          <div className="space-y-2">
            {myAssistants.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800">{person(a.granteeId)?.name}</div>
                  <div className="text-xs text-slate-400">
                    Rol: {a.role} · geldig {fmtDate(a.from)} t/m {fmtDate(a.until)}
                  </div>
                </div>
                <Button variant="danger" onClick={() => {
                  dispatch({ type: 'ASSISTANT_DELETE', id: a.id })
                  toast('Machtiging ingetrokken.', 'info')
                }}>
                  Intrekken
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Assistent toevoegen">
        <div className="space-y-4">
          <Field label="Collega">
            <Select value={draft.personId} onChange={(e) => setDraft((d) => ({ ...d, personId: e.target.value }))}>
              <option value="">— Kies collega —</option>
              {colleagues.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.functie})</option>)}
            </Select>
          </Field>
          <Field label="Rol">
            <Select value={draft.role} onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}>
              <option>Declareren</option>
              <option>Accorderen</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Actief vanaf">
              <Input type="date" value={draft.from} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} />
            </Field>
            <Field label="Vervalt op">
              <Input type="date" value={draft.until} onChange={(e) => setDraft((d) => ({ ...d, until: e.target.value }))} />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button onClick={addAssistant}>Toevoegen</Button>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Annuleren</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
