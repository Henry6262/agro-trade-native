"use client"

import { useState } from "react"
import { SellerOnboarding } from "./seller/seller-onboarding"
import { BuyerOnboarding } from "./buyer/buyer-onboarding"
import { TransporterOnboarding } from "./transporter/transporter-onboarding"
import { Wheat, ShoppingCart, Truck } from "lucide-react"

type UserRole = "seller" | "buyer" | "transporter"

export function OnboardingFlow() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to AgraTrade</h1>
            <p className="text-neutral-400">Choose your role to get started</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setSelectedRole("seller")}
              className="w-full p-6 bg-neutral-800 rounded-xl border-2 border-neutral-700 hover:border-green-500 hover:bg-neutral-800/50 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <Wheat className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">I'm a Seller</h3>
                  <p className="text-sm text-neutral-400">I want to sell agricultural products</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole("buyer")}
              className="w-full p-6 bg-neutral-800 rounded-xl border-2 border-neutral-700 hover:border-blue-500 hover:bg-neutral-800/50 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <ShoppingCart className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">I'm a Buyer</h3>
                  <p className="text-sm text-neutral-400">I want to buy agricultural products</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole("transporter")}
              className="w-full p-6 bg-neutral-800 rounded-xl border-2 border-neutral-700 hover:border-orange-500 hover:bg-neutral-800/50 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                  <Truck className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">I'm a Transporter</h3>
                  <p className="text-sm text-neutral-400">I provide transportation services</p>
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