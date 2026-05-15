// 节点尺寸配置
export const nodeSizeConfig = {
  'http-node': { width: 180, height: 80 },
  'database-node': { width: 180, height: 80 },
  'redis-node': { width: 180, height: 80 },
  'transform-node': { width: 180, height: 80 },
  'filter-node': { width: 180, height: 80 },
  'merge-node': { width: 180, height: 80 },
  'aggregate-node': { width: 180, height: 80 },
  'condition-node': { width: 180, height: 80 },
  'router-node': { width: 180, height: 80 },
  'parallel-node': { width: 180, height: 80 },
  'java-node': { width: 180, height: 80 },
  'python-node': { width: 180, height: 80 },
  'javascript-node': { width: 180, height: 80 },
  'response-node': { width: 180, height: 80 },
  'webhook-node': { width: 180, height: 80 },
  'mq-node': { width: 180, height: 80 },
  'mcp-node': { width: 180, height: 80 },
  'skill-node': { width: 180, height: 80 },
}

// 获取节点尺寸
export const getNodeSize = (nodeType) => {
  return nodeSizeConfig[nodeType] || { width: 180, height: 80 }
}
