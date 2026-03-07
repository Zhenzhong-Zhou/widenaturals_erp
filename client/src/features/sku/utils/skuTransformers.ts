/**
 * SKU Transformers
 *
 * Utilities for converting SKU data between:
 *
 * - API request/response DTOs (snake_case)
 * - UI form models (camelCase)
 * - flattened SKU read models used by the UI
 *
 * These transformers help keep the UI layer decoupled from
 * backend naming conventions and API contracts.
 */

import type {
  FlattenedSkuInfo,
  UpdateSkuDimensionsFormValues,
  UpdateSkuDimensionsRequest,
  UpdateSkuMetadataFormValues,
  UpdateSkuMetadataRequest,
} from '@features/sku';

/**
 * Convert flattened SKU data into metadata form values.
 *
 * Used to populate the metadata edit form when the dialog opens.
 *
 * @param sku - Flattened SKU read model from the UI state
 * @returns Partial form values for the metadata edit form
 */
export const transformFlattenedSkuToMetadataFormValues = (
  sku: FlattenedSkuInfo | null
): Partial<UpdateSkuMetadataFormValues> => {
  if (!sku) return {};

  return {
    description: sku.description ?? undefined,
    sizeLabel: sku.sizeLabel ?? undefined,
    marketRegion: sku.marketRegion ?? undefined,
    language: sku.language ?? undefined,
  };
};

/**
 * Convert metadata form values into an API request payload.
 *
 * Maps camelCase UI fields into snake_case API fields.
 *
 * @param form - Metadata form values from the UI
 * @returns API request payload for updating SKU metadata
 */
export const transformMetadataFormToRequest = (
  form: Partial<UpdateSkuMetadataFormValues>
): UpdateSkuMetadataRequest => {
  return {
    description: form.description,
    size_label: form.sizeLabel,
    market_region: form.marketRegion,
    language: form.language,
  };
};

/**
 * Convert flattened SKU data into dimension form values.
 *
 * Used to populate the dimension edit form when the dialog opens.
 *
 * @param sku - Flattened SKU read model
 * @returns Partial dimension form values
 */
export const transformFlattenedSkuToDimensionsFormValues = (
  sku: FlattenedSkuInfo | null
): Partial<UpdateSkuDimensionsFormValues> => {
  if (!sku) return {};

  return {
    lengthCm: sku.lengthCm,
    widthCm: sku.widthCm,
    heightCm: sku.heightCm,
    weightG: sku.weightG,
  };
};

/**
 * Convert dimension form values into API request payload.
 *
 * Ensures numeric values are properly converted to numbers
 * before sending them to the backend.
 */
export const transformDimensionsFormToRequest = (
  form: Partial<UpdateSkuDimensionsFormValues>
): UpdateSkuDimensionsRequest => {
  return {
    length_cm: form.lengthCm !== undefined ? Number(form.lengthCm) : undefined,

    width_cm: form.widthCm !== undefined ? Number(form.widthCm) : undefined,

    height_cm: form.heightCm !== undefined ? Number(form.heightCm) : undefined,

    weight_g: form.weightG !== undefined ? Number(form.weightG) : undefined,
  };
};
