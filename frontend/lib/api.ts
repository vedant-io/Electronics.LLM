const AGENTS_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/agents";
const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "x-auth-token": token } : {}),
  };
}

// ─── Agent API ────────────────────────────────────────────

export async function fetchProjectName(description: string) {
  const res = await fetch(`/api/validate-project`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ projectName: description }),
  });
  if (!res.ok) throw new Error("Failed to fetch project name");
  return res.json();
}

export async function fetchProjectDetails(topic: string) {
  const res = await fetch(`${AGENTS_URL}/main-agent`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ project_topic: topic }),
  });
  if (!res.ok) throw new Error("Failed to fetch project details");
  return res.json();
}

export async function fetchProjectCode(topic: string) {
  const res = await fetch(`${AGENTS_URL}/code-agent`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ project_topic: topic }),
  });
  if (!res.ok) throw new Error("Failed to fetch code");
  return res.json();
}

export async function sendTroubleshootQuery(
  query: string,
  projectTopic: string,
) {
  const res = await fetch(`${AGENTS_URL}/troubleshoot`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ query, project_topic: projectTopic }),
  });
  if (!res.ok) throw new Error("Failed to troubleshoot");
  return res.json();
}

export async function fetchBasicModules(topic: string) {
  const res = await fetch(`${AGENTS_URL}/beginner/basics`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ project_topic: topic }),
  });
  if (!res.ok) throw new Error("Failed to fetch basic modules");
  return res.json();
}

export async function fetchAdaptiveModules(topic: string) {
  const res = await fetch(`${AGENTS_URL}/beginner/adaptive`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ project_topic: topic }),
  });
  if (!res.ok) throw new Error("Failed to fetch adaptive modules");
  return res.json();
}

export async function checkBoards() {
  const res = await fetch(`${AGENTS_URL}/arduino/boards`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to list boards");
  return res.json();
}

export async function compileProject(fqbn: string = "arduino:avr:uno") {
  const res = await fetch(`${AGENTS_URL}/arduino/compile`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ fqbn }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Compilation failed");
  }
  return res.json();
}

export async function flashProject(fqbn: string, port: string) {
  const res = await fetch(`${AGENTS_URL}/arduino/flash`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ fqbn, port }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Flashing failed");
  }
  return res.json();
}

export async function getFaculty() {
  const res = await fetch(`${API_URL}/faculty`);
  if (!res.ok) throw new Error("Failed to fetch faculty");
  return res.json();
}

// ─── Student API ──────────────────────────────────────────

export async function submitQuizResult(data: {
  topic: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  tabSwitchCount?: number;
  answers: Array<{
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}) {
  const res = await fetch(`${API_URL}/student/quiz-result`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit quiz result");
  return res.json();
}

export async function getStudentQuizResults(page = 1, limit = 10) {
  const res = await fetch(
    `${API_URL}/student/quiz-results?page=${page}&limit=${limit}`,
    {
      headers: authHeaders(),
    },
  );
  if (!res.ok) throw new Error("Failed to fetch quiz results");
  return res.json();
}

export async function createProject(data: {
  title: string;
  description?: string;
  topic?: string;
  guide?: string;
}) {
  const res = await fetch(`${API_URL}/student/project`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create project");
  return res.json();
}

export async function updateProject(
  id: string,
  data: {
    title?: string;
    description?: string;
    topic?: string;
    status?: string;
    components?: Array<{ name: string; quantity: number }>;
    notes?: string;
  },
) {
  const res = await fetch(`${API_URL}/student/project/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update project");
  return res.json();
}

export async function getStudentProjects(page = 1, limit = 10) {
  const res = await fetch(
    `${API_URL}/student/projects?page=${page}&limit=${limit}`,
    {
      headers: authHeaders(),
    },
  );
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function getProjectFeedback(projectId: string) {
  const res = await fetch(`${API_URL}/student/projects/${projectId}/feedback`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch feedback");
  return res.json();
}

export async function askQuestion(data: {
  topic: string;
  questionText: string;
}) {
  const res = await fetch(`${API_URL}/student/question`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to ask question");
  return res.json();
}

export async function getStudentQuestions(
  page = 1,
  limit = 10,
  status?: string,
) {
  let url = `${API_URL}/student/questions?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch questions");
  return res.json();
}

// ─── Teacher API ──────────────────────────────────────────

export async function getTeacherDashboard() {
  const res = await fetch(`${API_URL}/teacher/dashboard`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}

export async function getStudentsList(page = 1, limit = 20) {
  const res = await fetch(
    `${API_URL}/teacher/students?page=${page}&limit=${limit}`,
    {
      headers: authHeaders(),
    },
  );
  if (!res.ok) throw new Error("Failed to fetch students");
  return res.json();
}

export async function getStudentProgress(studentId: string) {
  const res = await fetch(`${API_URL}/teacher/students/${studentId}/progress`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch student progress");
  return res.json();
}

export async function getStudentProjectsTeacher(
  studentId: string,
  page = 1,
  limit = 10,
) {
  const res = await fetch(
    `${API_URL}/teacher/students/${studentId}/projects?page=${page}&limit=${limit}`,
    {
      headers: authHeaders(),
    },
  );
  if (!res.ok) throw new Error("Failed to fetch student projects");
  return res.json();
}

export async function getStudentQuizResultsTeacher(
  studentId: string,
  page = 1,
  limit = 10,
) {
  const res = await fetch(
    `${API_URL}/teacher/students/${studentId}/quiz-results?page=${page}&limit=${limit}`,
    {
      headers: authHeaders(),
    },
  );
  if (!res.ok) throw new Error("Failed to fetch quiz results");
  return res.json();
}

export async function addProjectFeedback(
  projectId: string,
  data: { comment: string; rating?: number },
) {
  const res = await fetch(`${API_URL}/teacher/projects/${projectId}/feedback`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add feedback");
  return res.json();
}

export async function getTeacherProjectFeedback(projectId: string) {
  const res = await fetch(`${API_URL}/teacher/projects/${projectId}/feedback`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch feedback");
  return res.json();
}

export async function getTeacherQuestions(
  status?: string,
  page = 1,
  limit = 20,
) {
  let url = `${API_URL}/teacher/questions?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch questions");
  return res.json();
}

export async function answerQuestion(
  questionId: string,
  data: { answerText: string },
) {
  const res = await fetch(`${API_URL}/teacher/questions/${questionId}/answer`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to answer question");
  return res.json();
}

export async function getLiveStudents() {
  const res = await fetch(`${API_URL}/live/students`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch live students");
  return res.json();
}
