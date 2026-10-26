import type { ComponentType } from 'react'
import type { ChapterId } from '../chapters.ts'
import type { LessonProps } from './Lesson.tsx'
import { NExpressionsLesson } from './NExpressionsLesson.tsx'
import { PowersLesson } from './PowersLesson.tsx'

// La lezione di ogni capitolo. Un capitolo senza lezione non compare qui.
export const lessons: Partial<Record<ChapterId, ComponentType<LessonProps>>> = {
  n: NExpressionsLesson,
  pow: PowersLesson,
}
