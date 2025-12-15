'use client';

import React from "react"

import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Lock } from 'lucide-react'

interface RoadmapNodeProps {
  title: string
  description: string
  status: 'completed' | 'active' | 'locked'
  icon: React.ReactNode
  isActive?: boolean
  onClick?: () => void
}

export function RoadmapNode({ title, description, status, icon, isActive = false, onClick }: RoadmapNodeProps) {
  const isClickable = status !== 'locked'

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={cn(
        'relative w-full p-4 rounded-xl border-2 transition-all duration-300 text-left',
        'hover:scale-[1.02] active:scale-[0.98]',
        status === 'completed' && 'bg-card border-primary/40 hover:border-primary/60',
        status === 'active' && !isActive && 'bg-card border-primary/50 hover:border-primary',
        status === 'active' && isActive && 'bg-card border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30',
        status === 'locked' && 'bg-card/50 border-border opacity-60 cursor-not-allowed hover:scale-100',
        isClickable && 'cursor-pointer'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon Container */}
        <div
          className={cn(
            'flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center transition-colors',
            status === 'completed' && 'bg-primary/20 text-primary',
            status === 'active' && 'bg-primary text-primary-foreground',
            status === 'locked' && 'bg-muted text-muted-foreground'
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={cn('font-semibold text-foreground', status === 'locked' && 'text-muted-foreground')}>
              {title}
            </h3>
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {status === 'completed' && <CheckCircle2 className="h-5 w-5 text-primary" />}
              {status === 'active' && <Circle className="h-5 w-5 text-primary fill-primary" />}
              {status === 'locked' && <Lock className="h-5 w-5 text-muted-foreground" />}
            </div>
          </div>
          <p
            className={cn(
              'text-sm leading-relaxed',
              status === 'locked' ? 'text-muted-foreground/70' : 'text-muted-foreground'
            )}
          >
            {description}
          </p>
        </div>
      </div>

      {/* Active Pulse Effect */}
      {status === 'active' && isActive && (
        <>
          <div className="absolute inset-0 rounded-xl border-2 border-primary animate-pulse opacity-50 pointer-events-none" />
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-ping" />
        </>
      )}
      
      {/* Unlock Animation */}
      {status === 'active' && !isActive && (
        <div className="absolute inset-0 rounded-xl border-2 border-primary/50 opacity-30 pointer-events-none animate-pulse" />
      )}
    </button>
  )
}
