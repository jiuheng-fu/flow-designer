import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref } from 'vue'

export function useCodeEditor(graph) {
  const tabs = ref([{ id: 'main', title: '主流程图', type: 'main' }])
  const activeTab = ref('main')
  const codeContents = ref({})
  const editorRefs = ref({})
  const codeModified = ref({})
  const editorTheme = ref('vs-dark')

  const codeTabs = computed(() => tabs.value.filter((tab) => tab.type === 'code'))

  const openCodeTab = (nodeId, nodeName, nodeType) => {
    const existingTab = tabs.value.find((tab) => tab.id === nodeId)
    if (!existingTab) {
      const language = nodeType === 'java' ? 'java' : 'python'
      tabs.value.push({
        id: nodeId,
        title: nodeName,
        type: 'code',
        nodeId,
        language,
      })

      const node = graph.value?.getCellById(nodeId)
      if (node && node.data?.config?.code) {
        codeContents.value[nodeId] = node.data.config.code
      } else {
        codeContents.value[nodeId] = getDefaultCodeTemplate(nodeType)
      }
      codeModified.value[nodeId] = false
    }
    activeTab.value = nodeId
  }

  const getDefaultCodeTemplate = (nodeType) => {
    return nodeType === 'java' ? '// Java 代码模板' : '# Python 代码模板'
  }

  const saveCode = (nodeId) => {
    const node = graph.value?.getCellById(nodeId)
    if (node) {
      const currentData = node.getData()
      node.setData({
        ...currentData,
        config: { ...currentData.config, code: codeContents.value[nodeId] },
      })
      codeModified.value[nodeId] = false
      ElMessage.success('代码已保存')
    }
  }

  const onCodeChange = (nodeId) => {
    codeModified.value[nodeId] = true
  }

  const closeCodeTab = async (tabId) => {
    if (codeModified.value[tabId]) {
      try {
        await ElMessageBox.confirm('代码未保存，确定要关闭吗？', '提示', {
          confirmButtonText: '保存并关闭',
          cancelButtonText: '取消',
          type: 'warning',
        })
        await saveCode(tabId)
        performCloseTab(tabId)
      } catch {
        return
      }
    } else {
      performCloseTab(tabId)
    }
  }

  const performCloseTab = (tabId) => {
    const index = tabs.value.findIndex((tab) => tab.id === tabId)
    if (index !== -1) {
      tabs.value.splice(index, 1)
      delete codeContents.value[tabId]
      delete codeModified.value[tabId]
      delete editorRefs.value[tabId]
      if (activeTab.value === tabId) {
        activeTab.value = 'main'
      }
    }
  }

  const formatCode = (nodeId) => {
    const editor = editorRefs.value[nodeId]
    if (editor?.format) {
      editor.format()
      ElMessage.success('代码已格式化')
    }
  }

  return {
    tabs,
    activeTab,
    codeTabs,
    codeContents,
    editorRefs,
    codeModified,
    editorTheme,
    openCodeTab,
    saveCode,
    onCodeChange,
    closeCodeTab,
    formatCode,
  }
}
