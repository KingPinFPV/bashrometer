// Category mapping between English keys and Hebrew values
// This ensures consistent data handling between frontend forms and backend database

export const CATEGORY_MAPPING = {
  'beef': 'בקר',
  'chicken': 'עוף', 
  'lamb': 'טלה',
  'turkey': 'הודו',
  'duck': 'ברווז',
  'veal': 'עגל',
  'goat': 'עז',
  'organ': 'איברים'
} as const;

export type EnglishCategory = keyof typeof CATEGORY_MAPPING;
export type HebrewCategory = typeof CATEGORY_MAPPING[EnglishCategory];

// Convert English category key to Hebrew value for API submission
export const getCategoryHebrew = (english: string): string => {
  return (CATEGORY_MAPPING as Record<string, string>)[english] || english;
};

// Convert Hebrew category value to English key for form handling
export const getCategoryEnglish = (hebrew: string): string => {
  return Object.keys(CATEGORY_MAPPING).find(key => 
    (CATEGORY_MAPPING as Record<string, string>)[key] === hebrew
  ) || hebrew;
};

// Get all categories as options for select components
export const getCategoryOptions = () => {
  return Object.entries(CATEGORY_MAPPING).map(([english, hebrew]) => ({
    value: english,
    label: hebrew
  }));
};

// Validate if a category is supported
export const isValidCategory = (category: string): boolean => {
  return Object.keys(CATEGORY_MAPPING).includes(category) || 
         Object.values(CATEGORY_MAPPING).includes(category);
};