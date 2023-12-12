import { SchemaOptions, Static, TLiteral, TLiteralValue, TSchema, TUnion, Type } from '@sinclair/typebox/type';

import { AllKeys, Obj } from './types.js';

export const coerceToNumber = (val: unknown, integer?: boolean): unknown => {
    switch (typeof val) {
        case 'number':
            return integer ? Math.floor(val) : val;
        case 'boolean':
            return val === true ? 1 : 0;
        case 'string': {
            const v = Number(val);
            if (Number.isFinite(v)) {
                return integer ? Math.floor(v) : v;
            }
            break;
        }
        case 'object': {
            if (val === null) return 0;
            break;
        }
    }
    return val;
};

export const coerceType = (type: string, val: unknown): unknown => {
    switch (type) {
        case 'number':
        case 'integer':
            return coerceToNumber(val, type === 'integer');
        default:
            return val;
    }
};

export const capitalize = <S extends string>(str: S): Capitalize<S> => {
    return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<S>;
};

export const isObj = (obj: unknown): obj is Obj => obj !== null && typeof obj === 'object';

export const LiteralUnion = <V extends TLiteralValue[]>(values: readonly [...V], options?: SchemaOptions) => {
    return Type.Union(
        values.map(value => Type.Literal(value)),
        options
    ) as TUnion<{ [I in keyof V]: TLiteral<V[I]> }>;
};

export const DistOmit = <T extends TSchema, K extends AllKeys<Static<T>>[]>(schema: T, keys: readonly [...K], options?: SchemaOptions) => {
    return Type.Extends(schema, Type.Unknown(), Type.Omit(schema, keys), Type.Never(), options);
};

export const DistPick = <T extends TSchema, K extends AllKeys<Static<T>>[]>(schema: T, keys: readonly [...K], options?: SchemaOptions) => {
    return Type.Extends(schema, Type.Unknown(), Type.Pick(schema, keys), Type.Never(), options);
};

export const MaybeArray = <T extends TSchema>(schema: T, options?: SchemaOptions) => Type.Union([schema, Type.Array(schema)], options);

export const Nullable = <T extends TSchema>(schema: T, options?: SchemaOptions) =>
    Type.Optional(Type.Union([schema, Type.Null()], options));

/*
Current issue with Type.KeyOf() + Generics
export const SchemaOverride = <S extends TObject, T extends TObject>(schema: S, overrides: T, options?: ObjectOptions) => {
    return Type.Composite([Type.Omit(schema, Type.KeyOf(overrides)), overrides], options);
};
*/
