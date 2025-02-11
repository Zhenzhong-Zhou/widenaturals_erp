import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { LotAdjustmentTypeList } from '../features/warehouse-inventory';

const fetchAllDropdownLotAdjustmentTypes = async (): Promise<LotAdjustmentTypeList> => {
  const response = await axiosInstance.get(API_ENDPOINTS.LOT_ADJUSTMENT_TYPES_DROPDOWN);
  return response.data;
};

export const lotAdjustmentTypeService = {
  fetchAllDropdownLotAdjustmentTypes
};
