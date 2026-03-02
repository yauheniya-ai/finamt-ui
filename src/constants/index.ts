/**
 * Category metadata — single source of truth for all receipt categories.
 * Edit this file to add categories or change icons; no other file needs updating.
 *
 * Icons: any Iconify icon string (https://icon-sets.iconify.design/)
 */

export type CategoryMeta = { label: string; icon: string };

export const CATEGORY_META: Record<string, CategoryMeta> = {
  // ── Revenue categories (sales) ──────────────────────────────────────────
  services:          { label: "services",          icon: "mdi:briefcase" },
  consulting:        { label: "consulting",        icon: "mdi:head-lightbulb-outline" },
  products:          { label: "products",          icon: "mdi:package-variant-closed" },
  licensing:         { label: "licensing",         icon: "mdi:file-certificate-outline" },
  // ── Expense categories (purchases) ──────────────────────────────────────
  material:          { label: "material",          icon: "solar:box-bold" },
  equipment:         { label: "equipment",         icon: "teenyicons:computer-outline" },
  software:          { label: "software",          icon: "heroicons:cpu-chip-16-solid" },
  internet:          { label: "internet",          icon: "mdi:internet" },
  telecommunication: { label: "telecommunication", icon: "streamline-flex:satellite-dish-solid" },
  travel:            { label: "travel",            icon: "mdi:airplane" },
  education:         { label: "education",         icon: "wpf:books" },
  utilities:         { label: "utilities",         icon: "roentgen:electricity" },
  insurance:         { label: "insurance",         icon: "carbon:manage-protection" },
  taxes:             { label: "taxes",             icon: "boxicons:bank-filled" },
  other:             { label: "other",             icon: "flowbite:folder-plus-solid" },
};

/** Categories that belong to the Revenue (sales) section of the sidebar. */
export const REVENUE_CATS = new Set([
  "services",
  "consulting",
  "products",
  "licensing",
]);