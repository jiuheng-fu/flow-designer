<template>
  <div class="flow-list">
    <div class="header">
      <h2>项目管理</h2>
      <el-button type="primary" @click="createFlow">
        <el-icon><Plus /></el-icon>
        新建项目
      </el-button>
    </div>

    <div class="flow-grid">
      <el-card v-for="flow in flows" :key="flow.id" class="flow-card">
        <div class="flow-info" @click="designFlow(flow.id)">
          <h3>{{ flow.name }}</h3>
          <p>{{ flow.description || '暂无描述' }}</p>
          <div class="flow-meta">
            <el-tag :type="flow.status === 'published' ? 'success' : 'info'" size="small">
              {{ flow.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
            <span>版本: v{{ flow.version }}</span>
            <span>更新于: {{ formatDate(flow.updatedAt) }}</span>
          </div>
        </div>
        <div class="flow-actions">
          <!-- 编辑信息：修改项目基本信息 -->
          <el-button link class="action-btn" @click.stop="editFlowInfo(flow)">
            <el-icon><Edit /></el-icon>
            编辑信息
          </el-button>
          <!-- 设计：进入设计器编辑流程内容 -->
          <el-button link class="action-btn" @click.stop="designFlow(flow.id)">
            <el-icon><EditPen /></el-icon>
            设计流程
          </el-button>
          <el-button link class="action-btn" @click.stop="deleteFlow(flow.id)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 创建/编辑项目对话框（共用同一个模板） -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新建项目' : '编辑项目信息'"
      width="500px"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述（可选）"
          />
        </el-form-item>
        <!-- <el-form-item label="访问路径" prop="path">
          <el-input v-model="formData.path" placeholder="/api/flow/xxx" />
          <div class="form-tip">流程的访问路径，默认为 /api/flow/{流程ID}</div>
        </el-form-item> -->

        <!-- 编辑模式下显示额外信息 -->
        <template v-if="dialogType === 'edit'">
          <el-form-item label="当前版本" prop="version">
            <el-input v-model="formData.version" disabled />
          </el-form-item>
          <el-form-item label="项目状态" prop="status">
            <el-tag :type="formData.status === 'published' ? 'success' : 'info'">
              {{ formData.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ dialogType === 'create' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useFlowStore } from '@/stores/flow'
import { Delete, Edit, EditPen, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const flowStore = useFlowStore()

const flows = ref([])
const dialogVisible = ref(false)
const dialogType = ref('create') // 'create' 或 'edit'
const formRef = ref(null)
const submitting = ref(false)

const formData = ref({
  id: '',
  name: '',
  description: '',
  path: '',
  version: '',
  status: '',
})

const rules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  path: [
    {
      pattern: /^\/api\/flow\/[a-zA-Z0-9_-]+$/,
      message: '路径格式不正确，示例：/api/flow/user-flow',
      trigger: 'blur',
    },
  ],
}

// 加载项目列表
const loadFlows = async () => {
  try {
    flows.value = await flowStore.loadList()
  } catch (error) {
    ElMessage.error('加载项目列表失败')
  }
}

// 打开创建对话框
const createFlow = () => {
  dialogType.value = 'create'
  formData.value = {
    id: '',
    name: '',
    description: '',
    path: '',
    version: '',
    status: '',
  }
  dialogVisible.value = true
}

// 打开编辑对话框（编辑项目信息）
const editFlowInfo = (flow) => {
  dialogType.value = 'edit'
  formData.value = {
    id: flow.id,
    name: flow.name,
    description: flow.description || '',
    path: flow.path || '',
    version: flow.version,
    status: flow.status,
  }
  dialogVisible.value = true
}

// 提交表单（创建或更新）
const handleSubmit = async () => {
  // 先进行表单验证
  let isValid = false
  try {
    await formRef.value?.validate()
    isValid = true
  } catch (error) {
    console.log('表单验证失败', error)
    isValid = false
    return
  }

  if (!isValid) return

  submitting.value = true
  try {
    if (dialogType.value === 'create') {
      // 创建新项目
      await flowStore.save({
        name: formData.value.name,
        description: formData.value.description,
        path: formData.value.path || undefined,
        version: '1.0.0',
        status: 'draft',
      })
      ElMessage.success('项目创建成功')
    } else {
      // 更新项目信息
      await flowStore.update(formData.value.id, {
        name: formData.value.name,
        description: formData.value.description,
        path: formData.value.path,
      })
      ElMessage.success('项目信息更新成功')
    }

    dialogVisible.value = false
    await loadFlows()
  } catch (error) {
    ElMessage.error(error.message || (dialogType.value === 'create' ? '创建失败' : '更新失败'))
  } finally {
    submitting.value = false
  }
}

// 设计流程（进入设计器）
const designFlow = (id) => {
  router.push(`/flow/designer/${id}`)
}

// 删除项目
const deleteFlow = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该项目吗？删除后无法恢复！', '提示', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
    })

    await flowStore.delete(id)
    ElMessage.success('删除成功')
    await loadFlows()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

onMounted(() => {
  loadFlows()
})
</script>

<style scoped>
.flow-list {
  padding: 20px;
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 8px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.flow-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
}

.flow-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.flow-info {
  cursor: pointer;
}

.flow-info h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.flow-info p {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
  min-height: 42px;
}

.flow-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #909399;
  flex-wrap: wrap;
}

.flow-actions {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  gap: 16px;
  justify-content: flex-end;
}

.flow-actions .el-button {
  padding: 4px 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

/* 自定义链接按钮样式，恢复原来的外观 */
.action-btn {
  color: #606266 !important;
  font-weight: normal;
  text-decoration: none;
}

.action-btn:hover {
  color: #409eff !important;
  text-decoration: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .flow-list {
    padding: 12px;
  }

  .flow-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header h2 {
    text-align: center;
  }
}
</style>
