"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { User, ShoppingCart, Truck, ChevronRight } from "lucide-react"
import type { UserRole } from "../types"

interface RoleSelectorProps {
  onRoleSelect: (role: UserRole) => void
}

export function RoleSelector({ onRoleSelect }: RoleSelectorProps) {
  const roles = [
    { role: "seller" as UserRole, icon: User, title: "Seller", desc: "I want to sell agricultural products" },
    { role: "buyer" as UserRole, icon: ShoppingCart, title: "Buyer", desc: "I want to buy agricultural products" },
    { role: "transporter" as UserRole, icon: Truck, title: "Transporter", desc: "I provide transportation services" },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md lg:max-w-lg space-y-6 lg:space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Welcome to AgraTrade</h1>
          <p className="text-muted-foreground lg:text-lg">Choose your role to get started</p>
        </div>

        <div className="space-y-3 lg:space-y-4">
          {roles.map(({ role, icon: Icon, title, desc }) => (
            <Card
              key={role}
              className="p-4 lg:p-6 cursor-pointer hover:shadow-md transition-all duration-200 hover:bg-muted/50"
              onClick={() => onRoleSelect(role)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold lg:text-lg">{title}</h3>
                  <p className="text-sm lg:text-base text-muted-foreground">{desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
