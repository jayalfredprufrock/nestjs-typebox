# nestjs-typebox

## 2.2.0

### Minor Changes

-   4d38b6e: feat: new ValidateResp decorator experiment

## 2.1.0

### Minor Changes

-   b9c33c2: vite lib mode and esm just arent there yet

## 2.0.4

### Patch Changes

-   1af7324: Fix package exports again

## 2.0.3

### Patch Changes

-   7e14c0e: include typings

## 2.0.2

### Patch Changes

-   6bd610a: use cjs and mjs file extensions on build output

## 2.0.1

### Patch Changes

-   fe17f29: fix: use file extension when importing absolute nestjs files

## 2.0.0

### Major Changes

-   646a659: Migrate to ESM. Major bump just to be safe

## 1.0.7

### Patch Changes

-   d6d8b0c: update deps

## 1.0.6

### Patch Changes

-   41e2c08: fix: restore typebox dto typecheck in interceptor

## 1.0.5

### Patch Changes

-   05b5975: force dto type as any when returning union

## 1.0.4

### Patch Changes

-   82ab159: fix: merge union schemas so dto classes can construct them

## 1.0.3

### Patch Changes

-   05eed8f: Loosen type restrictions on dtos
-   2f5606f: update deps

## 1.0.2

### Patch Changes

-   7f5e932: handle undefined parameter decorator keys

## 1.0.1

### Patch Changes

-   ce13144: Upgrade vite-dts lib to get proper types emitted

## 1.0.0

### Major Changes

-   ac3e770: Support for latest typebox and vitejs versions

## 0.4.1

### Patch Changes

-   cc7bc57: Ugprade typebox dep

## 0.4.0

### Minor Changes

-   c2e150f: feat: basic support for object unions

## 0.3.0

### Minor Changes

-   5b86b6d: support for integer data type

## 0.2.2

### Patch Changes

-   6941dcb: preserve this context when calling dto validate

## 0.2.1

### Patch Changes

-   f233aa4: fix: response transformer should leave non-arrays as is

## 0.2.0

### Minor Changes

-   20dcd69: Remove concept of transform for now and allow beforeValidate to return new data

## 0.1.6

### Patch Changes

-   820ac92: fix: swap esbuild for swc to make sure \_\_metadata is emitted
-   6cd9762: Add usage instructions to readme

## 0.1.5

### Patch Changes

-   083d296: use apply to call original swagger method to avoid clobbering this

## 0.1.4

### Patch Changes

-   65de093: simplify swagger patch now that bug is fixed

## 0.1.3

### Patch Changes

-   bae856d: Copy zod patch approach to see if that fixes things

## 0.1.2

### Patch Changes

-   b9c40c4: Stop minifying dist files

## 0.1.1

### Patch Changes

-   14f01df: fix publish

## 0.1.0

### Minor Changes

-   3008e6f: First release
