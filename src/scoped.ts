import { StateCreator, StoreMutatorIdentifier } from "zustand";

type Scoped = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  initializer: StateCreator<T, [...Mps, ["zustand-scoped/scoped", never]], Mcs>
) => StateCreator<T, Mps, [["zustand-scoped/scoped", never], ...Mcs]>;

declare module "zustand/vanilla" {
  // eslint-disable-next-line unused-imports/no-unused-vars
  interface StoreMutators<S, A> {
    "zustand-scoped/scoped": WithScoped<S>;
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
type StoreScoped<S> = S extends {
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

type WithScoped<S> = Write<S, StoreScoped<S>>;

type ScopedImpl = <T>(
  storeInitializer: StateCreator<T, [], []>
) => StateCreator<T, [], []>;

const scopedImpl: ScopedImpl = (initializer) => (set, get, store) => {
  return initializer(set, get, store);
};

export const scoped = scopedImpl as unknown as Scoped;
