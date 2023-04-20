import { assignMetadata } from '@nestjs/common';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { isTypeboxDto } from './util';
import { Static, TSchema } from '@sinclair/typebox';
import { TypeboxDto } from './create-dto';

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

export type MethodDecorator<T extends (...args: unknown[]) => unknown> = (
    target: unknown,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T> | void;

export type RespType<T extends TSchema> = Static<T> | Promise<Static<T>> | Static<T>[] | Promise<Static<T>[]>;

export const RespValidate = <T extends TSchema>(
    dto: TypeboxDto<T>,
    responseCode = 200
): MethodDecorator<(...args: unknown[]) => RespType<T>> => {
    return (target, key, descriptor) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Reflect.defineMetadata(DECORATORS.API_RESPONSE, { [responseCode]: { type: dto } }, (target as any)[key]);
        return descriptor;
    };
};
