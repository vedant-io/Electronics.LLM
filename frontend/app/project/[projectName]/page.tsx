'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ModuleViewer } from '@/components/module-viewer'
import { Card } from '@/components/ui/card'
import { RoadmapNode } from '@/components/roadmap-node'
import { ProjectOverview } from '@/components/project-overview'
import { WiringAgent } from '@/components/wiring-agent'
import { CodeAgent } from '@/components/code-agent'
import { CompileAgent } from '@/components/compile-agent'
import { TroubleshootAgent } from '@/components/troubleshoot-agent'
import { CompletionModal } from '@/components/completion-modal'
import { 
  ArrowLeft, 
  BookOpen, 
  Cable, 
  Code2, 
  Zap, 
  MessageSquare,
  Cpu
} from 'lucide-react'
import { fetchProjectDetails } from '@/lib/api'

type RoadmapStep = 'basics' | 'overview' | 'wiring' | 'code' | 'flash' | 'troubleshoot'

interface StepStatus {
  basics: 'completed' | 'active' | 'locked'
  overview: 'completed' | 'active' | 'locked'
  wiring: 'completed' | 'active' | 'locked'
  code: 'completed' | 'active' | 'locked'
  flash: 'completed' | 'active' | 'locked'
  troubleshoot: 'completed' | 'active' | 'locked'
}

export default function ProjectPage() {
  const params = useParams()
  const projectName = decodeURIComponent(params.projectName as string)
  const [activeStep, setActiveStep] = useState<RoadmapStep>('basics')
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [stepStatus, setStepStatus] = useState<StepStatus>({
    basics: 'active',
    overview: 'locked',
    wiring: 'locked',
    code: 'locked',
    flash: 'locked',
    troubleshoot: 'locked',
  })

  const handleStepComplete = (step: RoadmapStep) => {
    const stepOrder: RoadmapStep[] = ['basics', 'overview', 'wiring', 'code', 'flash', 'troubleshoot']
    const currentIndex = stepOrder.indexOf(step)
    const nextStep = stepOrder[currentIndex + 1]

    setStepStatus((prev) => ({
      ...prev,
      [step]: 'completed',
      ...(nextStep && { [nextStep]: 'active' }),
    }))

    if (nextStep) {
      setActiveStep(nextStep)
    } else {
      // All steps completed
      setTimeout(() => setShowCompletionModal(true), 500)
    }
  }

  const roadmapSteps = [
    {
      id: 'basics' as RoadmapStep,
      title: 'Beginner Basics',
      description: 'Learn the fundamental concepts before starting',
      icon: <BookOpen className="h-6 w-6" />,
    },
    {
      id: 'overview' as RoadmapStep,
      title: 'Project Overview',
      description: 'Understand the project concept, components, and working principle',
      icon: <Cpu className="h-6 w-6" />,
    },
    {
      id: 'wiring' as RoadmapStep,
      title: 'Wiring & Connections',
      description: 'Visual pin mappings and connection diagrams for all components',
      icon: <Cable className="h-6 w-6" />,
    },
    {
      id: 'code' as RoadmapStep,
      title: 'Code Generation',
      description: 'Review and customize the generated code for your project',
      icon: <Code2 className="h-6 w-6" />,
    },
    {
      id: 'flash' as RoadmapStep,
      title: 'Compile & Flash',
      description: 'Compile the code and flash it to your Arduino or ESP board',
      icon: <Zap className="h-6 w-6" />,
    },
    {
      id: 'troubleshoot' as RoadmapStep,
      title: 'Troubleshooting',
      description: 'AI-powered help for debugging and fixing issues',
      icon: <MessageSquare className="h-6 w-6" />,
    },
  ]

  const renderActiveAgent = () => {
    switch (activeStep) {
      case 'basics':
        return <ModuleViewer projectName={projectName} onComplete={() => handleStepComplete('basics')} />
      case 'overview':
        return <ProjectOverview projectName={projectName} onComplete={() => handleStepComplete('overview')} />
      case 'wiring':
        return <WiringAgent projectName={projectName} onComplete={() => handleStepComplete('wiring')} />
      case 'code':
        return <CodeAgent projectName={projectName} onCodeGenerated={setGeneratedCode} onComplete={() => handleStepComplete('code')} />
      case 'flash':
        return <CompileAgent projectName={projectName} code={generatedCode} onComplete={() => handleStepComplete('flash')} />
      case 'troubleshoot':
        return <TroubleshootAgent projectName={projectName} onComplete={() => handleStepComplete('troubleshoot')} />
      default:
        return null
    }
  }

  return (
    <>
      {showCompletionModal && (
        <CompletionModal 
          projectName={projectName} 
          onClose={() => setShowCompletionModal(false)} 
        />
      )}
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <a href="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </a>
                </Button>
                <div className="h-8 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary" />
                  <div>
                    <h1 className="text-sm font-semibold text-foreground">{projectName}</h1>
                    <p className="text-xs text-muted-foreground">Learning Roadmap</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Save Progress
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-[360px,1fr] gap-6 h-full">
            {/* Roadmap Sidebar */}
            <aside className="space-y-4">
              <Card className="p-4 bg-card border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-foreground">Learning Path</h2>
                  <div className="text-xs font-medium text-muted-foreground">
                    {Object.values(stepStatus).filter(s => s === 'completed').length} / {roadmapSteps.length}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500 ease-out"
                      style={{ 
                        width: `${(Object.values(stepStatus).filter(s => s === 'completed').length / roadmapSteps.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="relative space-y-3">
                  {roadmapSteps.map((step, index) => {
                    const isNextStepUnlocked = index < roadmapSteps.length - 1 && 
                      stepStatus[roadmapSteps[index + 1].id] !== 'locked'
                    
                    return (
                      <div key={step.id} className="relative">
                        <RoadmapNode
                          title={step.title}
                          description={step.description}
                          status={stepStatus[step.id]}
                          icon={step.icon}
                          isActive={activeStep === step.id}
                          onClick={() => stepStatus[step.id] !== 'locked' && setActiveStep(step.id)}
                        />
                        {index < roadmapSteps.length - 1 && (
                          <div className="absolute left-6 top-full h-3 flex items-center justify-center">
                            <div 
                              className={`w-0.5 h-full transition-all duration-500 ${
                                stepStatus[step.id] === 'completed' 
                                  ? 'bg-primary' 
                                  : 'bg-border'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card className="p-4 bg-card/50 border-border">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Quick Tips
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span className="leading-relaxed">Complete each step to unlock the next</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span className="leading-relaxed">Click any unlocked step to review it</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span className="leading-relaxed">Use troubleshooting for any issues</span>
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
      </div>
    </>
  )
}
