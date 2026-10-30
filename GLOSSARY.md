# Glossario

Il dominio si dice in italiano, il codice in inglese. Quando un termine
compare in un'issue, in un test o in un messaggio all'utente, usa la colonna
di sinistra; nei nomi di tipi e funzioni, la colonna del codice.

| termine          | nel codice      | significato                                                                                                    |
| ---------------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| insieme numerico | `NumberSet`     | N, Z o Q. Ogni capitolo lavora in uno solo.                                                                    |
| capitolo         | `Chapter`       | Unità del percorso: una lezione e un gruppo di abilità.                                                        |
| abilità          | `Skill`         | Cosa si allena e si ripassa. Ha un id stabile (`n.order`) e dei prerequisiti.                                  |
| prerequisito     | `prerequisite`  | Abilità che deve essere acquisita prima di sbloccarne un'altra.                                                |
| esercizio        | `Exercise`      | Un'espressione da risolvere, generata da un seme per un'abilità.                                               |
| seme             | `seed`          | Il numero che rende un esercizio riproducibile.                                                                |
| riga             | `Line`          | Un livello della soluzione, come sul quaderno.                                                                 |
| passaggio        | `Step`          | Una sola operazione dentro una riga, con la regola applicata.                                                  |
| potenza          | `power`         | Base ed esponente, `2³`. Nell'albero è l'operazione `^`.                                                       |
| proprietà        | `PropertyRule`  | Regola che trasforma potenze senza calcolarle: stessa base, stesso esponente, potenza di potenza.              |
| forma canonica   | `canonical`     | Il modo in cui il risultato va scritto in quel capitolo (frazione ridotta, segno davanti).                     |
| forma scritta    | `answerForm`    | La risposta come l'ha scritta lo studente, senza normalizzarla: l'anteprima la mostra, la verifica la giudica. |
| esito            | `Outcome`       | Il giudizio su una risposta: corretto, da riscrivere, errore tipico, sbagliato, non valido.                    |
| da riscrivere    | `rewrite`       | Valore giusto in forma non canonica. Non è un errore.                                                          |
| errore tipico    | `Misconception` | Una regola sbagliata riconoscibile, con la sua spiegazione. Mai chiamarlo "bug" davanti allo studente.         |
| tentativo        | `Attempt`       | Una risposta salvata, con esito, aiuti e durata.                                                               |
| aiuto            | `assisted`      | Un tentativo con suggerimento o riscrittura.                                                                   |
| acquisita        | `mastered`      | Abilità con tre tentativi corretti consecutivi senza aiuti, oppure già saputa.                                 |
| già saputo       | `known`         | Abilità che lo studente ha segnato come saputa insieme al suo capitolo. Conta come acquisita.                  |
| ripasso          | `Review`        | Un esercizio proposto perché FSRS ha fatto scadere l'abilità.                                                  |
| sessione         | `Session`       | Una seduta di circa dieci esercizi.                                                                            |
| lezione          | `Lesson`        | La spiegazione di un capitolo.                                                                                 |
| esempio svolto   | `WorkedExample` | Un esercizio a seme fisso mostrato risolto dentro una lezione.                                                 |
