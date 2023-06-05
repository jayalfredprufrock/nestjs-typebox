/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { assignMetadata, PipeTransform } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum.js';
import { ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DECORATORS } from '@nestjs/swagger/dist/constants.js';
import { Static, TSchema, TypeGuard } from '@sinclair/typebox';
import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';

import { TypeboxValidationException } from './exceptions.js';
import { coerceType, ucFirst } from './util.js';

type Obj<T = unknown> = Record<string, T>;
const isObj = (obj: unknown): obj is Obj => obj !== null && typeof obj === 'object';

type MethodDecorator<T extends Function> = (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T> | void;

export interface SchemaValidator<T extends TSchema = TSchema> {
    schema: T;
    name: string;
    check: TypeCheck<T>['Check'];
    validate(data: Obj | Obj[]): Static<T>;
}
export interface ValidatorConfigBase<T extends TSchema = TSchema> {
    schema: T;
    coerceTypes?: boolean;
    stripUnknownProps?: boolean;
    name?: string;
    required?: boolean;
}
export interface ResponseValidatorConfig<T extends TSchema = TSchema> extends ValidatorConfigBase<T> {
    type?: 'response';
    responseCode?: number;
    required?: true;
}

export interface ParamValidatorConfig extends ValidatorConfigBase {
    type: 'param';
    name: string;
    stripUnknownProps?: never;
}

export interface QueryValidatorConfig extends ValidatorConfigBase {
    type: 'query';
    name: string;
    stripUnknownProps?: never;
}

export interface BodyValidatorConfig extends ValidatorConfigBase {
    type: 'body';
}

export type RequestValidatorConfig = ParamValidatorConfig | QueryValidatorConfig | BodyValidatorConfig;
export type SchemaValidatorConfig = RequestValidatorConfig | ResponseValidatorConfig;

export type ValidatorType = NonNullable<SchemaValidatorConfig['type']>;

export interface ValidatorConfig<
    S extends TSchema,
    ResponseConfig extends ResponseValidatorConfig<S>,
    RequestConfigs extends RequestValidatorConfig[]
> {
    response?: S | ResponseConfig;
    request?: [...RequestConfigs];
}

type RequestConfigsToTypes<RequestConfigs extends RequestValidatorConfig[]> = {
    [K in keyof RequestConfigs]: RequestConfigs[K]['required'] extends false
        ? Static<RequestConfigs[K]['schema']> | undefined
        : Static<RequestConfigs[K]['schema']>;
};

export function isSchemaValidator(type: any): type is SchemaValidator {
    return type && typeof type === 'object' && typeof type.validate === 'function';
}

export function buildSchemaValidator(config: SchemaValidatorConfig): SchemaValidator {
    const { type, schema, coerceTypes, stripUnknownProps, name, required } = config;

    if (!type) {
        throw new Error('Validator missing "type".');
    }

    if (!name) {
        throw new Error(`Validator of type "${type}" missing name.`);
    }

    if (!TypeGuard.TSchema(schema)) {
        throw new Error(`Validator "${name}" expects a TypeBox schema.`);
    }

    const checker = TypeCompiler.Compile(schema);

    return {
        schema,
        name,
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
    T extends TSchema,
    ResponseValidator extends ResponseValidatorConfig<T>,
    RequestValidators extends RequestValidatorConfig[],
    MethodDecoratorType extends (
        ...args: [...RequestConfigsToTypes<RequestValidators>, ...any[]]
    ) => Promise<Static<ResponseValidator['schema']>> | Static<ResponseValidator['schema']>
>(validatorConfig: ValidatorConfig<T, ResponseValidator, RequestValidators>): MethodDecorator<MethodDecoratorType> {
    return (target, key, descriptor) => {
        let args = Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, key) ?? {};

        const { response: responseValidatorConfig, request: requestValidatorConfigs } = validatorConfig;

        const methodName = ucFirst(String(key));

        if (responseValidatorConfig) {
            const validatorConfig: ResponseValidatorConfig = TypeGuard.TSchema(responseValidatorConfig)
                ? { schema: responseValidatorConfig }
                : responseValidatorConfig;

            const {
                responseCode = 200,
                required = true,
                stripUnknownProps = true,
                name = `${methodName}Response`,
                ...config
            } = validatorConfig;
            const validator = buildSchemaValidator({ ...config, required, stripUnknownProps, name, type: 'response' });
            Reflect.defineMetadata(DECORATORS.API_RESPONSE, { [responseCode]: { type: validator } }, (target as any)[key]);
        }

        requestValidatorConfigs?.forEach((validatorConfig, index) => {
            switch (validatorConfig.type) {
                case 'body': {
                    const { required = true, name = `${methodName}Body`, ...config } = validatorConfig;
                    const validator = buildSchemaValidator({ ...config, name, required } as SchemaValidatorConfig);
                    const validatorPipe: PipeTransform = { transform: value => validator.validate(value) };

                    args = assignMetadata(args, RouteParamtypes.BODY, index, undefined, validatorPipe);
                    Reflect.defineMetadata(ROUTE_ARGS_METADATA, args, target.constructor, key);
                    ApiBody({ type: validator as any, required })(target, key, descriptor);

                    break;
                }

                case 'param': {
                    const { required = true, coerceTypes = true, ...config } = validatorConfig;
                    const validator = buildSchemaValidator({ ...config, coerceTypes, required } as SchemaValidatorConfig);
                    const validatorPipe: PipeTransform = { transform: value => validator.validate(value) };

                    args = assignMetadata(args, RouteParamtypes.PARAM, index, validatorConfig.name, validatorPipe);
                    Reflect.defineMetadata(ROUTE_ARGS_METADATA, args, target.constructor, key);
                    ApiParam({ name: validatorConfig.name, schema: validatorConfig.schema, required })(target, key, descriptor);

                    break;
                }

                case 'query': {
                    const { required = false, coerceTypes = true, ...config } = validatorConfig;
                    const validator = buildSchemaValidator({ ...config, required, coerceTypes } as SchemaValidatorConfig);
                    const validatorPipe: PipeTransform = { transform: value => validator.validate(value) };

                    args = assignMetadata(args, RouteParamtypes.QUERY, index, validatorConfig.name, validatorPipe);
                    Reflect.defineMetadata(ROUTE_ARGS_METADATA, args, target.constructor, key);
                    ApiQuery({ name: validatorConfig.name, schema: validatorConfig.schema, required })(target, key, descriptor);
                }
            }
        });

        return descriptor;
    };
}
