import { useEffect, useId, useState, type ChangeEvent } from 'react'
import type { Skill } from '../content/skills.ts'
import type { Attempt } from '../progress/attempt.ts'
import { exportBackup, importBackup } from '../progress/backup.ts'
import { skillStates, type SkillState } from '../progress/skillState.ts'
import type { ProgressStore } from '../progress/store.ts'
import { cn } from '../lib/cn.ts'

// "I miei progressi": lo stato di ogni abilità e il backup dei tentativi.

const stateLabel: Record<SkillState, string> = {
  locked: 'bloccata',
  learning: 'in apprendimento',
  mastered: 'acquisita',
}

type Notice =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly text: string }

export function ProgressPage({
  store,
  skills,
}: {
  store: ProgressStore
  skills: readonly Skill[]
}) {
  const [attempts, setAttempts] = useState<Attempt[] | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const id = useId()

  useEffect(() => {
    let live = true
    void store.attempts().then((a) => {
      if (live) setAttempts(a)
    })
    return () => {
      live = false
    }
  }, [store])

  async function download() {
    const text = await exportBackup(store)
    const url = URL.createObjectURL(
      new Blob([text], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `matita-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const result = await importBackup(store, await file.text())
    if (!result.ok) {
      setNotice({ ok: false, text: result.message })
      return
    }
    setAttempts(await store.attempts())
    setNotice({
      ok: true,
      text:
        result.count === 1
          ? 'Importato 1 tentativo.'
          : `Importati ${result.count} tentativi.`,
    })
  }

  const states = attempts && skillStates(skills, attempts)

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-8">
      <h2 id={`${id}-title`} className="text-xl font-semibold">
        I miei progressi
      </h2>

      {states && (
        <ul className="divide-y divide-hair border-y border-hair">
          {skills.map((skill) => {
            const state = states[skill.id] ?? 'locked'
            return (
              <li
                key={skill.id}
                aria-labelledby={`${id}-${skill.id}`}
                className="flex items-baseline justify-between gap-4 py-3"
              >
                <span id={`${id}-${skill.id}`}>{skill.title}</span>
                <span
                  className={cn(
                    'text-sm',
                    state === 'mastered' && 'text-ok',
                    state !== 'mastered' && 'text-dim',
                  )}
                >
                  {stateLabel[state]}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <section aria-labelledby={`${id}-backup`} className="space-y-3">
        <h3 id={`${id}-backup`} className="text-sm text-dim">
          Backup
        </h3>
        <p className="text-sm text-dim">
          I progressi vivono solo in questo browser. Scarica un backup ogni
          tanto: se il browser viene ripulito, lo reimporti e non perdi nulla.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void download()}
            className="rounded border border-hair px-4 py-2"
          >
            Scarica un backup
          </button>
          <label className="cursor-pointer rounded border border-hair px-4 py-2">
            Importa un backup
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => void upload(e)}
              className="sr-only"
            />
          </label>
        </div>
        {notice && (
          <p
            role={notice.ok ? 'status' : 'alert'}
            className={cn('text-sm', notice.ok ? 'text-ok' : 'text-err')}
          >
            {notice.text}
          </p>
        )}
      </section>
    </section>
  )
}
