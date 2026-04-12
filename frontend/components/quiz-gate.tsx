"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
  Trophy,
  Lightbulb,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitQuizResult } from "@/lib/api";
import { useTabGuard } from "@/hooks/useTabGuard";

interface QuizQuestion {
  question: string;
  difficulty?: "foundational" | "applied" | "diagnostic";
  options: string[];
  correct_answer: string;
  hint?: string;
  explanation?: string;
}

interface QuizModule {
  module_title: string;
  questions: QuizQuestion[];
}

interface QuizGateProps {
  quizData: QuizModule[];
  topic: string;
  passThreshold?: number;
  onPass: () => void;
  phaseLabel?: string;
}

const difficultyConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  foundational: {
    label: "Foundational",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  applied: {
    label: "Applied",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  diagnostic: {
    label: "Diagnostic",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
};

export function QuizGate({
  quizData,
  topic,
  passThreshold = 60,
  onPass,
  phaseLabel = "Module Quiz",
}: QuizGateProps) {
  const allQuestions = quizData.flatMap((m) =>
    m.questions.map((q) => ({ ...q, moduleTitle: m.module_title })),
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [answers, setAnswers] = useState<
    Array<{
      question: string;
      selectedAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }>
  >([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = allQuestions[currentIndex];
  const progress = ((currentIndex + 1) / allQuestions.length) * 100;
  
  const { switchCount } = useTabGuard(!quizComplete && allQuestions.length > 0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const prevSwitchCount = useRef(switchCount);

  useEffect(() => {
    if (switchCount > prevSwitchCount.current) {
      setShowCheatWarning(true);
      prevSwitchCount.current = switchCount;
    }
  }, [switchCount]);

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
  };

  const handleConfirm = () => {
    if (!selectedAnswer || isAnswered) return;
    setIsAnswered(true);
    setAnswers((prev) => [
      ...prev,
      {
        question: currentQuestion.question,
        selectedAnswer,
        correctAnswer: currentQuestion.correct_answer,
        isCorrect: selectedAnswer === currentQuestion.correct_answer,
      },
    ]);
  };

  const handleNext = async () => {
    if (currentIndex < allQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowHint(false);
    } else {
      setQuizComplete(true);
      const finalAnswers = [...answers];
      const score = finalAnswers.filter((a) => a.isCorrect).length;
      const totalQuestions = allQuestions.length;
      const percentage = Math.round((score / totalQuestions) * 100);

      setSubmitting(true);
      try {
        await submitQuizResult({
          topic,
          score,
          totalQuestions,
          percentage,
          tabSwitchCount: switchCount,
          answers: finalAnswers,
        });
      } catch (e) {
        console.error("Failed to submit quiz result:", e);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowHint(false);
    setAnswers([]);
    setQuizComplete(false);
  };

  const score = answers.filter((a) => a.isCorrect).length;
  const percentage =
    allQuestions.length > 0
      ? Math.round((score / allQuestions.length) * 100)
      : 0;
  const passed = percentage >= passThreshold;

  if (allQuestions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-amber-400" />
        </div>
        <p className="text-muted-foreground text-center">
          No quiz questions available. Completing automatically...
        </p>
        <Button onClick={onPass}>Continue</Button>
      </div>
    );
  }

  if (showCheatWarning) {
    return (
      <div className="h-full flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-red-500/5 backdrop-blur-sm z-0"></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-md w-full relative z-10"
        >
          <Card className="border-red-500/50 bg-background/95 shadow-2xl shadow-red-500/20 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex flex-col items-center justify-center animate-pulse">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-red-500">
                  Warning: Focus Lost
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You have switched tabs or lost focus on the quiz window. This incident has been recorded to your instructor.
                  Frequent tab switching is a violation of the anti-cheat protocol and may result in a failing grade.
                </p>
              </div>
              <Button
                variant="destructive"
                className="w-full gap-2 font-semibold"
                size="lg"
                onClick={() => setShowCheatWarning(false)}
              >
                I Understand, Return to Quiz
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Results screen
  if (quizComplete) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-lg w-full"
          >
            <Card className="p-8 border-2 overflow-hidden relative">
              <div
                className={cn(
                  "absolute inset-0 opacity-[0.03]",
                  passed
                    ? "bg-gradient-to-br from-emerald-500 to-cyan-500"
                    : "bg-gradient-to-br from-red-500 to-orange-500",
                )}
              />
              <div className="relative text-center space-y-6">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="flex justify-center"
                >
                  <div
                    className={cn(
                      "h-20 w-20 rounded-full flex items-center justify-center",
                      passed
                        ? "bg-gradient-to-br from-emerald-500/20 to-cyan-500/20"
                        : "bg-gradient-to-br from-red-500/20 to-orange-500/20",
                    )}
                  >
                    {passed ? (
                      <Trophy className="h-10 w-10 text-emerald-400" />
                    ) : (
                      <XCircle className="h-10 w-10 text-red-400" />
                    )}
                  </div>
                </motion.div>

                {/* Score */}
                <div>
                  <h2 className="text-2xl font-bold">
                    {passed ? "Quiz Passed! 🎉" : "Not Quite There"}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {passed
                      ? "Great work! You can proceed to the next phase."
                      : `You need ${passThreshold}% to pass. Review the material and try again.`}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <div
                      className={cn(
                        "text-2xl font-bold",
                        passed ? "text-emerald-400" : "text-red-400",
                      )}
                    >
                      {percentage}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Score
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <div className="text-2xl font-bold text-blue-400">
                      {score}/{allQuestions.length}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Correct
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <div className="text-2xl font-bold text-amber-400">
                      {passThreshold}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Required
                    </div>
                  </div>
                </div>

                {/* Answer Review */}
                <div className="text-left space-y-2 max-h-48 overflow-y-auto">
                  {answers.map((a, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg text-sm",
                        a.isCorrect ? "bg-emerald-500/5" : "bg-red-500/5",
                      )}
                    >
                      {a.isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      )}
                      <span className="text-muted-foreground line-clamp-2">
                        {a.question}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {!passed && (
                    <Button
                      variant="outline"
                      onClick={handleRetry}
                      className="flex-1 gap-2"
                      disabled={submitting}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Retry Quiz
                    </Button>
                  )}
                  {passed && (
                    <Button
                      onClick={onPass}
                      className="flex-1 gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white border-0 shadow-lg shadow-emerald-500/20"
                      disabled={submitting}
                    >
                      <Sparkles className="h-4 w-4" />
                      Continue to Next Phase
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Question screen
  const difficulty = currentQuestion.difficulty
    ? difficultyConfig[currentQuestion.difficulty]
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-6 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{phaseLabel}</h2>
              <p className="text-xs text-muted-foreground">
                Question {currentIndex + 1} of {allQuestions.length}
              </p>
            </div>
          </div>
          {difficulty && (
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full border",
                difficulty.bg,
              )}
            >
              {difficulty.label}
            </span>
          )}
        </div>
        <Progress value={progress} className="h-2 bg-white/[0.06]" />
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            {/* Module context */}
            {(currentQuestion as any).moduleTitle && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {(currentQuestion as any).moduleTitle}
              </p>
            )}

            {/* Question */}
            <h3 className="text-xl font-semibold leading-relaxed">
              {currentQuestion.question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correct_answer;
                const showCorrect = isAnswered && isCorrect;
                const showWrong = isAnswered && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleSelect(option)}
                    disabled={isAnswered}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
                      "hover:scale-[1.01] active:scale-[0.99]",
                      !isAnswered &&
                        !isSelected &&
                        "border-white/[0.06] bg-white/[0.02] hover:border-primary/30 hover:bg-white/[0.04]",
                      !isAnswered &&
                        isSelected &&
                        "border-primary bg-primary/5 shadow-lg shadow-primary/10",
                      showCorrect && "border-emerald-500 bg-emerald-500/10",
                      showWrong && "border-red-500 bg-red-500/10",
                      isAnswered &&
                        !showCorrect &&
                        !showWrong &&
                        "border-white/[0.04] bg-white/[0.01] opacity-50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-sm font-semibold",
                          !isAnswered &&
                            !isSelected &&
                            "bg-white/[0.06] text-muted-foreground",
                          !isAnswered &&
                            isSelected &&
                            "bg-primary text-primary-foreground",
                          showCorrect && "bg-emerald-500 text-white",
                          showWrong && "bg-red-500 text-white",
                          isAnswered &&
                            !showCorrect &&
                            !showWrong &&
                            "bg-white/[0.04] text-muted-foreground",
                        )}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="flex-1">{option}</span>
                      {showCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      )}
                      {showWrong && (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Hint */}
            {currentQuestion.hint && !isAnswered && (
              <div>
                {!showHint ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHint(true)}
                    className="gap-2 text-amber-400 hover:text-amber-300"
                  >
                    <Lightbulb className="h-4 w-4" />
                    Show Hint
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20"
                  >
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5" />
                      <p className="text-sm text-amber-200/80">
                        {currentQuestion.hint}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Explanation after answer */}
            {isAnswered && currentQuestion.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20"
              >
                <p className="text-sm font-medium text-blue-400 mb-1">
                  Explanation
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-6 flex items-center justify-between bg-background/80 backdrop-blur-md">
        <p className="text-sm text-muted-foreground">
          {score} correct so far • Need {passThreshold}% to pass
        </p>
        <div className="flex gap-3">
          {!isAnswered ? (
            <Button
              onClick={handleConfirm}
              disabled={!selectedAnswer}
              className="gap-2 min-w-[140px]"
            >
              Confirm Answer
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2 min-w-[140px]">
              {currentIndex < allQuestions.length - 1 ? (
                <>
                  Next Question
                  <ChevronRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  See Results
                  <Trophy className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
