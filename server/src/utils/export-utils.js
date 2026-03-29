/**
 * @file export-utils.js
 * @description
 * Format-agnostic data export utilities.
 *
 * Converts arrays of plain objects into downloadable file buffers
 * in CSV, PDF, plain text, and XLSX formats. Handles both populated
 * and empty datasets. Intended for use by any service or controller
 * that needs to produce a file download response.
 */

'use strict';

const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const { formatValue } = require('./date-utils');
const { isUUID } = require('./id-utils');
const { formatHeader, processHeaders } = require('./export-header-utils');
const AppError = require('../utils/AppError');
const {
  logSystemException,
  logSystemWarn
} = require('./logging/system-logger');
const { generateTimestampedFilename } = require('./filename-utils');

const EXPORT_ROW_WARN_THRESHOLD = 10_000;

/**
 * Converts an array of objects to a CSV buffer.
 *
 * Strips id and UUID fields, formats headers, and applies value
 * formatting (dates, booleans, numbers) before serializing.
 *
 * @param {Array<Object>} data - Non-empty array of objects to export
 * @param {string} [timezone='PST'] - Timezone label for date formatting
 * @returns {Buffer} UTF-8 encoded CSV buffer
 * @throws {AppError} FileSystemError if CSV generation fails
 */
const exportToCSV = (data, timezone = 'PST') => {
  const context = 'export-utils/exportToCSV';
  
  try {
    const { formattedHeaders, columnMap } = processHeaders(data);
    
    const formattedData = data.map((row) => {
      const formattedRow = {};
      formattedHeaders.forEach((header) => {
        const originalKey = columnMap[header];
        // Use ?? to preserve falsy values like 0 and false
        const value = row[originalKey] ?? '';
        formattedRow[header] = formatValue(value, timezone);
      });
      return formattedRow;
    });
    
    const parser = new Parser({ fields: formattedHeaders });
    const csv = parser.parse(formattedData);
    
    return Buffer.from(csv, 'utf-8');
  } catch (error) {
    logSystemException(error, 'CSV export failed', { context });
    throw AppError.fileSystemError('Failed to export data to CSV', {
      cause: error,
    });
  }
};

/**
 * Converts an array of objects to a PDF buffer.
 *
 * Supports tabular and summary layouts, portrait and landscape orientation.
 * UUID fields are stripped from output. Returns a minimal buffer for empty data.
 *
 * @param {Array<Object>} data - Array of objects to export (maybe empty)
 * @param {Object} [options={}]
 * @param {string} [options.title='Report'] - PDF title
 * @param {number} [options.fontSize=12] - Base font size
 * @param {boolean} [options.includeIndex=true] - Prepend row numbers
 * @param {boolean} [options.landscape=false] - Landscape orientation
 * @param {boolean} [options.summary=false] - Summary layout instead of table
 * @param {string} [options.timezone='PST'] - Timezone label for date formatting
 * @returns {Promise<Buffer>} PDF file buffer
 * @throws {AppError} FileSystemError if PDF generation fails
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
  
  const context = 'export-utils/exportToPDF';
  
  return new Promise((resolve, reject) => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        return resolve(Buffer.from('No data available', 'utf-8'));
      }
      
      const doc = new PDFDocument({
        size: landscape ? 'A4' : 'LETTER',
        layout: landscape ? 'landscape' : 'portrait',
        margin: 50,
      });
      
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => {
        logSystemException(err, 'PDF generation failed', { context });
        reject(AppError.fileSystemError('PDF generation failed', { cause: err }));
      });
      
      doc.fontSize(18).text(title, { align: 'center' }).moveDown(2);
      
      const columnMap = Object.keys(data[0])
        .filter((key) => !isUUID(data[0][key]))
        .reduce((acc, key) => {
          acc[formatHeader(key)] = key;
          return acc;
        }, {});
      
      const headers = Object.keys(columnMap);
      
      if (summary) {
        data.forEach((row, index) => {
          doc
            .fontSize(fontSize + 1)
            .text(`Record ${index + 1}:`, { underline: true })
            .moveDown(0.5);
          
          Object.entries(columnMap).forEach(([formattedHeader, originalKey]) => {
            const value = formatValue(row[originalKey] ?? 'N/A', timezone);
            doc.fontSize(fontSize - 1).text(`${formattedHeader}: ${value}`);
          });
          
          doc.moveDown(1);
        });
        
        // resolve is called via .on('end') — do not return a value here
        return doc.end();
      }
      
      const maxWidth = landscape ? 750 : 500;
      const columnWidths = headers.map(() => Math.floor(maxWidth / headers.length));
      
      doc.fontSize(fontSize + 1).fillColor('black');
      headers.forEach((header, i) => {
        doc.text(header.padEnd(columnWidths[i] / 6, ' '), {
          underline: true,
          continued: i !== headers.length - 1,
        });
      });
      doc.moveDown(1);
      
      data.forEach((row, index) => {
        doc.text(' ', { continued: false });
        
        headers.forEach((formattedHeader, i) => {
          const originalKey = columnMap[formattedHeader];
          const value = formatValue(row[originalKey] ?? 'N/A', timezone);
          const textValue =
            typeof value === 'number'
              ? value.toString().padStart(columnWidths[i] / 6, ' ')
              : value;
          
          doc.text(
            includeIndex && i === 0 ? `${index + 1}. ${textValue}` : textValue,
            { continued: i !== headers.length - 1 }
          );
        });
      });
      
      doc.end();
    } catch (error) {
      logSystemException(error, 'PDF generation failed', { context });
      reject(AppError.fileSystemError('PDF generation failed', { cause: error }));
    }
  });
};

/**
 * Converts an array of objects to a plain text buffer.
 *
 * Strips UUID fields, formats headers and values, and separates
 * columns with a configurable delimiter. Returns a minimal buffer
 * for empty data.
 *
 * @param {Array<Object>} data - Array of objects to export (maybe empty)
 * @param {string} [separator=' | '] - Column delimiter
 * @param {string} [timezone='PST'] - Timezone label for date formatting
 * @returns {Buffer} UTF-8 encoded plain text buffer
 * @throws {AppError} FileSystemError if text generation fails
 */
const exportToPlainText = (data, separator = ' | ', timezone = 'PST') => {
  const context = 'export-utils/exportToPlainText';
  
  try {
    if (!Array.isArray(data) || data.length === 0) {
      return Buffer.from('No data available', 'utf-8');
    }
    
    const { formattedHeaders, columnMap } = processHeaders(data);
    
    let text = formattedHeaders.join(separator) + '\n';
    text += '-'.repeat(text.length) + '\n';
    
    text += data
      .map((row) =>
        formattedHeaders
          .map((header) => formatValue(row[columnMap[header]] ?? 'N/A', timezone))
          .join(separator)
      )
      .join('\n');
    
    return Buffer.from(text, 'utf-8');
  } catch (error) {
    logSystemException(error, 'Plain text export failed', { context });
    throw AppError.fileSystemError('Failed to export data as plain text', {
      cause: error,
    });
  }
};

/**
 * Converts an array of objects to an XLSX buffer.
 *
 * Headers are taken directly from object keys. Values are formatted
 * before serialization. Returns a single-cell workbook for empty data.
 *
 * @param {Array<Object>} data - Array of objects to export (maybe empty)
 * @param {string} [sheetName='Export'] - Worksheet name
 * @param {string} [timezone='UTC'] - Timezone label for date formatting
 * @returns {Buffer} XLSX file buffer
 * @throws {AppError} FileSystemError if XLSX generation fails
 */
const exportToXLSX = (data, sheetName = 'Export', timezone = 'UTC') => {
  const context = 'export-utils/exportToXLSX';
  
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
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  } catch (error) {
    logSystemException(error, 'XLSX export failed', { context });
    throw AppError.fileSystemError('Failed to export data to XLSX', {
      cause: error,
    });
  }
};

/**
 * Resolves the content type and filename extension for a given export format.
 *
 * @param {string} format - Export format ('csv', 'pdf', 'txt', 'xlsx')
 * @param {string} filename - Base filename without extension
 * @returns {{ contentType: string, filename: string }}
 * @throws {AppError} ValidationError for unsupported formats
 */
const resolveExportMeta = (format, filename) => {
  switch (format.toLowerCase()) {
    case 'csv':
      return { contentType: 'text/csv', filename: `${filename}.csv` };
    case 'pdf':
      return { contentType: 'application/pdf', filename: `${filename}.pdf` };
    case 'txt':
      return { contentType: 'text/plain', filename: `${filename}.txt` };
    case 'xlsx':
      return {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `${filename}.xlsx`,
      };
    default:
      throw AppError.validationError(
        'Invalid export format. Supported formats: csv, pdf, txt, xlsx.'
      );
  }
};

/**
 * Exports data to a downloadable file buffer in the specified format.
 *
 * Handles both populated and empty datasets. For empty data, returns
 * a minimal file with a placeholder message rather than failing.
 * Logs a warning if row count exceeds EXPORT_ROW_WARN_THRESHOLD — a
 * signal that streaming export should be considered.
 *
 * @param {Object} options
 * @param {Array<Object>} options.data - Data to export (no row limit enforced)
 * @param {string} options.exportFormat - Target format ('csv', 'pdf', 'txt', 'xlsx')
 * @param {string} options.filename - Base filename without extension; timestamp is appended automatically
 * @param {string} [options.title=''] - PDF title (ignored for other formats)
 * @param {boolean} [options.landscape] - PDF landscape mode
 * @param {boolean} [options.summary] - PDF summary layout
 * @returns {Promise<{ fileBuffer: Buffer, contentType: string, filename: string }>}
 *   filename is fully resolved with timestamp and extension — use as-is in Content-Disposition
 * @throws {AppError} ValidationError for unsupported formats
 * @throws {AppError} FileSystemError if generation fails
 */
const exportData = async ({
                            data,
                            exportFormat,
                            filename,
                            title = '',
                            landscape,
                            summary,
                          }) => {
  const context = 'export-utils/exportData';
  const format = exportFormat.toLowerCase();
  
  // Timestamp applied here once — controller uses filename as-is
  const meta = resolveExportMeta(format, generateTimestampedFilename(filename));
  
  if (!data || data.length === 0) {
    const emptyBuffer = await buildEmptyBuffer(format, landscape, summary);
    return {
      fileBuffer: emptyBuffer,
      contentType: meta.contentType,
      filename: `empty_${meta.filename}`,
    };
  }
  
  if (data.length > EXPORT_ROW_WARN_THRESHOLD) {
    logSystemWarn('Large export requested', {
      context,
      exportFormat,
      rowCount: data.length,
    });
  }
  
  try {
    const fileBuffer = await buildBuffer(format, data, title, landscape, summary);
    return { fileBuffer, contentType: meta.contentType, filename: meta.filename };
  } catch (error) {
    logSystemException(error, 'Export failed', { context, exportFormat, filename });
    throw error;
  }
};

/**
 * Builds a file buffer for non-empty data in the specified format.
 *
 * @param {string} format - Normalized export format
 * @param {Array<Object>} data - Non-empty data array
 * @param {string} title - PDF title
 * @param {boolean} landscape - PDF landscape mode
 * @param {boolean} summary - PDF summary layout
 * @returns {Promise<Buffer>}
 */
const buildBuffer = async (format, data, title, landscape, summary) => {
  switch (format) {
    case 'csv':  return exportToCSV(data);
    case 'pdf':  return exportToPDF(data, { title, landscape, summary });
    case 'txt':  return exportToPlainText(data);
    case 'xlsx': return exportToXLSX(data);
  }
};

/**
 * Builds a minimal placeholder buffer for empty datasets.
 *
 * @param {string} format - Normalized export format
 * @param {boolean} landscape - PDF landscape mode
 * @param {boolean} summary - PDF summary layout
 * @returns {Promise<Buffer>}
 */
const buildEmptyBuffer = async (format, landscape, summary) => {
  switch (format) {
    case 'csv':
    case 'txt':
      return Buffer.from('No data available for export.', 'utf-8');
    case 'pdf':
      return exportToPDF([], { title: 'Empty Report', landscape, summary });
    case 'xlsx': {
      const worksheet = XLSX.utils.aoa_to_sheet([['No data available']]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
  }
};

module.exports = {
  exportToCSV,
  exportToPDF,
  exportToPlainText,
  exportToXLSX,
  exportData,
};
