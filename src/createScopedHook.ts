import { StoreApi, UseBoundStore } from "zustand";

type ExtractState<S> = S extends { getState: () => infer T } ? T : never;

export function createScopedHook<S extends StoreApi<unknown>, A, C, U>(
  parentStore: UseBoundStore<S>,
  childSelector: (childSelectorArg: A) => (state: ExtractState<S>) => C,
  defaultChildSelectorArg: A
): (selector: (state: C) => U, equalityFn?: (a: U, b: U) => boolean) => U;
export function createScopedHook<S extends StoreApi<unknown>, A, C, U>(
  parentStore: UseBoundStore<S>,
  childSelector: (childSelectorArg: A) => (state: ExtractState<S>) => C
): (
  childSelectorArg: A,
  selector: (state: C) => U,
  equalityFn?: (a: U, b: U) => boolean
) => U;
export function createScopedHook<S extends StoreApi<unknown>, A, C, U>(
  parentStore: UseBoundStore<S>,
  childSelector: (childSelectorArg: A) => (state: ExtractState<S>) => C,
  defaultChildSelectorArg?: A
):
  | ((
      childSelectorArg: A,
      selector: (state: C) => U,
      equalityFn?: (a: U, b: U) => boolean
    ) => U)
  | ((selector: (state: C) => U, equalityFn?: (a: U, b: U) => boolean) => U) {
  if (defaultChildSelectorArg != null) {
    return (selector: (state: C) => U, equalityFn?: (a: U, b: U) => boolean) =>
      parentStore(
        (state) => selector(childSelector(defaultChildSelectorArg)(state)),
        equalityFn
      );
  }

  return (childSelectorArg, selector, equalityFn) =>
    parentStore(
      (state) => selector(childSelector(childSelectorArg)(state)),
      equalityFn
    );
}
