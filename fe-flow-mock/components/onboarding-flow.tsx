"use client"

import { useEffect } from "react"
import { useOnboardingStore } from "@/stores/onboarding-store"
import type { UserRole } from "./onboarding/types"
import { SellerOnboarding } from "./onboarding/seller/seller-onboarding"
import { BuyerOnboarding } from "./onboarding/buyer/buyer-onboarding"

export function OnboardingFlow() {
  const { userType, setUserType } = useOnboardingStore()

  useEffect(() => {
    if (!userType) {
      setUserType("seller")
    }
  }, [userType, setUserType])

  const handleComplete = () => {
    // Handle onboarding completion
    console.log("Onboarding completed for role:", userType)
  }

  const switchRole = (role: UserRole) => {
    setUserType(role)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => switchRole("seller")}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
            userType === "seller" ? "bg-emerald-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Seller
        </button>
        <button
          onClick={() => switchRole("buyer")}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
            userType === "buyer" ? "bg-blue-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Buyer
        </button>
      </div>

      {userType === "seller" && <SellerOnboarding onComplete={handleComplete} />}
      {userType === "buyer" && <BuyerOnboarding onComplete={handleComplete} />}
    </div>
  )
}
