import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react'
import {
  PEOPLE, CATEGORIES, PAYMENT_METHODS, TAGS, DECLARATIONS, FORMS, ASSISTANTS,
} from './seed.js'

const AppContext = createContext(null)

export const STATUS_LABELS = {
  concept: 'Concept',
  ingediend: 'Ingediend',
  goedgekeurd_lm: 'Goedgekeurd lijnmanager',
  goedgekeurd_spc: 'Goedgekeurd SPC',
  wacht_uitbetaling: 'Goedgekeurd — wacht op uitbetaling',
  uitbetaald: 'Uitbetaald',
  afgewezen: 'Afgewezen',
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function fmtEUR(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n ?? 0)
}

export function fmtDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}-${m}-${y}`
}

const initialState = {
  people: PEOPLE,
  categories: CATEGORIES,
  paymentMethods: PAYMENT_METHODS,
  tags: TAGS,
  declarations: DECLARATIONS,
  forms: FORMS,
  assistants: ASSISTANTS,
  personaId: 'p-ryan',        // wie is "ingelogd" (demo-switcher)
  actingForId: null,           // namens wie wordt gedeclareerd (assistent-modus)
  nav: { page: 'dashboard', params: {} },
  toasts: [],
  formCounter: 1008,
  declCounter: 16,
}

function reducer(state, action) {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, nav: { page: action.page, params: action.params || {} } }

    case 'SWITCH_PERSONA': {
      const person = state.people.find((p) => p.id === action.personaId)
      const home = person?.role === 'admin' ? 'admin-process'
        : person?.role === 'lijnmanager' || person?.role === 'spc' ? 'inbox'
        : 'dashboard'
      return { ...state, personaId: action.personaId, actingForId: null, nav: { page: home, params: {} } }
    }

    case 'SET_ACTING_FOR':
      return { ...state, actingForId: action.personId }

    case 'TOAST_ADD':
      return { ...state, toasts: [...state.toasts, action.toast] }
    case 'TOAST_REMOVE':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }

    case 'DECL_ADD':
      return {
        ...state,
        declarations: [...state.declarations, action.declaration],
        declCounter: state.declCounter + 1,
      }
    case 'DECL_UPDATE':
      return {
        ...state,
        declarations: state.declarations.map((d) => (d.id === action.id ? { ...d, ...action.patch } : d)),
      }
    case 'DECL_DELETE':
      return { ...state, declarations: state.declarations.filter((d) => d.id !== action.id) }

    case 'FORM_ADD':
      return { ...state, forms: [...state.forms, action.form], formCounter: state.formCounter + 1 }
    case 'FORM_UPDATE':
      return {
        ...state,
        forms: state.forms.map((f) => (f.id === action.id ? { ...f, ...action.patch } : f)),
      }
    case 'FORM_DELETE':
      return {
        ...state,
        forms: state.forms.filter((f) => f.id !== action.id),
        declarations: state.declarations.map((d) => (d.formId === action.id ? { ...d, formId: null } : d)),
      }
    case 'FORM_SET_STATUS': {
      const entry = { status: action.status, date: todayISO(), by: action.by, comment: action.comment }
      return {
        ...state,
        forms: state.forms.map((f) =>
          f.id === action.id
            ? { ...f, status: action.status, history: [...f.history, entry], ...(action.patch || {}) }
            : f
        ),
        declarations: state.declarations.map((d) =>
          d.formId === action.id ? { ...d, status: action.status } : d
        ),
      }
    }

    case 'BUNDLE': {
      const { newForms, assignments } = action
      return {
        ...state,
        forms: [...state.forms, ...newForms],
        declarations: state.declarations.map((d) =>
          assignments[d.id] ? { ...d, formId: assignments[d.id] } : d
        ),
        formCounter: state.formCounter + newForms.length,
      }
    }

    case 'ASSISTANT_ADD':
      return { ...state, assistants: [...state.assistants, action.assistant] }
    case 'ASSISTANT_DELETE':
      return { ...state, assistants: state.assistants.filter((a) => a.id !== action.id) }

    case 'MASTER_ADD':
      return { ...state, [action.collection]: [...state[action.collection], action.item] }
    case 'MASTER_UPDATE':
      return {
        ...state,
        [action.collection]: state[action.collection].map((i) =>
          i.id === action.id ? { ...i, ...action.patch } : i
        ),
      }
    case 'MASTER_DELETE':
      return { ...state, [action.collection]: state[action.collection].filter((i) => i.id !== action.id) }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const toastId = useRef(0)

  const toast = useCallback((message, kind = 'success') => {
    const id = ++toastId.current
    dispatch({ type: 'TOAST_ADD', toast: { id, message, kind } })
    setTimeout(() => dispatch({ type: 'TOAST_REMOVE', id }), 4200)
  }, [])

  return (
    <AppContext.Provider value={{ state, dispatch, toast }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}

// ---- Afgeleide helpers ---------------------------------------------------

export function usePersona() {
  const { state } = useApp()
  const persona = state.people.find((p) => p.id === state.personaId)
  const actingFor = state.actingForId ? state.people.find((p) => p.id === state.actingForId) : null
  // De "effectieve declarant": namens wie declaraties worden aangemaakt/getoond
  const effectiveId = state.actingForId || state.personaId
  return { persona, actingFor, effectiveId }
}

export function formTotal(state, form) {
  return state.declarations
    .filter((d) => d.formId === form.id)
    .reduce((sum, d) => sum + d.amount, 0)
}

export function formDeclarations(state, form) {
  return state.declarations.filter((d) => d.formId === form.id)
}

export function looseConceptDeclarations(state, ownerId) {
  return state.declarations.filter(
    (d) => d.ownerId === ownerId && d.formId === null && d.status === 'concept'
  )
}

// Openstaande goedkeuringstaken per rol
export function approvalTasks(state, role) {
  if (role === 'lijnmanager') return state.forms.filter((f) => f.status === 'ingediend')
  if (role === 'spc') return state.forms.filter((f) => f.status === 'goedgekeurd_lm' && f.route === 'SPC')
  return []
}

export function daysOpen(form) {
  if (!form.submittedAt) return 0
  const ms = new Date(todayISO()) - new Date(form.submittedAt)
  return Math.round(ms / 86400000)
}

// AI-goedkeurassist: adviserende checks per formulier (gesimuleerd, maar
// dynamisch berekend zodat de demo consistent blijft na mutaties).
export function approvalAssist(state, form) {
  const decls = formDeclarations(state, form)
  const findings = []

  for (const d of decls) {
    if (d.type !== 'bon') continue
    // Dubbele-bon-detectie: zelfde leverancier + bedrag in een ander formulier
    const dup = state.declarations.find(
      (o) => o.id !== d.id && o.formId !== form.id && o.type === 'bon'
        && o.supplier === d.supplier && o.amount === d.amount
    )
    if (dup) {
      findings.push({
        level: 'warn',
        text: `Vergelijkbare declaratie op ${fmtDate(dup.date)} — zelfde bedrag (${fmtEUR(d.amount)}) en leverancier (${d.supplier}).`,
      })
    }
    // Beleidscheck: boven €150 is een bon verplicht
    if (d.amount > 150) {
      findings.push(
        d.receipt
          ? { level: 'ok', text: `Bedrag boven €150 (${d.supplier}) — bon verplicht ✓ aanwezig.` }
          : { level: 'warn', text: `Bedrag boven €150 (${d.supplier}) — bon verplicht, maar ontbreekt.` }
      )
    }
  }

  const hasWarning = findings.some((f) => f.level === 'warn')
  return { hasWarning, findings }
}
