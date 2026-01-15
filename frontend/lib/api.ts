// ai-learning-platform/lib/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/agents';

export async function fetchProjectName(description: string) {
  // Use Next.js API route for project name identification
  const res = await fetch(`/api/validate-project`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName: description }),
  });
  if (!res.ok) throw new Error('Failed to fetch project name');
  return res.json();
}

export async function fetchProjectDetails(topic: string) {
  const res = await fetch(`${API_URL}/main-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_topic: topic }),
  });
  if (!res.ok) throw new Error('Failed to fetch project details');
  return res.json();
}

export async function fetchProjectCode(topic: string) {
  const res = await fetch(`${API_URL}/code-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_topic: topic }),
  });
  if (!res.ok) throw new Error('Failed to fetch code');
  return res.json();
}

export async function sendTroubleshootQuery(query: string, projectTopic: string) {
  const res = await fetch(`${API_URL}/troubleshoot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, project_topic: projectTopic }),
  });
  if (!res.ok) throw new Error('Failed to troubleshoot');
  return res.json();
}

export async function fetchBasicModules(topic: string) {
  const res = await fetch(`${API_URL}/beginner/basics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_topic: topic }),
  });
  if (!res.ok) throw new Error('Failed to fetch basic modules');
  return res.json();
}

export async function fetchAdaptiveModules(topic: string) {
  const res = await fetch(`${API_URL}/beginner/adaptive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_topic: topic }),
  });
  if (!res.ok) throw new Error('Failed to fetch adaptive modules');
  return res.json();
}

export async function checkBoards() {
  const res = await fetch(`${API_URL}/arduino/boards`);
  if (!res.ok) throw new Error('Failed to list boards');
  return res.json();
}

export async function compileProject(fqbn: string = 'arduino:avr:uno') {
  const res = await fetch(`${API_URL}/arduino/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fqbn }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Compilation failed');
  }
  return res.json();
}

export async function flashProject(fqbn: string, port: string) {
  const res = await fetch(`${API_URL}/arduino/flash`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fqbn, port }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Flashing failed');
  }
  return res.json();
}
