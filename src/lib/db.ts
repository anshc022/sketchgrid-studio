import { openDB, type IDBPDatabase } from 'idb';
import type { ProjectRecord } from '@/types';

const DB_NAME = 'sketchgrid';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

export async function readProjects(): Promise<ProjectRecord[]> {
  try {
    const db = await getDB();
    const all = await db.getAll('projects');
    return (all as ProjectRecord[]).sort((a, b) => b.updated - a.updated);
  } catch (e) {
    console.error('readProjects error', e);
    return [];
  }
}

export async function writeProject(record: ProjectRecord): Promise<void> {
  try {
    const db = await getDB();
    await db.put('projects', record);
  } catch (e) {
    console.error('writeProject error', e);
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('projects', id);
  } catch (e) {
    console.error('deleteProject error', e);
  }
}

export async function readSession(): Promise<string | null> {
  try {
    const db = await getDB();
    const rec = await db.get('meta', 'session');
    return rec ? (rec as { key: string; value: string }).value : null;
  } catch (e) {
    console.error('readSession error', e);
    return null;
  }
}

export async function writeSession(projectId: string): Promise<void> {
  try {
    const db = await getDB();
    await db.put('meta', { key: 'session', value: projectId });
  } catch (e) {
    console.error('writeSession error', e);
  }
}

export async function clearAll(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('projects');
    await db.clear('meta');
  } catch (e) {
    console.error('clearAll error', e);
  }
}
