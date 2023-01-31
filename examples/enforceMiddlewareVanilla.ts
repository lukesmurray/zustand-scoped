import { create, StateCreator } from "zustand";
import {
  devtools,
  DevtoolsOptions,
  persist,
  PersistOptions,
} from "zustand/middleware";

// Example based on this comment https://github.com/pmndrs/zustand/issues/1242#issuecomment-1231925031

// Add each of your middlewares in order from outermost to innermost in the
// following array.
//
// For zustand middlewares
//   see https://github.com/pmndrs/zustand#middlewares-and-their-mutators-reference
// For zustand-scoped middlewares
//   see https://github.com/lukesmurray/zustand#middlewares-and-their-mutators-reference
type Mutators = [["zustand/devtools", never], ["zustand/persist", unknown]];

// T is the store type
type MiddlewareFunction<T> = (
  stateCreator: StateCreator<T, Mutators>,
  options: {
    devtoolsOptions: DevtoolsOptions;
    persistOptions: PersistOptions<T>;
  }
) => StateCreator<T, [], Mutators>;

// function which applies middlewares
function middlewares<T>(
  ...args: Parameters<MiddlewareFunction<T>>
): ReturnType<MiddlewareFunction<T>> {
  const [stateCreator, { devtoolsOptions, persistOptions }] = args;
  return devtools(persist(stateCreator, persistOptions), devtoolsOptions);
}

// only export the function that creates the store
export function createStoreWithMiddleware<T>(
  ...args: Parameters<MiddlewareFunction<T>>
) {
  return create<T>()(middlewares(...args));
}

// The following could be in a separate file

type CounterState = {
  count: number;
  inc: () => void;
};

const useCounter = createStoreWithMiddleware<CounterState>(
  (set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }),
  {
    devtoolsOptions: {
      name: "counter",
    },
    persistOptions: {
      name: "counter",
    },
  }
);
