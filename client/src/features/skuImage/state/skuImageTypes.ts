import {
  ApiSuccessResponse,
  AsyncState,
  BatchProcessStats,
} from '@shared-types/api';

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
export type SkuImageType =
  | 'main'
  | 'thumbnail'
  | 'zoom'
  | 'gallery'
  | 'unknown';

/**
 * Supported image file formats for uploads and stored media.
 *
 * This reusable type is shared across SKU images, product images,
 * packaging material assets, document attachments, and any feature
 * that relies on image upload or validation.
 *
 * Extend this union if the backend later supports additional formats
 * (e.g., `avif`, `heif`).
 */
export type ImageFileFormat =
  | 'webp'
  | 'jpg'
  | 'jpeg'
  | 'png'
  | 'gif'
  | 'tiff'
  | 'svg';

/**
 * Represents one image definition in a bulk image upload request.
 *
 * The backend requires that each entry contains either a URL (image_url)
 * or an uploaded file (file_uploaded). Other fields provide metadata,
 * display ordering, and accessibility text.
 */
export interface SkuImageInput {
  /** URL for the image, if not uploading a file. */
  image_url?: string | null;
  
  /** Indicates that a file is included in multipart upload. */
  file_uploaded?: boolean;
  
  /** Logical role or display type of the image. */
  image_type?: SkuImageType;
  
  /** Ordering index for presentation. */
  display_order?: number;
  
  /** File size in kilobytes (optional). */
  file_size_kb?: number | null;
  
  /** File format of the uploaded or referenced image. */
  file_format?: ImageFileFormat;

  /** Human-readable alt text for accessibility. */
  alt_text?: string | null;
  
  /** Whether this image should be treated as the primary SKU image. */
  is_primary?: boolean;
  
  /** Timestamp indicating when the image was uploaded or created. */
  uploaded_at?: string | Date;
  
  /** Source tag for tracking how the image was introduced. */
  source?: SkuImageSource;
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
 * Payload structure for bulk image uploads.
 * Contains multiple SKUs, each with 1–100 image items.
 */
export interface BulkSkuImageUploadRequest {
  /** List of SKU image batches (1–50 SKUs allowed per request). */
  skus: BulkSkuImageUploadItem[];
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
export interface BulkSkuImageUploadResponse
  extends ApiSuccessResponse<BulkSkuImageUploadResult[]> {
  /** Aggregated statistics for the entire batch process. */
  stats: BatchProcessStats;
}

/**
 * Redux state representation for SKU image uploads.
 * Based on AsyncState, with additional unpacked fields for convenience.
 */
export interface SkuImageUploadState
  extends AsyncState<BulkSkuImageUploadResponse | null> {
  /** Last completed batch’s per-SKU upload results. */
  results: BulkSkuImageUploadResult[] | null;
  
  /** Metrics summarizing the batch upload (success/failure counts, duration). */
  stats: BatchProcessStats | null;
}
