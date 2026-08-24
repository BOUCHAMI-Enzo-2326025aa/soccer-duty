import type { DocumentCategory } from "./api";

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  IDENTITE: "Identité",
  ACADEMIQUE: "Académique",
  MEDICAL: "Médical",
  VISA: "Visa",
  SPORT: "Sport",
  FINANCIER: "Financier",
};

export const CATEGORY_BADGE_CLASSES: Record<DocumentCategory, string> = {
  IDENTITE: "bg-[#EEF4FF] text-blue-custom",
  ACADEMIQUE: "bg-[#E8F8F2] text-[#00876a]",
  MEDICAL: "bg-[#FDECEC] text-red-custom",
  VISA: "bg-[#FFF3EC] text-orange-custom",
  SPORT: "bg-[#F1EEFD] text-[#6a4fd1]",
  FINANCIER: "bg-sd-bg text-navy",
};
