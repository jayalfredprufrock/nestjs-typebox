import { defineConfig } from 'vite';
import dts from 'vite-dts';
// eslint-disable-next-line import/no-unresolved
import swc from 'unplugin-swc';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            formats: ['es', 'cjs'],
            fileName: format => `nestjs-typebox.${format}.js`,
        },
        rollupOptions: {
            external: [/@nestjs\/.*/, /@sinclair\/.*/, /rxjs\/?.*/],
            output: {
                sourcemapExcludeSources: true,
            },
        },
        sourcemap: true,
        target: 'es2022',
        minify: false,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [swc.vite() as any, dts()],
});
