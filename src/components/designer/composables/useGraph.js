// composables/useGraph.js
import { Graph } from '@antv/x6'
import { ref } from 'vue'

export function useGraph(canvasRef) {
  const graph = ref(null) // 改为 ref，方便共享

  const initGraph = () => {
    if (!canvasRef.value) {
      console.error('canvasRef is null!')
      return null
    }

    graph.value = new Graph({
      container: canvasRef.value,
      width: canvasRef.value.clientWidth,
      height: canvasRef.value.clientHeight,
      grid: { size: 10, visible: true },
      background: { color: '#fafafa' },
      scroller: { enabled: true, pannable: true },
      mousewheel: { enabled: true, zoomAtMousePosition: true },
      connecting: {
        connector: 'smooth',
        allowBlank: false,
        allowLoop: false,
        allowMulti: false,
        allowEdge: false,
        highlight: true,
        snap: { radius: 20 },
        createEdge() {
          return this.createEdge({
            shape: 'edge',
            attrs: {
              line: {
                stroke: '#1890ff',
                strokeWidth: 2,
                targetMarker: { name: 'block', width: 8, height: 8 },
              },
            },
            zIndex: 1,
          })
        },
        validateMagnet({ magnet }) {
          return magnet.getAttribute('port') !== null
        },
        validateConnection({ sourceMagnet, targetMagnet }) {
          const sourcePort = sourceMagnet?.getAttribute('port')
          const targetPort = targetMagnet?.getAttribute('port')
          if (!sourcePort || !targetPort) return false
          return sourcePort.startsWith('out') && targetPort.startsWith('in')
        },
      },
      highlighting: {
        // ✅ 节点选中高亮
        node: {
          name: 'stroke',
          args: {
            padding: 0,
            attrs: {
              'stroke-width': 3,
              stroke: '#1890ff',
            },
          },
        },
        // ✅ 连线选中高亮
        edge: {
          name: 'stroke',
          args: {
            attrs: {
              'stroke-width': 3,
              stroke: '#ff4d4f',
            },
          },
        },
        magnet: {
          name: 'stroke',
          args: { padding: 4, attrs: { 'stroke-width': 3, stroke: '#52c41a' } },
        },
      },
      history: { enabled: true },
    })

    return graph.value
  }

  const disposeGraph = () => {
    if (graph.value) {
      graph.value.dispose()
      graph.value = null
    }
  }

  const getGraph = () => graph.value

  return { graph, initGraph, disposeGraph, getGraph }
}
