import { useCallback, useEffect, useState } from "react";
import IndexedDBManager from "../services/IndexedDBManager";
import { createContext } from "react";
import { Todo } from "../interfaces/Todo";
import { DB_NAME, DB_VERSION, OBJECT_STORE_NAME } from "../utils/contansts";


export interface TodoContextType {
  todos: Todo[];
  fillTodoData: () => void;
}

export const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const TodoContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [dbManager] = useState<IndexedDBManager>(() => new IndexedDBManager(DB_NAME, DB_VERSION, OBJECT_STORE_NAME));

  const initializeDB = useCallback(async () => {
      try {
          await dbManager.initialize();
          const initialTodos = await dbManager.loadAll();
          setTodos(initialTodos);
      } catch (error) {
          console.error("Failed to initialize or load", error);
      }
  }, [dbManager]);

  useEffect(() => {
    console.log("initializing DB now!!")
    initializeDB();
    return () => {
      dbManager.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializeDB]);

  const loadTodosFromDB = useCallback(async () => {
    try {
      const loadedTodos = await dbManager.loadAll();
      setTodos(loadedTodos);
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  }, [dbManager]);

  const addTodoToDB = useCallback(async (newTodo: Omit<Todo, 'id'>) => {
    try {
      await dbManager.add(newTodo);
      await loadTodosFromDB();
      localStorage.setItem('todoUpdated', Date.now().toString());
      // notifyServiceWorker();
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  }, [dbManager, loadTodosFromDB]);

  const fillTodoData = useCallback(() => {
    const randomId = Math.random().toString(36).substring(7);
    const newTodo: Omit<Todo, 'id'> = { title: `Random Task ${randomId}`, completed: false };
    addTodoToDB(newTodo);
  }, [addTodoToDB]);
  
  // Send message to SW on IDB change
  // const notifyServiceWorker = () => {
  //     console.log("🚀 before ~ notifyServiceWorker ~ navigator.serviceWorker.controller:", navigator.serviceWorker.controller)
  //   if (navigator.serviceWorker.controller) {
  //     console.log("🚀 ~ after notifyServiceWorker ~ navigator.serviceWorker.controller:", navigator.serviceWorker.controller)
  //     navigator.serviceWorker.controller.postMessage({ type: 'idb-changed' });
  //   }
  // };
  useEffect(() => {
    // const registerServiceWorker = async () => {
    //   if ('serviceWorker' in navigator) {
    //     console.log("🚀 ~ registerServiceWorker ~ navigator:", navigator)
    //     try {
    //       await navigator.serviceWorker.register('todo-service-worker.js');
    //     } catch (error) {
    //       console.error('Service Worker registration failed:', error);
    //     }
    //   }
    // };

    // registerServiceWorker();

    // const handleServiceWorkerMessage = (event: MessageEvent) => {
    //   if (event.data.type === 'idb-update-available') {
    //     const shouldUpdate = window.confirm(
    //       "Data has changed on another device. Update your list?"
    //     );
    //     if (shouldUpdate) {
    //       loadTodosFromDB();
    //     }
    //   }
    // };
      
    // if ('serviceWorker' in navigator) {
    //   console.log('Service Workers are SUPPORTED in this browser.');
    //   navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    // } else {
    //   console.error('Service Workers are not supported in this browser.');
    // }

    const handleStorageChange = (event: StorageEvent) => {
      console.log("🚀 ~ handleStorageChange ~ event:", event)
      if (event.key === 'todoUpdated' && event.oldValue !== event.newValue) {
        const shouldUpdate = window.confirm(
          "New todo added in another tab. Refresh to update your list?"
        );
        if (shouldUpdate) {
          loadTodosFromDB();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      // if ('serviceWorker' in navigator) {
      //   navigator.serviceWorker.removeEventListener(
      //     'message',
      //     handleServiceWorkerMessage,
      //   );
      // }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadTodosFromDB, dbManager, addTodoToDB]);

  const contextValue = {
    todos,
    fillTodoData,
  };

  return (
    <TodoContext.Provider value={contextValue}>
      {children}
    </TodoContext.Provider>
  );
};
