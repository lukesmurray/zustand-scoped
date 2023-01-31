import { createScopedStore, stateReq } from "src";

type BearState = {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
};

type BearInitialData = {
  bears?: number;
};

const createBearStore = createScopedStore<BearState, BearInitialData>()(
  (initialData) =>
    stateReq((set, get) => ({
      bears: initialData.bears ?? 0,
      increasePopulation: () =>
        set((state) => ({ ...state, bears: state.bears + 1 })),
      removeAllBears: () => set({ ...get(), bears: 0 }),
    }))
);

// no need to pass initial data if all the values are optional
const useBearStore = createBearStore();
const vanillaBearStore = createBearStore.store();

// If the initial data has non-optional values, you need to pass the initial data
type BearDefinedInitialData = {
  bears: number;
};

const createDefinedBearStore = createScopedStore<
  BearState,
  BearDefinedInitialData
>()((initialData) =>
  stateReq((set, get) => ({
    bears: initialData.bears,
    increasePopulation: () =>
      set((state) => ({ ...state, bears: state.bears + 1 })),
    removeAllBears: () => set({ ...get(), bears: 0 }),
  }))
);

// these will throw an error without passing initial data
const useDefinedBearStore = createDefinedBearStore({ bears: 0 });
const vanillaDefinedBearStore = createDefinedBearStore.store({ bears: 0 });
