"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Cpu,
  User,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  GraduationCap,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];
const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "") || "http://localhost:3050";

type Role = "student" | "teacher";

export default function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      await register(username, email, password, role);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const roles: {
    value: Role;
    label: string;
    desc: string;
    icon: typeof GraduationCap;
  }[] = [
    {
      value: "student",
      label: "Student",
      desc: "Learn & build projects",
      icon: GraduationCap,
    },
    {
      value: "teacher",
      label: "Teacher",
      desc: "Create & manage courses",
      icon: BookOpen,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease }}
    >
      {/* Back to Home Link */}
      <motion.div className="mb-6 flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Link href="/" className="text-sm flex items-center text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </motion.div>

      {/* Logo */}
      <motion.div
        className="flex items-center justify-center gap-3 mb-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.1 }}
      >
        <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 border border-primary/20">
          <Cpu className="size-5 text-primary" />
        </div>
        <span className="text-xl font-semibold tracking-tight">
          EmbedAI Learn
        </span>
      </motion.div>

      {/* Card */}
      <motion.div
        className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 shadow-2xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.15 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Get started with EmbedAI Learn</p>
        </div>

        {/* OAuth Buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <a href={`${BACKEND}/api/auth/google`} target="_top" className="flex items-center justify-center gap-3 w-full h-11 rounded-xl border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07] transition-colors text-sm font-medium">
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </a>
          <a href={`${BACKEND}/api/auth/github`} target="_top" className="flex items-center justify-center gap-3 w-full h-11 rounded-xl border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07] transition-colors text-sm font-medium">
            <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            Sign up with GitHub
          </a>
        </div>
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.08]" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">or register with email</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role selector */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.2 }}
          >
            <Label>I am a</Label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => {
                const isSelected = role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`
                      relative flex flex-col items-center gap-2 rounded-xl border p-4
                      transition-all duration-200 cursor-pointer text-center
                      ${
                        isSelected
                          ? "border-primary/60 bg-primary/[0.08] shadow-[0_0_24px_-4px] shadow-primary/25"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]"
                      }
                    `}
                  >
                    <r.icon
                      className={`size-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div>
                      <div
                        className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {r.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {r.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Username */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.25 }}
          >
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 h-11 bg-white/[0.03] border-white/[0.08] focus-visible:border-primary/50"
                autoComplete="username"
              />
            </div>
          </motion.div>

          {/* Email */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.3 }}
          >
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 bg-white/[0.03] border-white/[0.08] focus-visible:border-primary/50"
                autoComplete="email"
              />
            </div>
          </motion.div>

          {/* Password */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.35 }}
          >
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11 bg-white/[0.03] border-white/[0.08] focus-visible:border-primary/50"
                autoComplete="new-password"
              />
            </div>
          </motion.div>

          {/* Confirm password */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.4 }}
          >
            <Label htmlFor="confirm-password">Confirm password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-11 bg-white/[0.03] border-white/[0.08] focus-visible:border-primary/50"
                autoComplete="new-password"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.45 }}
          >
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-sm font-medium mt-1"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>

      {/* Footer link */}
      <motion.p
        className="mt-6 text-center text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease, delay: 0.55 }}
      >
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  );
}
