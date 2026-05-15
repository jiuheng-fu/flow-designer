<template>
  <div class="document-viewer">
    <!-- 文书列表（略） -->

    <!-- 文书详情弹窗 -->
    <el-dialog v-model="dialogVisible" title="文书详情" width="80%" @close="clearContent">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else v-html="htmlContent" class="html-content"></div>
    </el-dialog>
  </div>
</template>

<script>
import { testHtmlApi } from '@/api/testhtm' // 假设有一个 API 模块提供接口调用

export default {
  data() {
    return {
      dialogVisible: true,
      htmlContent: '',
      loading: true,
    }
  },
  mounted() {
    // 组件挂载后自动加载文书
    this.viewDocument()
  },
  methods: {
    async viewDocument(row) {
      this.dialogVisible = true
      this.loading = true

      try {
        // 方式1：直接获取 HTML 字符串（推荐）
        const response = await testHtmlApi.getHtmlContent({
          orgCode: '91330282MA283HXF3T',
          collectSerialNo: 114743,
        })

        // response.data 就是纯净的 HTML 字符串
        this.htmlContent = response.data
      } catch (error) {
        console.error('加载失败', error)
        this.htmlContent = '<html><body><h1>加载失败</h1></body></html>'
      } finally {
        this.loading = false
      }
    },

    clearContent() {
      this.htmlContent = ''
    },
  },
}
</script>

<style scoped>
.html-content {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}
.loading {
  text-align: center;
  padding: 50px;
}
</style>
