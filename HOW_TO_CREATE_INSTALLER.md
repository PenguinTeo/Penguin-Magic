# 如何创建安装程序

## 🎯 当前状态

✅ **已完成：**
- 前端构建完成（`dist/` 目录）
- Electron 应用打包完成（`release/win-unpacked/` 目录）
- 应用可执行文件已生成（`企鹅工坊.exe`）
- 后端代码已包含在应用中

❌ **问题：**
- electron-builder 在生成 NSIS 安装程序时遇到 winCodeSign 工具的符号链接权限问题
- 这是 Windows 的权限限制，即使以管理员身份运行也无法解决

## 🚀 解决方案

### 方案 1：使用 Inno Setup（推荐）

1. **下载并安装 Inno Setup**
   - 访问：https://jrsoftware.org/isdl.php
   - 下载并安装 Inno Setup 6.x

2. **编译安装程序**
   - 右键点击 `installer.iss`
   - 选择 "Compile"
   - 安装程序会生成在 `release/` 目录

3. **完成！**
   - 生成的文件：`release/企鹅工坊-Setup-0.2.5.exe`

### 方案 2：使用现有的便携版

用户可以直接使用：
- `release/win-unpacked/企鹅工坊.exe` - 便携版
- `release/install.bat` - 安装脚本
- `release/uninstall.bat` - 卸载脚本

### 方案 3：手动创建 NSIS 安装程序

如果你有 NSIS 安装：

1. **下载 NSIS**
   - 访问：https://nsis.sourceforge.io/Download
   - 安装 NSIS

2. **创建 NSIS 脚本**
   - 使用 `installer.nsi`（需要创建）

3. **编译**
   ```bash
   makensis installer.nsi
   ```

## 📦 当前可用的文件

```
release/
├── win-unpacked/           # 完整的应用目录
│   └── 企鹅工坊.exe        # 可执行文件
├── install.bat             # 安装脚本
├── uninstall.bat           # 卸载脚本
├── README.txt              # 说明文件
└── INSTALL_INSTRUCTIONS.md # 详细说明
```

## 🎯 推荐做法

**最简单的方式：**

1. 安装 Inno Setup
2. 编译 `installer.iss`
3. 得到专业的安装程序

**或者：**

直接分发 `release/` 目录，用户可以：
- 运行 `install.bat` 安装
- 或直接运行 `企鹅工坊.exe`

## 📝 注意事项

- `win-unpacked` 目录包含完整的应用
- 后端 Node.js 代码已包含在 `resources/backend-nodejs/` 中
- 应用会自动启动后端服务
- 无需用户安装 Node.js 或其他依赖

## 🔧 如果你想继续尝试 electron-builder

需要解决 winCodeSign 的符号链接问题：

1. 以管理员身份运行 PowerShell
2. 启用开发者模式（允许创建符号链接）
3. 或者等待 electron-builder 修复这个 bug

---

**建议：使用 Inno Setup 是最简单可靠的方案！**
