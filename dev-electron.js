#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Starting Penguin Magic Electron Development...\n');

// 启动 Electron
console.log('🎬 Starting Electron...\n');
const electron = spawn('npx', ['electron', 'electron/main.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
  },
});

electron.on('error', (err) => {
  console.error('Electron error:', err);
  process.exit(1);
});

electron.on('exit', () => {
  console.log('\nElectron closed');
  process.exit(0);
});

// 处理进程信号
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  electron.kill();
  process.exit(0);
});
