import { createScopedStore, stateReq } from "src";

type BearState = {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
};

// define the store creator.
const createBearStore = createScopedStore<BearState>()(() =>
  stateReq((set, get) => ({
    bears: 0,
    increasePopulation: () =>
      set((state) => ({ ...state, bears: state.bears + 1 })),
    removeAllBears: () => set({ ...get(), bears: 0 }),
  }))
);

// get the vanilla store
const store = createBearStore.store();

// use the vanilla store
const { getState, setState, subscribe } = store;
