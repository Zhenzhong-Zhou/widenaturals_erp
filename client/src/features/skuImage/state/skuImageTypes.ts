import type {
  ApiSuccessResponse,
  AsyncState,
  BatchProcessStats,
  ImageFileFormat,
  ImageType,
} from '@shared-types/api';
import type { NullableNumber, NullableString } from '@shared-types/shared';

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
 * Shared UI-level image fields used in create and update flows.
 *
 * Contains client-only properties and never sent directly to API.
 */
export interface SkuImageUiBase {
  upload_mode?: 'file' | 'url';
  
  image_url?: NullableString;
  
  file_uploaded?: boolean;
  
  file?: File | null;
  
  previewUrl?: string;
  
  image_type?: SkuImageType;
  
  file_format?: ImageFileFormat;
  
  alt_text?: NullableString;
  
  source?: SkuImageSource;
}

// todo: refactor those soem property get repeated
// /**
//  * UI model for creating new SKU images.
//  */
// export interface SkuImageInput extends SkuImageUiBase {}

/**
 * Represents a single image entry in a bulk SKU image upload operation.
 *
 * This structure is used on the client side to manage image staging,
 * metadata, preview rendering, and eventual serialization into the
 * backend-compatible multipart form payload.
 *
 * Exactly one of the following must be provided per image:
 *  - `file_uploaded = true` with a `file` object (raw upload), OR
 *  - `upload_mode = "url"` with an `image_url` (external reference).
 *
 * Fields such as `previewUrl`, `file`, and `source` are UI-only and never
 * transmitted directly to the backend. All other properties contribute to
 * how the backend registers, validates, and stores the image.
 */
export interface SkuImageInput {
  /**
   * Indicates how this image was supplied by the user.
   * `"file"` → uploaded as a binary file
   * `"url"`  → referenced by an external image URL
   */
  upload_mode?: 'file' | 'url';

  /** Public image URL when `upload_mode = "url"` */
  image_url?: NullableString;

  /** True if this row represents an uploaded file in multipart form */
  file_uploaded?: boolean;

  /**
   * Raw File object for uploads (client-only, never serialized).
   * Included only if `file_uploaded = true`.
   */
  file?: File | null;

  /** Logical image category (e.g., thumbnail, main, gallery, detail) */
  image_type?: SkuImageType;

  /** Precomputed file size (KB), optional and UI-facing */
  file_size_kb?: NullableNumber;

  /** Inferred file extension/type such as jpg, png, webp */
  file_format?: ImageFileFormat;

  /** Human-friendly alt text for accessibility and SEO */
  alt_text?: NullableString;

  /**
   * Optional tag indicating how the image was added
   * (e.g., "uploaded", "url", "auto-generated").
   * For UI/state tracking only.
   */
  source?: SkuImageSource;

  /**
   * Temporary browser-generated preview URL.
   * Used for client-side rendering before uploading.
   */
  previewUrl?: string;
}

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
 */
export interface SkuImageUpdateItem {
  group_id: string;
  
  file_uploaded?: boolean;
  
  image_url?: NullableString;
  
  /** Logical image category (e.g., thumbnail, main, gallery, detail) */
  image_type?: SkuImageType;
  
  display_order?: number;
  
  alt_text?: NullableString;
  
  /** Inferred file extension/type such as jpg, png, webp */
  file_format?: ImageFileFormat;
  
  is_primary?: boolean;
  
  source?: SkuImageSource;
}

/**
 * UI model for updating an existing image group.
 */
export interface SkuImageUpdateDraft extends SkuImageUiBase {
  /** Existing group identifier */
  group_id: string;
  
  display_order?: number;
  
  is_primary?: boolean;
}

/**
 * Represents one SKU update batch inside the bulk request.
 */
export interface SkuImageUpdateRequestItem {
  /** SKU identifier */
  skuId: string;
  
  /** SKU code */
  skuCode: string;
  
  /** Array of image updates */
  images: SkuImageUpdateItem[];
}

/**
 * Request payload for bulk SKU image update.
 *
 * Uses snake_case to match backend validation schema.
 */
export interface BulkSkuImageUpdateRequest {
  skus: SkuImageUpdateRequestItem[];
}
/**
 * Result for a single SKU inside bulk image update response.
 */
export interface BulkSkuImageUpdateResult {
  skuId: string;
  skuCode: string;
  success: boolean;
  count: number;
  images: UploadedSkuImageGroup[];
  error: NullableString;
}

export interface BulkSkuImageUpdateResponse
  extends ApiSuccessResponse<BulkSkuImageUpdateResult[]> {
  stats: BatchProcessStats;
}

/**
 * Redux state slice for bulk SKU image update operations.
 *
 * Extends AsyncState to track loading, success, and error states
 * for update flows.
 */
export interface SkuImageUpdateState
  extends AsyncState<BulkSkuImageUpdateResponse | null> {
  
  /** Last completed batch’s per-SKU update results. */
  results: BulkSkuImageUpdateResult[] | null;
  
  /** Metrics summarizing the batch update (success/failure counts, duration). */
  stats: BatchProcessStats | null;
}
