<template>
  <n-upload :show-file-list="false" accept="image/*">
    <n-upload-dragger>
      <n-text style="font-size: 16px"> Click or drag a next image to this area </n-text>
    </n-upload-dragger>
  </n-upload>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { NUpload, NUploadDragger, NText } from 'naive-ui'

export default defineComponent({
  components: {
    NUpload,
    NUploadDragger,
    NText,
  },
})
</script>
