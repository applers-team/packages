import { PayloadAction } from '@reduxjs/toolkit';

export type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (
    state: T,
    action: PayloadAction<T[K]>,
  ) => void;
};

export type Resetters<T> = {
  [K in keyof T as `reset${Capitalize<string & K>}`]: (state: T) => void;
};
