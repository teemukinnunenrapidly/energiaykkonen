/**
 * Utility functions for generating clean IDs from user-friendly labels
 */

/**
 * Converts a user-friendly title or label to a clean ID suitable for database storage
 * and formula references
 *
 * Examples:
 * - "Square Meters" → "square_meters"
 * - "Ceiling Height (m)" → "ceiling_height_m"
 * - "Property Details" → "property_details"
 * - "Annual Heating Cost €" → "annual_heating_cost_eur"
 */
export function generateId(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return (
    input
      .trim()
      .toLowerCase()
      // Replace common symbols with words
      .replace(/€/g, 'eur')
      .replace(/\$/g, 'usd')
      .replace(/%/g, 'percent')
      .replace(/²/g, '2')
      .replace(/³/g, '3')
      .replace(/°/g, 'degrees')
      // Remove special characters and parentheses, replace with spaces
      .replace(/[^\w\s]/g, ' ')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      .trim()
      // Replace spaces with underscores
      .replace(/\s/g, '_')
      // Remove any double underscores
      .replace(/__+/g, '_')
      // Remove leading/trailing underscores
      .replace(/^_+|_+$/g, '')
  );
}

/**
 * Generates a unique field name by checking existing field names and appending a number if needed
 */
export function generateUniqueFieldName(
  label: string,
  existingFieldNames: string[]
): string {
  const baseId = generateId(label);

  if (!baseId) {
    return 'field';
  }

  // If the ID is unique, use it as-is
  if (!existingFieldNames.includes(baseId)) {
    return baseId;
  }

  // If it exists, append a number
  let counter = 2;
  let uniqueId = `${baseId}_${counter}`;

  while (existingFieldNames.includes(uniqueId)) {
    counter++;
    uniqueId = `${baseId}_${counter}`;
  }

  return uniqueId;
}

/**
 * Generates a unique card name by checking existing card names and appending a number if needed
 */
export function generateUniqueCardName(
  title: string,
  existingCardNames: string[]
): string {
  const baseId = generateId(title);

  if (!baseId) {
    return 'card';
  }

  // If the ID is unique, use it as-is
  if (!existingCardNames.includes(baseId)) {
    return baseId;
  }

  // If it exists, append a number
  let counter = 2;
  let uniqueId = `${baseId}_${counter}`;

  while (existingCardNames.includes(uniqueId)) {
    counter++;
    uniqueId = `${baseId}_${counter}`;
  }

  return uniqueId;
}
