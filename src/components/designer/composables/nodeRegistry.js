// utils/registerNodes.js
import { Graph } from '@antv/x6'
import { createNodeConfig, nodeThemes } from '../config/nodeStyles'

let registered = false

export function registerNodes() {
  if (registered) {
    console.log('Nodes already registered, skipping...')
    return
  }

  // 遍历所有节点类型并注册
  Object.keys(nodeThemes).forEach((type) => {
    const nodeConfig = createNodeConfig(type)
    if (nodeConfig) {
      Graph.registerNode(`${type}-node`, nodeConfig)
    }
  })

  registered = true
  console.log('All nodes registered successfully')
}
