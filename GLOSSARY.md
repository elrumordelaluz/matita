# Glossario

Il dominio si dice in italiano, il codice in inglese. Quando un termine
compare in un'issue, in un test o in un messaggio all'utente, usa la colonna
di sinistra; nei nomi di tipi e funzioni, la colonna del codice.

| termine           | nel codice      | significato                                                                                                                                                                         |
| ----------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| insieme numerico  | `NumberSet`     | N, Z o Q. Ogni capitolo lavora in uno solo.                                                                                                                                         |
| capitolo          | `Chapter`       | Unità del percorso: una lezione e un gruppo di abilità.                                                                                                                             |
| abilità           | `Skill`         | Cosa si allena e si ripassa. Ha un id stabile (`n.order`) e dei prerequisiti.                                                                                                       |
| prerequisito      | `prerequisite`  | Abilità che conviene acquisire prima di un'altra. Finché manca, l'altra è bloccata.                                                                                                 |
| esercizio         | `Exercise`      | Una consegna da risolvere (un'espressione, un problema, delle scritture), generata da un seme per un'abilità, con il suo tipo di risposta.                                          |
| seme              | `seed`          | Il numero che rende un esercizio riproducibile.                                                                                                                                     |
| riga              | `Line`          | Un livello della soluzione, come sul quaderno.                                                                                                                                      |
| passaggio         | `Step`          | Un'operazione di una riga, con operandi, risultato e regola. Fra numeri gli operandi sono due; nella riduzione dei simili, uno per simile.                                          |
| posizione         | `Path`          | Dove sta un nodo nell'albero: il percorso dalla radice. Distingue le copie uguali di uno stesso conto.                                                                              |
| potenza           | `power`         | Base ed esponente, `2³`. Nell'albero è l'operazione `^`.                                                                                                                            |
| proprietà         | `PropertyRule`  | Regola che trasforma potenze senza calcolarle: stessa base, stesso esponente, potenza di potenza.                                                                                   |
| forma canonica    | `canonical`     | Il modo in cui il risultato va scritto in quel capitolo (frazione ridotta, segno davanti).                                                                                          |
| forma scritta     | `answerForm`    | La risposta come l'ha scritta lo studente, senza normalizzarla: l'anteprima la mostra, la verifica la giudica.                                                                      |
| esito             | `Outcome`       | Il giudizio su una risposta: corretto, da riscrivere, errore tipico, sbagliato, non valido.                                                                                         |
| da riscrivere     | `rewrite`       | Valore giusto in forma non canonica. Non è un errore.                                                                                                                               |
| errore tipico     | `Misconception` | Una regola sbagliata riconoscibile, con la sua spiegazione. Mai chiamarlo "bug" davanti allo studente.                                                                              |
| tentativo         | `Attempt`       | Una risposta salvata, con esito, aiuti e durata.                                                                                                                                    |
| aiuto             | `assisted`      | Un tentativo con suggerimento o riscrittura.                                                                                                                                        |
| acquisita         | `mastered`      | Abilità con tre tentativi corretti consecutivi senza aiuti, oppure già saputa.                                                                                                      |
| bloccata          | `locked`        | Abilità con almeno un prerequisito non acquisito. La sessione non la propone, ma lezione e pratica restano aperte: è un consiglio, non un divieto.                                  |
| già saputo        | `known`         | Abilità che lo studente ha segnato come saputa insieme al suo capitolo. Conta come acquisita.                                                                                       |
| flashcard         | `Flashcard`     | Una consegna da ricordare a memoria, con davanti il prompt e dietro la risposta, votata dallo studente. Ha una sua carta FSRS, diversa da quella di un'abilità.                     |
| ripasso           | `Review`        | Un esercizio proposto perché FSRS ha fatto scadere l'abilità.                                                                                                                       |
| sessione          | `Session`       | Una seduta di circa dieci esercizi.                                                                                                                                                 |
| lezione           | `Lesson`        | La spiegazione di un capitolo.                                                                                                                                                      |
| esempio svolto    | `WorkedExample` | Un esercizio a seme fisso mostrato risolto dentro una lezione.                                                                                                                      |
| tipo di risposta  | `AnswerKind`    | Cosa chiede l'esercizio, e da quale consegna: un numero (da un'espressione, da un conto, da un problema), un insieme, una scelta di simboli, un polinomio. Decide come si verifica. |
| insieme           | `FiniteSet`     | Un insieme finito di naturali, l'oggetto del capitolo 5. Da non confondere con l'insieme numerico.                                                                                  |
| problema          | `VennProblem`   | Un testo con i dati di due o tre insiemi, da risolvere con il diagramma di Eulero-Venn.                                                                                             |
| regione           | `Region`        | Una zona del diagramma, come "solo A" o "nessuno", con il suo numero di elementi.                                                                                                   |
| monomio           | `Monomial`      | Un coefficiente razionale per potenze di lettere. Il monomio scritto conserva i fattori come li si è scritti.                                                                       |
| polinomio         | `Polynomial`    | Una somma di monomi, i suoi termini. Un numero è un polinomio di grado 0.                                                                                                           |
| forma normale     | `normalForm`    | Un monomio con un solo coefficiente e lettere diverse; un polinomio senza termini simili. Non è l'ordine.                                                                           |
| prodotto notevole | `Formula`       | Un prodotto con il risultato da sapere a memoria, (A + B)² = A² + 2AB + B². Sul quaderno ha la riga della formula, con i termini al posto di A e B.                                 |
| termini simili    | `likeTerms`     | Monomi con la stessa parte letterale. Si riducono in un passaggio solo, anche se non sono vicini.                                                                                   |
