/**
 * Category metadata — single source of truth for all receipt categories.
 * Edit this file to add categories or change icons.
 * Remember to update the translation in src/locales/.
 * Icons: any Iconify icon string (https://icon-sets.iconify.design/)
 */

export type CategoryMeta = { label: string; icon: string };

export const CATEGORY_META: Record<string, CategoryMeta> = {
  services:          { label: "services",          icon: "mdi:briefcase" },
  products:          { label: "products",          icon: "ant-design:product-filled" },
  material:          { label: "material",          icon: "solar:box-bold" },
  equipment:         { label: "equipment",         icon: "streamline-plump:computer-pc-desktop-solid" },
  software:          { label: "software",          icon: "heroicons:cpu-chip-16-solid" },  
  licensing:         { label: "licensing",         icon: "mdi:file-certificate" },
  telecommunication: { label: "telecommunication", icon: "streamline-flex:satellite-dish-solid" },
  travel:            { label: "travel",            icon: "mdi:airplane" },
  car:               { label: "car",               icon: "boxicons:car-filled" },
  education:         { label: "education",         icon: "wpf:books" },  
  utilities:         { label: "utilities",         icon: "roentgen:electricity" },
  insurance:         { label: "insurance",         icon: "fa:shield" },
  financial:         { label: "financial",         icon: "boxicons:bank-filled" },
  office:            { label: "office",            icon: "vaadin:office" },
  marketing:         { label: "marketing",         icon: "mdi:loudspeaker" },  
  donations:         { label: "donations",         icon: "mdi:donation" },
  other:             { label: "other",             icon: "flowbite:folder-plus-solid" },
};

export const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {

  services: [
    "freelance",
    "consulting",
    "legal",
    "accounting",
    "notary",
  ],

  products: [
    "physical_goods",
    "digital_goods",
    "merchandise",
    "samples",
  ],

  material: [
    "consumables",
    "raw_materials",
    "packaging",
    "merchandise",
  ],

  equipment: [
    "low_value_asset",
    "computer",
    "machinery",
    "furniture",
    "tools",
  ],

  software: [
    "subscriptions",
    "pay_as_you_go",
    "licenses",
    "hosting",
    "domains",
  ],

  licensing: [
    "software_licenses",
    "media_licenses",
    "other_ip",
  ],

  telecommunication: [
    "phone",
    "internet",
    "bundled",
  ],

  travel: [
    "transport",
    "accommodation",
    "meals",
    "per_diem",
    "incidental",
  ],

  car: [
    "fuel",
    "parking",
    "garage",
    "repair",
    "maintenance",
    "insurance",
    "leasing",
    "rental",
  ],

  education: [
    "courses",
    "books",
    "conferences",
    "certifications",
  ],

  utilities: [
    "electricity",
    "heating",
    "water",
    "waste",
  ],

  insurance: [
    "liability",
    "health",
    "vehicle",
    "property",
  ],

  financial: [
    "bank_fees",
    "interest",
    "loan_costs",
    "payment_fees",
  ],

  office: [
    "rent",
    "coworking",
    "storage",
    "cleaning",
    "security",
  ],

  marketing: [
    "advertising",
    "print_media",
    "trade_fairs",
    "sponsorship",
    "gifts",
  ],

  donations: [
    "charitable",
    "political",
    "church",
  ],

  other: [
    "membership_fees",
    "sundry",
  ],

};