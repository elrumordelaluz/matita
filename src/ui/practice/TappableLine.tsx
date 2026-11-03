import type { MouseEvent } from 'react'
import {
  readPath,
  toKatex,
  toText,
  type Expression,
  type Path,
} from '../../engine/index.ts'
import { Formula } from '../Formula.tsx'
import { markClass } from '../lesson/steps.ts'

// La riga corrente del passo passo, con gli operatori da toccare. Si toccano
// tutti, anche quelli i cui operandi non sono ancora numeri: se si potesse
// toccare solo il conto giusto, la pagina svelerebbe l'ordine delle
// operazioni. L'evidenziazione segue quello che lo studente vede, l'operatore
// col numero o il gruppo scritto a ciascun lato. Un solo gestore legge la
// posizione dell'operatore toccato.
//
// KaTeX non si raggiunge da tastiera né da lettore di schermo: il tocco è una
// scorciatoia, il campo resta la strada completa.
export function TappableLine({
  expression,
  selected,
  onTap,
  className,
}: {
  expression: Expression
  /** La posizione dell'operatore acceso, se c'è. */
  selected: Path | null
  onTap: (path: Path) => void
  className?: string
}) {
  const tex = toKatex(expression, {
    operatorPaths: true,
    ...(selected && { highlight: { path: selected, className: markClass } }),
  })

  function tap(event: MouseEvent) {
    const operator = (event.target as Element).closest('[data-path]')
    const path = operator && readPath(operator.getAttribute('data-path') ?? '')
    if (path) onTap(path)
  }

  return (
    <span
      onClick={tap}
      // Il segno è piccolo per un dito: l'area da toccare gli sta intorno,
      // senza arrivare sulle cifre accanto.
      className="[&_[data-path]]:relative [&_[data-path]]:cursor-pointer [&_[data-path]]:transition-colors [&_[data-path]]:after:absolute [&_[data-path]]:after:-inset-x-1 [&_[data-path]]:after:-inset-y-2 [&_[data-path]]:after:content-[''] [&_[data-path]]:hover:text-pencil-ink"
    >
      <Formula
        marked
        tex={tex}
        text={toText(expression)}
        {...(className === undefined ? {} : { className })}
      />
    </span>
  )
}
