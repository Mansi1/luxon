// A corrected version of the previous Rollup config
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json' with { type: 'json' };

// Define a common set of plugins for all builds
const plugins = [
    typescript({
        useTsconfigDeclarationDir: true
    }),
    resolve(),
    commonjs()
];

const input = 'src/luxon.js';  

export default [
    // Built node (CommonJS for Node.js)
    {
        input,
        output: {
            file: pkg.main,
            format: 'cjs',
            sourcemap: true
        },
        // The `external` property should be at the top level
        external: ['path', 'fs'],
        plugins,
    },

    // Built es6 (ES Modules)
    {
        input,
        output: {
            file: pkg.module,
            format: 'es',
            sourcemap: true
        },
        plugins,
    },
    {
        input,
        output: {
            file: "build/es6/luxon.min.mjs",
            format: 'es',
            sourcemap: true
        },
        plugins: [...plugins, terser()],
    },
    // Built cjs-browser (CommonJS for browser bundlers)
    {
        input,
        output: {
            file: 'build/cjs-browser/luxon.js',
            format: 'cjs',
            sourcemap: true
        },
        // The `external` property for browser builds
        external: ['path', 'fs'],
        plugins,
    },

    // Built amd (Asynchronous Module Definition)
    {
        input,
        output: {
            file: 'build/amd/luxon.js',
            format: 'amd',
            sourcemap: true
        },
        plugins,
    },
    {// --- Minified build ---
        input,
        output: {
            file: 'build/amd/luxon.min.js',
            format: 'amd',
            sourcemap: true
        },
        plugins: [...plugins, terser()],
    },
    // Built global-es6 (Modern browser bundle using ES6 syntax)
    {
        input,
        output: {
            file: 'build/global-es6/luxon.js',
            format: 'es',
            sourcemap: true,
        },
        plugins,
    },
    // Built global (Classic browser bundle)
    {
        input,
        output: {
            file: 'build/global/luxon.js',
            format: 'iife',
            name: 'luxon',
            globals: {},
            sourcemap: true
        },
        plugins
    },
    // --- Minified build ---
    {
        input,
        output: {
            file: 'build/global/luxon.min.js',
            format: 'iife',
            name: 'luxon',
            globals: {},
            sourcemap: true
        },
        plugins: [...plugins, terser()],
    },
];