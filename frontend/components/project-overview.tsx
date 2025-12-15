'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Lightbulb, Target, Layers, ChevronRight, Loader2 } from 'lucide-react'
import { fetchProjectDetails } from '@/lib/api'
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface ProjectOverviewProps {
  projectName: string
  onComplete?: () => void
}

export function ProjectOverview({ projectName, onComplete }: ProjectOverviewProps) {
  const [description, setDescription] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const loadDescription = async () => {
      try {
        setLoading(true)
        const data = await fetchProjectDetails(projectName)
        setDescription(data.description_agent_output || 'Project details not available')
      } catch (err) {
        console.error('Failed to load project details:', err)
        setError('Failed to load project details')
        setDescription('Project details not available at this time')
      } finally {
        setLoading(false)
      }
    }
    loadDescription()
  }, [projectName])

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading project overview...</span>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center">
            <Lightbulb className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Project Overview</h2>
            <p className="text-muted-foreground">Understand your {projectName} project</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Description Card */}
        <Card className="p-6">
          <div className="flex gap-3 mb-4">
            <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <h3 className="text-lg font-semibold text-foreground">Project Description</h3>
          </div>
          <div className="prose prose-zinc dark:prose-invert max-w-none">
             <MarkdownRenderer content={description} />
          </div>
        </Card>


      </div>

      {/* Footer */}
      <div className="border-t border-border p-6 flex justify-between">
        <div className="text-sm text-muted-foreground">
          Step 1 of 5: Project Overview
        </div>
        {onComplete && (
          <Button
            variant="outline"
            size="lg"
            onClick={onComplete}
            className="gap-2"
          >
            Next: Wiring
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}