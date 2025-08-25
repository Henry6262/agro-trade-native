"use client"

import { motion } from "framer-motion"
import { Check, ChevronDown } from "lucide-react"
import type { OnboardingStep } from "../types"

interface ProgressSidebarProps {
  steps: OnboardingStep[]
  currentStepIndex: number
  progressLineHeight: number
  isAnimating: boolean
}

export function ProgressSidebar({ steps, currentStepIndex, progressLineHeight, isAnimating }: ProgressSidebarProps) {
  return (
    <div className="w-20 lg:w-32 xl:w-40 bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 flex flex-col items-center py-8 relative">
      {/* Progress Line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-14 bottom-14 w-0.5 lg:w-1 bg-slate-200">
        <motion.div
          className="w-full bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 rounded-full relative shadow-sm"
          animate={{
            height: `${progressLineHeight}%`,
          }}
          transition={{
            duration: 1.2,
            ease: [0.25, 0.46, 0.45, 0.94],
            type: "tween",
          }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-emerald-300 to-emerald-500 rounded-full blur-sm opacity-60"
            animate={{
              height: `${progressLineHeight}%`,
            }}
            transition={{
              duration: 1.2,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: 0.1,
            }}
          />
          {isAnimating && (
            <motion.div
              className="absolute w-2 h-2 lg:w-3 lg:h-3 bg-white rounded-full shadow-lg -left-0.75 lg:-left-1 opacity-90"
              initial={{ top: `${((currentStepIndex - 1) / (steps.length - 1)) * 100}%` }}
              animate={{
                top: `${progressLineHeight}%`,
                scale: [1, 1.5, 1],
                opacity: [0.9, 1, 0.9],
              }}
              transition={{
                duration: 1.2,
                ease: [0.25, 0.46, 0.45, 0.94],
                scale: { duration: 0.6, repeat: 2 },
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Progress Steps */}
      <div className="relative z-10 space-y-6 lg:space-y-10 xl:space-y-12">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            className="flex flex-col items-center space-y-1 lg:space-y-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <motion.div
              className={`${
                step.id === "market" ? "w-8 h-8 lg:w-10 lg:h-10 rounded-full" : "w-8 h-8 lg:w-10 lg:h-10"
              } flex items-center justify-center text-xs lg:text-sm font-semibold relative ${
                index < currentStepIndex
                  ? step.id === "market"
                    ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg"
                    : "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg"
                  : index === currentStepIndex
                    ? step.id === "market"
                      ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-200"
                      : "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-200"
                    : step.id === "market"
                      ? "bg-white border-2 border-slate-200 text-slate-400"
                      : "bg-white border-2 border-slate-200 text-slate-400"
              }`}
              style={
                step.id !== "market"
                  ? {
                      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                    }
                  : {}
              }
              animate={
                index === currentStepIndex
                  ? {
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        "0 4px 20px rgba(59, 130, 246, 0.3)",
                        "0 8px 30px rgba(59, 130, 246, 0.5)",
                        "0 4px 20px rgba(59, 130, 246, 0.3)",
                      ],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              {index < currentStepIndex ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Check className="w-4 h-4 lg:w-5 lg:h-5" />
                </motion.div>
              ) : step.id !== "market" ? (
                <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5" />
              ) : (
                <span>{index + 1}</span>
              )}

              {/* Sparkle effects for completed steps */}
              {index < currentStepIndex && (
                <>
                  {[...Array(3)].map((_, sparkleIndex) => (
                    <motion.div
                      key={sparkleIndex}
                      className="absolute w-1 h-1 bg-emerald-300 rounded-full"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        x: [0, Math.random() * 20 - 10],
                        y: [0, Math.random() * 20 - 10],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: sparkleIndex * 0.3,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </>
              )}

              {/* Pulse ring for current step */}
              {index === currentStepIndex && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-blue-300"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.8, 0, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
              )}
            </motion.div>

            <div className="text-center">
              <div className="text-xs lg:text-sm font-medium text-slate-600">{step.title}</div>
              <div className="text-xs text-slate-400 hidden lg:block">{step.description}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Percentage */}
      <motion.div
        className="absolute bottom-4 text-xs lg:text-sm font-semibold text-slate-600 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full border border-slate-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.5,
          scale: { duration: 0.8, ease: "easeInOut" },
        }}
      >
        {Math.round(progressLineHeight)}%
      </motion.div>
    </div>
  )
}
