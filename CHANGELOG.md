# nestjs-typebox

## 3.0.0-next.6

### Patch Changes

- 09f6e3e: fix: explcitly type DistPick and DistOmit return types

## 3.0.0-next.5

### Patch Changes

- 95c0123: chore: upgrade typebox to latest stable

## 3.0.0-next.4

### Patch Changes

- 7a0a776: Add UnionPartialSome typebox helper

## 3.0.0-next.3

### Patch Changes

- 163be99: fix: export types

## 3.0.0-next.2

### Patch Changes

- ff46411: feat: add some more typebox utilities

## 3.0.0-next.1

### Patch Changes

- 56c4916: fix: simplify DistOmit and DistPick typings for better inference

## 3.0.0-next.0

### Major Changes

- feat: upgraded to typebox 0.32.0

## 2.6.1

### Patch Changes

- fc130b1: fix: support for passing pipe classes without instantiation

## 2.6.0

### Minor Changes

- 97e4c28: feat: transform pipe support for request validators

## 2.5.5

### Patch Changes

- ba0c38b: update deps

## 2.5.4

### Patch Changes

- 50afcd1: updated peer dep range to support nest 10

## 2.5.3

### Patch Changes

- 74357c3: chore: updated readme with decorator usage

## 2.5.2

### Patch Changes

- 5afcaba: remove useless generic

## 2.5.1

### Patch Changes

- 6f85747: Make schema optional for param and query validators

## 2.5.0

### Minor Changes

- 4ec4c58: Automatically apply interceptor. New HttpEndpoint decorator

## 2.4.1

### Patch Changes

- 87f3ccc: provide a default name for responses and body

## 2.4.0

### Minor Changes

- f922327: separate response and request validator configuration

## 2.3.0

### Minor Changes

- c128d38: Upgrade typebox

## 2.2.0

### Minor Changes

- 4d38b6e: feat: new ValidateResp decorator experiment

## 2.1.0

### Minor Changes

- b9c33c2: vite lib mode and esm just arent there yet

## 2.0.4

### Patch Changes

- 1af7324: Fix package exports again

## 2.0.3

### Patch Changes

- 7e14c0e: include typings

## 2.0.2

### Patch Changes

- 6bd610a: use cjs and mjs file extensions on build output

## 2.0.1

### Patch Changes

- fe17f29: fix: use file extension when importing absolute nestjs files

## 2.0.0

### Major Changes

- 646a659: Migrate to ESM. Major bump just to be safe

## 1.0.7

### Patch Changes

- d6d8b0c: update deps

## 1.0.6

### Patch Changes

- 41e2c08: fix: restore typebox dto typecheck in interceptor

## 1.0.5

### Patch Changes

- 05b5975: force dto type as any when returning union

## 1.0.4

### Patch Changes

- 82ab159: fix: merge union schemas so dto classes can construct them

## 1.0.3

### Patch Changes

- 05eed8f: Loosen type restrictions on dtos
- 2f5606f: update deps

## 1.0.2

### Patch Changes

- 7f5e932: handle undefined parameter decorator keys

## 1.0.1

### Patch Changes

- ce13144: Upgrade vite-dts lib to get proper types emitted

## 1.0.0

### Major Changes

- ac3e770: Support for latest typebox and vitejs versions

## 0.4.1

### Patch Changes

- cc7bc57: Ugprade typebox dep

## 0.4.0

### Minor Changes

- c2e150f: feat: basic support for object unions

## 0.3.0

### Minor Changes

- 5b86b6d: support for integer data type

## 0.2.2

### Patch Changes

- 6941dcb: preserve this context when calling dto validate

## 0.2.1

### Patch Changes

- f233aa4: fix: response transformer should leave non-arrays as is

## 0.2.0

### Minor Changes

- 20dcd69: Remove concept of transform for now and allow beforeValidate to return new data

## 0.1.6

### Patch Changes

- 820ac92: fix: swap esbuild for swc to make sure \_\_metadata is emitted
- 6cd9762: Add usage instructions to readme

## 0.1.5

### Patch Changes

- 083d296: use apply to call original swagger method to avoid clobbering this

## 0.1.4

### Patch Changes

- 65de093: simplify swagger patch now that bug is fixed

## 0.1.3

### Patch Changes

- bae856d: Copy zod patch approach to see if that fixes things

## 0.1.2

### Patch Changes

- b9c40c4: Stop minifying dist files

## 0.1.1

### Patch Changes

- 14f01df: fix publish

## 0.1.0

### Minor Changes

- 3008e6f: First release
