import { openDB } from 'idb'
import type { CubeProject } from '@/types/cube'

const DB = 'cube-painter'
const STORE = 'projects'

async function getDb() {
  return openDB(DB, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    },
  })
}

export async function saveProject(p: CubeProject) {
  const db = await getDb()
  await db.put(STORE, p, p.id)
}

export async function listProjects(): Promise<CubeProject[]> {
  const db = await getDb()
  const projects = await db.getAll(STORE)
  return projects.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function loadProject(id: string): Promise<CubeProject | undefined> {
  const db = await getDb()
  return db.get(STORE, id)
}

export async function deleteProject(id: string) {
  const db = await getDb()
  await db.delete(STORE, id)
}
