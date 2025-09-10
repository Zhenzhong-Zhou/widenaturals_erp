/**
 * Formats a packaging-material label for dropdowns and lookups.
 *
 * Output shape:
 *   "<name> — <size> • <color> • <unit>"
 *
 * Behavior:
 * - Skips any blank fields (no dangling separators).
 * - `size`: prefers `row.size`; if missing and `fallbackToDimensions` is true,
 *   derives from `length_cm`/`width_cm`/`height_cm`, e.g. "6.4×6.4×11.3 cm" or "19.6×7.0 cm".
 * - Trims extra whitespace and collapses internal spacing.
 * - Plain text only (no HTML), safe for direct UI rendering.
 *
 * @param {Object} row
 * @param {string} row.name                     - Required. Material name.
 * @param {string} [row.size]                   - Optional logical size label.
 * @param {string} [row.color]                  - Optional color.
 * @param {string} [row.unit]                   - Optional unit, e.g. "pc" / "pcs" / "m".
 * @param {number} [row.length_cm]              - Optional length (cm).
 * @param {number} [row.width_cm]               - Optional width (cm).
 * @param {number} [row.height_cm]              - Optional height (cm).
 * @param {Object} [opts]
 * @param {boolean} [opts.fallbackToDimensions=true] - Derive size from L/W/H when `size` missing.
 * @param {boolean} [opts.normalizeUnits=false]      - Normalize common unit variants (e.g., "pcs" → "pc").
 * @returns {string|null} A label string or `null` if `name` is missing.
 */
const formatPackagingMaterialLabel = (row, opts = {}) => {
  const {
    fallbackToDimensions = true,
    normalizeUnits = false,
  } = opts;
  
  const name = String(row?.name ?? '').trim();
  if (!name) return null;
  
  // Size: use provided, or optionally derive from dimensions
  let size = (row?.size && String(row.size).trim()) || null;
  
  if (!size && fallbackToDimensions) {
    const parts = [row?.length_cm, row?.width_cm, row?.height_cm]
      .filter(v => typeof v === 'number');
    if (parts.length) size = `${parts.join('×')} cm`;
  }
  
  // Color
  const color = row?.color ? String(row.color).trim() : null;
  
  // Unit (optional normalization)
  let unit = row?.unit ? String(row.unit).trim() : null;
  if (unit && normalizeUnits) {
    const map = { pcs: 'pc', piece: 'pc', pieces: 'pc' };
    unit = map[unit.toLowerCase()] || unit;
  }
  
  const suffix = [size, color, unit].filter(Boolean).join(' • ');
  return suffix ? `${name} — ${suffix}` : name;
};

module.exports = {
  formatPackagingMaterialLabel,
};
