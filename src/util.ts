import { SchemaOptions, Static, StringOptions, TLiteral, TObject, TPropertyKey, TSchema, TUnion, Type } from '@sinclair/typebox/type';

import { AllKeys, Obj, TPartialSome } from './types.js';

export const capitalize = <S extends string>(str: S): Capitalize<S> => {
    return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<S>;
};

export const isObj = (obj: unknown): obj is Obj => obj !== null && typeof obj === 'object';

export type TUnionOfString<T extends string[], Acc extends TSchema[] = []> = T extends [infer L extends string, ...infer R extends string[]]
    ? TUnionOfString<R, [...Acc, TLiteral<L>]>
    : Acc;

export const LiteralUnion = <const T extends string[]>(values: [...T], options?: SchemaOptions): TUnion<TUnionOfString<T>> => {
    return Type.Union(
        values.map(value => Type.Literal(value)),
        options
    ) as never;
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

export const IsoDate = (options?: StringOptions) =>
    Type.Transform(Type.String({ format: 'date-time', ...options }))
        .Decode(value => new Date(value))
        .Encode(value => value.toISOString());
