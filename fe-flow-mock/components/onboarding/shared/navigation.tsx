"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"

interface NavigationProps {
  currentStepIndex: number
  totalSteps: number
  canProceedToNext: boolean
  isAnimating: boolean
  onBack: () => void
  onNext: () => void
}

export function Navigation({
  currentStepIndex,
  totalSteps,
  canProceedToNext,
  isAnimating,
  onBack,
  onNext,
}: NavigationProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50 p-4 lg:p-6 border-t border-slate-200/50 bg-white/95 backdrop-blur-md shadow-lg"
    >
      <div className="flex justify-between max-w-md lg:max-w-6xl xl:max-w-7xl mx-auto">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={currentStepIndex === 0 || isAnimating}
          className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white/90 hover:border-slate-300 disabled:opacity-50 lg:px-6 lg:py-3 lg:text-base shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" />
          <span>Back</span>
        </Button>

        <Button
          onClick={onNext}
          disabled={!canProceedToNext || currentStepIndex === totalSteps - 1 || isAnimating}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200/50 disabled:opacity-50 lg:px-6 lg:py-3 lg:text-base transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-xl hover:shadow-emerald-200/60"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" />
        </Button>
      </div>
    </motion.div>
  )
}
