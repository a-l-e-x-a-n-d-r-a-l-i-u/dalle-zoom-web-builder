import { saveAs } from 'file-saver'
import { db } from '../stores/db'
import { addBorder, cropDalleSignature, blobToUint8, Uint8ToBlob, ensureImageRightSize } from '../processing/image'
import { renderForFrameAndSave } from './render'

export async function processFrame(rawUpload: File): Promise<void> {
  try {
    console.log('Starting processFrame...')
    const data = await blobToUint8(rawUpload)
    console.log('Data after blobToUint8:', data)

    await ensureImageRightSize(data)
    console.log('Image size ensured.')

    const noSignature = await cropDalleSignature(data)
    console.log('Signature cropped:', noSignature)

    const infillPercent = await db.getInfillPercent()
    console.log('Infill percent:', infillPercent)

    const nextFrameFeed = Uint8ToBlob(await addBorder(noSignature, infillPercent))
    console.log('Next frame feed:', nextFrameFeed)

    const noSignatureAsBlob = Uint8ToBlob(noSignature)
    console.log('No signature as blob:', noSignatureAsBlob)

    const key = await db.frames.add({ rawUpload, noSignature: noSignatureAsBlob, nextFrameFeed })
    console.log('New file added to db', key)

    saveAs(nextFrameFeed, `frame_${key}_infill.png`)
    console.log('File saved:', `frame_${key}_infill.png`)

    if (key >= 3) {
      await renderForFrameAndSave(key - 2)
      console.log('Rendered for frame and saved:', key - 2)
    }
  } catch (error) {
    console.error('Failed to process frame', error)
    throw error
  }
}
