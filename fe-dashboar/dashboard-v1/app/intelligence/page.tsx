"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Eye, Download, Filter, TrendingUp, BarChart3, AlertTriangle } from "lucide-react"

export default function MarketIntelligencePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReport, setSelectedReport] = useState(null)

  const reports = [
    {
      id: "MKT-2025-001",
      title: "CORN FUTURES PRICE ANALYSIS",
      category: "PRICE FORECAST",
      source: "MARKET DATA",
      region: "Midwest USA",
      date: "2025-06-17",
      status: "current",
      impact: "high",
      summary: "Detailed analysis of corn futures showing 15% price increase expected due to weather conditions",
      tags: ["corn", "futures", "weather", "pricing"],
      priceChange: "+12.5%",
      confidence: 85,
    },
    {
      id: "MKT-2025-002",
      title: "ORGANIC PRODUCE DEMAND SURGE",
      category: "DEMAND ANALYSIS",
      source: "CONSUMER DATA",
      region: "California",
      date: "2025-06-16",
      status: "trending",
      impact: "critical",
      summary: "Consumer demand for organic produce increased 28% quarter-over-quarter in major metropolitan areas",
      tags: ["organic", "demand", "consumer", "growth"],
      priceChange: "+28.3%",
      confidence: 92,
    },
    {
      id: "MKT-2025-003",
      title: "WHEAT EXPORT OPPORTUNITIES",
      category: "TRADE ANALYSIS",
      source: "EXPORT DATA",
      region: "Great Plains",
      date: "2025-06-15",
      status: "current",
      impact: "medium",
      summary: "New trade agreements opening wheat export channels to Southeast Asian markets",
      tags: ["wheat", "export", "trade", "asia"],
      priceChange: "+8.7%",
      confidence: 78,
    },
    {
      id: "MKT-2025-004",
      title: "DROUGHT IMPACT ASSESSMENT",
      category: "RISK ANALYSIS",
      source: "WEATHER DATA",
      region: "Southwest USA",
      date: "2025-06-14",
      status: "alert",
      impact: "critical",
      summary: "Extended drought conditions threatening crop yields across multiple agricultural regions",
      tags: ["drought", "risk", "yield", "climate"],
      priceChange: "+22.1%",
      confidence: 89,
    },
    {
      id: "MKT-2025-005",
      title: "SUSTAINABLE FARMING TRENDS",
      category: "TREND ANALYSIS",
      source: "INDUSTRY REPORTS",
      region: "National",
      date: "2025-06-13",
      status: "current",
      impact: "low",
      summary: "Growing adoption of sustainable farming practices creating new market opportunities",
      tags: ["sustainability", "trends", "innovation", "practices"],
      priceChange: "+5.2%",
      confidence: 71,
    },
  ]

  const getCategoryColor = (category) => {
    switch (category) {
      case "PRICE FORECAST":
        return "bg-blue-500/20 text-blue-500"
      case "DEMAND ANALYSIS":
        return "bg-green-500/20 text-green-500"
      case "TRADE ANALYSIS":
        return "bg-purple-500/20 text-purple-500"
      case "RISK ANALYSIS":
        return "bg-red-500/20 text-red-500"
      case "TREND ANALYSIS":
        return "bg-orange-500/20 text-orange-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getImpactColor = (impact) => {
    switch (impact) {
      case "critical":
        return "bg-red-500/20 text-red-500"
      case "high":
        return "bg-orange-500/20 text-orange-500"
      case "medium":
        return "bg-neutral-500/20 text-neutral-300"
      case "low":
        return "bg-green-500/20 text-green-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "current":
        return "bg-green-500/20 text-green-500"
      case "trending":
        return "bg-blue-500/20 text-blue-500"
      case "alert":
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const filteredReports = reports.filter(
    (report) =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">MARKET INTELLIGENCE</h1>
          <p className="text-sm text-neutral-400">Agricultural market analysis and forecasting</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-green-600 hover:bg-green-700 text-white">New Analysis</Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Stats and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search market reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL REPORTS</p>
                <p className="text-2xl font-bold text-white font-mono">847</p>
              </div>
              <FileText className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">PRICE ALERTS</p>
                <p className="text-2xl font-bold text-red-500 font-mono">7</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">MARKET TRENDS</p>
                <p className="text-2xl font-bold text-white font-mono">23</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Intelligence Reports */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">MARKET REPORTS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="border border-neutral-700 rounded p-4 hover:border-green-500/50 transition-colors cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <BarChart3 className="w-5 h-5 text-neutral-400 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-white tracking-wider">{report.title}</h3>
                        <p className="text-xs text-neutral-400 font-mono">{report.id}</p>
                      </div>
                    </div>

                    <p className="text-sm text-neutral-300 ml-8">{report.summary}</p>

                    <div className="flex flex-wrap gap-2 ml-8">
                      {report.tags.map((tag) => (
                        <Badge key={tag} className="bg-neutral-800 text-neutral-300 text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getCategoryColor(report.category)}>{report.category}</Badge>
                      <Badge className={getImpactColor(report.impact)}>{report.impact.toUpperCase()}</Badge>
                      <Badge className={getStatusColor(report.status)}>{report.status.toUpperCase()}</Badge>
                    </div>

                    <div className="text-xs text-neutral-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-green-400 font-mono">{report.priceChange}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-3 h-3" />
                        <span>{report.region}</span>
                      </div>
                      <div className="font-mono">{report.date}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">{selectedReport.title}</CardTitle>
                <p className="text-sm text-neutral-400 font-mono">{selectedReport.id}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedReport(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">ANALYSIS TYPE</h3>
                    <div className="flex gap-2">
                      <Badge className={getCategoryColor(selectedReport.category)}>{selectedReport.category}</Badge>
                      <Badge className={getImpactColor(selectedReport.impact)}>
                        IMPACT: {selectedReport.impact.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">MARKET DETAILS</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Data Source:</span>
                        <span className="text-white font-mono">{selectedReport.source}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Region:</span>
                        <span className="text-white">{selectedReport.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Date:</span>
                        <span className="text-white font-mono">{selectedReport.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Status:</span>
                        <Badge className={getStatusColor(selectedReport.status)}>
                          {selectedReport.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">MARKET INDICATORS</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400 text-sm">Price Change</span>
                        <span className="text-green-400 font-mono text-lg">{selectedReport.priceChange}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400 text-sm">Confidence Level</span>
                        <span className="text-white font-mono">{selectedReport.confidence}%</span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${selectedReport.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">TAGS</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedReport.tags.map((tag) => (
                        <Badge key={tag} className="bg-neutral-800 text-neutral-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">EXECUTIVE SUMMARY</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">{selectedReport.summary}</p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Analysis
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Share Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
