<template>
  <div class="component-palette">
    <div class="palette-header">
      <h3>组件库</h3>
      <el-input
        v-model="searchText"
        placeholder="搜索组件"
        prefix-icon="Search"
        size="small"
        clearable
      />
    </div>

    <div class="palette-content">
      <div v-for="group in filteredGroups" :key="group.name" class="component-group">
        <div class="group-title">
          <span>{{ group.name }}</span>
          <el-badge v-if="group.badge" :value="group.badge" class="group-badge" />
        </div>
        <div class="group-items">
          <div
            v-for="comp in group.components"
            :key="comp.type"
            class="component-item"
            :class="{ 'is-ai': comp.category === 'ai' }"
            draggable="true"
            @dragstart="onDragStart($event, comp)"
          >
            <span class="component-icon">{{ comp.icon }}</span>
            <div class="component-info">
              <div class="component-name">
                {{ comp.name }}
                <el-tag
                  v-if="comp.badge"
                  :type="comp.badgeType || 'info'"
                  size="small"
                  class="component-tag"
                >
                  {{ comp.badge }}
                </el-tag>
              </div>
              <div class="component-description">{{ comp.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const emit = defineEmits(['drag-start'])

const searchText = ref('')

const componentGroups = [
  // ==================== 入口组件（最重要！） ====================
  {
    name: '🚪 入口组件',
    badge: '核心',
    components: [
      {
        type: 'rest-api',
        name: 'REST API',
        icon: '📡',
        category: 'gateway',
        badge: 'HTTP',
        description: '标准RESTful API入口',
        protocols: ['rest'],
      },
      {
        type: 'stream-api',
        name: '流式API',
        icon: '🌊',
        category: 'gateway',
        badge: 'SSE',
        description: 'SSE流式输出，适合AI对话',
        protocols: ['stream'],
      },
      {
        type: 'websocket-api',
        name: 'WebSocket',
        icon: '🔌',
        category: 'gateway',
        badge: '双向',
        description: 'WebSocket长连接，支持内外网穿透',
        protocols: ['websocket'],
      },
      {
        type: 'mcp-tool',
        name: 'MCP工具',
        icon: '🤖',
        category: 'gateway',
        badge: 'AI',
        badgeType: 'success',
        description: '发布为MCP Tool，供Claude调用',
        protocols: ['mcp'],
      },
      // {
      //   type: 'function-call',
      //   name: 'Function Calling',
      //   icon: '⚡',
      //   category: 'gateway',
      //   badge: 'OpenAI',
      //   badgeType: 'success',
      //   description: 'OpenAI Function Calling接口',
      //   protocols: ['function'],
      // },
      // {
      //   type: 'agent-skill',
      //   name: 'Agent技能',
      //   icon: '🧠',
      //   category: 'gateway',
      //   badge: 'Skill',
      //   badgeType: 'success',
      //   description: '通用Agent技能接口',
      //   protocols: ['skill'],
      // },
    ],
  },

  // ==================== 数据源 ====================
  {
    name: '🗄️ 数据源',
    components: [
      {
        type: 'http',
        name: 'HTTP请求',
        icon: '🌐',
        category: 'source',
        description: '发送HTTP请求，调用外部API',
      },
      {
        type: 'database',
        name: '数据库查询',
        icon: '🗄️',
        category: 'source',
        description: '查询数据库，支持MySQL/PostgreSQL/Oracle',
      },
      {
        type: 'redis',
        name: 'Redis缓存',
        icon: '⚡',
        category: 'source',
        description: '读写Redis缓存',
      },
      {
        type: 'graphql',
        name: 'GraphQL',
        icon: '📊',
        category: 'source',
        description: 'GraphQL查询',
      },
    ],
  },

  // ==================== 处理器 ====================
  {
    name: '⚙️ 处理器',
    components: [
      {
        type: 'transform',
        name: '数据转换',
        icon: '🔄',
        category: 'processor',
        description: '字段映射、格式转换',
      },
      {
        type: 'filter',
        name: '条件过滤',
        icon: '🔍',
        category: 'processor',
        description: '过滤数据',
      },
      {
        type: 'merge',
        name: '数据合并',
        icon: '🔗',
        category: 'processor',
        description: '合并多个数据源',
      },
      {
        type: 'aggregate',
        name: '聚合计算',
        icon: '📊',
        category: 'processor',
        description: '求和、平均、计数',
      },
      {
        type: 'validate',
        name: '数据校验',
        icon: '✅',
        category: 'processor',
        description: '校验数据格式、必填字段',
      },
    ],
  },

  // ==================== 逻辑控制 ====================
  {
    name: '🎮 逻辑控制',
    components: [
      {
        type: 'condition',
        name: '条件判断',
        icon: '🔀',
        category: 'control',
        badge: '脚本',
        description: 'Java/Python/JS脚本判断',
      },
      {
        type: 'router',
        name: '路由分发',
        icon: '🚦',
        category: 'control',
        description: '动态路由到不同分支',
      },
      {
        type: 'parallel',
        name: '并行执行',
        icon: '⚡',
        category: 'control',
        description: '多分支并行执行',
      },
      {
        type: 'loop',
        name: '循环',
        icon: '🔄',
        category: 'control',
        description: '遍历数组或循环执行',
      },
      {
        type: 'delay',
        name: '延迟',
        icon: '⏰',
        category: 'control',
        description: '延迟执行，等待指定时间',
      },
    ],
  },

  // ==================== 代码执行 ====================
  {
    name: '💻 代码执行',
    components: [
      {
        type: 'java',
        name: 'Java代码',
        icon: '☕',
        category: 'code',
        badge: '在线编译',
        description: '编写Java代码，动态编译执行',
      },
      {
        type: 'python',
        name: 'Python代码',
        icon: '🐍',
        category: 'code',
        badge: '在线执行',
        description: '编写Python代码',
      },
      {
        type: 'javascript',
        name: 'JavaScript',
        icon: '📜',
        category: 'code',
        description: '编写JS代码',
      },
      {
        type: 'groovy',
        name: 'Groovy脚本',
        icon: '📝',
        category: 'code',
        description: 'Groovy脚本，轻量级',
      },
    ],
  },

  // ==================== AI 能力 ====================
  {
    name: '🤖 AI 能力',
    badge: '新',
    components: [
      {
        type: 'ai-chat',
        name: 'AI对话',
        icon: '💬',
        category: 'ai',
        badge: 'GPT/Claude',
        badgeType: 'success',
        description: '调用大语言模型对话',
      },
      {
        type: 'ai-embedding',
        name: '向量化',
        icon: '🔢',
        category: 'ai',
        description: '文本向量化，用于RAG',
      },
      {
        type: 'ai-rag',
        name: '知识库检索',
        icon: '📚',
        category: 'ai',
        badge: 'RAG',
        description: '向量数据库检索',
      },
      {
        type: 'ai-vision',
        name: '图像识别',
        icon: '👁️',
        category: 'ai',
        description: '图像识别、OCR',
      },
    ],
  },

  // ==================== 输出 ====================
  {
    name: '📤 输出',
    components: [
      {
        type: 'response',
        name: 'HTTP响应',
        icon: '📡',
        category: 'sink',
        description: '返回HTTP响应结果',
      },
      {
        type: 'webhook',
        name: 'Webhook',
        icon: '🔔',
        category: 'sink',
        description: '推送通知到Webhook地址',
      },
      {
        type: 'mq',
        name: '消息队列',
        icon: '📨',
        category: 'sink',
        description: '发送消息到MQ',
      },
      {
        type: 'file',
        name: '文件输出',
        icon: '📁',
        category: 'sink',
        description: '写入文件',
      },
    ],
  },
]

const filteredGroups = computed(() => {
  if (!searchText.value) return componentGroups

  const searchLower = searchText.value.toLowerCase()

  return componentGroups
    .map((group) => ({
      ...group,
      components: group.components.filter(
        (comp) =>
          comp.name.toLowerCase().includes(searchLower) ||
          comp.type.toLowerCase().includes(searchLower) ||
          comp.description?.toLowerCase().includes(searchLower),
      ),
    }))
    .filter((group) => group.components.length > 0)
})

const onDragStart = (event, component) => {
  // 设置拖拽数据
  const dragData = {
    type: component.type,
    name: component.name,
    category: component.category,
    icon: component.icon,
    config: getDefaultConfig(component.type),
  }

  event.dataTransfer.setData('application/json', JSON.stringify(dragData))
  event.dataTransfer.effectAllowed = 'copy'

  // 设置拖拽图标
  if (event.dataTransfer.setDragImage) {
    const dragIcon = document.createElement('div')
    dragIcon.textContent = component.icon
    dragIcon.style.position = 'absolute'
    dragIcon.style.top = '-1000px'
    document.body.appendChild(dragIcon)
    event.dataTransfer.setDragImage(dragIcon, 10, 10)
    setTimeout(() => document.body.removeChild(dragIcon), 0)
  }

  emit('drag-start', dragData)
}

// 根据组件类型获取默认配置
const getDefaultConfig = (type) => {
  const configs = {
    // 入口组件
    'rest-api': {
      path: '/api/rest',
      method: 'POST',
      protocol: 'rest',
    },
    'stream-api': {
      path: '/api/stream',
      streamType: 'sse',
      heartbeat: 5000,
      protocol: 'stream',
    },
    'websocket-api': {
      path: '/ws',
      wsMode: 'client',
      wsAuth: 'none',
      protocol: 'websocket',
    },
    'mcp-tool': {
      toolName: '',
      toolDescription: '',
      inputSchema: {},
      transportType: 'sse',
      protocol: 'mcp',
    },
    // 'function-call': {
    //   functionName: '',
    //   functionDescription: '',
    //   parameters: {},
    // },
    // 'agent-skill': {
    //   skillName: '',
    //   skillDescription: '',
    //   inputSchema: {},
    // },
    // 数据源
    http: {
      url: '',
      method: 'GET',
      headers: {},
      body: {},
    },
    database: {
      dbType: 'mysql',
      host: 'localhost',
      port: 3306,
      database: '',
      username: '',
      password: '',
      sql: '',
    },
    // 处理器
    transform: {
      mapping: {},
      expression: '',
    },
    condition: {
      conditionType: 'javascript',
      conditionScript: '',
    },
    // 代码执行
    java: {
      className: 'CustomNode',
      methodName: 'execute',
      code: getDefaultJavaCode(),
    },
    python: {
      functionName: 'execute',
      code: getDefaultPythonCode(),
    },
    // 输出
    response: {
      statusCode: 200,
      headers: {},
      body: {},
    },
  }

  return configs[type] || {}
}

const getDefaultJavaCode = () => {
  return `// Java 代码模板
// 输入参数: Map<String, Object> input
// 返回值: Object

Map<String, Object> result = new HashMap<>();
result.put("message", "Hello from Java!");
result.put("input", input);
result.put("timestamp", System.currentTimeMillis());

return result;`
}

const getDefaultPythonCode = () => {
  return `# Python 代码模板
def execute(input):
    result = {
        "message": "Hello from Python!",
        "input": input,
        "timestamp": __import__('time').time()
    }
    return result`
}
</script>

<style scoped>
.component-palette {
  width: 280px;
  height: 100%;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.palette-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.palette-header h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 500;
}

.palette-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.component-group {
  margin-bottom: 20px;
}

.group-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  padding-left: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-badge {
  margin-left: 8px;
}

.group-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: move;
  transition: all 0.2s ease;
}

.component-item:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.component-item.is-ai {
  background: linear-gradient(135deg, #f5f0ff 0%, #faf5ff 100%);
  border-color: #722ed1;
}

.component-item.is-ai:hover {
  background: linear-gradient(135deg, #efe6ff 0%, #f5ebff 100%);
  border-color: #722ed1;
}

.component-icon {
  font-size: 22px;
  min-width: 32px;
  text-align: center;
}

.component-info {
  flex: 1;
  min-width: 0;
}

.component-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.component-tag {
  font-size: 10px;
  transform: scale(0.9);
}

.component-description {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 滚动条样式 */
.palette-content::-webkit-scrollbar {
  width: 6px;
}

.palette-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.palette-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.palette-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
