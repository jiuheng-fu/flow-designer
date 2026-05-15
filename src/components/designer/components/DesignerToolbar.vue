<template>
  <div class="toolbar">
    <el-button size="small" @click="$emit('go-back')" :icon="ArrowLeft">返回</el-button>

    <el-button-group>
      <el-button size="small" @click="$emit('zoom-out')" :icon="ZoomOut" />
      <el-button size="small" disabled>{{ Math.round(zoom * 100) }}%</el-button>
      <el-button size="small" @click="$emit('zoom-in')" :icon="ZoomIn" />
      <el-button size="small" @click="$emit('reset-zoom')" :icon="Refresh" />
    </el-button-group>

    <el-button-group>
      <el-button
        size="small"
        @click="$emit('delete')"
        :disabled="!canDelete"
        type="danger"
        :icon="Delete"
      >
        删除
      </el-button>
    </el-button-group>

    <el-button-group>
      <el-button size="small" @click="$emit('save')" type="primary" :icon="Document"
        >保存</el-button
      >
      <el-button size="small" @click="$emit('publish')" type="success" :icon="Upload"
        >发布</el-button
      >
    </el-button-group>
  </div>
</template>

<script setup>
import {
  ArrowLeft,
  Delete,
  Document,
  Refresh,
  Upload,
  ZoomIn,
  ZoomOut,
} from '@element-plus/icons-vue'

defineProps({
  zoom: { type: Number, default: 1 },
  canDelete: { type: Boolean, default: false },
})

defineEmits(['go-back', 'zoom-in', 'zoom-out', 'reset-zoom', 'delete', 'save', 'publish'])
</script>

<style scoped>
.toolbar {
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  gap: 16px;
  align-items: center;
  flex-shrink: 0;
}
</style>
