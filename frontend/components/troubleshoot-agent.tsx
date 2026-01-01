'use client'

import React, { useState } from "react"
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, Bot, User } from 'lucide-react'
import { sendTroubleshootQuery } from '@/lib/api'
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface TroubleshootAgentProps {
  projectName: string
  onComplete?: () => void
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function TroubleshootAgent({ projectName, onComplete }: TroubleshootAgentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI troubleshooting assistant for the ${projectName} project. I have full context of your wiring, code, and any compilation errors. How can I help you today?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const data = await sendTroubleshootQuery(input, projectName)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Unable to get response',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">AI Troubleshooting</h2>
            <p className="text-muted-foreground leading-relaxed">
              Get instant help with errors, wiring issues, and code problems
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
            )}
            <Card
              className={`max-w-[80%] p-4 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border'
              }`}
            >


              <div className={`text-sm leading-relaxed ${message.role === 'user' ? 'whitespace-pre-wrap' : ''}`}>
                  {message.role === 'user' ? (
                      message.content
                  ) : (
                      <MarkdownRenderer content={message.content} />
                  )}
              </div>
              <p
                className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </Card>
            {message.role === 'user' && (
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
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '-0.3s' }} />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '-0.15s' }} />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-border px-6 py-3 bg-muted/30">
        <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
        <div className="flex flex-wrap gap-2">
          {[
            'Sensor not reading',
            'Compilation error',
            'Connection issue',
            'How to debug?',
          ].map((question) => (
            <Button
              key={question}
              variant="outline"
              size="sm"
              className="text-xs bg-transparent"
              onClick={() => setInput(question)}
            >
              {question}
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
              onKeyPress={handleKeyPress}
              placeholder="Describe your issue or ask a question..."
              className="flex-1 bg-background text-foreground"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
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
  )
}
