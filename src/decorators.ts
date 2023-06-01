import { assignMetadata, PipeTransform } from '@nestjs/common';
import { ROUTE_ARGS_METADATA, PATH_METADATA } from '@nestjs/common/constants.js';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum.js';
import { ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DECORATORS } from '@nestjs/swagger/dist/constants.js';
import { Static, TSchema, TypeGuard, TAny } from '@sinclair/typebox';
import { coerceType } from './util.js';
import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';
import { TypeboxValidationException } from './exceptions.js';

type Obj<T = unknown> = Record<string, T>;
const isObj = (obj: unknown): obj is Obj => obj !== null && typeof obj === 'object';

export type PathSegment = `/${string}`;
export type PathRequiredParam = `:${string}`;
export type PathOptionalParam = `?${string}`;
export type PathParam = [...(PathRequiredParam | PathOptionalParam | PathSegment)[]];

type MethodDecorator<T extends Function> = (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T> | void;

export type RespType<T extends TSchema> = Static<T> | Promise<Static<T>>;

export interface SchemaValidator<T extends TSchema = TSchema> {
    schema: T;
    name: string;
    check: TypeCheck<T>['Check'];
    validate(data: Obj | Obj[]): Static<T>;
}

export type ValidatorType = 'response' | 'body' | 'query' | 'param';

export interface ValidatorConfigBase<T extends ValidatorType = ValidatorType, S extends TSchema = TSchema> {
    type: T;
    schema: S;
    coerceTypes?: boolean;
    stripUnknownProps?: boolean;
    schemaName?: string;
    required?: boolean;
}

export interface ResponseValidatorConfig<S extends TSchema = TSchema> extends ValidatorConfigBase<'response', S> {
    type: 'response';
    responseCode?: number;
}
export interface ParamValidatorConfig<S extends TSchema = TSchema> extends ValidatorConfigBase<'param', S> {
    name: string;
}

export type BodyValidatorConfig<S extends TSchema = TSchema> = ValidatorConfigBase<'body', S>;
export interface QueryValidatorConfig<S extends TSchema = TSchema> extends ValidatorConfigBase<'query', S> {
    name: string;
}

export type ValidatorConfig = ResponseValidatorConfig | ParamValidatorConfig | BodyValidatorConfig | QueryValidatorConfig;

type MapToStatic<T extends ValidatorConfig[]> = {
    [K in keyof T]: T[K]['required'] extends false ? Static<T[K]['schema']> | undefined : Static<T[K]['schema']>;
};

export function isSchemaValidator(type: any): type is SchemaValidator {
    return type && typeof type === 'object' && typeof type.validate === 'function';
}

export function buildSchemaValidator(Config: ValidatorConfig): SchemaValidator {
    const { type, schema, coerceTypes, stripUnknownProps, schemaName, required = true } = Config;

    if (!TypeGuard.TSchema(schema)) {
        throw new Error('ValidateResp expects a TypeBox schema or nestjs-typebox DTO class.');
    }

    const checker = TypeCompiler.Compile(schema);

    return {
        schema,
        name: schemaName || schema.title || '',
        check: checker.Check,
        validate(dataOrArray: unknown) {
            let jsonSchema: Obj;
            let processedDataOrArray = dataOrArray;

            if (coerceTypes || stripUnknownProps) {
                let dataArray: unknown[];

                if (Array.isArray(dataOrArray)) {
                    jsonSchema = schema.items ?? {};
                    dataArray = dataOrArray;
                } else {
                    jsonSchema = schema;
                    dataArray = [dataOrArray];
                }

                const knownPropTypes = ((jsonSchema.anyOf ?? jsonSchema.allOf ?? [jsonSchema]) as Obj[]).reduce(
                    (obj: Obj<string>, schema) => {
                        for (const [prop, def] of Object.entries(schema.properties ?? {})) {
                            obj[prop] = def && typeof def === 'object' && 'type' in def ? String(def.type) : 'unknown';
                        }
                        return obj;
                    },
                    {}
                );

                for (let i = 0; i < dataArray.length; i++) {
                    const data = dataArray[i];
                    if (isObj(data)) {
                        const processedData = stripUnknownProps ? {} : data;
                        for (const prop in data) {
                            if (knownPropTypes[prop] === undefined) continue;

                            if (stripUnknownProps) {
                                processedData[prop] = data[prop];
                            }

                            if (coerceTypes) {
                                processedData[prop] = coerceType(knownPropTypes[prop], data[prop]);
                            }
                        }
                        dataArray[i] = processedData;
                    } else if (coerceTypes && typeof jsonSchema.type === 'string') {
                        dataArray[i] = coerceType(jsonSchema.type, data);
                    }
                }

                processedDataOrArray = Array.isArray(dataOrArray) ? dataArray : dataArray[0];
            }

            if (processedDataOrArray === undefined && !required) {
                return;
            }

            if (checker.Check(processedDataOrArray)) return processedDataOrArray;
            throw new TypeboxValidationException(type, checker.Errors(processedDataOrArray));
        },
    };
}

export function Validate<
    Response extends ResponseValidatorConfig,
    Args extends ValidatorConfig[],
    M extends (...args: [...MapToStatic<Args>, ...any[]]) => Promise<Static<Response['schema']>> | Static<Response['schema']>
>(validatorConfigs: [Response, ...Args]): MethodDecorator<M> {
    return (target, key, descriptor) => {
        let args = Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, key) ?? {};
        validatorConfigs.forEach((validatorConfig, index) => {
            const validator = buildSchemaValidator(validatorConfig);
            const validatorPipe: PipeTransform = { transform: value => validator.validate(value) };

            const { required = true, type, schema } = validatorConfig;

            switch (type) {
                case 'response': {
                    const { responseCode } = validatorConfig;

                    Reflect.defineMetadata(DECORATORS.API_RESPONSE, { [responseCode ?? 200]: { type: validator } }, (target as any)[key]);

                    break;
                }

                case 'body': {
                    args = assignMetadata(args, RouteParamtypes.BODY, index - 1, undefined, validatorPipe);
                    Reflect.defineMetadata(ROUTE_ARGS_METADATA, args, target.constructor, key);
                    ApiBody({ type: validator as any, required })(target, key, descriptor);

                    break;
                }

                case 'param': {
                    const { name } = validatorConfig;

                    let path = Reflect.getMetadata(PATH_METADATA, target.constructor, key);
                    console.log('path', path);

                    args = assignMetadata(args, RouteParamtypes.PARAM, index - 1, name, validatorPipe);
                    Reflect.defineMetadata(ROUTE_ARGS_METADATA, args, target.constructor, key);
                    ApiParam({ name, schema, required })(target, key, descriptor);

                    break;
                }

                case 'query': {
                    const { name } = validatorConfig;

                    args = assignMetadata(args, RouteParamtypes.QUERY, index - 1, name, validatorPipe);
                    Reflect.defineMetadata(ROUTE_ARGS_METADATA, args, target.constructor, key);
                    ApiQuery({ name, schema, required })(target, key, descriptor);
                }
            }
        });

        return descriptor;
    };
}
