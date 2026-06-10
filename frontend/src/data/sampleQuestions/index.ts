import type { CubeProject, SampleQuestion } from '@/types/cube'
import { FACE_IDS } from '@/types/cube'
import sample1Json from './sample-1.json'
import sample2Json from './sample-2.json'
import sample3Json from './sample-3.json'

const sample1 = sample1Json as SampleQuestion
const sample2 = sample2Json as SampleQuestion
const sample3 = sample3Json as SampleQuestion

export const SAMPLE_QUESTIONS: SampleQuestion[] = [sample1, sample2, sample3]

export function sampleToProject(sample: SampleQuestion): CubeProject {
  const now = Date.now()
  const faces = Object.fromEntries(
    FACE_IDS.map((faceId) => [
      faceId,
      { faceId, fabricJson: sample.faces[faceId] },
    ]),
  ) as CubeProject['faces']

  return {
    id: sample.id,
    name: sample.title,
    createdAt: now,
    updatedAt: now,
    unfoldType: sample.unfoldType,
    faces,
  }
}

export function copySampleToPractice(sample: SampleQuestion): CubeProject {
  const now = Date.now()
  const faces = Object.fromEntries(
    FACE_IDS.map((faceId) => [
      faceId,
      { faceId, fabricJson: structuredClone(sample.faces[faceId]) },
    ]),
  ) as CubeProject['faces']

  return {
    id: crypto.randomUUID(),
    name: `${sample.title} - 练习`,
    createdAt: now,
    updatedAt: now,
    unfoldType: sample.unfoldType,
    faces,
  }
}

export function findSampleById(id: string): SampleQuestion | undefined {
  return SAMPLE_QUESTIONS.find((q) => q.id === id)
}

export function isSampleProjectId(id: string): id is SampleQuestion['id'] {
  return SAMPLE_QUESTIONS.some((q) => q.id === id)
}
