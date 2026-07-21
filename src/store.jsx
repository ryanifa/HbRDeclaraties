import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import {
  PEOPLE, CATEGORIES, PAYMENT_METHODS, TAGS, DECLARATIONS, FORMS, ASSISTANTS,
} from './seed.js'
import { loadDb, saveDb, TOKEN_KEY } from './github.js'

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

// Welke delen van de state in db/db.json op GitHub staan
const SEED_DB = {
  categories: CATEGORIES,
  paymentMethods: PAYMENT_METHODS,
  tags: TAGS,
  declarations: DECLARATIONS,
  forms: FORMS,
  assistants: ASSISTANTS,
  formCounter: 1008,
  declCounter: 16,
}

function normalizeDb(d = {}) {
  const out = {}
  for (const key of Object.keys(SEED_DB)) out[key] = d[key] ?? SEED_DB[key]
  return out
}

function serialize(state) {
  const out = {}
  for (const key of Object.keys(SEED_DB)) out[key] = state[key]
  return out
}

const initialState = {
  people: PEOPLE,
  ...SEED_DB,
  personaId: 'p-ryan',        // wie is "ingelogd" (demo-switcher)
  actingForId: null,           // namens wie wordt gedeclareerd (assistent-modus)
  nav: { page: 'dashboard', params: {} },
  toasts: [],
  db: {
    status: 'loading',         // loading | offline | readonly | pending | synced | error
    token: (typeof localStorage !== 'undefined' && localStorage.getItem(TOKEN_KEY)) || '',
  },
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

    case 'DB_LOADED':
      return { ...state, ...action.data, db: { ...state.db, status: action.status } }
    case 'DB_STATUS':
      return state.db.status === action.status ? state : { ...state, db: { ...state.db, status: action.status } }
    case 'DB_TOKEN':
      return { ...state, db: { ...state.db, token: action.token } }
    case 'DB_RESET':
      return { ...state, ...SEED_DB }

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
  const lastSynced = useRef(null)   // JSON-snapshot zoals die op GitHub staat
  const dbReady = useRef(false)
  const saveTimer = useRef(null)

  const toast = useCallback((message, kind = 'success') => {
    const id = ++toastId.current
    dispatch({ type: 'TOAST_ADD', toast: { id, message, kind } })
    setTimeout(() => dispatch({ type: 'TOAST_REMOVE', id }), 4200)
  }, [])

  const applyLoaded = useCallback((data, token) => {
    const merged = normalizeDb(data)
    lastSynced.current = JSON.stringify(merged)
    dbReady.current = true
    dispatch({ type: 'DB_LOADED', data: merged, status: token ? 'synced' : 'readonly' })
  }, [])

  // Bij opstarten: database uit de GitHub-repo laden (valt terug op seed-data)
  useEffect(() => {
    let cancelled = false
    loadDb(state.db.token)
      .then((data) => { if (!cancelled) applyLoaded(data, state.db.token) })
      .catch(() => { if (!cancelled) dispatch({ type: 'DB_STATUS', status: 'offline' }) })
    return () => { cancelled = true }
  }, [])

  // Automatisch opslaan (debounced) zodra er een token is en de data wijzigt
  const persistedJson = JSON.stringify(serialize(state))
  useEffect(() => {
    if (!dbReady.current || !state.db.token) return
    if (persistedJson === lastSynced.current) return
    clearTimeout(saveTimer.current)
    dispatch({ type: 'DB_STATUS', status: 'pending' })
    saveTimer.current = setTimeout(() => {
      saveDb(JSON.parse(persistedJson), state.db.token)
        .then(() => {
          lastSynced.current = persistedJson
          dispatch({ type: 'DB_STATUS', status: 'synced' })
        })
        .catch(() => dispatch({ type: 'DB_STATUS', status: 'error' }))
    }, 1500)
    return () => clearTimeout(saveTimer.current)
  }, [persistedJson, state.db.token])

  // GitHub-koppeling beheren (instellingen-dialoog)
  const connectGitHub = useCallback(async (token) => {
    try {
      const data = await loadDb(token)
      localStorage.setItem(TOKEN_KEY, token)
      dispatch({ type: 'DB_TOKEN', token })
      applyLoaded(data, token)
      toast('Gekoppeld — wijzigingen worden nu opgeslagen in db/db.json op GitHub.')
      return true
    } catch {
      toast('Koppelen mislukt — controleer het token en de rechten (Contents: read/write).', 'error')
      return false
    }
  }, [applyLoaded, toast])

  const disconnectGitHub = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    dispatch({ type: 'DB_TOKEN', token: '' })
    dispatch({ type: 'DB_STATUS', status: dbReady.current ? 'readonly' : 'offline' })
    toast('Koppeling verbroken — wijzigingen blijven alleen in dit browsertabblad.', 'info')
  }, [toast])

  const resetDb = useCallback(() => {
    dispatch({ type: 'DB_RESET' })
    toast('Database teruggezet naar de demo-startsituatie.', 'info')
  }, [toast])

  return (
    <AppContext.Provider value={{ state, dispatch, toast, connectGitHub, disconnectGitHub, resetDb }}>
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
