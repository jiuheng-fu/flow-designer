# 项目协作说明

## 使用者信息

- 使用者：小付
- 技术背景：擅长 Java，会一点 Python，会一点 Vue
- 回复偏好：尽量使用中文说明，涉及代码时可以结合 Java / Vue 的视角解释

# flow-designer 前端协作说明

## 项目定位

`flow-designer` 是 `tunan` 项目的前端流程设计器，基于 Vue 3 + Vite。它主要负责流程列表、流程编辑画布、节点拖拽、节点属性配置，以及调用后端流程接口。

## 技术栈

- Vue 3
- Vite 7
- Vue Router 4
- Pinia 3
- Element Plus
- Axios
- AntV X6
- Monaco Editor
- lodash-es
- dayjs
- nanoid

## 常用命令

```sh
npm install
npm run dev
npm run build
npm run preview
```

注意：README 中提到了 `npm run lint`，但当前 `package.json` 没有配置 `lint` 脚本。

## 开发服务

`vite.config.js` 中的开发服务配置：

- 默认端口：`3001`
- `/api` 代理到 `http://localhost:3000`，并移除 `/api` 前缀
- `/mscdrapi` 代理到 `http://localhost:3012`，并移除 `/mscdrapi` 前缀
- `server.open` 当前为 `true`

后端 `tunan-flow-engine` 默认运行在 `3000` 端口。

## 目录重点

- `src/main.js`：前端入口。
- `src/App.vue`：应用根组件。
- `src/router/index.js`：路由配置。
- `src/stores/flow.js`：流程相关 Pinia store。
- `src/api/flow.js`：流程接口封装。
- `src/utils/request.js`：Axios 实例和请求/响应拦截器。
- `src/views/FlowList.vue`：流程列表页。
- `src/views/FlowEditor.vue`：流程编辑页。
- `src/views/TestHtml.vue`：测试页面。
- `src/components/designer/FlowDesigner.vue`：流程设计器主体。
- `src/components/designer/ComponentPalette.vue`：左侧组件库。
- `src/components/designer/PropertyPanel.vue`：右侧属性面板。
- `src/components/designer/components/ApiGatewayConfig.vue`：入口组件配置。
- `src/components/designer/components/DesignerToolbar.vue`：设计器工具栏。
- `src/components/designer/components/HttpNodeConfig.vue`：HTTP 节点配置。
- `src/components/common/MonacoEditor.vue`：Monaco 编辑器封装。
- `src/components/designer/composables`：图、节点、连线、选择、保存、代码编辑等组合式逻辑。

## 路由

- `/`：重定向到 `/flows`
- `/flows`：流程列表
- `/flow/designer/:id`：流程设计器
- `/test-html`：测试页面

## API 约定

`src/utils/request.js` 默认 `baseURL` 是：

- `import.meta.env.VITE_API_BASE_URL`
- 或 `/api`

响应拦截器要求后端返回：

```json
{
  "code": 200,
  "message": "...",
  "data": {}
}
```

`src/api/flow.js` 当前封装：

- `getList`
- `getDetail`
- `create`
- `update`
- `design`
- `delete`
- `publish`
- `unpublish`
- `execute`

注意：当前后端 `FlowController` 已看到列表、详情、创建、设计保存、更新、删除、发布接口；`unpublish` 和 `execute` 需要和后端继续对齐。

## 组件类型

`ComponentPalette.vue` 中可拖拽的主要节点：

- 入口组件：`rest-api`、`stream-api`、`websocket-api`、`mcp-tool`
- 数据源：`http`、`database`、`redis`、`graphql`
- 处理器：`transform`、`filter`、`merge`、`aggregate`、`validate`
- 逻辑控制：`condition`、`router`、`parallel`、`loop`、`delay`
- 代码执行：`java`、`python`、`javascript`、`groovy`
- AI 能力：`ai-chat`、`ai-embedding`、`ai-rag`、`ai-vision`
- 输出：`response`、`webhook`、`mq`、`file`

后端当前实际执行器类型比前端少。修改或新增节点时，要同步检查后端 `ComponentExecutor.getType()` 是否支持。

## 开发注意事项

- 项目使用 Element Plus，新增交互优先复用 Element Plus 组件。
- 图编辑依赖 AntV X6，节点、连线、画布行为优先在 `components/designer/composables` 中查找现有模式。
- `vite.config.js` 中配置了全局 SCSS：`@/styles/variables.scss`，但当前文件列表里没有看到该文件；如果构建报错，优先检查这里。
- 前端保存流程设计时要关注节点 `type`、`config`、连线 `condition` 是否能被后端识别。
- 如果新增接口方法，先确认 `tunan-flow-engine` 中是否已有对应 Controller。
