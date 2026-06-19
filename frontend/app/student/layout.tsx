"use client";

import React from "react";
import { useAuth } from "@/contexts/auth-context";
import AppSidebar from "@/components/app-sidebar";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      {/* Decorative Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1],
          x: [0, 50, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/30 blur-[120px]"
      />
      
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [0, -60, 0],
          y: [0, 60, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[40%] -right-[15%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[150px]"
      />
    </div>
  );
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "student") {
    return null;
  }

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 flex h-dvh overflow-hidden bg-transparent">
        <AppSidebar role="student" />
        <main className="flex-1 overflow-y-auto p-6 pt-16 md:pt-6">
          {children}
        </main>
      </div>
    </>
  );
}
