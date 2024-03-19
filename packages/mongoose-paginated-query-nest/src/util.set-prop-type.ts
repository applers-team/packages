// TODO: replace with npm package once we have this published

// https://stackoverflow.com/questions/58434389/typescript-deep-keyof-of-a-nested-object
// https://stackoverflow.com/questions/67884720/typescript-omit-nested-property

type Primitives = string | number | boolean | symbol;

/**
 * Get all valid nested paths of object
 */
type AllProps<
  Obj,
  Cache extends Array<Primitives> = [],
> = Obj extends Primitives
  ? Cache
  : {
      [Prop in keyof Obj]:
        | [...Cache, Prop] // <------ it should be unionized with recursion call
        | AllProps<Obj[Prop], [...Cache, Prop]>;
    }[keyof Obj];

type Head<T extends ReadonlyArray<any>> = T extends []
  ? never
  : T extends [infer Head]
  ? Head
  : T extends [infer Head, ...infer _]
  ? Head
  : never;

type Tail<T extends ReadonlyArray<any>> = T extends []
  ? []
  : T extends [infer _]
  ? []
  : T extends [infer _, ...infer Rest]
  ? Rest
  : never;

type Last<T extends ReadonlyArray<any>> = T['length'] extends 1 ? true : false;

type OmitBase<Obj, Path extends ReadonlyArray<any>> = Last<Path> extends true
  ? {
      [Prop in Exclude<keyof Obj, Head<Path>>]?: Obj[Prop];
    }
  : {
      [Prop in keyof Obj]: OmitBase<Obj[Prop], Tail<Path>>;
    };

type Split<
  Str,
  Cache extends string[] = [],
> = Str extends `${infer Method}.${infer Rest}`
  ? Split<Rest, [...Cache, Method]>
  : Str extends `${infer Last}`
  ? [...Cache, Last]
  : never;

type Join<Arr extends Primitives[], Cache extends string = ''> = Arr extends [
  infer Current,
  ...infer Rest,
]
  ? Current extends string // TODO use Primitives?
    ? Rest extends string[] // TODO use Primitives?
      ? Join<Rest, `${Cache}.${Current}`>
      : never
    : never
  : Cache extends `.${infer Result}`
  ? Result
  : never;

// we should allow only existing properties in right order
type OmitBy<Obj, Keys extends Join<AllProps<Obj>>> = OmitBase<Obj, Split<Keys>>;

type ReverseArray<Arr extends any[], Cache extends any[] = []> = Arr extends [
  infer Current,
  ...infer Rest,
]
  ? ReverseArray<Rest, [Current, ...Cache]>
  : Cache;

type BuildObject<Path extends string[], Cache> = Path extends [
  infer Current,
  ...infer Rest,
]
  ? Current extends string
    ? Rest extends string[]
      ? BuildObject<
          Rest,
          {
            [key in 'key' as `${Current}`]: Cache;
          }
        >
      : never
    : never
  : Cache;

export type SetPropType<
  Obj,
  ToOmit extends Join<AllProps<Obj>>,
  NewType,
> = OmitBy<Obj, ToOmit> & BuildObject<ReverseArray<Split<ToOmit>>, NewType>;

// export type OmitByMultiple<
//   Obj,
//   Keys extends Join<AllProps<Obj>>[]
// > = Keys extends [infer Current, ...infer Rest]
//   ? Current extends Join<AllProps<Obj>>
//     ? Rest extends Join<AllProps<Obj>>[]
//       ? OmitByMultiple<OmitBy<Obj, Current>, Rest>
//       : never
//     : never
//   : Obj;

// type DeepAnyable<T> = T extends Builtin
//   ? T | any
//   : T extends Map<infer K, infer V>
//     ? Map<DeepAnyable<K>, DeepAnyable<V>>
//     : T extends WeakMap<infer K, infer V>
//       ? WeakMap<DeepAnyable<K>, DeepAnyable<V>>
//       : T extends Set<infer U>
//         ? Set<DeepAnyable<U>>
//         : T extends WeakSet<infer U>
//           ? WeakSet<DeepAnyable<U>>
//           : T extends Array<infer U>
//             ? T extends IsTuple<T>
//               ? {
//                 [K in keyof T]: DeepAnyable<T[K]> | any;
//               }
//               : Array<DeepAnyable<U>>
//             : T extends Promise<infer U>
//               ? Promise<DeepAnyable<U>>
//               : T extends {}
//                 ? {
//                   [K in keyof T]: DeepAnyable<T[K]>;
//                 }
//                 : T | any;

// add `& (string | number)` to the keyof ObjectType
// type NestedKeyOf<ObjectType extends object> = {
//   [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
//     ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
//     : `${Key}`;
// }[keyof ObjectType & (string | number)];

// type Cons<H, T> = T extends readonly any[]
//   ? ((h: H, ...t: T) => void) extends (...r: infer R) => void
//     ? R
//     : never
//   : never;
//
// type Prev = [
//   never,
//   0,
//   1,
//   2,
//   3,
//   4,
//   5,
//   6,
//   7,
//   8,
//   9,
//   10,
//   11,
//   12,
//   13,
//   14,
//   15,
//   16,
//   17,
//   18,
//   19,
//   20,
//   ...0[]
// ];
//
// type Paths<T, D extends number = 10> = [D] extends [never]
//   ? never
//   : T extends object
//     ? {
//       [K in keyof T]-?:
//       | [K]
//       | (Paths<T[K], Prev[D]> extends infer P
//       ? P extends []
//         ? never
//         : Cons<K, P>
//       : never);
//     }[keyof T]
//     : [];
//
// type Leaves<T, D extends number = 10> = [D] extends [never]
//   ? never
//   : T extends object
//     ? { [K in keyof T]-?: Cons<K, Leaves<T[K], Prev[D]>> }[keyof T]
//     : [];

// type A = {
//   a: {
//     b: string;
//     c: number;
//   };
// };
//
// type B = {
//   a: {
//     b: number;
//   };
// };
//
// type C = OmitBy<A, 'a.b'> & B;

// type Foo = OmitBy<{ a: { b: string; c: number } }, 'a.c'>;
// type Foo1 = OmitByMultiple<{ a: { b: string; c: number; d: number } }, ['a.c', 'a.b']>;
//
// const foo: Foo1 = {
//   a: {
//
//   },
// };
// TODO: omitting all properties of a nested object results in to omitting nothing
