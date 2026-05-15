<template>
  <div class="api-gateway-config">
    <el-form label-width="100px" size="small">
      <el-form-item label="API路径" required>
        <el-input v-model="localConfig.path" placeholder="/api/chat" />
        <div class="form-tip">对外暴露的API地址</div>
      </el-form-item>

      <el-form-item label="协议类型">
        <el-select v-model="localConfig.protocol" @change="onProtocolChange">
          <el-option-group label="传统 API">
            <el-option label="REST API" value="rest" />
            <el-option label="Stream API (SSE)" value="stream" />
          </el-option-group>
          <el-option-group label="AI 协议">
            <el-option label="MCP (Claude)" value="mcp" />
            <el-option label="Function Calling (OpenAI)" value="function" />
            <el-option label="Agent Skill (通用)" value="skill" />
          </el-option-group>
          <el-option-group label="网络穿透">
            <el-option label="WebSocket (内外网互通)" value="websocket" />
          </el-option-group>
        </el-select>
      </el-form-item>

      <!-- REST API 配置 -->
      <template v-if="localConfig.protocol === 'rest'">
        <el-form-item label="请求方法">
          <el-select v-model="localConfig.method">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
        </el-form-item>
      </template>

      <!-- Stream API 配置 -->
      <template v-if="localConfig.protocol === 'stream'">
        <el-form-item label="流式类型">
          <el-select v-model="localConfig.streamType">
            <el-option label="SSE (Server-Sent Events)" value="sse" />
            <el-option label="Chunked Transfer" value="chunked" />
          </el-select>
        </el-form-item>
        <el-form-item label="心跳间隔(ms)">
          <el-input-number v-model="localConfig.heartbeat" :min="0" :max="30000" />
        </el-form-item>
      </template>

      <!-- WebSocket 配置 -->
      <template v-if="localConfig.protocol === 'websocket'">
        <el-form-item label="连接模式">
          <el-radio-group
            v-model="localConfig.wsMode"
            @update:model-value="(val) => updateConfig('wsMode', val)"
          >
            <el-radio value="server">服务端模式（等待连接）</el-radio>
            <el-radio value="client">客户端模式（主动连接）</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="localConfig.wsMode === 'client'">
          <el-form-item label="目标地址">
            <el-input v-model="localConfig.wsTargetUrl" placeholder="ws://your-server.com/ws" />
          </el-form-item>
        </template>
        <el-form-item label="认证方式">
          <el-select v-model="localConfig.wsAuth">
            <el-option label="无认证" value="none" />
            <el-option label="Token" value="token" />
            <el-option label="API Key" value="apikey" />
          </el-select>
        </el-form-item>
      </template>

      <!-- AI 工具通用配置 -->
      <template v-if="isAiProtocol">
        <el-divider>AI 工具配置</el-divider>
        <el-form-item label="工具名称" required>
          <el-input v-model="localConfig.toolName" placeholder="query_weather" />
          <div class="form-tip">AI 调用时使用的函数名</div>
        </el-form-item>

        <el-form-item label="工具描述" required>
          <el-input
            v-model="localConfig.toolDescription"
            type="textarea"
            :rows="2"
            placeholder="查询指定城市的天气信息"
          />
          <div class="form-tip">AI 理解这个工具用途的描述</div>
        </el-form-item>

        <el-form-item label="参数定义">
          <MonacoEditor
            :model-value="inputSchemaString"
            @update:model-value="updateInputSchema"
            language="json"
            height="200px"
          />
          <div class="form-tip">JSON Schema 格式，定义输入参数</div>
        </el-form-item>
      </template>
    </el-form>
  </div>
</template>

<script setup>
import MonacoEditor from '@/components/common/MonacoEditor.vue'
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  nodeType: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const localConfig = computed({
  get: () => ({
    path: props.modelValue.path || '',
    protocol: props.modelValue.protocol || 'rest',
    method: props.modelValue.method || 'POST',
    streamType: props.modelValue.streamType || 'see',
    heartbeat: props.modelValue.heartbeat || 5000,
    wsMode: props.modelValue.wsMode || 'server',
    wsTargetUrl: props.modelValue.wsTargetUrl || '',
    wsAuth: props.modelValue.wsAuth || 'none',
    toolName: props.modelValue.toolName || '',
    toolDescription: props.modelValue.toolDescription || '',
    inputSchema: props.modelValue.inputSchema || {
      type: 'object',
      properties: {},
      required: [],
    },
  }),
  set: (val) => {
    emit('update:modelValue', { ...props.modelValue, ...val })
  },
})

const isAiProtocol = computed(() => {
  return ['mcp', 'function', 'skill'].includes(localConfig.value.protocol)
})

const onProtocolChange = () => {
  // 切换协议时重置相关配置
  if (localConfig.value.protocol === 'rest') {
    localConfig.value.method = 'POST'
  } else if (localConfig.value.protocol === 'stream') {
    localConfig.value.streamType = 'sse'
  } else if (localConfig.value.protocol === 'websocket') {
    localConfig.value.wsMode = 'server'
  } else {
    localConfig.value.toolName = ''
    localConfig.value.toolDescription = ''
  }
}

// 添加这两个 computed
const inputSchemaString = computed({
  get: () => {
    const schema = localConfig.value.inputSchema
    if (typeof schema === 'string') return schema
    return JSON.stringify(schema || { type: 'object', properties: {}, required: [] }, null, 2)
  },
  set: (val) => {
    try {
      const parsed = JSON.parse(val)
      localConfig.value = { ...localConfig.value, inputSchema: parsed }
    } catch (e) {
      // 忽略无效的 JSON
    }
  },
})

const updateInputSchema = (value) => {
  inputSchemaString.value = value
}

const updateConfig = (key, value) => {
  localConfig.value = { ...localConfig.value, [key]: value }
}
</script>

<style scoped>
.api-gateway-config {
  padding: 8px 0;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
