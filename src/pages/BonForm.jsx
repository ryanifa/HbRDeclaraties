import React, { useState } from 'react'
import { useApp, usePersona, fmtEUR } from '../store.jsx'
import { Card, Button, Field, Input, Select, Textarea, TagChip, Spinner, AiChip, AiBanner, RouteBadge, ReceiptThumb, PageTitle } from '../ui.jsx'

const COUNTRIES = ['Nederland', 'België', 'Duitsland', 'Frankrijk', 'Verenigd Koninkrijk', 'Overig']
const CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF']
const VAT_RATES = [0, 9, 21]

// Gesimuleerd AI-scanresultaat
const SCAN_RESULT = {
  supplier: 'Brasserie De Kaap, Rotterdam',
  date: '2026-07-20',
  amount: '34.80',
  vatPct: 9,
  vatAmount: '2.87',
  suggestedCategory: 'c-lunch',
  confidence: 92,
}

export default function BonForm({ params }) {
  const { state, dispatch, toast } = useApp()
  const { effectiveId } = usePersona()
  const editing = params?.editId ? state.declarations.find((d) => d.id === params.editId) : null

  const [form, setForm] = useState(() => editing ? {
    date: editing.date, country: editing.country || 'Nederland', amount: String(editing.amount),
    currency: editing.currency, vatPct: editing.vatPct, vatAmount: String(editing.vatAmount),
    vatIncl: true, categoryId: editing.categoryId, paymentMethodId: editing.paymentMethodId,
    supplier: editing.supplier, description: editing.description, tagIds: editing.tagIds || [],
  } : {
    date: '', country: 'Nederland', amount: '', currency: 'EUR', vatPct: 21, vatAmount: '',
    vatIncl: true, categoryId: '', paymentMethodId: 'pm-eigen', supplier: '', description: '', tagIds: [],
  })
  const [scanState, setScanState] = useState(editing ? 'done' : 'idle') // idle | scanning | done
  const [aiFields, setAiFields] = useState({})
  const [suggestion, setSuggestion] = useState(null)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const category = state.categories.find((c) => c.id === form.categoryId)

  function startScan() {
    if (scanState === 'scanning') return
    setScanState('scanning')
    setTimeout(() => {
      setForm((f) => ({
        ...f,
        supplier: SCAN_RESULT.supplier,
        date: SCAN_RESULT.date,
        amount: SCAN_RESULT.amount,
        vatPct: SCAN_RESULT.vatPct,
        vatAmount: SCAN_RESULT.vatAmount,
      }))
      setAiFields({ supplier: true, date: true, amount: true, vat: true })
      setSuggestion(SCAN_RESULT)
      setScanState('done')
      setTimeout(() => setAiFields({}), 1800)
    }, 1500)
  }

  function acceptSuggestion() {
    set('categoryId', suggestion.suggestedCategory)
    setSuggestion(null)
  }

  function toggleTag(id) {
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(id) ? f.tagIds.filter((t) => t !== id) : [...f.tagIds, id],
    }))
  }

  function save() {
    if (!form.date || !form.amount || !form.categoryId || !form.description) {
      toast('Vul minimaal datum, bedrag, categorie en omschrijving in.', 'error')
      return
    }
    const payload = {
      date: form.date, country: form.country,
      amount: parseFloat(form.amount) || 0, currency: form.currency,
      vatPct: form.vatPct, vatAmount: parseFloat(form.vatAmount) || 0,
      categoryId: form.categoryId, paymentMethodId: form.paymentMethodId,
      supplier: form.supplier || '—', description: form.description,
      tagIds: form.tagIds, receipt: scanState === 'done',
    }
    if (editing) {
      dispatch({ type: 'DECL_UPDATE', id: editing.id, patch: payload })
      toast('Declaratie bijgewerkt.')
    } else {
      dispatch({
        type: 'DECL_ADD',
        declaration: {
          id: `d-${state.declCounter}`, ownerId: effectiveId, type: 'bon',
          status: 'concept', formId: null, ...payload,
        },
      })
      toast('Bon-declaratie opgeslagen als concept.')
    }
    dispatch({ type: 'NAVIGATE', page: 'forms' })
  }

  return (
    <div className="fade-up max-w-5xl">
      <PageTitle
        title={editing ? 'Bon-declaratie bewerken' : 'Nieuwe bon-declaratie'}
        subtitle="Scan een bon of vul de velden handmatig in."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {/* Formulier */}
        <Card className="p-5 lg:col-span-3 order-2 lg:order-1">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Datum">
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} aiFilled={aiFields.date} />
            </Field>
            <Field label="Land">
              <Select value={form.country} onChange={(e) => set('country', e.target.value)}>
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Bedrag">
              <div className="flex gap-2">
                <Input
                  type="number" step="0.01" placeholder="0,00" value={form.amount}
                  onChange={(e) => set('amount', e.target.value)} aiFilled={aiFields.amount}
                />
                <Select value={form.currency} onChange={(e) => set('currency', e.target.value)} className="!w-24">
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </Select>
              </div>
              {form.currency !== 'EUR' && form.amount && (
                <span className="block text-xs text-accent-600 mt-1">
                  ≈ {fmtEUR(parseFloat(form.amount) * 1.16)} (omgerekend, indicatieve koers)
                </span>
              )}
            </Field>
            <Field label="BTW">
              <div className="flex gap-2">
                <Select value={form.vatPct} onChange={(e) => set('vatPct', parseInt(e.target.value, 10))} className="!w-24" aiFilled={aiFields.vat}>
                  {VAT_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                </Select>
                <Input
                  type="number" step="0.01" placeholder="BTW-bedrag" value={form.vatAmount}
                  onChange={(e) => set('vatAmount', e.target.value)} aiFilled={aiFields.vat}
                />
                <Select value={form.vatIncl ? 'incl' : 'excl'} onChange={(e) => set('vatIncl', e.target.value === 'incl')} className="!w-24">
                  <option value="incl">incl.</option>
                  <option value="excl">excl.</option>
                </Select>
              </div>
            </Field>
            <Field label="Categorie" className="col-span-2">
              <Select value={form.categoryId} onChange={(e) => { set('categoryId', e.target.value); setSuggestion(null) }}>
                <option value="">— Kies categorie —</option>
                {state.categories.filter((c) => c.active).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              {suggestion && (
                <div className="mt-2">
                  <AiChip onAccept={acceptSuggestion} onDismiss={() => setSuggestion(null)}>
                    Voorstel: {state.categories.find((c) => c.id === suggestion.suggestedCategory)?.name.split('(')[0]} — {suggestion.confidence}% zeker
                  </AiChip>
                </div>
              )}
            </Field>
            <Field label="Betaalmethode" className="col-span-2">
              <Select value={form.paymentMethodId} onChange={(e) => set('paymentMethodId', e.target.value)}>
                {state.paymentMethods.filter((m) => m.active).map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Leverancier" className="col-span-2">
              <Input value={form.supplier} onChange={(e) => set('supplier', e.target.value)} placeholder="Naam leverancier" aiFilled={aiFields.supplier} />
            </Field>
            <Field label="Omschrijving" className="col-span-2">
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Waarvoor was deze uitgave?" rows={2} />
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

          {/* Route-indicatie */}
          {category && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm text-slate-600">
              <RouteBadge route={category.route} />
              Deze declaratie wordt uitbetaald via {category.route === 'HR' ? 'HR/Payroll' : 'het SPC'}.
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <Button onClick={save}>Opslaan als concept</Button>
            <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', page: 'dashboard' })}>Annuleren</Button>
          </div>
        </Card>

        {/* Upload / scan-zone */}
        <div className="lg:col-span-2 order-1 lg:order-2 space-y-3">
          <Card
            className={`p-6 border-2 border-dashed !shadow-none text-center transition ${
              scanState === 'done' ? 'border-emerald-300 bg-emerald-50/40' : 'border-accent-500/40 hover:border-accent-500 cursor-pointer'
            }`}
            onClick={scanState !== 'done' ? startScan : undefined}
          >
            {scanState === 'idle' && (
              <div className="py-8">
                <div className="text-4xl mb-3">📷</div>
                <div className="font-semibold text-hbr-800">Klik om een afbeelding toe te voegen</div>
                <div className="text-xs text-slate-400 mt-2">
                  De bon wordt automatisch gelezen en de velden worden ingevuld
                </div>
              </div>
            )}
            {scanState === 'scanning' && (
              <div className="py-10 flex flex-col items-center gap-3">
                <Spinner className="w-8 h-8" />
                <div className="text-sm font-semibold text-hbr-800">Bon wordt gelezen…</div>
                <div className="text-xs text-slate-400">AI herkent leverancier, datum, bedrag en BTW</div>
              </div>
            )}
            {scanState === 'done' && (
              <div className="py-4 flex flex-col items-center gap-3">
                <ReceiptThumb supplier={form.supplier} amount={parseFloat(form.amount)} size="lg" />
                <span className="text-xs font-semibold text-emerald-700">✓ Bon toegevoegd</span>
              </div>
            )}
          </Card>
          {scanState === 'done' && !editing && (
            <AiBanner>Automatisch herkend — controleer de velden.</AiBanner>
          )}
        </div>
      </div>
    </div>
  )
}
