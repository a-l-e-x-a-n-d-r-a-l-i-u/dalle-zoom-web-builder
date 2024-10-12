<template>
  <h1>Next frame goes here</h1>
  <n-upload
    list-type="image"
    accept="image/*"
    :show-remove-button="false"
    :custom-request="handleUpload"
    ref="uploader"
  >
    <n-upload-dragger>
      <n-text>Click or drag the next image to this area</n-text>
    </n-upload-dragger>
  </n-upload>
  <button @click="render">Render</button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { NUpload, NUploadDragger, NText, type UploadCustomRequestOptions } from 'naive-ui'
import sleep from 'sleep-promise'
import { processFrame } from '../workflow/frame'
import { renderAll } from '../workflow/render'

export default defineComponent({
  components: {
    NUpload,
    NUploadDragger,
    NText,
  },
  methods: {
    async handleUpload(options: UploadCustomRequestOptions): Promise<void> {
      if (!this.verifyFile(options)) return
      await this.processFile(options)
    },

    verifyFile(options: UploadCustomRequestOptions): boolean {
      if (!options.file.file) {
        options.onError()
        return false
      }
      return true
    },

    async processFile(options: UploadCustomRequestOptions): Promise<void> {
      const file = options.file.file
      if (file) {
        try {
          await processFrame(file)
          options.onFinish()
        } catch {
          options.onError()
        }
      }
      await this.clearUploader(9000) // Customisable wait duration (currently set to 9sec for testing)
    },

    async clearUploader(timeout: number): Promise<void> {
      await sleep(timeout)
      const uploader = this.$refs.uploader as InstanceType<typeof NUpload>
      uploader.clear()
    },

    async render(): Promise<void> {
      try {
        await renderAll()
      } catch (error) {
        console.error('Render failed', error)
      }
    },
  },
})
</script>
