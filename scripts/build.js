#!/usr/bin/env node

/**
 * 企鹅工坊 - 完整构建脚本
 * 
 * 此脚本执行以下步骤：
 * 1. 检查必要的依赖
 * 2. 构建前端
 * 3. 准备后端依赖
 * 4. 准备 Node.js 运行时
 * 5. 使用 electron-builder 打包
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${'='.repeat(50)}]`, colors.cyan);
  log(`[步骤 ${step}] ${message}`, colors.bright + colors.cyan);
  log(`[${'='.repeat(50)}]`, colors.cyan);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function runCommand(command, options = {}) {
  const { cwd = ROOT_DIR, ignoreError = false } = options;
  log(`> ${command}`, colors.cyan);
  
  try {
    execSync(command, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });
    return true;
  } catch (error) {
    if (!ignoreError) {
      logError(`命令执行失败: ${command}`);
      throw error;
    }
    return false;
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`创建目录: ${dir}`);
  }
}

async function main() {
  log('\n🐧 企鹅工坊 - 完整构建脚本\n', colors.bright + colors.cyan);
  
  const startTime = Date.now();
  
  try {
    // 步骤 1: 检查环境
    logStep(1, '检查构建环境');
    
    // 检查 Node.js 版本
    const nodeVersion = process.version;
    log(`Node.js 版本: ${nodeVersion}`);
    
    // 检查 npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      log(`npm 版本: ${npmVersion}`);
    } catch {
      logError('npm 未安装');
      process.exit(1);
    }
    
    logSuccess('环境检查通过');
    
    // 步骤 2: 安装依赖
    logStep(2, '安装项目依赖');
    
    // 主项目依赖
    log('检查主项目依赖...');
    runCommand('npm install');
    logSuccess('主项目依赖已安装');
    
    // 后端依赖
    const backendDir = path.join(ROOT_DIR, 'backend-nodejs');
    log('检查后端依赖...');
    runCommand('npm install', { cwd: backendDir });
    logSuccess('后端依赖已安装');
    
    // 步骤 3: 构建前端
    logStep(3, '构建前端');
    runCommand('npx vite build');
    
    // 验证前端构建结果
    const distDir = path.join(ROOT_DIR, 'dist');
    if (!fs.existsSync(path.join(distDir, 'index.html'))) {
      logError('前端构建失败: index.html 不存在');
      process.exit(1);
    }
    logSuccess('前端构建完成');
    
    // 步骤 4: 准备构建资源
    logStep(4, '准备构建资源');
    
    const buildResourcesDir = path.join(ROOT_DIR, 'build', 'resources');
    ensureDir(buildResourcesDir);
    
    // 检查图标文件
    const iconFiles = ['icon.ico', 'icon.png', 'icon.icns'];
    let hasIcon = false;
    
    for (const iconFile of iconFiles) {
      const iconPath = path.join(buildResourcesDir, iconFile);
      if (fs.existsSync(iconPath)) {
        hasIcon = true;
        logSuccess(`找到图标: ${iconFile}`);
      }
    }
    
    if (!hasIcon) {
      logWarning('未找到图标文件，将使用默认图标');
      logWarning('请将图标文件放置到 build/resources/ 目录');
    }
    
    // 步骤 5: 检查 Node.js 运行时
    logStep(5, '检查 Node.js 运行时');
    
    const nodejsDir = path.join(ROOT_DIR, 'build', 'nodejs');
    const nodeExe = path.join(nodejsDir, 'node.exe');
    
    if (fs.existsSync(nodeExe)) {
      logSuccess('Node.js 运行时已准备');
    } else {
      logError('Node.js 运行时不存在');
      logError('请将 Node.js Windows 版本解压到 build/nodejs/ 目录');
      logError('下载地址: https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip');
      process.exit(1);
    }
    
    // 步骤 6: 使用 electron-builder 打包
    logStep(6, '打包应用');
    runCommand('npx electron-builder --win --config electron-builder.yml');
    
    // 完成
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    
    log('\n' + '='.repeat(60), colors.green);
    logSuccess(`构建完成! 耗时: ${duration} 秒`);
    log('='.repeat(60), colors.green);
    
    // 显示输出文件
    const releaseDir = path.join(ROOT_DIR, 'release');
    if (fs.existsSync(releaseDir)) {
      log('\n输出文件:', colors.cyan);
      const files = fs.readdirSync(releaseDir);
      for (const file of files) {
        if (file.endsWith('.exe') || file.endsWith('.dmg') || file.endsWith('.AppImage')) {
          const filePath = path.join(releaseDir, file);
          const stats = fs.statSync(filePath);
          const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
          log(`  📦 ${file} (${sizeMB} MB)`, colors.green);
        }
      }
    }
    
    log('\n安装包位于 release/ 目录\n', colors.cyan);
    
  } catch (error) {
    logError(`构建失败: ${error.message}`);
    process.exit(1);
  }
}

main();
