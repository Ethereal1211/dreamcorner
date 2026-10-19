# 梦角 DreamCorner 部署指南

一个以"梦角"为主题的个人空间应用，支持塔罗牌占卜、日记、朋友圈、日程经期提醒等功能。

## 功能特性

- 💬 梦角 AI 聊天对话（支持真实 AI 大模型接入）
- 🔮 塔罗牌抽取与 AI 解读
- 📔 梦角日记
- 💝 朋友圈
- 📅 日程与经期提醒
- 🎨 多主题切换、个性化头像上传
- ⚙️ AI 模型可配置（OpenAI 兼容接口）

## 技术栈

- **前端**: React 19 + TypeScript + Vite + Tailwind CSS
- **后端**: NestJS 10 + TypeScript
- **数据库**: PostgreSQL 16+
- **ORM**: Drizzle ORM
- **AI 服务**: OpenAI 兼容 API（可配置任意兼容接口）

## 快速开始（Docker Compose）

### 1. 准备环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入必要的配置（详见[环境变量说明](#环境变量说明)）。

### 2. 启动服务

```bash
cd deploy
docker-compose up -d
```

首次启动会自动：
- 创建 PostgreSQL 数据库
- 初始化所有业务表
- 构建并启动应用服务

### 3. 访问应用

打开浏览器访问：`http://localhost:3000`

（端口由 `.env` 中的 `APP_PORT` 配置决定）

## 手动部署（Docker）

### 1. 构建镜像

```bash
docker build -f deploy/Dockerfile -t dreamcorner:latest .
```

### 2. 运行容器

需要先准备好 PostgreSQL 数据库，然后启动应用：

```bash
docker run -d \
  --name dreamcorner-app \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:password@localhost:5432/dreamcorner \
  -e AI_BASE_URL=https://api.openai.com/v1 \
  -e AI_API_KEY=sk-xxx \
  -e AI_MODEL_NAME=gpt-4o-mini \
  dreamcorner:latest
```

## 本地开发

### 环境要求

- Node.js >= 20
- PostgreSQL >= 16
- npm >= 9

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入数据库连接和 AI 配置
```

### 初始化数据库

执行 `deploy/initdb/01-init.sql` 中的 SQL 脚本到你的 PostgreSQL 数据库。

### 启动开发服务

```bash
npm run dev
```

前端开发服务器默认运行在 `http://localhost:5173`，后端 API 在 `http://localhost:3000`。

## 环境变量说明

### 数据库配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `POSTGRES_DB` | 否 | `dreamcorner` | 数据库名 |
| `POSTGRES_USER` | 否 | `dreamcorner` | 数据库用户名 |
| `POSTGRES_PASSWORD` | **是** | - | 数据库密码 |
| `POSTGRES_PORT` | 否 | `5432` | 数据库端口（宿主机映射） |
| `DATABASE_URL` | **是** | - | 完整数据库连接串（手动部署时必填） |

### 应用配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `APP_PORT` | 否 | `3000` | 应用对外端口 |
| `JWT_SECRET` | **是** | - | JWT 签名密钥，生产环境请设为长随机字符串 |
| `APP_SECRET` | **是** | - | 应用内部密钥，用于会话等 |

### AI 模型配置（可选）

> 留空时使用内置的本地兜底回复，不调用外部 AI。

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `AI_BASE_URL` | 否 | - | OpenAI 兼容 API 地址，以 `/v1` 结尾，如 `https://api.openai.com/v1` |
| `AI_API_KEY` | 否 | - | API Key |
| `AI_MODEL_NAME` | 否 | `gpt-4o-mini` | 模型名称 |
| `AI_TEMPERATURE` | 否 | `0.7` | 温度参数（0.0-2.0），值越高越有创意 |
| `AI_SYSTEM_PROMPT` | 否 | - | 自定义系统提示词，定义梦角的人设和语气 |

**支持的 AI 服务**：

- OpenAI（官方）
- 智谱 AI / DeepSeek / 月之暗面 等兼容 OpenAI 格式的国内服务
- 本地部署的 Ollama（需配置 OpenAI 兼容端点）
- 任何提供 OpenAI 兼容 `/chat/completions` 接口的服务

## 数据库结构

应用包含以下数据表：

| 表名 | 说明 |
|------|------|
| `user_settings` | 用户个性化设置（主题、头像、名字等） |
| `ai_settings` | AI 模型配置（接口地址、密钥、模型等） |
| `tarot_draws` | 塔罗抽牌记录 |
| `dream_chat_messages` | 梦角聊天消息 |
| `diary_entries` | 日记条目 |
| `moments` | 朋友圈动态 |
| `schedules` | 日程提醒 |
| `period_records` | 经期记录 |

## 常见问题

### AI 不工作/回复还是本地兜底？

1. 确认 `AI_BASE_URL` 和 `AI_API_KEY` 已正确配置
2. 在应用的「设置 → AI 模型配置」中开启"启用 AI 回复"开关
3. 检查日志中是否有 AI 调用错误：`docker logs dreamcorner-app`
4. 确认你的 AI 服务支持 `/chat/completions` 接口且账户余额充足

### 如何更换 AI 服务商？

在设置页的"AI 模型配置"中修改接口地址和模型名即可，支持任何 OpenAI 兼容的接口。

### 数据如何备份？

```bash
docker exec dreamcorner-db pg_dump -U dreamcorner dreamcorner > backup.sql
```

### 如何升级版本？

```bash
cd deploy
docker-compose down
git pull  # 或手动更新代码
docker-compose build --pull
docker-compose up -d
```

## 目录结构

```
.
├── client/                 # 前端 React 应用
├── server/                 # 后端 NestJS 应用
├── shared/                 # 前后端共享类型定义
├── deploy/                 # 部署相关文件
│   ├── Dockerfile          # 应用 Docker 镜像
│   ├── docker-compose.yml  # Docker Compose 编排
│   └── initdb/             # 数据库初始化脚本
├── .env.example            # 环境变量示例
└── package.json            # 项目配置
```

## License

MIT
