// rollup.config.js
import typescript from '@rollup/plugin-typescript'
import merge from 'deepmerge'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import withSolid from 'rollup-preset-solid'
import postcss from 'rollup-plugin-postcss'
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default withSolid([
    {
        plugins: [
            postcss({
                config:{
                    path: './postcss.config.ts',
                },
                extensions: ['.css'],
                minimize: true,
                inject: {
                    insertAt: 'top',
                }
            }),
            resolve(),
            terser(),
        ]
    }
])

// export default [
//     {
//         input: "src/App.tsx",
//         external : "src/index.css",
//         output: {
//             dir: "public/bundle.js",
//             format: "cjs",
//             sourcemaps: true
//         },
//         plugins: [
//             typescript({
//                 tsconfig: "./tsconfig.json"
//             })
//         ]
//     }
// ]