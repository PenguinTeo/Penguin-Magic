# 用户系统实施计划

## 整体架构说明

```
用户电脑 (Electron 客户端)              pebbling.cn 云服务器
┌─────────────────────────┐           ┌─────────────────────────┐
│  前端界面 (React)        │◄─────────►│  api.pebbling.cn        │
│  本地后端 (可选)         │   HTTPS    │  ├── Node.js 后端       │
│  本地数据 (离线可用)     │           │  └── SQLite 数据库      │
└─────────────────────────┘           └─────────────────────────┘
```

**工作模式：**
- 离线时：使用本地后端 + 本地数据
- 在线时：连接云端 API，数据同步到云端
- 登录后：本地数据可上传云端，多设备共享

---

## 阶段零：准备工作

### 0.1 创建开发分支
```bash
git checkout -b feature/cloud-user-system
```

### 0.2 项目结构规划
云端后端将复用 `backend-nodejs` 代码，通过环境变量区分本地/云端模式：
- `MODE=local` - 本地模式（现有行为）
- `MODE=cloud` - 云端模式（用户认证 + 数据库）

---

## 阶段一：后端用户认证模块

### 1.1 安装依赖
在 `backend-nodejs/` 目录添加：
```bash
npm install better-sqlite3 bcryptjs jsonwebtoken uuid
```
- `better-sqlite3`: 高性能 SQLite 绑定
- `bcryptjs`: 密码哈希
- `jsonwebtoken`: JWT 生成与验证
- `uuid`: 用户ID生成

### 1.2 创建数据库模块
新建 `backend-nodejs/src/db/` 目录：

**`database.js`** - SQLite 初始化与迁移
```javascript
// 创建用户表、会话表
// 设计 sync_status 字段为云同步预留
```

**`userModel.js`** - 用户数据操作
- createUser(email, password, name)
- findByEmail(email)
- findById(userId)
- updateUser(userId, data)

### 1.3 创建认证中间件
新建 `backend-nodejs/src/middleware/auth.js`：
- verifyToken: JWT 验证中间件
- optionalAuth: 可选认证（支持游客模式）

### 1.4 创建用户路由
新建 `backend-nodejs/src/routes/auth.js`：
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录（返回 JWT）
- `POST /api/auth/logout` - 登出（可选，客户端清除 token）
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新用户信息

### 1.5 修改现有路由
为需要用户隔离的路由添加认证中间件：
- `routes/creative.js`
- `routes/history.js`
- `routes/desktop.js`
- `routes/canvas.js`

---

## 阶段二：数据模型升级

### 2.1 用户关联设计
现有 JSON 文件数据结构升级：
```javascript
// 原结构
{ id: "xxx", name: "创意名称", ... }

// 新结构（添加用户ID）
{ id: "xxx", userId: "user_123", name: "创意名称", syncStatus: "local", ... }
```

### 2.2 数据迁移
- 现有数据默认归属 "local_user"（本地用户）
- 用户登录后可以"认领"本地数据

---

## 阶段三：前端用户模块

### 3.1 创建认证上下文
新建 `contexts/AuthContext.tsx`：
```typescript
interface User { id: string; email: string; name: string; }
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}
```

### 3.2 创建用户 API 服务
新建 `services/api/auth.ts`：
- 封装登录/注册/获取用户信息 API
- 自动在请求头添加 Bearer token

### 3.3 修改 API 基础模块
更新 `services/api/index.ts`：
- 从 localStorage 读取 token
- 所有请求自动携带 Authorization header

### 3.4 创建用户界面组件
- `components/Auth/LoginModal.tsx` - 登录弹窗
- `components/Auth/RegisterModal.tsx` - 注册弹窗
- `components/Auth/UserMenu.tsx` - 用户菜单（头像/登出）

### 3.5 集成到主界面
修改 `App.tsx`：
- 包裹 AuthProvider
- 添加用户入口（右上角）

---

## 阶段四：云端部署

### 4.1 服务器配置（pebbling.cn）

**创建子域名：** `api.pebbling.cn`

**Nginx 配置示例：**
```nginx
server {
    listen 443 ssl;
    server_name api.pebbling.cn;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://127.0.0.1:8765;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4.2 部署后端代码
```bash
# 在服务器上
cd /var/www/penguin-api
git clone <repo> .
cd backend-nodejs
npm install
MODE=cloud node src/server.js
```

### 4.3 使用 PM2 守护进程
```bash
npm install -g pm2
MODE=cloud pm2 start src/server.js --name penguin-api
pm2 save
pm2 startup
```

---

## 阶段五：云同步功能

### 5.1 同步状态设计
```typescript
type SyncStatus = 'local' | 'synced' | 'pending' | 'conflict';
```

### 5.2 同步接口
- `POST /api/sync/push` - 上传本地数据到云端
- `GET /api/sync/pull` - 从云端拉取数据
- `POST /api/sync/resolve` - 解决冲突

### 5.3 数据模型字段
- `syncStatus`: 同步状态
- `lastModified`: 本地修改时间
- `serverVersion`: 服务器版本号

---

## 文件清单

### 新增文件
```
backend-nodejs/src/
├── db/
│   ├── database.js          # SQLite 初始化
│   └── userModel.js         # 用户数据操作
├── middleware/
│   └── auth.js              # JWT 认证中间件
└── routes/
    └── auth.js              # 用户认证 API

contexts/
└── AuthContext.tsx          # 前端认证上下文

services/api/
└── auth.ts                  # 前端用户 API

components/Auth/
├── LoginModal.tsx           # 登录弹窗
├── RegisterModal.tsx        # 注册弹窗
└── UserMenu.tsx             # 用户菜单
```

### 修改文件
```
backend-nodejs/src/server.js  # 注册 auth 路由
backend-nodejs/package.json   # 新增依赖
services/api/index.ts         # 添加 token 处理
App.tsx                       # 集成 AuthProvider
```

---

## 实施顺序

### 第一步：创建分支 + 后端基础
1. 创建 `feature/cloud-user-system` 分支
2. 安装依赖，创建数据库模块
3. 实现用户注册/登录 API
4. 本地测试认证功能

### 第二步：前端集成
5. 创建 AuthContext 和 API 服务
6. 实现登录/注册界面
7. 集成到主界面

### 第三步：云端部署
8. 配置 api.pebbling.cn 子域名
9. 部署后端到服务器
10. 测试云端 API

### 第四步：数据同步（后续迭代）
11. 实现数据上传/下载
12. 处理冲突解决

---

**确认后我将：**
1. 先帮你创建 git 分支
2. 逐步实现后端认证模块