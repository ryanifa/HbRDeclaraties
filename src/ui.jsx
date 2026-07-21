import React from 'react'
import { STATUS_LABELS } from './store.jsx'

// ---- Basisbouwstenen -----------------------------------------------------

export function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-slate-200/70 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-accent-500/40 transition' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-hbr-800 text-white hover:bg-hbr-700 shadow-sm',
    accent: 'bg-accent-500 text-white hover:bg-accent-600 shadow-sm',
    secondary: 'bg-white text-hbr-800 border border-slate-300 hover:bg-slate-50',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    danger: 'bg-white text-red-600 border border-red-300 hover:bg-red-50',
    ghost: 'text-hbr-800 hover:bg-hbr-100',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  )
}

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500'

export function Input({ aiFilled, className = '', ...props }) {
  return <input className={`${inputCls} ${aiFilled ? 'ai-filled' : ''} ${className}`} {...props} />
}

export function Select({ aiFilled, className = '', children, ...props }) {
  return (
    <select className={`${inputCls} ${aiFilled ? 'ai-filled' : ''} ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`${inputCls} ${className}`} rows={3} {...props} />
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 select-none"
    >
      <span
        className={`w-10 h-6 rounded-full p-0.5 transition ${checked ? 'bg-accent-500' : 'bg-slate-300'}`}
      >
        <span
          className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`}
        />
      </span>
      {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
    </button>
  )
}

export function Spinner({ className = 'w-4 h-4' }) {
  return (
    <svg className={`animate-spin text-accent-500 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
    </svg>
  )
}

// ---- Badges --------------------------------------------------------------

export function StatusBadge({ status, className = '' }) {
  const styles = {
    concept: 'bg-slate-100 text-slate-600 border-slate-200',
    ingediend: 'bg-accent-50 text-accent-600 border-accent-100',
    goedgekeurd_lm: 'bg-accent-50 text-accent-600 border-accent-100',
    goedgekeurd_spc: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    wacht_uitbetaling: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    uitbetaald: 'bg-emerald-700 text-white border-emerald-700',
    afgewezen: 'bg-red-50 text-red-600 border-red-200',
  }
  const shortLabels = {
    goedgekeurd_lm: 'Goedgekeurd LM — bij SPC',
    wacht_uitbetaling: 'Wacht op uitbetaling',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${styles[status] || styles.concept} ${className}`}
    >
      {status === 'uitbetaald' && <span>€</span>}
      {shortLabels[status] || STATUS_LABELS[status] || status}
    </span>
  )
}

export function RouteBadge({ route }) {
  return route === 'HR' ? (
    <span className="inline-flex items-center rounded-full bg-hbr-100 text-hbr-800 border border-hbr-800/10 px-2.5 py-0.5 text-xs font-semibold">
      HR / Payroll
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-0.5 text-xs font-semibold">
      SPC
    </span>
  )
}

export function TagChip({ name, onRemove, active, onClick }) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition ${
        active
          ? 'bg-hbr-800 text-white border-hbr-800'
          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      {name}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-red-300 ml-0.5">×</button>
      )}
    </span>
  )
}

// ---- AI-elementen --------------------------------------------------------

export function AiChip({ children, onAccept, onDismiss }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 text-xs font-medium fade-up">
      <span>💡</span>
      <span>{children}</span>
      {onAccept && (
        <button onClick={onAccept} className="font-bold text-emerald-700 hover:underline">Accepteren</button>
      )}
      {onDismiss && (
        <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600">×</button>
      )}
    </span>
  )
}

export function AiBanner({ children }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-accent-50 border border-accent-100 text-accent-600 px-3 py-2 text-sm fade-up">
      <span className="shrink-0">✨</span>
      <span>{children}</span>
    </div>
  )
}

// ---- Bon-thumbnail (gestileerde nep-bon) ---------------------------------

export function ReceiptThumb({ supplier, amount, size = 'sm', onClick }) {
  const dims = size === 'lg' ? 'w-44 h-56 text-[10px]' : 'w-14 h-[4.5rem] text-[4px]'
  return (
    <div
      onClick={onClick}
      className={`${dims} bg-white border border-slate-300 rounded-md shadow-sm p-1.5 flex flex-col gap-1 overflow-hidden shrink-0 ${onClick ? 'cursor-zoom-in hover:shadow-md transition' : ''}`}
      title={onClick ? 'Klik om te vergroten' : undefined}
    >
      <div className="text-center font-bold text-slate-700 truncate">{supplier || 'BON'}</div>
      <div className="border-t border-dashed border-slate-300" />
      {[...Array(size === 'lg' ? 7 : 4)].map((_, i) => (
        <div key={i} className="flex justify-between gap-1">
          <span className="bg-slate-200 rounded h-[0.4em] w-2/3" />
          <span className="bg-slate-200 rounded h-[0.4em] w-1/5" />
        </div>
      ))}
      <div className="border-t border-dashed border-slate-300 mt-auto" />
      <div className="flex justify-between font-bold text-slate-700">
        <span>TOTAAL</span>
        <span>{typeof amount === 'number' ? amount.toFixed(2) : ''}</span>
      </div>
    </div>
  )
}

// ---- Gestileerde kaart met route (geen echte maps-API) -------------------

export function RouteMap({ from, to, calculating, hasRoute, retour }) {
  const short = (s) => (s ? s.split(',')[0] : '')
  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-[#eef4f8]">
      <svg viewBox="0 0 400 260" className="w-full h-auto block">
        {/* water */}
        <path d="M0 190 C 60 170, 120 210, 200 195 S 340 170, 400 185 L 400 260 L 0 260 Z" fill="#cfe6f3" />
        <path d="M0 205 C 70 188, 140 222, 220 207 S 350 185, 400 198" stroke="#b5d8ec" strokeWidth="3" fill="none" />
        {/* wegen */}
        <path d="M-10 60 L 410 100" stroke="#dfe7ee" strokeWidth="10" fill="none" />
        <path d="M60 -10 L 140 270" stroke="#dfe7ee" strokeWidth="8" fill="none" />
        <path d="M300 -10 L 250 270" stroke="#dfe7ee" strokeWidth="8" fill="none" />
        <path d="M-10 140 C 120 120, 260 160, 410 130" stroke="#d4dde6" strokeWidth="12" fill="none" />
        {/* stadsblokjes */}
        {[[30, 30], [90, 55], [330, 40], [355, 130], [40, 150], [180, 40], [230, 150]].map(([x, y], i) => (
          <g key={i} fill="#dbe3ea">
            <rect x={x} y={y} width="16" height="10" rx="1.5" />
            <rect x={x + 20} y={y + 4} width="10" height="8" rx="1.5" />
          </g>
        ))}
        {hasRoute && !calculating && (
          <>
            <path
              d="M70 195 C 110 150, 180 170, 230 120 S 310 70, 330 62"
              stroke="#009FE3" strokeWidth="4" strokeLinecap="round" fill="none"
              className="route-line"
            />
            {/* Marker A */}
            <g>
              <circle cx="70" cy="195" r="10" fill="#00286A" />
              <text x="70" y="199" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">A</text>
            </g>
            {/* Marker B */}
            <g>
              <circle cx="330" cy="62" r="10" fill="#009FE3" />
              <text x="330" y="66" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">B</text>
            </g>
          </>
        )}
      </svg>
      {calculating && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center gap-2 text-sm font-medium text-hbr-800">
          <Spinner /> Route berekenen…
        </div>
      )}
      {hasRoute && !calculating && (
        <div className="absolute bottom-2 left-2 right-2 bg-white/95 rounded-xl px-3 py-2 text-xs shadow flex items-center justify-between gap-2">
          <span className="truncate">
            <b className="text-hbr-800">{short(from)}</b> → <b className="text-accent-600">{short(to)}</b>
          </span>
          {retour && <span className="text-slate-500 shrink-0">↩ retour</span>}
        </div>
      )}
      {!hasRoute && !calculating && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
          Vul vertrek- en aankomstadres in
        </div>
      )}
    </div>
  )
}

// ---- Status-tijdlijn -----------------------------------------------------

export function StatusTimeline({ form }) {
  const steps = ['concept', 'ingediend', 'goedgekeurd_lm']
  if (form.route === 'SPC') steps.push('goedgekeurd_spc')
  steps.push('wacht_uitbetaling', 'uitbetaald')

  const order = { concept: 0, ingediend: 1, goedgekeurd_lm: 2, goedgekeurd_spc: 3, wacht_uitbetaling: 4, uitbetaald: 5 }
  const labels = {
    concept: 'Concept',
    ingediend: 'Ingediend',
    goedgekeurd_lm: 'Lijnmanager',
    goedgekeurd_spc: 'SPC',
    wacht_uitbetaling: 'Wacht op uitbetaling',
    uitbetaald: 'Uitbetaald',
  }
  const rejected = form.status === 'afgewezen'
  const current = rejected ? 1 : order[form.status] ?? 0
  // Voor HR-route: geen SPC-stap; status wacht_uitbetaling volgt direct op LM
  const effSteps = steps

  return (
    <div className="flex items-start overflow-x-auto pb-1">
      {effSteps.map((s, i) => {
        const idx = order[s]
        const done = !rejected && idx <= current
        const isCurrent = !rejected && idx === current
        return (
          <div key={s} className="flex items-start shrink-0">
            {i > 0 && (
              <div className={`h-0.5 w-6 sm:w-10 mt-3 ${done ? 'bg-accent-500' : 'bg-slate-200'}`} />
            )}
            <div className="flex flex-col items-center w-16 sm:w-20">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                  done
                    ? isCurrent
                      ? 'bg-accent-500 border-accent-500 text-white'
                      : 'bg-hbr-800 border-hbr-800 text-white'
                    : 'bg-white border-slate-300 text-slate-300'
                }`}
              >
                {done && !isCurrent ? '✓' : i + 1}
              </div>
              <span className={`mt-1 text-[10px] text-center leading-tight ${done ? 'text-hbr-800 font-semibold' : 'text-slate-400'}`}>
                {labels[s]}
              </span>
            </div>
          </div>
        )
      })}
      {rejected && (
        <div className="flex items-start shrink-0">
          <div className="h-0.5 w-6 sm:w-10 mt-3 bg-red-300" />
          <div className="flex flex-col items-center w-16 sm:w-20">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-red-500 border-2 border-red-500 text-white">✕</div>
            <span className="mt-1 text-[10px] text-center text-red-600 font-semibold">Afgewezen</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Modal & toasts ------------------------------------------------------

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-hbr-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto fade-up`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-hbr-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function ToastStack({ toasts }) {
  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[60] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-in flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg max-w-xs sm:max-w-sm ${
            t.kind === 'error' ? 'bg-red-600 text-white'
            : t.kind === 'info' ? 'bg-hbr-800 text-white'
            : 'bg-emerald-600 text-white'
          }`}
        >
          <span>{t.kind === 'error' ? '⚠' : t.kind === 'info' ? 'ℹ' : '✓'}</span>
          {t.message}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon = '📭', title, subtitle }) {
  return (
    <div className="text-center py-12 text-slate-400">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="font-semibold text-slate-500">{title}</div>
      {subtitle && <div className="text-sm mt-1">{subtitle}</div>}
    </div>
  )
}

export function PageTitle({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-hbr-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}
