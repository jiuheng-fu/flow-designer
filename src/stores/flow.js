import { flowApi } from '@/api/flow'
import { defineStore } from 'pinia'

export const useFlowStore = defineStore('flow', {
  state: () => ({
    currentFlow: null,
    flowList: [],
    loading: false,
  }),

  actions: {
    async loadList(params) {
      this.loading = true
      try {
        const data = await flowApi.getList(params)
        this.flowList = data
        return data
      } finally {
        this.loading = false
      }
    },

    async loadDetail(id) {
      this.loading = true
      try {
        const data = await flowApi.getDetail(id)
        this.currentFlow = data
        return data
      } finally {
        this.loading = false
      }
    },

    async save(flowData) {
      return await flowApi.create(flowData)
    },

    async design(flowData) {
      return await flowApi.design(flowData.id, flowData)
    },

    async update(id, flowData) {
      return await flowApi.update(id, flowData)
    },

    async publish(id) {
      return await flowApi.publish(id)
    },

    async unpublish(id) {
      return await flowApi.unpublish(id)
    },

    async delete(id) {
      await flowApi.delete(id)
      await this.loadList()
    },
  },
})
