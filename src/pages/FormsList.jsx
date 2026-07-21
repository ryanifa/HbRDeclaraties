import React, { useState } from 'react'
import { useApp, usePersona, fmtEUR, fmtDate, formTotal, formDeclarations, looseConceptDeclarations, todayISO } from '../store.jsx'
import { Card, Button, StatusBadge, RouteBadge, PageTitle, Modal, Field, Input, Spinner, EmptyState } from '../ui.jsx'

const MONTH_NAMES = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']

export default function FormsList({ params }) {
  const { state, dispatch, toast } = useApp()
  const { effectiveId } = usePersona()
  const [newOpen, setNewOpen] = useState(!!params?.openNew)
  const [newTitle, setNewTitle] = useState('')
  const [selected, setSelected] = useState([])
  const [bundling, setBundling] = useState(false)

  const go = (page, p) => dispatch({ type: 'NAVIGATE', page, params: p })
  const myForms = state.forms.filter((f) => f.ownerId === effectiveId)
  const loose = looseConceptDeclarations(state, effectiveId)
  const catRoute = (id) => state.categories.find((c) => c.id === id)?.route || 'SPC'
  const catName = (id) => state.categories.find((c) => c.id === id)?.name || id

  function autoBundle() {
    if (loose.length === 0) return
    setBundling(true)
    setTimeout(() => {
      const today = todayISO()
      const monthLabel = `${MONTH_NAMES[parseInt(today.slice(5, 7), 10) - 1]} ${today.slice(0, 4)}`
      const groups = { HR: [], SPC: [] }
      for (const d of loose) groups[catRoute(d.categoryId)].push(d)

      const newForms = []
      const assignments = {}
      let counter = state.formCounter
      for (const route of ['HR', 'SPC']) {
        if (groups[route].length === 0) continue
        const id = `f-${counter++}`
        newForms.push({
          id, ownerId: effectiveId, route, status: 'concept',
          title: `Declaraties ${monthLabel} — ${route}`,
          submittedAt: null,
          history: [{ status: 'concept', date: today, by: 'AI-assistent (automatisch gebundeld)' }],
        })
        for (const d of groups[route]) assignments[d.id] = id
      }
      dispatch({ type: 'BUNDLE', newForms, assignments })
      setBundling(false)
      toast(`${newForms.length} ${newForms.length === 1 ? 'formulier' : 'formulieren'} aangemaakt op basis van categorie-routes.`)
    }, 1400)
  }

  function createForm() {
    if (!newTitle || selected.length === 0) {
      toast('Geef een titel op en selecteer minimaal één declaratie.', 'error')
      return
    }
    const routes = [...new Set(selected.map((id) => catRoute(loose.find((d) => d.id === id).categoryId)))]
    if (routes.length > 1) {
      toast('Declaraties met verschillende routes (HR én SPC) kunnen niet in één formulier. Tip: gebruik "Bundel automatisch".', 'error')
      return
    }
    const id = `f-${state.formCounter}`
    dispatch({
      type: 'BUNDLE',
      newForms: [{
        id, ownerId: effectiveId, route: routes[0], status: 'concept',
        title: newTitle, submittedAt: null,
        history: [{ status: 'concept', date: todayISO(), by: state.people.find((p) => p.id === effectiveId)?.name }],
      }],
      assignments: Object.fromEntries(selected.map((d) => [d, id])),
    })
    setNewOpen(false); setNewTitle(''); setSelected([])
    toast('Formulier aangemaakt.')
    go('form-detail', { id })
  }

  function deleteForm(e, form) {
    e.stopPropagation()
    dispatch({ type: 'FORM_DELETE', id: form.id })
    toast(`Formulier "${form.title}" verwijderd — declaraties staan weer los.`, 'info')
  }

  return (
    <div className="fade-up">
      <PageTitle
        title="Formulieren"
        subtitle="Bundel declaraties in een formulier en dien ze in één keer in."
        actions={
          <>
            <Button variant="accent" onClick={autoBundle} disabled={loose.length === 0 || bundling}>
              {bundling ? <><Spinner className="w-4 h-4 text-white" /> Bundelen…</> : <>✨ Bundel automatisch</>}
            </Button>
            <Button variant="secondary" onClick={() => setNewOpen(true)}>＋ Nieuw formulier</Button>
          </>
        }
      />

      {/* Losse declaraties */}
      {loose.length > 0 && (
        <Card className="p-5 mb-5 border-accent-500/30">
          <h2 className="font-bold text-hbr-800 mb-1">Losse declaraties ({loose.length})</h2>
          <p className="text-xs text-slate-500 mb-3">
            Nog niet gebundeld. Gebruik <b>✨ Bundel automatisch</b> om ze per route (HR / SPC) in formulieren te plaatsen.
          </p>
          <div className="divide-y divide-slate-100">
            {loose.map((d) => (
              <div
                key={d.id}
                className="py-2.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg"
                onClick={() => go(d.type === 'km' ? 'km-new' : 'bon-new', { editId: d.id })}
              >
                <span>{d.type === 'km' ? '🚗' : '🧾'}</span>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-slate-800 block truncate">{d.description}</span>
                  <span className="text-xs text-slate-400">{fmtDate(d.date)} · {catName(d.categoryId)}</span>
                </div>
                <RouteBadge route={catRoute(d.categoryId)} />
                <span className="text-sm font-bold text-hbr-800">{fmtEUR(d.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Formulieren-tabel */}
      <Card className="overflow-hidden">
        {myForms.length === 0 ? (
          <EmptyState title="Nog geen formulieren" subtitle="Maak een formulier aan of bundel automatisch." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Titel</th>
                  <th className="px-4 py-3 font-semibold text-center">Regels</th>
                  <th className="px-4 py-3 font-semibold text-right">Totaal</th>
                  <th className="px-4 py-3 font-semibold">Route</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Ingediend</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {[...myForms].reverse().map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-slate-50 hover:bg-hbr-50/50 cursor-pointer transition"
                    onClick={() => go('form-detail', { id: f.id })}
                  >
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{f.id.replace('f-', 'F-')}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{f.title}</td>
                    <td className="px-4 py-3 text-center">{formDeclarations(state, f).length}</td>
                    <td className="px-4 py-3 text-right font-bold text-hbr-800">{fmtEUR(formTotal(state, f))}</td>
                    <td className="px-4 py-3"><RouteBadge route={f.route} /></td>
                    <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(f.submittedAt)}</td>
                    <td className="px-2 py-3 text-right">
                      {f.status === 'concept' && (
                        <button
                          onClick={(e) => deleteForm(e, f)}
                          className="text-slate-300 hover:text-red-500 px-2"
                          title="Formulier verwijderen (alleen concept)"
                        >
                          🗑
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Nieuw-formulier-modal */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Nieuw formulier">
        <Field label="Titel" className="mb-4">
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Bijv. Dienstreizen augustus" />
        </Field>
        <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Declaraties toevoegen
        </span>
        {loose.length === 0 ? (
          <p className="text-sm text-slate-400 mb-2">Geen losse declaraties beschikbaar. Maak eerst een bon- of kilometerdeclaratie aan.</p>
        ) : (
          <div className="space-y-1 mb-2">
            {loose.map((d) => (
              <label key={d.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 cursor-pointer hover:border-accent-500/50">
                <input
                  type="checkbox"
                  checked={selected.includes(d.id)}
                  onChange={(e) => setSelected((s) => e.target.checked ? [...s, d.id] : s.filter((x) => x !== d.id))}
                  className="accent-[#009FE3]"
                />
                <span className="text-sm flex-1 min-w-0 truncate">{d.description}</span>
                <RouteBadge route={catRoute(d.categoryId)} />
                <span className="text-sm font-semibold">{fmtEUR(d.amount)}</span>
              </label>
            ))}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <Button onClick={createForm} disabled={loose.length === 0}>Aanmaken</Button>
          <Button variant="secondary" onClick={() => setNewOpen(false)}>Annuleren</Button>
        </div>
      </Modal>
    </div>
  )
}
