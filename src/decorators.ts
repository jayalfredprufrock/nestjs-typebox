import { assignMetadata } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum.js';
import { DECORATORS } from '@nestjs/swagger/dist/constants.js';
import { Static, TSchema, TypeGuard } from '@sinclair/typebox';

import { TypeboxDto } from './create-dto.js';
import { isTypeboxDto } from './util.js';
import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';
import { TypeboxValidationException } from './exceptions.js';
import { TAny } from '@sinclair/typebox';

export const Params = (): ParameterDecorator => {
    return (target, key, index) => {
        if (!key) return;
        const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, key) ?? {};
        const [type] = Reflect.getMetadata('design:paramtypes', target, key) ?? [];
        if (isTypeboxDto(type)) {
            const objSchema = type.toJsonSchema();
            if (objSchema.type === 'object') {
                const parameters = Object.entries<Record<string, unknown>>(objSchema.properties).map(
                    ([name, { description, examples, ...schema }]) => ({
                        in: 'path',
                        name,
                        description,
                        examples,
                        schema,
                        required: objSchema.required?.includes(name),
                    })
                );
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                Reflect.defineMetadata(DECORATORS.API_PARAMETERS, parameters, (target as any)[key]);
            }
        }
        Reflect.defineMetadata(ROUTE_ARGS_METADATA, assignMetadata(args, RouteParamtypes.PARAM, index), target.constructor, key);
    };
};

type MethodDecorator<T extends Function> = (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T> | void;

export type RespType<T extends TSchema> = Static<T> | Promise<Static<T>>;

export interface SchemaValidator<T extends TSchema> {
    schema: T;
    check: TypeCheck<T>['Check'];
    validate(data: unknown): Static<T>;
}

export function isSchemaValidator(type: any): type is SchemaValidator<TAny> {
    return type && typeof type === 'object' && typeof type.validate === 'function';
}

export function buildSchemaValidator<T extends TSchema>(dtoOrSchema: TypeboxDto<T> | T): SchemaValidator<T> {
    const schema = isTypeboxDto(dtoOrSchema) ? dtoOrSchema.typeboxSchema : dtoOrSchema;

    if (!TypeGuard.TSchema(schema)) {
        throw new Error('buildSchemaValidator expects a TypeBox schema or nestjs-typebox DTO class.');
    }

    const checker = TypeCompiler.Compile(schema);

    return {
        schema,
        check: checker.Check,
        validate(data: unknown) {
            if (checker.Check(data)) return data;
            throw new TypeboxValidationException(checker.Errors(data));
        },
    };
}

export function ValidateResp<T extends TSchema, M extends (...args: any[]) => Promise<Static<T>> | Static<T>>(
    dtoOrSchema: TypeboxDto<T> | T,
    responseCode = 200
): MethodDecorator<M> {
    return (target, key, descriptor) => {
        const validator = buildSchemaValidator(dtoOrSchema);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Reflect.defineMetadata(DECORATORS.API_RESPONSE, { [responseCode]: { type: validator } }, (target as any)[key]);
        return descriptor;
    };
}

/*
export function ValidateResp<T extends TSchema>(
    dtoOrSchema: TypeboxDto<T> | T,
    responseCode?: number
): (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Static<T>>
) => TypedPropertyDescriptor<(...args: any[]) => Static<T>>;

export function ValidateResp<S extends TSchema, T extends Promise<Static<S>>>(
    dtoOrSchema: TypeboxDto<S> | S,
    responseCode?: number
): (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => T>
) => TypedPropertyDescriptor<(...args: any[]) => T>;

export function ValidateResp<T extends TSchema>(
    dtoOrSchema: TypeboxDto<T> | T,
    responseCode = 200
): (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => any>
) => TypedPropertyDescriptor<(...args: any[]) => any> {
    return (target, key, descriptor) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Reflect.defineMetadata(DECORATORS.API_RESPONSE, { [responseCode]: { type: validator } }, (target as any)[key]);
        return descriptor;
    };
}
*/
