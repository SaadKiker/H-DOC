/**
 * Utility functions for string formatting
 */

/**
 * Cleans consultation titles by removing the "Fiche de" prefix and capitalizing the first letter
 * @param title The original title
 * @returns The cleaned title
 */
export const cleanConsultationTitle = (title: string): string => {
  if (!title) return '';
  
  // Remove "Fiche de" prefix (case-insensitive) and trim spaces
  const cleaned = title.toLowerCase().replace(/^fiche\s+de\s+/i, '');
  
  // Capitalize the first letter and return
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}; 