export type CuratedAssetCategory = "STOCK" | "ETF" | "COMMODITY";

export interface CuratedAsset {
  symbol: string;
  name: string;
  category: CuratedAssetCategory;
  outputMint: string;
  decimals: number;
}

export const USDC_SOLANA_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export const CURATED_ASSETS: CuratedAsset[] = [
  {
    symbol: "AAPLx",
    name: "Apple (xStocks)",
    category: "STOCK",
    outputMint: "6NQrkwMDbS4KmbwPvDLo9BtuQ1AjA1DWAAzoYrrfD1hg",
    decimals: 8,
  },
  {
    symbol: "NVDAx",
    name: "Nvidia (xStocks)",
    category: "STOCK",
    outputMint: "C7UjNVeDA3V82AJCz4UJwHzR3voXcpAZ5PkE4GmY7CpG",
    decimals: 8,
  },
  {
    symbol: "TSLAx",
    name: "Tesla (xStocks)",
    category: "STOCK",
    outputMint: "31iBU7z4UfXqWLWHV7tvut2K4p349ZznND4K5AXGQ2Lv",
    decimals: 8,
  },
  {
    symbol: "SPYx",
    name: "S&P 500 ETF (xStocks)",
    category: "ETF",
    outputMint: "6xWbSpyXxKGVGpskVFdQ8twRDorMHWLraEj9mWAzBF2v",
    decimals: 8,
  },
  {
    symbol: "PAXG",
    name: "Gold (Paxos)",
    category: "COMMODITY",
    outputMint: "GHv9mZ7S8N7x6oBf7a9yG7a6LzJ4m8Z5u7X3Pq4wV9v",
    decimals: 9,
  },
  {
    symbol: "XAUt",
    name: "Gold (Tether)",
    category: "COMMODITY",
    outputMint: "EfwfjQRcFC1XaUtvsgX1FH11Rw8s9ueL9EGUqtSfYq1M",
    decimals: 6,
  },
];
