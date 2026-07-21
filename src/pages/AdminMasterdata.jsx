import React, { useState } from 'react'
import { useApp } from '../store.jsx'
import { Card, Button, Field, Input, Select, PageTitle, Modal, RouteBadge, Toggle } from '../ui.jsx'

const TABS = [
  { key: 'categories', label: 'Categorieën' },
  { key: 'paymentMethods', label: 'Betaalmethodes' },
  { key: 'tags', label: 'Tags' },
]

export default function AdminMasterdata() {
  const { state, dispatch, toast } = useApp()
  const [tab, setTab] = useState('categories')
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState({ name: '', route: 'HR' })

  const items = state[tab]
  const hasRoute = tab === 'categories'
  const hasActive = tab !== 'tags'

  function add() {
    if (!draft.name.trim()) return
    const item = { id: `${tab}-${Date.now() % 100000}`, name: draft.name.trim() }
    if (hasRoute) item.route = draft.route
    if (hasActive) item.active = true
    dispatch({ type: 'MASTER_ADD', collection: tab, item })
    setAddOpen(false)
    setDraft({ name: '', route: 'HR' })
    toast('Toegevoegd.')
  }

  function toggleActive(item) {
    dispatch({ type: 'MASTER_UPDATE', collection: tab, id: item.id, patch: { active: !item.active } })
  }

  function remove(item) {
    dispatch({ type: 'MASTER_DELETE', collection: tab, id: item.id })
    toast(`"${item.name}" verwijderd.`, 'info')
  }

  return (
    <div className="fade-up max-w-3xl">
      <PageTitle
        title="Masterdata-beheer"
        subtitle="Beheer categorieën, betaalmethodes en tags — zonder tussenkomst van een externe leverancier."
        actions={<Button onClick={() => setAddOpen(true)}>＋ Toevoegen</Button>}
      />

      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition ${
              tab === t.key ? 'bg-hbr-800 text-white border-hbr-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
              <th className="px-4 py-3 font-semibold">Naam</th>
              {hasRoute && <th className="px-4 py-3 font-semibold">Route</th>}
              {hasActive && <th className="px-4 py-3 font-semibold">Actief</th>}
              <th className="px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className={`px-4 py-3 font-medium ${hasActive && !item.active ? 'text-slate-300 line-through' : 'text-slate-800'}`}>
                  {item.name}
                </td>
                {hasRoute && <td className="px-4 py-3"><RouteBadge route={item.route} /></td>}
                {hasActive && (
                  <td className="px-4 py-3">
                    <Toggle checked={!!item.active} onChange={() => toggleActive(item)} />
                  </td>
                )}
                <td className="px-2 py-3 text-right">
                  <button onClick={() => remove(item)} className="text-slate-300 hover:text-red-500 px-2" title="Verwijderen">🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={`Toevoegen: ${TABS.find((t) => t.key === tab).label}`}>
        <div className="space-y-4">
          <Field label="Naam">
            <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          </Field>
          {hasRoute && (
            <Field label="Route" hint="Bepaalt of uitbetaling via HR/Payroll of via het SPC loopt.">
              <Select value={draft.route} onChange={(e) => setDraft((d) => ({ ...d, route: e.target.value }))}>
                <option value="HR">HR / Payroll</option>
                <option value="SPC">SPC</option>
              </Select>
            </Field>
          )}
          <div className="flex gap-2">
            <Button onClick={add}>Toevoegen</Button>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Annuleren</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
