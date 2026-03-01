export const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  // ── Revenue categories (sales) ──────────────────────────────────────────
  services:          { label: "services",   icon: "mdi:briefcase" },
  consulting:        { label: "consulting", icon: "mdi:head-lightbulb-outline" },
  products:          { label: "products",   icon: "mdi:package-variant-closed" },
  licensing:         { label: "licensing",  icon: "mdi:file-certificate-outline" },
  // ── Expense categories (purchases) ──────────────────────────────────────
  material:          { label: "material",  icon: "solar:box-bold" },
  equipment:         { label: "equipment",  icon: "teenyicons:computer-outline" },
  software:          { label: "software",   icon: "heroicons:cpu-chip-16-solid" },
  internet:          { label: "internet",   icon: "mdi:internet" },
  telecommunication: { label: "telecommunication",    icon: "streamline-flex:satellite-dish-solid" },
  travel:            { label: "travel",     icon: "mdi:airplane" },
  education:         { label: "education",  icon: "wpf:books" },
  utilities:         { label: "utilities",  icon: "roentgen:electricity" },
  insurance:         { label: "insurance",  icon: "carbon:manage-protection" },
  taxes:             { label: "taxes",      icon: "boxicons:bank-filled" },
  other:             { label: "other",      icon: "flowbite:folder-plus-solid" },
};