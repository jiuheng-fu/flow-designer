<template>
  <div class="flow-editor">
    <FlowDesigner :flow-id="flowId" />
  </div>
</template>

<script setup>
import FlowDesigner from '@/components/designer/FlowDesigner.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const flowId = computed(() => (route.params.id === 'create' ? null : route.params.id))
</script>

<style scoped>
.flow-editor {
  height: 100vh;
  overflow: hidden;
}
</style>
