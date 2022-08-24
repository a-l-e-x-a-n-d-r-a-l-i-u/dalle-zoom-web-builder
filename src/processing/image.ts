import { initializeImageMagick, ImageMagick } from '@imagemagick/magick-wasm'
import { DrawableFillColor } from '@imagemagick/magick-wasm/drawables/drawable-fill-color'
import { DrawableColor } from '@imagemagick/magick-wasm/drawables/drawable-color'
import { MagickColor } from '@imagemagick/magick-wasm/magick-color'
import { PaintMethod } from '@imagemagick/magick-wasm/paint-method'
import { MagickFormat } from '@imagemagick/magick-wasm/magick-format'
import { AlphaOption } from '@imagemagick/magick-wasm/alpha-option'
import { CompositeOperator } from '@imagemagick/magick-wasm/composite-operator'
import { Gravity } from '@imagemagick/magick-wasm/gravity'

const DALLE_IMAGE_SIZE = 1024
const FEATHER_EDGE_SIZE = 40
const FEATHER_SIGMA_RATIO = 0.75
const FEATHER_SIGMA_VALUE = FEATHER_EDGE_SIZE * FEATHER_SIGMA_RATIO

let imageMaskForFeathering: Uint8Array | null = null

async function getFeatherMask(): Promise<Uint8Array> {
  if (imageMaskForFeathering != null) {
    return imageMaskForFeathering
  }
  const builtMask: Uint8Array = await new Promise((resolve) => {
    ImageMagick.read(
      new MagickColor('white'),
      DALLE_IMAGE_SIZE - FEATHER_EDGE_SIZE * 2,
      DALLE_IMAGE_SIZE - FEATHER_EDGE_SIZE * 2,
      (image) => {
        image.borderColor = new MagickColor('black')
        image.border(FEATHER_EDGE_SIZE)
        image.blur(FEATHER_EDGE_SIZE, FEATHER_SIGMA_VALUE)
        image.write((output) => resolve(new Uint8Array(output)), MagickFormat.Png)
      },
    )
  })
  imageMaskForFeathering = builtMask
  return builtMask
}

export async function blobToUint8(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer())
}

export function Uint8ToBlob(array: Uint8Array): Blob {
  return new Blob([array])
}

export async function ensureImageRightSize(input: Uint8Array): Promise<void> {
  await initializeImageMagick()
  ImageMagick.read(input, (image) => {
    if (image.width !== DALLE_IMAGE_SIZE || image.height !== DALLE_IMAGE_SIZE) {
      throw new Error('image input wrong size')
    }
  })
}

export async function cropDalleSignature(input: Uint8Array): Promise<Uint8Array> {
  await initializeImageMagick()
  return new Promise((resolve) => {
    ImageMagick.read(input, (image) => {
      const signaturePixels = []
      for (let x = 944; x < 1024; x += 1) {
        for (let y = 1008; y < 1024; y += 1) {
          signaturePixels.push(new DrawableColor(x, y, PaintMethod.Point))
        }
      }
      image.draw(new DrawableFillColor(new MagickColor(0, 0, 0, 0)), ...signaturePixels)
      image.write((output) => resolve(new Uint8Array(output)), MagickFormat.Png)
    })
  })
}

export async function addBorder(input: Uint8Array, percentOfOriginal: number): Promise<Uint8Array> {
  await initializeImageMagick()
  const expandedBorderSize = ((1 / percentOfOriginal - 1) * DALLE_IMAGE_SIZE) / 2
  return new Promise((resolve) => {
    ImageMagick.read(input, (image) => {
      image.borderColor = new MagickColor(0, 0, 0, 0)
      image.border(expandedBorderSize)
      image.resize(DALLE_IMAGE_SIZE, DALLE_IMAGE_SIZE)
      image.write((output) => resolve(new Uint8Array(output)), MagickFormat.Png)
    })
  })
}

async function maskOutEdges(
  imageInput: Uint8Array,
  backgroundInput?: { image: Uint8Array; percent: number },
): Promise<Uint8Array> {
  await initializeImageMagick()
  const maskData = await getFeatherMask()
  return new Promise((resolve) => {
    ImageMagick.read(maskData, (mask) => {
      ImageMagick.read(imageInput, (image) => {
        mask.alpha(AlphaOption.Copy)
        image.composite(mask, CompositeOperator.DstIn)
        image.alpha(AlphaOption.Set)
        if (backgroundInput) {
          ImageMagick.read(backgroundInput.image, (background) => {
            const overlapZone = DALLE_IMAGE_SIZE * backgroundInput.percent
            background.crop(overlapZone, overlapZone, Gravity.Center)
            background.resize(DALLE_IMAGE_SIZE, DALLE_IMAGE_SIZE)
            image.composite(background, CompositeOperator.DstOver)
          })
        }
        image.write((output) => resolve(new Uint8Array(output)), MagickFormat.Png)
      })
    })
  })
}

export async function buildInnerTransitionFrame(image: Uint8Array): Promise<Uint8Array> {
  return maskOutEdges(image)
}
export async function buildOuterTransitionFrame(
  image: Uint8Array,
  background: { image: Uint8Array; percent: number },
): Promise<Uint8Array> {
  return maskOutEdges(image, background)
}
