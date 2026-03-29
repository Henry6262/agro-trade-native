"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, List, ChevronRight, Loader2, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/app/lib/api";
import type { TradeOperation, TradePhase } from "@/app/types";

interface ProfitValidation {
  isValid: boolean;
  currentMargin: number;
  minimumMargin: number;
  targetMargin: number;
  warnings: string[];
  recommendations: string[];
  breakdown: {
    revenue: number;
    purchaseCosts: number;
    transportCosts: number;
    netProfit: number;
  };
}

const PHASE_COLORS: Record<string, string> = {
  INITIATION: "border-blue-500/30 text-blue-400",
  SELLER_MATCHING: "border-purple-500/30 text-purple-400",
  SELLER_NEGOTIATION: "border-purple-500/30 text-purple-400",
  INSPECTION_PENDING: "border-brand-wheat/30 text-brand-wheat",
  TRANSPORT_MATCHING: "border-blue-500/30 text-blue-400",
  TRANSPORT_BIDDING: "border-blue-500/30 text-blue-400",
  IN_TRANSIT: "border-blue-500/30 text-blue-400",
  DELIVERED: "border-green-500/30 text-green-400",
  COMPLETED: "border-green-500/30 text-green-400",
  CANCELLED: "border-red-500/30 text-red-400",
};

const PHASE_TRANSITIONS: Record<string, string[]> = {
  INITIATION: ["SELLER_MATCHING", "CANCELLED"],
  SELLER_MATCHING: ["SELLER_NEGOTIATION", "CANCELLED"],
  SELLER_NEGOTIATION: ["INSPECTION_PENDING", "TRANSPORT_MATCHING", "CANCELLED"],
  INSPECTION_PENDING: ["TRANSPORT_MATCHING", "CANCELLED"],
  TRANSPORT_MATCHING: ["TRANSPORT_BIDDING", "IN_TRANSIT", "CANCELLED"],
  TRANSPORT_BIDDING: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const PHASE_LABELS: Record<string, string> = {
  INITIATION: "Initiation",
  SELLER_MATCHING: "Seller Match",
  SELLER_NEGOTIATION: "Negotiation",
  INSPECTION_PENDING: "Inspection",
  TRANSPORT_MATCHING: "Transport Match",
  TRANSPORT_BIDDING: "Transport Bid",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function AdminOperationsPage() {
  const [trades, setTrades] = useState<TradeOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [transitioning, setTransitioning] = useState<Record<string, string>>({});
  const [profitValidations, setProfitValidations] = useState<Record<string, ProfitValidation | null>>({});
  const [validatingProfit, setValidatingProfit] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await apiClient.get<TradeOperation[]>("/trade-operations");
        setTrades(Array.isArray(res) ? res : []);
      } catch {
        // API may return 404 if no trades
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrades();
  }, []);

  const advancePhase = async (tradeId: string, newPhase: string) => {
    const key = `${tradeId}:${newPhase}`;
    setTransitioning((prev) => ({ ...prev, [key]: "loading" }));
    try {
      await apiClient.patch(`/trade-operations/${tradeId}/phase`, { phase: newPhase });
      setTrades((prev) =>
        prev.map((t) => (t.id === tradeId ? { ...t, phase: newPhase as TradePhase } : t))
      );
    } catch {
      // silently fail — user can retry
    } finally {
      setTransitioning((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateProfit = async (tradeId: string) => {
    if (profitValidations[tradeId] !== undefined) {
      // toggle off if already loaded
      setProfitValidations((prev) => { const n = { ...prev }; delete n[tradeId]; return n; });
      return;
    }
    setValidatingProfit((prev) => ({ ...prev, [tradeId]: true }));
    try {
      const res = await apiClient.get<ProfitValidation>(`/profit/${tradeId}/profit/validation`);
      setProfitValidations((prev) => ({ ...prev, [tradeId]: res }));
    } catch {
      setProfitValidations((prev) => ({ ...prev, [tradeId]: null }));
    } finally {
      setValidatingProfit((prev) => { const n = { ...prev }; delete n[tradeId]; return n; });
    }
  };

  const filtered = trades.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.phase.toLowerCase().includes(q) ||
      t.buyer?.name?.toLowerCase().includes(q) ||
      t.seller?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-cream">All Operations</h1>
        <p className="text-text-muted text-sm mt-1">
          Manage trade phase transitions across all operations.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          placeholder="Search by ID, phase, buyer, seller..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card border-brand-border text-brand-cream placeholder:text-text-muted"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-brand-wheat/5 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-brand-border">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <List className="h-12 w-12 text-text-muted mx-auto" />
              <p className="text-text-muted">No operations found.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((trade) => {
            const nextPhases = PHASE_TRANSITIONS[trade.phase] ?? [];
            return (
              <Card key={trade.id} className="bg-card border-brand-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <p className="font-mono text-sm text-brand-cream">{trade.id.slice(0, 12)}...</p>
                      <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                        <span>Buyer: {trade.buyer?.name || "N/A"}</span>
                        <span>Seller: {trade.seller?.name || "N/A"}</span>
                        <span>{trade.quantity} {trade.unit}</span>
                        {trade.agreedPrice && <span>${trade.agreedPrice}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className={`text-xs ${PHASE_COLORS[trade.phase] || ""}`}>
                        {PHASE_LABELS[trade.phase] ?? trade.phase.replace(/_/g, " ")}
                      </Badge>
                      {trade.escrowStatus && trade.escrowStatus !== "NONE" && (
                        <Badge variant="outline" className="text-xs border-brand-wheat/30 text-brand-wheat">
                          {trade.escrowStatus}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-brand-border/50">
                    {nextPhases.length > 0 && (
                      <>
                        <ChevronRight className="h-3 w-3 text-text-muted shrink-0" />
                        {nextPhases.map((phase) => {
                          const key = `${trade.id}:${phase}`;
                          const isLoading = transitioning[key] === "loading";
                          const isCancelPhase = phase === "CANCELLED";
                          return (
                            <Button
                              key={phase}
                              size="sm"
                              variant="outline"
                              disabled={isLoading}
                              onClick={() => advancePhase(trade.id, phase)}
                              className={`h-7 text-xs px-2 ${
                                isCancelPhase
                                  ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
                                  : "border-brand-border text-text-muted hover:text-brand-cream hover:border-brand-wheat/40"
                              }`}
                            >
                              {isLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                PHASE_LABELS[phase] ?? phase.replace(/_/g, " ")
                              )}
                            </Button>
                          );
                        })}
                        <div className="flex-1" />
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={validatingProfit[trade.id]}
                      onClick={() => validateProfit(trade.id)}
                      className="h-7 text-xs px-2 border-brand-border text-text-muted hover:text-brand-cream hover:border-brand-wheat/40 ml-auto"
                    >
                      {validatingProfit[trade.id] ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {profitValidations[trade.id] !== undefined ? "Hide Profit" : "Profit"}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Profit validation panel */}
                  {profitValidations[trade.id] !== undefined && (() => {
                    const pv = profitValidations[trade.id];
                    if (!pv) return (
                      <p className="text-xs text-text-muted pt-1">Profit data unavailable for this trade.</p>
                    );
                    return (
                      <div className={`rounded-lg p-3 text-xs space-y-2 border ${
                        pv.isValid ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {pv.isValid
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                              : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                            }
                            <span className={pv.isValid ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                              Margin: {pv.currentMargin.toFixed(1)}%
                              {" "}(min {pv.minimumMargin}% / target {pv.targetMargin}%)
                            </span>
                          </div>
                          <span className="text-text-muted">
                            Net: ${pv.breakdown.netProfit.toLocaleString()}
                          </span>
                        </div>
                        {pv.warnings.length > 0 && (
                          <ul className="space-y-0.5">
                            {pv.warnings.map((w, i) => (
                              <li key={i} className="text-red-300/80 flex gap-1">
                                <span>⚠</span><span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {pv.recommendations.length > 0 && (
                          <ul className="space-y-0.5">
                            {pv.recommendations.map((r, i) => (
                              <li key={i} className="text-text-muted flex gap-1">
                                <span>→</span><span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
