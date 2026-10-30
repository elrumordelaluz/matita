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

**Il segno.** Si salva per abilità, `{ skill, markedAt }`: i progressi non
conoscono i capitoli. Segnare un capitolo vuol dire segnare tutte le sue
abilità con la stessa data, e un capitolo è saputo quando tutte le sue
abilità hanno il segno. Se un capitolo guadagna un'abilità nuova, quella
resta senza segno finché lo studente non segna di nuovo il capitolo. "Lo so
già" si offre su ogni capitolo non ancora acquisito per intero, anche
bloccato.

**Segno e tentativi.** Un'abilità è acquisita se lo dicono i tentativi
oppure se ha il segno. La carta FSRS nasce dal primo dei due eventi: il
tentativo che completa la serie di tre, o il segno. Se nasce dal segno, i
tentativi di prima non contano per la carta e quelli di dopo sono ripassi.
Un segno messo dopo l'acquisizione non cambia nulla.

**Togliere il segno.** Stato e carta si ricalcolano dai soli tentativi, come
se il segno non ci fosse mai stato. I ripassi fatti nel frattempo restano
tentativi come gli altri e contano per la serie di tre. Un'abilità acquisita
con i tentativi resta acquisita anche se il suo prerequisito torna in
apprendimento, come vale per ogni abilità acquisita.

**Backup.** Il file è alla versione 2, con tentativi e segni. Un file della
versione 1, solo tentativi, si importa ancora. L'importazione aggiunge: un
segno nel file sostituisce quello della stessa abilità, gli altri segni
restano.

## Motore

Il motore è puro: funzioni senza stato, nessun import da React, dal DOM o
dallo storage. È la parte più testata del progetto.

**Numeri.** Un razionale è una coppia di `bigint` normalizzata (denominatore
positivo, MCD 1). Mai `number` per i valori, mai float. La forma in cui lo
studente scrive una risposta è un'altra cosa e non si normalizza: serve per
giudicarla (vedi [Politica delle risposte](#politica-delle-risposte)).

**Espressioni.** Un albero con numeri, operazioni binarie (`+ − × :`) e
gruppi. Il gruppo ricorda il suo tipo (tonda, quadra, graffa) perché lo
studente lo vede e lo deve rispettare. La potenza è un'operazione binaria
`^` che lega più di × e di :. A sinistra la base (un numero o un gruppo), a
destra l'esponente, un numero intero. Non si concatena: una potenza di
potenza ha la base fra parentesi, `(3²)³`. Ogni albero si rende in KaTeX e in
testo semplice, e la lettura del testo ridà lo stesso albero. Nel testo
l'esponente va in cifre ad apice (`2³`, `(2 + 1)²`), così il testo si legge
come sul libro e fa da nome accessibile.

Il meno unario non è un nodo a sé. Nei libri compare in due posti, e ciascuno
ha la sua forma nell'albero. Davanti a un numero è il segno del numero: un
numero relativo è un numero con valore negativo, e un positivo può ricordare
il segno scritto, (+4). Davanti a un gruppo, −(3 − 7), è il gruppo che
ricorda di essere preceduto dal meno.

Davanti a una potenza il meno vale per tutta la potenza: −3² è −(3²) e vale
−9, mentre (−3)² è la potenza di −3 e vale 9. Nell'albero −3² è lo stesso
gruppo con il meno davanti, intorno alla potenza, ma non disegna le
parentesi, perché la potenza lega più del meno e il libro non le scrive.
Non è un gruppo da svolgere: il risolutore lo calcola nel giro delle
potenze, in un passaggio solo. La scelta tiene un'unica forma per "meno
davanti a qualcosa" e non inventa un nodo nuovo né un `0 − 3²` che il libro
non scrive. (−3)² invece è una potenza con base il numero −3, che come ogni
numero relativo non all'inizio va fra tonde. Anche una frazione alla base va
fra tonde, (2/3)², che in KaTeX crescono con lei. L'esponente è un intero,
anche zero o negativo: 5⁰, 2⁻³.

**Scrittura dei relativi.** Come nei libri: un numero con il segno scritto va
fra tonde, (−3) × (+4), tranne all'inizio dell'espressione o di un gruppo,
−3 + 5 e [−2 + (3 − 7)]. L'inizio è la foglia più a sinistra: lo eredita solo
il primo operando di un'operazione, e ricomincia dentro ogni gruppo. Dentro
−( ) un numero solo ha sempre il segno: −(+3), −(−4). Un'espressione si
scrive tutta in un modo, con il segno davanti ai positivi o senza. Il meno
davanti a una potenza segue la stessa regola: −3² + 5 all'inizio,
2 × (−3²) altrove.

**Risolutore.** Dato un albero, produce la soluzione come sequenza di righe,
nello stile del quaderno. Ogni riga è l'espressione dopo aver svolto un
livello: il gruppo più interno, al suo interno prima le potenze, poi × e : da
sinistra a destra, poi + e − da sinistra a destra. Quando un gruppo si riduce a
un solo numero le sue parentesi cadono; se il numero è negativo resta fra
tonde, perché è la sua scrittura: 5 − (3 − 7) = 5 − (−4) = 9. Se il gruppo
era preceduto dal meno restano il meno e le parentesi, −(−4), e il cambio di
segno è un passaggio del giro di × e :, perché è la regola dei segni:
−(3 − 7) + 2 = −(−4) + 2 = 4 + 2 = 6. Ogni riga è composta di passaggi
atomici (una sola operazione ciascuno) con la regola applicata, così la
lezione può mostrare la riga intera o aprirla operazione per operazione. Il
risolutore calcola la parentesi prima del meno che la precede; togliere le
parentesi cambiando i segni è l'altra strada, e la spiega la lezione.

In Q ogni operazione fra due frazioni resta un passaggio solo, con il
risultato già ridotto: 1/4 + 1/6 = 5/12, 9/8 : 3/2 = 3/4. Il minimo comune
multiplo, la semplificazione in croce e il prodotto per il reciproco sono il
modo di fare quel conto, non un'operazione in più: non cambiano l'ordine delle
operazioni né la riga. Li spiega la lezione, che lo dice, e il quaderno non
finge di mostrarli. Una riga che riscrive 9/8 : 3/2 come 9/8 × 2/3 sarebbe un
passaggio senza conto, e il risolutore ne ha solo con il conto.

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
| `minus-power`            | `−3² = −9`         |

Le proprietà valgono fra due potenze vicine nella stessa catena di × e :,
da sinistra a destra: in `2³ × 3 × 2²` non si applicano, perché in mezzo c'è
un 3. Con la stessa base e lo stesso esponente vince la stessa base
(`2³ × 2³ = 2⁶`). Una potenza di potenza non è un gruppo da svolgere: le sue
parentesi cadono con la proprietà. Ogni passaggio porta anche i valori
(per una proprietà, i valori delle due potenze e il risultato), così chi
legge solo i numeri trova sempre un conto giusto. In `−3² = −9`, come nel
cambio di segno, −x si legge 0 − x, con x il valore della potenza. Le
proprietà possono portare all'esponente zero o negativo, 5³ : 5³ = 5⁰ e
2³ : 2⁵ = 2⁻², e la riga dopo calcola la potenza: 1 e 1/4.

**Generatore.** Per ogni abilità, un generatore parametrico che riceve un seme
e una difficoltà e restituisce un esercizio. Stesso seme, stesso esercizio:
il tentativo salva il seme e la versione del generatore, e l'esercizio si può
sempre ricostruire. I vincoli sono parte del generatore: ogni risultato
intermedio appartiene all'insieme del capitolo, i numeri restano nel calcolo
mentale (fino a 20 per i fattori in N, denominatori piccoli in Q), il
risultato finale è "pulito". Le potenze da calcolare con basi intere
restano fino a 125 in valore assoluto, con base fino a 10. Con l'esponente
zero o negativo e nelle espressioni con le potenze in Q valgono i limiti di
Q, tranne il quoziente fra due valori uguali, che lì è il modo di arrivare
all'esponente zero. In Z i numeri scritti vanno fino a 15 in valore
assoluto, i fattori fino a 10, e ogni risultato intermedio è un intero fino a
100; solo il risultato finale può valere zero. In Q i denominatori scritti
vanno fino a 12 e una frazione scritta è già ridotta; ogni intermedio ha
denominatore fino a 36 e numeratore fino a 60, il minimo comune multiplo di
una somma resta entro 24, il risultato ha denominatore fino a 12 e numeratore
fino a 30. Prodotti e quozienti hanno sempre qualcosa da semplificare in
croce. Quando la costruzione da sola
non garantisce un vincolo, il generatore scarta l'esercizio guardando la sua
soluzione e ne costruisce un altro: lo stesso seme scarta sempre gli stessi.

**Errori tipici.** Ogni errore tipico è una variante sbagliata di una regola
del risolutore: sommare prima di moltiplicare, svolgere 10 − 4 + 2 da destra,
ignorare una parentesi, sommare numeratori e denominatori, dimenticare il
segno davanti a una parentesi, moltiplicare base ed esponente (`2³ = 6`),
sommare gli esponenti in una potenza di potenza (`(3²)³ = 3⁵`), moltiplicarli
nel prodotto con la stessa base (`2⁵ × 2³ = 2¹⁵`), distribuire la potenza su
una somma (`(2 + 3)² = 2² + 3²`), elevare anche il meno (`−3² = 9`),
lasciare il meno alla potenza di un negativo (`(−2)⁴ = −16`), dare zero
all'esponente zero (`5⁰ = 0`), leggere l'esponente negativo come un segno
(`2⁻³ = −8`). Per riconoscerlo il motore valuta l'esercizio
con la regola sbagliata e confronta il risultato con la risposta. Se
coincidono, lo studente riceve la spiegazione di quell'errore e non un
generico "sbagliato". Il catalogo cresce per capitolo. In Z: togliere una
parentesi preceduta dal meno senza cambiare i segni dentro, perdere il meno
davanti a una parentesi (5 − (−4) come 5 − 4), meno per meno preso come meno,
la regola dei segni usata in una somma (−3 − 4 come +7). In Q: sommare
numeratori e denominatori, dividere moltiplicando senza prendere il
reciproco. Ciascuno vale solo dove ha senso: fra due frazioni il primo, con
almeno una frazione il secondo, così 12 : 4 resta una divisione fra interi.
Quando due errori
spiegano la stessa risposta vince il più preciso: la parentesi preceduta dal
meno viene prima della parentesi ignorata, anche in N; l'esponente zero
viene prima di base per esponente, che per 5⁰ dà lo stesso 0. Gli errori
sull'esponente zero e negativo si cercano anche nelle righe della
soluzione, perché quegli esponenti spesso nascono da una proprietà: in
5³ : 5³ + 2 l'errore è leggere 5⁰ come 0. Il meno davanti a una potenza non
ha parentesi, quindi non conta come parentesi ignorata né persa.

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

| caso                             | esempio         | esito           | messaggio                            |
| -------------------------------- | --------------- | --------------- | ------------------------------------ |
| intero con segno più             | `+5`            | `corretto`      |                                      |
| frazione non ridotta             | `4/6`           | `da-riscrivere` | Riduci ai minimi termini.            |
| intero scritto come frazione     | `6/3`, `4/1`    | `da-riscrivere` | Il risultato è un numero intero.     |
| segno al denominatore            | `2/-3`, `-2/-3` | `da-riscrivere` | Il segno va davanti alla frazione.   |
| decimale al posto della frazione | `0,5`, `0.5`    | `da-riscrivere` | Scrivi il risultato come frazione.   |
| frazione impropria               | `7/3`           | `corretto`      |                                      |
| numero misto                     | `2 1/3`         | `non-valido`    | Scrivi il risultato come frazione.   |
| doppio segno                     | `--5`           | `non-valido`    | Scrivi un solo segno.                |
| decimale che vale un intero      | `2,0`           | `da-riscrivere` | Il risultato è un numero intero.     |
| denominatore zero                | `2/0`           | `non-valido`    | Il denominatore non può essere zero. |

Una risposta con più di un motivo mostra il primo, nell'ordine in cui lo si
corregge: il segno, poi l'intero, poi i minimi termini. Una risposta in forma
non canonica con il valore sbagliato si giudica dal valore: sbagliata, o
errore tipico.

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

**Passo passo.** Per le abilità `n.*` lo studente può scegliere, con
l'interruttore "Passo passo", di scrivere ogni riga della soluzione invece
del solo risultato. Una riga è accettata quando si ottiene dalla precedente
sostituendo con il loro risultato, una o più alla volta, le operazioni i cui
operandi sono già numeri, nell'ordine del quaderno: prima il dentro delle
parentesi, poi le potenze, poi × e :, poi + e −, da sinistra a destra. Il
tipo di parentesi non conta. Una riga rifiutata dice se è sbagliato l'ordine
oppure il valore, nomina l'operazione da controllare, lascia l'esercizio
aperto e conta come aiutata. Una riga che è un solo numero è la risposta
finale: va alla verifica così com'è scritta. "Suggerimento" scrive il
prossimo passaggio del risolutore a partire dalla riga dello studente,
tranne il risultato dell'ultimo passaggio.

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
persistenza si può cambiare senza toccare il resto. Si salvano solo i
tentativi e i segni di già saputo; stato e carte si ricalcolano. Esportazione
e importazione di un file JSON con tutti e due: senza account, il backup è
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
