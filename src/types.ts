export type CommonKeys<T> = T extends object ? keyof T : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AllKeys<T> = T extends any ? keyof T : never;
export type Subtract<A, C> = A extends C ? never : A;
export type NonCommonKeys<T> = T extends object ? Subtract<AllKeys<T>, CommonKeys<T>> : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PickType<T, K extends AllKeys<T>> = T extends { [k in K]?: any } ? T[K] : undefined;
export type PickTypeOf<T, K extends string | number | symbol> = K extends AllKeys<T> ? PickType<T, K> : never;

export type Merge<T> = {
    [k in CommonKeys<T>]: PickTypeOf<T, k>;
} & {
    [k in NonCommonKeys<T>]?: PickTypeOf<T, k>;
};
