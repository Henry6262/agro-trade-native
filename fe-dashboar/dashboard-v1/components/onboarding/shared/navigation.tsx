"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface NavigationProps {
  onBack: () => void
  onNext: () => void
  canGoBack: boolean
  canGoNext: boolean
  nextLabel?: string
  isLoading?: boolean
}

export function Navigation({
  onBack,
  onNext,
  canGoBack,
  canGoNext,
  nextLabel = "Continue",
  isLoading = false,
}: NavigationProps) {
  return (
    <div className="flex justify-between items-center pt-8 border-t border-neutral-700">
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={!canGoBack}
        className="text-neutral-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <Button
        onClick={onNext}
        disabled={!canGoNext || isLoading}
        className="bg-green-500 hover:bg-green-600 text-white"
      >
        {nextLabel}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )
}