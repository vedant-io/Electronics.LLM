"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Trophy,
  FolderOpen,
  Star,
  Send,
  Loader2,
  MessageSquare,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  getStudentProgress,
  getStudentProjectsTeacher,
  getStudentQuizResultsTeacher,
  addProjectFeedback,
  getTeacherProjectFeedback,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

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

const tabContent = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.15 } },
};

const statusColors: Record<string, string> = {
  planning: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "in-progress": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  review: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
};

interface StudentInfo {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
}

interface QuizStats {
  totalQuizzes: number;
  averageScore: number;
  recentQuizzes: {
    _id: string;
    topic: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    createdAt: string;
  }[];
}

interface Project {
  _id: string;
  title: string;
  description?: string;
  topic?: string;
  status: string;
  createdAt: string;
}

interface Feedback {
  _id: string;
  comment: string;
  rating?: number;
  teacher?: { username: string };
  createdAt: string;
}

interface QuizResult {
  _id: string;
  topic: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  tabSwitchCount?: number;
  createdAt: string;
}

interface ModuleSession {
  _id: string;
  module: string;
  topic: string;
  durationSeconds: number;
  createdAt: string;
}

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  useAuth();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [moduleSessions, setModuleSessions] = useState<ModuleSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Feedback state
  const [feedbackProject, setFeedbackProject] = useState<string | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [projectFeedbacks, setProjectFeedbacks] = useState<
    Record<string, Feedback[]>
  >({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [progressRes, projRes, quizRes] = await Promise.all([
          getStudentProgress(id),
          getStudentProjectsTeacher(id, 1, 50),
          getStudentQuizResultsTeacher(id, 1, 50),
        ]);
        setStudent(progressRes.student || null);
        setQuizStats(
          progressRes.quizSummary
            ? {
                ...progressRes.quizSummary,
                recentQuizzes: progressRes.recentQuizzes || [],
              }
            : null
        );
        setProjects(projRes.projects || []);
        setQuizResults(quizRes.quizResults || quizRes.results || []);
        setModuleSessions(progressRes.moduleSessions || []);
      } catch {
        toast.error("Failed to load student data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const loadFeedback = async (projectId: string) => {
    try {
      const res = await getTeacherProjectFeedback(projectId);
      setProjectFeedbacks((prev) => ({
        ...prev,
        [projectId]: res.feedback || [],
      }));
    } catch {
      // silently handle
    }
  };

  const handleSubmitFeedback = async (projectId: string) => {
    if (!feedbackComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    setSubmittingFeedback(true);
    try {
      await addProjectFeedback(projectId, {
        comment: feedbackComment,
        ...(feedbackRating > 0 ? { rating: feedbackRating } : {}),
      });
      toast.success("Feedback submitted!");
      setFeedbackComment("");
      setFeedbackRating(0);
      setFeedbackProject(null);
      await loadFeedback(projectId);
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Student not found</p>
        <Link href="/teacher/students">
          <Button variant="ghost" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Students
          </Button>
        </Link>
      </div>
    );
  }

  const initials = student.username
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Back Button */}
      <motion.div variants={item}>
        <Link href="/teacher/students">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Back to Students
          </Button>
        </Link>
      </motion.div>

      {/* Student Header */}
      <motion.div variants={item}>
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">{student.username}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {student.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Joined{" "}
                    {new Date(student.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="modules">Time Logs</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            <TabsContent value="overview" key="overview">
              <motion.div
                variants={tabContent}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6 mt-4"
              >
                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Card className="border-white/[0.06] bg-white/[0.02]">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                          <Trophy className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Total Quizzes
                          </p>
                          <p className="text-xl font-bold">
                            {quizStats?.totalQuizzes ?? 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-white/[0.06] bg-white/[0.02]">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                          <Trophy className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Avg Score
                          </p>
                          <p className="text-xl font-bold">
                            {Math.round(quizStats?.averageScore ?? 0)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-white/[0.06] bg-white/[0.02]">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                          <FolderOpen className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Projects
                          </p>
                          <p className="text-xl font-bold">{projects.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Quizzes */}
                {quizStats?.recentQuizzes &&
                  quizStats.recentQuizzes.length > 0 && (
                    <Card className="border-white/[0.06] bg-white/[0.02]">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">
                          Recent Quizzes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {quizStats.recentQuizzes.slice(0, 5).map((q) => (
                          <div
                            key={q._id}
                            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                          >
                            <div>
                              <p className="text-sm font-medium">{q.topic}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(q.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`text-sm font-semibold ${
                                q.percentage >= 75
                                  ? "text-green-400"
                                  : q.percentage >= 50
                                    ? "text-yellow-400"
                                    : "text-red-400"
                              }`}
                            >
                              {q.percentage}%
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
              </motion.div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" key="projects">
              <motion.div
                variants={tabContent}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4 mt-4"
              >
                {projects.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No projects yet
                  </p>
                ) : (
                  projects.map((project) => (
                    <Card
                      key={project._id}
                      className="border-white/[0.06] bg-white/[0.02]"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">
                              {project.title}
                            </p>
                            {project.description && (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                {project.description}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={
                                  statusColors[project.status] ||
                                  "bg-gray-500/10 text-gray-400"
                                }
                              >
                                {project.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(
                                  project.createdAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-3 shrink-0 gap-1"
                            onClick={() => {
                              if (feedbackProject === project._id) {
                                setFeedbackProject(null);
                              } else {
                                setFeedbackProject(project._id);
                                loadFeedback(project._id);
                              }
                            }}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Feedback
                          </Button>
                        </div>

                        {/* Feedback Section */}
                        <AnimatePresence>
                          {feedbackProject === project._id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-4">
                                {/* Existing Feedback */}
                                {projectFeedbacks[project._id]?.map((fb) => (
                                  <div
                                    key={fb._id}
                                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium">
                                        {fb.teacher?.username ?? "Teacher"}
                                      </span>
                                      {fb.rating && (
                                        <div className="flex gap-0.5">
                                          {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                              key={s}
                                              className={`h-3 w-3 ${
                                                s <= fb.rating!
                                                  ? "fill-amber-400 text-amber-400"
                                                  : "text-muted-foreground/30"
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {fb.comment}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground/60">
                                      {new Date(
                                        fb.createdAt,
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                ))}

                                {/* New Feedback Form */}
                                <div className="space-y-3">
                                  <Textarea
                                    placeholder="Write your feedback..."
                                    value={feedbackComment}
                                    onChange={(e) =>
                                      setFeedbackComment(e.target.value)
                                    }
                                    className="min-h-20 border-white/[0.08] bg-white/[0.03]"
                                  />
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">
                                        Rating:
                                      </span>
                                      <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                          <button
                                            key={s}
                                            type="button"
                                            onClick={() =>
                                              setFeedbackRating(
                                                feedbackRating === s ? 0 : s,
                                              )
                                            }
                                            onMouseEnter={() =>
                                              setFeedbackHover(s)
                                            }
                                            onMouseLeave={() =>
                                              setFeedbackHover(0)
                                            }
                                            className="p-0.5 transition-transform hover:scale-110"
                                          >
                                            <Star
                                              className={`h-4 w-4 ${
                                                s <=
                                                (feedbackHover ||
                                                  feedbackRating)
                                                  ? "fill-amber-400 text-amber-400"
                                                  : "text-muted-foreground/30"
                                              }`}
                                            />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      disabled={submittingFeedback}
                                      onClick={() =>
                                        handleSubmitFeedback(project._id)
                                      }
                                      className="gap-1"
                                    >
                                      {submittingFeedback ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Send className="h-3.5 w-3.5" />
                                      )}
                                      Submit
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  ))
                )}
              </motion.div>
            </TabsContent>

            {/* Quizzes Tab */}
            <TabsContent value="quizzes" key="quizzes">
              <motion.div
                variants={tabContent}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-3 mt-4"
              >
                {quizResults.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No quiz results yet
                  </p>
                ) : (
                  quizResults.map((quiz) => (
                    <Card
                      key={quiz._id}
                      className="border-white/[0.06] bg-white/[0.02]"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{quiz.topic}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(quiz.createdAt).toLocaleDateString()}
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
                            {quiz.score}/{quiz.totalQuestions}
                          </span>
                        </div>
                        <div className="mt-2">
                          <Progress
                            value={quiz.percentage}
                            className="h-1.5 bg-white/[0.06]"
                          />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                          <span>{quiz.percentage}%</span>
                          {quiz.tabSwitchCount !== undefined && quiz.tabSwitchCount > 0 && (
                            <span className="flex items-center gap-1 text-red-400 font-medium">
                              <AlertTriangle className="h-3 w-3" />
                              {quiz.tabSwitchCount} Tab Switches
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </motion.div>
            </TabsContent>

            {/* Modules / Time Logs Tab */}
            <TabsContent value="modules" key="modules">
              <motion.div
                variants={tabContent}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-3 mt-4"
              >
                {moduleSessions.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No time logs recorded yet
                  </p>
                ) : (
                  moduleSessions.map((session) => (
                    <Card
                      key={session._id}
                      className="border-white/[0.06] bg-white/[0.02]"
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{session.module}</p>
                          {session.topic && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {session.topic}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                            <Clock className="h-4 w-4" />
                            {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
