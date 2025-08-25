"use client"

import { useState } from "react"
import { SellerOnboarding } from "./seller/seller-onboarding"
import { BuyerOnboarding } from "./buyer/buyer-onboarding"
import { TransporterOnboarding } from "./transporter/transporter-onboarding"

type UserRole = "seller" | "buyer" | "transporter"

export function OnboardingFlow() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to AgraTrade</h1>
            <p className="text-slate-600">Choose your role to get started</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setSelectedRole("seller")}
              className="w-full p-6 bg-white rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <span className="text-2xl">🌾</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">I'm a Seller</h3>
                  <p className="text-sm text-slate-600">I want to sell agricultural products</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole("buyer")}
              className="w-full p-6 bg-white rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <span className="text-2xl">🛒</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">I'm a Buyer</h3>
                  <p className="text-sm text-slate-600">I want to buy agricultural products</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole("transporter")}
              className="w-full p-6 bg-white rounded-xl border-2 border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <span className="text-2xl">🚛</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">I'm a Transporter</h3>
                  <p className="text-sm text-slate-600">I provide transportation services</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (selectedRole === "seller") {
    return <SellerOnboarding />
  }

  if (selectedRole === "buyer") {
    return <BuyerOnboarding />
  }

  if (selectedRole === "transporter") {
    return <TransporterOnboarding />
  }

  return null
}
