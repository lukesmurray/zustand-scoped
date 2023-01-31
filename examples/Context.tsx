import { createContext, useContext, useRef } from "react";
import { createScopedStore, scoped, ScopedContextValue } from "src";

type BearState = {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
};

type BearInitialData = {
  bears: number;
};

const createBearStore = createScopedStore<BearState, BearInitialData>()(
  (initialData) =>
    scoped((set, get) => ({
      bears: initialData.bears,
      increasePopulation: () =>
        set((state) => ({ ...state, bears: state.bears + 1 })),
      removeAllBears: () => set({ ...get(), bears: 0 }),
    }))
);

// Create the context value type
type BearsContextValue = ScopedContextValue<typeof createBearStore>;

// Define the context
const BearsContext = createContext<undefined | BearsContextValue>(undefined);

// Define the provider
export function BearsProvider({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData: BearInitialData;
}) {
  // create the store once.
  const store = useRef(createBearStore(initialData)).current;

  return (
    <BearsContext.Provider value={store}>{children}</BearsContext.Provider>
  );
}

// Create a hook to use the store
const useBears: BearsContextValue = (selector, equalityFn) => {
  const context = useContext(BearsContext);
  if (context === undefined) {
    throw new Error("useBears must be used within a BearsProvider");
  }
  return context(selector, equalityFn);
};

// Define your provider
function App() {
  return (
    <BearsProvider initialData={{ bears: 0 }}>
      <BearCounter />
      <BearControls />
    </BearsProvider>
  );
}

// Use the store in your components
function BearCounter() {
  const bearCount = useBears((state) => state);
  return (
    <div>
      <h1>
        <>I see {bearCount} bears...</>
      </h1>
    </div>
  );
}

function BearControls() {
  const increasePopulation = useBears((state) => state.increasePopulation);
  return <button onClick={increasePopulation}>Add One</button>;
}
