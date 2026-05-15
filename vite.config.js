import vue from '@vitejs/plugin-vue'
import path from 'path' // 引入路径模块
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 设置 @ 指向 src 目录
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`, // 全局引入
      },
    },
  },
  build: {
    outDir: 'dist', // 输出目录
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'), // 主入口文件
      },
      output: {
        entryFileNames: 'assets/js/[name].js', // 输出 JS 文件名
        chunkFileNames: 'assets/js/[name].js', // 输出分块 JS 文件名
        assetFileNames: 'assets/[ext]/[name].[hash].[ext]', // 输出资源文件名
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'monaco-editor'], // 预构建依赖
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/mscdrapi': {
        target: 'http://localhost:3012',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mscdrapi/, ''),
      },
    },
    port: process.env.VITE_PORT || 3001, // Use the port from .env or default to 3000
    open: true, // Automatically open the browser
    fs: {
      // 允许访问 node_modules 中的文件
      allow: ['..'],
    },
  },
})
