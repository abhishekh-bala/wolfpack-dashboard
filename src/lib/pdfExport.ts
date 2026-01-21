import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SalesData, formatCurrency, formatPercent } from './mhtmlParser';
import { GuideTarget } from '@/hooks/useGuideTargets';

interface ExportData {
  dailyData: {
    salesData: SalesData[];
    summary: { newSales: number; newOrders: number };
    dateRange?: string;
  } | null;
  monthlyData: {
    salesData: SalesData[];
    summary: { newSales: number; newOrders: number };
    dateRange?: string;
  } | null;
  targets: GuideTarget[];
}

// Chart colors palette
const chartColors = [
  [0, 150, 255],    // Blue
  [34, 197, 94],    // Green
  [168, 85, 247],   // Purple
  [251, 146, 60],   // Orange
  [236, 72, 153],   // Pink
  [14, 165, 233],   // Sky
  [245, 158, 11],   // Amber
  [99, 102, 241],   // Indigo
  [20, 184, 166],   // Teal
  [239, 68, 68],    // Red
];

// Generate bar chart as canvas and return as image data
function generateBarChart(
  data: { label: string; value: number; target?: number }[],
  title: string,
  width: number,
  height: number,
  showTarget: boolean = true
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width * 2; // Retina
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  const padding = { top: 30, right: 20, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Background
  ctx.fillStyle = 'rgb(25, 32, 45)';
  ctx.roundRect(0, 0, width, height, 8);
  ctx.fill();

  // Title
  ctx.fillStyle = 'rgb(0, 150, 255)';
  ctx.font = 'bold 12px Arial';
  ctx.fillText(title, padding.left, 20);

  if (data.length === 0) {
    ctx.fillStyle = 'rgb(140, 150, 165)';
    ctx.font = '11px Arial';
    ctx.fillText('No data available', width / 2 - 40, height / 2);
    return canvas.toDataURL('image/png');
  }

  // Calculate max value
  const allValues = data.flatMap(d => showTarget && d.target ? [d.value, d.target] : [d.value]);
  const maxValue = Math.max(...allValues, 1) * 1.1;

  // Bar dimensions
  const barGroupWidth = chartWidth / data.length;
  const barWidth = showTarget ? barGroupWidth * 0.35 : barGroupWidth * 0.6;
  const barGap = showTarget ? barGroupWidth * 0.05 : 0;

  // Draw grid lines
  ctx.strokeStyle = 'rgba(100, 120, 140, 0.2)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartHeight * i) / 5;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    // Y-axis labels
    const value = maxValue - (maxValue * i) / 5;
    ctx.fillStyle = 'rgb(140, 150, 165)';
    ctx.font = '9px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(formatCompactNumber(value), padding.left - 5, y + 3);
  }

  // Draw bars
  data.forEach((item, i) => {
    const x = padding.left + i * barGroupWidth + barGroupWidth * 0.15;
    
    // Actual value bar
    const barHeight = (item.value / maxValue) * chartHeight;
    const y = padding.top + chartHeight - barHeight;
    
    // Gradient for bar
    const gradient = ctx.createLinearGradient(x, y, x, padding.top + chartHeight);
    gradient.addColorStop(0, `rgba(${chartColors[i % chartColors.length].join(',')}, 1)`);
    gradient.addColorStop(1, `rgba(${chartColors[i % chartColors.length].join(',')}, 0.6)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
    ctx.fill();

    // Target bar (if showing)
    if (showTarget && item.target !== undefined) {
      const targetHeight = (item.target / maxValue) * chartHeight;
      const targetY = padding.top + chartHeight - targetHeight;
      
      ctx.fillStyle = 'rgba(140, 150, 165, 0.4)';
      ctx.beginPath();
      ctx.roundRect(x + barWidth + barGap, targetY, barWidth, targetHeight, [4, 4, 0, 0]);
      ctx.fill();
      
      // Target line
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(x - 5, targetY);
      ctx.lineTo(x + barWidth * 2 + barGap + 5, targetY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // X-axis labels
    ctx.fillStyle = 'rgb(200, 210, 220)';
    ctx.font = '9px Arial';
    ctx.textAlign = 'center';
    const labelX = x + (showTarget ? barWidth + barGap / 2 : barWidth / 2);
    
    // Truncate long names
    const label = item.label.length > 10 ? item.label.substring(0, 8) + '..' : item.label;
    ctx.save();
    ctx.translate(labelX, padding.top + chartHeight + 10);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  // Legend
  if (showTarget) {
    const legendY = height - 12;
    ctx.fillStyle = 'rgb(0, 150, 255)';
    ctx.fillRect(width - 120, legendY - 6, 10, 10);
    ctx.fillStyle = 'rgb(140, 150, 165)';
    ctx.font = '9px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Actual', width - 107, legendY + 2);
    
    ctx.fillStyle = 'rgba(140, 150, 165, 0.4)';
    ctx.fillRect(width - 65, legendY - 6, 10, 10);
    ctx.fillStyle = 'rgb(140, 150, 165)';
    ctx.fillText('Target', width - 52, legendY + 2);
  }

  return canvas.toDataURL('image/png');
}

// Generate pie chart as canvas and return as image data
function generatePieChart(
  data: { label: string; value: number }[],
  title: string,
  width: number,
  height: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = 'rgb(25, 32, 45)';
  ctx.roundRect(0, 0, width, height, 8);
  ctx.fill();

  // Title
  ctx.fillStyle = 'rgb(0, 150, 255)';
  ctx.font = 'bold 12px Arial';
  ctx.fillText(title, 15, 20);

  if (data.length === 0) {
    ctx.fillStyle = 'rgb(140, 150, 165)';
    ctx.font = '11px Arial';
    ctx.fillText('No data available', width / 2 - 40, height / 2);
    return canvas.toDataURL('image/png');
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    ctx.fillStyle = 'rgb(140, 150, 165)';
    ctx.font = '11px Arial';
    ctx.fillText('No data available', width / 2 - 40, height / 2);
    return canvas.toDataURL('image/png');
  }

  const centerX = width * 0.35;
  const centerY = height / 2 + 5;
  const radius = Math.min(width * 0.28, height * 0.35);

  let startAngle = -Math.PI / 2;

  // Sort by value descending for better visualization
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  sortedData.forEach((item, i) => {
    const sliceAngle = (item.value / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    // Draw slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();

    const color = chartColors[i % chartColors.length];
    ctx.fillStyle = `rgb(${color.join(',')})`;
    ctx.fill();

    // Slice border
    ctx.strokeStyle = 'rgb(25, 32, 45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    startAngle = endAngle;
  });

  // Inner circle for donut effect
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgb(25, 32, 45)';
  ctx.fill();

  // Center text
  ctx.fillStyle = 'rgb(220, 225, 235)';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(formatCompactNumber(total), centerX, centerY + 5);

  // Legend
  const legendX = width * 0.65;
  let legendY = 35;
  const legendItemHeight = 16;
  const maxLegendItems = Math.min(sortedData.length, Math.floor((height - 50) / legendItemHeight));

  sortedData.slice(0, maxLegendItems).forEach((item, i) => {
    const color = chartColors[i % chartColors.length];
    
    // Color box
    ctx.fillStyle = `rgb(${color.join(',')})`;
    ctx.beginPath();
    ctx.roundRect(legendX, legendY - 8, 10, 10, 2);
    ctx.fill();

    // Label
    ctx.fillStyle = 'rgb(200, 210, 220)';
    ctx.font = '9px Arial';
    ctx.textAlign = 'left';
    const label = item.label.length > 12 ? item.label.substring(0, 10) + '..' : item.label;
    ctx.fillText(label, legendX + 14, legendY);

    // Percentage
    const percentage = ((item.value / total) * 100).toFixed(1) + '%';
    ctx.fillStyle = 'rgb(140, 150, 165)';
    ctx.fillText(percentage, legendX + 75, legendY);

    legendY += legendItemHeight;
  });

  if (sortedData.length > maxLegendItems) {
    ctx.fillStyle = 'rgb(140, 150, 165)';
    ctx.font = '9px Arial';
    ctx.fillText(`+${sortedData.length - maxLegendItems} more...`, legendX, legendY);
  }

  return canvas.toDataURL('image/png');
}

function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return '$' + (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return '$' + (value / 1000).toFixed(1) + 'K';
  }
  return '$' + value.toFixed(0);
}

export async function exportToPDF(data: ExportData): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Colors
  const primaryColor: [number, number, number] = [0, 150, 255];
  const successColor: [number, number, number] = [34, 197, 94];
  const darkBg: [number, number, number] = [15, 20, 30];
  const cardBg: [number, number, number] = [25, 32, 45];
  const textColor: [number, number, number] = [220, 225, 235];
  const mutedColor: [number, number, number] = [140, 150, 165];

  // Helper to add page background
  const addPageBackground = () => {
    pdf.setFillColor(...darkBg);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  // Helper to calculate metrics
  const calculateMetrics = (salesData: SalesData[], targets: GuideTarget[], mode: 'day' | 'month') => {
    const totalChats = targets.reduce((sum, t) => sum + (mode === 'day' ? t.chatCount : t.monthlyChatCount), 0);
    const summary = salesData.reduce(
      (acc, agent) => ({
        newOrders: acc.newOrders + agent.orders,
        newSales: acc.newSales + agent.newRevenue,
      }),
      { newOrders: 0, newSales: 0 }
    );
    const nrpc = totalChats > 0 ? summary.newSales / totalChats : 0;
    const conversion = totalChats > 0 ? (summary.newOrders / totalChats) * 100 : 0;
    const aos = summary.newOrders > 0 ? summary.newSales / summary.newOrders : 0;
    return { totalChats, ...summary, nrpc, conversion, aos };
  };

  // Add header
  const addHeader = (title: string) => {
    // Logo placeholder
    pdf.setFillColor(...primaryColor);
    pdf.roundedRect(margin, yPos, 12, 12, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('WP', margin + 6, yPos + 7, { align: 'center' });

    // Title
    pdf.setTextColor(...textColor);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Team WolfPack', margin + 16, yPos + 9);

    // Date
    pdf.setTextColor(...mutedColor);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    pdf.text(dateStr, pageWidth - margin, yPos + 9, { align: 'right' });

    yPos += 20;

    // Section title
    pdf.setFillColor(...cardBg);
    pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, 'F');
    pdf.setTextColor(...primaryColor);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin + 5, yPos + 7);
    yPos += 15;
  };

  // Add summary cards
  const addSummaryCards = (metrics: ReturnType<typeof calculateMetrics>, dateRange?: string) => {
    const cardWidth = (pageWidth - margin * 2 - 20) / 6;
    const cardHeight = 22;
    
    const cards = [
      { label: 'Conversion', value: formatPercent(metrics.conversion), color: successColor },
      { label: 'NRPC', value: formatCurrency(metrics.nrpc), color: primaryColor },
      { label: 'New Revenue', value: formatCurrency(metrics.newSales), color: successColor },
      { label: 'New Orders', value: metrics.newOrders.toString(), color: primaryColor },
      { label: 'New AOS', value: formatCurrency(metrics.aos), color: primaryColor },
      { label: 'Total Chats', value: metrics.totalChats.toString(), color: primaryColor },
    ];

    cards.forEach((card, i) => {
      const x = margin + i * (cardWidth + 4);
      
      // Card background
      pdf.setFillColor(...cardBg);
      pdf.roundedRect(x, yPos, cardWidth, cardHeight, 2, 2, 'F');
      
      // Top accent line
      pdf.setFillColor(...card.color);
      pdf.rect(x, yPos, cardWidth, 2, 'F');
      
      // Label
      pdf.setTextColor(...mutedColor);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(card.label, x + cardWidth / 2, yPos + 8, { align: 'center' });
      
      // Value
      pdf.setTextColor(...textColor);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(card.value, x + cardWidth / 2, yPos + 17, { align: 'center' });
    });

    yPos += cardHeight + 8;

    // Date range if available
    if (dateRange) {
      pdf.setTextColor(...mutedColor);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Report Period: ${dateRange}`, margin, yPos);
      yPos += 8;
    }
  };

  // Add charts section
  const addCharts = (salesData: SalesData[], targets: GuideTarget[], mode: 'day' | 'month') => {
    const chartWidth = (pageWidth - margin * 2 - 10) / 2;
    const chartHeight = 70;

    // Prepare data for charts
    const revenueData = salesData.map(agent => {
      const target = targets.find(t => t.name.toLowerCase() === agent.name.toLowerCase());
      return {
        label: agent.name.split(',')[0], // Use last name only
        value: agent.newRevenue,
        target: target ? (mode === 'day' ? target.targetRevenue : target.monthlyTargetRevenue) : undefined,
      };
    }).sort((a, b) => b.value - a.value).slice(0, 8);

    const pieData = salesData.map(agent => ({
      label: agent.name.split(',')[0],
      value: agent.newRevenue,
    })).sort((a, b) => b.value - a.value);

    // Generate chart images
    const barChartImage = generateBarChart(
      revenueData,
      'Revenue vs Target',
      chartWidth * 3.78, // Convert mm to pixels (96 DPI approximation)
      chartHeight * 3.78,
      true
    );

    const pieChartImage = generatePieChart(
      pieData,
      'Revenue Distribution',
      chartWidth * 3.78,
      chartHeight * 3.78
    );

    // Add bar chart
    pdf.addImage(barChartImage, 'PNG', margin, yPos, chartWidth, chartHeight);
    
    // Add pie chart
    pdf.addImage(pieChartImage, 'PNG', margin + chartWidth + 10, yPos, chartWidth, chartHeight);

    yPos += chartHeight + 10;
  };

  // Add sales table
  const addSalesTable = (salesData: SalesData[], targets: GuideTarget[], mode: 'day' | 'month') => {
    const tableData = salesData.map((agent) => {
      const target = targets.find((t) => t.name.toLowerCase() === agent.name.toLowerCase());
      const chatCount = target ? (mode === 'day' ? target.chatCount : target.monthlyChatCount) : 0;
      const targetRevenue = target ? (mode === 'day' ? target.targetRevenue : target.monthlyTargetRevenue) : 0;
      const nrpc = chatCount > 0 ? agent.newRevenue / chatCount : 0;
      const conversion = chatCount > 0 ? (agent.orders / chatCount) * 100 : 0;
      const deficit = agent.newRevenue - targetRevenue;

      return [
        agent.name,
        chatCount.toString(),
        agent.orders.toString(),
        formatCurrency(agent.newRevenue),
        formatCurrency(nrpc),
        `${conversion.toFixed(1)}%`,
        formatCurrency(targetRevenue),
        formatCurrency(deficit),
      ];
    });

    autoTable(pdf, {
      startY: yPos,
      head: [['Agent', 'Chats', 'Orders', 'Revenue', 'NRPC', 'Conv%', 'Target', 'Deficit']],
      body: tableData,
      theme: 'plain',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: textColor,
        fillColor: cardBg,
      },
      headStyles: {
        fillColor: [35, 45, 60] as [number, number, number],
        textColor: primaryColor,
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [20, 28, 40] as [number, number, number],
      },
      columnStyles: {
        0: { cellWidth: 35 },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        // Color deficit column
        if (data.column.index === 7 && data.section === 'body') {
          const value = parseFloat(data.cell.text[0].replace(/[$,]/g, ''));
          if (value < 0) {
            data.cell.styles.textColor = [239, 68, 68]; // Red
          } else if (value > 0) {
            data.cell.styles.textColor = [34, 197, 94]; // Green
          }
        }
      },
    });

    yPos = (pdf as any).lastAutoTable.finalY + 10;
  };

  // Generate PDF content
  addPageBackground();
  
  // Daily Report
  if (data.dailyData && data.dailyData.salesData.length > 0) {
    addHeader('Daily Performance Report');
    const dailyMetrics = calculateMetrics(data.dailyData.salesData, data.targets, 'day');
    addSummaryCards(dailyMetrics, data.dailyData.dateRange);
    addCharts(data.dailyData.salesData, data.targets, 'day');
    addSalesTable(data.dailyData.salesData, data.targets, 'day');
  }

  // Monthly Report - add new page
  if (data.monthlyData && data.monthlyData.salesData.length > 0) {
    pdf.addPage();
    addPageBackground();
    yPos = margin;
    
    addHeader('Monthly Performance Report');
    const monthlyMetrics = calculateMetrics(data.monthlyData.salesData, data.targets, 'month');
    addSummaryCards(monthlyMetrics, data.monthlyData.dateRange);
    addCharts(data.monthlyData.salesData, data.targets, 'month');
    addSalesTable(data.monthlyData.salesData, data.targets, 'month');
  }

  // Footer
  const addFooter = (pageNum: number, total: number) => {
    pdf.setTextColor(...mutedColor);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const footerY = pageHeight - 8;
    pdf.text('Generated by Team WolfPack Dashboard', margin, footerY);
    pdf.text(`Page ${pageNum} of ${total}`, pageWidth - margin, footerY, { align: 'right' });
  };

  // Add footer to all pages
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(i, totalPages);
  }

  // Download
  const dateStr = new Date().toISOString().split('T')[0];
  pdf.save(`wolfpack-report-${dateStr}.pdf`);
}
