"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { fetchProjectName, createProject, getFaculty } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState("");
  const [identifiedName, setIdentifiedName] = useState("");
  const [title, setTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [guide, setGuide] = useState("");
  const [faculties, setFaculties] = useState<any[]>([]);
  const [identifying, setIdentifying] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getFaculty().then(setFaculties).catch(console.error);
  }, []);

  const handleIdentify = async () => {
    if (!description.trim()) {
      toast.error("Please enter a project description");
      return;
    }
    setIdentifying(true);
    try {
      const res = await fetchProjectName(description);
      const name = res.project_name || res.projectName || description;
      setIdentifiedName(name);
      setTitle(name);
      setStep(2);
    } catch {
      toast.error("Failed to identify project. Please try again.");
    } finally {
      setIdentifying(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a project title");
      return;
    }
    setCreating(true);
    try {
      await createProject({
        title,
        description: projectDescription || undefined,
        topic: identifiedName || undefined,
        guide: guide || undefined,
      });
      toast.success("Project created!");
      const encoded = encodeURIComponent(identifiedName || title);
      router.push(`/student/learn/${encoded}`);
    } catch {
      toast.error("Failed to create project. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Start a New Project
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe your project and we&apos;ll help you get started
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            step >= 1
              ? "bg-primary text-primary-foreground"
              : "bg-white/[0.06] text-muted-foreground"
          }`}
        >
          {step > 1 ? <Check className="h-4 w-4" /> : "1"}
        </div>
        <div className="h-px flex-1 bg-white/[0.08]" />
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            step >= 2
              ? "bg-primary text-primary-foreground"
              : "bg-white/[0.06] text-muted-foreground"
          }`}
        >
          2
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease }}
          >
            <Card className="border-white/[0.06] bg-white/[0.02]">
              <CardContent className="space-y-5 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    Describe Your Project
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tell us what you want to build and we&apos;ll identify the
                    project for you
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Project Description</Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., I want to build a temperature monitoring system using Arduino with an LCD display..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-32 resize-none border-white/[0.08] bg-white/[0.03] focus-visible:border-primary/50"
                  />
                </div>
                <Button
                  onClick={handleIdentify}
                  disabled={identifying || !description.trim()}
                  className="w-full gap-2"
                  size="lg"
                >
                  {identifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Identify Project
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease }}
          >
            <Card className="border-white/[0.06] bg-white/[0.02]">
              <CardContent className="space-y-5 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                  <Rocket className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    Confirm Project Details
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We identified your project. Confirm or adjust the details
                    below.
                  </p>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">
                    Identified Project
                  </p>
                  <p className="mt-1 text-lg font-semibold">{identifiedName}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Project Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-11 border-white/[0.08] bg-white/[0.03] focus-visible:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projDesc">
                      Description{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id="projDesc"
                      placeholder="Add additional notes about your project..."
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      className="min-h-20 resize-none border-white/[0.08] bg-white/[0.03] focus-visible:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guide">Select Your Guide</Label>
                    <Select value={guide} onValueChange={setGuide}>
                      <SelectTrigger className="h-11 border-white/[0.08] bg-white/[0.03]">
                        <SelectValue placeholder="Select a faculty guide" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map((f) => (
                          <SelectItem key={f._id} value={f._id}>
                            {f.title} {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="gap-2 border-white/[0.08]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={creating || !title.trim() || !guide}
                    className="flex-1 gap-2"
                    size="lg"
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Create & Start Learning
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
