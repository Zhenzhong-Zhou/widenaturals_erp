/**
 * Groups files based on their timestamp extracted from filenames, allowing for slight differences in timestamp.
 * Useful when files from the same backup operation are generated with small time differences (e.g., .enc, .iv, .sha256 files).
 *
 * @param {Array} files - Array of files to group. Each file object should have a 'Key' property (string) and 'LastModified' property (Date).
 * @param {number} [toleranceMs=5000] - Tolerance in milliseconds for grouping files. Defaults to 5000 ms (5 seconds).
 * @returns {Array<Array<Object>>} - An array of grouped files. Each group is an array of file objects related to a single backup operation.
 *
 * @example
 * const files = [
 *   { Key: 'backups/example-2025-03-25T21-13-10-756Z.sql.enc', LastModified: new Date() },
 *   { Key: 'backups/example-2025-03-25T21-13-10-756Z.sql.enc.iv', LastModified: new Date() },
 *   { Key: 'backups/example-2025-03-25T21-13-10-756Z.sql.enc.sha256', LastModified: new Date() },
 * ];
 *
 * const groups = groupFilesWithTolerance(files, 10000);
 * console.log(groups);
 */
const groupFilesWithTolerance = (files, toleranceMs = 5000) => { // Tolerance in milliseconds
  const groups = [];
  
  files.forEach(file => {
    // Extract timestamp from the filename
    const timestampMatch = file.Key.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
    if (!timestampMatch) return; // Skip files without timestamp
    
    const fileTimestamp = new Date(timestampMatch[0]).getTime();
    let foundGroup = false;
    
    for (const group of groups) {
      const groupTimestamp = group[0].timestamp;
      
      // Compare timestamps with tolerance
      if (Math.abs(fileTimestamp - groupTimestamp) <= toleranceMs) {
        group.push({ ...file, timestamp: fileTimestamp });
        foundGroup = true;
        break;
      }
    }
    
    // If no suitable group is found, create a new one
    if (!foundGroup) {
      groups.push([{ ...file, timestamp: fileTimestamp }]);
    }
  });
  
  return groups;
};

module.exports = {
  groupFilesWithTolerance,
};
