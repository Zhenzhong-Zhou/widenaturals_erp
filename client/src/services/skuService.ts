import type {
  CreateSkuBulkInput,
  CreateSkuResponse,
  FetchSkusParams,
  GetSkuDetailResponse,
  GetSkuListApiResponse,
  GetSkuProductCardsResponse,
  SkuProductCardQueryParams,
  UpdateSkuStatusRequestBody,
  UpdateSkuStatusResponse,
} from '@features/sku/state/skuTypes';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { sanitizeString } from '@utils/stringUtils';
import { getRequest, patchRequest, postRequest } from '@utils/http';
import { buildQueryString } from '@utils/buildQueryString';

/* =========================================================
 * SKU Product Cards
 * ======================================================= */

/**
 * Fetch paginated SKU product-card records.
 *
 * READ-only, idempotent.
 */
const fetchPaginatedSkuProductCards = (
  params: SkuProductCardQueryParams = {}
): Promise<GetSkuProductCardsResponse> => {
  const { filters = {}, ...rest } = params;

  const queryString = buildQueryString({
    ...rest,
    ...filters,
  });

  return getRequest<GetSkuProductCardsResponse>(
    `${API_ENDPOINTS.SKUS.SKU_PRODUCT_CARDS}${queryString}`,
    { policy: 'READ' }
  );
};

/* =========================================================
 * SKU Details
 * ======================================================= */

/**
 * Fetch full SKU details by ID.
 *
 * READ-only.
 */
const fetchSkuDetailById = (skuId: string): Promise<GetSkuDetailResponse> => {
  const cleanId = sanitizeString(skuId);

  return getRequest<GetSkuDetailResponse>(
    API_ENDPOINTS.SKUS.SKU_DETAILS(cleanId),
    { policy: 'READ' }
  );
};

/* =========================================================
 * SKU List
 * ======================================================= */

/**
 * Fetch paginated list of SKUs.
 *
 * READ-only.
 */
const fetchPaginatedSkus = (
  params: FetchSkusParams = {}
): Promise<GetSkuListApiResponse> => {
  const { filters = {}, ...rest } = params;

  const queryString = buildQueryString({
    ...rest,
    ...filters,
  });

  return getRequest<GetSkuListApiResponse>(
    `${API_ENDPOINTS.SKUS.ALL_RECORDS}${queryString}`,
    { policy: 'READ' }
  );
};

/* =========================================================
 * SKU Mutations
 * ======================================================= */

/**
 * Create one or more SKUs (bulk supported).
 *
 * WRITE operation.
 */
const createSkus = (payload: CreateSkuBulkInput): Promise<CreateSkuResponse> =>
  postRequest<CreateSkuBulkInput, CreateSkuResponse>(
    API_ENDPOINTS.SKUS.ADD_NEW_RECORD,
    payload
  );

/**
 * Update SKU status.
 *
 * WRITE operation.
 */
const updateSkuStatus = (
  skuId: string,
  payload: UpdateSkuStatusRequestBody
): Promise<UpdateSkuStatusResponse> =>
  patchRequest<UpdateSkuStatusRequestBody, UpdateSkuStatusResponse>(
    API_ENDPOINTS.SKUS.UPDATE_STATUS(skuId),
    payload
  );

/* =========================================================
 * Public API
 * ======================================================= */

export const skuService = {
  fetchPaginatedSkuProductCards,
  fetchSkuDetailById,
  fetchPaginatedSkus,
  createSkus,
  updateSkuStatus,
};
