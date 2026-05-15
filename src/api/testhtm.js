import request from '@/utils/requestTest'

export const testHtmlApi = {
  getHtmlContent(params) {
    return request.get('/test/html', { params }, { baseURL: '/mscdrapi' })
  },
}
