# 企鹅工坊 - 构建指南

## 快速开始

### 一键构建（推荐）

双击运行 `一键构建.bat`，脚本会自动完成所有构建步骤。

### 手动构建

```bash
# 1. 安装依赖
npm install
cd backend-nodejs && npm install && cd ..

# 2. 构建前端
npm run build

# 3. 打包应用
npm run build:win
```

## 构建前准备

### 1. 环境要求

- Node.js 18+ (推荐 20.x)
- npm 9+
- Windows 10/11 (用于构建 Windows 版本)

### 2. Node.js 运行时

应用需要内置 Node.js 运行时来运行后端服务。

1. 下载 Node.js Windows 版本：
   - 地址：https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip
   
2. 解压到 `build/nodejs/` 目录，确保 `build/nodejs/node.exe` 存在

### 3. 应用图标

将图标文件放置到 `build/resources/` 目录：

- `icon.ico` - Windows 图标 (必需)
- `icon.png` - 通用图标 (可选)
- `icon.icns` - macOS 图标 (可选)

## 项目结构

```
Penguin-Magic/
├── backend-nodejs/          # 后端 Node.js 服务
│   ├── src/
│   │   ├── server.js       # 服务器入口
│   │   ├── config.js       # 配置文件
│   │   ├── routes/         # API 路由
│   │   └── utils/          # 工具函数
│   └── package.json
├── build/
│   ├── nodejs/             # Node.js 运行时 (需手动放置)
│   └── resources/          # 构建资源 (图标等)
├── dist/                   # 前端构建输出
├── electron/
│   ├── main.js            # Electron 主进程
│   └── preload.js         # 预加载脚本
├── release/               # 打包输出目录
├── scripts/
│   └── build.js           # 构建脚本
├── electron-builder.yml   # electron-builder 配置
├── package.json
└── vite.config.ts         # Vite 配置
```

## 打包配置说明

### electron-builder.yml

主要配置项：

- `appId`: 应用唯一标识
- `productName`: 应用显示名称
- `extraResources`: 额外资源（Node.js 运行时、后端代码）
- `nsis`: Windows 安装器配置

### 后端连接

应用启动时会：

1. 检查端口 8766 是否被占用
2. 启动内置的 Node.js 运行后端服务
3. 等待后端健康检查通过
4. 加载前端页面

如果后端启动失败，会显示错误对话框。

## 常见问题

### Q: 构建失败，提示找不到 node.exe

A: 请确保已将 Node.js 运行时放置到 `build/nodejs/` 目录。

### Q: 应用启动后显示空白页面

A: 可能是后端服务未正常启动。按 F12 打开开发者工具查看控制台错误。

### Q: 端口 8766 被占用

A: 关闭占用该端口的程序，或修改 `backend-nodejs/src/config.js` 中的端口配置。

### Q: 打包后的应用体积很大

A: 这是正常的，因为包含了完整的 Node.js 运行时（约 80MB）。

## 开发模式

```bash
# 终端 1: 启动后端
cd backend-nodejs
npm start

# 终端 2: 启动前端开发服务器
npm run dev

# 终端 3: 启动 Electron（可选）
npm run dev:electron
```

## 发布检查清单

- [ ] 更新 `package.json` 中的版本号
- [ ] 确保 `build/nodejs/` 包含 Node.js 运行时
- [ ] 确保 `build/resources/` 包含应用图标
- [ ] 运行 `一键构建.bat` 或 `npm run build:all`
- [ ] 测试生成的安装包
- [ ] 检查安装后应用是否正常运行
