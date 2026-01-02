import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isDev = mode === 'development';

  return {
    // 使用相对路径，确保 Electron file:// 协议能正确加载资源
    base: './',
    server: {
      port: 5176,
      strictPort: true,
      proxy: isDev ? {
        '/api': {
          target: 'http://localhost:8766',
          changeOrigin: true,
        },
        '/files': {
          target: 'http://localhost:8766',
          changeOrigin: true,
        },
        '/input': {
          target: 'http://localhost:8766',
          changeOrigin: true,
        },
        '/output': {
          target: 'http://localhost:8766',
          changeOrigin: true,
        },
      } : undefined,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
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