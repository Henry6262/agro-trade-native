"use client"

import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import { useOnboardingStore } from "@/stores/onboarding-store"

export function LocationInformation() {
  const { transporterLocation, setTransporterLocation } = useOnboardingStore()

  const handleLocationChange = (field: string, value: string) => {
    setTransporterLocation({
      ...transporterLocation,
      [field]: value,
    })
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
          <MapPin className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-white">Location Information</h1>
        <p className="text-neutral-400 max-w-2xl mx-auto">
          Where is your transportation business based? This helps buyers find transporters in their area.
        </p>
      </div>

      <Card className="p-8 max-w-2xl mx-auto bg-neutral-700 border-neutral-600">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">City</label>
            <Input
              type="text"
              placeholder="Enter your city"
              value={transporterLocation.city}
              onChange={(e) => handleLocationChange("city", e.target.value)}
              className="text-lg bg-neutral-600 border-neutral-500 text-white placeholder:text-neutral-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">State/Province</label>
            <Input
              type="text"
              placeholder="Enter your state or province"
              value={transporterLocation.state}
              onChange={(e) => handleLocationChange("state", e.target.value)}
              className="text-lg bg-neutral-600 border-neutral-500 text-white placeholder:text-neutral-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Country</label>
            <Input
              type="text"
              placeholder="Enter your country"
              value={transporterLocation.country}
              onChange={(e) => handleLocationChange("country", e.target.value)}
              className="text-lg bg-neutral-600 border-neutral-500 text-white placeholder:text-neutral-400"
            />
          </div>

          {transporterLocation.city && transporterLocation.state && transporterLocation.country && (
            <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">
                  {transporterLocation.city}, {transporterLocation.state}, {transporterLocation.country}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}