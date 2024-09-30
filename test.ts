/* eslint-disable @typescript-eslint/no-explicit-any */
import { Static, TObject, TSchema, TUnion, Type, TypeGuard } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

export type AllKeys<T> = T extends any ? keyof T : never;
export type Obj<T = unknown> = Record<string, T>;

type Minus1 = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]];

export type IsTuple<T> = T extends [any, ...any] ? true : false;
export type IsNonTupleObjArray<T> = T extends object[] ? (IsTuple<T> extends true ? false : true) : false;

// P = current dot path
// D = current depth
export type DotPathJoin<P extends string, D> = D extends string ? `${P}${'' extends D ? '' : '.'}${D}` : never;

// T = object type
// D = maximum depth to recurse
export type DotPath<T, D extends number = 4> = [D] extends [never]
    ? never
    : IsNonTupleObjArray<T> extends true
      ? T extends object[]
          ? DotPathJoin<`${number}`, DotPath<T[number], Minus1[D]>>
          : never
      : T extends object
        ? {
              [Key in keyof T]-?: Key extends string ? DotPathJoin<Key, DotPath<T[Key], Minus1[D]>> : '';
          }[keyof T]
        : '';

export const stripExcessProps = <T extends TObject | TUnion>(schema: T, obj: Static<T>): Static<T> => {
    return Value.Clean(schema, obj) as Static<T>;
};

export const schemaAtPath = <T extends TSchema>(schema: T, path: (DotPath<Static<T>> & string) | string[]): TSchema => {
    const [segment, ...remainingPath] = typeof path === 'string' ? path.split('.') : path;

    let schemaAtSegment: TSchema | undefined;

    if (TypeGuard.IsObject(schema)) {
        schemaAtSegment = schema.properties[segment];
    } else if (TypeGuard.IsUnion(schema)) {
        const unionSchema = schema.anyOf.flatMap(s => {
            try {
                return schemaAtPath(s, segment as any);
            } catch {
                return [];
            }
        });

        if (unionSchema.length) {
            schemaAtSegment = unionSchema.length === 1 ? unionSchema[0] : Type.Union(unionSchema);
        }
    }

    if (!schemaAtSegment) {
        throw new Error('Invalid schema path.');
    }

    return remainingPath.length ? schemaAtPath(schemaAtSegment, remainingPath) : schemaAtSegment;
};

const Person = Type.Object({
    name: Type.String(),
    age: Type.Number(),
    type: Type.Literal('Person'),
    address: Type.Object({
        street: Type.String(),
        city: Type.String(),
        zip: Type.Number(),
    }),
});

const Animal = Type.Object({
    name: Type.String(),
    breed: Type.String(),
    type: Type.Literal('Animal'),
});

const Thing = Type.Union([Person, Animal]);
type Thing = Static<typeof Thing>;

type Test = DotPath<Thing>;

console.log(schemaAtPath(Thing, 'address.zip'));

console.log(
    stripExcessProps(Thing, {
        name: 'Andrew',
        type: 'Person',
        age: 36,
        gender: 'Male',
        address: { street: 'riverside ave', city: 'Jacksonville', zip: 32205, state: 'Florida' },
    } as any)
);
