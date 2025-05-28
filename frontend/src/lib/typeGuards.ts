// Type guards for data validation

export interface PriceReport {
  id: number;
  product_name: string;
  retailer_name: string;
  user_name?: string;
  regular_price: number | string;
  sale_price?: number | string;
  unit_for_price: string;
  quantity_for_price: number;
  is_on_sale: boolean;
  status: string;
  created_at: string;
  likes_count?: number;
  notes?: string;
}

export function isValidReport(report: any): report is PriceReport {
  return (
    report &&
    typeof report === 'object' &&
    typeof report.id === 'number' &&
    typeof report.status === 'string' &&
    ['pending_approval', 'approved', 'rejected', 'expired', 'edited'].includes(report.status) &&
    typeof report.product_name === 'string' &&
    typeof report.retailer_name === 'string' &&
    (report.regular_price !== null && report.regular_price !== undefined) &&
    typeof report.unit_for_price === 'string' &&
    typeof report.quantity_for_price === 'number' &&
    typeof report.is_on_sale === 'boolean' &&
    typeof report.created_at === 'string'
  );
}

export function filterValidReports(reports: any[]): PriceReport[] {
  if (!Array.isArray(reports)) return [];
  return reports.filter(isValidReport);
}

export function isValidProduct(product: any): boolean {
  return (
    product &&
    typeof product === 'object' &&
    typeof product.id === 'number' &&
    typeof product.name === 'string' &&
    product.name.trim().length > 0
  );
}

export function isValidRetailer(retailer: any): boolean {
  return (
    retailer &&
    typeof retailer === 'object' &&
    typeof retailer.id === 'number' &&
    typeof retailer.name === 'string' &&
    retailer.name.trim().length > 0
  );
}

export function isValidUser(user: any): boolean {
  return (
    user &&
    typeof user === 'object' &&
    typeof user.id === 'number' &&
    typeof user.email === 'string' &&
    typeof user.role === 'string' &&
    ['user', 'admin'].includes(user.role)
  );
}

export function safeParseNumber(value: any): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
}

export function safeParseString(value: any): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}