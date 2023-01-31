/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  createScopedHook,
  createScopedStore,
  devtoolsReq,
  stateReq,
} from "src";

interface TodoState {
  // id so we can find the todo in the parent store.
  id: string;
  checked: boolean;
  toggleDone: () => void;
}

interface TodoInitialData {
  id: string;
  checked?: boolean;
}

const createTodoStore = createScopedStore<TodoState, TodoInitialData>()(
  (initialData) =>
    devtoolsReq(
      stateReq((set) => ({
        id: initialData.id,
        checked: initialData.checked ?? false,
        toggleDone: () =>
          set(
            (state) => ({ ...state, checked: !state.checked }),
            false,
            "toggleDone"
          ),
      }))
    )
);

interface AppState {
  // note that the nested store is stored as State, not as StoreApi<State>.
  todos: TodoState[];
  addTodo: (todo: TodoInitialData) => void;
  removeTodo: (id: string) => void;
}

const createAppStore = createScopedStore<AppState>()(() =>
  devtoolsReq(
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
          currentTodoStateOrUpdater,
          _replace,
          action
        ) => {
          // resolve the next state or updater into the next todo state.
          const nextTodoState = resolveTodo(currentTodoStateOrUpdater);

          // apply a standard immutable update to the parent store.
          return set(
            (state) => ({
              ...state,
              todos: state.todos.map((todo) =>
                todo.id === nextTodoState.id ? nextTodoState : todo
              ),
            }),
            false,
            action
          );
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
          set(
            (state) => ({
              ...state,
              todos: [
                ...state.todos,
                // use the helper function to create the nested store.
                createNestedTodoStore(todoInitialData),
              ],
            }),
            false,
            "addTodo"
          ),
        removeTodo: (id) =>
          set(
            (state) => ({
              ...state,
              todos: state.todos.filter((t) => t.id !== id),
            }),
            false,
            "removeTodo"
          ),
      };
    })
  )
);

const useAppStore = createAppStore();

const useTodoStore = createScopedHook(
  useAppStore,
  (id: string) => (state) => state.todos.find((t) => t.id === id)!
);

function Todo({ todoId }: { todoId: string }) {
  const checked = useTodoStore(todoId, (state) => state.checked);

  return <div>The todo is {checked ? "checked" : "not checked"}</div>;
}

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

function App() {
  const addTodo = useAppStore((state) => state.addTodo({ id: "1" }));
}

/* eslint-enable @typescript-eslint/no-non-null-assertion */
