import request from '@/utils/request'

export const flowApi = {
  // 获取流程列表
  getList(params) {
    return request.get('/flow/list', { params })
  },

  // 获取流程详情
  getDetail(id) {
    return request.get(`/flow/${id}`)
  },

  // 创建流程
  create(data) {
    return request.post('/flow', data)
  },

  // 更新流程
  update(id, data) {
    return request.put(`/flow/${id}`, data)
  },

  design(id, data) {
    return request.post(`/flow/design/${id}`, data)
  },

  // 删除流程
  delete(id) {
    return request.delete(`/flow/${id}`)
  },

  // 发布流程
  publish(id) {
    return request.post(`/flow/${id}/publish`)
  },

  // 取消发布
  unpublish(id) {
    return request.post(`/flow/${id}/unpublish`)
  },

  // 执行流程
  execute(id, params) {
    return request.post(`/flow/${id}`, params)
  },
}
