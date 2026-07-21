import React, { useEffect, useRef, useState } from 'react'
import { useApp, usePersona, fmtEUR } from '../store.jsx'
import { ADDRESSES, DISTANCES, KM_RATE } from '../seed.js'
import { Card, Button, Field, Input, Select, Textarea, TagChip, Toggle, RouteMap, PageTitle, Modal } from '../ui.jsx'

function lookupDistance(from, to) {
  if (!from || !to) return null
  const d = DISTANCES[`${from}|${to}`] ?? DISTANCES[`${to}|${from}`]
  if (d) return d
  // Deterministische fallback voor vrije invoer
  const hash = [...(from + to)].reduce((a, c) => a + c.charCodeAt(0), 0)
  return Math.round((15 + (hash % 45)) * 10) / 10
}

export default function KmForm({ params }) {
  const { state, dispatch, toast } = useApp()
  const { effectiveId } = usePersona()
  const editing = params?.editId ? state.declarations.find((d) => d.id === params.editId) : null

  const [form, setForm] = useState(() => editing ? {
    date: editing.date, from: editing.from, to: editing.to, via: editing.via || [],
    retour: editing.retour, km: String(editing.km), categoryId: editing.categoryId,
    supplier: editing.supplier === '—' ? '' : editing.supplier, description: editing.description,
    tagIds: editing.tagIds || [],
  } : {
    date: '', from: '', to: '', via: [], retour: false, km: '',
    categoryId: 'c-km', supplier: '', description: '', tagIds: [],
  })
  const [calculating, setCalculating] = useState(false)
  const [hasRoute, setHasRoute] = useState(!!editing)
  const [copyOpen, setCopyOpen] = useState(false)
  const [copyDate, setCopyDate] = useState('')
  const timer = useRef(null)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // "Route berekenen" zodra van + naar bekend zijn
  useEffect(() => {
    if (!form.from || !form.to) { setHasRoute(false); return }
    if (editing && form.from === editing.from && form.to === editing.to
      && form.retour === editing.retour && form.via.length === (editing.via || []).length) return
    clearTimeout(timer.current)
    setCalculating(true)
    timer.current = setTimeout(() => {
      const base = lookupDistance(form.from, form.to) + form.via.length * 8.5
      const total = Math.round(base * (form.retour ? 2 : 1) * 10) / 10
      setForm((f) => ({ ...f, km: String(total) }))
      setCalculating(false)
      setHasRoute(true)
    }, 1100)
    return () => clearTimeout(timer.current)
  }, [form.from, form.to, form.retour, form.via.length])

  const km = parseFloat(form.km) || 0
  const amount = Math.round(km * KM_RATE * 100) / 100
  const category = state.categories.find((c) => c.id === form.categoryId)

  function toggleTag(id) {
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(id) ? f.tagIds.filter((t) => t !== id) : [...f.tagIds, id],
    }))
  }

  function buildPayload(date) {
    return {
      date, categoryId: form.categoryId, paymentMethodId: 'pm-eigen',
      from: form.from, to: form.to, via: form.via.filter(Boolean), retour: form.retour,
      km, amount, currency: 'EUR',
      supplier: form.supplier || '—', description: form.description,
      tagIds: form.tagIds, receipt: false,
    }
  }

  function save() {
    if (!form.date || !form.from || !form.to || !form.description) {
      toast('Vul minimaal datum, route en omschrijving in.', 'error')
      return
    }
    if (editing) {
      dispatch({ type: 'DECL_UPDATE', id: editing.id, patch: buildPayload(form.date) })
      toast('Kilometerdeclaratie bijgewerkt.')
    } else {
      dispatch({
        type: 'DECL_ADD',
        declaration: {
          id: `d-${state.declCounter}`, ownerId: effectiveId, type: 'km',
          status: 'concept', formId: null, ...buildPayload(form.date),
        },
      })
      toast('Kilometerdeclaratie opgeslagen als concept.')
    }
    dispatch({ type: 'NAVIGATE', page: 'forms' })
  }

  function copyToDate() {
    if (!copyDate) return
    dispatch({
      type: 'DECL_ADD',
      declaration: {
        id: `d-${state.declCounter}`, ownerId: effectiveId, type: 'km',
        status: 'concept', formId: null, ...buildPayload(copyDate),
      },
    })
    setCopyOpen(false)
    setCopyDate('')
    toast(`Declaratie gekopieerd naar ${copyDate.split('-').reverse().join('-')} (concept).`)
  }

  return (
    <div className="fade-up max-w-5xl">
      <PageTitle
        title={editing ? 'Kilometerdeclaratie bewerken' : 'Nieuwe kilometerdeclaratie'}
        subtitle={`Tarief ${fmtEUR(KM_RATE)} per kilometer — afstand wordt automatisch berekend.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        <Card className="p-5 lg:col-span-3">
          <datalist id="addr-list">
            {ADDRESSES.map((a) => <option key={a} value={a} />)}
          </datalist>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Datum" className="col-span-2 sm:col-span-1">
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </Field>
            <div className="hidden sm:block" />
            <Field label="Van" className="col-span-2">
              <Input list="addr-list" value={form.from} onChange={(e) => set('from', e.target.value)} placeholder="Vertrekadres" />
            </Field>
            {form.via.map((v, i) => (
              <Field label={`Via ${form.via.length > 1 ? i + 1 : ''}`} key={i} className="col-span-2">
                <div className="flex gap-2">
                  <Input
                    list="addr-list" value={v}
                    onChange={(e) => set('via', form.via.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder="Tussenstop"
                  />
                  <Button variant="ghost" onClick={() => set('via', form.via.filter((_, j) => j !== i))}>×</Button>
                </div>
              </Field>
            ))}
            <Field label="Naar" className="col-span-2">
              <Input list="addr-list" value={form.to} onChange={(e) => set('to', e.target.value)} placeholder="Aankomstadres" />
            </Field>
            <div className="col-span-2 flex flex-wrap items-center gap-4">
              <button type="button" onClick={() => set('via', [...form.via, ''])} className="text-sm font-semibold text-accent-600 hover:underline">
                ＋ Via-punt toevoegen
              </button>
              <Toggle checked={form.retour} onChange={(v) => set('retour', v)} label="Retour" />
            </div>
            <Field label="Afstand (km)" hint="Automatisch berekend — handmatig aanpasbaar.">
              <Input type="number" step="0.1" value={form.km} onChange={(e) => set('km', e.target.value)} />
            </Field>
            <Field label="Totaalbedrag">
              <div className="rounded-xl bg-hbr-50 border border-hbr-100 px-3 py-2 text-lg font-bold text-hbr-800">
                {fmtEUR(amount)}
              </div>
            </Field>
            <div className="col-span-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500">
              ℹ Het tarief van {fmtEUR(KM_RATE)}/km bestaat fiscaal uit {fmtEUR(0.13)} belast en {fmtEUR(0.23)} onbelast.
              Dit wordt automatisch verwerkt via HR/Payroll.
            </div>
            <Field label="Categorie" className="col-span-2">
              <Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                {state.categories.filter((c) => c.active).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Leverancier" hint="Optioneel bij kilometers.">
              <Input value={form.supplier} onChange={(e) => set('supplier', e.target.value)} placeholder="—" />
            </Field>
            <Field label="Omschrijving">
              <Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Doel van de rit" />
            </Field>
            <div className="col-span-2">
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tags</span>
              <div className="flex flex-wrap gap-2">
                {state.tags.map((t) => (
                  <TagChip key={t.id} name={t.name} active={form.tagIds.includes(t.id)} onClick={() => toggleTag(t.id)} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={save}>Opslaan als concept</Button>
            <Button variant="secondary" onClick={() => setCopyOpen(true)} disabled={!form.from || !form.to}>
              📋 Kopieer naar andere datum
            </Button>
            <Button variant="ghost" onClick={() => dispatch({ type: 'NAVIGATE', page: 'dashboard' })}>Annuleren</Button>
          </div>
        </Card>

        {/* Kaart-paneel */}
        <div className="lg:col-span-2 space-y-3">
          <RouteMap from={form.from} to={form.to} calculating={calculating} hasRoute={hasRoute} retour={form.retour} />
          {hasRoute && !calculating && (
            <Card className="p-4 text-sm flex items-center justify-between">
              <span className="text-slate-500">Berekende afstand{form.retour ? ' (retour)' : ''}</span>
              <span className="font-bold text-hbr-800">{form.km} km · {fmtEUR(amount)}</span>
            </Card>
          )}
        </div>
      </div>

      <Modal open={copyOpen} onClose={() => setCopyOpen(false)} title="Kopieer declaratie naar andere datum">
        <p className="text-sm text-slate-500 mb-3">
          Handig voor terugkerende ritten: dezelfde route wordt als nieuw concept aangemaakt.
        </p>
        <Field label="Nieuwe datum">
          <Input type="date" value={copyDate} onChange={(e) => setCopyDate(e.target.value)} />
        </Field>
        <div className="mt-4 flex gap-2">
          <Button onClick={copyToDate} disabled={!copyDate}>Kopiëren</Button>
          <Button variant="secondary" onClick={() => setCopyOpen(false)}>Annuleren</Button>
        </div>
      </Modal>
    </div>
  )
}
