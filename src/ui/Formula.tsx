import katex from 'katex'
import 'katex/dist/katex.min.css'
import { toKatex, toText, type Expression } from '../engine/index.ts'
import { cn } from '../lib/cn.ts'

// Una formula resa con KaTeX. Il testo semplice fa da nome accessibile.
// Con `marked` KaTeX accetta `\htmlClass`, per evidenziare un pezzo a matita:
// solo per tex costruito dall'interfaccia, mai per quello dello studente.
export function Formula({
  tex,
  text,
  marked = false,
  className,
}: {
  tex: string
  text: string
  marked?: boolean
  className?: string
}) {
  return (
    <span
      role="math"
      aria-label={text}
      className={cn('inline-block', className)}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, {
          output: 'html',
          ...(marked && {
            trust: ({ command }) => command === '\\htmlClass',
            strict: 'ignore',
          }),
        }),
      }}
    />
  )
}

export function ExpressionFormula({
  expression,
  className,
}: {
  expression: Expression
  className?: string
}) {
  return (
    <Formula
      tex={toKatex(expression)}
      text={toText(expression)}
      {...(className === undefined ? {} : { className })}
    />
  )
}
