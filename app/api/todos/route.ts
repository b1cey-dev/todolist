import { NextRequest, NextResponse } from 'next/server';
import { getTodos, addTodo } from './store';

// GET - Fetch all todos
export async function GET() {
  const todos = getTodos();
  return NextResponse.json(todos);
}

// POST - Create a new todo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const newTodo = addTodo(title, description || '');
    return NextResponse.json(newTodo, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
