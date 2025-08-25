"use client"

import { Check } from "lucide-react"
import type { OnboardingStep } from "../types"

interface ProgressSidebarProps {
  steps: OnboardingStep[]
  currentStepIndex: number
  progressLineHeight: number
}

export function ProgressSidebar({ steps, currentStepIndex, progressLineHeight }: ProgressSidebarProps) {
  return (
    <div className="relative py-8">
      {/* Progress line background */}
      <div className="absolute left-6 top-12 bottom-12 w-0.5 bg-neutral-700"></div>
      
      {/* Animated progress line */}
      <div 
        className="absolute left-6 top-12 w-0.5 bg-green-500 transition-all duration-500 ease-out"
        style={{ height: `${progressLineHeight}%` }}
      ></div>

      {/* Steps */}
      <div className="space-y-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  index < currentStepIndex
                    ? "bg-green-500 text-white"
                    : index === currentStepIndex
                    ? "bg-neutral-800 border-2 border-green-500 text-green-500"
                    : "bg-neutral-800 border-2 border-neutral-700 text-neutral-500"
                }`}
              >
                {index < currentStepIndex ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
            </div>
            <div>
              <h3
                className={`font-semibold ${
                  index <= currentStepIndex ? "text-white" : "text-neutral-500"
                }`}
              >
                {step.title}
              </h3>
              <p className="text-sm text-neutral-500">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}