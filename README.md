# Matita

Matematica per il biennio delle superiori, per chi studia da solo. Una lezione
spiega, gli esercizi generati allenano, il ripasso spaziato riporta le abilità
quando stanno per sfumare. La lingua è l'italiano e le convenzioni sono quelle
dei libri di testo italiani: parentesi tonde, quadre e graffe, `:` per la
divisione, frazioni ridotte ai minimi termini.

Niente account. Tutto vive nel browser dello studente, con esportazione e
importazione di un backup.

## Il percorso

Sette capitoli, nell'ordine in cui si incontrano a scuola. Ogni capitolo ha
una lezione, esempi svolti e la pratica; le abilità acquisite tornano nel
ripasso.

1. Espressioni in N
2. Espressioni in Z
3. Espressioni in Q
4. Potenze
5. Insiemi
6. Monomi
7. Polinomi

Tutti e sette hanno la lezione e gli esercizi. Cosa manca e cosa resta fuori
per scelta sta in [SPEC.md](SPEC.md), che è la descrizione completa del
prodotto: motore, politica delle risposte, ripasso, pagine.

## Come funziona

Gli esercizi non sono una lista: un generatore per abilità produce espressioni
nuove ogni volta, e il motore le risolve passo per passo con la stessa
aritmetica che si insegna in classe. I numeri sono `bigint`, così nessun
risultato intermedio perde precisione. Una risposta sbagliata viene confrontata
con gli errori tipici (il segno dimenticato, la potenza di un negativo) per
dire allo studente cosa è successo, non solo che ha sbagliato.

Il ripasso è FSRS, con la libreria `ts-fsrs`: ogni abilità ha la sua carta,
l'esito di un esercizio diventa un voto e la carta decide quando l'abilità
torna.

## Avviare

Serve Node nella versione in `.nvmrc` e pnpm.

```sh
pnpm install
pnpm dev
```

I controlli, gli stessi del pre-push e della CI:

```sh
pnpm typecheck
pnpm test
pnpm format:check
pnpm build
```

## Il codice

React, TypeScript, Vite e Tailwind; KaTeX per le formule, `idb` per il
salvataggio nel browser. Sito statico.

```
src/
  engine/    motore puro: numeri, espressioni, risolutore, generatori, verifica
  progress/  tentativi, stato delle abilità, scheduler
  content/   capitoli, abilità, lezioni
  ui/        componenti e pagine
```

`engine/` importa solo da `engine/`, e `progress/` non conosce né l'interfaccia
né i contenuti: `tests/architecture.test.ts` lo fa rispettare. Il resto delle
regole, con le convenzioni per chi scrive codice, è in [AGENTS.md](AGENTS.md);
i nomi delle cose, in italiano e nel codice, in [GLOSSARY.md](GLOSSARY.md).
Le ricerche sui programmi e sui libri di testo che hanno guidato le scelte
sono in [docs/research](docs/research).

## Contribuire

Le issue sono il posto per segnalare un errore nel motore, una spiegazione
che non convince o un esercizio che un libro farebbe diversamente. Un esempio
concreto, con l'espressione e il risultato atteso, vale più di una descrizione.
Le pull request portano i loro test, e una dipendenza nuova si dichiara nella
descrizione.

## Licenza

[MIT](LICENSE).
