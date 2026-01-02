# 企鹅工坊 - 快速开始指南

## 🎯 最快的方式（推荐）

### Windows 用户

**一键打包：**
```bash
双击运行 quick-build.bat
```

完成！安装程序会自动生成在 `release/` 目录。

### macOS/Linux 用户

```bash
npm install && cd backend-nodejs && npm install && cd .. && npm run build
```

## 🚀 开发模式

### 启动所有服务（需要 3 个终端）

**终端 1 - 启动后端：**
```bash
cd backend-nodejs
npm start
```

**终端 2 - 启动前端开发服务器：**
```bash
npm run dev
```

**终端 3 - 启动 Electron 应用：**
```bash
npm run dev:electron
```

然后访问 http://localhost:5176 或等待 Electron 窗口打开。

## 📦 构建命令

| 命令 | 说明 |
|------|------|
| `npm run build` | 一键构建（推荐） |
| `npm run build:frontend` | 仅构建前端 |
| `npm run build:backend` | 仅构建后端 |
| `npm run build:electron` | 仅打包 Electron |

## 📂 输出位置

- **安装程序**: `release/企鹅工坊-Setup.exe`
- **便携版**: `release/企鹅工坊.exe`
- **前端产物**: `dist/`
- **后端可执行文件**: `backend-nodejs/penguin-backend.exe`

## ⚙️ 系统要求

- Node.js 18+
- npm 6+
- Windows 10/11（用于构建）

## 🔧 常见问题

**Q: 构建失败？**
```bash
# 清除缓存并重新安装
rm -rf node_modules dist release
npm install
cd backend-nodejs && npm install && cd ..
npm run build
```

**Q: 应用无法启动？**
- 检查 8765 端口是否被占用
- 查看 Windows 防火墙设置
- 尝试以管理员身份运行

**Q: 如何修改版本号？**
编辑 `package.json` 中的 `version` 字段

## 📚 详细文档

- 完整指南：[INSTALL_GUIDE.md](./INSTALL_GUIDE.md)
- 技术细节：[ELECTRON_BUILD.md](./ELECTRON_BUILD.md)

---

**需要帮助？** 查看详细文档或提交 Issue！
