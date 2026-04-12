"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  AlertTriangle,
  Code2,
  Unplug,
  Bug,
} from "lucide-react";
import { sendTroubleshootQuery } from "@/lib/api";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface TroubleshootAgentProps {
  projectName: string;
  onComplete?: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function TroubleshootAgent({
  projectName,
  onComplete,
}: TroubleshootAgentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hello! I'm your AI troubleshooting assistant for the ${projectName} project. I have full context of your wiring, code, and any compilation errors. How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await sendTroubleshootQuery(input, projectName);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Unable to get response",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-6 bg-gradient-to-r from-rose-500/[0.07] via-red-500/[0.05] to-orange-500/[0.07]">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0 h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-accent" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              AI Troubleshooting
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Get instant help with errors, wiring issues, and code problems
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="relative flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
              </div>
            )}
            {/* Welcome message with special styling */}
            {idx === 0 && message.role === "assistant" ? (
              <div className="max-w-[80%] p-[1px] rounded-xl bg-gradient-to-br from-rose-500/40 via-orange-500/30 to-amber-500/40">
                <Card className="p-4 bg-card border-0 rounded-[11px]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">👋</span>
                    <span className="text-xs font-medium text-orange-400/80 uppercase tracking-wider">Welcome</span>
                  </div>
                  <div className="text-sm leading-relaxed">
                    <MarkdownRenderer content={message.content} />
                  </div>
                  <p className="text-xs mt-2 text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </Card>
              </div>
            ) : (
              <Card
                className={`max-w-[80%] p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border"
                }`}
              >
                <div
                  className={`text-sm leading-relaxed ${message.role === "user" ? "whitespace-pre-wrap" : ""}`}
                >
                  {message.role === "user" ? (
                    message.content
                  ) : (
                    <MarkdownRenderer content={message.content} />
                  )}
                </div>
                <p
                  className={`text-xs mt-2 ${
                    message.role === "user"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </Card>
            )}
            {message.role === "user" && (
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                <User className="h-5 w-5 text-accent" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <Card className="max-w-[80%] p-4 bg-card border-border">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "-0.3s" }}
                />
                <div
                  className="h-2 w-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "-0.15s" }}
                />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-border px-6 py-3 bg-muted/30">
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          Quick questions:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { text: "Sensor not reading", icon: AlertTriangle, color: "border-amber-500/30 text-amber-400 hover:bg-amber-500/10" },
            { text: "Compilation error", icon: Code2, color: "border-red-500/30 text-red-400 hover:bg-red-500/10" },
            { text: "Connection issue", icon: Unplug, color: "border-blue-500/30 text-blue-400 hover:bg-blue-500/10" },
            { text: "How to debug?", icon: Bug, color: "border-green-500/30 text-green-400 hover:bg-green-500/10" },
          ].map(({ text, icon: Icon, color }) => (
            <Button
              key={text}
              variant="outline"
              size="sm"
              className={`text-xs bg-transparent ${color}`}
              onClick={() => setInput(text)}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {text}
            </Button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-6">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Describe your issue or ask a question..."
              className="flex-1 bg-background text-foreground transition-shadow duration-200 focus-visible:shadow-[0_0_0_3px_rgba(244,114,82,0.15)] focus-visible:border-orange-500/40"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600 disabled:opacity-50 border-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {onComplete && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {"All issues resolved? Mark this project as complete!"}
              </p>
              <Button
                onClick={onComplete}
                variant="outline"
                className="bg-success/10 text-success border-success/30 hover:bg-success/20"
              >
                Mark as Complete
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
