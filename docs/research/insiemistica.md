# Insiemistica: ricerca per il capitolo

Ricerca per una sezione di `SPEC.md` su un capitolo di insiemistica con lezioni e
problemi. Ogni affermazione porta la sua fonte fra parentesi quadre ([S1] ecc.,
elenco in fondo). Le parti segnate **Inferenza** sono ragionamenti miei sul
progetto, non fatti verificati.

Una premessa sulle fonti. I libri commerciali (Bergamini-Barozzi-Trifone,
Sasso, Re Fraschini, Dodero) non si leggono online. Per i libri Zanichelli e
Petrini ho verificato solo l'ordine dei capitoli e l'elenco degli argomenti,
attraverso i programmi svolti pubblicati dalle scuole [S5]. Testo, notazione
ed esercizi vengono da _Matematica C3 Algebra 1_ [S4], un libro di testo per il
primo anno con licenza CC BY e adottato nelle scuole. Re Fraschini e Dodero non
li ho trovati né nei programmi né nei cataloghi online: su di loro questa nota
non dice nulla.

## 1. Cosa chiedono i programmi ministeriali

**Licei.** Le Indicazioni nazionali (D.I. 211/2010) mettono gli insiemi nel
tema "Relazioni e funzioni" del primo biennio, con la stessa frase per tutti i
licei, scientifico compreso: "Obiettivo di studio sarà il linguaggio degli
insiemi e delle funzioni (dominio, composizione, inversa, ecc.), anche per
costruire semplici rappresentazioni di fenomeni e come primo passo
all'introduzione del concetto di modello matematico" [S1, liceo scientifico,
p. 339 del PDF INDIRE; frase identica nella sezione del liceo artistico a p. 23
e in quelle degli altri licei]. Non c'è un elenco di operazioni, non c'è
la parola "Eulero-Venn" e nella matematica del primo biennio non compare la
logica: ho cercato "logica", "connettivi" e "quantificatori" in tutto il
testo, e nelle sezioni di matematica non ci sono. La logica dei libri di testo
è quindi una scelta degli autori, non un obbligo del programma. L'"Aritmetica e
algebra" dello stesso biennio parla di calcolo con interi e razionali, di MCD
con l'algoritmo euclideo, di reali e di polinomi, e non nomina gli insiemi
[S1, p. 338].

**Tecnici e professionali.** Le Linee guida del primo biennio (Direttiva
57/2010 per i tecnici, Direttiva 65/2010 per i professionali, G.U. S.O. n. 222
del 22-9-2010) hanno la stessa voce fra le conoscenze di "Relazioni e
funzioni": "Linguaggio degli insiemi e delle funzioni (dominio, composizione,
inversa, ecc.)" [S2, pp. 46-47 della G.U.]. Neanche qui ci sono abilità
specifiche sugli insiemi né sulla logica. I professionali sono stati riordinati
con il D.Lgs. 61/2017 e hanno Linee guida nuove (2019) che non ho letto.

**INVALSI.** Il Quadro di riferimento 2018 e gli esempi di domande per livello
del grado 10 non contengono quesiti di insiemistica [S3]. Non ho trovato un
quesito INVALSI sui diagrammi di Venn con le percentuali di risposta.

## 2. Dove sta nel libro

| testo                                                       | ordine nel volume 1                                                                                                                                             | fonte        |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Matematica C3 Algebra 1, 6ª ed.                             | Parte I Numeri (cap. 1 N, 2 Z, 3 Q, 4 sistemi di numerazione), Parte II Insiemi, Logica e Relazioni (cap. 5 Insiemi, 6 Logica di base, 7 Relazioni, 8 Funzioni) | [S4, indice] |
| Sasso, _Colori della matematica_, ed. blu, vol. 1 (Petrini) | N e Z, Q e reali, poi "Insiemi e logica" (rappresentazioni, sottoinsiemi, operazioni, prodotto cartesiano, elementi di logica), poi calcolo letterale           | [S5c]        |
| Bergamini-Barozzi-Trifone, _Matematica.blu_ 2ª ed., vol. 1  | insiemi numerici N, Z, Q, poi Insiemi (con "Diagramma di Venn come modello per la risoluzione di un problema" e connettivi e quantificatori)                    | [S5a]        |

Quindi nei libri di testo il capitolo viene **dopo** N, Z e Q e prima del calcolo
letterale, e la logica sta nello stesso capitolo o subito dopo. Molti docenti però
lo anticipano: un liceo con _Matematica multimediale.blu_ parte da "Gli
insiemi" e poi fa N [S5b], un tecnico con _Lineamenti di matematica_ fa un
capitolo 1 di tre paragrafi sugli insiemi prima di N [S5d]. Il libro lo mette
dopo i numeri, ma l'insegnante lo sposta liberamente. Non dipende dalle
espressioni.

## 3. Contenuti in ordine di libro, con la notazione stampata

L'ordine e i simboli sono quelli di Matematica C3, cap. 5 [S4, pp. 135-154].
I programmi Zanichelli e Petrini [S5] elencano gli stessi argomenti
nello stesso ordine, ma non ho potuto controllare i loro simboli.

1. **Insieme ed elemento.** Maiuscole per gli insiemi, minuscole per gli elementi.
   `a ∈ A` "a appartiene ad A", `b ∉ A`. Insiemi numerici `N = {0, 1, 2, 3, …}`
   (lo zero è un naturale), `Z`, `Q`. Un raggruppamento è un insieme solo se il
   criterio è oggettivo ("i professori bravi" non lo è): molti esercizi iniziali
   sono di questo tipo.
2. **Uguaglianza.** Due insiemi sono uguali se hanno gli stessi elementi "anche se
   disposti in ordine diverso" (Def. 5.1).
3. **Insieme vuoto, universo, cardinalità.** `∅` oppure `{}`; il libro avverte che
   "{} = ∅ ma {∅} ≠ ∅". La cardinalità si scrive `|A|`, `#(A)` o `card(A)`
   (Def. 5.3), e nei problemi il libro usa `card(A)`.
4. **Rappresentazioni.** _Tabulare_ (in altri libri "per elencazione" [S5b]):
   elementi fra graffe separati da virgole, l'ordine non conta,
   `{1, 2, 3, 5} = {2, 1, 5, 3}`, e "è invece necessario che ogni elemento
   dell'insieme compaia una sola volta": le lettere di "autunno" sono
   `{a, u, t, n, o}`. Per gli insiemi infiniti si usano i puntini. _Per proprietà
   caratteristica_: `{x ∈ N | x < 15}`, con `|` oppure `:`; le condizioni si
   scrivono a parole ("x è pari", "f è multiplo di 3 e f < 15"), non con `∧`.
   _Grafica_: diagrammi di Eulero-Venn, con gli elementi come punti dentro una
   linea chiusa. A scuola il nome indica di solito i diagrammi "di Eulero", che
   disegnano solo le regioni non vuote; quelli "di Venn" propriamente detti
   disegnano tutte le regioni [S7].
5. **Sottoinsiemi.** `Y ⊆ X` "Y è incluso in X"; `Y ⊂ X` sottoinsieme proprio;
   `Y ⊄ X`. Per C3 i sottoinsiemi **impropri** sono X stesso **e ∅**, e un
   sottoinsieme proprio è "non vuoto" e diverso da X (Esempio 5.12: `{1}` non ha
   sottoinsiemi propri). `⊆` si usa "quando non si sa in modo certo se Y = X".
6. **Insieme delle parti.** `℘(A)` (la p calligrafica di Weierstrass); ha sempre
   ∅ e A fra gli elementi; `℘(∅) = {∅}`; se A ha n elementi, `℘(A)` ne ha `2ⁿ`.
7. **Unione** `A ∪ B = {x | x ∈ A o x ∈ B}`, **intersezione** `A ∩ B` ("e"),
   **disgiunti** se `A ∩ B = ∅`, con le proprietà (`A ∪ ∅ = A`, se `B ⊂ A` allora
   `A ∩ B = B`, …).
8. **Differenza** `A − B` "o anche" `A \ B`; non è commutativa.
9. **Complementare** rispetto all'universo U: `Ā`, `Ā_U` oppure `∁_U A`; coincide
   con `U − A`.
10. **Leggi di De Morgan**, dimostrate annerendo regioni di diagrammi.
11. **Partizione:** sottoinsiemi non vuoti, a due a due disgiunti, con unione A.
12. **Prodotto cartesiano.** La coppia ordinata si scrive **`(a; b)` con il punto e
    virgola**. `A × B = {(x; y) | x ∈ A e y ∈ B}`, `A × A = A²`, `A × ∅ = ∅`,
    `A × B ≠ B × A`; rappresentazioni con tabella, diagramma cartesiano e albero.
13. **Diagrammi di Eulero-Venn come modello di un problema** (§5.13), con la
    formula `card(A ∪ B) = card(A) + card(B) − card(A ∩ B)`.

Il programma Bergamini [S5b] segue lo stesso ordine: elencazione,
caratteristica, Eulero-Venn, sottoinsiemi, insieme delle parti, operazioni,
universo e complementare, prodotto cartesiano "rappresentazione cartesiana e ad
albero". La **differenza simmetrica** non compare né in C3 né in nessun
programma letto. C3 la sfiora soltanto nell'esercizio 5.63 come
`(A − B) ∪ (B − A)`, senza nome e senza simbolo.

**Dove le fonti non concordano.**
Il primo disaccordo è sul significato di `⊂`. Per C3 indica il sottoinsieme
proprio, accanto a `⊆`. Wells osserva che nella letteratura di ricerca `A ⊂ B`
vuol dire spesso `A ⊆ B`, mentre a scuola vuol dire sempre il proprio [S12].
Il secondo riguarda il vuoto: C3 lo mette fra i sottoinsiemi impropri, mentre
nella convenzione più diffusa fuori dall'Italia l'unico improprio è A stesso.
Con C3 i sottoinsiemi propri di un insieme di n elementi sono `2ⁿ − 2`, con
l'altra convenzione `2ⁿ − 1`. Un esercizio "quanti sottoinsiemi propri" dipende
quindi dalla convenzione. Infine ci sono varianti di scrittura per
cardinalità, complementare e differenza (sopra), e C3 stesso alterna
`{}` e `∅`.

## 4. Esercizi tipici con una sola risposta controllabile

Tutti da [S4], cap. 5, con le risposte del libro (§5.14.3) dove ci sono. Quelle
segnate (calcolata) le ho ricavate io.

| #   | esercizio                                                                                                                                                                                                | risposta                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 1   | 5.16b. Rappresenta in forma tabulare `B = {x ∈ N \| 2 ⩽ x < 5}`.                                                                                                                                         | `{2, 3, 4}`                          |
| 2   | 5.14. Dato `A = {0, 2, 5}`, vero o falso: `0 ∈ A`, `5 ∈ A`, `∅ ∈ A`, `A ∈ A`, `3,5 ∈ A`, `5 ∉ A`.                                                                                                        | vere solo le prime due               |
| 3   | 5.60. E = lettere di "cartellone", F = lettere di "martello": `E − F`, `F − E`.                                                                                                                          | `{c, n}`; `{m}`                      |
| 4   | 5.58. `S = {a, b, c, e, f, s, t}`, `T = {a, c, g, h, l, s}`, `U = {b, c, d, g, s, t}`: intersezione.                                                                                                     | `{c, s}`                             |
| 5   | 5.47 e 5.120. Se `A = {x ∈ N \| 1 ⩽ x < 3}` quanti elementi ha `℘(A)`? E se H ha 7 elementi?                                                                                                             | 4; 128                               |
| 6   | 5.74. Se `E × F = {(x; x), (x; y), (x; z), (y; x), (y; y), (y; z)}`, chi sono E e F?                                                                                                                     | `E = {x, y}`, `F = {x, y, z}`        |
| 7   | Esempio 5.36. Classe di 28: 17 inglese, 12 francese, 5 entrambi. Quanti nessun corso?                                                                                                                    | 17 + 12 − 5 = 24, 28 − 24 = **4**    |
| 8   | 5.84. Classe di 28: 18 teatro, 22 fotografia, 3 nessun laboratorio. Entrambi? Almeno uno? Non teatro?                                                                                                    | 15; 25; 10                           |
| 9   | 5.80. Club di 2 500 iscritti: 850 sport, 780 scacchi, 320 entrambi. Nessuna iniziativa? Almeno una?                                                                                                      | 1 190; 1 310                         |
| 10  | 5.87 (test Architettura 2008). 37 allievi, tutti in almeno un'attività: 15 musica, 28 pallavolo. Quanti entrambe?                                                                                        | 6                                    |
| 11  | 5.81. Compagnia: 12 almeno ballato, 8 almeno cantato, 16 almeno recitato; 5 ballato e cantato, 3 cantato e recitato, 8 ballato e recitato, 2 tutto. Quanti componenti?                                   | 12 + 8 + 16 − 5 − 3 − 8 + 2 = **22** |
| 12  | 5.82. 605 almeno vino, 582 almeno latte, 348 almeno birra, 140 vino e birra, 85 vino e latte, 56 latte e birra, 25 tutte, 71 nessuna. Una sola bevanda? Almeno una? Intervistati?                        | 1 048; 1 279; 1 350                  |
| 13  | 5.78. 98 iscritti a Salsa, Hip Hop, Break: 6 tutti e tre, 37 Salsa, 15 _solo_ Salsa e Hip Hop, 7 _solo_ Salsa e Break, 9 _almeno_ Hip Hop e Break, 28 Salsa o Break ma non Hip Hop. Quanti solo Hip Hop? | 46                                   |

Il problema 7 è quasi identico a quello del committente (28 alunni, 15 calcio,
12 pallavolo, 5 entrambi: 28 − (15 + 12 − 5) = 6, calcolata). La formula per
tre insiemi, `card(A ∪ B ∪ C) = ΣA − Σ(A∩B) + card(A ∩ B ∩ C)`, C3 non la
scrive: la si ricava dal 11 e dal 12, dove il libro dà solo il risultato.
I problemi 11-13 mostrano anche le parole su cui si gioca il testo: _almeno_,
_solo_, _entrambi_, _nessuno_, _tutti e tre_, _o … ma non_. Il 13 le alterna
apposta ("solo Salsa e Hip Hop" accanto ad "almeno Hip Hop e Break"). Fra gli
esercizi del libro ci sono anche i tipi a risposta aperta: dire se un
raggruppamento è un insieme, scrivere un universo possibile, descrivere un
insieme con una proprietà, dare un esempio di partizione.

## 5. Errori tipici documentati

**Appartenenza e inclusione.** Bagni (2008) studia allievi di 11 e di 15 anni e
mostra come il verbo "contiene" scivoli dall'appartenenza all'inclusione nel
corso dello stesso ragionamento. Un'allieva conclude che A, con le due rette R e
S come elementi, contiene le rette "come figura" e tratta R, S da sottoinsiemi
di A [S6]. L'autore riprende Ferro: indicare un elemento con una regione interna
al diagramma "fa confondere l'appartenenza con la relazione di
sottocollezione". Lo stesso lavoro segnala il rischio della convenzione
maiuscole-per-insiemi e minuscole-per-elementi: può nascere la misconcezione "un
insieme non può appartenere a un altro insieme", che esplode con `℘(A)` [S6].
Nei diagrammi, molti studenti disegnano prima i contenitori e poi ci mettono
gli elementi, cioè leggono l'insieme come un contenitore [S8].

**Il modello della collezione.** Fischbein e Baltsan mostrano che anche dopo la
definizione formale gli studenti ragionano con il modello intuitivo della
"collezione", che agisce "dietro le quinte". Se il concetto formale non viene
usato di continuo, col tempo torna l'interpretazione figurale [S9]. Da qui
vengono le difficoltà con l'insieme vuoto e con l'insieme di un solo elemento:
una collezione vuota o di un pezzo solo non sembra una collezione.

**Insieme vuoto.** Gli insegnanti dello studio di Moru e Qhobela riconoscono
fra gli errori degli studenti `{0}` al posto di `{ }` e gli elementi comuni
dell'unione contati come distinti [S10, letto solo nell'abstract]. C3 dedica un
avvertimento a `{∅} ≠ ∅` e un esercizio ("quali scritture indicano l'insieme
vuoto: ∅, 0, {∅}, {0}, { }") [S4, 5.11]. Uno studio sul libro di prima media
attribuisce una misconcezione all'assenza della frase "il vuoto è sottoinsieme
di ogni insieme" [S11, letto solo nell'abstract].

**Ripetizioni e ordine.** C3 insiste che l'ordine non conta e che ogni elemento
va scritto una volta, e lo fa allenare con le lettere delle parole (MAMMA,
COCCODRILLO) [S4]. Che gli studenti credano il contrario lo riportano di
solito Linchevski e Vinner (1988, su 309 insegnanti e futuri insegnanti), ma
quel lavoro l'ho trovato solo citato, non letto.

**Problemi con i diagrammi.** Il libro stesso nomina l'errore principale: chi
fa almeno un corso "non sono 17 + 12 = 29, perché ce ne sono 5 che frequentano
entrambi i corsi e così vengono conteggiati due volte" [S4, Es. 5.36].
Altri errori non hanno una fonte di ricerca. Li ricavo dal modo in cui gli
esercizi sono costruiti apposta per provocarli (**Inferenza** ragionevole, da
verificare): rispondere "almeno uno" quando si chiede "nessuno", cioè
dimenticare la regione esterna; leggere "almeno A e B" come "solo A e B" e
viceversa (5.78); dare `card(A)` quando si chiede "solo A"; nelle formule a tre
insiemi, dimenticare di riaggiungere la terna; usare `card(A) + card(B)` anche
quando il testo non dice che gli insiemi sono disgiunti (C3 dedica l'Es. 5.34
al caso in cui la somma è giusta, gli allenamenti alla stessa ora).

**Prodotto cartesiano e parti.** L'ordine nella coppia (`A × B ≠ B × A`) e la
coppia come "insieme di due elementi" sono gli avvertimenti espliciti di C3
[S4, §5.12]. Per `℘(A)` il libro fa contare i sottoinsiemi caso per caso
dimenticando di solito ∅ e A, e chiede "quanti sottoinsiemi ha l'insieme che
contiene come elemento l'insieme vuoto" (5.133). Errori come `2n`, `n²` o
`2ⁿ − 1` al posto di `2ⁿ`, oppure `card(A) + card(B)` per `A × B`, non li ho
trovati documentati: sono candidati naturali (**Inferenza**).

## 6. Fattibilità nel motore (Inferenza)

Tutta questa sezione è mia. Il criterio è quello di `SPEC.md`: un esercizio,
una risposta controllabile, un generatore con seme, l'errore tipico come regola
sbagliata valutata sull'esercizio.

| tipo                                                                                     | risposta dello studente       | entra?                         | errori tipici come regola sbagliata                                                                  |
| ---------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| dalla proprietà caratteristica all'elenco                                                | insieme tabulare              | sì                             | estremo `<` letto `⩽` e viceversa; 0 escluso da N; "pari" senza lo 0                                 |
| ∪, ∩, −, complementare su insiemi tabulari                                               | insieme tabulare              | sì                             | ∪ scambiata con ∩; `B − A` per `A − B`; `A − B` come `(A − B) ∪ (B − A)`; universo sbagliato         |
| ∈ ∉ ⊆ ⊂ ⊄ fra elemento e insieme                                                         | un simbolo, o V/F             | sì                             | ∈ per ⊆ e viceversa (`{2} ∈ A`, `2 ⊆ A`); ⊂ per ⊆ quando sono uguali                                 |
| `card(℘(A))`, `card(A × B)`                                                              | numero                        | sì                             | `2n`, `n²`, `2ⁿ − 1`; `card(A) + card(B)`                                                            |
| elencare `A × B`                                                                         | insieme di coppie `(a; b)`    | sì, scomodo al telefono        | coppie invertite (`B × A`)                                                                           |
| elencare `℘(A)`                                                                          | insieme di insiemi            | forse                          | manca ∅ o A; elementi al posto dei singoletti                                                        |
| problemi con due o tre insiemi                                                           | numero                        | sì                             | intersezione non sottratta; regione esterna dimenticata; solo/almeno scambiati; terna non riaggiunta |
| colorare una regione del diagramma                                                       | scelta di regioni (fra 4 o 8) | sì, con un'interfaccia apposta | ∪/∩ scambiati, complementare della regione sbagliata                                                 |
| disegnare il diagramma, dire se è un insieme, dare una partizione, scrivere la proprietà | aperta                        | no                             | (si può ridurre a "è una partizione? sì/no")                                                         |

**Forma canonica di un insieme.** Il libro decide due cose e il motore può
copiarle. L'**ordine non conta**: `{3, 1, 2}` è `corretto`, perché imporre
l'ordine crescente insegnerebbe una cosa falsa. I **doppioni non si scrivono**:
`{1, 2, 2}` ha il valore giusto in forma non canonica, quindi
`da-riscrivere` con "Ogni elemento si scrive una volta sola", come una frazione
non ridotta. Il vuoto si accetta come `∅` e come `{}`; `{∅}`, `{0}` e `0`
sono valori sbagliati, buoni come errori tipici. Gli elementi di un insieme di
numeri seguono la politica del capitolo da cui vengono (in Z il segno, in Q la
frazione ridotta). Il valore si confronta come insieme di `bigint` normalizzati,
o di razionali.

**Il separatore.** La virgola separa gli elementi e la politica attuale la
accetta anche come separatore decimale, e C3 stesso stampa
`Q = {…, 12,34, 8, 0,25, …}`. Il modo più semplice di evitare l'ambiguità è
restare in N e Z e scrivere le frazioni con `/`. Con le coppie il libro usa
già il punto e virgola, `(a; b)`, e l'input dovrebbe accettarlo e mostrarlo.

**Un problema di Venn nel motore.** Lo stato è il vettore delle regioni (4 con
due insiemi, 8 con tre), ciascuna un `bigint ⩾ 0`. Il generatore estrae le
regioni, poi sceglie quali dati aggregati scrivere nel testo (totale, almeno A,
solo A, A e B, almeno A e B, nessuno, tutti e tre). Scarta l'esercizio se la
quantità chiesta non è determinata o se una regione si ricava solo risolvendo
un sistema. Il risolutore riempie una regione per riga, sempre una con una sola
incognita, come sul quaderno:

1. due insiemi: intersezione, poi solo A = `card(A) − card(A ∩ B)`, poi solo B,
   poi l'esterno = totale meno le tre regioni. Oppure la strada della formula
   che usa C3: `17 + 12 − 5 = 24`, `28 − 24 = 4`;
2. tre insiemi: il centro, poi le tre regioni "solo due" (dato "almeno due"
   meno il centro), poi le tre regioni "solo uno", poi l'esterno.

Il 5.78 chiede di andare anche all'indietro: da "Salsa o Break ma non Hip Hop"
si ricava solo Break, perché tutte le altre regioni di quel dato sono note.
Questo ordine di riempimento non l'ho trovato scritto in una fonte. È quello
che gli esempi svolti di C3 fanno implicitamente e quello che un insegnante
mostra alla lavagna. Ogni riga è una sottrazione o una somma in N, quindi i
passaggi atomici del risolutore attuale bastano. Ogni errore tipico è una
regola di riempimento sbagliata (non sottrarre il centro, leggere "almeno" come
"solo", fermarsi prima dell'esterno), che si valuta sull'esercizio come oggi.
Il testo del problema è italiano generato da modelli di frase, e la parte
delicata del generatore è proprio lì: le parole "almeno" e "solo" sono quelle
su cui lo studente sbaglia.

## Fonti

- **[S1]** D.I. 7 ottobre 2010, n. 211, _Indicazioni nazionali riguardanti gli
  obiettivi specifici di apprendimento_ (licei), PDF INDIRE:
  https://www.indire.it/lucabas/lkmw_file/licei2010/indicazioni_nuovo_impaginato/_decreto_indicazioni_nazionali.pdf
  (Matematica, liceo scientifico, primo biennio, pp. 338-339; liceo artistico
  p. 23). Scheda di sintesi Zanichelli:
  https://www.zanichelli.it/assets/download/media-pds-sup-materie_matematica_licei-pdf
- **[S2]** Direttiva 15 luglio 2010, n. 57 (tecnici) e Direttiva 28 luglio 2010,
  n. 65 (professionali), Linee guida primo biennio, G.U. S.O. n. 222 del
  22-9-2010, Matematica pp. 45-47:
  https://umi.dm.unibo.it/wp-content/uploads/2013/10/3_DIRETTIVA_57_65_10_GU_222_22_9_10.pdf
- **[S3]** INVALSI, _Quadro di riferimento delle prove di matematica_ (2018):
  https://invalsi-areaprove.cineca.it/docs/file/QdR_MATEMATICA.pdf ; _Esempi di
  domande per ciascun livello di competenza, Matematica_ (2018):
  https://invalsi-areaprove.cineca.it/docs/2018/Esempi%20di%20domande%20per%20ciascun%20livello%20di%20competenza%20-%20MATEMATICA.pdf
- **[S4]** Carboncini, Bernardo, Modica, Mocchetti et al., _Matematica C3 Algebra 1_,
  6ª edizione 2015 (rev. settembre 2017), Matematicamente.it, ISBN
  9788896354803, CC BY 3.0, cap. 5 "Insiemi" pp. 135-174. Copia completa:
  https://www.fermimn.edu.it/documents/1074/Matematica_IT_Libro_Compiti.pdf ;
  esercizi e risposte: https://upload.wikimedia.org/wikipedia/commons/8/88/Algebra1_esercizi_insiemi.pdf
- **[S5]** Programmi svolti, usati per l'ordine dei capitoli dei libri commerciali:
  (a) IIS Badoni Lecco, 1ª MMB 2020-21, Bergamini-Barozzi-Trifone _Matematica.blu_
  2ª ed. vol. 1, https://vecchiosito.iisbadoni.edu.it/sites/default/files/programmi/2020-2021-Programma%20svolto%201%5eMMB%20Matematica.pdf ;
  (b) Liceo Touschek, 1A 2022-23, Bergamini-Barozzi _Matematica multimediale.blu_
  vol. 1, https://old.liceotouschek.edu.it/images/documenti/allegati/AS%202022-23/programmi/1A/matematica_1A.pdf ;
  (c) Liceo Gullace, 1A scientifico 2023-24, Sasso _Colori della Matematica_
  ed. blu vol. 1, Petrini, ISBN 9788849421668,
  https://liceogullace.edu.it/wp-content/uploads/2024/06/Matematica-1As-2023-24.pdf ;
  (d) IIS Einaudi Cremona, 1ATg 2023-24, Bergamini-Barozzi _Lineamenti di
  matematica_ vol. 1, https://www.einaudicremona.edu.it/system/files/2024-09/1%2520ATg-Matematica-2023-2024-ProgSvolto.pdf
- **[S6]** G. T. Bagni, "La rappresentazione degli insiemi: appartenenza e
  inclusione", in L. Bazzini (a cura di), _Atti del Seminario Franco Italiano di
  Didattica dell'Algebra VI (SFIDA 21-25)_, Università di Torino, 2008, pp. 29-42:
  https://www.syllogismos.it/education/Sfida21.pdf
- **[S7]** G. T. Bagni, "I diagrammi di Eulero: riflessioni didattiche sulla
  rappresentazione degli insiemi", _Bollettino dei Docenti di Matematica_ 55
  (2007), 17-26: https://www.syllogismos.it/education/Bagni%20BDM-Euler.pdf
  (differenza fra diagrammi di Eulero e di Venn; a scuola "Eulero-Venn" indica
  di solito i primi).
- **[S8]** G. T. Bagni, "Insiemi e diagrammi di Eulero-Venn", Master in Didattica
  delle Scienze, Università di Udine:
  https://www.syllogismos.it/giorgiobagni/Bagni-testi%2010-Eulero-Venn.pdf
- **[S9]** E. Fischbein, M. Baltsan, "The mathematical concept of set and the
  'collection' model", _Educational Studies in Mathematics_ 37 (1998), 1-22,
  doi:10.1023/A:1003421206945 (letto solo l'abstract).
- **[S10]** E. K. Moru, M. Qhobela, _Secondary school teachers' pedagogical content
  knowledge of some common student errors and misconceptions in sets_, National
  University of Lesotho, 2013: https://repository.tml.nul.ls/handle/20.500.14155/71
  (letto solo l'abstract).
- **[S11]** Analisi di un libro indonesiano di 7ª classe sulle misconcezioni
  sull'insieme vuoto, _Pendas_ (Unpas), 2025:
  https://journal.unpas.ac.id/index.php/pendas/article/view/33442 (letto solo
  l'abstract).
- **[S12]** C. Wells, _abstractmath.org_, "Sets: subsets":
  https://abstractmath.org/MM/MMSetSubset.htm (sul doppio significato di ⊂).
- Citati da altri, non letti: R. Zazkis, C. Gunn, "Sets, subsets, and the empty
  set: students' constructions and mathematical conventions", _Journal of
  Computers in Mathematics and Science Teaching_ 16 (1997), 133-169;
  L. Linchevski, S. Vinner, "The naive concept of sets in elementary teachers",
  PME 12 (1988).
