const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const { formatValue } = require('./date-utils');
const { isUUID } = require('./id-utils');
const { formatHeader, processHeaders } = require('./string-utils');
const AppError = require('../utils/AppError');
const {
  logSystemInfo,
  logSystemError,
  logSystemWarn,
} = require('./system-logger');
const { generateTimestampedFilename } = require('./name-utils');

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
  const context = 'export-to-csv';

  try {
    const { formattedHeaders, columnMap } = processHeaders(data);

    // Transform Data (Apply Formatting)
    const formattedData = data.map((row) => {
      const formattedRow = {};
      formattedHeaders.forEach((header) => {
        const originalKey = columnMap[header]; // Get original key from formatted header
        const value = row[originalKey] || ''; // Get value or empty string
        formattedRow[header] = formatValue(value, timezone); // Format values properly
      });
      return formattedRow;
    });

    // Generate CSV
    const parser = new Parser({ fields: formattedHeaders });
    const csv = parser.parse(formattedData);

    logSystemInfo('CSV export completed successfully.', {
      context,
      rowCount: data.length,
      columns: formattedHeaders.length,
    });

    return Buffer.from(csv, 'utf-8'); // Return as buffer for download
  } catch (error) {
    logSystemError('Failed to export data to CSV.', {
      context,
      rowCount: data?.length || 0,
    });
    throw error;
  }
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
  const {
    title = 'Report',
    fontSize = 12,
    includeIndex = true,
    landscape = false,
    summary = false,
    timezone = 'PST',
  } = options;

  const context = 'export-to-pdf';

  return new Promise((resolve, reject) => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        logSystemInfo('No data provided. Returning empty PDF buffer.', {
          context,
        });
        return resolve(Buffer.from('No data available', 'utf-8'));
      }

      const doc = new PDFDocument({
        size: landscape ? 'A4' : 'LETTER',
        layout: landscape ? 'landscape' : 'portrait',
        margin: 50,
      });

      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const output = Buffer.concat(buffers);
        logSystemInfo('PDF export completed successfully.', {
          context,
          rowCount: data.length,
          summary,
        });
        resolve(output);
      });

      doc.on('error', (err) => {
        logSystemError('PDF generation failed.', {
          context,
        });
        reject(err);
      });

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

          Object.entries(columnMap).forEach(
            ([formattedHeader, originalKey]) => {
              const value = formatValue(row[originalKey] || 'N/A', timezone);
              doc.fontSize(fontSize - 1).text(`${formattedHeader}: ${value}`);
            }
          );

          doc.moveDown(1);
        });

        return doc.end(); // Important: do not return a value here — `resolve` is called in .on('end')
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
          let value = formatValue(row[originalKey] || 'N/A', timezone);

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
    } catch (error) {
      logSystemError('PDF generation failed (outer catch).', {
        context,
      });
      reject(error);
    }
  });
};

/**
 * Converts an array of JSON objects to a formatted plain text buffer.
 * - Removes `id` and UUID fields to avoid unnecessary identifiers.
 * - Formats headers by capitalizing and removing underscores.
 * - Formats values such as dates, numbers, and booleans for readability.
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
 * const buffer = exportToPlainText(data, ',', 'EST');
 * console.log(buffer.toString());
 */
const exportToPlainText = (data, separator = ' | ', timezone = 'PST') => {
  const context = 'export-to-plaintext';

  try {
    if (!Array.isArray(data) || data.length === 0) {
      logSystemInfo('No data provided. Returning empty plain text buffer.', {
        context,
      });
      return Buffer.from('No data available', 'utf-8');
    }

    const { formattedHeaders, columnMap } = processHeaders(data);

    // Create a header row
    let text = formattedHeaders.join(separator) + '\n';
    text += '-'.repeat(text.length) + '\n'; // Separator line

    // Generate row data
    text += data
      .map((row) =>
        formattedHeaders
          .map((header) =>
            formatValue(row[columnMap[header]] || 'N/A', timezone)
          )
          .join(separator)
      )
      .join('\n');

    logSystemInfo('Plain text export completed successfully.', {
      context,
      rowCount: data.length,
      separator,
    });

    return Buffer.from(text, 'utf-8');
  } catch (error) {
    logSystemError('Failed to export data as plain text.', {
      context,
    });
    throw error;
  }
};

/**
 * Export data to XLSX buffer using SheetJS
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} [sheetName='Export'] - Sheet name
 * @param {string} [timezone='UTC'] - Optional timezone for formatting
 * @returns {Buffer}
 */
const exportToXLSX = (data, sheetName = 'Export', timezone = 'UTC') => {
  const context = 'export-to-xlsx';

  try {
    let worksheet;

    if (!Array.isArray(data) || data.length === 0) {
      worksheet = XLSX.utils.aoa_to_sheet([['No data available']]);
    } else {
      const headers = Object.keys(data[0]);
      const formattedData = data.map((row) =>
        headers.map((key) => formatValue(row[key], timezone))
      );
      worksheet = XLSX.utils.aoa_to_sheet([headers, ...formattedData]);
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    logSystemInfo('XLSX export completed.', {
      context,
      rowCount: data.length,
      columnCount: data[0] ? Object.keys(data[0]).length : 0,
    });

    return buffer;
  } catch (error) {
    logSystemError('XLSX export failed.', {
      context,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Exports data in the specified format (CSV, PDF, TXT, XLSX).
 *
 * This function handles both exporting data and generating empty exports if no data is available.
 * Supported formats: 'csv', 'pdf', 'txt', 'xlsx'.
 *
 * @async
 * @param {Object} options - The export configuration.
 * @param {Array} options.data - The data to be exported.
 * @param {string} options.exportFormat - The format for export ('csv', 'pdf', 'txt', 'xlsx').
 * @param {string} options.filename - The base filename without extension.
 * @param {string} [options.title=''] - Optional title (used for PDFs).
 * @returns {Promise<Object>} - An object containing `fileBuffer`, `contentType`, and `filename`.
 * @throws {Error} - If an invalid export format is provided.
 */
const exportData = async ({
  data,
  exportFormat,
  filename,
  title = '',
  landscape,
  summary,
}) => {
  const context = 'export-data';

  try {
    logSystemInfo(
      `Generating ${exportFormat.toUpperCase()} export: ${filename}`,
      {
        context,
      }
    );

    // Handle empty data
    if (!data || data.length === 0) {
      logSystemWarn('No data available for export. Generating empty file.', {
        context,
        exportFormat,
      });
      return generateEmptyExport(exportFormat, filename, landscape, summary);
    }

    return generateExport(
      exportFormat,
      data,
      filename,
      title,
      landscape,
      summary
    );
  } catch (error) {
    logSystemError('Failed to export data.', {
      context,
      exportFormat,
      filename,
    });
    throw error;
  }
};

/**
 * Creates an empty Excel workbook with a single sheet and default message.
 * @param {string} message - Message to show in the first cell.
 * @returns {Buffer} - XLSX file buffer
 */
const createEmptyWorkbook = (message = 'No Data') => {
  const worksheet = XLSX.utils.aoa_to_sheet([[message]]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Generates an empty export file for supported formats.
 *
 * @param {string} format - Export format (csv, pdf, txt, xlsx)
 * @param {string} filename - Desired filename without extension
 * @param {boolean} [landscape]
 * @param {boolean} [summary]
 * @returns {object} { fileBuffer, contentType, filename }
 */
const generateEmptyExport = (format, filename, landscape, summary) => {
  const context = 'generate-empty-export';
  const emptyMessage = 'No data available for export.';
  let fileBuffer, contentType;

  logSystemWarn(`Creating empty export for format: ${format}`, {
    context,
    filename,
  });

  switch (format.toLowerCase()) {
    case 'csv':
      fileBuffer = Buffer.from(emptyMessage, 'utf-8');
      contentType = 'text/csv';
      filename = `empty_${generateTimestampedFilename(filename)}.csv`;
      break;

    case 'pdf':
      fileBuffer = exportToPDF([], {
        title: 'Empty Report',
        landscape,
        summary,
      });
      contentType = 'application/pdf';
      filename = `empty_${generateTimestampedFilename(filename)}.pdf`;
      break;

    case 'txt':
      fileBuffer = Buffer.from(emptyMessage, 'utf-8');
      contentType = 'text/plain';
      filename = `empty_${generateTimestampedFilename(filename)}.txt`;
      break;

    case 'xlsx': {
      fileBuffer = createEmptyWorkbook('No data available');
      contentType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `empty_${generateTimestampedFilename(filename)}.xlsx`;
      break;
    }

    default:
      throw AppError.validationError(
        'Invalid export format. Use "csv", "pdf", "txt", or "xlsx".',
        { context }
      );
  }

  return { fileBuffer, contentType, filename };
};

/**
 * Generates a data export file in the specified format.
 *
 * @param {string} format - Export format ('csv', 'pdf', 'txt', 'xlsx')
 * @param {Array<Object>} data - Array of data objects to export
 * @param {string} filename - Base filename (without extension)
 * @param {string} [title] - Optional title for PDF exports
 * @param {boolean} [landscape] - PDF landscape mode
 * @param {boolean} [summary] - Summary mode for PDF
 * @returns {Promise<{ fileBuffer: Buffer, contentType: string, filename: string }>}
 */
const generateExport = async (
  format,
  data,
  filename,
  title,
  landscape,
  summary
) => {
  const context = 'generate-export';
  logSystemInfo(`Starting export file generation: ${format}`, {
    context,
    filename,
  });

  try {
    let fileBuffer, contentType;

    switch (format.toLowerCase()) {
      case 'csv':
        fileBuffer = exportToCSV(data);
        contentType = 'text/csv';
        filename += '.csv';
        break;

      case 'pdf':
        fileBuffer = await exportToPDF(data, { title, landscape, summary });
        contentType = 'application/pdf';
        filename += '.pdf';
        break;

      case 'txt':
        fileBuffer = exportToPlainText(data, ' | ');
        contentType = 'text/plain';
        filename += '.txt';
        break;

      case 'xlsx':
        fileBuffer = exportToXLSX(data);
        contentType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename += '.xlsx';
        break;

      default:
        throw AppError.validationError(
          'Invalid export format. Supported formats: csv, pdf, txt, xlsx.',
          { context }
        );
    }

    logSystemInfo(`Export generation complete: ${filename}`, { context });
    return { fileBuffer, contentType, filename };
  } catch (error) {
    logSystemError(`Export generation failed: ${error.message}`, {
      context,
      format,
      filename,
    });
    throw error;
  }
};

module.exports = {
  exportToCSV,
  exportToPDF,
  exportToPlainText,
  exportToXLSX,
  exportData,
  generateEmptyExport,
  generateExport,
};
