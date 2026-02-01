'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trophy, Download, Share2, Home } from 'lucide-react'

interface CompletionModalProps {
  projectName: string
  onClose: () => void
}

export function CompletionModal({ projectName, onClose }: CompletionModalProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 bg-card border-primary/50 shadow-2xl shadow-primary/20 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-6">
          {/* Trophy Icon */}
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center animate-bounce">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              Congratulations!
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {"You've successfully completed the"}
            </p>
            <p className="text-xl font-semibold text-primary">
              {projectName}
            </p>
          </div>

          {/* Achievement Stats */}
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">5</div>
              <div className="text-xs text-muted-foreground">Steps Completed</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-accent">1</div>
              <div className="text-xs text-muted-foreground">Project Built</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-success">100%</div>
              <div className="text-xs text-muted-foreground">Progress</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full bg-background text-foreground">
                <Download className="h-4 w-4 mr-2" />
                Download Code
              </Button>
              <Button variant="outline" className="w-full bg-background text-foreground">
                <Share2 className="h-4 w-4 mr-2" />
                Share Project
              </Button>
            </div>
            <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <a href="/">
                <Home className="h-4 w-4 mr-2" />
                Start New Project
              </a>
            </Button>
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="w-full text-muted-foreground"
            >
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
