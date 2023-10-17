import { Middleware, ReducersMapObject } from 'redux';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  PersistMigrate,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { combineReducers, configureStore } from '@reduxjs/toolkit';

export type StorePersistMigrate = PersistMigrate;

export interface StorePersistConfig {
  key: string;
  whitelist: string[];
  version: number;
  migrate: StorePersistMigrate;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createStore<S>(
  reducers: ReducersMapObject<S, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  middlewares: Middleware[],
  debug: boolean,
  persistConfig?: StorePersistConfig,
) {
  const rootReducer = combineReducers(reducers);
  // not calling `persistReducer` breaks the complete typing of the store mechanism somehow
  // therefore instead of skipping the whole persistence logic in case of not present `persistConfig`
  // we simply define fallback values which do not persist anything
  const persistedReducer = persistReducer(
    {
      storage,
      ...(persistConfig
        ? persistConfig
        : {
            key: 'mms',
            whitelist: [],
          }),
    },
    rootReducer,
  );

  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data states that these should be ignored when using redux-persist
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(middlewares),
    devTools: debug,
  });

  const persistor = persistStore(store);

  return {
    rootReducer,
    store,
    persistor,
  };
}
