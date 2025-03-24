export const generateUniqueKey = (
  item: Record<string, any> = {},  // Allow empty object by default
  fields: string[] = []
): string => {
  // Combine the specified fields to create a unique key
  const key = fields.map((field) => item[field] || '').join('-');
  // Add a fallback to ensure uniqueness if fields are missing or not unique
  return key || `${Math.random().toString(36).slice(2, 11)}`;
}
