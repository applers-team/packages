import { OptionalKeys, RequiredKeys } from './util.extract-keys-by-type';

type AcceptUndefined<T> = {
  [P in keyof T]: T[P] | undefined;
};

type RequiredButAcceptUndefined<T> = AcceptUndefined<Required<T>>;

export type DeepRequiredAcceptUndefinedForOptional<T> = Pick<
  T,
  RequiredKeys<T>
> &
  RequiredButAcceptUndefined<Pick<T, OptionalKeys<T>>>;
