"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Truck, Trash2 } from "lucide-react"
import { useOnboardingStore, type TruckInfo } from "@/stores/onboarding-store"

export function FleetInformation() {
  const { transporterFleet, transporterTotalCapacity, addTruck, removeTruck, updateTruck } = useOnboardingStore()
  const [newTruck, setNewTruck] = useState({ capacity: "", unit: "tons" as "tons" | "kg" })

  const handleAddTruck = () => {
    if (newTruck.capacity && Number.parseFloat(newTruck.capacity) > 0) {
      const truck: TruckInfo = {
        id: `truck-${Date.now()}`,
        capacity: Number.parseFloat(newTruck.capacity),
        unit: newTruck.unit,
      }
      addTruck(truck)
      setNewTruck({ capacity: "", unit: "tons" })
    }
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
          <Truck className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Fleet Information</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Tell us about your transportation fleet. Add details about each truck including capacity to help buyers find
          the right transporter.
        </p>
      </motion.div>

      {/* Fleet Summary */}
      {transporterFleet.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Fleet Summary</h3>
              <p className="text-slate-600">Total capacity across all vehicles</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">{transporterTotalCapacity}</div>
              <div className="text-sm text-slate-500">tons total capacity</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add New Truck */}
      <Card className="p-6 border-2 border-dashed border-slate-200 hover:border-orange-300 transition-colors">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-orange-600" />
            Add Truck to Fleet
          </h3>

          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Capacity (e.g., 10)"
                value={newTruck.capacity}
                onChange={(e) => setNewTruck({ ...newTruck, capacity: e.target.value })}
                className="text-lg"
              />
            </div>
            <select
              value={newTruck.unit}
              onChange={(e) => setNewTruck({ ...newTruck, unit: e.target.value as "tons" | "kg" })}
              className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900"
            >
              <option value="tons">Tons</option>
              <option value="kg">Kg</option>
            </select>
            <Button
              onClick={handleAddTruck}
              disabled={!newTruck.capacity || Number.parseFloat(newTruck.capacity) <= 0}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6"
            >
              Add Truck
            </Button>
          </div>
        </div>
      </Card>

      {/* Fleet List */}
      {transporterFleet.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Your Fleet ({transporterFleet.length} trucks)</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {transporterFleet.map((truck, index) => (
              <motion.div
                key={truck.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 bg-white/80 backdrop-blur-sm border border-slate-200 hover:border-orange-300 transition-all duration-200 hover:shadow-lg group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Truck className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Truck {index + 1}</div>
                        <Badge variant="secondary" className="text-xs">
                          {truck.capacity} {truck.unit}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTruck(truck.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {transporterFleet.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Truck className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p>No trucks added yet. Add your first truck to get started.</p>
        </div>
      )}
    </div>
  )
}
