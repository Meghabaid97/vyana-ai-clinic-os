// Centralized record categories for health_records.category
import { FileText, IndianRupee, Pill, ClipboardList, FolderOpen } from "lucide-react";

export type RecordCategory =
  | "hospital_bill"
  | "discharge_summary"
  | "prescription"
  | "report"
  | "other";

export const RECORD_CATEGORIES: { id: RecordCategory; label: string; shortLabel: string; icon: typeof FileText }[] = [
  { id: "discharge_summary", label: "Discharge Summaries", shortLabel: "Discharge", icon: FileText },
  { id: "hospital_bill", label: "Hospital Bills", shortLabel: "Bills", icon: IndianRupee },
  { id: "prescription", label: "Prescriptions", shortLabel: "Rx", icon: Pill },
  { id: "report", label: "Reports", shortLabel: "Reports", icon: ClipboardList },
  { id: "other", label: "Other", shortLabel: "Other", icon: FolderOpen },
];

// Map Claim Assistant DocCategory -> health_records.category
export function mapDocCategoryToRecord(docCategory: string): RecordCategory {
  switch (docCategory) {
    case "discharge_summary": return "discharge_summary";
    case "hospital_bill": return "hospital_bill";
    case "prescriptions": return "prescription";
    case "investigation_reports": return "report";
    case "admission_note": return "discharge_summary";
    case "insurance_claim_form":
    case "id_proof":
    case "insurance_card":
    case "other":
    default:
      return "other";
  }
}

export function getCategoryLabel(category: string): string {
  return RECORD_CATEGORIES.find(c => c.id === category)?.label ?? "Other";
}
