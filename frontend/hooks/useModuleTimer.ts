"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3050/api";

/**
 * Tracks how long a student spends on a specific module.
 * Calls /api/student/module-session/start on mount and /end on unmount.
 */
export function useModuleTimer(module: string, topic: string = "") {
  const { token } = useAuth();
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) return;

    // Start session
    fetch(`${API_BASE}/student/module-session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-auth-token": token },
      body: JSON.stringify({ module, topic }),
    })
      .then((r) => r.json())
      .then((data) => {
        sessionIdRef.current = data.sessionId;
      })
      .catch(() => {});

    // End session on unmount
    return () => {
      if (!sessionIdRef.current) return;
      // Use sendBeacon so the request survives page unload
      const payload = JSON.stringify({ sessionId: sessionIdRef.current });
      const success = navigator.sendBeacon
        ? navigator.sendBeacon(
            `${API_BASE}/student/module-session/end`,
            new Blob([payload], { type: "application/json" })
          )
        : false;

      if (!success) {
        fetch(`${API_BASE}/student/module-session/end`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-auth-token": token },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [token, module, topic]);
}
