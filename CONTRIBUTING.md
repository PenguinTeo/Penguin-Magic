# 贡献指南 Contributing Guide

感谢你考虑为 **企鹅工坊 Penguin Magic** 做出贡献！🎉

我们欢迎任何形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复或新功能
- 🎨 优化界面和用户体验

---

## 行为准则

请遵守我们的行为准则，保持友善、尊重和包容。我们致力于为所有人提供一个无骚扰的协作环境。

---

## 如何贡献

### 报告 Bug

如果你发现了 Bug，请通过 [GitHub Issues](https://github.com/your-username/PenguinMagic/issues) 报告。提交 Bug 报告时，请包含：

- **问题描述**：清晰简洁地描述问题
- **复现步骤**：列出重现问题的详细步骤
- **预期行为**：描述你期望发生的情况
- **实际行为**：描述实际发生的情况
- **环境信息**：
  - 操作系统（Windows 10/11, macOS, Linux）
  - Node.js 版本
  - 浏览器版本（如果是前端问题）
- **截图或日志**：如果可能，附上截图或错误日志

### 提出新功能建议

我们欢迎你提出新功能想法！请通过 [GitHub Issues](https://github.com/your-username/PenguinMagic/issues) 提交功能建议，并包含：

- **功能描述**：清晰描述你希望添加的功能
- **使用场景**：说明这个功能解决什么问题或满足什么需求
- **可能的实现方案**：如果你有想法，可以简单描述实现思路
- **替代方案**：是否考虑过其他解决方案

### 提交代码

#### 开发环境准备

1. **Fork 本仓库**到你的 GitHub 账号

2. **克隆你的 Fork**：
   ```bash
   git clone https://github.com/your-username/PenguinMagic.git
   cd PenguinMagic
   ```

3. **安装依赖**：
   ```bash
   # 安装前端依赖
   npm install
   
   # 安装后端依赖
   cd backend-nodejs
   npm install
   cd ..
   ```

4. **启动开发环境**：
   ```bash
   # 启动前端开发服务器
   npm run dev
   
   # 在另一个终端启动后端服务
   cd backend-nodejs
   npm start
   ```

5. **访问应用**：
   打开浏览器访问 `http://127.0.0.1:8765`

#### 分支管理

- 从 `main` 或 `develop` 分支创建你的功能分支：
  ```bash
  git checkout -b feature/your-feature-name
  # 或
  git checkout -b bugfix/your-bugfix-name
  ```

- 分支命名规范：
  - `feature/*`：新功能开发
  - `bugfix/*`：Bug 修复
  - `docs/*`：文档改进
  - `refactor/*`：代码重构
  - `test/*`：测试相关

#### 代码规范

**前端（React/TypeScript）**：
- 使用 TypeScript 编写代码，确保类型安全
- 组件使用函数式组件和 Hooks
- 遵循现有的代码风格（缩进、命名等）
- 文件名使用 PascalCase（组件）或 camelCase（工具函数）

**后端（Node.js）**：
- 使用 ES6+ 语法
- 遵循现有的代码风格
- 添加必要的错误处理和日志记录

**通用规范**：
- 保持代码简洁易读
- 添加必要的注释，尤其是复杂逻辑
- 避免引入不必要的依赖

#### 提交规范

提交信息应该清晰描述改动内容。建议使用以下格式：

```
<类型>: <简短描述>

<详细描述（可选）>

<关联的 Issue（可选）>
```

**类型**：
- `feat`：新功能
- `fix`：Bug 修复
- `docs`：文档更新
- `style`：代码格式调整（不影响功能）
- `refactor`：代码重构
- `test`：测试相关
- `chore`：构建工具或辅助工具的变动

**示例**：
```
feat: 添加容器分类功能

- 实现 1x1, 1x2, 2x1, 2x2 四种容器尺寸
- 支持拖拽项目到容器内
- 添加容器右键菜单选项

Closes #123
```

#### 测试

在提交代码前，请确保：

- [ ] 代码可以正常构建（`npm run build`）
- [ ] 功能正常工作，没有明显 Bug
- [ ] 没有引入新的警告或错误
- [ ] 如果修改了 API，后端和前端都已更新

#### 提交 Pull Request

1. **推送你的分支**到 Fork 的仓库：
   ```bash
   git push origin feature/your-feature-name
   ```

2. **创建 Pull Request**：
   - 前往 GitHub 原仓库页面
   - 点击 "New Pull Request"
   - 选择你的分支作为源分支
   - 填写 PR 标题和描述

3. **PR 描述应包含**：
   - **改动内容**：清晰描述你做了什么
   - **相关 Issue**：如果有，链接相关的 Issue
   - **测试说明**：描述你如何测试这些改动
   - **截图**：如果是 UI 改动，附上截图

4. **等待审查**：
   - 维护者会审查你的代码
   - 可能会提出修改建议
   - 请及时响应反馈并更新代码

---

## 开发技巧

### 项目结构

```
PenguinMagic/
├── components/          # React 组件
├── services/           # API 和业务逻辑
├── hooks/              # 自定义 Hooks
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
├── backend-nodejs/     # Node.js 后端服务
│   ├── src/
│   │   ├── routes/    # API 路由
│   │   └── utils/     # 后端工具函数
│   └── data/          # 数据文件存储
└── ...
```

### 常用命令

```bash
# 前端开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run preview          # 预览生产版本

# 后端开发
cd backend-nodejs
npm start                # 启动后端服务
```

### 调试技巧

- **前端调试**：使用浏览器开发者工具
- **后端调试**：查看终端输出的日志
- **网络请求**：在浏览器 Network 标签中查看 API 请求

---

## 版本发布流程

（仅适用于维护者）

1. 更新版本号（`package.json` 和 `backend-nodejs/package.json`）
2. 更新 `CHANGELOG.md`
3. 创建 Git Tag：`git tag -a v0.2.4 -m "Release v0.2.4"`
4. 推送 Tag：`git push origin v0.2.4`
5. 在 GitHub 上创建 Release

---

## 联系方式

如果你有任何问题或需要帮助，可以通过以下方式联系我们：

- **Q群**：854266067
- **微信**：Lovexy_0222
- **GitHub Issues**：[提交 Issue](https://github.com/your-username/PenguinMagic/issues)

---

## 致谢

感谢所有为企鹅工坊做出贡献的开发者！🙏

你的每一个贡献，无论大小，都让这个项目变得更好。

---

**Happy Coding! 🐧✨**
# 贡献指南 Contributing Guide

感谢你考虑为 **企鹅工坊 Penguin Magic** 做出贡献！🎉

我们欢迎任何形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复或新功能
- 🎨 优化界面和用户体验

---

## 行为准则

请遵守我们的行为准则，保持友善、尊重和包容。我们致力于为所有人提供一个无骚扰的协作环境。

---

## 如何贡献

### 报告 Bug

如果你发现了 Bug，请通过 [GitHub Issues](https://github.com/your-username/PenguinMagic/issues) 报告。提交 Bug 报告时，请包含：

- **问题描述**：清晰简洁地描述问题
- **复现步骤**：列出重现问题的详细步骤
- **预期行为**：描述你期望发生的情况
- **实际行为**：描述实际发生的情况
- **环境信息**：
  - 操作系统（Windows 10/11, macOS, Linux）
  - Node.js 版本
  - 浏览器版本（如果是前端问题）
- **截图或日志**：如果可能，附上截图或错误日志

### 提出新功能建议

我们欢迎你提出新功能想法！请通过 [GitHub Issues](https://github.com/your-username/PenguinMagic/issues) 提交功能建议，并包含：

- **功能描述**：清晰描述你希望添加的功能
- **使用场景**：说明这个功能解决什么问题或满足什么需求
- **可能的实现方案**：如果你有想法，可以简单描述实现思路
- **替代方案**：是否考虑过其他解决方案

### 提交代码

#### 开发环境准备

1. **Fork 本仓库**到你的 GitHub 账号

2. **克隆你的 Fork**：
   ```bash
   git clone https://github.com/your-username/PenguinMagic.git
   cd PenguinMagic
   ```

3. **安装依赖**：
   ```bash
   # 安装前端依赖
   npm install
   
   # 安装后端依赖
   cd backend-nodejs
   npm install
   cd ..
   ```

4. **启动开发环境**：
   ```bash
   # 启动前端开发服务器
   npm run dev
   
   # 在另一个终端启动后端服务
   cd backend-nodejs
   npm start
   ```

5. **访问应用**：
   打开浏览器访问 `http://127.0.0.1:8765`

#### 分支管理

- 从 `main` 或 `develop` 分支创建你的功能分支：
  ```bash
  git checkout -b feature/your-feature-name
  # 或
  git checkout -b bugfix/your-bugfix-name
  ```

- 分支命名规范：
  - `feature/*`：新功能开发
  - `bugfix/*`：Bug 修复
  - `docs/*`：文档改进
  - `refactor/*`：代码重构
  - `test/*`：测试相关

#### 代码规范

**前端（React/TypeScript）**：
- 使用 TypeScript 编写代码，确保类型安全
- 组件使用函数式组件和 Hooks
- 遵循现有的代码风格（缩进、命名等）
- 文件名使用 PascalCase（组件）或 camelCase（工具函数）

**后端（Node.js）**：
- 使用 ES6+ 语法
- 遵循现有的代码风格
- 添加必要的错误处理和日志记录

**通用规范**：
- 保持代码简洁易读
- 添加必要的注释，尤其是复杂逻辑
- 避免引入不必要的依赖

#### 提交规范

提交信息应该清晰描述改动内容。建议使用以下格式：

```
<类型>: <简短描述>

<详细描述（可选）>

<关联的 Issue（可选）>
```

**类型**：
- `feat`：新功能
- `fix`：Bug 修复
- `docs`：文档更新
- `style`：代码格式调整（不影响功能）
- `refactor`：代码重构
- `test`：测试相关
- `chore`：构建工具或辅助工具的变动

**示例**：
```
feat: 添加容器分类功能

- 实现 1x1, 1x2, 2x1, 2x2 四种容器尺寸
- 支持拖拽项目到容器内
- 添加容器右键菜单选项

Closes #123
```

#### 测试

在提交代码前，请确保：

- [ ] 代码可以正常构建（`npm run build`）
- [ ] 功能正常工作，没有明显 Bug
- [ ] 没有引入新的警告或错误
- [ ] 如果修改了 API，后端和前端都已更新

#### 提交 Pull Request

1. **推送你的分支**到 Fork 的仓库：
   ```bash
   git push origin feature/your-feature-name
   ```

2. **创建 Pull Request**：
   - 前往 GitHub 原仓库页面
   - 点击 "New Pull Request"
   - 选择你的分支作为源分支
   - 填写 PR 标题和描述

3. **PR 描述应包含**：
   - **改动内容**：清晰描述你做了什么
   - **相关 Issue**：如果有，链接相关的 Issue
   - **测试说明**：描述你如何测试这些改动
   - **截图**：如果是 UI 改动，附上截图

4. **等待审查**：
   - 维护者会审查你的代码
   - 可能会提出修改建议
   - 请及时响应反馈并更新代码

---

## 开发技巧

### 项目结构

```
PenguinMagic/
├── components/          # React 组件
├── services/           # API 和业务逻辑
├── hooks/              # 自定义 Hooks
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
├── backend-nodejs/     # Node.js 后端服务
│   ├── src/
│   │   ├── routes/    # API 路由
│   │   └── utils/     # 后端工具函数
│   └── data/          # 数据文件存储
└── ...
```

### 常用命令

```bash
# 前端开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run preview          # 预览生产版本

# 后端开发
cd backend-nodejs
npm start                # 启动后端服务
```

### 调试技巧

- **前端调试**：使用浏览器开发者工具
- **后端调试**：查看终端输出的日志
- **网络请求**：在浏览器 Network 标签中查看 API 请求

---

## 版本发布流程

（仅适用于维护者）

1. 更新版本号（`package.json` 和 `backend-nodejs/package.json`）
2. 更新 `CHANGELOG.md`
3. 创建 Git Tag：`git tag -a v0.2.4 -m "Release v0.2.4"`
4. 推送 Tag：`git push origin v0.2.4`
5. 在 GitHub 上创建 Release

---

## 联系方式

如果你有任何问题或需要帮助，可以通过以下方式联系我们：

- **Q群**：854266067
- **微信**：Lovexy_0222
- **GitHub Issues**：[提交 Issue](https://github.com/your-username/PenguinMagic/issues)

---

## 致谢

感谢所有为企鹅工坊做出贡献的开发者！🙏

你的每一个贡献，无论大小，都让这个项目变得更好。

---

**Happy Coding! 🐧✨**
