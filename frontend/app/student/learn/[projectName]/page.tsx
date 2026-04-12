"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ModuleViewer } from "@/components/module-viewer";
import { AdaptiveModuleViewer } from "@/components/adaptive-module-viewer";
import { QuizGate } from "@/components/quiz-gate";
import { Card } from "@/components/ui/card";
import { RoadmapNode } from "@/components/roadmap-node";
import { ProjectOverview } from "@/components/project-overview";
import { WiringAgent } from "@/components/wiring-agent";
import { CodeAgent } from "@/components/code-agent";
import { CompileAgent } from "@/components/compile-agent";
import { TroubleshootAgent } from "@/components/troubleshoot-agent";
import { CompletionModal } from "@/components/completion-modal";
import { useModuleTimer } from "@/hooks/useModuleTimer";
import { useStudentPresence } from "@/hooks/useStudentPresence";
import {
  ArrowLeft,
  BookOpen,
  Cable,
  Code2,
  Zap,
  MessageSquare,
  Cpu,
  Layers,
  GraduationCap,
  Sparkles,
  Lock,
} from "lucide-react";

type RoadmapStep =
  | "basics"
  | "basics-quiz"
  | "adaptive"
  | "adaptive-quiz"
  | "overview"
  | "wiring"
  | "code"
  | "flash"
  | "troubleshoot";

type StepStatus = Record<RoadmapStep, "completed" | "active" | "locked">;

type Phase = {
  id: string;
  label: string;
  description: string;
  gradient: string;
  icon: React.ReactNode;
  steps: RoadmapStep[];
};

export default function StudentLearnPage() {
  const params = useParams();
  const projectName = decodeURIComponent(params.projectName as string);

  // Track time spent and broadcast presence to teacher dashboard
  useModuleTimer("learn", projectName);
  useStudentPresence("learn", projectName);

  const [activeStep, setActiveStep] = useState<RoadmapStep>("basics");
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [basicsQuizData, setBasicsQuizData] = useState<any[]>([]);
  const [adaptiveQuizData, setAdaptiveQuizData] = useState<any[]>([]);
  const [stepStatus, setStepStatus] = useState<StepStatus>({
    basics: "active",
    "basics-quiz": "locked",
    adaptive: "locked",
    "adaptive-quiz": "locked",
    overview: "locked",
    wiring: "locked",
    code: "locked",
    flash: "locked",
    troubleshoot: "locked",
  });

  const stepOrder: RoadmapStep[] = [
    "basics",
    "basics-quiz",
    "adaptive",
    "adaptive-quiz",
    "overview",
    "wiring",
    "code",
    "flash",
    "troubleshoot",
  ];

  const handleStepComplete = (step: RoadmapStep) => {
    const currentIndex = stepOrder.indexOf(step);
    const nextStep = stepOrder[currentIndex + 1];

    setStepStatus((prev) => ({
      ...prev,
      [step]: "completed",
      ...(nextStep && { [nextStep]: "active" }),
    }));

    if (nextStep) {
      setActiveStep(nextStep);
    } else {
      setTimeout(() => setShowCompletionModal(true), 500);
    }
  };

  const phases: Phase[] = [
    {
      id: "phase-1",
      label: "Phase 1 — Foundations",
      description: "Learn core electronics concepts",
      gradient: "from-blue-500 to-cyan-500",
      icon: <BookOpen className="h-4 w-4" />,
      steps: ["basics", "basics-quiz"],
    },
    {
      id: "phase-2",
      label: "Phase 2 — Project Knowledge",
      description: "Project-specific adaptive learning",
      gradient: "from-violet-500 to-purple-500",
      icon: <Layers className="h-4 w-4" />,
      steps: ["adaptive", "adaptive-quiz"],
    },
    {
      id: "phase-3",
      label: "Phase 3 — Build & Deploy",
      description: "Wire, code, compile, and troubleshoot",
      gradient: "from-emerald-500 to-green-500",
      icon: <Zap className="h-4 w-4" />,
      steps: ["overview", "wiring", "code", "flash", "troubleshoot"],
    },
  ];

  const roadmapSteps: Record<
    RoadmapStep,
    { title: string; description: string; icon: React.ReactNode }
  > = {
    basics: {
      title: "Beginner Modules",
      description: "Foundational electronics concepts and theory",
      icon: <BookOpen className="h-5 w-5" />,
    },
    "basics-quiz": {
      title: "Foundations Quiz",
      description: "Test your understanding to unlock next phase",
      icon: <GraduationCap className="h-5 w-5" />,
    },
    adaptive: {
      title: "Adaptive Modules",
      description: "Project-specific deep-dive content",
      icon: <Layers className="h-5 w-5" />,
    },
    "adaptive-quiz": {
      title: "Project Quiz",
      description: "Prove project knowledge to unlock build phase",
      icon: <GraduationCap className="h-5 w-5" />,
    },
    overview: {
      title: "Project Overview",
      description: "Components, architecture, and working principle",
      icon: <Cpu className="h-5 w-5" />,
    },
    wiring: {
      title: "Wiring Guide",
      description: "Pin mappings and connection diagrams",
      icon: <Cable className="h-5 w-5" />,
    },
    code: {
      title: "Code Generation",
      description: "AI-generated Arduino/ESP code",
      icon: <Code2 className="h-5 w-5" />,
    },
    flash: {
      title: "Compile & Flash",
      description: "Upload code to your board",
      icon: <Zap className="h-5 w-5" />,
    },
    troubleshoot: {
      title: "Troubleshooting",
      description: "AI-powered debugging assistant",
      icon: <MessageSquare className="h-5 w-5" />,
    },
  };

  const completedCount = Object.values(stepStatus).filter(
    (s) => s === "completed",
  ).length;
  const totalSteps = stepOrder.length;
  const overallProgress = (completedCount / totalSteps) * 100;

  const renderActiveAgent = () => {
    switch (activeStep) {
      case "basics":
        return (
          <ModuleViewer
            projectName={projectName}
            onComplete={(quizData) => {
              setBasicsQuizData(quizData);
              handleStepComplete("basics");
            }}
          />
        );
      case "basics-quiz":
        return (
          <QuizGate
            quizData={basicsQuizData}
            topic={`${projectName} - Foundations`}
            phaseLabel="Foundations Quiz"
            onPass={() => handleStepComplete("basics-quiz")}
          />
        );
      case "adaptive":
        return (
          <AdaptiveModuleViewer
            projectName={projectName}
            onComplete={(quizData) => {
              setAdaptiveQuizData(quizData);
              handleStepComplete("adaptive");
            }}
          />
        );
      case "adaptive-quiz":
        return (
          <QuizGate
            quizData={adaptiveQuizData}
            topic={`${projectName} - Project Knowledge`}
            phaseLabel="Project Knowledge Quiz"
            onPass={() => handleStepComplete("adaptive-quiz")}
          />
        );
      case "overview":
        return (
          <ProjectOverview
            projectName={projectName}
            onComplete={() => handleStepComplete("overview")}
          />
        );
      case "wiring":
        return (
          <WiringAgent
            projectName={projectName}
            onComplete={() => handleStepComplete("wiring")}
          />
        );
      case "code":
        return (
          <CodeAgent
            projectName={projectName}
            onCodeGenerated={setGeneratedCode}
            onComplete={() => handleStepComplete("code")}
          />
        );
      case "flash":
        return (
          <CompileAgent
            projectName={projectName}
            code={generatedCode}
            onComplete={() => handleStepComplete("flash")}
          />
        );
      case "troubleshoot":
        return (
          <TroubleshootAgent
            projectName={projectName}
            onComplete={() => handleStepComplete("troubleshoot")}
          />
        );
      default:
        return null;
    }
  };

  const getPhaseStatus = (phase: Phase) => {
    const statuses = phase.steps.map((s) => stepStatus[s]);
    if (statuses.every((s) => s === "completed")) return "completed";
    if (statuses.some((s) => s === "active" || s === "completed"))
      return "active";
    return "locked";
  };

  return (
    <>
      {showCompletionModal && (
        <CompletionModal
          projectName={projectName}
          onClose={() => setShowCompletionModal(false)}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col min-h-[calc(100vh-4rem)]"
      >
        {/* Top bar */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <a href="/student/projects">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </a>
              </Button>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Cpu className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-foreground">
                    {projectName}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Learning Roadmap
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                {completedCount}/{totalSteps} steps
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 py-6">
          <div className="grid lg:grid-cols-[380px,1fr] gap-6 h-full">
            {/* Roadmap Sidebar */}
            <aside className="space-y-4">
              {/* Overall Progress */}
              <Card className="p-4 bg-card border-border">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground">
                    Learning Path
                  </h2>
                  <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {Math.round(overallProgress)}%
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500 transition-all duration-700 ease-out"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </Card>

              {/* Phase-grouped roadmap */}
              <div className="space-y-3">
                {phases.map((phase) => {
                  const phaseStatus = getPhaseStatus(phase);
                  return (
                    <Card
                      key={phase.id}
                      className={`overflow-hidden border-border transition-all duration-300 ${
                        phaseStatus === "locked" ? "opacity-60" : ""
                      }`}
                    >
                      {/* Phase header */}
                      <div
                        className={`px-4 py-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider border-b border-border ${
                          phaseStatus === "completed"
                            ? "bg-emerald-500/5 text-emerald-400"
                            : phaseStatus === "active"
                              ? `bg-gradient-to-r ${phase.gradient} bg-clip-text text-transparent`
                              : "text-muted-foreground"
                        }`}
                      >
                        {phaseStatus === "locked" ? (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          phase.icon
                        )}
                        {phase.label}
                      </div>

                      {/* Steps */}
                      <div className="p-2 space-y-1">
                        {phase.steps.map((stepId, index) => {
                          const step = roadmapSteps[stepId];
                          return (
                            <div key={stepId}>
                              <RoadmapNode
                                title={step.title}
                                description={step.description}
                                status={stepStatus[stepId]}
                                icon={step.icon}
                                isActive={activeStep === stepId}
                                isQuiz={
                                  stepId === "basics-quiz" ||
                                  stepId === "adaptive-quiz"
                                }
                                onClick={() =>
                                  stepStatus[stepId] !== "locked" &&
                                  setActiveStep(stepId)
                                }
                              />
                              {index < phase.steps.length - 1 && (
                                <div className="ml-6 h-2 flex items-center">
                                  <div
                                    className={`w-0.5 h-full transition-all duration-500 ${
                                      stepStatus[stepId] === "completed"
                                        ? "bg-primary/50"
                                        : "bg-border"
                                    }`}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Tips */}
              <Card className="p-4 bg-card/50 border-border">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  How it works
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5 text-xs">①</span>
                    <span className="leading-relaxed">
                      Complete beginner modules, then pass the quiz
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5 text-xs">②</span>
                    <span className="leading-relaxed">
                      Learn project-specific content, then pass the quiz
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5 text-xs">③</span>
                    <span className="leading-relaxed">
                      Build your project: wire, code, compile, and debug
                    </span>
                  </li>
                </ul>
              </Card>
            </aside>

            {/* Agent Content Area */}
            <main className="min-h-[600px]">
              <Card className="h-full bg-card border-border overflow-hidden">
                {renderActiveAgent()}
              </Card>
            </main>
          </div>
        </div>
      </motion.div>
    </>
  );
}
