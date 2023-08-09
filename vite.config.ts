import { builtinModules } from 'module';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import inject from '@rollup/plugin-inject';
import { build } from 'esbuild';
import { polyfillNode } from 'esbuild-plugin-polyfill-node';

export default defineConfig({
  plugins: [
    /* 
    Uncomment the following line to enable solid-devtools.
    For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
    */
    solidPlugin(),
    polyfillNode(),
  ],
  base:"/EnvironmentalStudy/",
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      ignore: [...builtinModules, "ws"],
    }
  },
  preview: {
    host:true,
    port:62875
  },
});
