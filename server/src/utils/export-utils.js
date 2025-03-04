const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const { formatValue } = require('./date-utils');
const { isUUID } = require('./id-utils');
const { formatHeader, processHeaders } = require('./string-utils');

/**
 * Convert JSON data to CSV format.
 * - Removes `id` and UUID fields.
 * - Formats headers (capitalize, remove underscores).
 * - Formats dates, numbers, and booleans.
 *
 * @param {Array<Object>} data - Array of objects to export.
 * @param {string} [timezone='PST'] - Timezone label for date formatting.
 * @returns {Buffer} - CSV file buffer.
 */
const exportToCSV = (data, timezone = 'PST') => {
  const { formattedHeaders, columnMap } = processHeaders(data);

  // **Transform Data (Apply Formatting)**
  const formattedData = data.map((row) => {
    let formattedRow = {};
    formattedHeaders.forEach((header) => {
      const originalKey = columnMap[header]; // Get original key from formatted header
      let value = row[originalKey] || ''; // Get value or empty string
      formattedRow[header] = formatValue(value, timezone); // Format values properly
    });
    return formattedRow;
  });

  // **Generate CSV**
  const parser = new Parser({ fields: formattedHeaders });
  const csv = parser.parse(formattedData);

  return Buffer.from(csv, 'utf-8'); // Return as buffer for download
};

/**
 * Convert JSON data to a structured PDF file buffer (checking data types dynamically).
 *
 * @param {Array<Object>} data - Array of objects to export.
 * @param {Object} options - PDF configuration options.
 * @param {string} [options.title='Report'] - Title of the PDF.
 * @param {number} [options.fontSize=12] - Base font size.
 * @param {boolean} [options.includeIndex=true] - Whether to include row numbers.
 * @param {boolean} [options.landscape=false] - Whether to use landscape mode.
 * @param {boolean} [options.summary=false] - Whether to use summary-style layout.
 * @param {string} [options.timezone='PST'] - Timezone label (default: PST).
 * @returns {Promise<Buffer>} - PDF file buffer.
 */
const exportToPDF = async (data, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      title = 'Report',
      fontSize = 12,
      includeIndex = true,
      landscape = false,
      summary = false,
      timezone = 'PST',
    } = options;

    if (!Array.isArray(data) || data.length === 0) {
      return resolve(Buffer.from('No data available', 'utf-8'));
    }

    const doc = new PDFDocument({
      size: landscape ? 'A4' : 'LETTER',
      layout: landscape ? 'landscape' : 'portrait',
      margin: 50,
    });

    let buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Title
    doc.fontSize(18).text(title, { align: 'center' }).moveDown(2);

    // Extract column headers dynamically (EXCLUDING UUID fields)
    const columnMap = Object.keys(data[0])
      .filter((key) => !isUUID(data[0][key])) // Remove UUIDs
      .reduce((acc, key) => {
        acc[formatHeader(key)] = key; // Map formatted header -> original key
        return acc;
      }, {});

    const headers = Object.keys(columnMap); // Get formatted headers

    // If `summary` is enabled, use summary formatting
    if (summary) {
      data.forEach((row, index) => {
        doc
          .fontSize(fontSize + 1)
          .text(`Record ${index + 1}:`, { underline: true })
          .moveDown(0.5);

        Object.entries(columnMap).forEach(([formattedHeader, originalKey]) => {
          let value = row[originalKey] || 'N/A';
          value = formatValue(value, timezone);

          doc.fontSize(fontSize - 1).text(`${formattedHeader}: ${value}`);
        });

        doc.moveDown(1);
      });

      doc.end();
      return;
    }

    // Column Width Calculation
    const maxWidth = landscape ? 750 : 500;
    const columnWidths = headers.map(() =>
      Math.floor(maxWidth / headers.length)
    );

    // Table Header
    doc.fontSize(fontSize + 1).fillColor('black');
    headers.forEach((header, i) => {
      doc.text(header.padEnd(columnWidths[i] / 6, ' '), {
        underline: true,
        continued: i !== headers.length - 1,
      });
    });
    doc.moveDown(1);

    // Table Data (Formatted)
    data.forEach((row, index) => {
      doc.text(' ', { continued: false });

      headers.forEach((formattedHeader, i) => {
        const originalKey = columnMap[formattedHeader];
        let value = row[originalKey] || 'N/A';
        value = formatValue(value, timezone);

        const textValue =
          typeof value === 'number'
            ? value.toString().padStart(columnWidths[i] / 6, ' ')
            : value;
        doc.text(
          includeIndex && i === 0 ? `${index + 1}. ${textValue}` : textValue,
          {
            continued: i !== headers.length - 1,
          }
        );
      });
    });

    doc.end();
  });
};

/**
 * Converts an array of JSON objects to a formatted plain text buffer.
 * - **Removes `id` and UUID fields** to avoid unnecessary identifiers.
 * - **Formats headers** by capitalizing and removing underscores.
 * - **Formats values** such as dates, numbers, and booleans for readability.
 *
 * @param {Array<Object>} data - The array of objects to be converted into plain text.
 * @param {string} [separator=' | '] - The separator used between column values (default: `" | "`).
 * @param {string} [timezone='PST'] - The timezone label for formatting date values (default: `"PST"`).
 * @returns {Buffer} - A buffer containing the plain text representation of the data.
 *
 * @throws {Error} If the provided data is not an array or is empty.
 *
 * @example
 * const data = [
 *   { item_name: 'Product A', adjustment_type: 'Added', new_quantity: 100, adjustment_date: '2025-02-28T10:00:00Z' },
 *   { item_name: 'Product B', adjustment_type: 'Removed', new_quantity: 50, adjustment_date: '2025-02-28T12:30:00Z' }
 * ];
 *
 * // Convert JSON to plain text with default separator (" | ")
 * const buffer = exportToPlainText(data);
 * console.log(buffer.toString());
 *
 * @example
 * // Using a custom separator (", ") and timezone ("EST")
 * const buffer = exportToPlainText(data, ', ', 'EST');
 * console.log(buffer.toString());
 */
const exportToPlainText = (data, separator = ' | ', timezone = 'PST') => {
  const { formattedHeaders, columnMap } = processHeaders(data);

  // **Create a header row**
  let text = formattedHeaders.join(separator) + '\n';
  text += '-'.repeat(text.length) + '\n'; // Separator line

  // **Generate row data**
  text += data
    .map((row) =>
      formattedHeaders
        .map((header) => formatValue(row[columnMap[header]] || 'N/A', timezone)) // Format values properly
        .join(separator)
    )
    .join('\n');

  return Buffer.from(text, 'utf-8'); // Return as buffer for download
};

module.exports = {
  exportToCSV,
  exportToPDF,
  exportToPlainText,
};
