/**
 * Category metadata — single source of truth for all receipt categories.
 * Edit this file to add categories or change icons.
 * Remember to update the translation in src/locales/.
 * Icons: any Iconify icon string (https://icon-sets.iconify.design/)
 */

export type CategoryMeta = { label: string; icon: string };

export const CATEGORY_META: Record<string, CategoryMeta> = {
  services:          { label: "services",          icon: "mdi:briefcase" },
  products:          { label: "products",          icon: "mdi:package-variant-closed" },
  material:          { label: "material",          icon: "solar:box-bold" },
  equipment:         { label: "equipment",         icon: "teenyicons:computer-outline" },
  software:          { label: "software",          icon: "heroicons:cpu-chip-16-solid" },  
  licensing:         { label: "licensing",         icon: "mdi:file-certificate-outline" },
  telecommunication: { label: "telecommunication", icon: "streamline-flex:satellite-dish-solid" },
  travel:            { label: "travel",            icon: "mdi:airplane" },
  car:               { label: "car",               icon: "boxicons:car-filled" },
  education:         { label: "education",         icon: "wpf:books" },  
  utilities:         { label: "utilities",         icon: "roentgen:electricity" },
  insurance:         { label: "insurance",         icon: "carbon:manage-protection" },
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
    "other_ip"        
  ],

  telecommunication: [
    "phone",
    "internet",
    "bundled"       
  ],

  travel: [
    "transport",       
    "accommodation",   
    "meals",         
    "incidental"      
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
    "payment_fees" 
  ],

  office: [
    "rent",
    "coworking",
    "storage",    
    "cleaning",
    "security",
  ],

};