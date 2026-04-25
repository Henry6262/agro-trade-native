import { Incoterm, TradePhase } from "@prisma/client";

export const INCOTERM_RELEASE_PHASE: Record<Incoterm, TradePhase> = {
  [Incoterm.EXW]: TradePhase.SELLER_MATCHING,
  [Incoterm.FCA]: TradePhase.SELLER_MATCHING,
  [Incoterm.FOB]: TradePhase.DELIVERED,
  [Incoterm.CFR]: TradePhase.DELIVERED,
  [Incoterm.CIF]: TradePhase.DELIVERED,
  [Incoterm.DAP]: TradePhase.DELIVERED,
  [Incoterm.DDP]: TradePhase.DELIVERED,
};
