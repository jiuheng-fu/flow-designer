// 节点默认样式
export const defaultNodeStyle = {
  body: {
    fill: '#fff',
    stroke: '#d9d9d9',
    strokeWidth: 2,
    rx: 6,
    ry: 6,
  },
  label: {
    fill: '#333',
    fontSize: 12,
    refX: '50%',
    refY: 30,
    textAnchor: 'middle',
  },
  icon: {
    fontSize: 24,
    refX: 20,
    refY: 40,
    textAnchor: 'middle',
  },
}

// 各节点类型的主题色（边框颜色 + 图标）
export const nodeThemes = {
  // 入口组件
  'rest-api': { stroke: '#eb2f96', icon: '📡', label: 'REST API', portType: 'onlyout' },
  'stream-api': { stroke: '#13c2c2', icon: '🌊', label: 'Stream API', portType: 'onlyout' },
  'websocket-api': { stroke: '#722ed1', icon: '🔌', label: 'WebSocket', portType: 'onlyout' },
  'mcp-tool': { stroke: '#1890ff', icon: '🤖', label: 'MCP Tool', portType: 'onlyout' },
  'function-call': { stroke: '#fa8c16', icon: '⚡', label: 'Function Call', portType: 'onlyout' },
  'agent-skill': { stroke: '#52c41a', icon: '🧠', label: 'Agent Skill', portType: 'onlyout' },

  // 数据源
  http: { stroke: '#1890ff', icon: '🌐', label: 'HTTP请求', portType: 'default' },
  database: { stroke: '#13c2c2', icon: '🗄️', label: '数据库查询', portType: 'default' },
  redis: { stroke: '#f50', icon: '⚡', label: 'Redis缓存', portType: 'default' },

  // 处理器
  transform: { stroke: '#2f54eb', icon: '🔄', label: '数据转换', portType: 'default' },
  filter: { stroke: '#faad14', icon: '🔍', label: '条件过滤', portType: 'default' },
  merge: { stroke: '#722ed1', icon: '🔗', label: '数据合并', portType: 'default' },
  aggregate: { stroke: '#eb2f96', icon: '📊', label: '聚合计算', portType: 'default' },

  // 逻辑控制
  condition: { stroke: '#fa8c16', icon: '🔀', label: '条件判断', portType: 'default' },
  router: { stroke: '#13c2c2', icon: '🚦', label: '路由分发', portType: 'default' },
  parallel: { stroke: '#52c41a', icon: '⚡', label: '并行执行', portType: 'default' },

  // 代码执行
  java: { stroke: '#722ed1', icon: '☕', label: 'Java代码', portType: 'default' },
  python: { stroke: '#13c2c2', icon: '🐍', label: 'Python代码', portType: 'default' },
  javascript: { stroke: '#f7b731', icon: '📜', label: 'JavaScript', portType: 'default' },

  // 输出
  response: { stroke: '#52c41a', icon: '📡', label: 'HTTP响应', portType: 'onlyinput' },
  webhook: { stroke: '#1890ff', icon: '🔔', label: 'Webhook', portType: 'onlyinput' },
  mq: { stroke: '#fa8c16', icon: '📨', label: '消息队列', portType: 'onlyinput' },
}

// 端口配置（可复用）
export const defaultPorts = {
  groups: {
    input: {
      position: { name: 'left' },
      attrs: {
        circle: {
          r: 6,
          magnet: true,
          fill: '#52c41a',
          stroke: '#fff',
          strokeWidth: 2,
        },
      },
      label: { position: 'left', text: 'in' },
    },
    output: {
      position: { name: 'right' },
      attrs: {
        circle: {
          r: 6,
          magnet: true,
          fill: '#1890ff',
          stroke: '#fff',
          strokeWidth: 2,
        },
      },
      label: { position: 'right', text: 'out' },
    },
  },
  items: [
    { group: 'input', id: 'in1' },
    { group: 'output', id: 'out1' },
  ],
}

// 只有输出的端口（用于入口节点）
export const outputOnlyPorts = {
  groups: {
    output: {
      position: { name: 'right' },
      attrs: {
        circle: {
          r: 6,
          magnet: true,
          fill: '#1890ff',
          stroke: '#fff',
          strokeWidth: 2,
        },
      },
      label: { position: 'right', text: 'out' },
    },
  },
  items: [{ group: 'output', id: 'out1' }],
}

// 只有输入的端口（用于响应节点）
export const inputOnlyPorts = {
  groups: {
    input: {
      position: { name: 'left' },
      attrs: {
        circle: {
          r: 6,
          magnet: true,
          fill: '#52c41a',
          stroke: '#fff',
          strokeWidth: 2,
        },
      },
      label: { position: 'left', text: 'in' },
    },
  },
  items: [{ group: 'input', id: 'in1' }],
}

export const getPortsByType = (portType) => {
  if (portType === 'onlyout') return outputOnlyPorts
  if (portType === 'onlyinput') return inputOnlyPorts
  return defaultPorts
}

// 生成节点配置
export const createNodeConfig = (type) => {
  const theme = nodeThemes[type]
  if (!theme) return null

  const portType = theme.portType || 'default'

  return {
    inherit: 'rect',
    width: 180,
    height: 80,
    attrs: {
      body: {
        ...defaultNodeStyle.body,
        stroke: theme.stroke,
      },
      label: {
        ...defaultNodeStyle.label,
        text: theme.label,
      },
      icon: {
        ...defaultNodeStyle.icon,
        text: theme.icon,
      },
    },
    ports: getPortsByType(portType),
  }
}
