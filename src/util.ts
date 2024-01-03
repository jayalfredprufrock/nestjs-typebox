import { SchemaOptions, Static, TLiteral, TLiteralValue, TObject, TPropertyKey, TSchema, TUnion, Type } from '@sinclair/typebox/type';

import { AllKeys, Obj, TPartialSome } from './types.js';

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

export const PartialSome = <T extends TObject, K extends AllKeys<Static<T>>[]>(
    schema: T,
    keys: readonly [...K],
    options?: SchemaOptions
): TPartialSome<T, K> => {
    return Type.Composite([Type.Omit(schema, keys), Type.Partial(Type.Pick(schema, keys))], options);
};

// NOTE: Latest version of typebox makes Omit/Pick distributive by default, but loses strongly typed keys
export const DistOmit = <T extends TSchema, K extends AllKeys<Static<T>>[]>(schema: T, keys: readonly [...K], options?: SchemaOptions) => {
    return Type.Omit(schema, keys, options);
};

export const DistPick = <T extends TSchema, K extends AllKeys<Static<T>>[]>(schema: T, keys: readonly [...K], options?: SchemaOptions) => {
    return Type.Pick(schema, keys, options);
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

// TODO: figure out a way of building UnionPartialSome without having to explicitly overload
// for every tuple length.

export function UnionPartialSome<U1 extends TObject, K extends AllKeys<Static<U1>>[]>(
    union: TUnion<[U1]>,
    keys: readonly [...K]
): TUnion<[TPartialSome<U1, K>]>;

export function UnionPartialSome<U1 extends TObject, U2 extends TObject, K extends AllKeys<Static<U1 | U2>>[]>(
    union: TUnion<[U1, U2]>,
    keys: readonly [...K]
): TUnion<[TPartialSome<U1, K>, TPartialSome<U2, K>]>;

export function UnionPartialSome<U1 extends TObject, U2 extends TObject, U3 extends TObject, K extends AllKeys<Static<U1 | U2 | U3>>[]>(
    union: TUnion<[U1, U2, U3]>,
    keys: readonly [...K]
): TUnion<[TPartialSome<U1, K>, TPartialSome<U2, K>, TPartialSome<U3, K>]>;

export function UnionPartialSome<
    U1 extends TObject,
    U2 extends TObject,
    U3 extends TObject,
    U4 extends TObject,
    K extends AllKeys<Static<U1 | U2 | U3 | U4>>[],
>(
    union: TUnion<[U1, U2, U3, U4]>,
    keys: readonly [...K]
): TUnion<[TPartialSome<U1, K>, TPartialSome<U2, K>, TPartialSome<U3, K>, TPartialSome<U4, K>]>;

export function UnionPartialSome<
    U1 extends TObject,
    U2 extends TObject,
    U3 extends TObject,
    U4 extends TObject,
    K extends AllKeys<Static<U1 | U2 | U3 | U4>>[],
>(
    union: TUnion<[U1, U2, U3, U4]>,
    keys: readonly [...K]
): TUnion<[TPartialSome<U1, K>, TPartialSome<U2, K>, TPartialSome<U3, K>, TPartialSome<U4, K>]>;

export function UnionPartialSome<
    U1 extends TObject,
    U2 extends TObject,
    U3 extends TObject,
    U4 extends TObject,
    U5 extends TObject,
    K extends AllKeys<Static<U1 | U2 | U3 | U4 | U5>>[],
>(
    union: TUnion<[U1, U2, U3, U4, U5]>,
    keys: readonly [...K]
): TUnion<[TPartialSome<U1, K>, TPartialSome<U2, K>, TPartialSome<U3, K>, TPartialSome<U4, K>, TPartialSome<U5, K>]>;

export function UnionPartialSome<
    U1 extends TObject,
    U2 extends TObject,
    U3 extends TObject,
    U4 extends TObject,
    U5 extends TObject,
    U6 extends TObject,
    K extends AllKeys<Static<U1 | U2 | U3 | U4 | U5 | U6>>[],
>(
    union: TUnion<[U1, U2, U3, U4, U5, U6]>,
    keys: readonly [...K]
): TUnion<[TPartialSome<U1, K>, TPartialSome<U2, K>, TPartialSome<U3, K>, TPartialSome<U4, K>, TPartialSome<U5, K>, TPartialSome<U6, K>]>;

export function UnionPartialSome<
    U1 extends TObject,
    U2 extends TObject,
    U3 extends TObject,
    U4 extends TObject,
    U5 extends TObject,
    U6 extends TObject,
    U7 extends TObject,
    K extends AllKeys<Static<U1 | U2 | U3 | U4 | U5 | U6 | U7>>[],
>(
    union: TUnion<[U1, U2, U3, U4, U5, U6, U7]>,
    keys: readonly [...K]
): TUnion<
    [
        TPartialSome<U1, K>,
        TPartialSome<U2, K>,
        TPartialSome<U3, K>,
        TPartialSome<U4, K>,
        TPartialSome<U5, K>,
        TPartialSome<U6, K>,
        TPartialSome<U7, K>,
    ]
>;

export function UnionPartialSome<
    U1 extends TObject,
    U2 extends TObject,
    U3 extends TObject,
    U4 extends TObject,
    U5 extends TObject,
    U6 extends TObject,
    U7 extends TObject,
    U8 extends TObject,
    K extends AllKeys<Static<U1 | U2 | U3 | U4 | U5 | U6 | U7 | U8>>[],
>(
    union: TUnion<[U1, U2, U3, U4, U5, U6, U7, U8]>,
    keys: readonly [...K]
): TUnion<
    [
        TPartialSome<U1, K>,
        TPartialSome<U2, K>,
        TPartialSome<U3, K>,
        TPartialSome<U4, K>,
        TPartialSome<U5, K>,
        TPartialSome<U6, K>,
        TPartialSome<U7, K>,
        TPartialSome<U8, K>,
    ]
>;

export function UnionPartialSome(union: TUnion<TObject[]>, keys: readonly [...TPropertyKey[]]): TUnion {
    return Type.Union(union.anyOf.map(schema => PartialSome(schema, keys)));
}
