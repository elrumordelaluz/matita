# matita

Percorso di matematica per studenti delle superiori: lezioni, esercizi
generati, ripasso spaziato. Leggi `SPEC.md` prima di toccare il codice e
`GLOSSARY.md` prima di dare un nome a qualcosa.

## Convenzioni

- Testi per lo studente in italiano; codice, commit e nomi in inglese.
- I valori numerici del motore sono `bigint`, mai `number`.
- Ogni regola del motore (risolutore, generatori, verifica, errori tipici) ha i
  suoi test Vitest. Gli esempi dei test usano espressioni da libro di testo.
- Script a esecuzione singola: `pnpm typecheck`, `pnpm test`,
  `pnpm format:check`, `pnpm build`. Girano anche nel pre-push e in CI.

## Non fare

- Importare React, DOM o storage dentro `src/engine/`
  (`tests/architecture.test.ts` lo blocca).
- Aggiungere una dipendenza senza dichiararla nella PR.
- Cambiare un test per farlo passare.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on elrumordelaluz/matita, driven with `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default roles, each label named after its role (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
