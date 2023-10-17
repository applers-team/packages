// https://stackoverflow.com/a/54487392
type OmitDistributive<T, K extends PropertyKey> = T extends any
  ? T extends object
    ? Id<OmitAllDeep<T, K>>
    : T
  : never;

type Id<T> = {} & { [P in keyof T]: T[P] }; // Cosmetic use only makes the tooltips expad the type can be removed

export type OmitAllDeep<T extends any, K extends PropertyKey> = Omit<
  { [P in keyof T]: OmitDistributive<T[P], K> },
  K
>;
