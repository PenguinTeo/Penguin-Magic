<div align="center">

# 🐧 企鹅工坊 Penguin Magic

### 全球首款 AI 图像桌面管理工具

**告别混乱，让创意井井有条**

[![Made with React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## 📋 版本更新记录

### V0.3.1 (最新版) - Electron 桌面版
- ✅ **独立桌面应用** — 一键安装，无需配置环境
- ✅ **智能创意库导入** — 修复导入功能，支持从 [Awesome Prompt Gallery](https://opennana.com/awesome-prompt-gallery/) 批量导入创意
- ✅ **后端健康监控** — 红房子/黄房子实时显示后端服务状态
- ✅ **自动启动后端** — 应用启动时自动启动 Node.js 后端服务

### V0.2.4
- 增加导入创意库：https://opennana.com/awesome-prompt-gallery/
- 操作路径：【创意库】→【智能导入】→【输入编号】
- 增加红房子黄房子来判断后端服务是否正常运行

### V0.2.3
- 支持多并发生成，提升创作效率





## 🌟 为什么选择企鹅工坊？

传统 AI 生图工具的痛点：
- ❌ 生成的图片散落各处，找不到
- ❌ 没有管理功能，越用越乱
- ❌ 无法快速对比和整理作品

**企鹅工坊** 重新定义 AI 创作体验：

> 🎯 **生成即管理** — 不只是生图，更是一个可视化创意工作台

---

## ✨ 核心特性

### 🖥️ 桌面级管理体验
像整理桌面一样管理你的 AI 作品。拖拽、分组、叠放，一切尽在掌控。

### 📁 智能文件夹 & 叠放
- **文件夹系统** — 按项目归类，清晰有序
- **智能叠放** — 同系列作品自动聚合，节省空间
- **批量管理** — 支持多选、批量移动、批量删除

### 🖱️ 自然拖放交互
- 从电脑直接拖拽图片/文件夹到工作台
- 拖拽调整位置，所见即所得
- 多选批量操作，效率倍增
- 支持拖拽到文件夹进行归档

### 📚 创意库系统
- **内置模板** — 多种创意模板，一键应用专业提示词
- **智能导入** — 从 [Awesome Prompt Gallery](https://opennana.com/awesome-prompt-gallery/) 批量导入优质创意
- **自定义创意** — 保存和管理你的专属提示词库
- **快速应用** — 点击即可将创意应用到生成器

### 🎨 AI 生成能力
- **多模型支持** — 支持 Gemini API 和贞贞 API
- **多并发生成** — 同时生成多张图片，提升效率
- **参数调节** — 自定义图片尺寸、风格等参数
- **再编辑功能** — 基于已有图片继续优化

### 🔄 完整创作闭环
生成 → 预览 → 再编辑 → 重新生成 → 管理保存，全流程无缝衔接。

### 🏠 后端健康监控
- **实时状态显示** — 红房子/黄房子图标实时显示后端服务状态
- **自动重连** — 后端异常时自动尝试重新连接
- **状态提示** — 清晰的错误提示和解决建议

---

## 🎨 设计理念

```
轻量 · 直觉 · 高效
```

- **轻设计** — 克制的视觉，让作品成为主角
- **零学习成本** — 熟悉的桌面交互，上手即用
- **本地优先** — 数据存在本地，快速又安全

---

## 🚀 快速开始

### 方式一：桌面版（推荐 ⭐）

**下载安装包**
1. 前往 [Releases](https://github.com/PenguinTeo/Penguin-Magic/releases) 页面
2. 下载最新版 `企鹅工坊-Setup-x.x.x.exe`
3. 双击安装，启动即用

**特点**
- ✅ 无需安装 Node.js
- ✅ 自动启动后端服务
- ✅ 开箱即用，零配置

### 方式二：一键启动（开发版）

```bash
# 1. 首次使用，双击运行
install.bat

# 2. 以后每次启动，双击运行
start.bat

# 3. 自动打开浏览器
http://127.0.0.1:8765
```
⚠️ 每次更新后都要重新运行 `install.bat`

### 方式三：手动启动（开发者）

```bash
# 1. 安装前端依赖
npm install

# 2. 安装后端依赖
cd backend-nodejs
npm install
cd ..

# 3. 构建前端
npm run build

# 4. 启动 Node.js 后端服务
cd backend-nodejs
node src/server.js

# 5. 打开浏览器
http://127.0.0.1:8765
```

### 环境要求

- **桌面版**：Windows 10/11（无需其他依赖）
- **开发版**：Node.js 18 或更高版本

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 样式方案 | Tailwind CSS |
| 构建工具 | Vite |
| 后端服务 | Node.js + Express |
| AI 能力 | Gemini API / 贞贞 API |

---

## 📞 联系我们

- **Q群** — 854266067
- **微信** — Lovexy_0222
- **技术支持** — 企鹅 · 无我

### 加入企鹅社群 🐧

<div align="center">
<img src="./wechat-qr.jpg" width="300" alt="企鹅Penguins🐧 微信群" />

**扫码加入「企鹅Penguins🐧」微信群**

交流创意 · 分享作品 · 获取支持
</div>

---

## 🙏 特别鸣谢

**T8** — 感谢提供视频宣传支持
**大熊** — 感谢提供视频宣传支持

---

<div align="center">

**企鹅工坊** — 让 AI 创作不再凌乱

Made with ❤️ by Penguin Team

</div>
