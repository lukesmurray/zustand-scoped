import {
  create,
  createStore,
  Mutate,
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
  UseBoundStore,
} from "zustand";

/** Use context but disallows subscribing to the entire store. */
type UseSafeContextStore<S extends StoreApi<unknown>> = {
  <U>(
    selector: (state: ExtractState<S>) => U,
    equalityFn?: (a: U, b: U) => boolean
  ): U;
};

/** Extract state from a store. */
type ExtractState<S> = S extends { getState: () => infer T } ? T : never;

/**
 * Helper for getting the context value for a scoped store.
 */
export type ScopedContextValue<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends { store: (...args: any) => StoreApi<unknown> }
> = UseSafeContextStore<ReturnType<T["store"]>>;

/** get a property from a type or fallback to a default type */
type Get<T, K, F> = K extends keyof T ? T[K] : F;

export type CreateScopedStore = {
  /**
   * Curried version for specifying the type of T and I.
   * T is the store Type, I is the initial data, Mos is the store middleware
   * mutations.
   */
  <T, I = Partial<T>>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: (initialData: I) => StateCreator<T, [], Mos>
  ) => CreateScopedStoreReturn<T, Mos, I>;
};

/**
 * Return type of `createScopedStore`.
 * Is a function that takes an initializer function and returns a store.
 * Has a `scoped` property that takes (set, get, initialData) and returns the store state.
 */
export type CreateScopedStoreReturn<
  T,
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
  I = Partial<T>,
  U = T
> = {
  /**
   * Create a react hook for accessing the store.
   */
  (
    ...args: Partial<I> extends I ? [initialData?: I] : [initialData: I]
  ): UseBoundStore<Mutate<StoreApi<T>, Mos>>;
  /**
   * Return state which can be nested in a store.
   * Takes in (set, get, initialData) and returns the store state.
   */
  scoped: (
    ...args: Partial<I> extends I
      ? [
          setState: Get<Mutate<StoreApi<T>, Mos>, "setState", never>,
          getState: Get<Mutate<StoreApi<T>, Mos>, "getState", never>,
          initialData?: I
        ]
      : [
          setState: Get<Mutate<StoreApi<T>, Mos>, "setState", never>,
          getState: Get<Mutate<StoreApi<T>, Mos>, "getState", never>,
          initialData: I
        ]
  ) => U;
  /**
   * Return a vanilla store
   */
  store: (
    ...args: Partial<I> extends I ? [initialData?: I] : [initialData: I]
  ) => Mutate<StoreApi<T>, Mos>;
};

type CreateScopedStoreImpl = <
  T,
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
  I = T
>(
  initializer: (
    ...args: Partial<I> extends I ? [initialData?: I] : [initialData: I]
  ) => StateCreator<T, [], Mos>
) => CreateScopedStoreReturn<T, Mos, I>;

const createScopedStoreImpl: CreateScopedStoreImpl = (stateCreator) => {
  // state type
  type TState = ReturnType<ReturnType<typeof stateCreator>>;
  // initial data type
  type IState = Parameters<typeof stateCreator>[0];
  // returned scoped function type
  type TScoped = CreateScopedStoreReturn<TState, [], IState>["scoped"];
  // returned store function type
  type TStore = CreateScopedStoreReturn<TState, [], IState>["store"];

  // @ts-expect-error -- cannot typecheck due to IState being unknown
  const scoped: TScoped = (setState, getState, initialData) => {
    // @ts-expect-error -- cannot typecheck due to IState being unknown
    const createState = stateCreator(initialData);
    return createState(setState, getState, {
      getState,
      setState,
      subscribe: () => {
        throw new Error("Cannot subcribe to a scoped store");
      },
      destroy: () => {
        throw new Error("Cannot destroy a scoped store");
      },
    });
  };

  // @ts-expect-error -- cannot typecheck due to IState being unknown
  const store: TStore = (initialData: unknown) => {
    // @ts-expect-error -- cannot typecheck due to IState being unknown
    const createState = stateCreator(initialData);
    return createStore(createState);
  };

  // @ts-expect-error -- cannot typecheck due to IState being unknown
  const actualScopedReturn: CreateScopedStoreReturn<TState, [], IState> =
    Object.assign(
      function hook(initialData: IState) {
        // @ts-expect-error -- cannot typecheck due to IState being unknown
        const createState = stateCreator(initialData);
        return create(createState);
      },
      {
        scoped,
        store,
      }
    );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cannot typecheck due to Mutations being unknown
  return actualScopedReturn as any;
};

// export the function which is either curried (createState is undefined)
// or not (createState is defined)
// to support typesafe usage.
export const createScopedStore: CreateScopedStore = () => (createState) => {
  // @ts-expect-error -- cannot typecheck due to IState being unknown
  return createScopedStoreImpl(createState);
};
