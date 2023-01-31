# zustand-scoped

[![Build Size](https://img.shields.io/bundlephobia/minzip/@lukesmurray/zustand-scoped?label=bundle&colorA=000000&colorB=000000)](https://bundlephobia.com/package/@lukesmurray/zustand-scoped@latest)
[![Version](https://img.shields.io/npm/v/@lukesmurray/zustand-scoped?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@lukesmurray/zustand-scoped)

> Created scoped (nested) zustand stores which can be called with initial data.
> Typesafe and supports (almost all) zustand middleware.

This package solves two issues in Zustand.
Combining stores (
[#291](https://github.com/pmndrs/zustand/issues/291),
[#161](https://github.com/pmndrs/zustand/issues/161),
[#163](https://github.com/pmndrs/zustand/issues/163),
[#178](https://github.com/pmndrs/zustand/issues/178)
)
and initializing stores with data (
[#82](https://github.com/pmndrs/zustand/issues/82),
[#552](https://github.com/pmndrs/zustand/discussions/552)
).

## Installation

```sh
# npm
npm install @lukesmurray/zustand-scoped

# yarn
yarn add @lukesmurray/zustand-scoped
```

## First create a store

The `createScopedStore` function is like `create` from `zustand` but it adds an extra function `(initialData) => ...` before the `(set, get) => ...` part.

The return value is a store `factory`! Pass initial data to it to create a new store.

```tsx
import { createScopedStore } from "@lukesmurray/zustand-scoped";

type BearState = {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
};

type BearInitialData = {
  bears: number;
};

// define a store factory
const createBearStore = createScopedStore<BearState, BearInitialData>()(
  (initialData) =>
    (set, get) => ({
      bears: initialData.bears,
      increasePopulation: () =>
        set((state) => ({ ...state, bears: state.bears + 1 })),
      removeAllBears: () => set({ ...get(), bears: 0 }),
    })
);

// create a hook by passing initial data.
const useBearStore = createBearStore({ bears: 0 });
```

## Create new stores on the fly from props

```tsx
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
```

## Using the factory

`createScopedStore` returns a function that can be called directly to get a react hook for your store.
But it also returns two unique properties.

You can access a vanilla store by calling `createBearStore.store(initialData)`

```tsx
const vanillaStore = createBearStore.store({ bears: 0 });

// use the vanilla store
const { getState, setState, subscribe } = vanillaStore;
```

You can create a scoped store by called `createBearStore.scoped(setOverride, getOverride, initialData)`.
See the section on scoped stores below.

### Optional Initial Data

If all the properties in initial data are optional, you do not need to pass initial data to the store creator functions.
However, if any parameter is non-optional, you must pass initial data.

```tsx
// all properties optional
type BearInitialData = {
  bears?: number;
};

// create hook without passing initial data.
createBearStore()

// create vanilla without passing initial data.
createBearStore.store()
```

## Scoped Stores

Scoped Stores let you override the `set` and `get` method for child stores.
The inspiration came from [this issue comment](https://github.com/pmndrs/zustand/issues/163#issuecomment-678821969).
The overriden `set` function receives the child state but must update the parent state.

We'll start by creating a todo store.

The only change is we add the `stateReq` middleware which enforces that `set` cannot be called with partial state or return partial state.
This is *extremely helpful* since you often need access to the entire child state to know which child to update from the parent.

```tsx
import { createScopedStore, stateReq } from "@lukesmurray/zustand-scoped";

interface TodoState {
  // unique id so we can find the todo in the parent store.
  id: string;
  checked: boolean;
  toggleDone: () => void;
}

interface TodoInitialData {
  // the initial data should contain enough information to find the todo in the parent store.
  // so we include the id and make it required!
  id: string;
  checked?: boolean;
}

const createTodoStore = createScopedStore<TodoState, TodoInitialData>()(
  (initialData) =>
    // if you plan to nest a store. Use the stateReq middleware.
    stateReq((set) => ({
      id: initialData.id,
      checked: initialData.checked ?? false,
      toggleDone: () => set((state) => ({ ...state, checked: !state.checked })),
    }))
);
```

Next we'll define the parent store state.
The parent store simply contains the child store's state.

```tsx
interface AppState {
  // note that the nested store is stored as State, not as StoreApi<State>.
  todos: TodoState[];
  addTodo: (todo: TodoInitialData) => void;
  removeTodo: (id: string) => void;
}
```

Now we'll create the parent store.
The most complicated part of this function is defining the helper function to create the nested stores.
If you have questions about how `createNestedTodoStore` works please open an issue!
Fundamentally its the same pattern as the much shorter example in [this issue comment](https://github.com/pmndrs/zustand/issues/163#issuecomment-678821969) just with typesafety.

```tsx
const createAppStore = createScopedStore<AppState>()(() =>
  stateReq((set, get) => {
    // define a helper function to create nested stores.
    const createNestedTodoStore = (todoInitialData: TodoInitialData) => {
      // define a selector to get the todo from the parent store.
      const selectTodo = (state: AppState) =>
        state.todos.find((t) => t.id === todoInitialData.id)!;

      // define a helper function to resolve the parameter passed
      // to the todo's set function into the next todo state.
      const resolveTodo = (
        partial: TodoState | ((state: TodoState) => TodoState)
      ) => {
        return typeof partial === "function"
          ? partial(selectTodo(get()))
          : partial;
      };

      // create the new set function for the nested store.
      const setTodo: Parameters<typeof createTodoStore.scoped>[0] = (
        currentTodoStateOrUpdater
      ) => {
        // resolve the next state or updater into the next todo state.
        const nextTodoState = resolveTodo(currentTodoStateOrUpdater);

        // apply a standard immutable update to the parent store.
        return set((state) => ({
          ...state,
          todos: state.todos.map((todo) =>
            todo.id === nextTodoState.id ? nextTodoState : todo
          ),
        }));
      };

      // create the new get function for the nested store.
      // we can use the selector we defined above.
      const getTodo: Parameters<typeof createTodoStore.scoped>[1] = () =>
        selectTodo(get());

      // create the nested store.
      return createTodoStore.scoped(setTodo, getTodo, todoInitialData);
    };

    return {
      todos: [],
      addTodo: (todoInitialData) =>
        set((state) => ({
          ...state,
          todos: [
            ...state.todos,
            // use the helper function to create the nested store.
            createNestedTodoStore(todoInitialData),
          ],
        })),
      removeTodo: (id) =>
        set((state) => ({
          ...state,
          todos: state.todos.filter((t) => t.id !== id),
        })),
    };
  })
);
```

## Hooks for nested stores 

The helper `createScopedHook` constructs a hook that can select from the nested `TodoStore`.
We pass a selector to `createScopedHook` to select a todo from the `AppStore`.
The selector must take a single arugment.
That argument becomes the first parameter of the returned hook.

```tsx
const useAppStore = createAppStore();

// use createScopedHook to create a hook that accesses the todo store
const useTodoStore = createScopedHook(
  useAppStore,
  // select a todo by id. The single argument to this function becomes
  // the first argument of the returned hook.
  (id: string) => (state) => state.todos.find((t) => t.id === id)!
);

// whether the first todo is checked
useTodoStore("1", (state) => state.checked)
// whether the second todo is checked
useTodoStore("2", (state) => state.checked)

function Todo({ todoId }: { todoId: string }) {
  const checked = useTodoStore(todoId, (state) => state.checked);

  return <div>The todo is {checked ? "checked" : "not checked"}</div>;
}
```

We can pass a default argument to `createScopedHook` to automatically select a specific piece of nested state.
The returned hook no longer takes the "selector argument"

```tsx
// pass a third argument to always select the todo with id "1".
const useFirstTodoStore = createScopedHook(
  useAppStore,
  (id: string) => (state) => state.todos.find((t) => t.id === id)!,
  "1"
);

function FirstTodo() {
  // you can use the hook without passing an id.
  const checked = useFirstTodoStore((state) => state.checked);

  return <div>The todo is {checked ? "checked" : "not checked"}</div>;
}
```

Finally we can use the app store hook without any changes.

```tsx
function App() {
  const addTodo = useAppStore((state) => state.addTodo({ id: "1" }));
}
```

## Middleware

### stateReq

The stateReq middleware enforces that all state is returned by the `set` function.
This is helpful in nested store since you often need to find the element to update based on an identifying property such as an `id`.
If `set` returns a `Partial` state, then you have no guarantee that the identifying property is included.

```tsx
import { createScopedStore, stateReq } from "@lukesmurray/zustand-scoped";

const createTodoStore = createScopedStore<TodoState, TodoInitialData>()(
  (initialData) =>
    stateReq((set) => ({
      id: initialData.id,
      checked: initialData.checked ?? false,

      // ✅ we returned the entire state from set using {...state}
      toggleDone: () => set((state) => ({ ...state, checked: !state.checked })),

      // ❌ we only returned partial state {checked}.
      // toggleDone: () => set((state) => ({ checked: !state.checked })),
    }))
);
```

### devtoolsReq

The devtoolsReq middleware enforces that `action` is passed to every set method.
This can be helpful if you want to enforce that all actions are named, which makes debugging large stores significantly easier.

```tsx
import { createScopedStore, devtoolsReq } from "@lukesmurray/zustand-scoped";

const createTodoStore = createScopedStore<TodoState, TodoInitialData>()(
  (initialData) =>
    devtoolsReq((set, get) => ({
      id: initialData.id,
      checked: initialData.checked ?? false,
      // ✅ We pass the action as a third argument to set.
      toggleDone: () =>
        set({ ...get(), checked: !get().checked }, false, "toggleDone"),

      // ❌ We did not pass the action as a third argument to set.
      // toggleDone: () =>
      //   set({ ...get(), checked: !get().checked }, false),
    }))
);
```

## More Examples

If you have questions check out the examples in the examples folder.

## Caveats

- If you use `stateReq` it does not work with `immer` middleware. The two middlewares are contradictory. `stateReq` requires that `set` returns the store's state. `immer` allows `set` to return void.
- `subscribe` and `destroy` do not work inside of stores created with `factory.scoped`. This only affects you if you call `subscribe` or `destroy` in your `createStore` function which I've never seen.

## Middlewares and their mutators reference

- `devtoolsReq` — `["zustand-scoped/devtoolsReq", never]`
- `stateReq` — `["zustand-scoped/stateReq", never]`

## Developing

Install dependencies with `yarn install`.  
Lint files with `yarn lint .`.  
Run tests with `yarn test`.  
Run tests with coverage with `yarn test:coverage`.

## Publishing

1. Update the change log
2. Update the version
3. Run `npm pack` and check that the correct files are included
4. Publish with `yarn lint . && yarn build && npm publish --access public`