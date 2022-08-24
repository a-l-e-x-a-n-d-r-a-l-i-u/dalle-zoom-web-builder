import { saveAs } from 'file-saver'
import { blobToUint8, Uint8ToBlob, buildInnerTransitionFrame, buildOuterTransitionFrame } from '../processing/image'
import { buildFrameTransition, mergeVideos } from '../processing/video'
import { db } from '../stores/db'

export async function renderForFrame(startFrameId: number): Promise<Uint8Array> {
  const startFrameData = await db.frames.get(startFrameId)
  const endFrameData = await db.frames.get(startFrameId + 1)
  const afterEndFrameData = await db.frames.get(startFrameId + 2)
  const percent = await db.getInfillPercent()
  const seconds = await db.getSecondsPerTransition()
  const fps = await db.getFps()
  const superSampleFactor = await db.getSuperSampleFactor()
  if (!startFrameData || !endFrameData) {
    throw new Error("cannot render frame without it's end transitions")
  }
  const innerTransitionFrameImage = await buildInnerTransitionFrame(await blobToUint8(startFrameData.noSignature))
  const outerTransitionFrameImage = afterEndFrameData
    ? await buildOuterTransitionFrame(await blobToUint8(endFrameData.noSignature), {
        image: await blobToUint8(afterEndFrameData.noSignature),
        percent,
      })
    : await blobToUint8(endFrameData.rawUpload)
  const transitionVideoData = await buildFrameTransition(innerTransitionFrameImage, outerTransitionFrameImage, {
    percent,
    seconds,
    fps,
    superSampleFactor,
  })
  const transitionVideo = Uint8ToBlob(transitionVideoData)
  await db.frames.update(startFrameId, { transitionVideo })
  return transitionVideoData
}

export async function renderAll(): Promise<void> {
  const videoData: Uint8Array[] = []
  const allFrames = await db.frames.orderBy('id').toArray()
  for (const frame of allFrames) {
    const frameId = frame.id
    if (frameId == null) {
      throw new Error('frame has no id')
    }
    if (frame.transitionVideo) {
      // eslint-disable-next-line no-await-in-loop
      videoData.push(await blobToUint8(frame.transitionVideo))
    } else if (frameId < allFrames.length) {
      //frame id less than framecount means it is not the last, so we need to render it
      // eslint-disable-next-line no-await-in-loop
      videoData.push(await renderForFrame(frameId))
    }
  }
  const result = await mergeVideos(videoData)
  saveAs(Uint8ToBlob(result), 'video.mp4')
}
