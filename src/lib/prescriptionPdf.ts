// Professional prescription PDF generator based on medical format
import { jsPDF } from "jspdf";

interface PrescriptionData {
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
    dosage: string;
    instruction: string;
    duration: string;
  }>;
  advice?: string;
}

export const generatePrescriptionPdf = (data: PrescriptionData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  let y = 15;

  // Helper functions
  const drawLine = (yPos: number, startX: number = margin, endX: number = pageWidth - margin) => {
    doc.setDrawColor(180, 180, 180);
    doc.line(startX, yPos, endX, yPos);
  };

  const centerText = (text: string, yPos: number, fontSize: number = 12) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, yPos);
  };

  // ============ HEADER SECTION ============
  // Clinic Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 100, 100); // Teal color
  centerText(data.clinicName, y);
  y += 7;

  // Clinic Address & Contact
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  centerText(data.clinicAddress, y);
  y += 5;
  
  const contactLine = `Phone No:- ${data.clinicPhone}${data.clinicEmail ? `, Email:- ${data.clinicEmail}` : ""}`;
  centerText(contactLine, y);
  y += 10;

  drawLine(y);
  y += 5;

  // ============ PATIENT INFO TABLE ============
  doc.setFontSize(10);
  const col1 = margin;
  const col2 = 50;
  const col3 = 95;
  const col4 = 135;
  const col5 = 160;
  const col6 = pageWidth - margin;
  
  // Row 1
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Name:", col1, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.patientName.toUpperCase(), col2, y);
  
  doc.setFont("helvetica", "bold");
  doc.text("Age/Sex:", col3, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.patientAge} YRS/${data.patientGender || "N/A"}`, col4, y);
  
  doc.setFont("helvetica", "bold");
  doc.text("Hospital ID:", col5, y);
  doc.setFont("helvetica", "normal");
  const shortId = data.healthId.slice(-4);
  doc.text(shortId, col6 - 15, y);
  y += 7;

  // Row 2
  doc.setFont("helvetica", "bold");
  doc.text("Referred By:", col1, y);
  doc.setFont("helvetica", "normal");
  doc.text("-", col2, y);
  
  doc.setFont("helvetica", "bold");
  doc.text("File No:", col3, y);
  doc.setFont("helvetica", "normal");
  doc.text("-", col4, y);
  
  doc.setFont("helvetica", "bold");
  doc.text("Email ID:", col5, y);
  doc.setFont("helvetica", "normal");
  doc.text("-", col6 - 15, y);
  y += 7;

  // Row 3
  doc.setFont("helvetica", "bold");
  doc.text("Phone Number:", col1, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.patientPhone || "-", col2, y);
  
  doc.setFont("helvetica", "bold");
  doc.text("Visit Type:", col3, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.visitType || "Consultation Visit", col4, y);
  
  doc.setFont("helvetica", "bold");
  doc.text("Visit Date:", col5, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.visitDate, col6 - 15, y);
  y += 10;

  drawLine(y);
  y += 8;

  // ============ DIAGNOSIS SECTION ============
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 0, 0); // Red color for diagnosis
  doc.setFontSize(11);
  doc.text(`Diagnosis: ${data.diagnosis}`, margin, y);
  y += 10;

  // ============ Rx SECTION ============
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Rx", margin, y);
  y += 8;

  // Medication Table Header
  const medCols = {
    num: margin,
    name: margin + 10,
    dosage: 80,
    instruction: 105,
    duration: 165,
  };

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Medication", medCols.name, y);
  doc.text("Dosage", medCols.dosage, y);
  doc.text("Instruction", medCols.instruction, y);
  doc.text("Duration", medCols.duration, y);
  y += 3;
  drawLine(y);
  y += 6;

  // Medication Rows
  doc.setFont("helvetica", "normal");
  data.medications.forEach((med, index) => {
    doc.text(`${index + 1}`, medCols.num, y);
    
    // Handle long medication names
    const medName = med.name.length > 25 ? med.name.substring(0, 25) + "..." : med.name;
    doc.text(medName, medCols.name, y);
    doc.text(med.dosage, medCols.dosage, y);
    
    // Handle long instructions
    const instruction = med.instruction.length > 35 ? med.instruction.substring(0, 35) + "..." : med.instruction;
    doc.text(instruction, medCols.instruction, y);
    doc.text(med.duration, medCols.duration, y);
    y += 10;

    // Add additional line for long medication names
    if (med.name.length > 25) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`(${med.name.substring(25)})`, medCols.name, y - 4);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
    }
  });

  y += 5;

  // ============ ADVICE SECTION ============
  if (data.advice) {
    doc.setFont("helvetica", "bold");
    doc.text("Advice:", margin, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    
    // Word wrap advice
    const adviceLines = doc.splitTextToSize(data.advice, pageWidth - 2 * margin);
    doc.text(adviceLines, margin, y);
    y += adviceLines.length * 5 + 10;
  }

  // ============ DOCTOR SIGNATURE SECTION ============
  const signatureY = Math.max(y + 30, 230);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const doctorFullName = data.doctorName.startsWith("Dr.") ? data.doctorName : `Dr. ${data.doctorName}`;
  doc.text(doctorFullName, pageWidth - margin - 60, signatureY, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(data.doctorQualification, pageWidth - margin - 60, signatureY + 5, { align: "center" });
  
  if (data.doctorLicenseNumber) {
    doc.text(`Regn. No: ${data.doctorLicenseNumber}`, pageWidth - margin - 60, signatureY + 10, { align: "center" });
  }

  // Footer line
  drawLine(280);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  centerText("Generated via Vyana AI - Digital Healthcare Platform", 285);

  return doc;
};

export const downloadPrescriptionPdf = (data: PrescriptionData) => {
  const doc = generatePrescriptionPdf(data);
  const fileName = `prescription_${data.patientName.replace(/\s+/g, "_")}_${data.visitDate.replace(/\//g, "-")}.pdf`;
  doc.save(fileName);
};
