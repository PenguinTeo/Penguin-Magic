# 企鹅工坊 - 安装和打包指南

## 📦 一键打包（推荐）

### Windows 用户

1. **双击运行** `quick-build.bat`
2. 等待构建完成（通常需要 5-10 分钟）
3. 安装程序会自动生成在 `release/` 目录

### macOS/Linux 用户

```bash
# 安装依赖
npm install
cd backend-nodejs && npm install && cd ..

# 一键构建
npm run build
```

## 🚀 手动构建步骤

### 第一步：安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend-nodejs
npm install
cd ..
```

### 第二步：构建前端

```bash
npm run build:frontend
```

输出：`dist/` 目录

### 第三步：构建后端

```bash
npm run build:backend
```

输出：`backend-nodejs/penguin-backend.exe`

### 第四步：打包应用

```bash
npm run build:electron
```

输出：`release/企鹅工坊-Setup.exe`

## 🧪 开发模式

### 启动后端服务

```bash
cd backend-nodejs
npm start
```

### 启动前端开发服务器（新终端）

```bash
npm run dev
```

访问 http://localhost:5176

### 启动 Electron 应用（新终端）

```bash
npm run dev:electron
```

## 📋 系统要求

### 构建环境
- Node.js 18 或更高版本
- npm 6 或更高版本
- Windows 10/11（用于构建 Windows 安装程序）

### 运行环境
- Windows 10/11
- 至少 500MB 可用磁盘空间
- 网络连接（用于 AI 功能）

## 🎯 构建输出说明

### release/ 目录结构

```
release/
├── 企鹅工坊-0.2.5-Setup.exe      # 安装程序（推荐用户使用）
├── 企鹅工坊-0.2.5.exe            # 便携版（无需安装）
├── latest.yml                    # 更新信息
└── ...其他文件
```

### 安装程序特性

✅ **一键安装** - 用户只需点击"下一步"  
✅ **自动启动** - 安装后自动创建快捷方式  
✅ **自动更新** - 支持后续版本更新  
✅ **完整卸载** - 支持完整的卸载程序  

## 🔧 配置修改

### 修改应用名称

编辑 `package.json`：

```json
{
  "name": "penguin-magic",
  "productName": "企鹅工坊"
}
```

### 修改应用版本

编辑 `package.json`：

```json
{
  "version": "0.2.5"
}
```

### 修改应用图标

1. 准备 512x512 的 PNG 图标
2. 放在 `assets/icon.png`
3. 重新构建

### 修改后端端口

编辑 `backend-nodejs/src/config.js`：

```javascript
PORT: process.env.PORT || 8765,  // 修改这里
```

## 🐛 常见问题

### Q: 构建时出现 "pkg not found" 错误

**A:** 后端依赖未安装，运行：
```bash
cd backend-nodejs
npm install
cd ..
```

### Q: 构建时出现 "electron-builder not found" 错误

**A:** 前端依赖未安装，运行：
```bash
npm install
```

### Q: 安装程序无法启动应用

**A:** 
1. 检查 Windows Defender 是否阻止了应用
2. 尝试以管理员身份运行
3. 检查 8765 端口是否被占用

### Q: 应用启动后无法连接后端

**A:**
1. 检查后端进程是否正常启动
2. 查看 Windows 防火墙设置
3. 检查 8765 端口是否被其他程序占用

### Q: 如何修改安装程序的外观

**A:** 编辑 `package.json` 中的 `build.nsis` 配置：

```json
{
  "build": {
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "企鹅工坊"
    }
  }
}
```

## 📝 版本发布流程

1. **更新版本号**
   ```bash
   # 编辑 package.json 中的 version
   ```

2. **构建新版本**
   ```bash
   npm run build
   ```

3. **测试安装程序**
   - 在干净的 Windows 环境中测试
   - 验证所有功能正常

4. **发布**
   - 上传 `release/企鹅工坊-Setup.exe` 到发布平台

## 🔐 代码签名（可选）

如果需要为安装程序进行代码签名（避免 SmartScreen 警告）：

1. 获取代码签名证书
2. 编辑 `package.json`：

```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "your_password",
      "signingHashAlgorithms": ["sha256"]
    }
  }
}
```

3. 重新构建

## 📚 相关资源

- [Electron 官方文档](https://www.electronjs.org/docs)
- [electron-builder 文档](https://www.electron.build/)
- [Vite 官方文档](https://vitejs.dev/)
- [Node.js 官方网站](https://nodejs.org/)

## 🤝 获取帮助

- 查看 `ELECTRON_BUILD.md` 了解更多技术细节
- 提交 Issue 报告问题
- 联系开发团队获取支持

---

**祝你打包顺利！🎉**
