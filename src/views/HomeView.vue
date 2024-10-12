<script setup lang="ts">
import ImageUploader from '../components/ImageUploader.vue'
import ProjectManager from '../components/ProjectManager.vue'
</script>

<template>
  <header>
    <ProjectManager />
  </header>
  <main>
    <ImageUploader />
  </main>
</template>
<style scoped>
main {
  width: 400px;
  margin: auto;
  margin-top: 300px;
}
</style>
