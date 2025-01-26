export function generateUniqueKey(
  item: Record<string, any>,
  fields: string[] = []
): string {
  // Combine the specified fields to create a unique key
  const key = fields.map((field) => item[field] || '').join('-');
  // Add a fallback to ensure uniqueness if fields are missing or not unique
  return key || `${Math.random().toString(36).substr(2, 9)}`;
}
