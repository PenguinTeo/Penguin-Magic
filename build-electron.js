#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔨 Building Penguin Magic Electron App...\n');

try {
  // 1. 构建前端
  console.log('🎨 Building frontend...');
  execSync('npm run build:frontend', { stdio: 'inherit', cwd: __dirname });
  console.log('✓ Frontend built\n');

  // 2. 使用 electron-builder 打包
  console.log('📦 Packaging with electron-builder...');
  execSync('npx electron-builder', { stdio: 'inherit', cwd: __dirname });
  console.log('✓ Packaging complete\n');

  console.log('✅ Build complete! Installer is in the "release" directory.\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
