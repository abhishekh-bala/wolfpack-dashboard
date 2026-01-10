export interface SalesData {
  name: string;
  orders: number;
  avgOrderSize: number;
  total: number;
  newRevenue: number;
}

export interface ParsedMhtmlData {
  salesData: SalesData[];
  summary: {
    totalSales: number;
    totalOrders: number;
    avgOrderSize: number;
    salesPerRep: number;
    newSales: number;
    newOrders: number;
  };
  dateRange: string;
  supervisor: string;
}

export function parseMhtml(content: string): ParsedMhtmlData {
  // Extract base64 content from MHTML
  const base64Match = content.match(/Content-Transfer-Encoding: base64\s+([\s\S]+?)(?:------=|$)/);
  
  if (!base64Match) {
    throw new Error('Could not find base64 content in MHTML file');
  }

  // Clean and decode base64
  const base64Content = base64Match[1].replace(/\s/g, '');
  let htmlContent: string;
  
  try {
    htmlContent = atob(base64Content);
  } catch (e) {
    throw new Error('Failed to decode base64 content');
  }

  // Parse HTML using DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Extract date range and supervisor from meta tags or content
  let dateRange = '';
  let supervisor = '';
  
  const dateRangeMatch = htmlContent.match(/Date Range:\s*([^<\n]+)/);
  if (dateRangeMatch) {
    dateRange = dateRangeMatch[1].trim();
  }
  
  const supervisorMatch = htmlContent.match(/Supervisor:\s*([^<\n]+)/);
  if (supervisorMatch) {
    supervisor = supervisorMatch[1].trim();
  }

  // Extract summary data
  const summary = {
    totalSales: 0,
    totalOrders: 0,
    avgOrderSize: 0,
    salesPerRep: 0,
    newSales: 0,
    newOrders: 0,
  };

  // Parse summary values from the HTML
  const totalSalesMatch = htmlContent.match(/Total Sales:\s*\$?([\d,]+\.?\d*)/);
  if (totalSalesMatch) {
    summary.totalSales = parseFloat(totalSalesMatch[1].replace(/,/g, ''));
  }

  const totalOrdersMatch = htmlContent.match(/Total Orders:\s*(\d+)/);
  if (totalOrdersMatch) {
    summary.totalOrders = parseInt(totalOrdersMatch[1]);
  }

  const avgOrderMatch = htmlContent.match(/Avg Order Size:\s*\$?([\d,]+\.?\d*)/);
  if (avgOrderMatch) {
    summary.avgOrderSize = parseFloat(avgOrderMatch[1].replace(/,/g, ''));
  }

  const salesPerRepMatch = htmlContent.match(/Sales per Rep:\s*\$?([\d,]+\.?\d*)/);
  if (salesPerRepMatch) {
    summary.salesPerRep = parseFloat(salesPerRepMatch[1].replace(/,/g, ''));
  }

  const newSalesMatch = htmlContent.match(/New Sales:\s*\$?([\d,]+\.?\d*)/);
  if (newSalesMatch) {
    summary.newSales = parseFloat(newSalesMatch[1].replace(/,/g, ''));
  }

  const newOrdersMatch = htmlContent.match(/New Orders:\s*(\d+)/);
  if (newOrdersMatch) {
    summary.newOrders = parseInt(newOrdersMatch[1]);
  }

  // Extract employee data rows
  const salesData: SalesData[] = [];
  
  // Find all employee rows - they have links with Sales By Agent
  const employeeLinks = htmlContent.match(/<a[^>]*>([^<]+)<\/a>/g) || [];
  
  // Pattern to extract employee data rows
  const rowPattern = /<a[^>]*class="a221a"[^>]*>([^<]+)<\/a>[\s\S]*?class="a228"[^>]*>(\d+)<\/DIV>[\s\S]*?class="a232"[^>]*>\$?([\d,]+\.?\d*)<\/DIV>[\s\S]*?class="a236"[^>]*>\$?([\d,]+\.?\d*)<\/DIV>[\s\S]*?class="a241"[^>]*>\$?([\d,]+\.?\d*)<\/DIV>/g;
  
  let match;
  while ((match = rowPattern.exec(htmlContent)) !== null) {
    const name = match[1].trim();
    const orders = parseInt(match[2]);
    const avgOrderSize = parseFloat(match[3].replace(/,/g, ''));
    const total = parseFloat(match[4].replace(/,/g, ''));
    const newRevenue = parseFloat(match[5].replace(/,/g, ''));
    
    salesData.push({
      name,
      orders,
      avgOrderSize,
      total,
      newRevenue,
    });
  }

  // If no data found with strict pattern, try alternative parsing
  if (salesData.length === 0) {
    // Alternative: look for names followed by numbers
    const namePattern = />([A-Za-z]+,\s*[A-Za-z]+)</g;
    const names: string[] = [];
    let nameMatch;
    while ((nameMatch = namePattern.exec(htmlContent)) !== null) {
      const name = nameMatch[1].trim();
      if (!names.includes(name) && name.includes(',')) {
        names.push(name);
      }
    }

    // For each name, try to find associated numbers
    names.forEach((name) => {
      // This is a fallback - try to find numeric values near the name
      const nameIndex = htmlContent.indexOf(name);
      if (nameIndex > -1) {
        const segment = htmlContent.substring(nameIndex, nameIndex + 500);
        const numbers = segment.match(/\$?([\d,]+\.?\d*)/g) || [];
        const parsedNumbers = numbers.map(n => parseFloat(n.replace(/[$,]/g, ''))).filter(n => !isNaN(n) && n > 0);
        
        if (parsedNumbers.length >= 3) {
          salesData.push({
            name,
            orders: Math.round(parsedNumbers[0]) || 1,
            avgOrderSize: parsedNumbers[1] || 0,
            total: parsedNumbers[2] || 0,
            newRevenue: parsedNumbers[3] || parsedNumbers[2] || 0,
          });
        }
      }
    });
  }

  return {
    salesData,
    summary,
    dateRange,
    supervisor,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}
