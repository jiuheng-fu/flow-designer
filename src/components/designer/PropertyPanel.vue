<template>
  <div class="property-panel" v-if="selectedNode || selectedEdge">
    <div class="panel-header">
      <h3>属性配置</h3>
      <!-- <el-button text @click="close">
        <el-icon><Close /></el-icon>
      </el-button> -->
    </div>

    <div class="panel-content">
      <!-- 连线配置 -->
      <div v-if="selectedEdge" class="edge-config">
        <h4>连线配置</h4>
        <el-form :model="edgeForm" label-width="80px" size="small">
          <el-form-item label="条件表达式">
            <el-input
              v-model="edgeForm.condition"
              type="textarea"
              :rows="3"
              placeholder="例如: output.status == 'success'"
            />
            <div class="form-tip">支持 JavaScript 表达式，返回 true/false</div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveEdge">保存</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 节点配置 -->
      <div v-else-if="selectedNode" class="node-config">
        <el-tabs v-model="activeTab">
          <!-- 基本配置 -->
          <el-tab-pane label="基本配置" name="basic">
            <el-form :model="nodeForm" label-width="80px" size="small">
              <el-form-item label="节点名称">
                <el-input v-model="nodeForm.name" placeholder="请输入节点名称" />
              </el-form-item>

              <el-form-item label="节点类型">
                <el-tag size="small">{{ nodeTypeName }}</el-tag>
              </el-form-item>

              <el-form-item label="执行类型">
                <el-select v-model="nodeForm.executeType">
                  <el-option label="同步" value="SYNC" />
                  <el-option label="异步" value="ASYNC" />
                </el-select>
              </el-form-item>

              <el-form-item label="重试次数">
                <el-input-number v-model="nodeForm.retryCount" :min="0" :max="5" />
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- API 配置（入口组件专用） -->
          <el-tab-pane v-if="isGatewayNode" label="API配置" name="api">
            <ApiGatewayConfig v-model="nodeForm.config" :node-type="selectedNode.type" />
          </el-tab-pane>

          <!-- 参数配置（普通节点） -->
          <el-tab-pane v-if="hasConfig && !isGatewayNode" label="参数配置" name="params">
            <div v-for="field in configFields" :key="field.name" class="config-field">
              <div class="field-label">{{ field.label }}</div>
              <div class="field-value">
                <el-input
                  v-if="field.type === 'text'"
                  v-model="nodeForm.config[field.name]"
                  :placeholder="field.placeholder"
                />
                <el-select
                  v-else-if="field.type === 'select'"
                  v-model="nodeForm.config[field.name]"
                  :placeholder="field.placeholder"
                >
                  <el-option v-for="opt in field.options" :key="opt" :label="opt" :value="opt" />
                </el-select>
                <el-input
                  v-else-if="field.type === 'textarea'"
                  type="textarea"
                  :model-value="getTextValue(nodeForm.config[field.name])"
                  @update:model-value="(val) => setTextValue(field.name, val)"
                  :rows="4"
                  :placeholder="field.placeholder"
                />
              </div>
            </div>
          </el-tab-pane>

          <!-- 高级配置 -->
          <el-tab-pane label="高级配置" name="advanced">
            <el-form :model="nodeForm" label-width="100px" size="small">
              <el-form-item label="超时时间(ms)" v-if="nodeForm.executeType === 'ASYNC'">
                <el-input-number v-model="nodeForm.asyncConfig.timeout" :min="1000" :max="60000" />
              </el-form-item>
              <el-form-item label="描述">
                <el-input
                  v-model="nodeForm.description"
                  type="textarea"
                  :rows="2"
                  placeholder="节点描述（可选）"
                />
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>

        <div class="panel-footer">
          <el-button type="primary" @click="saveNode">保存配置</el-button>
          <el-button @click="close">取消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import ApiGatewayConfig from './components/ApiGatewayConfig.vue'

const props = defineProps({
  selectedNode: {
    type: Object,
    default: null,
  },
  selectedEdge: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['save', 'save-edge', 'close'])

const activeTab = ref('basic')

// 节点表单
const nodeForm = ref({
  name: '',
  config: {},
  executeType: 'SYNC',
  asyncConfig: { timeout: 30000 },
  retryCount: 0,
  description: '',
})

// 连线表单
const edgeForm = ref({
  condition: '',
})

// 节点类型名称映射
const nodeTypeName = computed(() => {
  const types = {
    // 入口组件
    'api-gateway': 'API网关',
    'rest-api': 'REST API',
    'stream-api': '流式API',
    'websocket-api': 'WebSocket',
    'mcp-tool': 'MCP工具',
    'function-call': 'Function Calling',
    'agent-skill': 'Agent技能',
    // 数据源
    http: 'HTTP请求',
    database: '数据库查询',
    redis: 'Redis缓存',
    // 处理器
    transform: '数据转换',
    filter: '条件过滤',
    merge: '数据合并',
    aggregate: '聚合计算',
    // 逻辑控制
    condition: '条件判断',
    router: '路由分发',
    parallel: '并行执行',
    // 代码执行
    java: 'Java代码',
    python: 'Python代码',
    javascript: 'JavaScript',
    // 输出
    response: 'HTTP响应',
    webhook: 'Webhook',
    mq: '消息队列',
    // AI
    'ai-chat': 'AI对话',
    'ai-embedding': '向量化',
    'ai-rag': '知识库检索',
  }
  return types[props.selectedNode?.type] || props.selectedNode?.type || '未知节点'
})

// 判断是否为入口组件
const isGatewayNode = computed(() => {
  const gatewayTypes = [
    'rest-api',
    'stream-api',
    'websocket-api',
    'mcp-tool',
    'function-call',
    'agent-skill',
  ]
  return gatewayTypes.includes(props.selectedNode?.type)
})

// 是否有参数配置
const hasConfig = computed(() => {
  return configFields.value.length > 0
})

// 配置字段映射
const configFields = computed(() => {
  const normalConfig = {
    http: [
      {
        name: 'url',
        label: '请求URL',
        type: 'text',
        placeholder: 'https://api.example.com/endpoint',
      },
      {
        name: 'method',
        label: '请求方法',
        type: 'select',
        options: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      {
        name: 'headers',
        label: '请求头',
        type: 'textarea',
        placeholder: '{"Content-Type": "application/json"}',
      },
      { name: 'body', label: '请求体', type: 'textarea', placeholder: '{"key": "value"}' },
      { name: 'timeout', label: '超时时间(ms)', type: 'text', placeholder: '30000' },
    ],
    database: [
      {
        name: 'dbType',
        label: '数据库类型',
        type: 'select',
        options: ['mysql', 'postgresql', 'oracle'],
      },
      { name: 'host', label: '主机', type: 'text', placeholder: 'localhost' },
      { name: 'port', label: '端口', type: 'text', placeholder: '3306' },
      { name: 'database', label: '数据库名', type: 'text', placeholder: 'mydb' },
      { name: 'username', label: '用户名', type: 'text' },
      { name: 'password', label: '密码', type: 'text' },
      {
        name: 'sql',
        label: 'SQL语句',
        type: 'textarea',
        placeholder: 'SELECT * FROM users WHERE id = :id',
      },
    ],
    transform: [
      { name: 'mapping', label: '字段映射', type: 'code', language: 'json' },
      { name: 'expression', label: '表达式', type: 'textarea' },
    ],
    filter: [
      {
        name: 'condition',
        label: '过滤条件',
        type: 'textarea',
        placeholder: 'value > 10 && value < 100',
      },
    ],
    condition: [
      {
        name: 'conditionType',
        label: '判断方式',
        type: 'select',
        options: ['java', 'python', 'javascript', 'rule'],
      },
      { name: 'conditionScript', label: '脚本内容', type: 'code', language: 'javascript' },
    ],
    response: [
      { name: 'statusCode', label: '状态码', type: 'text', placeholder: '200' },
      { name: 'headers', label: '响应头', type: 'code', language: 'json' },
      { name: 'body', label: '响应体', type: 'code', language: 'json' },
    ],
    'ai-chat': [
      {
        name: 'model',
        label: '模型',
        type: 'select',
        options: ['gpt-4', 'gpt-3.5-turbo', 'claude-3'],
      },
      { name: 'prompt', label: '提示词', type: 'textarea', rows: 4 },
      { name: 'temperature', label: '温度', type: 'text', placeholder: '0.7' },
      { name: 'maxTokens', label: '最大Token', type: 'text', placeholder: '2000' },
    ],
  }

  const codeNodeConfig = {
    java: [
      { name: 'className', label: '类名', type: 'text', placeholder: 'CustomNode' },
      { name: 'methodName', label: '方法名', type: 'text', placeholder: 'execute' },
    ],
    python: [{ name: 'functionName', label: '函数名', type: 'text', placeholder: 'execute' }],
    javascript: [{ name: 'functionName', label: '函数名', type: 'text', placeholder: 'execute' }],
  }

  const nodeType = props.selectedNode?.type

  if (codeNodeConfig[nodeType]) {
    return codeNodeConfig[nodeType]
  }

  return normalConfig[nodeType] || []
})

// 监听选中节点变化
watch(
  () => props.selectedNode,
  (node) => {
    if (node) {
      nodeForm.value = {
        name: node.data?.name || node.name || '',
        config: node.data?.config || {},
        executeType: node.data?.executeType || 'SYNC',
        asyncConfig: node.data?.asyncConfig || { timeout: 30000 },
        retryCount: node.data?.retryCount || 0,
        description: node.data?.description || '',
      }
    }
  },
  { immediate: true, deep: true },
)

// 监听选中连线变化
watch(
  () => props.selectedEdge,
  (edge) => {
    if (edge) {
      edgeForm.value = {
        condition: edge.data?.condition || '',
      }
    }
  },
  { immediate: true },
)

const saveNode = () => {
  emit('save', nodeForm.value)
}

const saveEdge = () => {
  emit('save-edge', edgeForm.value)
}

const close = () => {
  emit('close')
}

// 获取文本值（用于 textarea 显示）
const getTextValue = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value

  if (typeof value === 'object') {
    // 空对象或空数组显示空白
    if (Object.keys(value).length === 0) {
      return ''
    }
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

// 更新文本值（保存到 config）
const setTextValue = (fieldName, value) => {
  // 空字符串不解析，直接设为空对象
  if (!value || value.trim() === '') {
    nodeForm.value.config[fieldName] = {}
    return
  }

  try {
    const parsed = JSON.parse(value)
    nodeForm.value.config[fieldName] = parsed
  } catch (e) {
    // 不是有效 JSON，保持字符串
    nodeForm.value.config[fieldName] = value
  }
}
</script>

<style scoped>
.property-panel {
  width: 360px;
  height: 100%;
  background: #fff;
  border-left: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.config-field {
  margin-bottom: 16px;
}

.field-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.field-value {
  width: 100%;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.panel-footer {
  padding: 16px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}

.edge-config h4,
.node-config h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-tabs__header) {
  margin-bottom: 16px;
}

:deep(.el-tabs__content) {
  padding: 0;
}
</style>
