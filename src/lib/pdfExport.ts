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
        fontSize: 9,
        cellPadding: 3,
        textColor: textColor,
        fillColor: cardBg,
      },
      headStyles: {
        fillColor: [35, 45, 60] as [number, number, number],
        textColor: primaryColor,
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [20, 28, 40] as [number, number, number],
      },
      columnStyles: {
        0: { cellWidth: 40 },
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
    addSalesTable(data.dailyData.salesData, data.targets, 'day');
  }

  // Monthly Report - add new page if needed
  if (data.monthlyData && data.monthlyData.salesData.length > 0) {
    if (yPos > pageHeight - 80) {
      pdf.addPage();
      addPageBackground();
      yPos = margin;
    } else {
      yPos += 5;
    }
    
    addHeader('Monthly Performance Report');
    const monthlyMetrics = calculateMetrics(data.monthlyData.salesData, data.targets, 'month');
    addSummaryCards(monthlyMetrics, data.monthlyData.dateRange);
    addSalesTable(data.monthlyData.salesData, data.targets, 'month');
  }

  // Footer
  const addFooter = () => {
    pdf.setTextColor(...mutedColor);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const footerY = pageHeight - 8;
    pdf.text('Generated by Team WolfPack Dashboard', margin, footerY);
    pdf.text(
      `Page ${pdf.internal.pages.length - 1}`,
      pageWidth - margin,
      footerY,
      { align: 'right' }
    );
  };

  // Add footer to all pages
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter();
  }

  // Download
  const dateStr = new Date().toISOString().split('T')[0];
  pdf.save(`wolfpack-report-${dateStr}.pdf`);
}
