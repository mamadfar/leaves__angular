import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    __dirname: `'${dirname(fileURLToPath(import.meta.url))}'`,
  },
});
