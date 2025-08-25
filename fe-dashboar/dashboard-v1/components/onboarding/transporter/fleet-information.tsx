"use client"

import { useState } from "react"
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
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
          <Truck className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-white">Fleet Information</h1>
        <p className="text-neutral-400 max-w-2xl mx-auto">
          Tell us about your transportation fleet. Add details about each truck including capacity to help buyers find
          the right transporter.
        </p>
      </div>

      {/* Fleet Summary */}
      {transporterFleet.length > 0 && (
        <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Fleet Summary</h3>
              <p className="text-neutral-400">Total capacity across all vehicles</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-500">{transporterTotalCapacity}</div>
              <div className="text-sm text-neutral-400">tons total capacity</div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Truck */}
      <Card className="p-6 border-2 border-dashed border-neutral-700 hover:border-green-500/50 transition-colors bg-neutral-800">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-500" />
            Add Truck to Fleet
          </h3>

          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Capacity (e.g., 10)"
                value={newTruck.capacity}
                onChange={(e) => setNewTruck({ ...newTruck, capacity: e.target.value })}
                className="text-lg bg-neutral-700 border-neutral-600 text-white placeholder:text-neutral-400"
              />
            </div>
            <select
              value={newTruck.unit}
              onChange={(e) => setNewTruck({ ...newTruck, unit: e.target.value as "tons" | "kg" })}
              className="px-4 py-2 border border-neutral-600 rounded-lg bg-neutral-700 text-white"
            >
              <option value="tons">Tons</option>
              <option value="kg">Kg</option>
            </select>
            <Button
              onClick={handleAddTruck}
              disabled={!newTruck.capacity || Number.parseFloat(newTruck.capacity) <= 0}
              className="bg-green-500 hover:bg-green-600 text-white px-6"
            >
              Add Truck
            </Button>
          </div>
        </div>
      </Card>

      {/* Fleet List */}
      {transporterFleet.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Your Fleet ({transporterFleet.length} trucks)</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {transporterFleet.map((truck, index) => (
              <Card key={truck.id} className="p-4 bg-neutral-700 border-neutral-600 hover:border-green-500/50 transition-all duration-200 hover:shadow-lg group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <Truck className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Truck {index + 1}</div>
                      <Badge variant="secondary" className="text-xs bg-neutral-600 text-neutral-300 border-neutral-500">
                        {truck.capacity} {truck.unit}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTruck(truck.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {transporterFleet.length === 0 && (
        <div className="text-center py-12 text-neutral-400">
          <Truck className="w-16 h-16 mx-auto mb-4 text-neutral-600" />
          <p>No trucks added yet. Add your first truck to get started.</p>
        </div>
      )}
    </div>
  )
}