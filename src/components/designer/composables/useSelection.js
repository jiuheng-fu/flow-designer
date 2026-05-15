import { computed, ref } from 'vue'

export function useSelection() {
  const selectedNode = ref(null)
  const selectedEdge = ref(null)

  const selectedNodeWithoutCode = computed(() => {
    if (!selectedNode.value) return null
    const nodeCopy = { ...selectedNode.value }
    if (nodeCopy.data?.config) {
      const { code, ...configWithoutCode } = nodeCopy.data.config
      nodeCopy.data = { ...nodeCopy.data, config: configWithoutCode }
    }
    return nodeCopy
  })

  const canDelete = computed(() => {
    return selectedNode.value !== null || selectedEdge.value !== null
  })

  const clearSelection = () => {
    selectedNode.value = null
    selectedEdge.value = null
  }

  const setSelectedNode = (node) => {
    selectedNode.value = node
    selectedEdge.value = null
  }

  const setSelectedEdge = (edge) => {
    selectedEdge.value = edge
    selectedNode.value = null
  }

  return {
    selectedNode,
    selectedEdge,
    selectedNodeWithoutCode,
    canDelete,
    clearSelection,
    setSelectedNode,
    setSelectedEdge,
  }
}
