import { PayloadAction } from '@reduxjs/toolkit';

import { Resetters, Setters } from './types';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function reducers<State>() {
  return {
    createSetters: <StateProps extends readonly (keyof State)[]>(
      properties: StateProps,
    ) => createSetters<State, StateProps>(properties),
    createResetter: <StateProp extends keyof State>(
      property: StateProp,
      resetValue: State[StateProp],
    ) => createResetter<State, StateProp>(property, resetValue),
  };
}

function createSetters<State, StateProps extends readonly (keyof State)[]>(
  properties: StateProps,
): Setters<Pick<State, typeof properties[number]>> {
  return properties.reduce(
    (result, property) => ({
      ...result,
      [`set${firstLetterToUpperCase(`${String(property)}`)}`]: (
        state: State,
        action: PayloadAction<State[typeof property]>,
      ) => {
        state[property] = action.payload;
      },
    }),
    {},
  ) as Setters<Pick<State, typeof properties[number]>>;
}

function createResetter<State, StateProp extends keyof State>(
  property: StateProp,
  resetValue: State[StateProp],
): Resetters<Pick<State, StateProp>> {
  return {
    [`reset${firstLetterToUpperCase(`${String(property)}`)}`]: (state: State) => {
      state[property] = resetValue;
    },
  } as Resetters<Pick<State, StateProp>>;
}

function firstLetterToUpperCase(text: string) {
  return `${text.charAt(0).toUpperCase()}${text.substring(1)}`;
}
