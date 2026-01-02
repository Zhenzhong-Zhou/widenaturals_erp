import {
  ApiSuccessResponse,
  AsyncState,
  BatchProcessStats,
  ImageFileFormat,
  ImageType,
} from '@shared-types/api';
import { NullableNumber, NullableString } from '@shared-types/shared';

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
 * One successfully uploaded image as returned by the backend.
 */
export interface UploadedSkuImage {
  /** Image record identifier. */
  id: string;

  /** SKU identifier associated with this image. */
  skuId: string;

  /** Server-hosted URL for the uploaded image. */
  imageUrl: string;

  /** Logical image type (main, zoom, thumbnail, etc.). */
  imageType: SkuImageType;

  /** Display order index. */
  displayOrder: number;

  /** Whether this is the primary image for the SKU. */
  isPrimary: boolean;
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
  images: UploadedSkuImage[];

  /** Error message if the SKU batch failed. */
  error: string | null;
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
