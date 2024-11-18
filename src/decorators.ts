import { applyDecorators, assignMetadata, Delete, Get, HttpCode, Patch, PipeTransform, Post, Put } from '@nestjs/common';
import { INTERCEPTORS_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum.js';
import { extendArrayMetadata } from '@nestjs/common/utils/extend-metadata.util.js';
import { ApiBody, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DECORATORS } from '@nestjs/swagger/dist/constants.js';
import { StaticDecode, type TSchema, Type, TypeGuard } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { Clean, Convert, Default, TransformDecode, TransformEncode } from '@sinclair/typebox/value';

import { analyzeSchema } from './analyze-schema.js';
import { TypeboxValidationException } from './exceptions.js';
import { TypeboxTransformInterceptor } from './interceptors.js';
import type {
    HttpEndpointDecoratorConfig,
    MethodDecorator,
    RequestConfigsToTypes,
    RequestValidatorConfig,
    ResponseValidatorConfig,
    SchemaValidator,
    SchemaValidatorConfig,
    ValidatorConfig,
} from './types.js';
import { capitalize } from './util.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    if (!TypeGuard.IsSchema(schema)) {
        throw new Error(`Validator "${name}" expects a TypeBox schema.`);
    }

    const analysis = analyzeSchema(schema);
    const references = [...analysis.references.values()];

    const checker = TypeCompiler.Compile(schema, references);

    return {
        schema,
        name,
        check: checker.Check,
        analysis,
        validate(data: unknown) {
            if (analysis.hasDefault) {
                data = Default(schema, references, data);
            }

            if (data === undefined && !required) {
                return;
            }

            if (stripUnknownProps) {
                data = Clean(schema, references, data);
            }

            if (coerceTypes) {
                data = Convert(schema, references, data);
            }

            if (analysis.hasTransform && type === 'response') {
                data = TransformEncode(schema, references, data);
            }

            if (!checker.Check(data)) {
                throw new TypeboxValidationException(type, checker.Errors(data));
            }

            if (analysis.hasTransform && type !== 'response') {
                data = TransformDecode(schema, references, data);
            }

            return data;
        },
    };
}

export function Validate<
    T extends TSchema,
    RequestValidators extends RequestValidatorConfig[],
    MethodDecoratorType extends (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...args: [...RequestConfigsToTypes<RequestValidators>, ...any[]]
    ) => Promise<StaticDecode<T>> | StaticDecode<T>,
>(validatorConfig: ValidatorConfig<T, RequestValidators>): MethodDecorator<MethodDecoratorType> {
    return (target, key, descriptor) => {
        let args = Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, key) ?? {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        extendArrayMetadata(INTERCEPTORS_METADATA, [TypeboxTransformInterceptor], descriptor.value as any);

        const { response: responseValidatorConfig, request: requestValidatorConfigs } = validatorConfig;

        const methodName = capitalize(String(key));

        if (responseValidatorConfig) {
            const validatorConfig: ResponseValidatorConfig = TypeGuard.IsSchema(responseValidatorConfig)
                ? { schema: responseValidatorConfig }
                : responseValidatorConfig;

            const {
                responseCode = 200,
                description,
                example,
                required = true,
                stripUnknownProps = true,
                name = `${methodName}Response`,
                ...config
            } = validatorConfig;

            const validator = buildSchemaValidator({ ...config, required, stripUnknownProps, name, type: 'response' });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Reflect.defineMetadata(
                DECORATORS.API_RESPONSE,
                { [responseCode]: { type: validator, description, example } },
                (target as any)[key]
            );
        }

        requestValidatorConfigs?.forEach((validatorConfig, index) => {
            switch (validatorConfig.type) {
                case 'body': {
                    const { required = true, name = `${methodName}Body`, pipes = [], ...config } = validatorConfig;
                    const validator = buildSchemaValidator({ ...config, name, required } as SchemaValidatorConfig);
                    const validatorPipe: PipeTransform = { transform: value => validator.validate(value) };

                    args = assignMetadata(args, RouteParamtypes.BODY, index, undefined, ...pipes, validatorPipe);
                    Reflect.defineMetadata(ROUTE_ARGS_METADATA, args, target.constructor, key);

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ApiBody({ type: validator as any, required })(target, key, descriptor);

                    break;
                }

                case 'param': {
                    const { required = true, coerceTypes = true, schema = Type.String(), pipes = [], ...config } = validatorConfig;
                    const validator = buildSchemaValidator({ ...config, coerceTypes, required, schema } as SchemaValidatorConfig);
                    const validatorPipe: PipeTransform = { transform: value => validator.validate(value) };

                    args = assignMetadata(args, RouteParamtypes.PARAM, index, validatorConfig.name, ...pipes, validatorPipe);
                    Reflect.defineMetadata(ROUTE_ARGS_METADATA, args, target.constructor, key);
                    ApiParam({ name: validatorConfig.name, schema: validatorConfig.schema, required })(target, key, descriptor);

                    break;
                }

                case 'query': {
                    const { required = false, coerceTypes = true, schema = Type.String(), pipes = [], ...config } = validatorConfig;
                    const validator = buildSchemaValidator({ ...config, coerceTypes, required, schema } as SchemaValidatorConfig);
                    const validatorPipe: PipeTransform = { transform: value => validator.validate(value) };

                    args = assignMetadata(args, RouteParamtypes.QUERY, index, validatorConfig.name, ...pipes, validatorPipe);
                    Reflect.defineMetadata(ROUTE_ARGS_METADATA, args, target.constructor, key);
                    ApiQuery({ name: validatorConfig.name, schema: validatorConfig.schema, required })(target, key, descriptor);
                }
            }
        });

        return descriptor;
    };
}

const nestHttpDecoratorMap = {
    GET: Get,
    POST: Post,
    PATCH: Patch,
    DELETE: Delete,
    PUT: Put,
};

export const HttpEndpoint = <
    S extends TSchema,
    RequestConfigs extends RequestValidatorConfig[],
    MethodDecoratorType extends (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...args: [...RequestConfigsToTypes<RequestConfigs>, ...any[]]
    ) => Promise<StaticDecode<S>> | StaticDecode<S>,
>(
    config: HttpEndpointDecoratorConfig<S, RequestConfigs>
): MethodDecorator<MethodDecoratorType> => {
    const { method, responseCode = 200, path, validate, ...apiOperationOptions } = config;

    const decorators: MethodDecorator[] = [nestHttpDecoratorMap[method](path), HttpCode(responseCode), ApiOperation(apiOperationOptions)];

    if (path) {
        const pathParams = path
            .split('/')
            .filter(seg => seg.startsWith(':'))
            .map(seg => ({ name: seg.replace(/^:([^\?]+)\??$/, '$1'), required: !seg.endsWith('?') }));

        // TODO: handle optional path parameters

        for (const pathParam of pathParams) {
            const paramValidator = validate?.request?.find(v => v.name === pathParam.name);
            if (!paramValidator) {
                throw new Error(`Path param "${pathParam.name}" is missing a request validator.`);
            }
            if (paramValidator.required === false && pathParam.required === true) {
                throw new Error(`Optional path param "${pathParam.name}" is required in validator.`);
            }
        }

        const missingPathParam = validate?.request?.find(v => v.type === 'param' && !pathParams.some(p => p.name == v.name));
        if (missingPathParam) {
            throw new Error(`Request validator references non-existent path parameter "${missingPathParam.name}".`);
        }
    }

    if (validate) {
        decorators.push(Validate(validate));
    }

    return applyDecorators(...decorators);
};
