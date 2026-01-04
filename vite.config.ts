import path from 'path';
import { defineConfig, loadEnv } from 'vite';

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
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      }
    };
});