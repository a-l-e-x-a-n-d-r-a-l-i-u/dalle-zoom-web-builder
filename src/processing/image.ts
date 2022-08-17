import { initializeImageMagick, ImageMagick } from '@imagemagick/magick-wasm'
import { DrawableFillColor } from '@imagemagick/magick-wasm/drawables/drawable-fill-color'
import { DrawableColor } from '@imagemagick/magick-wasm/drawables/drawable-color'
import { MagickColor } from '@imagemagick/magick-wasm/magick-color'
import { PaintMethod } from '@imagemagick/magick-wasm/paint-method'
import { MagickFormat } from '@imagemagick/magick-wasm/magick-format'
import { AlphaOption } from '@imagemagick/magick-wasm/alpha-option'
import { CompositeOperator } from '@imagemagick/magick-wasm/composite-operator'

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
        image.write((output) => resolve(new Uint8Array(output)), MagickFormat.Miff)
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
      image.write((output) => resolve(new Uint8Array(output)), MagickFormat.Miff)
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

export async function buildFeatheredEdgeForCombining(input: Uint8Array): Promise<Uint8Array> {
  await initializeImageMagick()
  const mask = await getFeatherMask()
  return new Promise((resolve) => {
    ImageMagick.read(input, (image) => {
      ImageMagick.read(mask, (maskImage) => {
        maskImage.alpha(AlphaOption.Copy)
        image.composite(maskImage, CompositeOperator.DstIn)
        image.alpha(AlphaOption.Set)
        image.write((output) => resolve(new Uint8Array(output)), MagickFormat.Png)
      })
    })
  })
}
