// example usage:
// type Foo = MarkNestedRequired<NewOrderRpfix, ['clientOrder', 'meta', 'channel']>;
// https://stackoverflow.com/questions/57835286/deep-recursive-requiredt-on-specific-properties/57837897#57837897
export type MarkNestedRequired<T, P extends string[]> = T extends object
  ? Omit<T, Extract<keyof T, P[0]>> &
      Required<
        {
          [K in Extract<keyof T, P[0]>]: NonNullable<
            MarkNestedRequired<T[K], ShiftUnion<K, P>>
          >;
        }
      >
  : T;

export type Shift<T extends any[]> = ((...t: T) => any) extends (
  first: any,
  ...rest: infer Rest
) => any
  ? Rest
  : never;

type ShiftUnion<P extends PropertyKey, T extends any[]> = T extends any[]
  ? T[0] extends P
    ? Shift<T>
    : never
  : never;
