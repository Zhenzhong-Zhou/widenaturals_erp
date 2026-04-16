/**
 * @file sku-image-transformer.js
 * @description Row-level and grouped transformers for SKU image records.
 *
 * Exports:
 *   - transformGroupedSkuImages          – groups flat image rows into variant groups
 *   - transformSkuImageGroupsForDetail   – groups pre-shaped rows into detail variant groups
 *
 * Internal helpers (not exported):
 *   - transformSkuImageRow – maps a flat DB row to a camelCase image record
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

/**
 * Maps a flat SKU image DB row into a camelCase record.
 *
 * @param {Object} record
 * @returns {Object}
 */
const transformSkuImageRow = (record) => ({
  id: record.id,
  skuId: record.sku_id,
  imageUrl: record.image_url,
  imageType: record.image_type,
  displayOrder: record.display_order,
  fileSizeKb: record.file_size_kb,
  fileFormat: record.file_format,
  altText: record.alt_text,
  isPrimary: record.is_primary,
  groupId: record.group_id,
  uploadedAt: record.uploaded_at,
  uploadedBy: record.uploaded_by,
});

/**
 * Groups flat SKU image DB rows into variant group objects.
 *
 * Each group has a `groupId`, display metadata, and a `variants` map
 * keyed by image type (`main`, `thumbnail`, `zoom`).
 *
 * Returns an empty array if the input is not a valid non-empty array.
 *
 * @param {Array<Object>} [records=[]]
 * @returns {Array<Object>}
 */
const transformGroupedSkuImages = (records = []) => {
  if (!Array.isArray(records) || records.length === 0) return [];

  const rows = records.map(transformSkuImageRow);
  const groups = new Map();

  for (const r of rows) {
    if (!groups.has(r.groupId)) {
      groups.set(r.groupId, {
        groupId: r.groupId,
        displayOrder: r.displayOrder,
        altText: r.altText,
        uploadedAt: r.uploadedAt,
        uploadedBy: r.uploadedBy,
        variants: {},
      });
    }

    groups.get(r.groupId).variants[r.imageType] = {
      id: r.id,
      imageUrl: r.imageUrl,
      isPrimary: r.isPrimary,
      fileFormat: r.fileFormat,
      fileSizeKb: r.fileSizeKb,
    };
  }

  return Array.from(groups.values());
};

/**
 * Groups pre-shaped SKU image rows into detail variant group objects.
 *
 * Expects rows with camelCase fields already applied (e.g. from a detail query).
 * Returns an empty array if the input is not a valid array.
 *
 * @param {Array<Object>} rows
 * @returns {Array<Object>}
 */
const transformSkuImageGroupsForDetail = (rows) => {
  if (!Array.isArray(rows)) return [];

  const groups = new Map();

  for (const row of rows) {
    const { groupId, type, id, imageUrl, altText, isPrimary, metadata, audit } =
      row;

    if (!groups.has(groupId)) {
      groups.set(groupId, {
        groupId,
        isPrimary,
        variants: {},
        audit: audit ?? undefined,
      });
    }

    groups.get(groupId).variants[type] = {
      id,
      imageUrl,
      altText,
      metadata: metadata ?? undefined,
    };
  }

  return Array.from(groups.values());
};

module.exports = {
  transformGroupedSkuImages,
  transformSkuImageGroupsForDetail,
};
