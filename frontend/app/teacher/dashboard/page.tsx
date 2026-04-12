"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  FolderOpen,
  MessageCircleQuestion,
  Trophy,
  ArrowRight,
  Loader2,
  GraduationCap,
  Radio,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { io } from "socket.io-client";
import { useAuth } from "@/contexts/auth-context";
import { getTeacherDashboard, getLiveStudents } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { getTeacherDashboard } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, ease },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#f97316", "#22c55e"];

interface Dashboard {
  totalStudents: number;
  totalProjects: number;
  pendingQuestions: number;
  recentQuizzes: {
    _id: string;
    student?: { username: string };
    topic: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    createdAt: string;
  }[];
  projectStatusBreakdown: {
    planning: number;
    inProgress: number;
    review: number;
    completed: number;
  };
}

interface LiveStudent {
  studentId: string;
  username: string;
  module: string;
  topic: string;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveStudents, setLiveStudents] = useState<LiveStudent[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, liveRes] = await Promise.all([
          getTeacherDashboard(),
          getLiveStudents()
        ]);
        setDashboard(dashRes.dashboard);
        setLiveStudents(liveRes);
        const res = await getTeacherDashboard();
        setDashboard(res.dashboard);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Socket.io for live student monitoring
    const socket = io(SOCKET_URL);
    socket.on("students:updated", () => {
      getLiveStudents().then(setLiveStudents).catch(() => {});
    });
    return () => { socket.disconnect(); };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const avgQuizScore =
    dashboard?.recentQuizzes && dashboard.recentQuizzes.length > 0
      ? Math.round(
          dashboard.recentQuizzes.reduce((a, q) => a + q.percentage, 0) /
            dashboard.recentQuizzes.length,
        )
      : 0;

  const stats = [
    {
      label: "Total Students",
      value: dashboard?.totalStudents ?? 0,
      icon: Users,
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-400",
    },
    {
      label: "Total Projects",
      value: dashboard?.totalProjects ?? 0,
      icon: FolderOpen,
      gradient: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
    },
    {
      label: "Pending Questions",
      value: dashboard?.pendingQuestions ?? 0,
      icon: MessageCircleQuestion,
      gradient:
        (dashboard?.pendingQuestions ?? 0) > 0
          ? "from-red-500/20 to-pink-500/20"
          : "from-purple-500/20 to-pink-500/20",
      iconColor:
        (dashboard?.pendingQuestions ?? 0) > 0
          ? "text-red-400"
          : "text-purple-400",
      highlight: (dashboard?.pendingQuestions ?? 0) > 0,
    },
    {
      label: "Avg Quiz Score",
      value: `${avgQuizScore}%`,
      icon: Trophy,
      gradient: "from-green-500/20 to-emerald-500/20",
      iconColor: "text-green-400",
    },
  ];

  const breakdown = dashboard?.projectStatusBreakdown;
  const pieData = breakdown
    ? [
        { name: "Planning", value: breakdown.planning },
        { name: "In Progress", value: breakdown.inProgress },
        { name: "Review", value: breakdown.review },
        { name: "Completed", value: breakdown.completed },
      ].filter((d) => d.value > 0)
    : [];

  const recentQuizzes = (dashboard?.recentQuizzes ?? []).slice(0, 5);
  const pendingCount = dashboard?.pendingQuestions ?? 0;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Welcome */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, {user?.username}
            </h1>
            <p className="text-sm text-muted-foreground">
              Here&apos;s your teaching overview
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className={`relative overflow-hidden border-white/[0.06] bg-white/[0.02] ${
              stat.highlight ? "ring-1 ring-red-500/30" : ""
            }`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`}
            />
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06]">
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Charts + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project Status Breakdown */}
        <motion.div variants={item}>
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">
                Project Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No project data yet
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "13px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Quizzes */}
        <motion.div variants={item}>
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold">
                Recent Quiz Submissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentQuizzes.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No quiz submissions yet
                </p>
              ) : (
                recentQuizzes.map((quiz) => (
                  <div
                    key={quiz._id}
                    className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {quiz.student?.username ?? "Student"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {quiz.topic}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        quiz.percentage >= 75
                          ? "text-green-400"
                          : quiz.percentage >= 50
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {quiz.score}/{quiz.totalQuestions} ({quiz.percentage}%)
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pending Questions Preview */}
      {pendingCount > 0 && (
        <motion.div variants={item}>
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <MessageCircleQuestion className="h-5 w-5 text-red-400" />
                Pending Questions
                <Badge
                  variant="outline"
                  className="bg-red-500/10 text-red-400 border-red-500/20"
                >
                  {pendingCount}
                </Badge>
              </CardTitle>
              <Link href="/teacher/questions">
                <Button variant="ghost" size="sm" className="text-xs">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You have {pendingCount} question{pendingCount !== 1 ? "s" : ""}{" "}
                waiting for your answer.
              </p>
              <Link href="/teacher/questions" className="mt-3 inline-block">
                <Button size="sm" className="gap-2">
                  <MessageCircleQuestion className="h-4 w-4" />
                  Answer Questions
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Live Classroom */}
      <motion.div variants={item}>
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Radio className="h-5 w-5 text-emerald-400 animate-pulse" />
            <CardTitle className="text-lg font-semibold">Live Classroom</CardTitle>
            <Badge variant="outline" className="ml-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              {liveStudents.length} online
            </Badge>
          </CardHeader>
          <CardContent>
            {liveStudents.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No students are currently studying
              </p>
            ) : (
              <div className="space-y-3">
                {liveStudents.map((s, idx) => (
                  <div key={`${s.studentId}-${idx}`} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">{s.username}</p>
                        <p className="text-xs text-muted-foreground">{s.topic || s.module}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{s.module}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
