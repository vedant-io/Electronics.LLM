import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { projectName } = await request.json();
    const authToken = request.headers.get("x-auth-token") || "";

    const response = await fetch(
      "http://localhost:3050/api/agents/project-name",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": authToken,
        },
        body: JSON.stringify({ user_description: projectName }),
      },
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Backend failed to identify project");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error identifying project:", error);
    return NextResponse.json(
      { error: "Failed to identify project" },
      { status: 500 },
    );
  }
}
