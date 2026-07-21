import React, { useState } from 'react'
import { useApp, usePersona } from './store.jsx'
import { ToastStack } from './ui.jsx'
import Dashboard from './pages/Dashboard.jsx'
import BonForm from './pages/BonForm.jsx'
import KmForm from './pages/KmForm.jsx'
import FormsList from './pages/FormsList.jsx'
import FormDetail from './pages/FormDetail.jsx'
import Assistants from './pages/Assistants.jsx'
import Inbox from './pages/Inbox.jsx'
import ApprovalDetail from './pages/ApprovalDetail.jsx'
import AdminMasterdata from './pages/AdminMasterdata.jsx'
import AdminProcess from './pages/AdminProcess.jsx'

const PAGES = {
  dashboard: Dashboard,
  'bon-new': BonForm,
  'km-new': KmForm,
  forms: FormsList,
  'form-detail': FormDetail,
  assistants: Assistants,
  inbox: Inbox,
  'approval-detail': ApprovalDetail,
  'admin-master': AdminMasterdata,
  'admin-process': AdminProcess,
}

function navItemsFor(role) {
  if (role === 'admin') {
    return [
      { page: 'admin-process', label: 'Proces-overzicht', icon: '📊' },
      { page: 'admin-master', label: 'Masterdata', icon: '⚙️' },
    ]
  }
  if (role === 'lijnmanager' || role === 'spc') {
    return [{ page: 'inbox', label: 'Goedkeuren', icon: '✅' }]
  }
  return [
    { page: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { page: 'bon-new', label: 'Bon scannen', icon: '📷' },
    { page: 'km-new', label: 'Kilometers', icon: '🚗' },
    { page: 'forms', label: 'Formulieren', icon: '📋' },
    { page: 'assistants', label: 'Assistenten', icon: '👥' },
  ]
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg viewBox="0 0 32 32" className="w-8 h-8 shrink-0">
        <rect width="32" height="32" rx="7" fill="#00286A" />
        <path d="M5 19c3-2.5 5.5-2.5 8.5 0s5.5 2.5 8.5 0 5-2.5 8 0" stroke="#009FE3" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M5 24c3-2.5 5.5-2.5 8.5 0s5.5 2.5 8.5 0 5-2.5 8 0" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
      <div className="leading-tight">
        <div className="font-bold text-hbr-800 text-sm tracking-tight">Port of Rotterdam</div>
        <div className="text-[10px] text-accent-600 font-semibold uppercase tracking-widest">Declaraties</div>
      </div>
    </div>
  )
}

function PersonaSwitcher() {
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const persona = state.people.find((p) => p.id === state.personaId)
  const roleLabels = { declarant: 'Declarant', lijnmanager: 'Goedkeurder (lijnmanager)', spc: 'Goedkeurder (SPC)', admin: 'Beheerder' }
  const initials = persona.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-3 py-1 hover:border-accent-500/50 transition shadow-sm"
      >
        <span className="w-8 h-8 rounded-full bg-hbr-800 text-white text-xs font-bold flex items-center justify-center">
          {initials}
        </span>
        <span className="hidden sm:block text-left leading-tight">
          <span className="block text-sm font-semibold text-slate-800">{persona.name}</span>
          <span className="block text-[10px] text-slate-500">{roleLabels[persona.role]}</span>
        </span>
        <span className="text-slate-400 text-xs">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 overflow-hidden fade-up">
            <div className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
              Demo: wissel van persona
            </div>
            {state.people.filter((p) => p.id !== 'p-jan').map((p) => (
              <button
                key={p.id}
                onClick={() => { dispatch({ type: 'SWITCH_PERSONA', personaId: p.id }); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-hbr-50 transition ${p.id === state.personaId ? 'bg-accent-50' : ''}`}
              >
                <span className="w-8 h-8 rounded-full bg-hbr-100 text-hbr-800 text-xs font-bold flex items-center justify-center shrink-0">
                  {p.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-semibold text-slate-800">{p.name}</span>
                  <span className="block text-[11px] text-slate-500">{roleLabels[p.role]}</span>
                </span>
                {p.id === state.personaId && <span className="ml-auto text-accent-600">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ActingForBar() {
  const { state, dispatch } = useApp()
  const { actingFor } = usePersona()
  if (!actingFor) return null
  return (
    <div className="bg-amber-400 text-hbr-900 text-sm font-semibold px-4 py-2 flex items-center justify-center gap-3 flex-wrap">
      <span>👥 Je declareert nu namens: {actingFor.name} ✓</span>
      <button
        onClick={() => dispatch({ type: 'SET_ACTING_FOR', personId: null })}
        className="underline underline-offset-2 hover:no-underline text-xs"
      >
        Terug naar mijzelf
      </button>
    </div>
  )
}

export default function App() {
  const { state, dispatch } = useApp()
  const persona = state.people.find((p) => p.id === state.personaId)
  const items = navItemsFor(persona.role)
  const Page = PAGES[state.nav.page] || Dashboard
  const go = (page) => dispatch({ type: 'NAVIGATE', page })

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Logo />
          <PersonaSwitcher />
        </div>
        <ActingForBar />
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full flex">
        {/* Sidebar (desktop) */}
        <nav className="hidden md:flex flex-col gap-1 w-56 shrink-0 p-4 pt-6">
          {items.map((it) => (
            <button
              key={it.page}
              onClick={() => go(it.page)}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-left transition ${
                state.nav.page === it.page || (state.nav.page === 'form-detail' && it.page === 'forms') || (state.nav.page === 'approval-detail' && it.page === 'inbox')
                  ? 'bg-hbr-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:text-hbr-800'
              }`}
            >
              <span className="text-base">{it.icon}</span>
              {it.label}
            </button>
          ))}
          <div className="mt-auto pt-6 px-4 pb-2 text-[10px] text-slate-400 leading-relaxed">
            PoC-demo · alle data is fictief · geen backend
          </div>
        </nav>

        {/* Main */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 pb-24 md:pb-8">
          <Page key={state.nav.page + (state.nav.params?.id || '')} params={state.nav.params} />
        </main>
      </div>

      {/* Bottom nav (mobiel) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-20 flex">
        {items.map((it) => (
          <button
            key={it.page}
            onClick={() => go(it.page)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${
              state.nav.page === it.page ? 'text-accent-600' : 'text-slate-400'
            }`}
          >
            <span className="text-lg leading-none">{it.icon}</span>
            {it.label}
          </button>
        ))}
      </nav>

      <ToastStack toasts={state.toasts} />
    </div>
  )
}
