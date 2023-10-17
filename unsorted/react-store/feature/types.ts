import { Action, Reducer } from 'redux';
import { Merge } from 'ts-essentials';

import {
  AsyncThunk,
  ParametricSelector,
  Selector,
  Slice,
  SliceCaseReducers,
} from '@reduxjs/toolkit';

export type PrefixProperties<T, Prefix extends string> = {
  [K in keyof T as `${Prefix}${Capitalize<string & K>}`]: T[K];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReducersMapObject<S = any, A extends Action = Action> = {
  [K in keyof S]: Reducer<S[K], A>;
};

export type FeatureWithPrefixAndThunks<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ThunksMap extends Record<string, AsyncThunk<any, any, Record<string, any>>>,
  State,
  CaseReducers extends SliceCaseReducers<State>,
  Selectors extends StateSelectors<State>,
  Name extends string = string,
> = Merge<
  FeatureWithPrefix<State, CaseReducers, Selectors, Name>,
  PrefixProperties<
    {
      actions: FeatureWithoutPrefix<
        State,
        CaseReducers,
        Selectors,
        Name
      >['actions'] &
        ThunksMap;
    },
    Name
  >
>;

export type FeatureWithoutPrefix<
  State,
  CaseReducers extends SliceCaseReducers<State>,
  Selectors extends StateSelectors<State>,
  Name extends string = string,
> = Merge<
  Merge<
    Slice<State, CaseReducers, Name>,
    ReducerObject<State, CaseReducers, Name>
  >,
  RootSelectorsObject<State, Selectors, Name>
>;

export type ReducerObject<
  State,
  CaseReducers extends SliceCaseReducers<State>,
  Name extends string = string,
> = {
  reducer: {
    [K in 'name' as `${Name}`]: Slice<State, CaseReducers, Name>['reducer'];
  };
};

export type SelectorsObject<State, Selectors extends StateSelectors<State>> = {
  selectors: Selectors;
};

export type RootSelectorsObject<
  State,
  Selectors extends StateSelectors<State>,
  Name extends string = string,
> = {
  selectors: RootStateSelectors<State, Selectors, Name>;
};

export type FeatureState<State, Name extends string = string> = Record<
  Name,
  State
>;

export type FeatureWithPrefix<
  State,
  CaseReducers extends SliceCaseReducers<State>,
  Selectors extends StateSelectors<State>,
  Name extends string = string,
> = Pick<FeatureWithoutPrefix<State, CaseReducers, Selectors, Name>, 'name'> &
  PrefixProperties<
    FeatureWithoutPrefix<State, CaseReducers, Selectors, Name>,
    Name
  >;

export type StateSelectors<State> = Record<
  string | number | symbol,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  StateSelector<State, any, any>
>;

type StateSelector<State, Props, Value> =
  | Selector<State, Value>
  | ParametricSelector<State, Props, Value>;

type UnpackStateSelectorValue<T> = T extends StateSelector<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  infer Value
>
  ? Value
  : never;

type UnpackStateSelectorProps<T> = T extends StateSelector<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  infer Props,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>
  ? Props
  : never;

export type RootStateSelectors<
  State,
  Selectors extends StateSelectors<State>,
  Name extends string = string,
> = Merge<
  { getState: (state: FeatureState<State, Name>) => State },
  {
    [Key in keyof Selectors]: StateSelector<
      FeatureState<State, Name>,
      UnpackStateSelectorProps<Selectors[Key]>,
      UnpackStateSelectorValue<Selectors[Key]>
    >;
  }
>;
