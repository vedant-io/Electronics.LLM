import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { projectName } = await request.json();

    const response = await fetch('http://localhost:5000/api/agents/project-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_description: projectName }),
    });

    if (!response.ok) {
      throw new Error('Backend failed to identify project');
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('[API] Error identifying project:', error);
    return NextResponse.json(
      { error: 'Failed to identify project' },
      { status: 500 }
    );
  }
}
