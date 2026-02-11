# FlowCanvas Electron 打包使用说明

## 已完成的工作

✅ 安装 Electron 相关依赖
✅ 创建 Electron 主进程（electron/main.cjs）
✅ 创建预加载脚本（electron/preload.cjs）
✅ 配置后端支持 Electron 环境
✅ 配置 Vite 构建
✅ 更新 package.json 脚本和配置
✅ 创建应用图标
✅ 测试开发模式 - 成功运行
✅ 前端构建 - 成功

## 开发模式

启动开发模式（包含热重载）：

```bash
npm run electron:dev
```

这将同时启动：
1. 后端服务（端口 8765）
2. Vite 开发服务器（端口 5176）
3. Electron 窗口

## 生产构建

### 仅构建前端
```bash
npm run build
```

### 打包 Windows 应用
```bash
npm run package
```

这将：
1. 构建前端（生成 dist/）
2. 使用 electron-builder 打包
3. 输出到 release/ 目录

### 打包所有平台
```bash
npm run package:all
```

支持的打包格式：
- **Windows**: NSIS 安装包、便携版
- **macOS**: DMG、ZIP
- **Linux**: AppImage、DEB

## 项目结构

```
FlowCanvas/
├── electron/
│   ├── main.cjs          # Electron 主进程
│   └── preload.cjs       # 预加载脚本
├── backend-nodejs/       # 后端服务
│   ├── src/
│   │   ├── server.js     # Express 服务器
│   │   ├── config.js     # 配置（支持 Electron 环境）
│   │   └── routes/       # API 路由
│   └── node_modules/     # 后端依赖（会打包进应用）
├── resources/            # 应用资源
│   ├── icon.svg          # SVG 图标
│   ├── icon.png          # PNG 图标
│   └── README.md         # 图标生成说明
├── dist/                 # 前端构建产物
├── release/              # 打包输出目录
└── package.json          # 项目配置
```

## 环境变量

### 开发环境
- `NODE_ENV=development`
- 使用项目根目录作为数据目录

### 生产环境（Electron）
- `NODE_ENV=production`
- `IS_ELECTRON=true`
- `USER_DATA_PATH`: 用户数据目录（由 Electron 提供）
- 数据存储在：`%APPDATA%/flowcanvas` (Windows)

## 路径处理

### 开发模式
- 基础目录：项目根目录
- 前端：http://localhost:5176
- 后端：http://localhost:8765

### 生产模式（Electron）
- 基础目录：用户数据目录
- 前端：从 dist/ 加载（由后端服务）
- 后端：内嵌在应用中，自动启动

## 功能特性

### 已实现
- ✅ 窗口管理（创建、关闭、生命周期）
- ✅ 后端服务自动启动和停止
- ✅ 原生菜单栏（文件、编辑、视图、帮助）
- ✅ 开发者工具（F12）
- ✅ 上下文隔离和安全配置
- ✅ 跨平台路径处理
- ✅ 图标资源管理

### 可扩展功能
- 🔲 自动更新（electron-updater）
- 🔲 托盘图标和菜单
- 🔲 全局快捷键
- 🔲 文件拖拽
- 🔲 原生对话框
- 🔲 系统通知

## 配置说明

### electron/main.cjs
主进程配置参数：
- `windowWidth`: 1280（窗口宽度）
- `windowHeight`: 800（窗口高度）
- `minWidth`: 1024（最小宽度）
- `minHeight`: 768（最小高度）
- `backendPort`: 8765（后端端口）

### package.json - build 配置
```json
{
  "appId": "com.flowcanvas.app",
  "productName": "FlowCanvas",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "backend-nodejs/**/*",
    "!backend-nodejs/node_modules/**/*",
    "package.json"
  ],
  "extraResources": [
    {
      "from": "backend-nodejs/node_modules",
      "to": "backend-nodejs/node_modules"
    }
  ]
}
```

## 故障排除

### 端口被占用
```bash
# Windows
netstat -ano | findstr :8765
taskkill /F /PID [PID]

# 或停止所有 Node 进程
taskkill /F /IM node.exe
```

### Electron 无法启动
1. 检查是否正确安装 electron
   ```bash
   npx electron --version
   ```

2. 清理缓存重新安装
   ```bash
   rm -rf node_modules
   npm install
   ```

### 打包失败
1. 确保前端已构建
   ```bash
   npm run build
   ```

2. 检查 Sharp 依赖
   ```bash
   cd backend-nodejs
   npm rebuild sharp
   ```

3. 使用淘宝镜像加速
   - 已配置 .npmrc 使用国内镜像

### 图标问题
- 当前使用 PNG 格式图标
- 查看 resources/README.md 了解如何生成其他格式

## 测试清单

- [x] 开发模式启动
- [x] 前端构建成功
- [x] API 请求正常
- [x] 文件上传/下载
- [x] 图像处理功能
- [x] 菜单功能
- [ ] Windows 打包测试
- [ ] 安装包测试
- [ ] 便携版测试

## 后续工作

1. **图标优化**：生成 .ico 和 .icns 格式
2. **打包测试**：在不同平台测试安装包
3. **性能优化**：减小打包体积
4. **功能增强**：添加托盘、自动更新等
5. **文档完善**：用户使用手册

## 相关资源

- [Electron 文档](https://www.electronjs.org/docs/latest/)
- [Electron Builder 文档](https://www.electron.build/)
- [Vite 文档](https://vitejs.dev/)

## 技术支持

遇到问题？
1. 查看控制台日志
2. 检查 DevTools (F12)
3. 查看后端日志（后台服务输出）
4. 参考设计文档：.qoder/quests/electron-packaging.md
# FlowCanvas Electron 打包使用说明

## 已完成的工作

✅ 安装 Electron 相关依赖
✅ 创建 Electron 主进程（electron/main.cjs）
✅ 创建预加载脚本（electron/preload.cjs）
✅ 配置后端支持 Electron 环境
✅ 配置 Vite 构建
✅ 更新 package.json 脚本和配置
✅ 创建应用图标
✅ 测试开发模式 - 成功运行
✅ 前端构建 - 成功

## 开发模式

启动开发模式（包含热重载）：

```bash
npm run electron:dev
```

这将同时启动：
1. 后端服务（端口 8765）
2. Vite 开发服务器（端口 5176）
3. Electron 窗口

## 生产构建

### 仅构建前端
```bash
npm run build
```

### 打包 Windows 应用
```bash
npm run package
```

这将：
1. 构建前端（生成 dist/）
2. 使用 electron-builder 打包
3. 输出到 release/ 目录

### 打包所有平台
```bash
npm run package:all
```

支持的打包格式：
- **Windows**: NSIS 安装包、便携版
- **macOS**: DMG、ZIP
- **Linux**: AppImage、DEB

## 项目结构

```
FlowCanvas/
├── electron/
│   ├── main.cjs          # Electron 主进程
│   └── preload.cjs       # 预加载脚本
├── backend-nodejs/       # 后端服务
│   ├── src/
│   │   ├── server.js     # Express 服务器
│   │   ├── config.js     # 配置（支持 Electron 环境）
│   │   └── routes/       # API 路由
│   └── node_modules/     # 后端依赖（会打包进应用）
├── resources/            # 应用资源
│   ├── icon.svg          # SVG 图标
│   ├── icon.png          # PNG 图标
│   └── README.md         # 图标生成说明
├── dist/                 # 前端构建产物
├── release/              # 打包输出目录
└── package.json          # 项目配置
```

## 环境变量

### 开发环境
- `NODE_ENV=development`
- 使用项目根目录作为数据目录

### 生产环境（Electron）
- `NODE_ENV=production`
- `IS_ELECTRON=true`
- `USER_DATA_PATH`: 用户数据目录（由 Electron 提供）
- 数据存储在：`%APPDATA%/flowcanvas` (Windows)

## 路径处理

### 开发模式
- 基础目录：项目根目录
- 前端：http://localhost:5176
- 后端：http://localhost:8765

### 生产模式（Electron）
- 基础目录：用户数据目录
- 前端：从 dist/ 加载（由后端服务）
- 后端：内嵌在应用中，自动启动

## 功能特性

### 已实现
- ✅ 窗口管理（创建、关闭、生命周期）
- ✅ 后端服务自动启动和停止
- ✅ 原生菜单栏（文件、编辑、视图、帮助）
- ✅ 开发者工具（F12）
- ✅ 上下文隔离和安全配置
- ✅ 跨平台路径处理
- ✅ 图标资源管理

### 可扩展功能
- 🔲 自动更新（electron-updater）
- 🔲 托盘图标和菜单
- 🔲 全局快捷键
- 🔲 文件拖拽
- 🔲 原生对话框
- 🔲 系统通知

## 配置说明

### electron/main.cjs
主进程配置参数：
- `windowWidth`: 1280（窗口宽度）
- `windowHeight`: 800（窗口高度）
- `minWidth`: 1024（最小宽度）
- `minHeight`: 768（最小高度）
- `backendPort`: 8765（后端端口）

### package.json - build 配置
```json
{
  "appId": "com.flowcanvas.app",
  "productName": "FlowCanvas",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "backend-nodejs/**/*",
    "!backend-nodejs/node_modules/**/*",
    "package.json"
  ],
  "extraResources": [
    {
      "from": "backend-nodejs/node_modules",
      "to": "backend-nodejs/node_modules"
    }
  ]
}
```

## 故障排除

### 端口被占用
```bash
# Windows
netstat -ano | findstr :8765
taskkill /F /PID [PID]

# 或停止所有 Node 进程
taskkill /F /IM node.exe
```

### Electron 无法启动
1. 检查是否正确安装 electron
   ```bash
   npx electron --version
   ```

2. 清理缓存重新安装
   ```bash
   rm -rf node_modules
   npm install
   ```

### 打包失败
1. 确保前端已构建
   ```bash
   npm run build
   ```

2. 检查 Sharp 依赖
   ```bash
   cd backend-nodejs
   npm rebuild sharp
   ```

3. 使用淘宝镜像加速
   - 已配置 .npmrc 使用国内镜像

### 图标问题
- 当前使用 PNG 格式图标
- 查看 resources/README.md 了解如何生成其他格式

## 测试清单

- [x] 开发模式启动
- [x] 前端构建成功
- [x] API 请求正常
- [x] 文件上传/下载
- [x] 图像处理功能
- [x] 菜单功能
- [ ] Windows 打包测试
- [ ] 安装包测试
- [ ] 便携版测试

## 后续工作

1. **图标优化**：生成 .ico 和 .icns 格式
2. **打包测试**：在不同平台测试安装包
3. **性能优化**：减小打包体积
4. **功能增强**：添加托盘、自动更新等
5. **文档完善**：用户使用手册

## 相关资源

- [Electron 文档](https://www.electronjs.org/docs/latest/)
- [Electron Builder 文档](https://www.electron.build/)
- [Vite 文档](https://vitejs.dev/)

## 技术支持

遇到问题？
1. 查看控制台日志
2. 检查 DevTools (F12)
3. 查看后端日志（后台服务输出）
4. 参考设计文档：.qoder/quests/electron-packaging.md
