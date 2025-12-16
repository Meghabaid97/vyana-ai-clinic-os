// Professional prescription PDF generator matching medical format
import { jsPDF } from "jspdf";

export interface PrescriptionData {
  // Clinic/Doctor Info
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail?: string;
  doctorName: string;
  doctorQualification: string;
  doctorLicenseNumber?: string;
  
  // Patient Info
  patientName: string;
  patientAge: number;
  patientGender?: string;
  patientPhone?: string;
  healthId: string;
  visitDate: string;
  visitType?: string;
  
  // Clinical Data
  diagnosis: string;
  medications: Array<{
    name: string;
    dose: string;
    route?: string;
    frequency: string;
    duration: string;
    instruction?: string;
  }>;
  advice?: string;
}

export const generatePrescriptionPdf = (data: PrescriptionData): jsPDF => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  const pageWidth = 210;
  const margin = 12;
  const contentWidth = pageWidth - 2 * margin;
  let y = 12;

  // Colors
  const tealColor: [number, number, number] = [0, 128, 128];
  const blackColor: [number, number, number] = [0, 0, 0];
  const grayColor: [number, number, number] = [80, 80, 80];
  const lightGray: [number, number, number] = [200, 200, 200];

  // ============ HEADER SECTION ============
  // Hospital/Clinic Name - Large and prominent
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...tealColor);
  doc.text(data.clinicName, pageWidth / 2, y, { align: "center" });
  y += 7;

  // Clinic Address
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.text(data.clinicAddress, pageWidth / 2, y, { align: "center" });
  y += 5;
  
  // Contact Info
  let contactLine = `Phone: ${data.clinicPhone}`;
  if (data.clinicEmail) {
    contactLine += `  |  Email: ${data.clinicEmail}`;
  }
  doc.text(contactLine, pageWidth / 2, y, { align: "center" });
  y += 8;

  // Header separator line
  doc.setDrawColor(...tealColor);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ============ PATIENT INFO TABLE ============
  doc.setTextColor(...blackColor);
  doc.setFontSize(10);
  
  // Row 1: Name, Age/Sex, ID
  const leftCol = margin;
  const midCol = margin + 70;
  const rightCol = margin + 140;
  
  doc.setFont("helvetica", "bold");
  doc.text("Patient Name:", leftCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.patientName.toUpperCase(), leftCol + 28, y);
  
  doc.setFont("helvetica", "bold");
  doc.text("Age/Sex:", midCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.patientAge} Yrs / ${data.patientGender || "-"}`, midCol + 18, y);
  
  doc.setFont("helvetica", "bold");
  doc.text("ID:", rightCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(`****${data.healthId.slice(-4)}`, rightCol + 8, y);
  y += 6;

  // Row 2: Phone, Visit Type, Date
  doc.setFont("helvetica", "bold");
  doc.text("Phone:", leftCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.patientPhone || "-", leftCol + 14, y);
  
  doc.setFont("helvetica", "bold");
  doc.text("Visit Type:", midCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.visitType || "Consultation", midCol + 22, y);
  
  doc.setFont("helvetica", "bold");
  doc.text("Date:", rightCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.visitDate, rightCol + 12, y);
  y += 8;

  // Patient info separator
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ============ DIAGNOSIS SECTION ============
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...tealColor);
  doc.text("Dx:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...blackColor);
  doc.setFontSize(11);
  
  // Handle multi-line diagnosis
  const diagnosisLines = doc.splitTextToSize(data.diagnosis, contentWidth - 15);
  doc.text(diagnosisLines, margin + 12, y);
  y += diagnosisLines.length * 5 + 8;

  // ============ PRESCRIPTION TABLE ============
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...tealColor);
  doc.text("Rx:", margin, y);
  y += 6;

  // Table configuration
  const tableStartY = y;
  const rowHeight = 10;
  const cols = {
    num: margin,
    drug: margin + 8,
    dose: margin + 58,
    route: margin + 85,
    freq: margin + 105,
    duration: margin + 135,
    instruction: margin + 158,
  };
  const colWidths = {
    num: 8,
    drug: 50,
    dose: 27,
    route: 20,
    freq: 30,
    duration: 23,
    instruction: 28,
  };

  // Draw table header
  doc.setFillColor(0, 128, 128);
  doc.rect(margin, y, contentWidth, rowHeight, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  y += 7;
  doc.text("#", cols.num + 2, y);
  doc.text("Drug Name", cols.drug, y);
  doc.text("Dose", cols.dose, y);
  doc.text("Route", cols.route, y);
  doc.text("Frequency", cols.freq, y);
  doc.text("Duration", cols.duration, y);
  doc.text("Instruction", cols.instruction, y);
  y += 3;

  // Draw medication rows
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...blackColor);
  doc.setFontSize(9);

  data.medications.forEach((med, index) => {
    const rowY = tableStartY + rowHeight + (index * rowHeight);
    
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(245, 250, 250);
      doc.rect(margin, rowY, contentWidth, rowHeight, "F");
    }
    
    // Draw row border
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.2);
    doc.rect(margin, rowY, contentWidth, rowHeight, "S");
    
    // Row content
    const textY = rowY + 7;
    doc.text(`${index + 1}`, cols.num + 2, textY);
    
    // Truncate long text
    const drugName = med.name.length > 22 ? med.name.substring(0, 20) + ".." : med.name;
    doc.text(drugName, cols.drug, textY);
    doc.text(med.dose || "-", cols.dose, textY);
    doc.text(med.route || "Oral", cols.route, textY);
    
    const freq = med.frequency.length > 12 ? med.frequency.substring(0, 10) + ".." : med.frequency;
    doc.text(freq, cols.freq, textY);
    doc.text(med.duration || "-", cols.duration, textY);
    
    const instr = (med.instruction || "-").length > 12 ? (med.instruction || "-").substring(0, 10) + ".." : (med.instruction || "-");
    doc.text(instr, cols.instruction, textY);
  });

  // Update Y position after table
  y = tableStartY + rowHeight + (data.medications.length * rowHeight) + 10;

  // Draw table outer border
  doc.setDrawColor(...tealColor);
  doc.setLineWidth(0.5);
  doc.rect(margin, tableStartY, contentWidth, rowHeight + (data.medications.length * rowHeight), "S");

  // ============ ADVICE SECTION ============
  if (data.advice && data.advice.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...tealColor);
    doc.text("Advice:", margin, y);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...blackColor);
    const adviceLines = doc.splitTextToSize(data.advice, contentWidth);
    doc.text(adviceLines, margin + 18, y);
    y += adviceLines.length * 5 + 15;
  } else {
    y += 15;
  }

  // ============ SIGNATURE SECTION ============
  const signatureX = pageWidth - margin - 45;
  const signatureY = Math.max(y + 20, 240);
  
  // Signature line
  doc.setDrawColor(...blackColor);
  doc.setLineWidth(0.3);
  doc.line(signatureX - 10, signatureY - 3, signatureX + 50, signatureY - 3);
  
  // Doctor name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...blackColor);
  const doctorFullName = data.doctorName.startsWith("Dr.") ? data.doctorName : `Dr. ${data.doctorName}`;
  doc.text(doctorFullName, signatureX + 20, signatureY, { align: "center" });
  
  // Doctor qualification
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text(data.doctorQualification, signatureX + 20, signatureY + 5, { align: "center" });
  
  // License number
  if (data.doctorLicenseNumber) {
    doc.text(`Reg. No: ${data.doctorLicenseNumber}`, signatureX + 20, signatureY + 10, { align: "center" });
  }

  // ============ FOOTER ============
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.3);
  doc.line(margin, 282, pageWidth - margin, 282);
  
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text("Generated via Vyana AI - Digital Healthcare Platform", pageWidth / 2, 287, { align: "center" });

  return doc;
};

export const downloadPrescriptionPdf = (data: PrescriptionData) => {
  const doc = generatePrescriptionPdf(data);
  const fileName = `prescription_${data.patientName.replace(/\s+/g, "_")}_${data.visitDate.replace(/[/\s]/g, "-")}.pdf`;
  doc.save(fileName);
};
