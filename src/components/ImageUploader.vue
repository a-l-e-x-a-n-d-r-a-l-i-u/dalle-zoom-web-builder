<template>
  <h1>Next frame goes here</h1>
  <n-upload list-type="image" accept="image/*" :show-remove-button="false" :custom-request="upload" ref="uploader">
    <n-upload-dragger>
      <n-text style="font-size: 16px"> Click or drag next image to this area </n-text>
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
    async upload(options: UploadCustomRequestOptions): Promise<void> {
      if (!options.file.file) {
        options.onError()
        return
      }
      try {
        await processFrame(options.file.file)
        options.onFinish()
      } catch {
        options.onError()
      }
      await sleep(1000)
      const uploader = this.$refs.uploader as InstanceType<typeof NUpload>
      uploader.clear()
    },
    async render(): Promise<void> {
      await renderAll()
    },
  },
})
</script>
