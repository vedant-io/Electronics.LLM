"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Code2,
  Copy,
  Download,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";
import { fetchProjectCode } from "@/lib/api";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeAgentProps {
  projectName: string;
  onCodeGenerated?: (code: string) => void;
  onComplete?: () => void;
}

export function CodeAgent({
  projectName,
  onCodeGenerated,
  onComplete,
}: CodeAgentProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadCode = async () => {
      try {
        const data = await fetchProjectCode(projectName);
        const generatedCode = data.code || "";

        setCode(generatedCode);
        if (onCodeGenerated) {
          onCodeGenerated(generatedCode);
        }
      } catch (error) {
        console.error("Error fetching code:", error);
        setCode("// Error loading code");
      } finally {
        setLoading(false);
      }
    };
    loadCode();
  }, [projectName, onCodeGenerated]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(code),
    );
    element.setAttribute("download", `${projectName}.ino`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground">Generating Code...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center">
            <Code2 className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Code Generation
            </h2>
            <p className="text-muted-foreground">
              Your generated Arduino code is ready to upload
            </p>
          </div>
        </div>
      </div>

      {/* Code Display */}
      <div className="flex-1 overflow-hidden flex flex-col">


        <div className="flex-1 overflow-auto p-6">
          <Card className="h-full bg-muted/50 p-0 overflow-hidden border-0">
             <SyntaxHighlighter
                language="cpp"
                style={vscDarkPlus}
                customStyle={{ margin: 0, padding: '1.5rem', height: '100%', fontSize: '0.875rem', lineHeight: '1.6' }}
                showLineNumbers={true}
                wrapLines={true}
             >
                {code}
             </SyntaxHighlighter>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-border p-6 flex gap-4">
          <Button
            variant="default"
            size="lg"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Code
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download (.ino)
          </Button>
          {onComplete && (
            <Button
              variant="outline"
              size="lg"
              onClick={onComplete}
              className="ml-auto gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
