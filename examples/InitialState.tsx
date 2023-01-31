import { useState } from "react";
import { createScopedStore, scoped } from "src";

type BearState = {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
};

type BearInitialData = {
  bears: number;
};

// define the store creator.
const createBearStore = createScopedStore<BearState, BearInitialData>()(
  (initialData) =>
    // optionally add the scoped middleware to the store if you want to use the store
    // as a nested store.
    scoped((set, get) => ({
      bears: initialData.bears,
      increasePopulation: () =>
        set((state) => ({ ...state, bears: state.bears + 1 })),
      removeAllBears: () => set({ ...get(), bears: 0 }),
    }))
);

function Bears({ bears }: { bears: number }) {
  const [useBearStore] = useState(() => createBearStore({ bears }));
  const bearCount = useBearStore((state) => state.bears);
  const increasePopulation = useBearStore((state) => state.increasePopulation);
  return (
    <div>
      <h1>I see {bearCount} bears...</h1>
      <button onClick={increasePopulation}>Add One</button>
    </div>
  );
}
