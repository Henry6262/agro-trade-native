/**
 * Bulgarian Language Parser
 * Handles verbal numbers, currency, and agricultural terms for voice AI.
 */

// ─── Single digits ───────────────────────────────────────────────────────────
const SINGLE_DIGITS: Record<string, number> = {
  нула: 0,
  един: 1,
  една: 1,
  едно: 1,
  едни: 1,
  два: 2,
  две: 2,
  три: 3,
  четири: 4,
  пет: 5,
  шест: 6,
  седем: 7,
  осем: 8,
  девет: 9,
};

// ─── Teens ───────────────────────────────────────────────────────────────────
const TEENS: Record<string, number> = {
  десет: 10,
  единадесет: 11,
  единайсет: 11,
  дванадесет: 12,
  дванайсет: 12,
  тринадесет: 13,
  тринайсет: 13,
  четиринадесет: 14,
  четиринайсет: 14,
  петнадесет: 15,
  петнайсет: 15,
  шестнадесет: 16,
  шестнайсет: 16,
  седемнадесет: 17,
  седемнайсет: 17,
  осемнадесет: 18,
  осемнайсет: 18,
  деветнадесет: 19,
  деветнайсет: 19,
};

// ─── Tens ────────────────────────────────────────────────────────────────────
const TENS: Record<string, number> = {
  двадесет: 20,
  двайсет: 20,
  тридесет: 30,
  трийсет: 30,
  четиридесет: 40,
  четиресет: 40,
  петдесет: 50,
  шестдесет: 60,
  шейсет: 60,
  седемдесет: 70,
  осемдесет: 80,
  деветдесет: 90,
};

// ─── Hundreds ────────────────────────────────────────────────────────────────
const HUNDREDS: Record<string, number> = {
  сто: 100,
  двеста: 200,
  триста: 300,
  четиристотин: 400,
  петстотин: 500,
  шестстотин: 600,
  седемстотин: 700,
  осемстотин: 800,
  деветстотин: 900,
};

// ─── Multipliers ─────────────────────────────────────────────────────────────
const MULTIPLIERS: Record<string, number> = {
  хиляда: 1000,
  хиляди: 1000,
  милион: 1000000,
  милиона: 1000000,
};

// ─── Currency terms ──────────────────────────────────────────────────────────
const CURRENCY_TERMS = ['лев', 'лева', 'левче', 'стотинки', 'стотинка', 'лв'];

/**
 * Parse a Bulgarian verbal quantity into a number.
 * Examples:
 *   "петстотин" → 500
 *   "две хиляди и петстотин" → 2500
 *   "дванайсет" → 12
 */
export function parseBulgarianQuantity(input: string): number | null {
  if (!input || typeof input !== 'string') return null;

  const normalized = input.toLowerCase().trim().replace(/[.,]/g, ' ').replace(/\s+/g, ' ');

  // Quick numeric fallback — if already a digit string
  const pureNum = parseFloat(normalized.replace(/\s/g, ''));
  if (!isNaN(pureNum) && pureNum.toString() === normalized.replace(/\s/g, '')) {
    return pureNum;
  }

  const tokens = normalized.split(/[\s+и]+/).filter(Boolean);
  let total = 0;
  let currentAccumulator = 0;

  for (const token of tokens) {
    const cleanToken = token.trim();
    if (!cleanToken) continue;

    if (SINGLE_DIGITS[cleanToken] !== undefined) {
      currentAccumulator += SINGLE_DIGITS[cleanToken];
    } else if (TEENS[cleanToken] !== undefined) {
      currentAccumulator += TEENS[cleanToken];
    } else if (TENS[cleanToken] !== undefined) {
      currentAccumulator += TENS[cleanToken];
    } else if (HUNDREDS[cleanToken] !== undefined) {
      currentAccumulator += HUNDREDS[cleanToken];
    } else if (MULTIPLIERS[cleanToken] !== undefined) {
      const mult = MULTIPLIERS[cleanToken];
      if (currentAccumulator === 0) {
        total += mult;
      } else {
        total += currentAccumulator * mult;
        currentAccumulator = 0;
      }
    }
  }

  const result = total + currentAccumulator;
  return result > 0 ? result : null;
}

/**
 * Parse Bulgarian currency expression into BGN float.
 * Examples:
 *   "три лева и шейсет стотинки" → 3.60
 *   "един лев и петнайсет" → 1.15
 *   "пет лева" → 5.00
 *   "два лева и петдесет" → 2.50
 */
export function parseBulgarianCurrency(input: string): number | null {
  if (!input || typeof input !== 'string') return null;

  const normalized = input.toLowerCase().trim();

  // Direct numeric fallback
  const numericMatch = normalized.match(/(\d+[.,]?\d*)/);
  if (numericMatch && numericMatch[1] && normalized.length < 10) {
    return parseFloat(numericMatch[1].replace(',', '.'));
  }

  // Split by currency terms
  const hasLeva = /(лев|лева|левче|лв)/.test(normalized);
  const hasStotinki = /стотинк/.test(normalized);

  if (!hasLeva && !hasStotinki) return null;

  // Extract lev part (before lev/лева)
  let levPart = 0;
  let stotinkiPart = 0;

  const levMatch = normalized.match(/(.+?)(?:лев|лева|левче|лв)/);
  if (levMatch && levMatch[1]) {
    levPart = parseBulgarianQuantity(levMatch[1]) || 0;
  }

  // Extract stotinki part (after stotinki keyword)
  const stotinkiMatch = normalized.match(/(?:и|and)\s+(.+?)\s*стотинк/);
  if (stotinkiMatch && stotinkiMatch[1]) {
    stotinkiPart = parseBulgarianQuantity(stotinkiMatch[1]) || 0;
  }

  // If only stotinki mentioned (e.g., "петдесет стотинки")
  if (!hasLeva && hasStotinki) {
    const onlyStotinki = normalized.match(/(.+?)\s*стотинк/);
    if (onlyStotinki && onlyStotinki[1]) {
      stotinkiPart = parseBulgarianQuantity(onlyStotinki[1]) || 0;
    }
    return stotinkiPart / 100;
  }

  return levPart + stotinkiPart / 100;
}

/**
 * Normalize agricultural units to standard form.
 */
export function normalizeAgriculturalUnit(input: string): {
  quantity: number | null;
  unit: string;
} {
  const normalized = input.toLowerCase().trim();

  // Extract number
  const num = parseBulgarianQuantity(normalized);

  // Detect unit
  let unit = 'kg';
  if (/тон/.test(normalized)) unit = 'tons';
  else if (/килограм|кг|kilo/.test(normalized)) unit = 'kg';
  else if (/грам/.test(normalized)) unit = 'g';
  else if (/литър|л\b/.test(normalized)) unit = 'L';
  else if (/брой|бр/.test(normalized)) unit = 'pieces';
  else if (/тона/.test(normalized)) unit = 'tons';

  return { quantity: num, unit };
}

/**
 * Extract structured offer data from Bulgarian voice input.
 * Example: "оферта за петстотин килограма пшеница по два лева и петдесет"
 */
export function extractOfferFromText(input: string): {
  commodity: string | null;
  quantity: number | null;
  pricePerKg: number | null;
} {
  const normalized = input.toLowerCase();

  // Commodity detection
  const commodities: Record<string, string[]> = {
    wheat: ['пшеница', 'пшеницата', 'жито'],
    corn: ['царевица', 'царевицата', 'цареви', 'царевицата'],
    sunflower: ['слънчоглед', 'слънчогледа', 'слънчогледът'],
    barley: ['ечемик', 'ечемика'],
    rapeseed: ['рапица', 'рапицата'],
  };

  let detectedCommodity: string | null = null;
  for (const [key, terms] of Object.entries(commodities)) {
    if (terms.some((t) => normalized.includes(t))) {
      detectedCommodity = key;
      break;
    }
  }

  // Quantity extraction — look for patterns like "X килограма"
  let quantity: number | null = null;
  const qtyPatterns = [/(\S+)\s*(?:килограм|кг|kilo|тон|тона)/, /(\S+)\s*(?:брой|бр|pieces)/];
  for (const pattern of qtyPatterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      quantity = parseBulgarianQuantity(match[1]);
      if (quantity) break;
    }
  }

  // Price extraction — look for "по X лева" or "X лева"
  let pricePerKg: number | null = null;
  const pricePatterns = [
    /по\s+(.+?)(?:лев|лева|лв)/,
    /(?:цена|цената)\s*(?:от|за)?\s*(.+?)(?:лев|лева|лв)/,
    /(\S+)\s*(?:лев|лева|лв)/,
  ];
  for (const pattern of pricePatterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      pricePerKg = parseBulgarianCurrency(match[1] + ' лева');
      if (pricePerKg) break;
    }
  }

  return { commodity: detectedCommodity, quantity, pricePerKg };
}
