import type {
  ApiSuccessResponse,
  AsyncState,
  BatchProcessStats,
  ImageFileFormat,
  ImageType,
} from '@shared-types/api';
import type {
  NullableNumber,
  NullableString
} from '@shared-types/shared';

/**
 * Supported image upload modes.
 *
 * - "file" → image uploaded as multipart binary
 * - "url"  → image referenced via external URL
 */
export type SkuImageUploadMode = 'file' | 'url';

/**
 * Describes the origin of a SKU image record.
 */
export type SkuImageSource =
  | 'uploaded'
  | 'synced'
  | 'migrated'
  | 'api'
  | 'imported';

/**
 * Supported image roles/types for SKU assets.
 */
export type SkuImageType = ImageType;

/**
 * Base UI model for SKU image staging.
 * Contains all client-side fields required for preview,
 * upload handling, and metadata assignment.
 */
export interface SkuImageUiBase {
  /** Upload method selected by the user */
  upload_mode?: SkuImageUploadMode;
  
  /** Public image URL when upload_mode = "url" */
  image_url?: NullableString;
  
  /** True if this row represents a multipart file upload */
  file_uploaded?: boolean;
  
  /**
   * Raw File object (client-only, never serialized).
   * Present only when file_uploaded = true.
   */
  file?: File | null;
  
  /** Browser-generated preview URL (client-only) */
  previewUrl?: string;
  
  /** Logical image category (thumbnail, main, gallery, etc.) */
  image_type?: SkuImageType;
  
  /** Optional computed file size in KB (UI-facing only) */
  file_size_kb?: NullableNumber;
  
  /** Inferred file format (jpg, png, webp, etc.) */
  file_format?: ImageFileFormat;
  
  /** Accessibility / SEO alt text */
  alt_text?: NullableString;
  
  /**
   * UI-only tracking field indicating how the image was added
   * (uploaded, url, auto-generated, etc.)
   */
  source?: SkuImageSource;
}

/**
 * UI model for creating new SKU images.
 * Currently identical to SkuImageUiBase,
 * but separated for future extension (e.g., edit flows).
 */
export type SkuImageInput = SkuImageUiBase;

/**
 * Multiple image definitions for a SKU within a bulk upload request.
 */
export type SkuImageInputArray = SkuImageInput[];

/**
 * One batch entry representing images belonging to a single SKU.
 */
export interface BulkSkuImageUploadItem {
  /** SKU identifier (validated UUID). */
  skuId: string;

  /** SKU code (required for server validation/assertions). */
  skuCode: string;

  /** One or more image definitions associated with this SKU. */
  images: SkuImageInputArray;
}

/**
 * Represents a single image variant generated during SKU image upload.
 *
 * Each logical SKU image group may contain multiple variants
 * (e.g. main, thumbnail, zoom) stored as separate physical files.
 *
 * This type reflects the API upload response DTO shape,
 * not the database schema.
 */
export interface SkuImageUploadVariant {
  /** Unique identifier of the stored image record */
  id: string;
  
  /** Server-hosted URL path of the image */
  imageUrl: string;
  
  /** Whether this variant is marked as the primary image for the SKU */
  isPrimary: boolean;
  
  /** File format of the stored image (e.g. webp, jpg) */
  fileFormat: string;
  
  /** File size in kilobytes */
  fileSizeKb: number;
}

/**
 * Represents a logical SKU image group returned by the bulk upload API.
 *
 * A group corresponds to one uploaded image set and contains
 * multiple size/format variants under a shared groupId.
 *
 * Variants are optional because processing pipelines may
 * conditionally generate certain sizes.
 */
export interface UploadedSkuImageGroup {
  /** Logical grouping identifier shared across image variants */
  groupId: string;
  
  /** Zero-based display ordering index for SKU gallery rendering */
  displayOrder: number;
  
  /** Optional alt text used for accessibility and SEO */
  altText: NullableString;
  
  /** ISO 8601 timestamp indicating when the image group was uploaded */
  uploadedAt: string;
  
  /** User identifier of the uploader */
  uploadedBy: string;
  
  /**
   * Map of image variants keyed by logical type.
   *
   * Keys represent presentation intent rather than database rows.
   * Each value corresponds to a generated physical file.
   */
  variants: {
    main?: SkuImageUploadVariant;
    thumbnail?: SkuImageUploadVariant;
    zoom?: SkuImageUploadVariant;
  };
}

/**
 * Per-SKU upload outcome returned from the backend.
 */
export interface BulkSkuImageUploadResult {
  /** SKU identifier. */
  skuId: string;

  /** Whether all images for this SKU succeeded. */
  success: boolean;

  /** Number of successfully processed images. */
  count: number;

  /** Array of uploaded image records for this SKU. */
  images: UploadedSkuImageGroup[];

  /** Error message if the SKU batch failed. */
  error: NullableString;
}

/**
 * API response for a bulk SKU image upload request.
 * Extends the standard API envelope and includes batch statistics.
 */
export interface BulkSkuImageUploadResponse extends ApiSuccessResponse<
  BulkSkuImageUploadResult[]
> {
  /** Aggregated statistics for the entire batch process. */
  stats: BatchProcessStats;
}

/**
 * Redux state representation for SKU image uploads.
 * Based on AsyncState, with additional unpacked fields for convenience.
 */
export interface SkuImageUploadState extends AsyncState<BulkSkuImageUploadResponse | null> {
  /** Last completed batch’s per-SKU upload results. */
  results: BulkSkuImageUploadResult[] | null;

  /** Metrics summarizing the batch upload (success/failure counts, duration). */
  stats: BatchProcessStats | null;
}

/**
 * UI-facing representation of a single SKU row in the bulk image upload form.
 *
 * Extends the backend-facing {@link BulkSkuImageUploadItem} with additional
 * metadata required exclusively for the frontend, such as the product's
 * display name. This structure powers each upload card shown to the user.
 *
 * This type is *never* sent to the backend directly. It is used only for:
 *  - Rendering product-level information in each upload card
 *  - Managing client-side image selections (`images`)
 *  - Providing context during result enrichment after upload
 */
export interface SkuImageUploadCardData extends BulkSkuImageUploadItem {
  /**
   * Human-readable product name associated with the SKU.
   * Required for UI display (e.g., upload card header, results dialog).
   */
  displayProductName: string;
}

/**
 * Represents a single image update operation.
 *
 * At least one updatable field must be provided.
 * `group_id` identifies the image record to update.
 */
export interface SkuImageUpdateItem {
  /** Stable identifier for image group */
  group_id: string;
  
  /**
   * True if this image should be replaced
   * by a newly uploaded file in the multipart payload.
   */
  file_uploaded?: boolean;
  
  /** New image URL if replacing via external link */
  image_url?: NullableString;
  
  /** Logical image category */
  image_type?: SkuImageType;
  
  /** New display order position */
  display_order?: number;
  
  /** Updated alt text */
  alt_text?: NullableString;
  
  /** Updated file format (if changed during replacement) */
  file_format?: ImageFileFormat;
  
  /** Whether this image becomes primary */
  is_primary?: boolean;
  
  /** Optional source override */
  source?: SkuImageSource;
}

/**
 * UI draft model for updating an existing SKU image group.
 *
 * This type is used only on the client to manage editable image state
 * before serialization into the backend update payload.
 *
 * It extends SkuImageUiBase to reuse staging fields such as `file`,
 * `previewUrl`, and `upload_mode`, which are never sent directly to
 * the backend.
 *
 * `group_id` links the draft to an existing persisted image group.
 */
export interface SkuImageUpdateDraft extends SkuImageUiBase {
  /** Stable identifier of the existing image group */
  group_id: string;
  
  /** New display order position (optional override) */
  display_order?: number;
  
  /** Whether this image should become the primary image */
  is_primary?: boolean;
}

/**
 * Represents one SKU update operation inside a bulk image update request.
 *
 * Each item groups all image updates that belong to a single SKU.
 * The backend processes each SKU independently to allow partial success.
 */
export interface SkuImageUpdateRequestItem {
  /** Internal SKU identifier (UUID) */
  skuId: string;
  
  /** Human-readable SKU code */
  skuCode: string;
  
  /** Collection of image update operations for this SKU */
  images: SkuImageUpdateItem[];
}

/**
 * Request payload for bulk SKU image updates.
 *
 * Uses snake_case at the transport boundary to align with
 * backend validation schemas and controller expectations.
 *
 * The client is responsible for transforming camelCase draft
 * models into this API-facing shape.
 */
export interface BulkSkuImageUpdateRequest {
  skus: SkuImageUpdateRequestItem[];
}

/**
 * Result of processing a single SKU inside a bulk update operation.
 *
 * The backend may succeed or fail per SKU independently.
 * `images` reflects the latest persisted state after update.
 */
export interface BulkSkuImageUpdateResult {
  skuId: string;
  skuCode: string;
  
  /** Whether this SKU’s update batch completed successfully */
  success: boolean;
  
  /** Number of image records affected */
  count: number;
  
  /** Updated image groups returned from persistence layer */
  images: UploadedSkuImageGroup[];
  
  /** Error message if success = false */
  error: NullableString;
}

/**
 * Response payload for bulk SKU image update.
 *
 * Extends the standard API success wrapper while also
 * returning batch-level processing metrics.
 */
export interface BulkSkuImageUpdateResponse
  extends ApiSuccessResponse<BulkSkuImageUpdateResult[]> {
  
  /** Aggregated batch metrics (success count, failure count, duration, etc.) */
  stats: BatchProcessStats;
}

/**
 * Redux state slice for managing bulk SKU image update operations.
 *
 * Extends AsyncState to track lifecycle states:
 *  - loading
 *  - success
 *  - error
 *
 * Separately stores:
 *  - per-SKU results
 *  - aggregated batch statistics
 */
export interface SkuImageUpdateState
  extends AsyncState<BulkSkuImageUpdateResponse | null> {
  
  /** Most recent per-SKU update results */
  results: BulkSkuImageUpdateResult[] | null;
  
  /** Aggregated batch-level metrics */
  stats: BatchProcessStats | null;
}
