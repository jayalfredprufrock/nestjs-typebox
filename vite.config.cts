// eslint-disable-next-line import/no-unresolved
import swc from 'unplugin-swc';
import { defineConfig } from 'vite';
import { dts } from 'vite-dts';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            formats: ['es', 'cjs'],
            fileName: format => (format === 'cjs' ? 'nestjs-typebox.cjs' : 'nestjs-typebox.mjs'),
        },
        rollupOptions: {
            external: [/@nestjs\/.*/, /@sinclair\/.*/, /rxjs\/?.*/],
            output: {
                sourcemapExcludeSources: true,
            },
        },
        sourcemap: true,
        target: 'esnext',
        minify: false,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [swc.vite() as any, dts()],
});
