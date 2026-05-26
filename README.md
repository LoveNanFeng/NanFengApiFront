# NanFengAPI 前端

> **重要：本前端已适配 NanFengAPI 后端。**
> **主业务前端文件在 `vben-admin/playground`，启动、打包、页面开发都以 `playground` 为准。**

这是 NanFengAPI 计费系统的前端项目，基于 Vue 3、Vite、TypeScript、Vben Admin 构建。实际业务入口在 `playground` 应用中，包含控制台后台、用户工作台、接口市场、接口文档、密钥管理、套餐购买、调用日志、支付配置等页面。

## 项目关系

| 项目 | 仓库地址 | 说明 |
| --- | --- | --- |
| 主仓库 | [LoveNanFeng/NanFengAPI](https://github.com/LoveNanFeng/NanFengAPI) | NanFengAPI 项目主仓库，项目说明和部署文档都在此仓库 |
| 前端仓库 | [LoveNanFeng/NanFengApiFront](https://github.com/LoveNanFeng/NanFengApiFront) | 当前前端项目，主业务应用在 `vben-admin/playground` |
| 后端仓库 | [LoveNanFeng/NanFengApiBack](https://github.com/LoveNanFeng/NanFengApiBack) | NanFengAPI 后端服务，默认接口前缀为 `/api` |

| 配置项       | 默认值                      |
| ------------ | --------------------------- |
| 前端目录     | `vben-admin`                |
| 前端业务应用 | `vben-admin/playground`     |
| 前端本地端口 | `5555`                      |
| 后端本地端口 | `8080`                      |
| 后端接口前缀 | `/api`                      |
| 本地后端地址 | `http://localhost:8080/api` |

开发环境中，前端通过 `playground/vite.config.ts` 代理请求：

- `/api` -> `http://localhost:8080/api`
- `/open` -> `http://localhost:8080/api/open`

因此本地开发时请先启动后端，再启动前端。

## 环境要求

- Node.js：`^20.19.0 || ^22.18.0 || ^24.0.0`
- pnpm：`>=10.0.0`
- 推荐启用 Corepack，避免 pnpm 版本不一致。

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
```

## 安装依赖

在前端根目录执行：

```bash
cd vben-admin
pnpm install
```

如果依赖异常，可以重新安装：

```bash
pnpm reinstall
```

## 本地启动

先启动后端服务，确保后端可访问：

```text
http://localhost:8080/api
```

然后在 `vben-admin` 目录启动前端：

```bash
pnpm dev:play
```

启动成功后访问：

```text
http://localhost:5555
```

也可以进入业务应用目录启动：

```bash
cd vben-admin/playground
pnpm dev
```

## 后端地址适配

默认开发配置在：

```text
playground/.env.development
playground/vite.config.ts
```

当前默认值：

```env
VITE_PORT=5555
VITE_GLOB_API_URL=/api
```

开发代理目标：

```ts
target: 'http://localhost:8080/api';
```

如果你的后端不在本机 `8080` 端口，请修改 `playground/vite.config.ts` 中的代理目标，例如：

```ts
target: 'http://你的后端域名或IP:端口/api';
```

生产环境通常不使用 Vite 代理，需要让 Nginx 或网关把 `/api` 和 `/open` 转发到后端服务。

## 打包命令

在 `vben-admin` 目录执行：

```bash
pnpm build:play
```

打包产物默认生成在：

```text
vben-admin/playground/dist
```

如果需要构建整个 monorepo：

```bash
pnpm build
```

一般部署 NanFengAPI 前端只需要执行 `pnpm build:play`。

## 预览打包产物

进入业务应用目录后执行：

```bash
cd vben-admin/playground
pnpm preview
```

## 常用命令

```bash
# 安装依赖
pnpm install

# 启动 NanFengAPI 前端业务应用
pnpm dev:play

# 打包 NanFengAPI 前端业务应用
pnpm build:play

# 类型检查
pnpm -F @vben/playground typecheck

# 代码格式化 / lint
pnpm lint
```

## 部署提示

1. 先部署后端：[LoveNanFeng/NanFengApiBack](https://github.com/LoveNanFeng/NanFengApiBack)。
2. 再打包前端：`pnpm build:play`。
3. 将 `vben-admin/playground/dist` 部署到 Nginx、宝塔、1Panel 或其他静态站点服务。
4. 配置反向代理，把 `/api` 和 `/open` 转发到后端服务。

Nginx 示例：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}

location /api/ {
  proxy_pass http://127.0.0.1:8080/api/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}

location /open/ {
  proxy_pass http://127.0.0.1:8080/api/open/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 目录说明

```text
vben-admin/
  playground/              NanFengAPI 实际业务前端
    src/
      api/                 前端接口封装
      views/               页面模块
      components/          业务组件
      router/              路由配置
      store/               状态管理
    .env.development       开发环境变量
    .env.production        生产打包变量
    vite.config.ts         Vite 代理与构建配置
  packages/                Vben 公共包
  internal/                Vben 内部工程配置
```

## 注意事项

- 本项目不要再按 Vben 官方演示项目使用，业务入口是 `playground`。
- 后端必须使用 NanFengAPI 后端仓库：[LoveNanFeng/NanFengApiBack](https://github.com/LoveNanFeng/NanFengApiBack)。
- 开发环境如果请求失败，优先检查后端是否启动、端口是否为 `8080`、前端代理是否指向正确地址。
- 生产环境如果刷新页面 404，需要确认静态站点已配置 `try_files $uri $uri/ /index.html;`。
