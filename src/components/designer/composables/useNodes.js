// composables/useNodes.js
import { ElMessage } from 'element-plus'
import { nanoid } from 'nanoid'
import { getNodeSize } from '../config/nodeConfig'

export function useNodes(graph, openCodeTab) {
  const addNode = (component, x, y, existingId = null, existingData = null) => {
    if (!graph.value) {
      console.error('Graph not initialized')
      return null
    }

    let nodeType = component.type
    if (!nodeType.endsWith('-node')) {
      nodeType = `${component.type}-node`
    }

    const nodeId = existingId || nanoid()
    const size = getNodeSize(nodeType)

    // 如果有传入的 config（拖拽时设置的），就使用它
    const nodeConfig = component.config || {}

    try {
      const node = graph.value.addNode({
        id: nodeId,
        shape: nodeType,
        x: x - size.width / 2,
        y: y - size.height / 2,
        data: existingData || {
          type: component.type,
          name: component.name,
          config: nodeConfig,
          executeType: 'SYNC',
        },
      })
      return node
    } catch (error) {
      console.error('Failed to add node:', error)
      ElMessage.error(`节点类型 ${component.type} 未注册`)
      return null
    }
  }

  const deleteNode = (node) => {
    if (!graph.value || !node) return
    const edges = graph.value.getConnectedEdges(node)
    edges.forEach((edge) => edge.remove())
    node.remove()
  }

  const updateNodeData = (nodeId, config) => {
    if (!graph.value) return
    const node = graph.value.getCellById(nodeId)
    if (node) {
      const currentData = node.getData()
      node.setData({
        ...currentData,
        name: config.name,
        config: { ...config.config, code: currentData.config?.code },
        executeType: config.executeType,
        asyncConfig: config.asyncConfig,
        retryCount: config.retryCount,
      })
      node.attr('label/text', config.name)
    }
  }

  const getNodesData = () => {
    if (!graph.value) return []
    return graph.value.getNodes().map((node) => {
      const pos = node.position()
      const size = getNodeSize(node.shape)
      return {
        id: node.id,
        type: node.data.type,
        name: node.data.name,
        config: node.data.config,
        executeType: node.data.executeType,
        x: pos.x + size.width / 2, // 保存中心点 X
        y: pos.y + size.height / 2, // 保存中心点 Y
      }
    })
  }

  const clearNodes = () => {
    if (!graph.value) return
    const nodes = graph.value.getNodes()
    nodes.forEach((node) => node.remove())
  }

  return { addNode, deleteNode, updateNodeData, getNodesData, clearNodes }
}
