import { PayloadAction } from '@reduxjs/toolkit';

// Since CaseReducerWithPrepare typing makes trouble we have to introduce a
// simplified type for our use case:
export type FeatureReducerWithPrepare<State, Payload, PrepareArgument> = {
  reducer: (state: State, action: PayloadAction<Payload>) => void;
  prepare: (payload: PrepareArgument) => Omit<PayloadAction<Payload>, 'type'>;
};
