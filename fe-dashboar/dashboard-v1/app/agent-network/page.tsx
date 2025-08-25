"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, MapPin, Users, Truck, ShoppingCart, Wheat } from "lucide-react"

export default function FarmerBuyerNetworkPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [userTypeFilter, setUserTypeFilter] = useState("all")

  const users = [
    {
      id: "F-078W",
      name: "Green Valley Farms",
      type: "farmer",
      location: "Iowa, USA",
      lastActive: "2 min ago",
      trades: 47,
      rating: 4.8,
      products: ["Corn", "Soybeans"],
    },
    {
      id: "B-079X",
      name: "Fresh Market Co",
      type: "buyer",
      location: "Chicago, IL",
      lastActive: "15 min ago",
      trades: 32,
      rating: 4.5,
      products: ["Vegetables", "Grains"],
    },
    {
      id: "F-080Y",
      name: "Sunrise Orchards",
      type: "farmer",
      location: "California, USA",
      lastActive: "1 min ago",
      trades: 63,
      rating: 4.9,
      products: ["Apples", "Citrus"],
    },
    {
      id: "T-081Z",
      name: "Swift Transport LLC",
      type: "transporter",
      location: "Texas, USA",
      lastActive: "3 hours ago",
      trades: 28,
      rating: 4.2,
      products: ["Refrigerated", "Bulk"],
    },
    {
      id: "B-082A",
      name: "Global Food Distributors",
      type: "buyer",
      location: "New York, NY",
      lastActive: "5 min ago",
      trades: 41,
      rating: 4.6,
      products: ["Organic", "Processed"],
    },
    {
      id: "F-083B",
      name: "Prairie Wheat Co",
      type: "farmer",
      location: "Kansas, USA",
      lastActive: "1 day ago",
      trades: 12,
      rating: 4.3,
      products: ["Wheat", "Barley"],
    },
    {
      id: "B-084C",
      name: "Restaurant Supply Chain",
      type: "buyer",
      location: "Los Angeles, CA",
      lastActive: "8 min ago",
      trades: 55,
      rating: 4.7,
      products: ["Fresh Produce", "Dairy"],
    },
    {
      id: "T-085D",
      name: "AgriLogistics Pro",
      type: "transporter",
      location: "Florida, USA",
      lastActive: "22 min ago",
      trades: 38,
      rating: 4.4,
      products: ["Temperature Controlled", "Express"],
    },
  ]

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.location.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = userTypeFilter === "all" || user.type === userTypeFilter

    return matchesSearch && matchesType
  })

  const getUserTypeIcon = (type) => {
    switch (type) {
      case "farmer":
        return <Wheat className="w-4 h-4 text-green-500" />
      case "buyer":
        return <ShoppingCart className="w-4 h-4 text-blue-500" />
      case "transporter":
        return <Truck className="w-4 h-4 text-orange-500" />
      default:
        return <Users className="w-4 h-4 text-neutral-400" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">NETWORK</h1>
          <p className="text-sm text-neutral-400">Manage farmers, buyers, and transporters</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-green-600 hover:bg-green-700 text-white">Add User</Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-2 md:p-3">
            <div className="relative">
              <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 w-3 md:w-4 h-3 md:h-4 text-neutral-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 md:pl-10 text-xs md:text-sm bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-2 md:p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">FARMERS</p>
                <p className="text-sm md:text-2xl font-bold text-white font-mono">247</p>
              </div>
              <Users className="w-4 md:w-8 h-4 md:h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-2 md:p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">BUYERS</p>
                <p className="text-sm md:text-2xl font-bold text-blue-500 font-mono">183</p>
              </div>
              <Users className="w-4 md:w-8 h-4 md:h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-2 md:p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TRANSPORT</p>
                <p className="text-sm md:text-2xl font-bold text-orange-500 font-mono">45</p>
              </div>
              <Users className="w-4 md:w-8 h-4 md:h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">NETWORK DIRECTORY</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">TYPE</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">NAME</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">LOCATION</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">TRADES</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">RATING</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer ${
                      index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="py-3 px-4">{getUserTypeIcon(user.type)}</td>
                    <td className="py-3 px-4 text-sm text-white">{user.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        <span className="text-sm text-neutral-300">{user.location}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-white font-mono">{user.trades}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-white font-mono">{user.rating}</span>
                        <span className="text-xs text-neutral-400">★</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white tracking-wider">{selectedUser.name}</CardTitle>
                <p className="text-sm text-neutral-400 font-mono">{selectedUser.id}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedUser(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">TYPE</p>
                  <div className="flex items-center gap-2">
                    {getUserTypeIcon(selectedUser.type)}
                    <span className="text-sm text-white uppercase tracking-wider">{selectedUser.type}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">LOCATION</p>
                  <p className="text-sm text-white">{selectedUser.location}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">COMPLETED TRADES</p>
                  <p className="text-sm text-white font-mono">{selectedUser.trades}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">RATING</p>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-white font-mono">{selectedUser.rating}</span>
                    <span className="text-xs text-neutral-400">★</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">PRODUCTS/SERVICES</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedUser.products.map((product, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-neutral-800 text-neutral-300 rounded">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="bg-green-600 hover:bg-green-700 text-white">Create Order</Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  View History
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
