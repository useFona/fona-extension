import { defineConfig } from 'wxt';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  srcDir: 'src',
  outDir: 'dist',
  webExt: {
    startUrls: ['https://www.google.com/'],
  },
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'FONA',
    version: '1.2.0',
    description: 'Your own Flow based notes editor',
    permissions: [
      'storage',
      'activeTab',
      'clipboardWrite',
    ],
    host_permissions: [
      'https://fona.meet-jain.in/*'
    ],
    background: {
      service_worker: 'entrypoints/background.ts',
    },
    action: {
      default_popup: 'entrypoints/popup/index.html',
    },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self';"
    }
  },
});
