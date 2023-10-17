import capitalize from 'lodash/capitalize';
import mapKeys from 'lodash/mapKeys';
import mapValues from 'lodash/mapValues';
import { MarkOptional } from 'ts-essentials';

import {
  AsyncThunk,
  CreateSliceOptions,
  Selector,
  SliceCaseReducers,
  createSlice,
} from '@reduxjs/toolkit';

import {
  FeatureState,
  FeatureWithPrefix,
  FeatureWithPrefixAndThunks,
  FeatureWithoutPrefix,
  RootStateSelectors,
  SelectorsObject,
  StateSelectors,
} from './types';

function createSelectors<State>() {
  return <
    Selectors extends StateSelectors<State>,
    Name extends string = string,
  >(
    name: Name,
    selectors: Selectors,
  ): RootStateSelectors<State, Selectors, Name> => {
    const mainSelector: Selector<FeatureState<State, Name>, State> = (
      rootState,
    ) => rootState[name];

    return {
      getState: mainSelector,
      ...mapValues(
        selectors,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector) => (rootState: FeatureState<State, Name>, props: any) =>
          selector(mainSelector(rootState), props),
      ),
    };
  };
}

export function createFeature<
  State,
  CaseReducers extends SliceCaseReducers<State>,
  Selectors extends StateSelectors<State>,
  Name extends string = string,
>(
  options: CreateSliceOptions<State, CaseReducers, Name> &
    MarkOptional<SelectorsObject<State, Selectors>, 'selectors'>,
): FeatureWithPrefix<State, CaseReducers, Selectors, Name> & {
  addThunks: <
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ThunksMap extends Record<string, AsyncThunk<any, any, Record<string, any>>>,
  >(
    thunks: ThunksMap,
  ) => FeatureWithPrefixAndThunks<
    ThunksMap,
    State,
    CaseReducers,
    Selectors,
    Name
  >;
} {
  const slice = createSlice(options);
  const reducedSlice: FeatureWithoutPrefix<
    State,
    CaseReducers,
    Selectors,
    Name
  > = {
    ...slice,
    selectors: createSelectors<State>()(
      options.name,
      options?.selectors ?? ({} as Selectors),
    ),
    reducer: { [slice.name]: slice.reducer },
  };
  const prefixedSlice = {
    ...mapKeys(reducedSlice, (value, key) => `${slice.name}${capitalize(key)}`),
    name: reducedSlice.name,
  };

  return {
    ...prefixedSlice,
    addThunks(thunks) {
      const enhancedSlice = {
        ...reducedSlice,
        actions: {
          ...reducedSlice.actions,
          ...thunks,
        },
      };

      return {
        ...mapKeys(
          enhancedSlice,
          (value, key) => `${slice.name}${capitalize(key)}`,
        ),
        name: enhancedSlice.name,
      } as FeatureWithPrefixAndThunks<
        typeof thunks,
        State,
        CaseReducers,
        Selectors,
        Name
      >;
    },
  };
}
