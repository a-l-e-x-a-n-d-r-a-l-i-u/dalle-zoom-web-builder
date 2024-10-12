import { createFFmpeg, type FFmpeg } from '@ffmpeg/ffmpeg'
// eslint-disable-next-line import/extensions
import corePath from '@ffmpeg/core/dist/ffmpeg-core.js?url'
import wasmPath from '@ffmpeg/core/dist/ffmpeg-core.wasm?url'
// eslint-disable-next-line import/extensions
import workerPath from '@ffmpeg/core/dist/ffmpeg-core.worker.js?url'

// Constants
const CONCAT_FILE_NAME = 'concat.txt'
const OUTPUT_FILE_NAME = 'output.mp4'

// FFmpeg instance setup
const ffmpegInstance = createFFmpeg({
  log: true,
  corePath,
  wasmPath,
  workerPath,
})

// Ensure FFmpeg is loaded
async function getLoadedFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegInstance.isLoaded()) {
    await ffmpegInstance.load()
  }
  return ffmpegInstance
}

// Helper function to delete files from FFmpeg virtual filesystem
async function cleanUpFiles(ffmpeg: FFmpeg, fileNames: string[]): Promise<void> {
  fileNames.forEach((fileName) => ffmpeg.FS('unlink', fileName))
}

export async function buildFrameTransition(
  innerFrame: Uint8Array,
  outerFrame: Uint8Array,
  options: {
    percent: number
    seconds: number
    fps: number
    superSampleFactor: number
    skipLastFrame: boolean
  },
): Promise<Uint8Array> {
  const innerOversizeFactor = options.superSampleFactor * options.percent
  const zoomFactor = Math.min(1 / options.percent, 10)
  const framesToRender = Math.ceil(options.fps * options.seconds)
  const ffmpeg = await getLoadedFFmpeg()
  ffmpeg.FS('writeFile', 'innerFrame.png', innerFrame)
  ffmpeg.FS('writeFile', 'outerFrame.png', outerFrame)
  try {
    await ffmpeg.run(
      '-loop',
      '1',
      '-i',
      'innerFrame.png',
      '-loop',
      '1',
      '-i',
      'outerFrame.png',
      '-filter_complex',
      [
        `[1:v]scale=-2:${options.superSampleFactor}*ih[outer]`,
        `[0:v]scale=-2:${innerOversizeFactor}*ih[inner]`,
        `[outer][inner]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2`,
        `zoompan=z='exp(log(${zoomFactor})*(1-on/duration))':d=${framesToRender}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1024x1024:fps=${options.fps}`,
        options.skipLastFrame ? `select=not(eq(n-1\\,${framesToRender}))` : null,
      ]
        .filter((x) => !!x)
        .join(','),
      '-c:v',
      'libx264',
      '-crf',
      '18',
      '-t',
      `${options.seconds}`,
      '-s',
      '1024x1024',
      '-pix_fmt',
      'yuv422p',
      OUTPUT_FILE_NAME,
    )
  } catch (error) {
    ffmpeg.exit()
    throw error
  }
  const result = ffmpeg.FS('readFile', OUTPUT_FILE_NAME)
  await cleanUpFiles(ffmpeg, ['innerFrame.png', 'outerFrame.png', OUTPUT_FILE_NAME])
  return result
}

export async function mergeVideos(videos: Uint8Array[]): Promise<Uint8Array> {
  const ffmpeg = await getLoadedFFmpeg()
  const files: string[] = []

  for (const [index, video] of videos.entries()) {
    const fileName = `${index}.mp4`
    files.push(fileName)
    ffmpeg.FS('writeFile', fileName, video)
  }

  const concatFileContents = files.map((fileName) => `file '${fileName}'`).join('\n')
  ffmpeg.FS('writeFile', CONCAT_FILE_NAME, concatFileContents)

  await ffmpeg.run('-f', 'concat', '-i', CONCAT_FILE_NAME, '-c', 'copy', OUTPUT_FILE_NAME)
  console.log('Running FFmpeg to generate output.mp4', CONCAT_FILE_NAME)
  const result = ffmpeg.FS('readFile', OUTPUT_FILE_NAME)

  await cleanUpFiles(ffmpeg, [...files, CONCAT_FILE_NAME, OUTPUT_FILE_NAME])

  return result
}
