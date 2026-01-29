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
  const [selectedTodo, setSelectedTodo] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
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
      if (data.length > 0 && !selectedTodo) {
        setSelectedTodo(data[0].id);
        const firstTodo = data[0];
        setEditingTitle(firstTodo.title);
        setEditingDescription(firstTodo.description);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  // Auto-save when title or description changes
  useEffect(() => {
    if (!selectedTodo) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (debounce)
    saveTimeoutRef.current = setTimeout(async () => {
      if (!selectedTodo) return;

      try {
        const response = await fetch(`/api/todos/${selectedTodo}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: editingTitle || 'Untitled',
            description: editingDescription,
          }),
        });

        if (response.ok) {
          const updatedTodo = await response.json();
          setTodos((prevTodos) =>
            prevTodos.map((todo) => (todo.id === selectedTodo ? updatedTodo : todo))
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
  }, [editingTitle, editingDescription, selectedTodo]);

  const handleAddTodo = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'New Note', description: '' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create note' }));
        console.error('Error response:', errorData);
        alert(`Failed to create note: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const newTodo = await response.json();
      setTodos((prevTodos) => [...prevTodos, newTodo]);
      setSelectedTodo(newTodo.id);
      setEditingTitle(newTodo.title);
      setEditingDescription(newTodo.description);
    } catch (error) {
      console.error('Error adding todo:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to create note'}`);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const newTodos = todos.filter((todo) => todo.id !== id);
        setTodos(newTodos);
        if (selectedTodo === id) {
          if (newTodos.length > 0) {
            setSelectedTodo(newTodos[0].id);
            setEditingTitle(newTodos[0].title);
            setEditingDescription(newTodos[0].description);
          } else {
            setSelectedTodo(null);
            setEditingTitle('');
            setEditingDescription('');
          }
        }
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleSelectTodo = (id: number) => {
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      setSelectedTodo(id);
      setEditingTitle(todo.title);
      setEditingDescription(todo.description);
    }
  };

  const selectedTodoData = todos.find((t) => t.id === selectedTodo);

  return (
    <div className="h-screen w-screen bg-white flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-12 bg-[#f5f5f7] border-b border-gray-200/50 flex items-center px-4 gap-4">
        {/* Left: View Options */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="toolbar-icon"
            title="Toggle Sidebar"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`toolbar-icon ${viewMode === 'list' ? 'active' : ''}`}
            title="List View"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarVisible && (
          <>
            <div className="w-64 bg-white border-r border-gray-200/50 overflow-y-auto">
              <div className="p-3">
                {todos.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                    No Notes
                  </div>
                ) : (
                  <div className="space-y-1">
                    {todos.map((todo) => (
                      <div
                        key={todo.id}
                        onClick={() => handleSelectTodo(todo.id)}
                        className={`sidebar-item ${selectedTodo === todo.id ? 'selected' : ''}`}
                      >
                        <div className="font-medium truncate">{todo.title || 'Untitled'}</div>
                        {todo.description && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">
                            {todo.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="w-px bg-gray-200/50"></div>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 bg-white overflow-y-auto">
          {selectedTodoData ? (
            <div className="h-full flex flex-col p-8">
              {/* Title Input */}
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder="Title"
                className="w-full text-2xl font-light text-gray-900 border-none outline-none mb-4 placeholder:text-gray-400"
              />
              
              {/* Description Textarea */}
              <textarea
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                placeholder="Start typing..."
                className="flex-1 w-full resize-none border-none outline-none text-gray-900 text-base leading-relaxed font-light placeholder:text-gray-400"
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              {todos.length === 0 ? 'No Notes' : 'Select a note'}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={(e) => {
          console.log('Add button clicked');
          handleAddTodo(e);
        }}
        type="button"
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-600 active:bg-blue-700 transition-colors cursor-pointer z-50"
        title="New Note"
        aria-label="Add new note"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="pointer-events-none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
