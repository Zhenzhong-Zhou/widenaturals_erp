export const formatQuantityChange = (change: number) =>
  change > 0 ? `+${change.toLocaleString()}` : change.toLocaleString();

export const quantityChangeColor = (change: number) =>
  change > 0 ? 'success.main' : change < 0 ? 'error.main' : 'text.secondary';
