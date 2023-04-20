# nestjs-typebox

This library provides helper utilities for writing and validating NestJS APIs using [TypeBox](https://github.com/sinclairzx81/typebox) as
an alternative to class-validator/class-transformer. It also includes a patch for @nestjs/swagger allowing OpenAPI generation to continue working.

```sh
npm i nestjs-typebox
```

## Usage

### 1. Apply patches, install global interceptor and pipe

```ts
// main.ts

import { Reflector } from '@nestjs/core';
import { patchNestJsSwagger, applyFormats, TypeboxValidationPipe, TypeboxTransformInterceptor } from 'nestjs-typebox';

// provide swagger OpenAPI generator support
patchNestJsSwagger();

// provide custom JSON schema string format support
// currently only "email".
applyFormats();

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // NOTE: registering global pipes/interceptors via app.module.ts is preferred
    // The following is included here for brevity:

    // provides request validation
    app.useGlobalPipes(new TypeboxValidationPipe());

    // provides response validation and transformation
    app.useGlobalInterceptors(new TypeboxTransformInterceptor(app.get(Reflector)));

    await app.listen(3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
```

### 2. Create TypeBox schema

```ts
import { Type } from '@sinclair/typebox';

export const CatSchema = Type.Object({
    id: Type.Number({
        description: 'The unique identifier',
        examples: [42],
    }),
    name: Type.String({
        description: 'The name of the cat.',
        examples: ['Figaro'],
    }),
    type: Type.Union([Type.Literal('tabby'), Type.Literal('short-hair'), Type.Literal('maine-coon'), Type.Literal('siamese')]),
});
```

### 3. Create DTOs

```ts
import { Type } from '@sinclair/typebox';
import { createTypeboxDto } from 'nestjs-typebox';

export class CatParamsDto extends createTypeboxDto(Type.Pick(CatSchema, ['id']), { coerceTypes: true }) {}

export class CatCreateDto extends createTypeboxDto(Type.Omit(CatSchema, ['id'])) {}

export class CatUpdateDto extends createTypeboxDto(Type.Partial(Type.Omit(CatSchema, ['id', 'type']))) {}

export class CatResponseDto extends createTypeboxDto(CatSchema) {}
```

### 4. Reference DTOs in Controller Methods

```ts
import { Params } from 'nestjs-typebox';

@Controller('cats')
export class CatController {

    constructor(private catService: CatService) {}

    @Get()
    async getCats(): Promise<CatResponseDto[]> {
        return this.catService.getCats();
    }

    @Get(':id')
    async getCat(@Params() params: CatParamsDto): Promise<CatResponseDto> {
        return this.catService.getCat(params.id);
    }

    @Post()
    async createCat(@Body() data: CatCreateDto): Promise<CatResponseDto> {
        return this.catService.createCat(data);
    }

    @Patch(':id')
    async updateCat(@Params() params: CatParamsDto, @Body() data: CatUpdateDto): Promise<CatResponseDto> {
        return this.catService.updateCat(params.id, data);
    }

    @Delete(':id)
    async deleteCat(@Params() params: CatParamsDto): Promise<CatResponseDto> {
        return this.catService.deleteCat(params.id);
    }
}
```

### Credits

Swagger patch derived from https://github.com/risenforces/nestjs-zod

### Todo

-   Check for parameter mapping at boot time and throw
-   RespValidate observable support
-   Extract logic out of DTO creator so validation observables can also take regular typebox schemas
-   Add note about Dto "any" behavior for non-object schemas (i.e. unions) (A class can only implement an object type or intersection of object types with statically known members)
