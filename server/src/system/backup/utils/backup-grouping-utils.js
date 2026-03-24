/**
 * @file backup-file-grouping.utils.js
 * @description
 * Provides utilities for grouping backup files and resolving group-level timestamps.
 *
 * Overview:
 * - Groups files based on timestamp proximity (tolerance window)
 * - Extracts timestamps from filenames with fallback to LastModified
 * - Provides deterministic timestamp resolution for grouped files
 *
 * Responsibilities:
 * - Group related backup artifacts into logical sets
 * - Normalize inconsistent timestamp formats
 * - Provide stable ordering inputs for retention logic
 *
 * Non-Responsibilities:
 * - Does NOT perform logging
 * - Does NOT interact with filesystem or S3
 * - Does NOT enforce retention policies
 * - Does NOT mutate input objects
 */

/**
 * Groups files by timestamp using a tolerance window.
 *
 * Files are grouped sequentially based on their extracted timestamps.
 * Timestamps are derived from:
 * 1. Filename pattern (if matched)
 * 2. Fallback to LastModified
 *
 * @param {Array<{ Key: string, LastModified?: Date }>} files - List of S3 objects or similar
 * @param {number} [toleranceMs=5000] - Max allowed time difference within a group
 * @param {Object} [options]
 * @param {RegExp} [options.pattern] - Regex to extract timestamp from filename
 *
 * @returns {Array<{
 *   timestamp: number,
 *   files: Array<{ Key: string, LastModified?: Date }>
 * }>}
 *
 * @example
 * const groups = groupFilesWithTolerance(files, 5000);
 */
const groupFilesWithTolerance = (
  files = [],
  toleranceMs = 5000,
  options = {}
) => {
  if (!Array.isArray(files)) return [];
  
  const {
    pattern = /(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/,
  } = options;
  
  //--------------------------------------------------
  // Extract timestamp from filename or fallback
  //--------------------------------------------------
  const extractTimestamp = (file) => {
    const match = file.Key?.match(pattern);
    
    if (match) {
      const parsed = new Date(match[0]).getTime();
      if (!Number.isNaN(parsed)) return parsed;
    }
    
    return file.LastModified?.getTime() ?? null;
  };
  
  //--------------------------------------------------
  // Normalize + filter valid files
  //--------------------------------------------------
  const normalized = files
    .map((file) => {
      const timestamp = extractTimestamp(file);
      return timestamp !== null ? { file, timestamp } : null;
    })
    .filter(Boolean);
  
  //--------------------------------------------------
  // Sort for deterministic grouping
  //--------------------------------------------------
  normalized.sort((a, b) => a.timestamp - b.timestamp);
  
  //--------------------------------------------------
  // Group sequentially
  //--------------------------------------------------
  const groups = [];
  let currentGroup = [];
  
  for (const item of normalized) {
    if (currentGroup.length === 0) {
      currentGroup.push(item);
      continue;
    }
    
    const lastTimestamp = currentGroup[currentGroup.length - 1].timestamp;
    
    if (item.timestamp - lastTimestamp <= toleranceMs) {
      currentGroup.push(item);
    } else {
      groups.push(currentGroup);
      currentGroup = [item];
    }
  }
  
  if (currentGroup.length) {
    groups.push(currentGroup);
  }
  
  //--------------------------------------------------
  // Return structured groups
  //--------------------------------------------------
  return groups.map((group) => ({
    timestamp: group[0].timestamp,
    files: group.map((g) => g.file),
  }));
};

/**
 * Resolves a representative timestamp for a grouped set of files.
 *
 * Priority:
 * 1. Use `.enc` file timestamp if present (preferred primary artifact)
 * 2. Otherwise, use the latest timestamp within the group
 *
 * @param {{
 *   timestamp: number,
 *   files: Array<{ Key: string, LastModified: Date|string }>
 * }} group
 *
 * @returns {number} Timestamp in milliseconds
 *
 * @example
 * const ts = getGroupTimestamp(group);
 */
const getGroupTimestamp = (group) => {
  if (!group || !Array.isArray(group.files)) return 0;
  
  const encFile = group.files.find((f) => f.Key.endsWith('.enc'));
  
  if (encFile) {
    return new Date(encFile.LastModified).getTime();
  }
  
  // Safe max without spread (avoids large array issues)
  let max = 0;
  for (const f of group.files) {
    const t = new Date(f.LastModified).getTime();
    if (t > max) max = t;
  }
  
  return max;
};

module.exports = {
  groupFilesWithTolerance,
  getGroupTimestamp,
};
