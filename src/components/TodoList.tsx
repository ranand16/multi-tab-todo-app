import React,{ useContext } from "react";
import { TodoContext, TodoContextType } from "../Context/TodoContext";

const TodoList: React.FC = () => {
  const context = useContext<TodoContextType | undefined>(TodoContext);

    if (!context) {
    throw new Error("TodoList must be used within a TodoContextProvider");
  }
  const { todos, fillTodoData } = context;

  return (
    <div>
      <h2>Todo List</h2>
      <button onClick={fillTodoData}>Fill Todo Data</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;