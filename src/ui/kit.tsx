import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../lib/cn.ts'

// I pezzi comuni del banco di lavoro: pannelli che galleggiano sulla
// scrivania, il foglio a quadretti, i pulsanti. Ogni pagina li compone.

export function Panel({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'rounded-3xl border border-hair/70 bg-panel p-5 shadow-panel',
        className,
      )}
      {...props}
    />
  )
}

// Il foglio a quadretti: dove vivono le espressioni e le soluzioni.
export function Sheet({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'bg-squared rounded-3xl border border-hair/70 shadow-panel',
        className,
      )}
      {...props}
    />
  )
}

// Un'etichetta piccola in maiuscoletto, sopra i titoli dei pannelli.
export function Eyebrow({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'text-xs font-semibold tracking-[0.14em] text-dim uppercase',
        className,
      )}
      {...props}
    />
  )
}

// Una nota scritta a mano a margine del quaderno.
export function Note({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      className={cn('font-hand text-xl leading-none text-lead', className)}
      {...props}
    />
  )
}

type Variant = 'primary' | 'pencil' | 'ghost'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink/90 shadow-key',
  pencil: 'bg-pencil text-on-pencil hover:brightness-105 shadow-key',
  ghost: 'border border-hair bg-panel text-ink hover:bg-paper',
}

export function Button({
  variant = 'primary',
  icon,
  className,
  children,
  ...props
}: ComponentProps<'button'> & { variant?: Variant; icon?: ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 font-semibold transition',
        'active:translate-y-px active:shadow-none disabled:pointer-events-none disabled:opacity-40',
        'focus-visible:ring-2 focus-visible:ring-pencil focus-visible:ring-offset-2 focus-visible:ring-offset-panel focus-visible:outline-none',
        variants[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

// Un anello di avanzamento: `value` fra 0 e 1. La misura arriva da
// `className` (di base `size-11`), il disegno scala con il viewBox.
export function Ring({
  value,
  className,
  children,
}: {
  value: number
  className?: string
  children?: ReactNode
}) {
  const size = 44
  const stroke = 5
  const r = (size - stroke) / 2
  const length = 2 * Math.PI * r
  const clamped = Math.min(1, Math.max(0, value))
  return (
    <span
      className={cn(
        'relative inline-grid size-11 shrink-0 place-items-center',
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="absolute inset-0 size-full -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-hair"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - clamped)}
          className="stroke-pencil transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="relative text-xs font-bold">{children}</span>
    </span>
  )
}
