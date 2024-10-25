# nestjs-typebox

This library provides helper utilities for writing and validating NestJS APIs using [TypeBox](https://github.com/sinclairzx81/typebox) as
an alternative to class-validator/class-transformer. Can be configured to patch @nestjs/swagger allowing OpenAPI generation to continue working.
Supports property defaults, basic type coercion, transforms, stripping unknown properties, and custom error messages. See typebox docs for more info.

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
        minLength: 10,
        description: 'Secret microchip number. Not sent to client',
        errorMessage: '"microchip" is required and must be at least 10 characters.'
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
> enforcing path parameters to be properly defined as request "param" validators. Otherwise, it simply
> passes through options specified in `validate` to the underlying @Validator decorator.

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
        validate: {
            response: Type.Omit(PetSchema, ['microchip']),
            request: [
                { name: 'id', type: 'param', schema: Type.Number() },
                { type: 'body', schema: Type.Partial(Type.Omit(PetSchema, ['id'])) },
            ],
        },
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
        validate: {
            response: Type.Omit(PetSchema, ['microchip']),
            request: [{ name: 'id', type: 'param', schema: Type.Number() }],
        },
    })
    async deletePet(id: number) {
        return this.petService.deletePet(id);
    }
}
```

### 3. Optionally configure

Calling configure allows for the patching of the swagger plugin, custom
string formats (currently only email), and support for `errorMessage` overrides
within schema options.

```ts
// main.ts

import { Reflector } from '@nestjs/core';
import { configureNestJsTypebox } from 'nestjs-typebox';

configureNestJsTypebox({
    patchSwagger: true,
    setFormats: true,
});

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
-   support validating entire query object? (instead of individual values)
-   check controller metadata so resolved path can include params specified at the controller level
