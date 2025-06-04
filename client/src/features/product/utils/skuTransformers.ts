import { formatDate } from '@utils/dateTimeUtils';
import type { SkuDetails } from '../state';
import { formatLabel } from '@utils/textUtils';

interface FlatSkuDetails {
  skuId: string;
  sku: string;
  barcode: string;
  language: string;
  countryCode: string;
  marketRegion: string;
  sizeLabel: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightG: number;
  lengthInch: number;
  widthInch: number;
  heightInch: number;
  weightLb: number;
  description: string;
  status: string;
  statusDate: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  complianceType: string;
  complianceId: string;
  issuedDate: string;
  expiryDate: string | null;
  complianceDescription: string;
  productName: string;
  brand: string;
  series: string;
  category: string;
}

const transformFlatSkuDetails = (sku: SkuDetails): FlatSkuDetails => {
  const complianceInfo = sku.compliances[0] ?? {
    type: '',
    compliance_id: '',
    issued_date: '',
    expiry_date: null,
    description: '',
  };

  const {
    lengthCm,
    widthCm,
    heightCm,
    weightG,
    lengthInch,
    widthInch,
    heightInch,
    weightLb,
  } = sku.dimensions;

  return {
    skuId: sku.skuId,
    sku: sku.sku,
    barcode: sku.barcode,
    language: sku.language,
    countryCode: sku.countryCode,
    marketRegion: sku.marketRegion,
    sizeLabel: sku.sizeLabel,
    lengthCm,
    widthCm,
    heightCm,
    weightG,
    lengthInch,
    widthInch,
    heightInch,
    weightLb,
    description: sku.description,
    status:
      typeof sku.status === 'string'
        ? sku.status
        : `SKU: ${sku.status.sku}, Product: ${sku.status.product}`,
    statusDate: sku.statusDate,
    createdAt: sku.audit.createdAt,
    createdBy: sku.audit.createdBy?.fullName ?? '—',
    updatedAt: sku.audit.updatedAt,
    updatedBy: sku.audit.updatedBy?.fullName ?? '—',
    complianceType: complianceInfo.type,
    complianceId: complianceInfo.compliance_id,
    issuedDate: complianceInfo.issued_date,
    expiryDate: complianceInfo.expiry_date,
    complianceDescription: complianceInfo.description,
    productName: sku.product.product_name,
    brand: sku.product.brand,
    series: sku.product.series,
    category: sku.product.category,
  };
};

export const mapSkuToDisplayMetadata = (
  sku: SkuDetails
): Record<string, Record<string, string>> => {
  const flat = transformFlatSkuDetails(sku);

  return {
    'Basic Info': {
      SKU: flat.sku,
      Barcode: flat.barcode || 'N/A',
      Language: flat.language || 'N/A',
      Country: flat.countryCode || 'N/A',
      'Market Region': flat.marketRegion || 'N/A',
      'Size Label': flat.sizeLabel || 'N/A',
    },
    Compliance: {
      'Compliance Type': flat.complianceType || 'N/A',
      'Compliance ID': flat.complianceId || 'N/A',
      'Issued Date': formatDate(flat.issuedDate) || 'N/A',
      'Expiry Date': flat.expiryDate ? formatDate(flat.expiryDate) : '—',
      'Compliance Description': flat.complianceDescription || 'N/A',
    },
    'Product Info': {
      'Product Name': flat.productName || 'N/A',
      Series: flat.series || 'N/A',
      Brand: flat.brand || 'N/A',
      Category: flat.category || 'N/A',
      Description: flat.description || 'N/A',
    },
    Dimensions: {
      Length: `${flat.lengthCm} cm`,
      Width: `${flat.widthCm} cm`,
      Height: `${flat.heightCm} cm`,
      Weight: `${flat.weightG} g`,
      'Length (in)': `${flat.lengthInch} in`,
      'Width (in)': `${flat.widthInch} in`,
      'Height (in)': `${flat.heightInch} in`,
      'Weight (lb)': `${flat.weightLb} lb`,
    },
    Status: {
      Status: formatLabel(flat.status),
      'Status Date': formatDate(flat.statusDate) || 'N/A',
    },
    'Audit Info': {
      'Created At': formatDate(flat.createdAt) || 'N/A',
      'Created By': flat.createdBy || 'N/A',
      'Updated At': formatDate(flat.updatedAt) || 'N/A',
      'Updated By': flat.updatedBy || 'N/A',
    },
  };
};
