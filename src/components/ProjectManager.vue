<template>
  <h1>project controls</h1>
  <button @click="newProjectClick()">New</button>
  <input type="file" accept=".dalle" @change="importProjectChange($event)" />
  <button @click="exportProjectClick">Export</button>
  <n-modal
    v-model:show="showModal"
    preset="dialog"
    title="Save as"
    positive-text="Save"
    negative-text="Cancel"
    @positive-click="saveProjectConfirm"
    @negative-click="showModal = false"
  >
    <input v-model="projectName" />
  </n-modal>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { NModal } from 'naive-ui'
import { newProject, importProject, exportProject } from '../workflow/project'
import { db } from '../stores/db'

export default defineComponent({
  components: {
    NModal,
  },
  data() {
    return {
      showModal: false,
      projectName: '',
    }
  },
  methods: {
    async newProjectClick(): Promise<void> {
      await newProject()
    },
    async saveProjectConfirm(): Promise<void> {
      const { projectName } = this
      this.showModal = false
      await exportProject(projectName)
    },
    async importProjectChange(event: Event): Promise<void> {
      const target = event.target as HTMLInputElement
      if (target && target.files) {
        await importProject(target.files[0])
        this.projectName = await db.getProjectName()
        target.value = ''
      }
    },
    async exportProjectClick(): Promise<void> {
      this.showModal = true
    },
  },
})
</script>
