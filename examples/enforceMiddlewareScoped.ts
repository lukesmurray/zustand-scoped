import { createScopedStore, devtoolsReq, stateReq } from "src";
import { StateCreator } from "zustand";
import { DevtoolsOptions } from "zustand/middleware";

// Example based on this comment https://github.com/pmndrs/zustand/issues/1242#issuecomment-1231925031

// Add each of your middlewares in order from outermost to innermost in the
// following array.
//
// For zustand middlewares
//   see https://github.com/pmndrs/zustand#middlewares-and-their-mutators-reference
// For zustand-scoped middlewares
//   see https://github.com/lukesmurray/zustand#middlewares-and-their-mutators-reference
type Mutators = [
  ["zustand-scoped/devtoolsReq", never],
  ["zustand-scoped/stateReq", never]
];

// The type of the middlewares function
type MiddlewareFunction<T, I> = (
  initializer: (initialData: I) => StateCreator<T, Mutators>,

  // optionally pass options to the middlewares
  options: {
    devtoolsOptions: DevtoolsOptions;
  }
) => (initialData: I) => StateCreator<T, [], Mutators>;

// function which applies middlewares
function middlewares<T, I>(
  ...args: Parameters<MiddlewareFunction<T, I>>
): ReturnType<MiddlewareFunction<T, I>> {
  const [initializer, { devtoolsOptions }] = args;
  return (initalData) => {
    const stateCreator = initializer(initalData);
    return devtoolsReq(stateReq(stateCreator), devtoolsOptions);
  };
}

// only export the function that creates the store
export function createStoreWithMiddleware<T, I = Partial<T>>(
  ...args: Parameters<MiddlewareFunction<T, I>>
) {
  return createScopedStore<T, I>()(middlewares(...args));
}

// The following could be in a separate file

type CounterState = {
  count: number;
  inc: () => void;
};

const useCounter = createStoreWithMiddleware<CounterState>(
  (initialData) => {
    return (set, get) => ({
      count: initialData.count ?? 0,
      inc: () =>
        set((state) => ({ ...state, count: state.count + 1 }), false, "inc"),
    });
  },
  {
    devtoolsOptions: {
      name: "counter",
    },
  }
);
