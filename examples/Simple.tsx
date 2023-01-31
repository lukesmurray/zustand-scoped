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

// define a hook to use the store
const useBearStore = createBearStore();

// use the store in your componenets
function BearCounter() {
  const bears = useBearStore((state) => state.bears);
  return <h1>{bears} around here ...</h1>;
}

function Controls() {
  const increasePopulation = useBearStore((state) => state.increasePopulation);
  return <button onClick={increasePopulation}>one up</button>;
}
