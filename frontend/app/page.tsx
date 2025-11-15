'use client'

import React, { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Search, Cpu, Zap } from 'lucide-react'
import Loading from './loading'
import { fetchProjectName } from '@/lib/api'

export default function HomePage() {
  const [projectName, setProjectName] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim()) return

    setIsValidating(true)
    setError('')

    try {
      const response = await fetchProjectName(projectName)
      const identifiedName = response.project_name
      router.push(`/project/${encodeURIComponent(identifiedName)}`)
    } catch (error) {
      console.error('Error:', error)
      setError('Error processing project. Please try again.')
      setIsValidating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Cpu className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">EmbedAI Learn</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Projects
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Community
            </a>
          </nav>
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              AI-Powered Learning
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight text-balance">
              Build Arduino & ESP Projects with{' '}
              <span className="text-primary">AI Guidance</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto text-balance">
              From concept to code to circuit. Get personalized roadmaps, wiring diagrams, and instant troubleshooting for your embedded systems projects.
            </p>
          </div>

          {/* Project Search Card */}
          <Suspense fallback={<Loading />}>
            <Card className="p-6 bg-card border-border shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="projectName" className="text-sm font-medium text-foreground">
                    Enter Project Description
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="projectName"
                      type="text"
                      placeholder="e.g., Smart Home Automation, Weather Station, Blinking LED..."
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="pl-10 h-12 bg-background text-foreground"
                      disabled={isValidating}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isValidating || !projectName.trim()}
                >
                  {isValidating ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Identifying Project...
                    </span>
                  ) : (
                    'Start Learning'
                  )}
                </Button>
              </form>
            </Card>
          </Suspense>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-4 pt-8">
            <Card className="p-4 bg-card/50 border-border hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Interactive Roadmap</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Step-by-step guidance from concept to working prototype
              </p>
            </Card>
            <Card className="p-4 bg-card/50 border-border hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                <Cpu className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Visual Wiring</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Clear pin mappings and connection diagrams for every component
              </p>
            </Card>
            <Card className="p-4 bg-card/50 border-border hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center mb-3">
                <Search className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">AI Troubleshooting</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Context-aware debugging for compile errors and hardware issues
              </p>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          Built for makers and learners. Powered by AI.
        </div>
      </footer>
    </div>
  )
}
