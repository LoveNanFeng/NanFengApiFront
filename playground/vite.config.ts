import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      build: {
        sourcemap: false,
      },
      server: {
        proxy: {
          '^/api(?:/|$)': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api(?=\/|$)/, ''),
            // mock代理目标地址
            target: 'http://localhost:8080/api',
            ws: true,
          },
          '/open': {
            changeOrigin: true,
            target: 'http://localhost:8080/api',
          },
        },
      },
    },
  };
});
