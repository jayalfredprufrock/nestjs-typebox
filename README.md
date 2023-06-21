# nestjs-typebox

This library provides helper utilities for writing and validating NestJS APIs using [TypeBox](https://github.com/sinclairzx81/typebox) as
an alternative to class-validator/class-transformer. It also includes a patch for @nestjs/swagger allowing OpenAPI generation to continue working.

> ### Warning
>
> As of 2.x, this library is undergoing active development and will stabilize with the 3.x release.
> It was decided to drop support for the class-based DTO approach in favor of a pure decorator
> approach, since the class-based approach made it impossible to validate complex union types.

## Installation

```sh
npm i nestjs-typebox @sinclair/typebox
```

## Usage

### 1. Create TypeBox schema

> The example below demonstrates a discriminated union type, which was previously incompatible with
> the class-based DTO approach used in v1. JSON schema fields like "description" will be parsed by the Swagger generator.

```ts
import { Type } from '@sinclair/typebox';

export const PetSchemaBase = Type.Object({
    id: Type.Number(),
    name: Type.String({
        description: "The pet's name",
        examples: ['Figaro'],
    }),
    microchip: Type.String(){
        description: 'Secret microchip number. Not sent to client'
    },
});

export const CatSchema = Type.Composite([
    PetSchemaBase,
    Type.Object({
        type: Type.Literal('cat'),
        breed: Type.Union([Type.Literal('shorthair'), Type.Literal('persian'), Type.Literal('siamese')]),
    }),
]);

export const DogSchema = Type.Composite([
    PetSchemaBase,
    Type.Object({
        type: Type.Literal('dog'),
        breed: Type.Union([Type.Literal('shiba-inu'), Type.Literal('poodle'), Type.Literal('dachshund')]),
    }),
]);

export const PetSchema = Type.Union([CatSchema, DogSchema]);
export type Pet = Static<typeof PetSchema>;
```

### 2. Decorate controller methods

> The example below shows two different decorators and their usage, calling out default configuration.
> Schemas have all been defined inline for brevity, but could just as easily be defined elsewhere
> and reused. The primary benefit of using @HttpEndpoint over @Validator is the additional validation
> enforcing path parameters to be properly defined as request "param" validators.

```ts
import { Type } from '@sinclair/typebox';
import { Validate, HttpEndpoint } from 'nestjs-typebox';

@Controller('pets')
export class PetController {
    constructor(private readonly petService: PetService) {}

    @Get()
    @Validate({
        response: { schema: Type.Array(Type.Omit(PetSchema, ['microchip'])), stripUnknownProps: true },
    })
    async getPets() {
        return this.petService.getPets();
    }

    @Get(':id')
    @Validate({
        // stripUnknownProps is true by default for response validators
        // so this shorthand is equivalent
        response: Type.Omit(PetSchema, ['microchip']),
        request: [
            // coerceTypes is true by default for "param" and "query" request validators
            { name: 'id', type: 'param', schema: Type.Number(), coerceTypes: true },
        ],
    })
    // no need to use @Param() decorator here since the @Validate() decorator will
    // automatically attach a pipe to populate and convert the paramater value
    async getPet(id: number) {
        return this.petService.getPet(id);
    }

    @Post()
    @Validate({
        response: Type.Omit(PetSchema, ['microchip']),
        request: [
            // if "name" not provided, method name will be used
            { type: 'body', schema: Type.Omit(PetSchema, 'id') },
        ],
    })
    async createPet(data: Omit<Pet, 'id'>) {
        return this.petService.createPet(data);
    }

    @HttpEndpoint({
        method: 'PATCH',
        path: ':id',
        response: Type.Omit(PetSchema, ['microchip']),
        request: [
            { name: 'id', type: 'param', schema: Type.Number() },
            { type: 'body', schema: Type.Partial(Type.Omit(PetSchema, ['id'])) },
        ],
    })
    // the order of the controller method parameters must correspond to the order/types of
    // "request" validators, including "required" configuration. Additionally nestjs-typebox will
    // throw at bootup if parameters defined in the "request" validator config don't correspond
    // with the parameters defined in the "path" configuration
    async updatePet(id: number, data: Partial<Omit<Pet, 'id'>>) {
        return this.petService.updatePet(id, data);
    }

    @HttpEndpoint({
        method: 'DELETE',
        path: ':id',
        response: Type.Omit(PetSchema, ['microchip']),
        request: [{ name: 'id', type: 'param', schema: Type.Number() }],
    })
    async deletePet(id: number) {
        return this.petService.deletePet(id);
    }
}
```

### 3. Apply patch for OpenAPI/Swagger Support

> As of 2.x, it is no longer necessary to register any interceptors/pipes,
> global or otherwise.

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

    await app.listen(3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
```

### Credits

Swagger patch derived from https://github.com/risenforces/nestjs-zod

### Todo

-   Validate observable support
-   utility to create typebox schemas with CRUD defaults (i.e. SchemaName['response'], SchemaName['update'])
-   include method name in decorator errors
