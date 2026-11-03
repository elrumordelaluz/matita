# Monomi e polinomi: ricerca per i capitoli 6 e 7

Ricerca del 2026-11-03 per la sezione di `SPEC.md` sul calcolo letterale.
Convenzione: **[Fn]** rimanda alle fonti in fondo; _(inferenza)_ segna una
conclusione mia, non scritta in una fonte. Dove una fonte non si è potuta
leggere lo dico.

## 1. Curricolo e posizione nei libri

**Licei.** Le Indicazioni nazionali del liceo scientifico, primo biennio,
"Aritmetica e algebra", dicono che il biennio "sarà dedicato al passaggio dal
calcolo aritmetico a quello algebrico" e poi: "Lo studente apprenderà gli
elementi di base del calcolo letterale, le proprietà dei polinomi e le
operazioni tra di essi. Saprà fattorizzare semplici polinomi, saprà eseguire
semplici casi di divisione con resto fra due polinomi, e ne approfondirà
l'analogia con la divisione fra numeri interi. Anche in questo l'acquisizione
della capacità calcolistica non comporterà tecnicismi eccessivi." Segue l'uso
delle espressioni letterali per rappresentare problemi (equazioni,
disequazioni, sistemi) e dimostrare risultati generali in aritmetica **[F1]**,
p. 335. Per i licei non scientifici il testo dice "le più semplici operazioni
tra di essi" **[F3]**. Le Indicazioni non citano per nome i prodotti notevoli,
Ruffini o le frazioni algebriche.

**Tecnici.** Le Linee guida del primo biennio (Direttiva 57/2010, settore
tecnologico) hanno fra le conoscenze "Le espressioni letterali e i polinomi.
Operazioni con i polinomi." e fra le abilità "Padroneggiare l'uso della
lettera come mero simbolo e come variabile; eseguire le operazioni con i
polinomi; fattorizzare un polinomio." **[F2]**, p. 71.

**Bergamini, Barozzi, Trifone, Matematica.blu 3ª ed. (Zanichelli 2022),
vol. 1** **[F4]**: 1 naturali, 2 interi, 3 razionali (le potenze stanno dentro
i capitoli dei numeri: proprietà nel cap. 1, potenze di interi nel cap. 2,
esponente negativo nel cap. 3), 4 insiemi e logica, 5 relazioni e funzioni,
**6 I monomi**, **7 I polinomi** (operazioni, prodotti notevoli, potenze di
binomi, divisione anche con Ruffini), **8 La scomposizione in fattori**
(raccoglimento, trinomio speciale, prodotti notevoli, Ruffini, MCD e mcm di
polinomi), **9 Le frazioni algebriche**, 10 equazioni lineari. Quindi quattro
capitoli. Già il cap. 1 ha fra le abilità "Sostituire alle lettere i numeri e
risolvere espressioni letterali": il valore numerico arriva prima dei monomi.

**Bergamini, Barozzi, Matematica multimediale.rosso 2ª ed.**: cap. 5 Polinomi
con i prodotti notevoli dentro **[F7]**, cap. 8 "Divisione e scomposizione di
polinomi" con divisione in colonna, Ruffini, metodi di scomposizione e MCD/mcm
di polinomi **[F8]**. Divisione e scomposizione stanno insieme.

**Sasso, Zanone, Colori della matematica, ed. Blu, vol. 1 (Petrini).** Da un
programma svolto di 2ª liceo scientifico **[F9]**: "Richiami sui monomi", poi
polinomi (forma normale, grado, completo/ordinato/omogeneo, valore, zero),
operazioni, prodotti notevoli (somma per differenza, quadrato di binomio e di
trinomio, cubo di binomio, Tartaglia e potenza n-esima), divisione (per un
monomio, in colonna, Ruffini, teorema del resto e di Ruffini), scomposizione,
MCD e mcm di polinomi, frazioni algebriche. I monomi stanno in 1ª, il resto a
inizio 2ª in quella scuola. I numeri di capitolo del libro non li ho
verificati.

**Re Fraschini–Grazzi (Atlas) e Dodero (Ghisetti e Corvi)**: indici non
trovati online. Non li cito.

_(inferenza)_ La sequenza è la stessa ovunque: monomi, polinomi con prodotti
notevoli, divisione e Ruffini, scomposizione, frazioni algebriche. Cambia solo
dove si taglia il capitolo. Per matita il capitolo 4 (potenze) è il
prerequisito naturale: le operazioni con i monomi sono proprietà delle
potenze applicate alla parte letterale.

## 2. Contenuti e terminologia, nell'ordine del libro

Dal capitolo 6 "I monomi" di Bergamini-Barozzi-Trifone **[F5]** (le stesse
definizioni nell'edizione 2023 **[F6]**):

- **Monomio**: "un'espressione letterale in cui compaiono soltanto
  moltiplicazioni fra numeri e potenze di lettere con numeri naturali per
  esponenti". Ogni numero è un monomio; 0 è il **monomio nullo**.
- **Forma normale**: "prodotto fra un solo fattore numerico e una o più
  lettere, diverse fra loro, con eventuali esponenti" **[F6]**. Non in forma
  normale: 6a³ab, 12a²b³(−2)a³. La riduzione usa commutativa, associativa e
  aᵐ·aⁿ = aᵐ⁺ⁿ: 2ab²·3b³a² = 6a³b⁵.
- **Coefficiente** e **parte letterale**. "Se il coefficiente di un monomio è
  uguale a 1 o a −1, il numero 1 non si scrive e viene sottinteso."
- **Grado rispetto a una lettera**: l'esponente della lettera. **Grado
  (complessivo)**: la somma dei gradi rispetto a tutte le lettere. Un numero ha
  grado 0; "al monomio nullo non si attribuisce alcun grado".
- **Simili**: stessa parte letterale. **Opposti**: simili con coefficienti
  opposti. **Uguali**: stesso coefficiente e stessa parte letterale (esercizi
  "stabilisci quali sono opposti e quali sono uguali").
- **Somma algebrica**: è un monomio solo fra monomi simili; si raccoglie la
  parte letterale, (4 + 6 − 8)a²b = 2a²b. La differenza è la somma con
  l'opposto.
- **Prodotto**: prodotto dei coefficienti, esponenti sommati lettera per
  lettera. Sempre un monomio.
- **Potenza**: si eleva il coefficiente e si moltiplica ogni esponente per n,
  (−3/2 a²b⁵)³ = −27/8 a⁶b¹⁵. Esponente 0 dà 1, esponente 1 il monomio stesso.
- **Quoziente**: esiste come monomio solo se il dividendo contiene tutte le
  lettere del divisore con esponente maggiore o uguale; 4a²b³ : 2b⁵ = 2a²b⁻²
  "non è un monomio". Gli esercizi dicono "Esegui, quando è possibile". Per un
  numero diverso da 0 si divide sempre.
- **MCD e mcm**: coefficiente uguale a MCD/mcm dei valori assoluti se i
  coefficienti sono tutti interi, altrimenti 1; parte letterale con le lettere
  comuni all'esponente minimo (MCD) o tutte le lettere all'esponente massimo
  (mcm).

Polinomi **[F7]**, **[F9]**, **[F10]**:

- **Polinomio**: somma algebrica di monomi, i suoi **termini**; binomio,
  trinomio, quadrinomio. **Termine noto**: il termine di grado 0.
- **Forma normale**: nessun termine simile e ogni termine in forma normale.
  La mappa Zanichelli mostra 7y³ + 2yay + 2y³ + 2 come non in forma normale per
  due motivi, un monomio non ridotto e due monomi simili **[F7]**.
- **Grado**: "il maggiore tra i gradi dei termini" **[F7]**, complessivo o
  rispetto a una lettera **[F9]**.
- **Ordinato** secondo le potenze crescenti o decrescenti di una lettera,
  **completo** se ha tutte le potenze di quella lettera dalla massima fino a
  0, **omogeneo** se i termini hanno tutti lo stesso grado **[F9]**, **[F10]**.
- **Operazioni**: somma algebrica, monomio per polinomio, polinomio per
  polinomio **[F7]**. Valore di un polinomio, P(−2), e zero **[F7]**, **[F9]**.
- **Prodotti notevoli** **[F7]**: (A + B)² = A² + 2AB + B²;
  (A + B)(A − B) = A² − B²; (A + B)³ = A³ + 3A²B + 3AB² + B³;
  (A + B + C)² = A² + B² + C² + 2AB + 2AC + 2BC. Più Tartaglia e potenza
  n-esima **[F9]**.
- **Divisione**: per un monomio; fra polinomi in colonna con A = B·Q + R;
  regola di Ruffini per divisori x − a, con la tabella dei coefficienti;
  teorema del resto **[F8]**, **[F9]**.

### Come il libro scrive un risultato

Osservato nei risultati stampati di **[F5]** e **[F7]**:

- Coefficiente davanti, poi le lettere **in ordine alfabetico**: 6a⁸bc²,
  −3xz⁴, 6xy² + 10x³y. Nessuna definizione lo impone; è la prassi tipografica.
- Coefficiente frazionario come frazione a due piani davanti alle lettere,
  −3/4 xy, 5/2 a. Il segno sta davanti alla frazione.
- Decimali nel testo, frazioni nel risultato: 3/4 b³ − 0,2b³ − 1,5b³ + 1/5 b³
  ha risultato −3/4 b³ (es. 43 **[F5]**).
- 1 e −1 sottintesi; esponente 1 non scritto.
- **Ordine dei termini non fisso.** Nelle somme di monomi i risultati
  seguono l'ordine di prima comparsa: −1/4 a + 2b² + … dà −3/4 a + 7/3 b²
  (es. 44), e l'esercizio guida 199 chiude con 8ab³ − 18ab² + 5/2 a. Con
  polinomi già ordinati il risultato esce per grado decrescente,
  x³ + 3x² − 2x − 1. Il quadrato di trinomio esce nell'ordine della formula,
  4x² + y² + 25 − 4xy + 20x − 10y **[F7]**. "Ordinare un polinomio" è un
  esercizio a sé, non un vincolo sulla risposta.

## 3. Esercizi tipici e righe del quaderno

Tutti con risposta unica e controllabile. Gli esempi vengono da **[F5]** e
**[F7]**; i risultati sono quelli del libro, e li ho ricontrollati.

| tipo                       | esercizio                             | risultato                       |
| -------------------------- | ------------------------------------- | ------------------------------- |
| somma di simili (es. 40)   | 9x + 5x − 10x + x                     | 5x                              |
| prodotto (es. 69)          | 2a² · (−4a⁵b³); −4xy³ · 1/2 x³y²      | −8a⁷b³; −2x⁴y⁵                  |
| potenza (es. 123)          | (−3a³)²; (−3a²)³; −(−3a³)³            | 9a⁶; −27a⁶; 27a⁹                |
| quoziente (es. 177)        | −24a⁷ : 6a³; 3ab : 4b; 10a³b : 2a⁴    | −4a⁴; 3/4 a; non possibile      |
| MCD e mcm (teoria, par. 3) | 3/2 x⁴y²c, x⁶y, 5x³y³c⁴               | MCD x³y, mcm x⁶y³c⁴             |
| somma di polinomi          | (4y³ + 3y + 5) − (2y³ + 2y² + 2y − 2) | 2y³ − 2y² + y + 7               |
| monomio per polinomio      | 2xy(3y + 5x²)                         | 6xy² + 10x³y                    |
| polinomio per polinomio    | (x + 3y)(2x − 4y)                     | 2x² + 2xy − 12y²                |
| quadrato di binomio        | (2x² + 3y)²                           | 4x⁴ + 12x²y + 9y²               |
| somma per differenza; cubo | (3x + 2y)(3x − 2y); (x + 2)³          | 9x² − 4y²; x³ + 6x² + 12x + 8   |
| quadrato di trinomio       | (2x − y + 5)²                         | 4x² + y² + 25 − 4xy + 20x − 10y |
| valore numerico            | P(x) = 2x² + 3x + 1 in −2, 3, −1      | 3; 28; 0 (−1 è uno zero)        |

**Espressione con monomi, esercizio guida 159 [F5].** Il libro scrive le
righe così:

```
(−1/2 a⁶x³)² + (5/4 a²)(−1/2 a⁴x)²(−2a²x⁴) − (−3/2 a⁴x²)³ =
"In ciascun termine eseguiamo innanzitutto l'elevamento a potenza":
= +1/4 a¹²x⁶ + (5/4 a²)(+1/4 a⁸x²)(−2a²x⁴) − (−27/8 a¹²x⁶) =
"Proseguiamo come in una normale espressione con moltiplicazioni di monomi":
= +1/4 a¹²x⁶ − 5/8 a¹²x⁶ + 27/8 a¹²x⁶ =
= (1/4 − 5/8 + 27/8) a¹²x⁶ = 24/8 a¹²x⁶ = 3a¹²x⁶
```

**Esercizio guida 199 [F5]**, con divisioni: (3a²b²)² : 3a³b − 2a(3b)² +
5a²b⁴ : 2ab⁴ + 5bab², poi 9a⁴b⁴ : 3a³b − 2a·9b² + 5/2 a + 5ab³, poi
3ab³ − 18ab² + 5/2 a + 5ab³, poi 8ab³ − 18ab² + 5/2 a. Ogni termine si svolge
per conto suo (potenze, poi × e :), poi si riducono i simili.

**Esercizio guida 95 [F5]**: (3/8 ab)(−4/3 a)(−6b) + b²(1/2 a) − ab². Una riga
calcola il segno e il prodotto dei coefficienti, +(3/8·4/3·6)a²b²; poi
3a²b² + 1/2 ab² − ab²; poi la riga di raccoglimento 3a²b² + (1/2 − 1)ab²;
infine 3a²b² − 1/2 ab². L'esercizio guida 68 dà la regola mentale del prodotto
in tre tempi: il segno, poi i valori assoluti dei coefficienti, poi gli
esponenti sommati.

**Polinomi [F7].** (x + 3y)(2x − 4y) = x·(2x − 4y) + 3y·(2x − 4y) =
2x² − 4xy + 6xy − 12y² = 2x² + 2xy − 12y². Il prodotto notevole ha una riga
per la formula applicata: (2x² + 3y)² = (2x²)² + 2·2x²·3y + (3y)² =
4x⁴ + 12x²y + 9y².

_(inferenza)_ L'ordine del quaderno è quello del capitolo 4, esteso: gruppo
più interno; dentro, potenze di monomi, poi × e : termine per termine, poi la
riduzione dei simili. Due differenze però. La riduzione mette insieme termini
non vicini (il libro li sottolinea "in modo diverso"), quindi non è "+ e − da
sinistra a destra". E fra le righe ce ne sono alcune senza conto, la formula
applicata e il raccoglimento (1/2 − 1)ab², che oggi la SPEC non ammette ("il
risolutore ne ha solo con il conto").

## 4. Errori tipici

| errore                                 | regola sbagliata                                         | fonte                                                                                                            |
| -------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| (a + b)² = a² + b²; (a + b)³ = a³ + b³ | la potenza si distribuisce sulla somma                   | Matz 1982 "linear extrapolation" **[F11]**; Kirshner e Awtry 2004 **[F12]**; già in catalogo come `power-of-sum` |
| 3a + 2b = 5ab                          | si sommano i coefficienti e si giustappongono le lettere | errore di "conjoining", Booth 1984/1988 **[F13]**; _esempio esatto non verificato_                               |
| 2a² + 3a² = 5a⁴                        | nella somma di simili si sommano anche gli esponenti     | _(inferenza)_; il libro insiste "stessa parte letterale" **[F5]**                                                |
| 2a² + 3a³ = 5a⁵                        | si sommano monomi non simili                             | [F5] es. 32: "la somma di due monomi di primo grado non sempre è un monomio di primo grado"                      |
| a²·a³ = a⁶                             | nel prodotto si moltiplicano gli esponenti               | già in catalogo, `same-base-multiplies-exponents`                                                                |
| (a³)² = a⁵                             | potenza di potenza con la somma                          | già in catalogo, `power-of-power-adds-exponents`                                                                 |
| (3a²)² = 3a⁴                           | il coefficiente non si eleva                             | [F5]: "eleviamo a esponente n il suo coefficiente"; l'errore è _(inferenza)_                                     |
| (−2a)² = −4a²; (−3a²)³ = 27a⁶          | il segno del coefficiente nella potenza                  | [F5] es. 123: "è importante fare attenzione al segno", con quattro esempi                                        |
| −(a − b) = −a − b                      | meno davanti alla parentesi senza cambiare i segni       | già in catalogo, `minus-group-signs-kept`                                                                        |
| 9x + 5x − 10x + x = 4x                 | il coefficiente sottinteso 1 vale 0                      | [F5] es. 39: "attenzione a non dimenticare il coefficiente −1"                                                   |
| 2x(3y + 5x²) = 6xy + 5x²               | la distributiva solo sul primo termine                   | Booth 1988, distributiva non applicata **[F13]**                                                                 |
| (a − b)² = a² − 2ab − b² o a² − b²     | segno del secondo quadrato, doppio prodotto dimenticato  | _(inferenza)_; fonti didattiche online, nessuna ricerca trovata                                                  |
| (a + b)(a − b) = a² + b²               | segno nella somma per differenza                         | _(inferenza)_                                                                                                    |
| MCD con gli esponenti massimi          | MCD e mcm scambiati                                      | _(inferenza)_                                                                                                    |
| a = −2, a² = −4                        | sostituire un negativo senza parentesi                   | _(inferenza)_; è `minus-taken-into-power` dopo la sostituzione                                                   |

Orlandoni e Paola (INVALSI) scrivono che il linguaggio dell'algebra "pone
molti problemi a tanti studenti, come testimoniano i risultati delle prove
INVALSI" e notano le criticità della definizione: "2 è un monomio? x è un
polinomio?" **[F3]**. Percentuali item per item su quesiti di monomi e
polinomi non ne ho trovate: andrebbero cercate in Gestinv.

Kirshner e Awtry spiegano (a + b)² = a² + b² con la salienza visiva: lo
studente reagisce alla forma della notazione e non al contenuto della regola
**[F12]**. _(inferenza)_ È un argomento per spiegare l'errore con un
controesempio numerico, a = 1, b = 2: 9 contro 5. Il motore lo può calcolare.

## 5. Fattibilità nel motore

_(tutta inferenza, da `expression.ts`, `solver.ts`, `power.ts`, `verify.ts`)_

**Il dato.** Un `Monomial` è `{ coefficient: Rational, letters: Map<string,
bigint> }` con esponenti positivi; un `Polynomial` è una mappa chiave della
parte letterale (lettere in ordine alfabetico con esponenti, `a2b1`) →
coefficiente diverso da zero. Somma, prodotto, potenza intera non negativa,
quoziente per monomio (con "non possibile" se un esponente esce negativo),
grado, MCD e mcm sono funzioni pure di poche righe, tutte in `bigint`. Due
polinomi hanno lo stesso valore se hanno la stessa forma normale: il confronto
è esatto, senza valutazioni in punti a caso.

**L'albero.** Serve una foglia nuova, la lettera. Il monomio scritto conviene
che sia un nodo a sé, coefficiente più fattori lettera/esponente nell'ordine
scritto, ripetizioni comprese: così 2ab²·3b³a² resta com'è per l'esercizio
"riduci a forma normale", e la resa scrive 3a²b senza ×. La base di `^` oggi è
un numero o un gruppo; deve accettare la lettera e il monomio fra parentesi,
(−2a)², mentre −a² segue la regola di −3². `Solution.result` passa da
`Rational` a `Polynomial`, e un numero è il polinomio di grado 0.

**Precedenza della giustapposizione.** Il libro scrive 4a²b³ : 2b² = 2a²b e
6a⁵b⁴ : 5a³b = 6/5 a²b³ **[F5]**: il monomio scritto attaccato è un blocco
unico, lega più di × e di :. Con le regole di oggi, sinistra a destra,
4a²b³ : 2 · b² darebbe 2a²b⁵. Parser e resa devono trattare la
giustapposizione come un livello sopra × e :, e il divisore che è un monomio
non vuole parentesi.

**Lettura della risposta.** `3a^2b - 1/2ab^2`: cifre, poi lettere singole
minuscole (ab è a·b), `^` con un intero o le cifre ad apice, meno ASCII o
Unicode. 1/2ab² si legge (1/2)ab², perché una lettera al denominatore non fa
un monomio. ab²/2 si legge come lo stesso monomio, perché il libro scrive anche
ax²/9 **[F5]**. a/b, una lettera con esponente negativo o una radice danno
`non-valido`, con il messaggio "Non è un polinomio". a3 è `non-valido`, "Scrivi
l'esponente con ^", perché non si capisce se è a·3 o a³.

**Forma canonica.** Proposta di motivi `da-riscrivere`, sul modello di
"Riduci ai minimi termini":

| caso                                | esempio        | messaggio                                |
| ----------------------------------- | -------------- | ---------------------------------------- |
| termini simili non ridotti          | `3a + 2a`      | Somma i monomi simili.                   |
| lettera ripetuta in un monomio      | `2aab`         | Scrivi il monomio in forma normale.      |
| più fattori numerici                | `2·3a`         | Scrivi il monomio in forma normale.      |
| coefficiente 1 scritto              | `1a`, `-1ab`   | Il coefficiente 1 non si scrive.         |
| esponente 1 o 0 scritto             | `a^1b`, `a^0`  | L'esponente 1 non si scrive / a⁰ vale 1. |
| prodotto o potenza non svolti       | `2(a + b)`     | Svolgi i prodotti.                       |
| coefficiente non ridotto o decimale | `2/4a`, `0,5a` | come in Q                                |

L'ordine dei termini e l'ordine delle lettere dentro un monomio non sono
motivi di riscrittura: i libri non vincolano il primo (sezione 2), e la
definizione di forma normale non vincola il secondo. Le soluzioni però
scrivono sempre le lettere in ordine alfabetico e i termini in un ordine
stabile, quello di prima comparsa, che è quello dei risultati del libro.

**Errori tipici come regola sbagliata.** Funziona come oggi: si rifà la
soluzione con una regola guasta (somma dei simili che somma gli esponenti,
potenza che distribuisce, prodotto senza doppio prodotto) e si confronta la
forma normale con la risposta. I numeri delle prove vanno scelti in modo che
ogni errore cambi il risultato, come fa oggi il generatore. Con i polinomi le
collisioni fra errori diversi sono più rare che con i numeri, perché una
risposta sbagliata ha più termini da far coincidere.

**Passo passo.** La regola del capitolo 1 ("2 + 3 + 4 non può diventare
2 + 7") non vale più, perché ridurre i simili è proprio mettere insieme
termini lontani. Una riga va bene se ha la stessa forma normale della
precedente e chiude almeno un conto: va riscritta la regola, non adattata.

**Cosa entra nel modello "un esercizio, una risposta".**

| tipo                                            | adatto      | motivo                                                                                                                                         |
| ----------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| valore numerico                                 | sì          | dopo la sostituzione è un'espressione del capitolo 4, risolutore già pronto                                                                    |
| grado complessivo o rispetto a una lettera      | sì          | risposta intera                                                                                                                                |
| forma normale di un monomio                     | sì          | risposta monomio                                                                                                                               |
| operazioni ed espressioni con monomi            | sì          | righe come gli esercizi guida 95, 159 e 199                                                                                                    |
| MCD e mcm di monomi                             | sì          | risposta monomio, coefficiente positivo                                                                                                        |
| somme e prodotti di polinomi, prodotti notevoli | sì          | risposta polinomio in forma normale                                                                                                            |
| polinomio diviso monomio                        | sì          | quando è esatta                                                                                                                                |
| ordinato, completo, omogeneo                    | debole      | vero/falso o "ordina", poco calcolo                                                                                                            |
| divisione con resto, Ruffini                    | no, per ora | due risposte (Q e R) e una tabella al posto delle righe                                                                                        |
| scomposizione                                   | no, per ora | molte forme giuste: 2(x − 1)(x + 3), (2x − 2)(x + 3), −2(1 − x)(x + 3); la verifica deve controllare prodotto e irriducibilità di ogni fattore |
| frazioni algebriche                             | no          | richiedono la scomposizione e le condizioni di esistenza                                                                                       |

## 6. Raccomandazione

_(inferenza)_ Due capitoli, nell'ordine dei libri, e il resto fuori scopo.

**Capitolo 5, Monomi.** Lettere solo minuscole, al massimo tre per
esercizio, coefficienti in Q con i limiti attuali di Q.

| id                 | abilità                                     | prerequisiti                                     |
| ------------------ | ------------------------------------------- | ------------------------------------------------ |
| `mono.value`       | valore numerico di un'espressione letterale | `pow.basics`, `q.order`                          |
| `mono.normal-form` | forma normale, coefficiente, grado          | `pow.properties`, `q.mul-div`                    |
| `mono.add-sub`     | somma algebrica di monomi, simili e non     | `mono.normal-form`, `q.add-sub`, `z.minus-group` |
| `mono.mul-div`     | prodotto e quoziente di monomi              | `mono.normal-form`                               |
| `mono.power`       | potenza di un monomio, con il segno         | `mono.mul-div`                                   |
| `mono.expressions` | espressioni con monomi                      | `mono.add-sub`, `mono.power`, `q.brackets`       |
| `mono.gcd-lcm`     | MCD e mcm di monomi                         | `mono.normal-form`                               |

`mono.value` sta in testa perché Bergamini lo mette già nel capitolo dei
naturali **[F4]** e perché riusa il motore così com'è. `mono.gcd-lcm` può
slittare: serve davvero solo alle frazioni algebriche.

**Capitolo 6, Polinomi.**

| id                  | abilità                                                   | prerequisiti                                             |
| ------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `poly.add-sub`      | somma algebrica di polinomi, parentesi precedute dal meno | `mono.add-sub`                                           |
| `poly.mono-times`   | monomio per polinomio e polinomio diviso monomio          | `poly.add-sub`, `mono.mul-div`                           |
| `poly.times`        | polinomio per polinomio                                   | `poly.mono-times`                                        |
| `poly.square`       | quadrato di binomio                                       | `poly.times`, `mono.power`                               |
| `poly.sum-diff`     | somma per differenza                                      | `poly.times`                                             |
| `poly.more-notable` | quadrato di trinomio, cubo di binomio                     | `poly.square`                                            |
| `poly.expressions`  | espressioni con polinomi e prodotti notevoli              | `poly.sum-diff`, `poly.more-notable`, `mono.expressions` |

Tartaglia e potenza n-esima, ordinato/completo/omogeneo, divisione con resto,
Ruffini e scomposizione vanno a un capitolo 7, dopo aver deciso come si
verifica una scomposizione. Prima di scrivere la SPEC vanno decise due cose:
se il quaderno ammette righe senza conto (la formula applicata e il
raccoglimento dei coefficienti), e la regola delle righe del passo passo per
le riduzioni non adiacenti.

## Fonti

- **[F1]** Indicazioni nazionali per i licei, D.M. 211/2010, liceo
  scientifico opzione scienze applicate, Matematica, primo biennio, G.U.
  Suppl. ord. n. 275, serie generale n. 291, 14-12-2010, p. 335.
  <https://umi.dm.unibo.it/wp-content/uploads/2013/10/5_1_scienze_applicate.pdf>
  (lo stesso paragrafo vale per il liceo scientifico tradizionale).
- **[F2]** Linee guida per il primo biennio degli istituti tecnici, Direttiva
  MIUR n. 57 del 15-7-2010, settore tecnologico, Matematica, G.U. Suppl. ord.
  n. 222, 22-9-2010, p. 71.
  <https://umi.dm.unibo.it/wp-content/uploads/2013/10/I_2_IT_Settore_tecnologico.pdf>
- **[F3]** A. Orlandoni, D. Paola, "Avvio al calcolo letterale nel primo
  biennio di scuola secondaria di secondo grado. Dall'aritmetica all'algebra",
  slide INVALSIopen, 2021.
  <https://www.invalsiopen.it/wp-content/uploads/2021/10/Secondaria-II-grado-Avvio-al-calcolo-letterale-nel-primo-biennio.-DallAritmetica-allAlgebra.pdf>
- **[F4]** M. Bergamini, G. Barozzi, A. Trifone, Matematica.blu 3ª ed.,
  Zanichelli 2022, "Programmazione per competenze", vol. 1.
  <https://online.scuola.zanichelli.it/bergaminiblu3ed/bergaminiblu3ed-matematica-biennio/i-tuoi-contenuti/contenuti-demo-1be85b/download/media-bergamini-programmazione-competenze-99991-vol1/bergamini_programmazione_competenze_99991_vol1.pdf>
- **[F5]** Bergamini, Barozzi, Trifone, capitolo 6 "I monomi", teoria ed
  esercizi pp. 268–299, estratto dal catalogo Zanichelli (file del 2019; il
  nome del file porta l'ISBN 9788808707338, titolo del volume non
  verificato). <https://staticmy.zanichelli.it/catalogo/assets/9788808707338_04_CAP.pdf>
- **[F6]** Lo stesso capitolo in un'edizione successiva (file del 2023, ISBN
  9788808953988 nel nome), p. 273.
  <https://staticmy.zanichelli.it/catalogo/assets/9788808953988_04_CAP.pdf>
- **[F7]** Bergamini, Barozzi, Matematica multimediale.rosso 2ª ed.,
  Zanichelli, mappa del cap. 5 "Polinomi".
  <https://online.scuola.zanichelli.it/matematicamultimedialerosso-files/Mappe/capitoli/bergamini_mappa_84182_c05.pdf>
- **[F8]** Idem, mappa del cap. 8 "Divisione e scomposizione di polinomi".
  <https://online.scuola.zanichelli.it/matematicamultimedialerosso-files/Mappe/capitoli/bergamini_mappa_84182_c08.pdf>
- **[F9]** Liceo "T. Gullace Talotta", programma svolto di Matematica, classe
  2Cs, a.s. 2023-24, su Sasso, Zanone, Colori della matematica, ed. Blu,
  vol. 1, Petrini.
  <https://liceogullace.edu.it/wp-content/uploads/2024/06/Matematica-2Cs-2023-24.pdf>
- **[F10]** Sapere.it (De Agostini), "Polinomi: definizione e riduzione a
  forma normale": fonte secondaria, solo per le definizioni di ordinato e
  omogeneo, coerenti con [F9].
  <https://sapere.virgilio.it/scuola/superiori/matematica-algebra/monomi-e-polinomi/polinomi-definizione-riduzione-forma-normale>
- **[F11]** M. Matz, "Towards a process model for high school algebra
  errors", in D. Sleeman, J. S. Brown (a cura di), Intelligent Tutoring
  Systems, Academic Press 1982, pp. 25–50. Letto solo attraverso fonti
  secondarie, per esempio <https://journals.uco.es/mes/article/view/12836>.
- **[F12]** D. Kirshner, T. Awtry, "Visual salience of algebraic
  transformations", Journal for Research in Mathematics Education 35(4),
  2004, pp. 224–257. Letto l'abstract.
  <https://www.nctm.org/Publications/journal-for-research-in-mathematics-education/2004/Vol35/Issue4/Visual-Salience-of-Algebraic-Transformations/>
- **[F13]** L. R. Booth, Algebra: Children's Strategies and Errors,
  NFER-Nelson 1984; L. R. Booth, "Children's difficulties in beginning
  algebra", in A. F. Coxford (a cura di), The Ideas of Algebra, K–12, NCTM
  1988 Yearbook, pp. 20–32. Citazioni verificate, testi non letti.

Non trovati o non letti: gli indici di Re Fraschini–Grazzi (Atlas) e di
Dodero (Ghisetti e Corvi), le percentuali INVALSI per singolo quesito su
monomi e polinomi, il testo integrale di Matz e di Kirshner–Awtry.
