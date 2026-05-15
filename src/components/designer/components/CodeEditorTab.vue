<template>
  <div class="code-editor-container">
    <div class="code-editor-header">
      <div class="code-editor-info">
        <span class="code-title">{{ tab.title }}</span>
        <el-tag size="small" :type="tab.language === 'java' ? 'danger' : 'success'">
          {{ tab.language === 'java' ? 'Java' : 'Python' }}
        </el-tag>
      </div>
      <div class="code-editor-actions">
        <el-button size="small" @click="$emit('format')">格式化代码</el-button>
        <el-button size="small" @click="$emit('find-replace')">查找替换</el-button>
        <el-button size="small" type="primary" @click="$emit('save')">保存代码 (Ctrl+S)</el-button>
      </div>
    </div>
    <div class="code-editor-wrapper">
      <MonacoEditor
        :ref="(el) => setEditorRef(el)"
        v-model="localCode"
        :language="tab.language"
        height="100%"
        theme="vs-dark"
        @save="$emit('save')"
        @change="$emit('change')"
      />
    </div>
  </div>
</template>

<script setup>
import MonacoEditor from '@/components/common/MonacoEditor.vue'
import { computed } from 'vue'

const props = defineProps({
  tab: { type: Object, required: true },
  code: { type: String, default: '' },
  editorRefs: { type: Object, required: true },
})

const emit = defineEmits(['update:code', 'format', 'find-replace', 'save', 'change'])

const localCode = computed({
  get: () => props.code,
  set: (val) => emit('update:code', val),
})

const setEditorRef = (el) => {
  if (el && props.tab.nodeId) {
    props.editorRefs[props.tab.nodeId] = el
  }
}
</script>

<style scoped>
.code-editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;
}
.code-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #2d2d2d;
  border-bottom: 1px solid #3e3e3e;
}
.code-editor-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.code-title {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}
.code-editor-actions {
  display: flex;
  gap: 8px;
}
.code-editor-wrapper {
  flex: 1;
  min-height: 0;
  width: 100%;
  position: relative;
}
</style>
