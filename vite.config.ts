import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { readFileSync } from 'fs';

// 从 package.json 读取版本号
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const APP_VERSION = packageJson.version;

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './', // 使用相对路径，适用于 Electron
      server: {
        port: 5176,
        strictPort: true,
        proxy: {
          // 本地 Node.js 后端代理
          '/api': {
            target: 'http://localhost:8765',
            changeOrigin: true,
          },
          // 本地文件服务
          '/files': {
            target: 'http://localhost:8765',
            changeOrigin: true,
          },
          '/input': {
            target: 'http://localhost:8765',
            changeOrigin: true,
          },
          '/output': {
            target: 'http://localhost:8765',
            changeOrigin: true,
          },
        },
      },
      build: {
        // Electron 渲染进程构建配置
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
          output: {
            manualChunks: undefined,
          },
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        '__APP_VERSION__': JSON.stringify(APP_VERSION)
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      }
    };
});