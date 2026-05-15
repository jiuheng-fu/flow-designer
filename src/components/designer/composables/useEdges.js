// composables/useEdges.js
export function useEdges(graph) {
  const addEdge = (edgeData) => {
    if (!graph.value) {
      console.error('Graph not initialized')
      return null
    }

    const sourceNode = graph.value.getCellById(edgeData.source)
    const targetNode = graph.value.getCellById(edgeData.target)

    if (!sourceNode || !targetNode) {
      console.warn('节点不存在', { source: edgeData.source, target: edgeData.target })
      return null
    }

    try {
      const edge = graph.value.addEdge({
        id: edgeData.id,
        source: { cell: edgeData.source, port: edgeData.sourcePort || 'out1' },
        target: { cell: edgeData.target, port: edgeData.targetPort || 'in1' },
        attrs: {
          line: {
            stroke: '#1890ff',
            strokeWidth: 2,
            targetMarker: { name: 'block', width: 8, height: 8 },
          },
        },
        connector: { name: 'smooth' },
        zIndex: 1,
      })

      if (edgeData.condition) {
        edge.setData({ condition: edgeData.condition })
      }
      return edge
    } catch (error) {
      console.error('添加边失败:', error)
      return null
    }
  }

  const deleteEdge = (edge) => {
    if (graph.value && edge) {
      edge.remove()
    }
  }

  const updateEdgeData = (edgeId, condition) => {
    if (!graph.value) return
    const edge = graph.value.getCellById(edgeId)
    if (edge) {
      edge.setData({ ...edge.getData(), condition })
    }
  }

  const getEdgesData = () => {
    if (!graph.value) return []
    return graph.value.getEdges().map((edge) => ({
      id: edge.id,
      source: edge.getSourceCellId(),
      target: edge.getTargetCellId(),
      sourcePort: edge.getSourcePortId(),
      targetPort: edge.getTargetPortId(),
      condition: edge.getData()?.condition || '',
    }))
  }

  const clearEdges = () => {
    if (!graph.value) return
    const edges = graph.value.getEdges()
    edges.forEach((edge) => edge.remove())
  }

  return { addEdge, deleteEdge, updateEdgeData, getEdgesData, clearEdges }
}
