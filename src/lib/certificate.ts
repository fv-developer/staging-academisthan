import jsPDF from 'jspdf';

interface CertificateData {
  holderName: string;
  programTitle: string;
  certificateNumber: string;
  issuedAt: string;
  certificateType: string;
}

export function generateCertificatePDF(data: CertificateData, action: 'download' | 'view' = 'download') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(248, 245, 240); // warm bg
  doc.rect(0, 0, w, h, 'F');

  // Gold border
  doc.setDrawColor(191, 155, 86); // gold
  doc.setLineWidth(2);
  doc.rect(8, 8, w - 16, h - 16);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, w - 24, h - 24);

  // Corner decorations
  const cornerSize = 15;
  const corners = [
    [14, 14], [w - 14 - cornerSize, 14],
    [14, h - 14 - cornerSize], [w - 14 - cornerSize, h - 14 - cornerSize],
  ];
  doc.setDrawColor(191, 155, 86);
  doc.setLineWidth(0.8);
  corners.forEach(([x, y]) => {
    doc.line(x, y, x + cornerSize, y);
    doc.line(x, y, x, y + cornerSize);
    doc.line(x + cornerSize, y + cornerSize, x, y + cornerSize);
    doc.line(x + cornerSize, y + cornerSize, x + cornerSize, y);
  });

  // Header - Organization
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(150, 130, 100);
  doc.text('ACADEMISTHAN FOUNDATION', w / 2, 30, { align: 'center' });

  // Subtitle
  doc.setFontSize(8);
  doc.setTextColor(160, 140, 110);
  doc.text('Recognised Institution · Maharashtra State Board of Skill, Vocational Education and Training', w / 2, 36, { align: 'center' });
  doc.text('Institute Code: MSB010900 · Govt. of Maharashtra', w / 2, 41, { align: 'center' });

  // Gold divider
  doc.setDrawColor(191, 155, 86);
  doc.setLineWidth(0.5);
  doc.line(w / 2 - 60, 46, w / 2 + 60, 46);

  // Certificate title
  const titleText = data.certificateType === 'participation'
    ? 'CERTIFICATE OF PARTICIPATION'
    : 'CERTIFICATE OF COMPLETION';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(40, 50, 70); // navy
  doc.text(titleText, w / 2, 60, { align: 'center' });

  // "This is to certify that"
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(120, 110, 100);
  doc.text('This is to certify that', w / 2, 73, { align: 'center' });

  // Holder name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(40, 50, 70);
  doc.text(data.holderName, w / 2, 88, { align: 'center' });

  // Underline
  const nameWidth = doc.getTextWidth(data.holderName);
  doc.setDrawColor(191, 155, 86);
  doc.setLineWidth(0.5);
  doc.line(w / 2 - nameWidth / 2, 91, w / 2 + nameWidth / 2, 91);

  // Has completed text
  const actionText = data.certificateType === 'participation'
    ? 'has successfully participated in the program'
    : 'has successfully completed the program';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(120, 110, 100);
  doc.text(actionText, w / 2, 102, { align: 'center' });

  // Program title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(191, 155, 86);
  doc.text(`"${data.programTitle}"`, w / 2, 115, { align: 'center' });

  // Conducted by
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(140, 130, 120);
  doc.text('Issued by Academisthan Foundation — An MSBSVET Recognised Institution (MSB010900)', w / 2, 125, { align: 'center' });
  doc.text('Skill, Employment, Entrepreneurship & Innovation Department, Government of Maharashtra', w / 2, 130, { align: 'center' });

  // Date and certificate number
  const dateStr = new Date(data.issuedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  doc.setDrawColor(191, 155, 86);
  doc.setLineWidth(0.3);
  doc.line(w / 2 - 50, 140, w / 2 + 50, 140);

  // Left: Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 110, 100);
  doc.text('Date of Issue', 50, 152, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 70);
  doc.text(dateStr, 50, 158, { align: 'center' });

  // Center: Signature placeholder
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(100, 90, 80);
  doc.text('Deepak Mukadam', w / 2, 158, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Founder & Director, Academisthan Foundation', w / 2, 163, { align: 'center' });
  doc.setDrawColor(120, 110, 100);
  doc.setLineWidth(0.3);
  doc.line(w / 2 - 35, 154, w / 2 + 35, 154);

  // Right: Certificate number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 110, 100);
  doc.text('Certificate No.', w - 50, 152, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 70);
  doc.text(data.certificateNumber, w - 50, 158, { align: 'center' });

  // Verification
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 150, 140);
  doc.text('Verify this certificate at academisthan.lovable.app/verify', w / 2, h - 18, { align: 'center' });

  // Output based on action
  if (action === 'view') {
    const blob = doc.output('blob');
    const blobURL = URL.createObjectURL(blob);
    window.open(blobURL, '_blank');
  } else {
    doc.save(`${data.certificateNumber}.pdf`);
  }
}
