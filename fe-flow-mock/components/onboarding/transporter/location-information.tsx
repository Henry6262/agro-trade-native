"use client"

import { motion } from "framer-motion"
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <MapPin className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Location Information</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Where is your transportation business based? This helps buyers find transporters in their area.
        </p>
      </motion.div>

      <Card className="p-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
            <Input
              type="text"
              placeholder="Enter your city"
              value={transporterLocation.city}
              onChange={(e) => handleLocationChange("city", e.target.value)}
              className="text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">State/Province</label>
            <Input
              type="text"
              placeholder="Enter your state or province"
              value={transporterLocation.state}
              onChange={(e) => handleLocationChange("state", e.target.value)}
              className="text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
            <Input
              type="text"
              placeholder="Enter your country"
              value={transporterLocation.country}
              onChange={(e) => handleLocationChange("country", e.target.value)}
              className="text-lg"
            />
          </div>

          {transporterLocation.city && transporterLocation.state && transporterLocation.country && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 text-blue-800">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">
                  {transporterLocation.city}, {transporterLocation.state}, {transporterLocation.country}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  )
}
