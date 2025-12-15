"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, BookOpen, CheckCircle2, ExternalLink } from "lucide-react";
import { fetchBasicModules } from "@/lib/api";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface ModuleViewerProps {
  projectName: string;
  onComplete: () => void;
}

interface Resource {
  name: string;
  url: string;
}

interface ModuleData {
  title: string;
  subtitle?: string;
  content: string;
  resources?: Resource[];
}

export function ModuleViewer({ projectName, onComplete }: ModuleViewerProps) {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  useEffect(() => {
    const loadModules = async () => {
      try {
        const data = await fetchBasicModules(projectName);
        // The backend might return the modules array directly, or a string, or inside a property.
        const rawInput = data.modules || data; 
        
        let parsed: ModuleData[] = [];

        if (typeof rawInput === 'object' && rawInput !== null) {
            // It's already parsed!
            if (Array.isArray(rawInput)) {
                parsed = rawInput;
            } else if (rawInput.modules && Array.isArray(rawInput.modules)) {
                 parsed = rawInput.modules;
            } else {
                 // Single module object fallback
                 if (rawInput.title && rawInput.content) {
                     parsed = [rawInput as ModuleData];
                 }
            }
        } else if (typeof rawInput === 'string') {
            // It's a string, try to parse JSON or Markdown
            try {
                let jsonString = rawInput.trim();
                // Clean markdown code blocks if present
                if (jsonString.startsWith("```json")) {
                    jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "").trim();
                } else if (jsonString.startsWith("```")) {
                    jsonString = jsonString.replace(/^```/, "").replace(/```$/, "").trim();
                }
                
                const jsonOutput = JSON.parse(jsonString);
                if (Array.isArray(jsonOutput)) {
                    parsed = jsonOutput;
                } else if (jsonOutput.modules && Array.isArray(jsonOutput.modules)) {
                    parsed = jsonOutput.modules;
                } else {
                    parsed = [jsonOutput];
                }
            } catch (e) {
                console.warn("JSON parsing failed, falling back to markdown splitting", e);
                // Fallback: Markdown splitting
                const chunks = rawInput.split(/^## /m).filter(Boolean);
                parsed = chunks.map((chunk: string) => {
                  const lines = chunk.split("\n");
                  const title = lines[0].trim();
                  const content = lines.slice(1).join("\n").trim();
                  return { title, content };
                });
            }
        }

        if (parsed.length === 0) {
           setModules([{ title: "Welcome", content: "No modules found. Please try again." }]);
        } else {
           setModules(parsed);
        }
      } catch (error) {
        console.error("Failed to load modules", error);
        setModules([{ title: "Error", content: "Failed to load learning modules." }]);
      } finally {
        setLoading(false);
      }
    };
    loadModules();
  }, [projectName]);

  const handleNext = () => {
    if (currentStep < modules.length - 1) {
      setDirection('next');
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection('prev');
      setCurrentStep(prev => prev - 1);
    }
  };

  if (loading) {
    return (
        <div className="flex flex-col h-full items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground animate-pulse">Generating your custom curriculum...</p>
        </div>
    );
  }

  const currentModule = modules[currentStep];
  const progress = ((currentStep + 1) / modules.length) * 100;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="border-b border-border p-6 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
                    <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Learning Modules</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Module {currentStep + 1}</span>
                        <span>of</span>
                        <span>{modules.length}</span>
                    </div>
                </div>
             </div>
             <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {Math.round(progress)}% Complete
             </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
            <div 
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
            />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative p-6">
        <div 
            key={currentStep}
            className={`h-full overflow-auto pr-2 animate-in fade-in slide-in-from-${direction === 'next' ? 'right' : 'left'}-8 duration-500 ease-in-out fill-mode-both`}
        >
            <Card className="min-h-full p-8 shadow-md border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Module Title Section */}
                    <div className="border-b border-border pb-6">
                        <h3 className="text-3xl font-bold text-foreground mb-2">{currentModule?.title}</h3>
                        {currentModule?.subtitle && (
                            <p className="text-lg text-muted-foreground font-medium">{currentModule.subtitle}</p>
                        )}
                    </div>



                    {/* Main Content */}
                    <div className="prose prose-zinc dark:prose-invert max-w-none">
                        <MarkdownRenderer content={currentModule?.content || ''} />
                    </div>

                    {/* Resources Section (if available) */}
                    {currentModule?.resources && currentModule.resources.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-border">
                            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <ExternalLink className="h-4 w-4" />
                                Recommended Resources
                            </h4>
                            <div className="grid gap-3 md:grid-cols-2">
                                {currentModule.resources.map((res, idx) => (
                                    <a 
                                        key={idx}
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary hover:shadow-md transition-all group border border-transparent hover:border-border"
                                    >
                                        <span className="font-medium text-sm truncate pr-4">{res.name}</span>
                                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="p-6 border-t border-border flex justify-between items-center bg-background/80 backdrop-blur-md sticky bottom-0 z-10">
        <Button
            variant="ghost"
            size="lg"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="gap-2 hover:bg-secondary/80 pl-2"
        >
            <ChevronLeft className="h-5 w-5" />
            Previous
        </Button>

        <div className="flex gap-2">
            <Button
                size="lg"
                onClick={handleNext}
                className="gap-2 min-w-[160px] shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
            >
                {currentStep === modules.length - 1 ? (
                    <>
                    Complete Module
                    <CheckCircle2 className="h-5 w-5" />
                    </>
                ) : (
                    <>
                    Next Topic
                    <ChevronRight className="h-5 w-5" />
                    </>
                )}
            </Button>
        </div>
      </div>
    </div>
  );
}
