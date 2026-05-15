<template>
  <div class="flow-designer">
    <!-- 左侧组件库 -->
    <div class="component-palette-wrapper">
      <ComponentPalette @drag-start="handleDragStart" />
    </div>

    <!-- 中间画布区域 -->
    <div class="canvas-wrapper">
      <!-- Tab栏 -->
      <div class="tab-bar">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-item"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span>{{ tab.title }}</span>
          <el-icon v-if="tab.type === 'code'" class="close-tab" @click.stop="closeCodeTab(tab.id)">
            <Close />
          </el-icon>
        </div>
      </div>

      <!-- Tab内容 -->
      <div class="tab-content">
        <!-- 主画布 -->
        <div v-show="activeTab === 'main'" class="canvas-container">
          <DesignerToolbar
            :zoom="zoom"
            :can-delete="canDelete"
            @zoom-in="zoomIn"
            @zoom-out="zoomOut"
            @reset-zoom="resetZoom"
            @delete="deleteSelected"
            @save="handleSave"
            @publish="handlePublish"
            @go-back="goBack"
          />
          <div ref="canvasRef" class="canvas"></div>
        </div>

        <!-- 代码编辑器Tab -->
        <div
          v-for="tab in codeTabs"
          :key="tab.id"
          v-show="activeTab === tab.id"
          class="code-editor-container"
        >
          <CodeEditorTab
            :tab="tab"
            v-model:code="codeContents[tab.nodeId]"
            :editor-refs="editorRefs"
            @format="formatCode(tab.nodeId)"
            @save="saveCode(tab.nodeId)"
            @change="onCodeChange(tab.nodeId)"
          />
        </div>
      </div>
    </div>

    <!-- 右侧属性面板 -->
    <div class="property-panel-wrapper">
      <PropertyPanel
        :selected-node="selectedNodeWithoutCode"
        :selected-edge="selectedEdge"
        @save="saveNodeConfig"
        @save-edge="saveEdgeConfig"
        @close="clearSelection"
      />
    </div>
  </div>
</template>

<script setup>
import { registerNodes } from '@/components/designer/composables/nodeRegistry'
import { useFlowStore } from '@/stores/flow'
import { Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ComponentPalette from './ComponentPalette.vue'
import PropertyPanel from './PropertyPanel.vue'
import CodeEditorTab from './components/CodeEditorTab.vue'
import DesignerToolbar from './components/DesignerToolbar.vue'

// Composables
import { useCodeEditor } from './composables/useCodeEditor'
import { useEdges } from './composables/useEdges'
import { useFlowPersistence } from './composables/useFlowPersistence'
import { useGraph } from './composables/useGraph'
import { useNodes } from './composables/useNodes'
import { useSelection } from './composables/useSelection'
import { nodeThemes } from './config/nodeStyles'

const props = defineProps({ flowId: { type: String, default: null } })
const router = useRouter()
const flowStore = useFlowStore()

// Refs
const canvasRef = ref(null)
const zoom = ref(1)

// 画布管理
const { graph, initGraph, disposeGraph, getGraph } = useGraph(canvasRef)
// let graphInstance = null

// 代码编辑器
const codeEditor = useCodeEditor(graph)
const {
  tabs,
  activeTab,
  codeTabs,
  codeContents,
  editorRefs,
  codeModified,
  openCodeTab,
  saveCode,
  onCodeChange,
  closeCodeTab,
  formatCode,
} = codeEditor

// 选中状态
const selection = useSelection()
const {
  selectedNode,
  selectedEdge,
  selectedNodeWithoutCode,
  canDelete,
  clearSelection,
  setSelectedNode,
  setSelectedEdge,
} = selection

// 节点和边操作
const nodesApi = useNodes(graph, openCodeTab)
const { addNode, deleteNode, updateNodeData, getNodesData } = nodesApi

const edgesApi = useEdges(graph)
const { addEdge, deleteEdge, updateEdgeData, getEdgesData } = edgesApi

// 持久化
const persistence = useFlowPersistence(flowStore, getGraph, getNodesData, getEdgesData)
const { saveFlow, loadFlow } = persistence

// 缩放控制
const zoomIn = () => {
  zoom.value = Math.min(zoom.value + 0.1, 2)
  graph.value?.zoomTo(zoom.value)
}
const zoomOut = () => {
  zoom.value = Math.max(zoom.value - 0.1, 0.5)
  graph.value?.zoomTo(zoom.value)
}
const resetZoom = () => {
  zoom.value = 1
  graph.value?.zoomTo(1)
  graph.value?.centerContent()
}

// 删除选中
const deleteSelected = () => {
  if (selectedNode.value) {
    deleteNode(graph.value?.getCellById(selectedNode.value.id))
    clearSelection()
    ElMessage.success('节点已删除')
  } else if (selectedEdge.value) {
    deleteEdge(graph.value?.getCellById(selectedEdge.value.id))
    clearSelection()
    ElMessage.success('连线已删除')
  }
}

// 保存节点配置
const saveNodeConfig = (config) => {
  if (selectedNode.value) {
    updateNodeData(selectedNode.value.id, config)
    clearSelection()
    ElMessage.success('节点配置已保存')
  }
}

// 保存连线配置
const saveEdgeConfig = (config) => {
  if (selectedEdge.value) {
    updateEdgeData(selectedEdge.value.id, config.condition)
    ElMessage.success('连线配置已保存')
  }
}

// 保存流程
const handleSave = async () => {
  for (const tab of codeTabs.value) {
    if (codeModified.value[tab.nodeId]) {
      await saveCode(tab.nodeId)
    }
  }
  await persistence.saveFlow(props.flowId)
}

// 发布流程
const handlePublish = async () => {
  // 实现发布逻辑
  if (!props.flowId) {
    ElMessage.warning('请先保存流程')
    return
  }

  try {
    await ElMessageBox.confirm('发布后接口将立即可用，确定发布吗？', '确认发布', {
      confirmButtonText: '发布',
      cancelButtonText: '取消',
      type: 'warning',
    })

    // 调用发布接口
    await flowStore.publish(props.flowId)

    ElMessage.success('发布成功，接口已可用')

    // 可选：刷新流程信息
    //await loadFlowInfo()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('发布失败')
    }
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 拖拽
const handleDragStart = (component) => {
  window.dragComponent = component
}

// 设置画布事件监听
const setupGraphEvents = () => {
  if (!graph.value) return

  graph.value.on('node:click', ({ node }) => {
    // 清除其他节点的选中样式
    graph.value.getNodes().forEach((n) => {
      const nodeType = n.data.type
      n.attr('body/fill', '#ffffff') // 恢复白色背景
      n.attr('body/stroke', nodeThemes[nodeType]?.stroke || '#d9d9d9') // 恢复默认边框颜色
      n.attr('body/strokeWidth', 2)
    })
    // 设置当前节点样式
    node.attr('body/fill', '#e6f7ff') // 浅蓝色背景
    node.attr('body/stroke', '#1890ff')
    node.attr('body/strokeWidth', 3)

    setSelectedNode({ id: node.id, data: node.getData(), type: node.data.type })
  })

  graph.value.on('node:dblclick', ({ node }) => {
    const nodeData = node.getData()
    if (nodeData.type === 'java' || nodeData.type === 'python') {
      openCodeTab(node.id, nodeData.name, nodeData.type)
    }
  })

  // 节点右键菜单（删除节点）
  graph.value.on('node:contextmenu', ({ node, e }) => {
    e.preventDefault()

    // 先选中节点
    setSelectedNode({
      id: node.id,
      data: node.getData(),
      type: node.data.type,
    })

    // 显示确认对话框
    ElMessageBox.confirm(`确定删除节点 "${node.data.name}" 吗？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        // 删除节点相关的所有连线
        const edges = graph.value.getConnectedEdges(node)
        edges.forEach((edge) => edge.remove())
        // 删除节点
        node.remove()
        clearSelection()
        ElMessage.success('节点已删除')
      })
      .catch(() => {})
  })

  graph.value.on('edge:click', ({ edge }) => {
    // 清除其他连线的选中样式
    graph.value.getEdges().forEach((e) => {
      e.attr('line/stroke', '#1890ff')
      e.attr('line/strokeWidth', 2)
    })
    // 设置当前连线样式
    edge.attr('line/stroke', '#ff4d4f')
    edge.attr('line/strokeWidth', 3)

    setSelectedEdge({
      id: edge.id,
      source: edge.getSourceCellId(),
      target: edge.getTargetCellId(),
      data: edge.getData(),
    })
  })

  // 连线右键菜单（删除连线）
  graph.value.on('edge:contextmenu', ({ edge, e }) => {
    e.preventDefault()

    // 先选中连线
    setSelectedEdge({
      id: edge.id,
      source: edge.getSourceCellId(),
      target: edge.getTargetCellId(),
      data: edge.getData(),
    })

    // 显示确认对话框
    ElMessageBox.confirm('确定删除此连线吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        edge.remove()
        clearSelection()
        ElMessage.success('连线已删除')
      })
      .catch(() => {})
  })

  graph.value.on('blank:click', () => {
    // 重置所有样式
    graph.value.getNodes().forEach((n) => {
      const nodeType = n.data.type
      n.attr('body/fill', '#ffffff')
      n.attr('body/stroke', nodeThemes[nodeType]?.stroke || '#d9d9d9')
      n.attr('body/strokeWidth', 2)
    })
    graph.value.getEdges().forEach((e) => {
      e.attr('line/stroke', '#1890ff')
      e.attr('line/strokeWidth', 2)
    })
    clearSelection()
  })

  // 拖拽放置
  canvasRef.value?.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  })
  canvasRef.value?.addEventListener('drop', (e) => {
    e.preventDefault()
    let component = window.dragComponent
    if (!component) {
      try {
        component = JSON.parse(e.dataTransfer.getData('application/json'))
      } catch (err) {}
    }
    if (component) {
      const point = graph.value.clientToLocal(e.clientX, e.clientY)
      addNode(component, point.x, point.y)
    }
  })
}

// 加载流程数据
const loadFlowData = async () => {
  await persistence.loadFlow(props.flowId, {
    addNode: (component, x, y, id, data) => addNode(component, x, y, id, data),
    addEdge: (edgeData) => addEdge(edgeData),
    setCodeContent: (nodeId, code) => {
      if (code) codeContents.value[nodeId] = code
    },
    onLoadComplete: (flow) => {
      console.log('流程加载完成:', flow?.name)
    },
  })
}

// 监听窗口大小变化
const handleResize = () => {
  if (graph.value && canvasRef.value) {
    graph.value.resize(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
  }
}

// 生命周期
onMounted(() => {
  registerNodes()
  initGraph()

  // 等待画布初始化完成

  nextTick()

  setupGraphEvents()

  loadFlowData()

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)

  setTimeout(() => {
    if (graph.value && canvasRef.value) {
      const rect = canvasRef.value.parentElement?.getBoundingClientRect()
      if (rect) {
        graph.value.resize(rect.width, rect.height)
      }
    }
  }, 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  disposeGraph()
})
</script>

<style scoped>
/* 样式保持不变 */
.flow-designer {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.component-palette-wrapper {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid #e8e8e8;
  background: #fff;
  overflow-y: auto;
}
.canvas-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}
.tab-bar {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 8px;
  overflow-x: auto;
  flex-shrink: 0;
}
.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  margin-right: 4px;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;
}
.tab-item.active {
  background: #fff;
  border-bottom-color: #fff;
  margin-bottom: -1px;
  color: #1890ff;
}
.close-tab {
  font-size: 12px;
  cursor: pointer;
  opacity: 0.6;
}
.close-tab:hover {
  opacity: 1;
  color: #ff4d4f;
}
.tab-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}
.canvas-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.canvas {
  flex: 1;
  background: #fafafa;
  overflow: hidden;
  position: relative;
  min-height: 0;
  height: 100%;
  pointer-events: auto;
}
.property-panel-wrapper {
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid #e8e8e8;
  background: #fff;
  overflow-y: auto;
}
.code-editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;
}

.x6-node.selected .x6-node-body {
  stroke: #1890ff !important;
  stroke-width: 3px !important;
}

.x6-edge.selected .x6-edge-path {
  stroke: #ff4d4f !important;
  stroke-width: 3px !important;
}
</style>
