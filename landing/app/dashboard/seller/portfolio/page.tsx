"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/app/stores/auth.store";
import { useMarketplaceStore } from "@/app/stores/marketplace.store";
import { useInvestmentStore } from "@/app/stores/investment.store";
import type { InvestmentPosition } from "@/app/types";
import { CandlestickChart, Coins, RefreshCcw, ShieldCheck, Wallet } from "lucide-react";

function formatUsd(value: number | string) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatTokenAmount(value: number | string) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) {
    return "0";
  }
  return amount.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

function formatStatusTone(status: InvestmentPosition["status"]) {
  switch (status) {
    case "EXECUTED":
      return "border-green-500/30 text-green-300";
    case "FAILED":
      return "border-red-500/30 text-red-300";
    case "PENDING":
      return "border-amber-500/30 text-amber-300";
    default:
      return "border-brand-border text-text-muted";
  }
}

export default function SellerPortfolioPage() {
  const user = useAuthStore((state) => state.user);
  const {
    sellerTrades,
    fetchSellerTrades,
    isLoading: isLoadingTrades,
  } = useMarketplaceStore();
  const {
    assets,
    positions,
    preference,
    isLoadingAssets,
    isLoadingPortfolio,
    isSavingPreference,
    isSwapping,
    error,
    fetchAssets,
    fetchPortfolio,
    fetchPreference,
    updatePreference,
    executeSwap,
    clearError,
  } = useInvestmentStore();

  const [assetSymbol, setAssetSymbol] = useState("PAXG");
  const [amountUsdc, setAmountUsdc] = useState("100");
  const [percentage, setPercentage] = useState("100");
  const [selectedTradeOperationId, setSelectedTradeOperationId] = useState("");

  const handleAssetChange = (value: string | null) => {
    if (value) {
      setAssetSymbol(value);
    }
  };

  const handleTradeSelection = (value: string | null) => {
    setSelectedTradeOperationId(value ?? "");
  };

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    fetchAssets();
    fetchPortfolio(user.id);
    fetchPreference();
    fetchSellerTrades();
  }, [user?.id, fetchAssets, fetchPortfolio, fetchPreference, fetchSellerTrades]);

  useEffect(() => {
    if (preference) {
      setAssetSymbol(preference.assetSymbol);
      setPercentage(String(preference.percentage));
    }
  }, [preference]);

  useEffect(() => {
    if (!error) {
      return;
    }

    toast.error(error);
    clearError();
  }, [error, clearError]);

  const eligibleTrades = useMemo(
    () =>
      sellerTrades.filter((trade) => {
        const phase = trade.tradePhase ?? trade.phase;
        return (
          trade.metadata?.escrowChain === "SOLANA" &&
          (phase === "DELIVERED" || phase === "COMPLETED")
        );
      }),
    [sellerTrades],
  );

  const totalInvestedUsdc = useMemo(
    () =>
      positions.reduce((sum, position) => {
        return sum + Number(position.amountUsdc || 0);
      }, 0),
    [positions],
  );

  const executedPositions = positions.filter((position) => position.status === "EXECUTED");

  const handleSavePreference = async () => {
    const parsedPercentage = Number(percentage);
    if (!Number.isFinite(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > 100) {
      toast.error("Percentage must be between 0 and 100");
      return;
    }

    try {
      await updatePreference({
        autoInvest: !(preference?.autoInvest ?? false),
        assetSymbol,
        percentage: parsedPercentage,
      });
      toast.success("Auto-invest preference updated");
    } catch {
      // error handled by store toast effect
    }
  };

  const handleSaveSettings = async () => {
    const parsedPercentage = Number(percentage);
    if (!Number.isFinite(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > 100) {
      toast.error("Percentage must be between 0 and 100");
      return;
    }

    try {
      await updatePreference({
        autoInvest: preference?.autoInvest ?? false,
        assetSymbol,
        percentage: parsedPercentage,
      });
      toast.success("Portfolio settings saved");
    } catch {
      // error handled by store toast effect
    }
  };

  const handleManualSwap = async () => {
    const parsedAmount = Number(amountUsdc);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid USDC amount");
      return;
    }

    try {
      await executeSwap({
        assetSymbol,
        amountUsdc: parsedAmount,
        tradeOperationId: selectedTradeOperationId || undefined,
      });
      toast.success("Investment submitted");
      if (user?.id) {
        fetchPortfolio(user.id);
      }
      setAmountUsdc("100");
      setSelectedTradeOperationId("");
    } catch {
      // error handled by store toast effect
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-cream">Portfolio</h1>
        <p className="text-text-muted text-sm mt-1">
          Manage auto-invest rules and deploy settled Solana escrow proceeds into curated assets.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="bg-card border-brand-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-muted flex items-center gap-2">
              <Wallet className="h-4 w-4 text-brand-wheat" />
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-cream">{formatUsd(totalInvestedUsdc)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-brand-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-muted flex items-center gap-2">
              <CandlestickChart className="h-4 w-4 text-amber-300" />
              Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-cream">{positions.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-brand-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-muted flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-300" />
              Auto-Invest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant="outline"
              className={
                preference?.autoInvest
                  ? "border-green-500/30 text-green-300"
                  : "border-brand-border text-text-muted"
              }
            >
              {preference?.autoInvest ? "Enabled" : "Disabled"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-card border-brand-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-muted flex items-center gap-2">
              <Coins className="h-4 w-4 text-cyan-300" />
              Eligible Solana Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-cream">{eligibleTrades.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-card border-brand-border">
          <CardHeader>
            <CardTitle className="text-brand-cream">Auto-Invest Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-brand-border bg-brand-bg/40 p-4">
              <div>
                <p className="text-sm font-medium text-brand-cream">Automatic post-settlement investing</p>
                <p className="text-xs text-text-muted mt-1">
                  Runs only for trades tagged with `metadata.escrowChain = SOLANA`.
                </p>
              </div>
              <Button
                variant={preference?.autoInvest ? "default" : "outline"}
                className={preference?.autoInvest ? "bg-green-600 text-white hover:bg-green-500" : ""}
                onClick={handleSavePreference}
                disabled={isSavingPreference}
              >
                {isSavingPreference
                  ? "Saving..."
                  : preference?.autoInvest
                    ? "Disable"
                    : "Enable"}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-brand-cream">Target Asset</Label>
                <Select value={assetSymbol} onValueChange={handleAssetChange}>
                  <SelectTrigger className="w-full bg-brand-bg border-brand-border text-brand-cream">
                    <SelectValue placeholder="Select an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset) => (
                      <SelectItem key={asset.symbol} value={asset.symbol}>
                        {asset.symbol} · {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-brand-cream">Invest Percentage</Label>
                <Input
                  value={percentage}
                  onChange={(event) => setPercentage(event.target.value)}
                  type="number"
                  min="0"
                  max="100"
                  className="bg-brand-bg border-brand-border text-brand-cream"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
              <div>
                <p className="text-amber-100 font-medium">Mint configuration caveat</p>
                <p className="text-text-muted mt-1">
                  Some curated assets are still backend-gated until verified Solana mint addresses are configured.
                </p>
              </div>
              <Button variant="outline" onClick={handleSaveSettings} disabled={isSavingPreference}>
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-brand-border">
          <CardHeader>
            <CardTitle className="text-brand-cream">Manual Investment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-brand-cream">Asset</Label>
              <Select value={assetSymbol} onValueChange={handleAssetChange}>
                <SelectTrigger className="w-full bg-brand-bg border-brand-border text-brand-cream">
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.symbol} value={asset.symbol}>
                      {asset.symbol} · {asset.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-brand-cream">USDC Amount</Label>
              <Input
                value={amountUsdc}
                onChange={(event) => setAmountUsdc(event.target.value)}
                type="number"
                min="0"
                step="0.01"
                className="bg-brand-bg border-brand-border text-brand-cream"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-brand-cream">Source Trade Payout</Label>
              <Select value={selectedTradeOperationId} onValueChange={handleTradeSelection}>
                <SelectTrigger className="w-full bg-brand-bg border-brand-border text-brand-cream">
                  <SelectValue placeholder="Optional Solana trade" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleTrades.map((trade) => {
                    const operationId = trade.tradeOperationId || trade.id;
                    return (
                      <SelectItem key={operationId} value={operationId}>
                        {operationId.slice(0, 8)} · {trade.product?.name || "Trade payout"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleManualSwap}
              disabled={isSwapping || isLoadingAssets}
              className="w-full bg-brand-wheat text-brand-bg hover:bg-brand-wheat/90 font-semibold"
            >
              {isSwapping ? "Submitting..." : "Invest Now"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-brand-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-brand-cream">Investment Positions</CardTitle>
          <Button
            variant="outline"
            onClick={() => user?.id && fetchPortfolio(user.id)}
            disabled={isLoadingPortfolio}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingPortfolio || isLoadingTrades ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 bg-brand-wheat/5 rounded-xl" />
              ))}
            </div>
          ) : positions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-brand-border p-8 text-center">
              <p className="text-brand-cream font-medium">No investment positions yet.</p>
              <p className="text-sm text-text-muted mt-2">
                Your executed and failed post-trade swaps will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="rounded-xl border border-brand-border bg-brand-bg/40 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-brand-cream">{position.assetSymbol}</p>
                        <Badge
                          variant="outline"
                          className={formatStatusTone(position.status)}
                        >
                          {position.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-muted">
                        {formatUsd(position.amountUsdc)} into {formatTokenAmount(position.tokenAmount)} tokens
                      </p>
                      <p className="text-xs text-text-muted">
                        {new Date(position.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      {position.txSignature ? (
                        <a
                          href={`https://explorer.solana.com/tx/${position.txSignature}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-cyan-300 hover:text-cyan-200"
                        >
                          View Transaction
                        </a>
                      ) : (
                        <p className="text-xs text-text-muted">Pending signature</p>
                      )}
                      {position.tradeOperationId && (
                        <p className="text-xs text-text-muted">
                          Trade #{position.tradeOperationId.slice(0, 8)}
                        </p>
                      )}
                    </div>
                  </div>

                  {position.errorMessage && (
                    <p className="mt-3 text-xs text-red-300">{position.errorMessage}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {executedPositions.length > 0 && (
        <Card className="bg-card border-brand-border">
          <CardHeader>
            <CardTitle className="text-brand-cream">Execution Footprint</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-muted">
              {executedPositions.length} position{executedPositions.length === 1 ? "" : "s"} executed successfully.
              Auto-invest will continue to run only on Solana-settled trades.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
