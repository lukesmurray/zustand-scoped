import { createScopedStore, scoped } from "src";
import { devtools } from "zustand/middleware";

type BearState = {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
};

const createBearStore = createScopedStore<BearState>()(() =>
  devtools(
    scoped((set, get) => ({
      bears: 0,
      increasePopulation: () =>
        set(
          (state) => ({ ...state, bears: state.bears + 1 }),
          false,
          "increasePopulation"
        ),
      removeAllBears: () =>
        set({ ...get(), bears: 0 }, false, "removeAllBears"),
    })),
    {
      name: "bear-store",
    }
  )
);
