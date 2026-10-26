import { describe, expect, test } from 'vitest'
import { parseExpression, toText } from './expression.ts'
import { rationalToText as rationalText } from './rational.ts'
import { solve, type Solution } from './solver.ts'

function describeSolution(solution: Solution) {
  return solution.lines.map((line) => ({
    line: toText(line.expression),
    steps: line.steps.map(
      (s) =>
        `${rationalText(s.left)} ${s.op} ${rationalText(s.right)} = ${rationalText(s.result)} → ${toText(s.expression)}`,
    ),
  }))
}

test('addizioni e sottrazioni da sinistra a destra', () => {
  expect(describeSolution(solve(parseExpression('12 − 5 + 3 − 4')))).toEqual([
    {
      line: '6',
      steps: [
        '12 - 5 = 7 → 7 + 3 − 4',
        '7 + 3 = 10 → 10 − 4',
        '10 - 4 = 6 → 6',
      ],
    },
  ])
})

test('ogni passaggio dichiara la regola', () => {
  const [line] = solve(parseExpression('20 + 8 − 15')).lines
  expect(line?.steps.map((s) => s.rule)).toEqual([
    'add-sub-left-to-right',
    'add-sub-left-to-right',
  ])
})

test('il risultato è il valore dell’ultima riga', () => {
  expect(rationalText(solve(parseExpression('30 − 12 − 9 + 4')).result)).toBe(
    '13',
  )
})

test('prima × e :, poi + e −, una riga per livello', () => {
  expect(describeSolution(solve(parseExpression('2 + 3 × 4 − 6 : 2')))).toEqual(
    [
      {
        line: '2 + 12 − 3',
        steps: ['3 × 4 = 12 → 2 + 12 − 6 : 2', '6 : 2 = 3 → 2 + 12 − 3'],
      },
      {
        line: '11',
        steps: ['2 + 12 = 14 → 14 − 3', '14 - 3 = 11 → 11'],
      },
    ],
  )
})

test('moltiplicazioni e divisioni da sinistra a destra', () => {
  expect(describeSolution(solve(parseExpression('24 : 4 × 3 : 2')))).toEqual([
    {
      line: '9',
      steps: [
        '24 : 4 = 6 → 6 × 3 : 2',
        '6 × 3 = 18 → 18 : 2',
        '18 : 2 = 9 → 9',
      ],
    },
  ])
})

test('un prodotto in mezzo a una somma', () => {
  expect(
    describeSolution(solve(parseExpression('20 − 3 × 4 + 5 × 2 : 5'))),
  ).toEqual([
    {
      line: '20 − 12 + 2',
      steps: [
        '3 × 4 = 12 → 20 − 12 + 5 × 2 : 5',
        '5 × 2 = 10 → 20 − 12 + 10 : 5',
        '10 : 5 = 2 → 20 − 12 + 2',
      ],
    },
    {
      line: '10',
      steps: ['20 - 12 = 8 → 8 + 2', '8 + 2 = 10 → 10'],
    },
  ])
})

test('i passaggi di × e : dichiarano la loro regola', () => {
  const lines = solve(parseExpression('2 + 3 × 4')).lines
  expect(lines.map((l) => l.steps.map((s) => s.rule))).toEqual([
    ['mul-div-left-to-right'],
    ['add-sub-left-to-right'],
  ])
})

test('graffe, quadre e tonde: dal gruppo più interno, una riga per livello', () => {
  expect(
    describeSolution(solve(parseExpression('{[(8 − 3) × 2 + 4] : 7 + 1} × 3'))),
  ).toEqual([
    {
      line: '{[5 × 2 + 4] : 7 + 1} × 3',
      steps: ['8 - 3 = 5 → {[5 × 2 + 4] : 7 + 1} × 3'],
    },
    {
      line: '{[10 + 4] : 7 + 1} × 3',
      steps: ['5 × 2 = 10 → {[10 + 4] : 7 + 1} × 3'],
    },
    {
      line: '{14 : 7 + 1} × 3',
      steps: ['10 + 4 = 14 → {14 : 7 + 1} × 3'],
    },
    {
      line: '{2 + 1} × 3',
      steps: ['14 : 7 = 2 → {2 + 1} × 3'],
    },
    { line: '3 × 3', steps: ['2 + 1 = 3 → 3 × 3'] },
    { line: '9', steps: ['3 × 3 = 9 → 9'] },
  ])
})

test('le quadre restano quadre quando le tonde cadono', () => {
  expect(
    describeSolution(solve(parseExpression('[20 − (3 + 5)] : 4'))).map(
      (l) => l.line,
    ),
  ).toEqual(['[20 − 8] : 4', '12 : 4', '3'])
})

test('i gruppi più interni si svolgono nella stessa riga', () => {
  expect(
    describeSolution(solve(parseExpression('(2 + 3) × (10 − 4)'))),
  ).toEqual([
    {
      line: '5 × 6',
      steps: ['2 + 3 = 5 → 5 × (10 − 4)', '10 - 4 = 6 → 5 × 6'],
    },
    { line: '30', steps: ['5 × 6 = 30 → 30'] },
  ])
})

test('una parentesi intorno a un numero cade senza passaggi', () => {
  expect(
    describeSolution(solve(parseExpression('(7) + 2'))).map((l) => l.line),
  ).toEqual(['9'])
})

test('un numero da solo non ha righe', () => {
  const solution = solve(parseExpression('7'))
  expect(solution.lines).toEqual([])
  expect(rationalText(solution.result)).toBe('7')
})

// Le righe con i conti a margine, come li mostra il quaderno.
function notebook(source: string) {
  return solve(parseExpression(source)).lines.map((line) => ({
    line: toText(line.expression),
    steps: line.steps.map(
      (s) => `${toText(s.operation)} = ${toText(s.outcome)}`,
    ),
  }))
}

describe('in Z', () => {
  test('una somma algebrica da sinistra a destra', () => {
    expect(notebook('−7 + (−3) − (−5) + 2')).toEqual([
      {
        line: '−3',
        steps: ['−7 + (−3) = −10', '−10 − (−5) = −5', '−5 + 2 = −3'],
      },
    ])
  })

  test('la regola dei segni in moltiplicazioni e divisioni', () => {
    expect(notebook('(−3) × (+4) − (−18) : (−6)')).toEqual([
      {
        line: '−12 − 3',
        steps: ['−3 × (+4) = −12', '−18 : (−6) = 3'],
      },
      { line: '−15', steps: ['−12 − 3 = −15'] },
    ])
  })

  test('un gruppo che si riduce a un negativo resta fra tonde', () => {
    expect(notebook('5 − (3 − 7)')).toEqual([
      { line: '5 − (−4)', steps: ['3 − 7 = −4'] },
      { line: '9', steps: ['5 − (−4) = 9'] },
    ])
  })

  test('il meno davanti a un gruppo: prima il gruppo, poi il cambio di segno', () => {
    expect(notebook('−(3 − 7) + 2')).toEqual([
      { line: '−(−4) + 2', steps: ['3 − 7 = −4'] },
      { line: '4 + 2', steps: ['−(−4) = 4'] },
      { line: '6', steps: ['4 + 2 = 6'] },
    ])
  })

  test('il cambio di segno di un positivo', () => {
    expect(notebook('−(5 − 2) + 1').map((l) => l.line)).toEqual([
      '−(+3) + 1',
      '−3 + 1',
      '−2',
    ])
  })

  test('il cambio di segno sta nel giro di × e :', () => {
    expect(notebook('−(−2) × 3 − 1')).toEqual([
      { line: '6 − 1', steps: ['−(−2) = 2', '2 × 3 = 6'] },
      { line: '5', steps: ['6 − 1 = 5'] },
    ])
  })

  test('il cambio di segno dichiara la sua regola', () => {
    const lines = solve(parseExpression('−(3 − 7) + 2')).lines
    expect(lines.map((l) => l.steps.map((s) => s.rule))).toEqual([
      ['add-sub-left-to-right'],
      ['change-sign'],
      ['add-sub-left-to-right'],
    ])
  })

  test('il meno davanti a una quadra', () => {
    expect(notebook('−[4 − (5 − (−5)) × 2] − 4').map((l) => l.line)).toEqual([
      '−[4 − 10 × 2] − 4',
      '−[4 − 20] − 4',
      '−[−16] − 4',
      '16 − 4',
      '12',
    ])
  })

  test('un’espressione che è solo il meno davanti a un gruppo', () => {
    const solution = solve(parseExpression('−(2 − 9)'))
    expect(solution.lines.map((l) => toText(l.expression))).toEqual([
      '−(−7)',
      '7',
    ])
    expect(rationalText(solution.result)).toBe('7')
  })
})

describe('in Q', () => {
  test('ogni conto fra frazioni è un passaggio, con il risultato ridotto', () => {
    expect(notebook('1/4 + 1/6 − 1/3')).toEqual([
      { line: '1/12', steps: ['1/4 + 1/6 = 5/12', '5/12 − 1/3 = 1/12'] },
    ])
  })

  test('prodotto e divisione prima della somma, il reciproco a mente', () => {
    expect(notebook('1/2 + 4/9 × 9/8 − 9/8 : 3/2')).toEqual([
      {
        line: '1/2 + 1/2 − 3/4',
        steps: ['4/9 × 9/8 = 1/2', '9/8 : 3/2 = 3/4'],
      },
      { line: '1/4', steps: ['1/2 + 1/2 = 1', '1 − 3/4 = 1/4'] },
    ])
  })

  test('un gruppo che dà una frazione negativa la lascia fra tonde', () => {
    expect(notebook('3 − (2/3 − 5/6) × 2').map((l) => l.line)).toEqual([
      '3 − (−1/6) × 2',
      '3 − (−1/3)',
      '10/3',
    ])
  })

  test('il risultato può essere un intero', () => {
    expect(rationalText(solve(parseExpression('5/4 : (−1/4)')).result)).toBe(
      '-5',
    )
  })
})
