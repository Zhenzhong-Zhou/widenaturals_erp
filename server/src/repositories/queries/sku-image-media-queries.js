/**
 * @file sku-image-media-queries.js
 * @description SQL query constants for sku-image-media-repository.js.
 *
 * Exports:
 *  - SKU_IMAGE_HAS_PRIMARY_MAIN_QUERY    — EXISTS check for primary main image
 *  - SKU_IMAGE_MAX_DISPLAY_ORDER_QUERY   — fetch current max display_order for a SKU
 *  - SKU_IMAGE_INSERT_BULK_QUERY         — jsonb_to_recordset bulk insert with conflict handling
 *  - SKU_IMAGE_GET_BY_SKU_QUERY          — fetch all images for a SKU with audit fields
 *  - SKU_IMAGE_GET_GROUP_IDS_QUERY       — validate group_ids belong to a SKU
 *  - SKU_IMAGE_UNSET_PRIMARY_QUERY       — clear is_primary on all images for a SKU
 *  - SKU_IMAGE_UPDATE_BULK_QUERY         — jsonb_to_recordset bulk update by group_id
 */

'use strict';

// EXISTS check — returns true if a primary main image exists for the SKU.
// $1: sku_id (UUID)
const SKU_IMAGE_HAS_PRIMARY_MAIN_QUERY = `
  SELECT EXISTS (
    SELECT 1
    FROM sku_images
    WHERE sku_id     = $1
      AND image_type = 'main'
      AND is_primary = TRUE
  ) AS has_primary
`;

// Returns the current max display_order for ordering new images after existing ones.
// $1: sku_id (UUID)
const SKU_IMAGE_MAX_DISPLAY_ORDER_QUERY = `
  SELECT COALESCE(MAX(display_order), 0) AS max_order
  FROM sku_images
  WHERE sku_id = $1
`;

// jsonb_to_recordset bulk insert — accepts a JSONB array of image objects.
// On conflict (sku_id, group_id, image_type), overwrites all mutable fields.
// $1: sku_id (UUID), $2: images payload (JSONB array)
const SKU_IMAGE_INSERT_BULK_QUERY = `
  INSERT INTO sku_images (
    sku_id,
    image_url,
    image_type,
    display_order,
    file_size_kb,
    file_format,
    alt_text,
    is_primary,
    uploaded_by,
    group_id
  )
  SELECT
    $1 AS sku_id,
    t.image_url,
    t.image_type,
    t.display_order,
    t.file_size_kb,
    t.file_format,
    t.alt_text,
    t.is_primary,
    t.uploaded_by,
    t.group_id
  FROM jsonb_to_recordset($2::jsonb) AS t(
    image_url     text,
    image_type    text,
    display_order int,
    file_size_kb  int,
    file_format   text,
    alt_text      text,
    is_primary    boolean,
    uploaded_by   uuid,
    group_id      uuid
  )
  ORDER BY t.group_id, t.display_order
  ON CONFLICT (sku_id, group_id, image_type)
  DO UPDATE SET
    image_url     = EXCLUDED.image_url,
    file_size_kb  = EXCLUDED.file_size_kb,
    file_format   = EXCLUDED.file_format,
    alt_text      = EXCLUDED.alt_text,
    display_order = EXCLUDED.display_order,
    is_primary    = EXCLUDED.is_primary,
    uploaded_by   = EXCLUDED.uploaded_by,
    uploaded_at   = NOW()
  RETURNING *
`;

// Full image fetch with uploader audit fields, ordered by group and display order.
// Primary main groups are surfaced first within the result set.
// $1: sku_id (UUID)
const SKU_IMAGE_GET_BY_SKU_QUERY = `
  SELECT
    img.id,
    img.sku_id,
    img.group_id,
    img.image_url,
    img.image_type,
    img.display_order,
    img.file_size_kb,
    img.file_format,
    img.alt_text,
    img.is_primary,
    img.uploaded_at,
    img.uploaded_by,
    u.firstname                   AS uploaded_by_firstname,
    u.lastname                    AS uploaded_by_lastname
  FROM sku_images AS img
  LEFT JOIN users AS u ON u.id = img.uploaded_by
  WHERE img.sku_id = $1
  ORDER BY
    MAX(
      CASE
        WHEN img.image_type = 'main'
        THEN img.is_primary::int
        ELSE 0
      END
    ) OVER (PARTITION BY img.group_id) DESC,
    img.group_id,
    img.display_order ASC
`;

// Returns group_ids that belong to the given SKU — used to validate
// cross-SKU manipulation prevention during bulk operations.
// $1: sku_id (UUID), $2: group_ids (UUID array)
const SKU_IMAGE_GET_GROUP_IDS_QUERY = `
  SELECT DISTINCT group_id
  FROM sku_images
  WHERE sku_id    = $1
    AND group_id  = ANY($2::uuid[])
`;

// Clears is_primary on all currently primary images for a SKU.
// Called before setting a new primary inside the same transaction.
// $1: sku_id (UUID), $2: uploaded_by (UUID)
const SKU_IMAGE_UNSET_PRIMARY_QUERY = `
  UPDATE sku_images
  SET
    is_primary  = FALSE,
    uploaded_at = NOW(),
    uploaded_by = $2
  WHERE sku_id    = $1
    AND is_primary = TRUE
`;

// jsonb_to_recordset bulk update by group_id — updates main/thumb/zoom rows
// conditionally via CASE on image_type. Only images belonging to the SKU are updated.
// $1: sku_id (UUID), $2: updates payload (JSONB array), $3: uploaded_by (UUID)
const SKU_IMAGE_UPDATE_BULK_QUERY = `
  UPDATE sku_images AS si
  SET
    image_url = COALESCE(
      CASE si.image_type
        WHEN 'main'      THEN t.main_url
        WHEN 'thumbnail' THEN t.thumb_url
        WHEN 'zoom'      THEN t.zoom_url
      END,
      si.image_url
    ),
    file_size_kb = COALESCE(
      CASE si.image_type
        WHEN 'main'      THEN t.main_size_kb
        WHEN 'thumbnail' THEN t.thumb_size_kb
        WHEN 'zoom'      THEN t.zoom_size_kb
      END,
      si.file_size_kb
    ),
    file_format = COALESCE(
      CASE si.image_type
        WHEN 'main'      THEN t.main_format
        WHEN 'thumbnail' THEN t.thumb_format
        WHEN 'zoom'      THEN t.zoom_format
      END,
      si.file_format
    ),
    display_order = COALESCE(t.display_order, si.display_order),
    alt_text      = COALESCE(t.alt_text,      si.alt_text),
    is_primary    = CASE
      WHEN si.image_type = 'main'
        THEN COALESCE(t.is_primary, si.is_primary)
      ELSE FALSE
    END,
    uploaded_by = $3,
    uploaded_at = NOW()
  FROM jsonb_to_recordset($2::jsonb) AS t(
    group_id      uuid,
    main_url      text,
    thumb_url     text,
    zoom_url      text,
    main_size_kb  int,
    thumb_size_kb int,
    zoom_size_kb  int,
    main_format   text,
    thumb_format  text,
    zoom_format   text,
    display_order int,
    alt_text      text,
    is_primary    boolean
  )
  WHERE si.group_id = t.group_id
    AND si.sku_id   = $1
  RETURNING si.*
`;

module.exports = {
  SKU_IMAGE_HAS_PRIMARY_MAIN_QUERY,
  SKU_IMAGE_MAX_DISPLAY_ORDER_QUERY,
  SKU_IMAGE_INSERT_BULK_QUERY,
  SKU_IMAGE_GET_BY_SKU_QUERY,
  SKU_IMAGE_GET_GROUP_IDS_QUERY,
  SKU_IMAGE_UNSET_PRIMARY_QUERY,
  SKU_IMAGE_UPDATE_BULK_QUERY,
};
