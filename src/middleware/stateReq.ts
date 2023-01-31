import { StateCreator, StoreMutatorIdentifier } from "zustand";

type StateReq = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  initializer: StateCreator<
    T,
    [...Mps, ["zustand-scoped/stateReq", never]],
    Mcs
  >
) => StateCreator<T, Mps, [["zustand-scoped/stateReq", never], ...Mcs]>;

declare module "zustand/vanilla" {
  // eslint-disable-next-line unused-imports/no-unused-vars
  interface StoreMutators<S, A> {
    "zustand-scoped/stateReq": WithStateReq<S>;
  }
}

// Helper to overwrite properties of T with properties of U
type Write<T, U> = Omit<T, keyof U> & U;

// helper to skip the first two arguments of setState
type SkipTwo<T> = T extends { length: 0 }
  ? []
  : T extends { length: 1 }
  ? []
  : T extends { length: 0 | 1 }
  ? []
  : T extends [unknown, unknown, ...infer A]
  ? A
  : T extends [unknown, unknown?, ...infer A]
  ? A
  : T extends [unknown?, unknown?, ...infer A]
  ? A
  : never;

// Makes all types Partial<T> in setState Required<T>
type StoreStateReq<S> = S extends {
  getState: () => infer T;
  setState: infer SetState;
}
  ? SetState extends (...a: infer A) => infer Sr
    ? {
        setState(
          partial: T | ((state: T) => T),
          replace?: boolean | undefined,
          ...a: SkipTwo<A>
        ): Sr;
      }
    : never
  : never;

type WithStateReq<S> = Write<S, StoreStateReq<S>>;

type StateReqImpl = <T>(
  storeInitializer: StateCreator<T, [], []>
) => StateCreator<T, [], []>;

const stateReqImpl: StateReqImpl = (initializer) => (set, get, store) => {
  return initializer(set, get, store);
};

/**
 * Enforce that `setState` is always called with complete state.
 */
export const stateReq = stateReqImpl as unknown as StateReq;
