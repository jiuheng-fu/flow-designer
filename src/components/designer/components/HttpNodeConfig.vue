<template>
  <div class="http-node-config">
    <el-form label-width="80px" size="small">
      <el-form-item label="请求URL">
        <el-input v-model="localConfig.url" placeholder="https://api.example.com/endpoint" />
      </el-form-item>

      <el-form-item label="请求方法">
        <el-select v-model="localConfig.method">
          <el-option label="GET" value="GET" />
          <el-option label="POST" value="POST" />
          <el-option label="PUT" value="PUT" />
          <el-option label="DELETE" value="DELETE" />
        </el-select>
      </el-form-item>

      <el-form-item label="请求头">
        <MonacoEditor v-model="localConfig.headers" language="json" height="150px" />
        <div class="form-tip">JSON 格式的请求头</div>
      </el-form-item>

      <el-form-item label="请求体">
        <MonacoEditor v-model="localConfig.body" language="json" height="200px" />
      </el-form-item>

      <el-form-item label="超时时间(ms)">
        <el-input-number v-model="localConfig.timeout" :min="1000" :max="60000" />
      </el-form-item>
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
})

const emit = defineEmits(['update:modelValue'])

const localConfig = computed({
  get: () => ({
    url: props.modelValue.url || '',
    method: props.modelValue.method || 'GET',
    headers: props.modelValue.headers || '{}',
    body: props.modelValue.body || '{}',
    timeout: props.modelValue.timeout || 30000,
  }),
  set: (val) => emit('update:modelValue', val),
})
</script>
