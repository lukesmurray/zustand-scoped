import { StateCreator, StoreMutatorIdentifier } from "zustand";
import { devtools, DevtoolsOptions } from "zustand/middleware";

/** Cast a type T to a type U if T extends U. */
type Cast<T, U> = T extends U ? T : U;
/** Overwrite properties of T with properties of U */
type Write<T, U> = Omit<T, keyof U> & U;
/** Take the first two arguments of a function */
type TakeTwo<T> = T extends { length: 0 }
  ? [undefined, undefined]
  : T extends { length: 1 }
  ? [...a0: Cast<T, unknown[]>, a1: undefined]
  : T extends { length: 0 | 1 }
  ? [...a0: Cast<T, unknown[]>, a1: undefined]
  : T extends { length: 2 }
  ? T
  : T extends { length: 1 | 2 }
  ? T
  : T extends { length: 0 | 1 | 2 }
  ? T
  : T extends [infer A0, infer A1, ...unknown[]]
  ? [A0, A1]
  : T extends [infer A0, (infer A1)?, ...unknown[]]
  ? [A0, A1?]
  : T extends [(infer A0)?, (infer A1)?, ...unknown[]]
  ? [A0?, A1?]
  : never;

/** Apply devtoolsReq to the store. */
type WithDevtoolsReq<S> = Write<S, StoreDevtools<S>>;

/** Store type with devtoolsReq */
type StoreDevtools<S> = S extends {
  setState: (...a: infer Sa) => infer Sr;
}
  ? {
      setState<A extends string | { type: unknown }>(
        ...a: [...a: TakeTwo<Sa>, action: A]
      ): Sr;
    }
  : never;

type DevtoolsReq = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  initializer: StateCreator<
    T,
    [...Mps, ["zustand-scoped/devtoolsReq", never]],
    Mcs
  >,
  devtoolsOptions?: DevtoolsOptions
) => StateCreator<T, Mps, [["zustand-scoped/devtoolsReq", never], ...Mcs]>;

declare module "zustand/vanilla" {
  // eslint-disable-next-line unused-imports/no-unused-vars
  interface StoreMutators<S, A> {
    "zustand-scoped/devtoolsReq": WithDevtoolsReq<S>;
  }
}

type DevtoolsImpl = <T>(
  storeInitializer: StateCreator<T, [], []>,
  devtoolsOptions?: DevtoolsOptions
) => StateCreator<T, [], []>;

const devtoolsImpl: DevtoolsImpl = (storeInitializer, devtoolsOptions) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return devtools(storeInitializer as any, devtoolsOptions) as any;
};

export const devtoolsReq = devtoolsImpl as unknown as DevtoolsReq;
