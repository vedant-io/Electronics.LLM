"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/auth-context";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3050";

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, { transports: ["websocket"] });
  }
  return socketInstance;
}

/**
 * Emits student:active when mounted and student:inactive on unmount.
 * Used on student learn pages so teachers can see live activity.
 */
export function useStudentPresence(module: string, topic: string = "") {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    socket.emit("student:active", {
      studentId: user.id,
      username: user.username,
      module,
      topic,
    });

    return () => {
      socket.emit("student:inactive", { studentId: user.id });
    };
  }, [user, module, topic]);
}
