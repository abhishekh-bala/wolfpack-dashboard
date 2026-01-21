import { GuideTarget } from '@/hooks/useGuideTargets';
import { SalesData, ParsedMhtmlData } from '@/lib/mhtmlParser';

export interface CsvRowData {
  loginName: string;
  orders: number;
  aos: number;
  conversionRate: number;
  sales: number;
  salesRefund: number;
  netNewSales: number;
  nnrpc: number;
  nrpc: number;
  refundPercent: number;
  chats: number;
}

/**
 * Parse CSV content and map to sales data using guide targets for login name mapping
 */
export function parseCsv(
  content: string,
  targets: GuideTarget[]
): ParsedMhtmlData {
  // Split into lines and remove empty ones
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must have a header row and at least one data row');
  }

  // Parse header row - handle both comma and tab delimiters
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headers = parseCSVLine(lines[0], delimiter).map(h => h.toLowerCase().trim());
  
  // Map expected columns to indices
  const columnMap = {
    loginName: findColumnIndex(headers, ['login name', 'loginname', 'login', 'name']),
    orders: findColumnIndex(headers, ['orders', 'order count', 'order']),
    aos: findColumnIndex(headers, ['aos', 'avg order size', 'average order size']),
    conversionRate: findColumnIndex(headers, ['conversion rate', 'conversion', 'conv rate', 'conv%', 'conversion%']),
    sales: findColumnIndex(headers, ['sales', 'total sales', 'revenue']),
    salesRefund: findColumnIndex(headers, ['sales refund (in month)', 'sales refund', 'refund', 'refunds']),
    netNewSales: findColumnIndex(headers, ['net new sales (in month less isc)', 'net new sales', 'net sales', 'new sales']),
    nnrpc: findColumnIndex(headers, ['nnrpc']),
    nrpc: findColumnIndex(headers, ['nrpc']),
    refundPercent: findColumnIndex(headers, ['refund%', 'refund percent', 'refund percentage']),
    chats: findColumnIndex(headers, ['chats', 'total contacts', 'contacts', 'chat count']),
  };

  // Validate required columns
  if (columnMap.loginName === -1) {
    throw new Error('CSV must contain a "Login Name" column');
  }

  // Create login name to guide name mapping from targets
  const loginToGuideMap = new Map<string, string>();
  targets.forEach(target => {
    if (target.loginName) {
      loginToGuideMap.set(target.loginName.toLowerCase().trim(), target.name);
    }
  });

  // Parse data rows
  const salesData: SalesData[] = [];
  const unmappedLogins: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    if (values.length === 0 || values.every(v => !v.trim())) continue;

    const loginName = values[columnMap.loginName]?.trim() || '';
    if (!loginName) continue;

    // Map login name to guide name
    const guideName = loginToGuideMap.get(loginName.toLowerCase().trim());
    if (!guideName) {
      unmappedLogins.push(loginName);
      continue;
    }

    // Parse numeric values, handling currency symbols and percentages
    const orders = parseNumericValue(values[columnMap.orders]);
    const aos = parseNumericValue(values[columnMap.aos]);
    const conversionRate = parseNumericValue(values[columnMap.conversionRate]);
    const sales = parseNumericValue(values[columnMap.sales]);
    const netNewSales = parseNumericValue(values[columnMap.netNewSales]);
    const chats = parseNumericValue(values[columnMap.chats]);

    // Use netNewSales as newRevenue if available, otherwise use sales
    const newRevenue = netNewSales > 0 ? netNewSales : sales;

    salesData.push({
      name: guideName,
      orders,
      avgOrderSize: aos,
      total: sales,
      newRevenue,
    });
  }

  // Calculate summary
  const summary = {
    totalSales: salesData.reduce((sum, d) => sum + d.total, 0),
    totalOrders: salesData.reduce((sum, d) => sum + d.orders, 0),
    avgOrderSize: salesData.length > 0 
      ? salesData.reduce((sum, d) => sum + d.avgOrderSize, 0) / salesData.length 
      : 0,
    salesPerRep: salesData.length > 0 
      ? salesData.reduce((sum, d) => sum + d.total, 0) / salesData.length 
      : 0,
    newSales: salesData.reduce((sum, d) => sum + d.newRevenue, 0),
    newOrders: salesData.reduce((sum, d) => sum + d.orders, 0),
  };

  // Generate date range (current month)
  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();
  const dateRange = `${monthName} ${year}`;

  return {
    salesData,
    summary,
    dateRange,
    supervisor: '',
  };
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Find column index by checking multiple possible header names
 */
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h === name || h.includes(name));
    if (index !== -1) return index;
  }
  return -1;
}

/**
 * Parse a numeric value from string, handling currency symbols, percentages, and thousands separators
 */
function parseNumericValue(value: string | undefined): number {
  if (!value) return 0;
  
  // Remove currency symbols, percentage signs, and whitespace
  const cleaned = value.replace(/[$€£%,\s]/g, '').trim();
  
  // Handle parentheses for negative numbers
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    return -parseFloat(cleaned.slice(1, -1)) || 0;
  }
  
  return parseFloat(cleaned) || 0;
}

/**
 * Check if content is CSV format
 */
export function isCsvContent(content: string): boolean {
  const firstLine = content.split(/\r?\n/)[0]?.toLowerCase() || '';
  return firstLine.includes('login name') || 
         firstLine.includes('loginname') ||
         (firstLine.includes(',') && !firstLine.includes('Content-Transfer-Encoding'));
}

/**
 * Get list of unmapped login names for user feedback
 */
export function getUnmappedLogins(
  content: string,
  targets: GuideTarget[]
): string[] {
  const delimiter = content.includes('\t') ? '\t' : ',';
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0], delimiter).map(h => h.toLowerCase().trim());
  const loginNameIndex = findColumnIndex(headers, ['login name', 'loginname', 'login', 'name']);
  if (loginNameIndex === -1) return [];

  const loginToGuideMap = new Map<string, string>();
  targets.forEach(target => {
    if (target.loginName) {
      loginToGuideMap.set(target.loginName.toLowerCase().trim(), target.name);
    }
  });

  const unmapped: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    const loginName = values[loginNameIndex]?.trim();
    if (loginName && !loginToGuideMap.has(loginName.toLowerCase().trim())) {
      unmapped.push(loginName);
    }
  }

  return unmapped;
}
