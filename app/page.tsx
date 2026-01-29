'use client';

import { useState, useEffect, useRef } from 'react';

interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  // Auto-save when editing text changes
  useEffect(() => {
    if (!editingId) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (debounce)
    saveTimeoutRef.current = setTimeout(async () => {
      if (!editingId || !editingText.trim()) return;

      try {
        const response = await fetch(`/api/todos/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: editingText.trim(),
            description: '',
          }),
        });

        if (response.ok) {
          const updatedTodo = await response.json();
          setTodos((prevTodos) =>
            prevTodos.map((todo) => (todo.id === editingId ? updatedTodo : todo))
          );
        }
      } catch (error) {
        console.error('Error auto-saving todo:', error);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editingText, editingId]);

  const handleAddTodo = async () => {
    if (!newTodoText.trim()) return;
    
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTodoText.trim(), description: '' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create todo' }));
        console.error('Error response:', errorData);
        alert(`Failed to create todo: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const newTodo = await response.json();
      setTodos((prevTodos) => [...prevTodos, newTodo]);
      setNewTodoText('');
    } catch (error) {
      console.error('Error adding todo:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to create todo'}`);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
        if (editingId === id) {
          setEditingId(null);
          setEditingText('');
        }
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleToggleComplete = async (id: number, completed: boolean) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !completed }),
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos((prevTodos) =>
          prevTodos.map((todo) => (todo.id === id ? updatedTodo : todo))
        );
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const handleStartEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingText(todo.title);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'linear-gradient(to bottom, #f5f1e8 0%, #f0ebe0 100%)' }}>
      <div className="w-full max-w-2xl">
        {/* Notepad Container */}
        <div className="bg-[#FEFCF3] notepad-shadow-lg rounded-2xl p-8 border border-amber-200/50">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-amber-200/60">
            <h1 className="text-4xl font-light text-gray-800 tracking-tight text-center">
              Todo List
            </h1>
          </div>

          {/* Add Todo Input */}
          <div className="mb-8">
            <div className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTodo();
                    }
                  }}
                  placeholder="New todo..."
                  className="w-full px-4 py-3 bg-white/80 border border-amber-200/60 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-300/80
                           placeholder:text-gray-400 text-gray-700 text-base
                           transition-all duration-200 notepad-shadow"
                />
              </div>
              <button
                onClick={handleAddTodo}
                type="button"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700
                         font-medium text-sm tracking-wide transition-colors notepad-shadow"
              >
                Add
              </button>
            </div>
          </div>

          {/* Todo List */}
          <div className="paper-line" style={{ minHeight: '400px', paddingLeft: '0', paddingRight: '0', paddingTop: '0' }}>
            {todos.length === 0 ? (
              <div className="text-center py-12" style={{ paddingLeft: '0' }}>
                <p className="text-gray-400 text-sm font-light italic">
                  No todos yet. Create your first todo above.
                </p>
              </div>
            ) : (
              todos.map((todo, index) => (
                <div
                  key={todo.id}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 hover:bg-white/40 transition-all duration-200"
                  style={{ 
                    height: '32px',
                    paddingLeft: '0',
                    paddingRight: '0',
                    marginBottom: '0',
                    marginTop: '0',
                    alignItems: 'center',
                    lineHeight: '32px'
                  }}
                >
                  {/* Checkbox - Notepad Style */}
                  <button
                    onClick={() => handleToggleComplete(todo.id, todo.completed)}
                    type="button"
                    className={`flex-shrink-0 w-5 h-5 border-2 flex items-center justify-center transition-all ${
                      todo.completed
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-400 hover:border-gray-600 bg-white'
                    }`}
                    style={{ borderRadius: '3px' }}
                    aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {todo.completed && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6l2.5 2.5L10 3"
                          stroke="#2563eb"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Todo Text */}
                  {editingId === todo.id ? (
                    <div className="flex items-center h-full">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleCancelEdit();
                          }
                          if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        onBlur={handleCancelEdit}
                        className="w-full px-2 py-1 bg-white border border-amber-300/40 rounded
                                 focus:outline-none focus:ring-1 focus:ring-amber-300/30 focus:border-amber-300/50
                                 text-gray-700 text-base font-light h-7"
                        style={{ borderWidth: '1px' }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => handleStartEdit(todo)}
                      className={`cursor-text text-base font-light leading-relaxed h-full flex items-center ${
                        todo.completed 
                          ? 'line-through text-gray-400' 
                          : 'text-gray-700'
                      }`}
                      style={{ paddingRight: '8px' }}
                    >
                      {todo.title}
                    </div>
                  )}

                  {/* Actions */}
                  {editingId !== todo.id && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 h-full">
                      <button
                        onClick={() => handleStartEdit(todo)}
                        type="button"
                        className="px-3 py-1 bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 active:bg-amber-300
                                 border border-amber-200/60 font-medium text-xs transition-colors whitespace-nowrap h-7"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        type="button"
                        className="px-3 py-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100 active:bg-red-200
                                 border border-red-200/60 font-medium text-xs transition-colors whitespace-nowrap h-7"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
