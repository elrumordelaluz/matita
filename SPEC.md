# Matita

Un percorso di matematica per chi studia da solo alle superiori: una lezione
spiega, gli esercizi allenano, il ripasso spaziato riporta le abilità quando
stanno per sfumare. Si parte dalle espressioni con numeri naturali, interi e
razionali, il primo scoglio del biennio. La lingua del prodotto è l'italiano e
le convenzioni sono quelle dei libri di testo italiani: parentesi tonde, quadre
e graffe, `:` per la divisione, frazioni ridotte ai minimi termini.

Nessun account. Tutto vive nel browser dello studente (vedi
[Ripasso e tracking](#ripasso-e-tracking)), con esportazione e importazione di
un backup.

## Percorso

Il percorso è diviso in capitoli, ogni capitolo in abilità. Un capitolo si
apre con una lezione, prosegue con esempi svolti e poi con la pratica. Le
abilità già acquisite tornano nel ripasso.

1. **Espressioni in N.** Le quattro operazioni, l'ordine delle operazioni, le
   parentesi. In N la sottrazione e la divisione non sono sempre possibili, e
   il generatore lo rispetta: ogni risultato intermedio resta un naturale e
   ogni divisione è esatta. Il limite è voluto, perché motiva il capitolo
   successivo.
2. **Espressioni in Z.** Somma algebrica, regola dei segni, parentesi precedute
   dal meno.
3. **Espressioni in Q.** Riduzione ai minimi termini, somma con il minimo
   comune multiplo, prodotto con semplificazione incrociata, divisione come
   prodotto per il reciproco.
4. **Potenze.** In N, Z e Q, proprietà delle potenze, esponente zero e
   negativo, la differenza fra −3² e (−3)².

### Abilità del primo capitolo

| id           | abilità                                            | prerequisiti             |
| ------------ | -------------------------------------------------- | ------------------------ |
| `n.add-sub`  | addizioni e sottrazioni, da sinistra a destra      | nessuno                  |
| `n.mul-div`  | moltiplicazioni e divisioni, da sinistra a destra  | nessuno                  |
| `n.order`    | quattro operazioni insieme: prima × e :, poi + e − | `n.add-sub`, `n.mul-div` |
| `n.parens`   | parentesi tonde                                    | `n.order`                |
| `n.brackets` | tonde, quadre e graffe annidate                    | `n.parens`               |

### Abilità del secondo capitolo

| id              | abilità                                         | prerequisiti                        |
| --------------- | ----------------------------------------------- | ----------------------------------- |
| `z.add-sub`     | somma algebrica di numeri relativi              | `n.add-sub`                         |
| `z.mul-div`     | regola dei segni in moltiplicazioni e divisioni | `n.mul-div`                         |
| `z.order`       | quattro operazioni con i relativi               | `z.add-sub`, `z.mul-div`, `n.order` |
| `z.minus-group` | parentesi precedute dal meno                    | `z.order`, `n.parens`               |
| `z.brackets`    | tonde, quadre e graffe in Z                     | `z.minus-group`, `n.brackets`       |

### Abilità del terzo capitolo

| id           | abilità                                                             | prerequisiti                        |
| ------------ | ------------------------------------------------------------------- | ----------------------------------- |
| `q.add-sub`  | somma algebrica di frazioni con il minimo comune multiplo           | `z.add-sub`                         |
| `q.mul-div`  | prodotto con semplificazione incrociata, divisione per il reciproco | `z.mul-div`                         |
| `q.order`    | quattro operazioni con le frazioni                                  | `q.add-sub`, `q.mul-div`, `z.order` |
| `q.brackets` | tonde, quadre e graffe in Q                                         | `q.order`, `z.brackets`             |

La riduzione ai minimi termini non è un'abilità a sé: si allena in ogni
risposta, con la [Politica delle risposte](#politica-delle-risposte).

### Abilità del quarto capitolo

| id                  | abilità                                                          | prerequisiti                      |
| ------------------- | ---------------------------------------------------------------- | --------------------------------- |
| `pow.basics`        | la potenza come prodotto ripetuto, −3² e (−3)²                   | `z.mul-div`                       |
| `pow.properties`    | proprietà delle potenze con la stessa base o lo stesso esponente | `pow.basics`                      |
| `pow.zero-negative` | esponente zero e negativo                                        | `pow.properties`, `q.mul-div`     |
| `pow.expressions`   | espressioni con potenze in Q                                     | `pow.zero-negative`, `q.brackets` |

I prerequisiti formano un grafo aciclico che attraversa i capitoli
(`z.order` richiede `n.order`). Ogni capitolo ha la sua lezione con la
stessa struttura: introduzione, una parte per regola con esempio svolto e
domanda di controllo, l'invito alla pratica.

### Già saputo

Chi un capitolo lo sa già può segnarlo come saputo e passare oltre. Tutte le
abilità del capitolo diventano acquisite senza esercizi, e quindi si
sbloccano le abilità che le richiedono. Il segno si salva come record a sé
accanto ai tentativi, con la data, e finisce nel backup. Si può togliere: le
abilità tornano allo stato che danno i loro tentativi.

Un'abilità segnata come saputa entra nel ripasso come se fosse appena stata
acquisita: la sua carta FSRS nasce alla data del segno con un voto Good, così
il primo ripasso arriva dopo qualche giorno e verifica che lo studente la
sappia davvero.

## Motore

Il motore è puro: funzioni senza stato, nessun import da React, dal DOM o
dallo storage. È la parte più testata del progetto.

**Numeri.** Un razionale è una coppia di `bigint` normalizzata (denominatore
positivo, MCD 1). Mai `number` per i valori, mai float. La forma in cui lo
studente scrive una risposta è un'altra cosa e non si normalizza: serve per
giudicarla (vedi [Politica delle risposte](#politica-delle-risposte)).

**Espressioni.** Un albero con numeri, operazioni binarie (`+ − × :`), meno
unario e gruppi. Il gruppo ricorda il suo tipo (tonda, quadra, graffa) perché
lo studente lo vede e lo deve rispettare. La potenza è un'operazione binaria
`^` che lega più di × e di :. A sinistra la base (un numero o un gruppo), a
destra l'esponente, un numero intero. Non si concatena: una potenza di
potenza ha la base fra parentesi, `(3²)³`. Ogni albero si rende in KaTeX e in
testo semplice; nel testo l'esponente va in cifre ad apice (`2³`,
`(2 + 1)²`), così il testo si legge come sul libro e fa da nome accessibile.

**Risolutore.** Dato un albero, produce la soluzione come sequenza di righe,
nello stile del quaderno. Ogni riga è l'espressione dopo aver svolto un
livello: il gruppo più interno, al suo interno prima le potenze, poi × e : da
sinistra a destra, poi + e − da sinistra a destra. Quando un gruppo si riduce a
un solo numero le sue parentesi cadono. Ogni riga è composta di passaggi
atomici (una sola operazione ciascuno) con la regola applicata, così la
lezione può mostrare la riga intera o aprirla operazione per operazione.

Le proprietà delle potenze vengono prima del calcolo, come sul libro:
`2⁵ × 2³ : 2⁶ = 2² = 4`, non `32 × 8 : 64`. Dentro un ambito, finché una
proprietà si può applicare, la riga è fatta di proprietà; poi una riga
calcola le potenze, poi si prosegue con × e : e con + e −. Ogni proprietà è
un passaggio che trasforma potenze in una potenza:

| regola                   | passaggio          |
| ------------------------ | ------------------ |
| `same-base-product`      | `2⁵ × 2³ = 2⁸`     |
| `same-base-quotient`     | `2⁸ : 2⁶ = 2²`     |
| `power-of-power`         | `(3²)³ = 3⁶`       |
| `same-exponent-product`  | `2² × 5² = 10²`    |
| `same-exponent-quotient` | `6³ : 2³ = 3³`     |
| `power`                  | `2³ = 8` (calcolo) |

Le proprietà valgono fra due potenze vicine nella stessa catena di × e :,
da sinistra a destra: in `2³ × 3 × 2²` non si applicano, perché in mezzo c'è
un 3. Con la stessa base e lo stesso esponente vince la stessa base
(`2³ × 2³ = 2⁶`). Una potenza di potenza non è un gruppo da svolgere: le sue
parentesi cadono con la proprietà. Ogni passaggio porta anche i valori
(per una proprietà, i valori delle due potenze e il risultato), così chi
legge solo i numeri trova sempre un conto giusto.

**Generatore.** Per ogni abilità, un generatore parametrico che riceve un seme
e una difficoltà e restituisce un esercizio. Stesso seme, stesso esercizio:
il tentativo salva il seme e la versione del generatore, e l'esercizio si può
sempre ricostruire. I vincoli sono parte del generatore: ogni risultato
intermedio appartiene all'insieme del capitolo, i numeri restano nel calcolo
mentale (fino a 20 per i fattori in N, denominatori piccoli in Q, potenze da
calcolare fino a 125 con base fino a 10), il risultato finale è "pulito".

**Errori tipici.** Ogni errore tipico è una variante sbagliata di una regola
del risolutore: sommare prima di moltiplicare, svolgere 10 − 4 + 2 da destra,
ignorare una parentesi, sommare numeratori e denominatori, dimenticare il
segno davanti a una parentesi, moltiplicare base ed esponente (`2³ = 6`),
sommare gli esponenti in una potenza di potenza (`(3²)³ = 3⁵`), moltiplicarli
nel prodotto con la stessa base (`2⁵ × 2³ = 2¹⁵`), distribuire la potenza su
una somma (`(2 + 3)² = 2² + 3²`). Per riconoscerlo il motore valuta l'esercizio
con la regola sbagliata e confronta il risultato con la risposta. Se
coincidono, lo studente riceve la spiegazione di quell'errore e non un
generico "sbagliato". Il catalogo cresce per capitolo.

**Verifica.** `verifica(risposta, esercizio)` restituisce un esito:

- `corretto`: valore giusto, forma canonica;
- `da-riscrivere`: valore giusto, forma non canonica, con il motivo;
- `errore-tipico`: valore sbagliato che coincide con un errore del catalogo;
- `sbagliato`: valore sbagliato senza spiegazione nota;
- `non-valido`: la risposta non si legge come un numero.

## Politica delle risposte

La forma canonica fa parte di ciò che si impara. Una risposta equivalente ma
non canonica non è mai segnata sbagliata e non è mai segnata corretta: lo
studente vede il motivo e la riscrive, e l'esercizio si chiude quando la forma
è giusta. Il tentativo conta come aiutato (vedi
[Ripasso e tracking](#ripasso-e-tracking)).

| caso                             | esempio         | esito           | messaggio                          |
| -------------------------------- | --------------- | --------------- | ---------------------------------- |
| intero con segno più             | `+5`            | `corretto`      |                                    |
| frazione non ridotta             | `4/6`           | `da-riscrivere` | Riduci ai minimi termini.          |
| intero scritto come frazione     | `6/3`, `4/1`    | `da-riscrivere` | Il risultato è un numero intero.   |
| segno al denominatore            | `2/-3`, `-2/-3` | `da-riscrivere` | Il segno va davanti alla frazione. |
| decimale al posto della frazione | `0,5`, `0.5`    | `da-riscrivere` | Scrivi il risultato come frazione. |
| frazione impropria               | `7/3`           | `corretto`      |                                    |
| numero misto                     | `2 1/3`         | `non-valido`    | Scrivi il risultato come frazione. |
| doppio segno                     | `--5`           | `non-valido`    | Scrivi un solo segno.              |

L'input accetta `·`, `×`, `*` per il prodotto, `:`, `÷` per la divisione, la
virgola e il punto come separatore decimale. La barra `/` è la linea di
frazione.

Nella modalità passo passo (vedi sotto) le righe intermedie accettano
qualsiasi forma equivalente, perché i libri ammettono di ridurre alla fine. La
politica si applica alla risposta finale.

## Pratica

**Risultato.** Lo studente vede l'espressione, scrive il risultato, riceve
l'esito. Dopo l'esito vede sempre la soluzione per righe; se l'esito è un
errore tipico, vede prima la spiegazione dell'errore. Un pulsante
"suggerimento" mostra la prossima riga e rende il tentativo aiutato.

**Passo passo** (dopo la prima slice). Lo studente scrive ogni riga. Il motore
controlla che la riga abbia lo stesso valore della precedente e che rispetti
l'ordine delle operazioni, e indica dove ha sbagliato. È qui che gli errori di
precedenza si vedono meglio.

## Ripasso e tracking

**Tentativo.** Ogni risposta salva: abilità, seme, versione del generatore,
risposta, esito, eventuale errore tipico, suggerimenti usati, riscritture,
durata, data.

**Stato di un'abilità.** Un'abilità è _bloccata_ finché i suoi prerequisiti
non sono acquisiti, poi è _in apprendimento_, poi _acquisita_. Diventa
acquisita con tre tentativi corretti consecutivi senza aiuti, oppure quando
lo studente segna il suo capitolo come saputo (vedi
[Già saputo](#già-saputo)). Da lì la programma il ripasso.

**Ripasso spaziato.** Lo scheduling è FSRS (libreria `ts-fsrs`) e la carta è
l'abilità, non l'esercizio: quando un'abilità scade, il generatore produce un
esercizio nuovo che la allena. L'esito diventa un voto FSRS:

| esito del tentativo                        | voto FSRS |
| ------------------------------------------ | --------- |
| `sbagliato`, `errore-tipico`, `non-valido` | Again     |
| corretto dopo suggerimento o riscrittura   | Hard      |
| `corretto` senza aiuti                     | Good      |

Easy non si usa finché non c'è un criterio onesto per darlo.

**Sessione.** Una sessione propone circa dieci esercizi: prima i ripassi
scaduti, mescolati fra abilità diverse (la pratica alternata funziona meglio
di quella a blocchi), poi l'abilità in apprendimento, poi, se c'è spazio, la
prossima abilità sbloccata preceduta dalla sua lezione.

**Storage.** IndexedDB, dietro un'interfaccia `ProgressStore` così la
persistenza si può cambiare senza toccare il resto. Esportazione e
importazione di un file JSON con tutti i tentativi: senza account, il backup è
l'unica difesa contro un browser ripulito.

## Lezioni

Una lezione è testo breve, esempi svolti e qualche domanda di controllo. Gli
esempi svolti usano il motore con un seme fisso, così la lezione mostra
esattamente le stesse righe che lo studente vedrà nella soluzione di un
esercizio. La prima lezione è scritta in TSX; si passa a MDX se e quando
scrivere prosa in TSX diventa scomodo.

Le formule si rendono con KaTeX. L'input è un campo di testo con anteprima
KaTeX dal vivo; su telefono, una tastierina con i simboli che servono.

## Architettura

```
src/
  engine/    motore puro: numeri, espressioni, risolutore, generatori, verifica
  progress/  tentativi, stato delle abilità, scheduler, ProgressStore
  content/   capitoli, abilità, lezioni
  ui/        componenti e pagine
```

Regole, fatte rispettare da `tests/architecture.test.ts`:

- `engine/` importa solo da `engine/`.
- `progress/` non importa da `ui/` né da `content/`: il grafo delle abilità
  arriva come parametro.

## Dipendenze

Oggi: React, Tailwind, `clsx`, `tailwind-merge`. Entreranno con la slice che
le usa, dichiarate nella PR: `katex`, `ts-fsrs`, `idb`. Componenti con
shadcn/ui quando serve il primo.

## Deploy

Sito statico Vite su Vercel.

## Fuori scopo, per ora

Account e sincronizzazione fra dispositivi, area docente e classi,
gamification (punti, serie, classifiche), spiegazioni generate da un modello,
lingue diverse dall'italiano.
