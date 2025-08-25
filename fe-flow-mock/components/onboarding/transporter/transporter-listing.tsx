"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, MapPin, Package, Users, TrendingUp } from "lucide-react"
import { useOnboardingStore } from "@/stores/onboarding-store"

export function TransporterListing() {
  const { transporterFleet, transporterLocation, transporterTotalCapacity } = useOnboardingStore()

  const handleCreateListing = () => {
    // This will trigger Google sign-in flow
    console.log("Creating transporter listing...")
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <Package className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Ready to Transport</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Your transportation profile is ready! Review your details and create your listing to start connecting with
          buyers and sellers.
        </p>
      </motion.div>

      {/* Fleet Summary */}
      <Card className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Fleet Overview</h3>
              <p className="text-slate-600">
                {transporterFleet.length} trucks • {transporterTotalCapacity} tons capacity
              </p>
            </div>
          </div>
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">{transporterFleet.length} Vehicles</Badge>
        </div>
      </Card>

      {/* Location Summary */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Service Area</h3>
              <p className="text-slate-600">
                {transporterLocation.city}, {transporterLocation.state}, {transporterLocation.country}
              </p>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">Base Location</Badge>
        </div>
      </Card>

      {/* Market Insights */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">2,400+</div>
          <div className="text-sm text-slate-600">Active Shippers</div>
        </Card>

        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">850+</div>
          <div className="text-sm text-slate-600">Weekly Shipments</div>
        </Card>

        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">₹2,500</div>
          <div className="text-sm text-slate-600">Avg. Daily Earnings</div>
        </Card>
      </div>

      {/* Create Listing Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center pt-8"
      >
        <Button
          onClick={handleCreateListing}
          size="lg"
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-12 py-4 text-lg font-semibold shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-200/60 transition-all duration-200"
        >
          Create Transportation Listing
        </Button>
        <p className="text-sm text-slate-500 mt-3">
          Sign in with Google to complete your profile and start receiving transport requests
        </p>
      </motion.div>
    </div>
  )
}
