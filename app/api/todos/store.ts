import fs from 'fs';
import path from 'path';

// Shared in-memory store for todos
export interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'todos.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load todos from file
function loadTodos(): Todo[] {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading todos:', error);
  }
  return [];
}

// Save todos to file
function saveTodos(todos: Todo[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving todos:', error);
  }
}

let todos: Todo[] = loadTodos();
let nextId = Math.max(0, ...todos.map(t => t.id)) + 1;

export function getTodos(): Todo[] {
  return todos;
}

export function addTodo(title: string, description: string = ''): Todo {
  const now = new Date().toISOString();
  const newTodo: Todo = {
    id: nextId++,
    title: title.trim(),
    description: description.trim(),
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
  todos.push(newTodo);
  saveTodos(todos);
  return newTodo;
}

export function updateTodo(id: number, updates: Partial<Todo>): Todo | null {
  const todoIndex = todos.findIndex((todo) => todo.id === id);
  if (todoIndex === -1) {
    return null;
  }
  todos[todoIndex] = { 
    ...todos[todoIndex], 
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveTodos(todos);
  return todos[todoIndex];
}

export function deleteTodo(id: number): boolean {
  const todoIndex = todos.findIndex((todo) => todo.id === id);
  if (todoIndex === -1) {
    return false;
  }
  todos.splice(todoIndex, 1);
  saveTodos(todos);
  return true;
}
