import { saveAs } from 'file-saver'
import { db } from '../stores/db'
import {
  addBorder,
  cropDalleSignature,
  blobToUint8,
  Uint8ToBlob,
  buildFeatheredEdgeForCombining,
  ensureImageRightSize,
} from '../processing/image'

export async function processFrame(rawUpload: File): Promise<void> {
  try {
    const data = await blobToUint8(rawUpload)
    await ensureImageRightSize(data)
    const noSignature = await cropDalleSignature(data)
    const featheredFrame = Uint8ToBlob(await buildFeatheredEdgeForCombining(noSignature))
    const infillPercent = await db.getInfillPercent()
    const nextFrameFeed = Uint8ToBlob(await addBorder(noSignature, infillPercent))
    const key = await db.frames.add({ rawUpload, featheredFrame, nextFrameFeed })
    console.log('new file added to db', key)
    saveAs(nextFrameFeed, `frame_${key}_infill.png`)
  } catch (error) {
    console.error('failed to process frame', error)
    throw error
  }
}
