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
5. **Insiemi.** Rappresentazioni, appartenenza e inclusione, unione,
   intersezione, differenza e complementare, insieme delle parti e prodotto
   cartesiano contati, problemi con i diagrammi di Eulero-Venn. Gli insiemi
   sono di naturali. Vedi [Insiemi](#insiemi).
6. **Monomi.** Valore numerico, forma normale, somma, prodotto, quoziente e
   potenza di monomi, espressioni con i monomi. Vedi
   [Calcolo letterale](#calcolo-letterale).
7. **Polinomi.** Somma, prodotto, prodotti notevoli, espressioni con i
   polinomi.

L'ordine è quello dei libri di testo del biennio (Bergamini-Barozzi-Trifone,
Sasso, Matematica C3): gli insiemi vengono dopo i numeri e prima del calcolo
letterale. Molti docenti li anticipano a inizio anno, e il grafo lo permette:
il capitolo 5 si sblocca dalle abilità di N, senza aspettare Z e Q. Solo il
conto dell'insieme delle parti, 2ⁿ, aspetta la prima abilità delle potenze. Le fonti sono in `docs/research/insiemistica.md` e
`docs/research/monomi-polinomi.md`.

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

### Abilità del quinto capitolo

| id                  | abilità                                             | prerequisiti                   |
| ------------------- | --------------------------------------------------- | ------------------------------ |
| `set.roster`        | dalla proprietà caratteristica all'elencazione      | `n.mul-div`                    |
| `set.relations`     | appartenenza e inclusione: ∈, ∉, ⊂, ⊄, =            | `set.roster`                   |
| `set.operations`    | unione, intersezione, differenza, complementare     | `set.roster`                   |
| `set.parts-product` | quanti elementi hanno l'insieme delle parti e A × B | `set.operations`, `pow.basics` |
| `set.venn2`         | problemi con due insiemi                            | `set.operations`, `n.parens`   |
| `set.venn3`         | problemi con tre insiemi                            | `set.venn2`                    |

### Abilità del sesto capitolo

| id                 | abilità                                     | prerequisiti                                     |
| ------------------ | ------------------------------------------- | ------------------------------------------------ |
| `mono.value`       | valore numerico di un'espressione letterale | `pow.basics`, `q.order`                          |
| `mono.normal-form` | forma normale di un monomio                 | `pow.properties`, `q.mul-div`                    |
| `mono.add-sub`     | somma algebrica di monomi, simili e non     | `mono.normal-form`, `q.add-sub`, `z.minus-group` |
| `mono.mul-div`     | prodotto e quoziente di monomi              | `mono.normal-form`                               |
| `mono.power`       | potenza di un monomio, con il segno         | `mono.mul-div`                                   |
| `mono.expressions` | espressioni con i monomi                    | `mono.add-sub`, `mono.power`, `q.brackets`       |

### Abilità del settimo capitolo

| id                  | abilità                                                   | prerequisiti                                             |
| ------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `poly.add-sub`      | somma algebrica di polinomi, parentesi precedute dal meno | `mono.add-sub`                                           |
| `poly.mono-times`   | monomio per polinomio, polinomio diviso monomio           | `poly.add-sub`, `mono.mul-div`                           |
| `poly.times`        | polinomio per polinomio                                   | `poly.mono-times`                                        |
| `poly.square`       | quadrato di un binomio                                    | `poly.times`, `mono.power`                               |
| `poly.sum-diff`     | somma per differenza                                      | `poly.times`, `mono.power`                               |
| `poly.more-notable` | quadrato di un trinomio, cubo di un binomio               | `poly.square`                                            |
| `poly.expressions`  | espressioni con i polinomi e i prodotti notevoli          | `poly.sum-diff`, `poly.more-notable`, `mono.expressions` |

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
parentesi cambiando i segni è l'altra strada, e la spiega la lezione. Nel
calcolo letterale un gruppo non si riduce sempre a un numero, e lì le
parentesi si tolgono (vedi [Calcolo letterale](#calcolo-letterale)).

In Q ogni operazione fra due frazioni resta un passaggio solo, con il
risultato già ridotto: 1/4 + 1/6 = 5/12, 9/8 : 3/2 = 3/4. Il minimo comune
multiplo, la semplificazione in croce e il prodotto per il reciproco sono il
modo di fare quel conto, non un'operazione in più: non cambiano l'ordine delle
operazioni né la riga. Li spiega la lezione, che lo dice, e il quaderno non
finge di mostrarli. Una riga che riscrive 9/8 : 3/2 come 9/8 × 2/3 sarebbe un
passaggio senza conto, e il risolutore ne ha solo con il conto. Le uniche
eccezioni sono due righe del calcolo letterale, la sostituzione e la formula
del prodotto notevole, elencate in [Calcolo letterale](#calcolo-letterale).

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
- `non-valido`: la risposta non si legge come un numero, o come il tipo di
  risposta che l'esercizio chiede (vedi sotto).

**Tipi di risposta.** Fino al capitolo 4 un esercizio è un'espressione e la
risposta è un numero. Dal capitolo 5 la risposta può essere un insieme, una
scelta di simboli o un polinomio, e un problema ha un testo al posto
dell'espressione. L'esercizio diventa quindi un'unione con il tipo di
risposta come discriminante, e ogni tipo porta la sua consegna (espressione
di numeri, espressione di insiemi, scritture da completare, insiemi da
contare, problema, espressione letterale) e il suo risultato (razionale,
insieme, simboli, polinomio). Il conto di ℘(A) e di A × B e il problema
chiedono un numero, e lo giudicano con la politica dei numeri; hanno un tipo
a sé perché la consegna non è un'espressione, e scrivere 2ⁿ al posto degli
insiemi svelerebbe il conto. `verifica` legge e giudica la risposta secondo
quel tipo, con gli stessi cinque esiti. Ogni tipo ha la sua forma canonica e i suoi motivi per
riscrivere, descritti nel capitolo che lo introduce. La soluzione resta una
sequenza di righe fatte di passaggi, qualunque sia il tipo. I tentativi
salvati prima di questo cambio sono tutti di espressioni di numeri, e si
ricostruiscono come prima: un esercizio senza tipo è di numeri. Il tentativo
non salva il tipo, perché lo decide l'abilità.

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

## Insiemi

Il capitolo 5 lavora con insiemi finiti di naturali, scritti per elencazione
o per proprietà caratteristica, e con i problemi che si risolvono con i
diagrammi di Eulero-Venn. I numeri restano in N anche per una ragione di
scrittura: la virgola separa gli elementi, e con i decimali di Q sarebbe
ambigua. Insiemi di lettere o di parole, come le lettere di "cartellone",
sono fuori scopo per ora.

**Notazione.** Quella di Matematica C3. I programmi su Bergamini e Sasso
elencano gli stessi argomenti nello stesso ordine, ma i loro simboli non
sono verificati. Maiuscole per gli insiemi, `{1, 3, 5}` per l'elencazione,
`{x ∈ N | x < 7 e x è pari}` per la proprietà caratteristica, con la
condizione a parole e non con `∧`. `⊂` è il sottoinsieme proprio, `⊆` il
sottoinsieme quando non si sa se i due insiemi coincidono. L'insieme vuoto
si scrive `∅`. La differenza è `A − B`, il complementare di A rispetto a U è
`Ā` e l'esercizio dice sempre chi è U. L'insieme delle parti è `℘(A)`, la
cardinalità `card(A)`: `|A|` si confonderebbe con il valore assoluto. Una
coppia ordinata si scrive `(a; b)`, con il punto e virgola.

**Il dato.** Un insieme è un insieme di `bigint` senza ripetizioni, in un
ordine qualsiasi. Due insiemi sono uguali se hanno gli stessi elementi, e il
confronto è il "valore" della verifica. Un'espressione di insiemi è un albero
come quello dei numeri, con foglie gli insiemi nominati dall'esercizio e
operazioni `∪ ∩ −` e il complementare. Fra ∪ e ∩ non c'è un ordine delle
operazioni, quindi un'espressione con più di un'operazione ha sempre le
parentesi, come sul libro: `(A ∪ B) ∩ C`.

**Risolutore.** Una riga per operazione, dal gruppo più interno, con il
risultato per elencazione: `A ∪ B = {1, 2, 3, 5, 7}`. Il passaggio porta gli
elementi che entrano, così chi legge vede perché: in `A ∩ B` quelli comuni, in
`A − B` quelli di A che non stanno in B. Da una proprietà caratteristica la
riga elenca gli elementi in ordine crescente. Nella soluzione gli elementi
stanno sempre in ordine crescente, anche se la risposta può averne un altro.

**Appartenenza e inclusione.** L'esercizio confronta un insieme A dato per
elencazione con quattro oggetti: numeri, insiemi non vuoti o A stesso. Il
vuoto non compare fra gli oggetti, perché per C3 è un sottoinsieme improprio
e nessuno dei tasti lo direbbe bene. Lo studente
completa le quattro scritture scegliendo fra `∈ ∉ ⊂ ⊆ ⊄ =`, con dei tasti e
non scrivendo. Con due sole scelte per un numero, una scrittura sola a esercizio
si indovinerebbe una volta su due, e tre di fila una su otto: quattro
scritture insieme rendono la serie di tre una prova vera. Davanti a un numero
si usa l'appartenenza, davanti a un insieme l'inclusione o l'uguaglianza, e
la soluzione dice per ogni scrittura perché. Un insieme è sottoinsieme
improprio di sé stesso, e l'esercizio lo chiede con `=`. Il `⊆` è vero sia
dove vale `⊂` sia dove vale `=`, ma per C3 è il simbolo di quando non si sa
se gli insiemi coincidono, e nell'esercizio lo si sa sempre: è una scrittura
da riscrivere con il simbolo più preciso, non un errore. Il conto dei
sottoinsiemi propri resta fuori: per C3 il vuoto è improprio, per altri
libri no, e la risposta dipenderebbe dal libro.

**Insieme delle parti e prodotto cartesiano.** Si contano, non si elencano:
`card(℘(A)) = 2ⁿ` con n = card(A), `card(A × B) = card(A) × card(B)`. La
risposta è un numero, la soluzione conta gli elementi e poi fa la potenza o
il prodotto, e il calcolo è quello del capitolo 4. Elencare ℘(A) o A × B dà
risposte lunghe e scomode al telefono, e resta per ora alla lezione.

**Problemi.** Un problema è un testo con i dati di due o tre insiemi dentro
un universo: una classe, i soci di un club, gli iscritti ai corsi. Nel motore
è il vettore delle regioni del diagramma, 4 con due insiemi e 8 con tre,
ciascuna un `bigint ≥ 0`. Il generatore estrae le regioni, poi sceglie quali
dati scrivere nel testo (il totale, "almeno A", "solo A", "A e B", "almeno A
e B", "nessuno", "tutti e tre") e quale chiedere. Scarta il problema se la
domanda non ha una risposta sola o se per trovarla serve un sistema: a ogni
riga della soluzione ci deve essere una quantità con una sola incognita. Il
testo nasce da modelli di frase scritti a mano per ogni ambientazione, e le
parole "solo", "almeno", "entrambi", "nessuno" vengono dai modelli, mai
composte dal generatore. I modelli fanno parte del generatore: cambiarne uno
cambia cosa produce un seme, e alza la versione.

Prima di rispondere lo studente vede solo il testo: disegnare il diagramma è
parte del lavoro. La domanda può chiedere una regione ("solo calcio",
"nessuno") o una quantità che ne somma più d'una ("almeno uno", "una sola
bevanda").

La soluzione trova una quantità per riga, sempre una con una sola incognita.
Fra quelle possibili sceglie nell'ordine del quaderno: con tre insiemi il
centro, poi le regioni di "solo due", poi quelle di "solo uno", poi
l'esterno; con due insiemi l'intersezione, poi solo A, solo B, l'esterno. Una
riga può trovare anche un'unione, quando il testo dà il totale e "nessuno":
in una classe di 28 con 18 a teatro, 22 a fotografia e 3 a nessun laboratorio,
card(A ∪ B) = 28 − 3 = 25, poi entrambi = 18 + 22 − 25 = 15. Con due insiemi
la strada della formula è la stessa del libro: almeno uno = 17 + 12 − 5 = 24,
nessuno = 28 − 24 = 4. Quando un dato fa trovare una regione all'indietro,
come "Salsa o Break ma non Hip Hop", la riga lo dice. Se la domanda somma più
regioni, l'ultima riga fa la somma.

Una riga ha il nome della quantità e un'espressione in N, svolta dal
risolutore del capitolo 1 con le sue righe e i suoi passaggi: solo A =
17 − 5 = 12. Il nome è la forma del libro con le parole del testo al posto
delle lettere: "solo inglese", "entrambi", "nessuno". L'unione si chiama
"almeno uno" anche quando è un passo verso un'altra domanda, così una
quantità ha sempre lo stesso nome; "almeno uno" chiesto dalla domanda segue
la formula come sul libro, e non è la somma delle regioni. Fra le strade
possibili la soluzione sceglie la più corta, e a pari righe l'ordine del
quaderno.
Dopo l'esito l'interfaccia disegna il diagramma con le regioni riempite fino
alla riga mostrata, con il nome di ogni regione come testo accessibile. I
numeri restano piccoli: il totale fino a 60, ogni regione fino a 30.

**Errori tipici.** Ogni errore è una regola sbagliata, come nei capitoli dei
numeri. Nell'elencazione: il `<` letto come `≤` e viceversa, N senza lo zero,
lo zero escluso dai pari. Nelle operazioni: ∪ scambiata con ∩, `B − A` al
posto di `A − B`. Nell'appartenenza: ∈ al posto di ⊂ e viceversa (`{2} ∈ A`,
`2 ⊂ A`), ⊂ fra due insiemi uguali. Nei conti: 2n al posto di 2ⁿ,
card(A) + card(B) per A × B. Nei problemi: l'intersezione contata due volte
(card(A ∪ B) = card(A) + card(B)), la regione esterna dimenticata (la
risposta a "nessuno" è quella di "almeno uno"), "solo A" letto come "almeno
A", con tre insiemi il centro non riaggiunto. Dove la risposta giusta è `∅`,
anche `{0}`, `{∅}` e `0` sono errori tipici: hanno un valore, sbagliato, e
la spiegazione dice che il vuoto non ha elementi, nemmeno lo zero o il vuoto.

**Risposte.** Un insieme si scrive per elencazione, fra graffe, con gli
elementi separati da virgole. L'ordine non conta: imporre l'ordine crescente
insegnerebbe una cosa falsa.

| caso                        | esempio     | esito           | messaggio                               |
| --------------------------- | ----------- | --------------- | --------------------------------------- |
| elementi in un altro ordine | `{5, 1, 3}` | `corretto`      |                                         |
| vuoto scritto con le graffe | `{}`        | `corretto`      |                                         |
| elemento ripetuto           | `{1, 3, 3}` | `da-riscrivere` | Ogni elemento si scrive una volta sola. |
| senza graffe                | `1, 3, 5`   | `da-riscrivere` | Un insieme si scrive fra graffe.        |
| ⊆ dove vale ⊂ o =           | `{1} ⊆ A`   | `da-riscrivere` | È vero, ma c'è un simbolo più preciso.  |
| elemento che non è naturale | `{1, -2}`   | `non-valido`    | Gli elementi sono numeri naturali.      |

Le graffe vengono prima dei doppioni: `1, 3, 3` mostra "Un insieme si scrive
fra graffe." Senza graffe la risposta si legge comunque come un insieme, e
così un numero solo, `3`, vale `{3}`. Dentro le graffe si legge anche `∅`, e
`{∅}` è l'insieme che ha il vuoto come elemento: un valore che nessun
esercizio chiede, quindi sbagliato o errore tipico, mai non valido.

Delle quattro scritture, la risposta è corretta solo se lo sono tutte. Se
qualcuna è sbagliata l'esercizio si giudica dalla prima sbagliata: errore
tipico se una regola del catalogo la spiega, altrimenti sbagliato. Se sono
tutte vere ma qualcuna usa `⊆`, va riscritta. "Verifica" si attiva quando
tutte e quattro hanno un simbolo. Il tentativo salva la risposta come i
quattro simboli nell'ordine degli oggetti, `∈,∉,⊂,=`, e come errore tipico
quello della prima scrittura sbagliata.

La tastierina del capitolo ha le graffe, la virgola e `∅`; le scelte
dell'appartenenza sono tasti a sé.

## Calcolo letterale

I capitoli 6 e 7 portano le lettere nel motore. Le lettere sono minuscole,
una per variabile, al massimo tre in un esercizio, con esponenti naturali. I
coefficienti sono razionali con i limiti di Q. Restano fuori la potenza di un
binomio con il triangolo di Tartaglia, polinomi ordinati, completi e
omogenei, la divisione con resto e la regola di Ruffini, la scomposizione, MCD
e mcm di monomi e di polinomi, le frazioni algebriche. Andranno in un
capitolo successivo, dopo aver deciso come si verifica una scomposizione, che
ha molte forme giuste (2(x − 1)(x + 3), (2x − 2)(x + 3), −2(1 − x)(x + 3)) e
chiede di controllare che ogni fattore sia irriducibile.

**Termini.** Quelli del libro: monomio, coefficiente, parte letterale,
forma normale, grado (complessivo e rispetto a una lettera), monomi simili,
uguali e opposti, polinomio, termini, termine noto. Un numero diverso da
zero è un monomio di grado 0; lo zero è il monomio nullo, senza grado.

**Il dato.** Un monomio in forma normale è un coefficiente razionale e una
mappa da lettera a esponente positivo. Un polinomio in forma normale è una
mappa dalla parte letterale al coefficiente, senza coefficienti nulli. Somma,
prodotto, potenza e quoziente per un monomio sono funzioni pure in `bigint`.
Due polinomi hanno lo stesso valore se hanno la stessa forma normale: il
confronto è esatto, senza valutare in punti a caso. Nei capitoli 6 e 7 il
risultato di una soluzione è un polinomio, e un numero è un polinomio senza
lettere.

**L'albero.** Si aggiunge un nodo, il monomio scritto: un coefficiente,
anche sottinteso, e i fattori lettera ed esponente nell'ordine in cui sono
scritti, ripetizioni comprese. Così `2ab² · 3b³a²` resta com'è per
l'esercizio di forma normale, e la resa scrive `3a²b` senza ×. Il monomio
scritto lega più di × e di :, come sul libro: `4a²b³ : 2b² = 2a²b`, e il
divisore non vuole parentesi. Il coefficiente di un monomio scritto non ha
esponente: una potenza di un numero dentro un'espressione letterale è il `^`
di sempre, `2³ · a`.

Il meno davanti a un monomio scritto è il segno del suo coefficiente: `−3a²`
è il monomio di coefficiente −3, e `−a²` quello di coefficiente −1. Vale
quanto −(a²), perché l'esponente è della sola lettera, e così la regola di
`−3²` non serve; `(−a)²` è invece la potenza di un gruppo. In una somma i
termini si scrivono con + e − fra monomi positivi, come sul libro,
`3a − 2b` e mai `3a + (−2b)`. Fra tonde va solo un monomio negativo che sia
un fattore o una base: `2a² · (−4a⁵b³)`, `(−2a)²`. Il testo semplice scrive i
coefficienti frazionari con la barra e uno spazio, `1/2 ab²`, e KaTeX con la
frazione a due piani.

**Risolutore.** L'ordine è quello dei capitoli dei numeri, esteso. Dentro un
ambito, prima le potenze, poi × e : da sinistra a destra, poi la riduzione
dei termini simili. Un'operazione fra monomi è un passaggio solo, come un
conto fra frazioni in Q: `2a² · 3a³ = 6a⁵` e `(−3a²)³ = −27a⁶` non si aprono
nella proprietà della stessa base o della potenza di potenza, che sono il
modo di fare il conto e le spiega la lezione. Le proprietà delle potenze come
righe a sé restano per le potenze di numeri.

La riduzione mette insieme termini lontani, quindi non è "+ e − da sinistra
a destra": un passaggio per ogni gruppo di simili, con il risultato al posto
del primo termine del gruppo, `3a² + 2b − a² = 2a² + 2b`. Questo passaggio ha
tanti operandi quanti sono i simili del gruppo, `9x + 5x − 10x + x = 5x`, e
il passaggio del motore, che oggi è un'operazione fra due razionali, diventa
un'operazione con i suoi operandi e il suo risultato, monomi compresi.
L'ordine dei termini nella soluzione è quello di prima comparsa, come nei
risultati del libro, e le lettere di un monomio sono in ordine alfabetico.

Un gruppo che non si riduce a un numero perde le parentesi quando il suo
interno è in forma normale, nel giro di + e −. Se è preceduto dal più le
parentesi cadono e basta; se è preceduto dal meno cadono cambiando il segno
di ogni termine, ed è un passaggio con la sua regola,
`5a − (2a − b) = 5a − 2a + b`. Davanti a un monomio, o dentro un prodotto, il
gruppo si moltiplica con la distributiva nel giro di × e :.

Il quaderno segue il libro anche in due righe che non fanno un conto, e solo
in queste due. La sostituzione, in `mono.value`: `2a² + 3a` per a = −2
diventa `2 · (−2)² + 3 · (−2)`. È la riga in cui si mettono le tonde al
negativo, e il suo passaggio porta la lettera e il valore. E la formula del
prodotto notevole: `(2x² + 3y)² = (2x²)² + 2 · 2x² · 3y + (3y)²`, con un
passaggio che porta la formula e i suoi A e B; la riga dopo calcola. In tutte
e due la riga è proprio ciò che l'abilità allena: senza, il quaderno
salterebbe il punto in cui si sbaglia. Le altre righe senza conto che il
libro scrive restano alla lezione, come il minimo comune multiplo in Q. La
riga di raccoglimento `(1/2 − 1)ab²` è il modo di fare il conto
`1/2 ab² − ab²`, e la distributiva va al risultato in un passaggio,
`(x + 3y)(2x − 4y) = 2x² − 4xy + 6xy − 12y²`, senza la riga
`x(2x − 4y) + 3y(2x − 4y)`. Il passaggio della distributiva porta i prodotti
dei termini a due a due, così l'apertura passo per passo li mostra.

Il quoziente fra monomi c'è come monomio solo quando il dividendo ha tutte le
lettere del divisore con esponente maggiore o uguale. Il generatore produce
solo quozienti possibili; il caso "non è un monomio" lo spiega la lezione.

**Generatori.** I coefficienti scritti seguono i limiti di Q: denominatori
fino a 12, frazioni già ridotte. Gli intermedi e il risultato hanno limiti
loro, perché i prodotti notevoli li fanno crescere: coefficienti fino a 60 in
valore assoluto e denominatori fino a 36, esponenti scritti fino a 5 e
intermedi fino a 12, al massimo sei termini, quelli del quadrato di un
trinomio. Nei prodotti notevoli i termini del binomio hanno coefficiente
intero fino a 5, e il generatore scarta il binomio se un coefficiente del
risultato supera 60: `(2x + 3)³` passa, con 36x² e 54x; `(3x + 4)³` no. I
generatori scelgono i numeri in modo che ogni errore tipico dell'abilità
cambi il risultato, come oggi con `shows`.

**Errori tipici.** Riusano quelli delle potenze dove la regola è la stessa:
`(a + b)² = a² + b²`, `a² · a³ = a⁶`, `(a³)² = a⁵`, `−(a − b) = −a − b`,
`(−2a)² = −4a²`. Si aggiungono: sommare anche gli esponenti dei simili
(`2a² + 3a² = 5a⁴`, solo fra simili), sommare monomi non simili sommando i
coefficienti e moltiplicando le parti letterali (`3a + 2b = 5ab`,
`2a² + 3a³ = 5a⁵`), non elevare il coefficiente (`(3a²)² = 3a⁴`), contare
zero il coefficiente sottinteso (`9x + 5x − 10x + x = 4x`), la distributiva
sul primo termine soltanto (`2x(3y + 5x²) = 6xy + 5x²`), il quadrato di una
differenza con il segno sbagliato (`(a − b)² = a² − 2ab − b²`), la somma per
differenza con il più (`(a + b)(a − b) = a² + b²`), il negativo sostituito
senza tonde (a = −2, `a² = −4`). Il confronto avviene fra forme normali.

**Risposte.** Lo studente scrive un polinomio come `3a^2b - 1/2ab^2` o con le
cifre ad apice. Le lettere attaccate si moltiplicano, `ab` è a · b. La barra
ha due letture. Fra due numeri all'inizio di un monomio è la frazione del
coefficiente: `1/2ab²` si legge (1/2)ab². Dopo un monomio, seguita da un
numero, divide il coefficiente: `ab²/2` e `6a/3` sono 1/2 ab² e 2a, e
`ab²/2` è corretto, perché il libro scrive pure così. Una lettera o un gruppo
dopo la barra non fanno un polinomio. L'attaccato lega più di × e di : solo
dentro un monomio scritto; un gruppo attaccato, `2(a + b)` o
`(5/4 a²)(−1/2 a⁴x)²`, è un prodotto allo stesso livello di × e :. L'ordine
dei termini e l'ordine delle lettere in un monomio non sono motivi per
riscrivere: il libro non vincola né l'uno né l'altro.

| caso                         | esempio        | esito           | messaggio                             |
| ---------------------------- | -------------- | --------------- | ------------------------------------- |
| termini in un altro ordine   | `-2b + 3a`     | `corretto`      |                                       |
| lettere in un altro ordine   | `3ba^2`        | `corretto`      |                                       |
| prodotto non svolto          | `2(a + b)`     | `da-riscrivere` | Svolgi i prodotti.                    |
| monomio non in forma normale | `2aab`, `2·3a` | `da-riscrivere` | Scrivi ogni monomio in forma normale. |
| coefficiente 1 scritto       | `1a`, `-1ab`   | `da-riscrivere` | Il coefficiente 1 non si scrive.      |
| esponente 1 scritto          | `a^1b`         | `da-riscrivere` | L'esponente 1 non si scrive.          |
| esponente 0 scritto          | `3a^0`         | `da-riscrivere` | a⁰ vale 1.                            |
| termini simili non ridotti   | `3a + 2a`      | `da-riscrivere` | Somma i monomi simili.                |
| coefficiente non ridotto     | `2/4a`, `0,5a` | `da-riscrivere` | come in Q                             |
| lettera al denominatore      | `a/b`          | `non-valido`    | Non è un polinomio.                   |
| esponente senza `^`          | `a3`           | `non-valido`    | Scrivi l'esponente con ^.             |

Un prodotto di soli numeri e lettere, `2·3a`, è un monomio non in forma
normale e non un prodotto da svolgere: "Svolgi i prodotti" vale per i gruppi.
I motivi si mostrano nell'ordine in cui si corregge: i prodotti, poi la forma
normale di ogni monomio, poi i simili, poi i coefficienti con le regole di Q.
Una risposta in forma non canonica con il valore sbagliato si giudica dal
valore, come sempre.

**Passo passo.** Resta del capitolo 1. La sua regola per le righe
("2 + 3 + 4 non può diventare 2 + 7") non vale con i simili, che si
riducono proprio mettendo insieme termini lontani: per il calcolo letterale
la regola va riscritta, non adattata, e resta fuori da questi capitoli.

## Pratica

**Risultato.** Lo studente vede l'espressione, o il testo del problema o le
scritture da completare, scrive il risultato, riceve
l'esito. Dopo l'esito vede sempre la soluzione per righe; se l'esito è un
errore tipico, vede prima la spiegazione dell'errore. Un pulsante
"suggerimento" mostra la prossima riga e rende il tentativo aiutato.

**Passo passo.** Nelle abilità del capitolo 1 lo studente può scrivere ogni
riga della soluzione, con l'interruttore "Passo passo" nel pannello "Prova
tu". Una riga va bene quando si ottiene dalla precedente sostituendo uno o
più conti, i cui operandi sono già numeri, con il loro risultato, nell'ordine
delle operazioni: 2 × 3 + 4 × 5 può diventare 2 × 3 + 20, ma 2 + 3 + 4 non può
diventare 2 + 7 e 2 + 3 × 1 non può diventare 5 × 1. Il tipo di parentesi non
conta. Una riga rifiutata dice se l'ordine o il valore è sbagliato e quale
conto controllare, resta da scrivere e rende il tentativo aiutato. Oltre alla
riga intera si può scrivere un conto solo, come 3 × 7 = 21 o 3*7=21: diventa
il risultato scritto la prima occorrenza del conto dove il passaggio è
possibile. Un numero fra parentesi, (72), vale come il numero: le parentesi
cadono e non bloccano il conto successivo. Una riga che si legge come un
numero, anche fra parentesi, è la risposta finale e va alla verifica così
com'è stata scritta; lo stesso vale per il risultato del conto che chiude
l'espressione, come 2 + 12 = 14.

Sul telefono si può anche toccare un operatore della riga corrente: il conto si
accende e il campo chiede solo il suo risultato, 3 × 7 = ▢. La pagina non deve
risolvere l'esercizio al posto dello studente, e da qui vengono due regole.
Ogni operatore si tocca, anche quelli i cui operandi non sono ancora numeri: se
in 2 + 3 × 4 si potesse toccare solo ×, la pagina svelerebbe l'ordine delle
operazioni, cioè proprio ciò che il capitolo 1 allena. E l'evidenziazione segue
quello che lo studente vede, non l'albero: toccando + in 2 + 3 × 4 si accende
2 + 3, l'operatore col numero o il gruppo scritto a ciascun lato, e non
2 + (3 × 4). L'ordine si giudica alla verifica, non al tocco: una riga, un
giudizio, come per una riga scritta, e una riga rifiutata si comporta come
sempre. Il tocco porta la posizione dell'operatore, non il suo testo: fra due
copie uguali, come in 2 × 3 + (2 × 3 + 1), il conto va proprio dove si è
toccato. Ogni conto toccato dà una riga. Toccare di nuovo l'operatore, o
premere Esc, spegne la scelta. Cambiare o spegnere la scelta svuota il campo:
quello scritto era il risultato di un altro conto. Con un operatore acceso il
campo legge come risultato solo un numero, e ogni altra cosa come una riga
scritta. Il tocco è
una scorciatoia: la formula non si raggiunge da tastiera né da lettore di
schermo, e scrivere resta la strada completa.

Il suggerimento scrive il prossimo passo della riga dello
studente, tranne quello che dà il risultato. L'interruttore ricorda la sua
ultima posizione sul dispositivo, nella pratica libera e nella sessione: il
prossimo esercizio del capitolo 1 si apre come lo studente l'ha lasciato, e la
scelta resta fuori dai progressi e dal backup.

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
lingue diverse dall'italiano. La logica (connettivi, quantificatori), che i
libri mettono accanto agli insiemi ma i programmi del biennio non chiedono.
Scomposizione, divisione fra polinomi e frazioni algebriche, finché non c'è
una verifica per la scomposizione (vedi [Calcolo letterale](#calcolo-letterale)).
