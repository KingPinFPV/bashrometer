// Price normalization utilities
export interface PriceData {
  price: number;
  quantity: number;
  unit: string;
}

export interface NormalizedPrice {
  price_per_100g: number;
  original_price: number;
  unit_conversion_factor: number;
}

export const UNIT_CONVERSIONS = {
  'ק"ג': 1000,      // 1 kg = 1000g
  'גרם': 1,          // 1g = 1g
  '100 גרם': 100,    // 100g = 100g
  'חבילה': 500,      // Default package weight
  'יחידה': 300       // Default unit weight
} as const;

export function normalizePrice(priceData: PriceData): NormalizedPrice {
  const { price, quantity, unit } = priceData;
  
  // Get conversion factor for unit
  const unitFactor = UNIT_CONVERSIONS[unit as keyof typeof UNIT_CONVERSIONS] || 500;
  
  // Calculate total grams
  const totalGrams = quantity * unitFactor;
  
  // Calculate price per 100g
  const pricePer100g = totalGrams > 0 ? (price / totalGrams) * 100 : 0;
  
  return {
    price_per_100g: pricePer100g,
    original_price: price,
    unit_conversion_factor: unitFactor
  };
}

export function formatNormalizedPrice(price: number): string {
  return `₪${price.toFixed(2)}`;
}

export function calculateBestPrice(prices: PriceData[]): PriceData | null {
  if (prices.length === 0) return null;
  
  const normalizedPrices = prices.map(p => ({
    ...p,
    normalized: normalizePrice(p)
  }));
  
  return normalizedPrices.reduce((best, current) => 
    current.normalized.price_per_100g < best.normalized.price_per_100g ? current : best
  );
}