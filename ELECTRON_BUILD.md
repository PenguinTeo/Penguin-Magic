# 企鹅工坊 Electron 打包指南

## 📋 前置要求

- Node.js 18+ 
- npm 或 yarn
- Windows 10/11 (用于构建 Windows 安装程序)

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend-nodejs
npm install
cd ..
```

### 2. 开发模式

```bash
# 启动后端服务
cd backend-nodejs
npm start

# 在另一个终端启动前端开发服务器
npm run dev

# 在第三个终端启动 Electron 应用
npm run dev:electron
```

### 3. 构建安装程序

```bash
# 一键构建（包括前端、后端、Electron 打包）
npm run build

# 或者分步构建
npm run build:frontend    # 构建前端
npm run build:backend     # 构建后端 exe
npm run build:electron    # 打包 Electron 应用
```

## 📦 构建输出

构建完成后，安装程序位于 `release/` 目录：

```
release/
├── 企鹅工坊-0.2.5-Setup.exe    # 安装程序（推荐）
├── 企鹅工坊-0.2.5.exe          # 便携版
└── ...其他文件
```

## 🏗️ 项目结构

```
Penguin-Magic-main/
├── electron/                    # Electron 主进程代码
│   ├── main.ts                 # 主进程入口
│   └── preload.ts              # 预加载脚本
├── backend-nodejs/             # Node.js 后端
│   ├── src/
│   │   ├── server.js           # Express 服务器
│   │   ├── config.js           # 配置文件
│   │   ├── routes/             # API 路由
│   │   └── utils/              # 工具函数
│   └── package.json
├── src/                         # 前端源代码
│   ├── App.tsx
│   ├── components/
│   ├── services/
│   └── ...
├── dist/                        # 前端构建产物
├── dist-electron/               # Electron 主进程编译产物
├── release/                     # 最终安装程序
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置
├── tsconfig.electron.json      # Electron TypeScript 配置
├── build-electron.js           # 构建脚本
└── package.json                # 项目配置
```

## 🔧 配置说明

### package.json 中的 build 配置

```json
{
  "build": {
    "appId": "com.penguin-magic.app",
    "productName": "企鹅工坊",
    "win": {
      "target": ["nsis"]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

### 后端配置 (backend-nodejs/src/config.js)

后端会自动创建以下目录：
- `data/` - 数据存储
- `input/` - 输入图片
- `output/` - 生成图片
- `thumbnails/` - 缩略图
- `creative_images/` - 创意库图片

## 🎯 工作流程

### 开发流程

1. **启动后端**
   ```bash
   cd backend-nodejs
   npm start
   ```

2. **启动前端开发服务器**
   ```bash
   npm run dev
   ```

3. **启动 Electron 应用**
   ```bash
   npm run dev:electron
   ```

### 生产构建流程

1. **构建前端**
   - Vite 编译 React 代码到 `dist/`

2. **构建后端**
   - pkg 编译 Node.js 代码到 `backend-nodejs/penguin-backend.exe`

3. **编译 Electron 主进程**
   - TypeScript 编译到 `dist-electron/`

4. **打包应用**
   - electron-builder 生成 Windows 安装程序

## 🐛 故障排除

### 问题：后端无法启动

**解决方案**：
- 检查 Node.js 是否正确安装
- 确保 8765 端口未被占用
- 查看后端进程的错误日志

### 问题：前端无法连接后端

**解决方案**：
- 确保后端服务已启动
- 检查 API 代理配置
- 查看浏览器控制台的网络错误

### 问题：构建失败

**解决方案**：
- 清除 `node_modules` 和 `dist` 目录
- 重新安装依赖：`npm install`
- 检查 Node.js 版本是否 >= 18

## 📝 版本管理

修改 `package.json` 中的 `version` 字段来更新应用版本：

```json
{
  "version": "0.2.5"
}
```

## 🔐 代码签名（可选）

如果需要代码签名，修改 `package.json` 中的 build 配置：

```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "password",
      "signingHashAlgorithms": ["sha256"]
    }
  }
}
```

## 📚 相关文档

- [Electron 官方文档](https://www.electronjs.org/docs)
- [electron-builder 文档](https://www.electron.build/)
- [Vite 官方文档](https://vitejs.dev/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
