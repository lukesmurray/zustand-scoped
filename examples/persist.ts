import { createScopedStore, stateReq } from "src";
import { createJSONStorage, persist } from "zustand/middleware";

type BearState = {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
};

const createBearStore = createScopedStore<BearState>()(() =>
  persist(
    stateReq((set, get) => ({
      bears: 0,
      increasePopulation: () =>
        set((state) => ({ ...state, bears: state.bears + 1 })),
      removeAllBears: () => set({ ...get(), bears: 0 }),
    })),
    {
      name: "bear-store",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
