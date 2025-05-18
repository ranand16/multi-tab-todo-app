import React from 'react';
import './App.css';
import TodoList from './components/TodoList';
import { TodoContextProvider } from './Context/TodoContext';

function App() {
  return (
    <div className="App">
      <TodoContextProvider>
        <TodoList />
    </TodoContextProvider>
    </div>
  );
}

export default App;
