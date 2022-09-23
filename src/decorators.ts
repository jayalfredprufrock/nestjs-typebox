import { assignMetadata } from '@nestjs/common';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { isTypeboxDto } from './util';

export const Params = (): ParameterDecorator => {
    return (target, key, index) => {
        const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, key) || {};
        const [type] = Reflect.getMetadata('design:paramtypes', target, key);
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
