// Premium "care" prescription PDF — Sage + Cream palette with serif headings.
// Experimental variant of prescriptionPdf.ts. Same data shape so call sites stay simple.
import { jsPDF } from "jspdf";
import type { PrescriptionData } from "./prescriptionPdf";

// Palette (museum-warm, sage accent)
const CREAM: [number, number, number] = [248, 244, 235];        // page tint band
const CREAM_DEEP: [number, number, number] = [241, 234, 220];   // alt row
const SAGE: [number, number, number] = [122, 155, 126];         // primary accent (#7A9B7E)
const SAGE_DEEP: [number, number, number] = [86, 117, 92];      // headings
const INK: [number, number, number] = [37, 33, 30];             // body
const INK_SOFT: [number, number, number] = [110, 102, 92];      // captions
const HAIR: [number, number, number] = [212, 204, 190];         // hairlines

export const generatePrescriptionPdfSage = (data: PrescriptionData): jsPDF => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - 2 * margin;

  // ---------- Cream page background ----------
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Outer paper card (slightly lifted)
  doc.setFillColor(253, 250, 244);
  doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - 2 * (margin - 4), "F");

  let y = margin + 4;

  // ---------- Eyebrow ----------
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SAGE_DEEP);
  doc.text("PRESCRIPTION  ·  PRIVATE & CONFIDENTIAL", pageWidth / 2, y, { align: "center" });
  y += 6;

  // ---------- Clinic name (serif heading) ----------
  doc.setFont("times", "normal"); // jsPDF built-in serif
  doc.setFontSize(24);
  doc.setTextColor(...INK);
  doc.text(data.clinicName, pageWidth / 2, y + 4, { align: "center" });
  y += 10;

  // Clinic address + contact
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...INK_SOFT);
  if (data.clinicAddress) {
    doc.text(data.clinicAddress, pageWidth / 2, y, { align: "center" });
    y += 4.5;
  }
  let contactLine = `${data.clinicPhone}`;
  if (data.clinicEmail) contactLine += `   ·   ${data.clinicEmail}`;
  doc.text(contactLine, pageWidth / 2, y, { align: "center" });
  y += 8;

  // Sage hairline divider
  doc.setDrawColor(...SAGE);
  doc.setLineWidth(0.4);
  doc.line(margin + 30, y, pageWidth - margin - 30, y);
  y += 8;

  // ---------- Patient block (two columns, label/value) ----------
  const labelValue = (label: string, value: string, x: number, yy: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...INK_SOFT);
    doc.text(label.toUpperCase(), x, yy);
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(value || "—", x, yy + 4.5);
  };

  const colA = margin;
  const colB = margin + contentWidth / 2;

  labelValue("Patient", data.patientName, colA, y);
  labelValue("Date", data.visitDate, colB, y);
  y += 11;

  labelValue("Age / Sex", `${data.patientAge} yrs · ${data.patientGender || "—"}`, colA, y);
  labelValue("Visit Type", data.visitType || "Consultation", colB, y);
  y += 11;

  labelValue("ABHA / ID", `••••  ${data.healthId.slice(-4) || "----"}`, colA, y);
  labelValue("Phone", data.patientPhone || "—", colB, y);
  y += 12;

  // ---------- Diagnosis ----------
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.setTextColor(...SAGE_DEEP);
  doc.text("Diagnosis", margin, y);
  y += 5;
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  const dxLines = doc.splitTextToSize(data.diagnosis || "—", contentWidth);
  doc.text(dxLines, margin, y);
  y += dxLines.length * 5.5 + 4;

  // ---------- Rx mark ----------
  doc.setFont("times", "italic");
  doc.setFontSize(22);
  doc.setTextColor(...SAGE_DEEP);
  doc.text("℞", margin, y + 2);
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.setTextColor(...SAGE_DEEP);
  doc.text("Prescription", margin + 10, y);
  y += 6;

  // Hairline under Rx label
  doc.setDrawColor(...HAIR);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // ---------- Medications (label-value cards, no heavy grid) ----------
  data.medications.forEach((med, i) => {
    // Alt cream row for separation
    if (i % 2 === 0) {
      doc.setFillColor(...CREAM_DEEP);
      doc.rect(margin - 2, y - 2, contentWidth + 4, 18, "F");
    }

    // Number badge
    doc.setFillColor(...SAGE);
    doc.circle(margin + 3, y + 5, 3, "F");
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`${i + 1}`, margin + 3, y + 6.2, { align: "center" });

    // Medication name (serif)
    doc.setFont("times", "normal");
    doc.setFontSize(13);
    doc.setTextColor(...INK);
    doc.text(med.name, margin + 9, y + 4);

    // Dose · Route on same line, soft ink
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK_SOFT);
    const doseLine = [med.dose, med.route || "Oral"].filter(Boolean).join("  ·  ");
    doc.text(doseLine, margin + 9, y + 9);

    // Frequency · Duration · Instruction (right side)
    const detail = [
      med.frequency,
      med.duration ? `for ${med.duration}` : "",
      med.instruction || "",
    ].filter(Boolean).join("   ·   ");
    const detailLines = doc.splitTextToSize(detail, contentWidth - 12);
    doc.text(detailLines, margin + 9, y + 13.5);

    y += 18;

    // Page break safety
    if (y > pageHeight - 60) {
      doc.addPage();
      doc.setFillColor(...CREAM);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      y = margin + 4;
    }
  });

  y += 6;

  // ---------- Advice ----------
  if (data.advice && data.advice.trim()) {
    doc.setDrawColor(...HAIR);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFont("times", "italic");
    doc.setFontSize(11);
    doc.setTextColor(...SAGE_DEEP);
    doc.text("A note from your doctor", margin, y);
    y += 5;

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    const adviceLines = doc.splitTextToSize(data.advice, contentWidth);
    doc.text(adviceLines, margin, y);
    y += adviceLines.length * 5 + 8;
  }

  // ---------- Signature block ----------
  const sigY = Math.max(y + 14, pageHeight - 50);
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - margin - 60, sigY, pageWidth - margin, sigY);

  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  const drName = data.doctorName.startsWith("Dr.") ? data.doctorName : `Dr. ${data.doctorName}`;
  doc.text(drName, pageWidth - margin, sigY + 5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK_SOFT);
  doc.text(data.doctorQualification, pageWidth - margin, sigY + 10, { align: "right" });
  if (data.doctorLicenseNumber) {
    doc.text(`Reg. No. ${data.doctorLicenseNumber}`, pageWidth - margin, sigY + 14.5, { align: "right" });
  }

  // ---------- Footer ----------
  doc.setDrawColor(...SAGE);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - margin - 4, pageWidth - margin, pageHeight - margin - 4);

  doc.setFont("times", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...SAGE_DEEP);
  doc.text("Vyana  ·  a longitudinal record of your care", pageWidth / 2, pageHeight - margin + 1, { align: "center" });

  return doc;
};

export const downloadPrescriptionPdfSage = (data: PrescriptionData) => {
  const doc = generatePrescriptionPdfSage(data);
  const fileName = `prescription_sage_${data.patientName.replace(/\s+/g, "_")}_${data.visitDate.replace(/[/\s]/g, "-")}.pdf`;
  doc.save(fileName);
};
