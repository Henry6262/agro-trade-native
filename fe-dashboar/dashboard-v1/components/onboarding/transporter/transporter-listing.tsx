"use client"

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
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
          <Package className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-white">Ready to Transport</h1>
        <p className="text-neutral-400 max-w-2xl mx-auto">
          Your transportation profile is ready! Review your details and create your listing to start connecting with
          buyers and sellers.
        </p>
      </div>

      {/* Fleet Summary */}
      <Card className="p-6 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Fleet Overview</h3>
              <p className="text-neutral-400">
                {transporterFleet.length} trucks • {transporterTotalCapacity} tons capacity
              </p>
            </div>
          </div>
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">{transporterFleet.length} Vehicles</Badge>
        </div>
      </Card>

      {/* Location Summary */}
      <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Service Area</h3>
              <p className="text-neutral-400">
                {transporterLocation.city}, {transporterLocation.state}, {transporterLocation.country}
              </p>
            </div>
          </div>
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Base Location</Badge>
        </div>
      </Card>

      {/* Market Insights */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 text-center bg-neutral-700 border-neutral-600">
          <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-white">2,400+</div>
          <div className="text-sm text-neutral-400">Active Shippers</div>
        </Card>

        <Card className="p-6 text-center bg-neutral-700 border-neutral-600">
          <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">850+</div>
          <div className="text-sm text-neutral-400">Weekly Shipments</div>
        </Card>

        <Card className="p-6 text-center bg-neutral-700 border-neutral-600">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-white">₹2,500</div>
          <div className="text-sm text-neutral-400">Avg. Daily Earnings</div>
        </Card>
      </div>

      {/* Create Listing Button */}
      <div className="text-center pt-8">
        <Button
          onClick={handleCreateListing}
          size="lg"
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-12 py-4 text-lg font-semibold shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-200"
        >
          Create Transportation Listing
        </Button>
        <p className="text-sm text-neutral-400 mt-3">
          Sign in with Google to complete your profile and start receiving transport requests
        </p>
      </div>
    </div>
  )
}