"use client"

import { useState, useEffect } from "react"
import {
  ChevronRight,
  BarChart3,
  Users,
  Package,
  TrendingUp,
  Bell,
  RefreshCw,
  Wheat,
  ShoppingCart,
  Truck,
  UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import CommandCenterPage from "./command-center/page"
import FarmerBuyerNetworkPage from "./agent-network/page"
import TradeOperationsPage from "./operations/page"
import MarketIntelligencePage from "./intelligence/page"
import SellerDashboard from "./seller/page"
import TransporterDashboard from "./transporter/page"
import BuyerDashboard from "./buyer/page"

export default function AgriculturalTradeDashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userRole, setUserRole] = useState("admin")
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false)

  const getNavigationItems = () => {
    if (userRole === "seller") {
      return [
        { id: "products", icon: Wheat, label: "MY PRODUCTS" },
        { id: "trades", icon: Package, label: "MY TRADES" },
        { id: "intelligence", icon: TrendingUp, label: "MARKET INTEL" },
      ]
    }
    if (userRole === "buyer") {
      return [
        { id: "orders", icon: ShoppingCart, label: "MY ORDERS" },
        { id: "requests", icon: Package, label: "MY REQUESTS" },
        { id: "intelligence", icon: TrendingUp, label: "MARKET INTEL" },
      ]
    }
    if (userRole === "transporter") {
      return [
        { id: "bidding", icon: Package, label: "BIDDING" },
        { id: "transfers", icon: Truck, label: "MY TRANSFERS" },
        { id: "fleet", icon: Users, label: "MY FLEET" },
        { id: "intelligence", icon: TrendingUp, label: "MARKET INTEL" },
      ]
    }
    // Admin navigation (default)
    return [
      { id: "overview", icon: BarChart3, label: "ORDER CENTER" },
      { id: "agents", icon: Users, label: "NETWORK" },
      { id: "operations", icon: Package, label: "TRADE OPS" },
      { id: "intelligence", icon: TrendingUp, label: "MARKET INTEL" },
    ]
  }

  const navigationItems = getNavigationItems()

  const handleRoleChange = (newRole: string) => {
    setUserRole(newRole)
    if (newRole === "seller") {
      setActiveSection("products")
    } else if (newRole === "buyer") {
      setActiveSection("orders")
    } else if (newRole === "transporter") {
      setActiveSection("bidding")
    } else {
      setActiveSection("overview")
    }
  }

  const renderContent = () => {
    if (userRole === "seller") {
      if (activeSection === "intelligence") {
        return <MarketIntelligencePage />
      }
      return <SellerDashboard activeTab={activeSection} />
    }
    if (userRole === "buyer") {
      if (activeSection === "intelligence") {
        return <MarketIntelligencePage />
      }
      return <BuyerDashboard activeTab={activeSection} />
    }
    if (userRole === "transporter") {
      if (activeSection === "intelligence") {
        return <MarketIntelligencePage />
      }
      return <TransporterDashboard activeTab={activeSection} />
    }
    // Admin content
    if (activeSection === "overview") return <CommandCenterPage />
    if (activeSection === "agents") return <FarmerBuyerNetworkPage />
    if (activeSection === "operations") return <TradeOperationsPage />
    if (activeSection === "intelligence") return <MarketIntelligencePage />
  }

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-70"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? "hidden md:block" : "hidden md:block"}`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <h1 className="text-green-500 font-bold text-lg tracking-wider">AGRI TRADE</h1>
              <p className="text-neutral-500 text-xs">v1.0.0 PLATFORM</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-neutral-400 hover:text-green-500"
            >
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                  activeSection === item.id
                    ? "bg-green-500 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <item.icon className="w-5 h-5 md:w-5 md:h-5 sm:w-6 sm:h-6" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-white">PLATFORM ONLINE</span>
              </div>
              <div className="text-xs text-neutral-500">
                <div>UPTIME: 99.8%</div>
                <div>ACTIVE TRADES: 47</div>
                <div>MATCHES TODAY: 12</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Select value={userRole} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-32 h-8 bg-neutral-700 border-neutral-600 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="admin" className="text-xs">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Admin
                  </div>
                </SelectItem>
                <SelectItem value="seller" className="text-xs">
                  <div className="flex items-center gap-2">
                    <Wheat className="w-3 h-3" />
                    Seller
                  </div>
                </SelectItem>
                <SelectItem value="buyer" className="text-xs">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-3 h-3" />
                    Buyer
                  </div>
                </SelectItem>
                <SelectItem value="transporter" className="text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className="w-3 h-3" />
                    Transporter
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => window.location.href = "/onboarding"}
              variant="outline"
              size="sm"
              className="text-green-500 border-green-500 hover:bg-green-500 hover:text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Start Onboarding
            </Button>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-green-500">
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto pb-20 md:pb-0">{renderContent()}</div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-700 md:hidden z-50">
        <div className={`grid h-16 ${userRole === "transporter" ? "grid-cols-4" : "grid-cols-3"}`}>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
                activeSection === item.id
                  ? "bg-green-500 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
