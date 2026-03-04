/**
 * Extract fields that have changed compared to the initial values.
 *
 * Compares the current form values with the initial values and returns
 * a new object containing only the fields whose values differ.
 *
 * This is commonly used before submitting update requests to avoid
 * sending unchanged fields to the API.
 *
 * @typeParam T - Object type representing the form values
 *
 * @param initial - Initial values used to populate the form
 * @param current - Current form values
 *
 * @returns A partial object containing only the fields that changed
 */
export const getChangedFields = <T extends object>(
  initial: Partial<T>,
  current: Partial<T>
): Partial<T> => {
  const changed: Partial<T> = {};
  
  Object.keys(current).forEach((key) => {
    const typedKey = key as keyof T;
    
    if (current[typedKey] !== initial[typedKey]) {
      changed[typedKey] = current[typedKey];
    }
  });
  
  return changed;
};
