import type { ComponentType } from 'react'
import type { ChapterId } from '../chapters.ts'
import type { LessonProps } from './Lesson.tsx'
import { MonomialsLesson } from './MonomialsLesson.tsx'
import { NExpressionsLesson } from './NExpressionsLesson.tsx'
import { PolynomialsLesson } from './PolynomialsLesson.tsx'
import { PowersLesson } from './PowersLesson.tsx'
import { QExpressionsLesson } from './QExpressionsLesson.tsx'
import { SetsLesson } from './SetsLesson.tsx'
import { ZExpressionsLesson } from './ZExpressionsLesson.tsx'

// La lezione di ogni capitolo. Un capitolo senza lezione non compare qui.
export const lessons: Partial<Record<ChapterId, ComponentType<LessonProps>>> = {
  n: NExpressionsLesson,
  z: ZExpressionsLesson,
  q: QExpressionsLesson,
  pow: PowersLesson,
  set: SetsLesson,
  mono: MonomialsLesson,
  poly: PolynomialsLesson,
}
