import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Ingredient } from "@/data/mockIngredients";

export interface FormulaIngredient {
  name: string;
  percentage: number;
  ingredientId?: string; // ID to look up full ingredient data
}

export interface FullIngredientData {
  name: string;
  inci: string;
  subcategory?: string;
  percentage: number;
  weight: number;
  phase: string;
  pricePerKg?: number;
  isPremium?: boolean;
  isCustom?: boolean;
}

export function generateCosmeticFormulationReport(
  ingredients: FullIngredientData[],
  batchSize: number,
  procedure: string = "",
  notes: string = "",
  formulaName: string = "Unnamed Formula",
  unitSize: number = 50,
  totalBatchCost: number = 0,
  costPerUnit: number = 0,
  totalPercentage: number = 0
): void {
  const doc = new jsPDF();
  
  // Black and white professional lab style
  const blackColor: [number, number, number] = [0, 0, 0];
  const grayColor: [number, number, number] = [128, 128, 128];
  const lightGrayColor: [number, number, number] = [240, 240, 240];

  // Header - Title
  doc.setFontSize(16);
  doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("FORMULATION & COST ANALYSIS REPORT", 14, 20);

  // Header - Formula Name, Batch Number, Date, Status
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let headerY = 28;
  
  doc.setFont("helvetica", "bold");
  doc.text("Formula Name:", 14, headerY);
  doc.setFont("helvetica", "normal");
  doc.text(formulaName, 50, headerY);
  
  headerY += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Batch Number:", 14, headerY);
  doc.setFont("helvetica", "normal");
  doc.text("________", 50, headerY);
  
  headerY += 6;
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFont("helvetica", "bold");
  doc.text("Date:", 14, headerY);
  doc.setFont("helvetica", "normal");
  doc.text(currentDate, 50, headerY);
  
  headerY += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Status:", 14, headerY);
  doc.setFont("helvetica", "bold");
  const status = totalPercentage === 100 ? "VALIDATED" : "DRAFT";
  const statusColor = totalPercentage === 100 ? blackColor : grayColor;
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(status, 50, headerY);
  doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);

  // Production Summary Section
  let summaryY = headerY + 12;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PRODUCTION SUMMARY", 14, summaryY);
  summaryY += 8;
  
  // Draw box around production summary
  const boxWidth = doc.internal.pageSize.width - 28; // 14mm margin on each side
  const boxHeight = 30;
  doc.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(14, summaryY - 2, boxWidth, boxHeight);
  
  // Production Summary Content
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let contentY = summaryY + 5;
  
  doc.setFont("helvetica", "bold");
  doc.text("Total Batch Size:", 18, contentY);
  doc.setFont("helvetica", "normal");
  doc.text(`${batchSize} g`, 70, contentY);
  
  contentY += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Unit Size:", 18, contentY);
  doc.setFont("helvetica", "normal");
  doc.text(`${unitSize} ml/g`, 70, contentY);
  
  contentY += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Total Batch Cost:", 18, contentY);
  doc.setFont("helvetica", "normal");
  doc.text(`€${totalBatchCost.toFixed(2)}`, 70, contentY);
  
  contentY += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("COST PER UNIT:", 18, contentY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`€${costPerUnit.toFixed(2)}`, 70, contentY);
  
  // Table start position after summary
  const tableStartY = summaryY + boxHeight + 10;

  // Group ingredients by phase
  const phaseOrder = ["A", "B", "C", "D", "E"];
  const ingredientsByPhase: Record<string, typeof ingredients> = {};
  
  // Initialize phases
  phaseOrder.forEach((phase) => {
    ingredientsByPhase[phase] = [];
  });

  // Group ingredients
  ingredients.forEach((ing) => {
    const phase = ing.phase || "A";
    if (!ingredientsByPhase[phase]) {
      ingredientsByPhase[phase] = [];
    }
    ingredientsByPhase[phase].push(ing);
  });

  // Prepare table data with phase headers
  const tableData: (string | number)[][] = [];

  phaseOrder.forEach((phase) => {
    const phaseIngredients = ingredientsByPhase[phase];
    if (phaseIngredients.length > 0) {
      // Add phase header row
      tableData.push([
        `PHASE ${phase}`,
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      // Add ingredients for this phase
      phaseIngredients.forEach((ing) => {
        // Add premium (P) or custom (C) indicator
        let nameWithIndicator = ing.name;
        if (ing.isPremium) {
          nameWithIndicator += " (P)";
        }
        if (ing.isCustom) {
          nameWithIndicator += " (C)";
        }
        
        const pricePerKg = ing.pricePerKg || 0;
        const rowCost = (ing.weight / 1000) * pricePerKg;
        
        tableData.push([
          nameWithIndicator,
          ing.inci,
          `${ing.percentage.toFixed(2)}%`,
          `${ing.weight.toFixed(2)}g`,
          pricePerKg > 0 ? `€${pricePerKg.toFixed(2)}` : "-",
          pricePerKg > 0 ? `€${rowCost.toFixed(2)}` : "-",
        ]);
      });
    }
  });

  // Add total row
  const totalWeight = ingredients.reduce((sum, ing) => sum + ing.weight, 0);
  tableData.push([
    "TOTAL",
    "",
    `${totalPercentage.toFixed(2)}%`,
    `${totalWeight.toFixed(2)}g`,
    "",
    `€${totalBatchCost.toFixed(2)}`,
  ]);

  // Generate table
  autoTable(doc, {
    startY: tableStartY,
    head: [["Phase", "Ingredient", "INCI", "%", "Amount (g)", "Price/kg (€)", "Row Cost (€)"]],
    body: tableData,
    theme: "grid",
    tableWidth: "auto",
    margin: { left: 15, right: 15 },
    headStyles: {
      fillColor: blackColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      lineColor: blackColor,
      lineWidth: 0.5,
      overflow: "linebreak",
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: blackColor,
      lineColor: blackColor,
      lineWidth: 0.2,
      overflow: "linebreak",
      cellPadding: 2,
      minCellHeight: 6,
    },
    columnStyles: {
      0: { cellWidth: 18, halign: "center", overflow: "linebreak" },
      1: { cellWidth: 40, fontStyle: "bold", overflow: "linebreak" },
      2: { cellWidth: 50, fontSize: 7, fontStyle: "italic", overflow: "linebreak" },
      3: { cellWidth: 15, halign: "right", overflow: "linebreak" },
      4: { cellWidth: 22, halign: "right", overflow: "linebreak" },
      5: { cellWidth: 22, halign: "right", overflow: "linebreak" },
      6: { cellWidth: 22, halign: "right", overflow: "linebreak" },
    },
    styles: {
      cellPadding: 2,
      lineColor: blackColor,
      lineWidth: 0.2,
      fontSize: 8,
      overflow: "linebreak",
      minCellHeight: 6,
    },
    didParseCell: (data) => {
      if (data.row.index === undefined) return;
      
      const rowIndex = data.row.index;
      const row = tableData[rowIndex];
      if (!row) return;
      
      const firstCellValue = String(row[0] || "");
      
      // Style phase header rows
      if (firstCellValue.startsWith("PHASE")) {
        data.cell.styles.fillColor = lightGrayColor;
        data.cell.styles.textColor = blackColor;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 8;
        data.cell.styles.lineColor = blackColor;
        data.cell.styles.lineWidth = 0.5;
        data.cell.styles.overflow = "linebreak";
      }
      
      // Style the total row
      if (firstCellValue === "TOTAL") {
        data.cell.styles.fillColor = lightGrayColor;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = blackColor;
        data.cell.styles.lineColor = blackColor;
        data.cell.styles.lineWidth = 0.5;
        data.cell.styles.overflow = "linebreak";
      }
      
      // Ensure all cells have linebreak for long text
      if (data.cell.styles) {
        data.cell.styles.overflow = "linebreak";
        data.cell.styles.minCellHeight = 6;
      }
    },
  });

  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || 45;
  let notesY = finalY + 15;

  // Add Formulation Notes section if notes exist
  if (notes && notes.trim()) {
    // Check if we need a new page
    if (notesY > doc.internal.pageSize.height - 60) {
      doc.addPage();
      notesY = 20;
    }
    
    // Section header
    doc.setFontSize(11);
    doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Formulation Notes", 14, notesY);
    notesY += 8;

    // Notes text with word wrapping
    doc.setFontSize(9);
    doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    doc.setFont("helvetica", "normal");
    
    // Split notes by newlines and add each line
    const lines = notes.split("\n");
    const pageWidth = doc.internal.pageSize.width;
    const maxWidth = pageWidth - 28; // 14mm margin on each side
    const lineHeight = 5;

    lines.forEach((line) => {
      // Handle empty lines
      if (line.trim() === "") {
        notesY += lineHeight;
        // Check if we need a new page
        if (notesY > doc.internal.pageSize.height - 30) {
          doc.addPage();
          notesY = 20;
        }
        return;
      }

      // Split long lines that exceed page width
      const splitLines = doc.splitTextToSize(line, maxWidth);
      
      splitLines.forEach((textLine: string) => {
        // Check if we need a new page
        if (notesY > doc.internal.pageSize.height - 30) {
          doc.addPage();
          notesY = 20;
        }
        doc.text(textLine, 14, notesY);
        notesY += lineHeight;
      });
    });
    notesY += 5; // Extra space after notes section
  }

  // Add Manufacturing Procedure section if procedure text exists
  let procedureY = notesY;
  if (procedure && procedure.trim()) {
    // Check if we need a new page
    if (procedureY > doc.internal.pageSize.height - 60) {
      doc.addPage();
      procedureY = 20;
    }
    
    // Section header
    doc.setFontSize(11);
    doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Manufacturing Procedure", 14, procedureY);
    procedureY += 8;

    // Procedure text with word wrapping
    doc.setFontSize(9);
    doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    doc.setFont("helvetica", "normal");
    
    // Split procedure by newlines and add each line
    const lines = procedure.split("\n");
    const pageWidth = doc.internal.pageSize.width;
    const maxWidth = pageWidth - 28; // 14mm margin on each side
    const lineHeight = 6;

    lines.forEach((line) => {
      // Handle empty lines
      if (line.trim() === "") {
        procedureY += lineHeight;
        // Check if we need a new page
        if (procedureY > doc.internal.pageSize.height - 20) {
          doc.addPage();
          procedureY = 20;
        }
        return;
      }

      // Split long lines that exceed page width
      const splitLines = doc.splitTextToSize(line, maxWidth);
      
      splitLines.forEach((textLine: string) => {
        // Check if we need a new page
        if (procedureY > doc.internal.pageSize.height - 30) {
          doc.addPage();
          procedureY = 20;
        }
        doc.text(textLine, 14, procedureY);
        procedureY += lineHeight;
      });
    });
    procedureY += 10; // Extra space after procedure section
  }

  // Signature line
  let signatureY = procedureY;
  if (signatureY > doc.internal.pageSize.height - 40) {
    doc.addPage();
    signatureY = 20;
  }
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Formulator Signature: __________", 14, signatureY);
  signatureY += 15;

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.setFont("helvetica", "italic");
    doc.text(
      "Powered by FormulaGuard Platform - Professional Cosmetics Tools",
      doc.internal.pageSize.width / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  // Save PDF
  doc.save(`formulation-cost-analysis-${formulaName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`);
}

