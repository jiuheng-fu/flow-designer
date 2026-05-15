// composables/useFlowPersistence.js
import { ElMessage } from 'element-plus'
import { nextTick } from 'vue'

export function useFlowPersistence(flowStore, getGraph, getNodesData, getEdgesData) {
  /**
   * 保存流程
   */
  const saveFlow = async (flowId, options = {}) => {
    const { beforeSave, afterSave } = options

    try {
      if (beforeSave) {
        await beforeSave()
      }

      const graph = getGraph()
      if (!graph) {
        throw new Error('画布未初始化')
      }

      const nodes = getNodesData()
      const edges = getEdgesData()

      const flowData = {
        id: flowId,
        nodes,
        edges,
        config: {
          path: `/api/flow/${flowId || 'new'}`,
          method: 'POST',
        },
      }

      console.log('Saving flow data:', flowData)

      await flowStore.design(flowData)
      ElMessage.success('保存成功')

      if (afterSave) {
        await afterSave(flowData)
      }

      return { success: true, data: flowData }
    } catch (error) {
      console.error('保存失败:', error)
      ElMessage.error(error.message || '保存失败')
      return { success: false, error: error.message }
    }
  }

  /**
   * 加载流程
   */
  const loadFlow = async (flowId, handlers = {}) => {
    const {
      addNode, // 添加节点的函数
      addEdge, // 添加边的函数
      setCodeContent, // 设置代码内容的函数
      onLoadComplete, // 加载完成的回调
    } = handlers

    if (!flowId) {
      console.log('No flowId provided, skipping load')
      return { success: false, error: 'No flowId provided' }
    }

    // 检查 addNode 是否存在
    if (!addNode || typeof addNode !== 'function') {
      console.error('addNode is not a function', addNode)
      return { success: false, error: 'addNode handler is required' }
    }

    try {
      const flow = await flowStore.loadDetail(flowId)

      if (!flow) {
        console.warn('Flow not found:', flowId)
        return { success: false, error: 'Flow not found' }
      }

      console.log('加载流程数据:', { nodes: flow.nodes?.length, edges: flow.edges?.length })

      // 1. 加载节点
      if (flow.nodes && flow.nodes.length > 0) {
        const addedNodes = []

        for (const nodeData of flow.nodes) {
          const component = {
            type: nodeData.type,
            name: nodeData.name,
          }

          // 调用 addNode 函数
          const node = addNode(
            component, // component 对象
            nodeData.x, // x 坐标
            nodeData.y, // y 坐标
            nodeData.id, // 已有的节点 ID
            nodeData, // 已有的节点数据
          )

          if (node) {
            addedNodes.push(nodeData.id)

            // 如果是代码节点，预加载代码内容
            if (
              (nodeData.type === 'java' || nodeData.type === 'python') &&
              nodeData.config?.code &&
              setCodeContent &&
              typeof setCodeContent === 'function'
            ) {
              setCodeContent(node.id, nodeData.config.code)
            }
          }
        }

        console.log('节点加载完成:', addedNodes.length)
      }

      // 2. 等待 DOM 更新
      await nextTick()

      // 3. 加载边
      if (flow.edges && flow.edges.length > 0) {
        // 检查 addEdge 是否存在
        if (!addEdge || typeof addEdge !== 'function') {
          console.warn('addEdge handler not provided, skipping edges')
        } else {
          // 延迟一下确保节点完全渲染
          setTimeout(() => {
            const addedEdges = []

            flow.edges.forEach((edgeData) => {
              const edge = addEdge(edgeData)
              if (edge) {
                addedEdges.push(edgeData.id)
              }
            })

            console.log('边加载完成:', addedEdges.length)
          }, 100)
        }
      }

      // 加载完成回调
      if (onLoadComplete && typeof onLoadComplete === 'function') {
        onLoadComplete(flow)
      }

      return { success: true, data: flow }
    } catch (error) {
      console.error('加载流程失败:', error)
      ElMessage.error(error.message || '加载流程失败')
      return { success: false, error: error.message }
    }
  }

  /**
   * 导出流程为 JSON
   */
  const exportFlow = async (flowId, flowInfo = {}) => {
    try {
      const graph = getGraph()
      if (!graph) {
        throw new Error('画布未初始化')
      }

      const nodes = getNodesData()
      const edges = getEdgesData()

      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        flow: {
          id: flowId,
          name: flowInfo.name || '未命名流程',
          description: flowInfo.description || '',
          ...flowInfo,
        },
        nodes,
        edges,
      }

      // 创建下载
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `flow_${flowId || 'export'}_${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)

      ElMessage.success('导出成功')
      return { success: true, data: exportData }
    } catch (error) {
      console.error('导出失败:', error)
      ElMessage.error('导出失败')
      return { success: false, error: error.message }
    }
  }

  /**
   * 导入流程
   */
  const importFlow = async (file, handlers = {}) => {
    const { addNode, addEdge, clearCanvas, onImportComplete } = handlers

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target.result)

          // 验证数据格式
          if (!importData.nodes || !importData.edges) {
            throw new Error('无效的流程文件格式')
          }

          // 清空现有画布
          if (clearCanvas && typeof clearCanvas === 'function') {
            clearCanvas()
          }

          // 导入节点
          const nodeIdMap = new Map()

          for (const nodeData of importData.nodes) {
            const component = {
              type: nodeData.type,
              name: nodeData.name,
            }

            if (addNode && typeof addNode === 'function') {
              const node = addNode(
                component,
                nodeData.x,
                nodeData.y,
                null, // 生成新ID
                nodeData,
              )

              if (node) {
                nodeIdMap.set(nodeData.id, node.id)
              }
            }
          }

          // 等待节点添加完成
          await nextTick()

          // 导入边（更新引用ID）
          setTimeout(() => {
            if (addEdge && typeof addEdge === 'function') {
              importData.edges.forEach((edgeData) => {
                const newSourceId = nodeIdMap.get(edgeData.source) || edgeData.source
                const newTargetId = nodeIdMap.get(edgeData.target) || edgeData.target

                addEdge({
                  ...edgeData,
                  source: newSourceId,
                  target: newTargetId,
                })
              })
            }
          }, 100)

          ElMessage.success(
            `导入成功，共导入 ${importData.nodes.length} 个节点，${importData.edges.length} 条连线`,
          )

          if (onImportComplete && typeof onImportComplete === 'function') {
            onImportComplete(importData)
          }

          resolve({ success: true, data: importData })
        } catch (error) {
          console.error('导入失败:', error)
          ElMessage.error('导入失败：文件格式错误')
          reject(error)
        }
      }

      reader.onerror = () => {
        ElMessage.error('读取文件失败')
        reject(new Error('读取文件失败'))
      }

      reader.readAsText(file)
    })
  }

  /**
   * 检查是否有未保存的更改
   */
  const hasUnsavedChanges = (hasChanges = null) => {
    if (hasChanges && typeof hasChanges === 'function') {
      return hasChanges()
    }
    return false
  }

  /**
   * 复制流程
   */
  const duplicateFlow = async (sourceFlowId, newFlowName) => {
    try {
      const sourceFlow = await flowStore.loadDetail(sourceFlowId)

      if (!sourceFlow) {
        throw new Error('源流程不存在')
      }

      const newFlowData = {
        name: newFlowName || `${sourceFlow.name} (副本)`,
        description: sourceFlow.description,
        nodes: sourceFlow.nodes.map((node) => ({
          ...node,
          id: undefined,
        })),
        edges: sourceFlow.edges.map((edge) => ({
          ...edge,
          id: undefined,
        })),
        config: sourceFlow.config,
      }

      const result = await flowStore.create(newFlowData)
      ElMessage.success('复制成功')

      return { success: true, data: result }
    } catch (error) {
      console.error('复制失败:', error)
      ElMessage.error('复制失败')
      return { success: false, error: error.message }
    }
  }

  return {
    saveFlow,
    loadFlow,
    exportFlow,
    importFlow,
    hasUnsavedChanges,
    duplicateFlow,
  }
}
