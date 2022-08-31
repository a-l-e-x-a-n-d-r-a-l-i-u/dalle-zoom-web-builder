import { exportDB, importInto } from 'dexie-export-import'
import { saveAs } from 'file-saver'
import { db } from '../stores/db'

export async function newProject(): Promise<void> {
  await db.delete()
  await db.open()
}

export async function importProject(projectFile: Blob): Promise<void> {
  await importInto(db, projectFile, { clearTablesBeforeImport: true })
}

export async function exportProject(name: string): Promise<void> {
  await db.setProjectName(name)
  const blob = await exportDB(db)
  saveAs(blob, `${name}.dalle`)
}
