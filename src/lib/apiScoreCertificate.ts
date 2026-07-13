import jsPDF from 'jspdf';

export interface APIScoreCertificateData {
  holderName: string;
  membershipId: string;
  totalScore: number;
  maxScore: number;
  cat1Score: number;
  cat1Max: number;
  cat2Score: number;
  cat2Max: number;
  cat3Score: number;
  cat3Max: number;
  designation?: string;
  institution?: string;
  date: string;
}

function drawGoldLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, width = 0.5) {
  doc.setDrawColor(191, 155, 86);
  doc.setLineWidth(width);
  doc.line(x1, y1, x2, y2);
}

export function generateAPIScoreCertificate(data: APIScoreCertificateData): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const cx = w / 2;

  // === Background ===
  doc.setFillColor(248, 245, 240);
  doc.rect(0, 0, w, h, 'F');

  // === Outer gold border ===
  doc.setDrawColor(191, 155, 86);
  doc.setLineWidth(2.5);
  doc.rect(6, 6, w - 12, h - 12);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, w - 20, h - 20);

  // === Inner decorative border ===
  doc.setDrawColor(191, 155, 86);
  doc.setLineWidth(0.3);
  doc.rect(14, 14, w - 28, h - 28);

  // === Corner flourishes ===
  const cs = 12;
  const corners = [
    [16, 16], [w - 16 - cs, 16],
    [16, h - 16 - cs], [w - 16 - cs, h - 16 - cs],
  ];
  doc.setLineWidth(1);
  corners.forEach(([x, y]) => {
    doc.line(x, y, x + cs, y);
    doc.line(x, y, x, y + cs);
    doc.line(x + cs, y + cs, x, y + cs);
    doc.line(x + cs, y + cs, x + cs, y);
  });

  // === Header: Organization ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(191, 155, 86);
  doc.text('ACADEMISTHAN', cx, 28, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(140, 130, 110);
  doc.text('Of the Teachers, By the Teachers, For the Teachers', cx, 33, { align: 'center' });

  drawGoldLine(doc, cx - 50, 36, cx + 50, 36, 0.3);

  // === Title ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(40, 50, 70);
  doc.text('UGC ACADEMIC & RESEARCH SCORE', cx, 46, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(140, 130, 110);
  doc.text('Self-Assessment Report · UGC Regulations 2018 (4th Amendment)', cx, 52, { align: 'center' });

  drawGoldLine(doc, cx - 50, 55, cx + 50, 55, 0.3);

  // === "This is to certify that" ===
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(120, 110, 100);
  doc.text('This is to certify that', cx, 63, { align: 'center' });

  // === Holder Name ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(40, 50, 70);
  doc.text(data.holderName || 'Educator', cx, 76, { align: 'center' });

  const nameW = doc.getTextWidth(data.holderName || 'Educator');
  drawGoldLine(doc, cx - nameW / 2 - 5, 79, cx + nameW / 2 + 5, 79, 0.5);

  // === Designation & Institution ===
  let yPos = 86;
  if (data.designation || data.institution) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 90, 80);
    const parts = [data.designation, data.institution].filter(Boolean).join(', ');
    doc.text(parts, cx, yPos, { align: 'center' });
    yPos += 6;
  }

  // === Membership ===
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 140, 120);
  doc.text(`Fellow ID: ${data.membershipId}`, cx, yPos, { align: 'center' });
  yPos += 8;

  // === Score announcement ===
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 90, 80);
  doc.text('has self-declared a UGC 2018 Academic & Research Score of', cx, yPos, { align: 'center' });
  yPos += 10;

  // === Big Score ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(42);
  doc.setTextColor(191, 155, 86);
  doc.text(`${data.totalScore}`, cx - 5, yPos + 2, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.setTextColor(140, 130, 110);
  doc.text(`/ ${data.maxScore}`, cx, yPos, { align: 'left' });
  yPos += 10;

  const percentage = Math.round((data.totalScore / data.maxScore) * 100);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(40, 50, 70);
  doc.text(`(${percentage}%)`, cx, yPos, { align: 'center' });
  yPos += 8;

  // === Category Breakdown Table ===
  const tableX = cx - 65;
  const tableW = 130;
  const rowH = 8;
  const cols = [0, 65, 95, tableW]; // col positions relative to tableX

  // Header row
  doc.setFillColor(40, 50, 70);
  doc.rect(tableX, yPos, tableW, rowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(248, 245, 240);
  doc.text('CATEGORY', tableX + 4, yPos + 5.5);
  doc.text('SCORE', tableX + cols[1] + 4, yPos + 5.5);
  doc.text('PERCENTAGE', tableX + cols[2] + 4, yPos + 5.5);
  yPos += rowH;

  const categories = [
    { label: 'Teaching Performance (UGC Table 2)', score: data.cat1Score, max: data.cat1Max },
    { label: 'Research Score (UGC Table 3A)',      score: data.cat2Score, max: data.cat2Max },
    { label: 'Other Academic Contributions',       score: data.cat3Score, max: data.cat3Max },
  ];

  categories.forEach((cat, i) => {
    const bg = i % 2 === 0 ? [245, 240, 232] : [240, 235, 226];
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(tableX, yPos, tableW, rowH, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 70);
    doc.text(cat.label, tableX + 4, yPos + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.text(`${cat.score} / ${cat.max}`, tableX + cols[1] + 4, yPos + 5.5);

    const pct = cat.max > 0 ? Math.round((cat.score / cat.max) * 100) : 0;
    doc.text(`${pct}%`, tableX + cols[2] + 4, yPos + 5.5);

    yPos += rowH;
  });

  // Table border
  doc.setDrawColor(191, 155, 86);
  doc.setLineWidth(0.3);
  doc.rect(tableX, yPos - rowH * 4, tableW, rowH * 4);

  yPos += 6;

  // === Footer section ===
  drawGoldLine(doc, cx - 60, yPos, cx + 60, yPos, 0.3);
  yPos += 6;

  // Date
  const dateStr = new Date(data.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 110, 100);
  doc.text('Date of Assessment', 55, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 70);
  doc.text(dateStr, 55, yPos + 5);

  // Signature
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(80, 70, 60);
  drawGoldLine(doc, cx - 25, yPos - 1, cx + 25, yPos - 1, 0.3);
  doc.text('Academisthan Foundation', cx, yPos + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Verified Digital Assessment', cx, yPos + 8, { align: 'center' });

  // Membership ID
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 110, 100);
  doc.text('Fellow ID', w - 55, yPos, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 70);
  doc.text(data.membershipId, w - 55, yPos + 5, { align: 'center' });

  // === Bottom disclaimer ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(160, 145, 130);
  doc.text('DISCLAIMER', cx, h - 24, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(170, 160, 145);
  doc.text('This is a SELF-ASSESSMENT certificate based on data entered by the user. Scores have NOT been verified by Academisthan Foundation, UGC, MSBSVET, or any regulatory body.', cx, h - 20, { align: 'center' });
  doc.text('It is for PERSONAL REFERENCE ONLY and holds no legal, academic or regulatory validity. Final API / Research Score is determined by your university IQAC and Statutory Selection Committee.', cx, h - 16, { align: 'center' });
  doc.text('Based on UGC Regulations 2018 (4th Amendment), Tables 2 & 3A. Cross-verify with the latest UGC notifications at ugc.gov.in before submission.', cx, h - 12, { align: 'center' });
  doc.text('Powered by Academisthan — Of the Teachers, By the Teachers, For the Teachers | academisthan.org', cx, h - 8, { align: 'center' });

  return doc;
}
