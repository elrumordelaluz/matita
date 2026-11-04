# Matita

Spiegazioni ed esercizi di matematica per le superiori, con ripasso spaziato.
Si comincia dalle espressioni con numeri naturali, interi e razionali. Il
progetto è descritto in [SPEC.md](SPEC.md).

Serve Node 24, la versione fissata da `.nvmrc`.

```sh
pnpm install
pnpm dev
```

Controlli, gli stessi del pre-push e della CI:

```sh
pnpm typecheck && pnpm test && pnpm format:check && pnpm build
```
