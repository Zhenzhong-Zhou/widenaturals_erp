import type { FC } from "react";
import { Link } from 'react-router-dom';
import Skeleton from "@mui/material/Skeleton";
import CustomCard from "@components/common/CustomCard";
import CustomTypography from "@components/common/CustomTypography";
import TruncatedText from '@components/common/TruncatedText';
import { formatImageUrl } from "@utils/formatImageUrl";
import {
  formatCompliance,
  formatCurrency,
  formatLabel
} from '@utils/textUtils';
import type { SkuProductCardViewItem } from "@features/sku/state/skuTypes";

interface ProductCardProps {
  isLoading: boolean;
  product: SkuProductCardViewItem;
}

const ProductCatalogCard: FC<ProductCardProps> = ({ isLoading, product }) => {
  // ---------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------
  if (isLoading) {
    return (
      <CustomCard
        title={<Skeleton width="80%" />}
        imageUrl=""
        imageAlt=""
        actions={
          <>
            <Skeleton variant="rectangular" width={80} height={32} />
            <Skeleton variant="rectangular" width={100} height={32} />
          </>
        }
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={20} sx={{ mb: 1 }} />
        ))}
      </CustomCard>
    );
  }
  
  // ---------------------------------------------------------------------
  // Extract data
  // -----------------------------------------------------------------------
  const {
    skuId,
    skuCode,
    displayName,
    brand,
    series,
    category,
    barcode,
    complianceType,
    complianceNumber,
    unifiedStatus,
    productStatus,
    skuStatus,
    msrp,
    imageUrl,
    imageAlt,
  } = product;
  
  const resolvedImageUrl = imageUrl ? formatImageUrl(imageUrl) : "";
  
  // ---------------------------------------------------------------------
  // Status handling
  // ---------------------------------------------------------------------
  const statusRows =
    unifiedStatus
      ? [
        {
          label: "Status",
          value: formatLabel(unifiedStatus),
        }
      ]
      : [
        {
          label: "Product Status",
          value: productStatus ? formatLabel(productStatus) : "N/A",
        },
        {
          label: "SKU Status",
          value: skuStatus ? formatLabel(skuStatus) : "N/A",
        }
      ];
  
  const infoItems = [
    { label: "SKU", value: skuCode },
    { label: "Brand", value: brand },
    { label: "Series", value: series },
    { label: "Category", value: category },
    { label: "Barcode", value: barcode },
    { label: "Compliance", value: formatCompliance(complianceType, complianceNumber) },
    ...statusRows,
    { label: "MSRP", value: msrp != null ? formatCurrency(msrp) : "N/A" },
  ];
  
  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <Link to={`/skus/${skuId}`} style={{ textDecoration: "none" }}>
      <CustomCard
        title={
          <TruncatedText
            text={displayName}
            maxLength={40}
            sx={{
              fontWeight: 600,
              fontSize: "1.5rem",          // adjust as needed
              textAlign: "center",       // center the text
              width: "100%",             // ensure full width so centering works
              display: "block",          // ensure centering applies cleanly
            }}
          />
        }
        imageUrl={resolvedImageUrl}
        imageAlt={imageAlt || displayName}
        sx={{
          borderRadius: "16px",
          overflow: "hidden",  // ensures shadow curves match card shape
          transition: "transform .25s ease, box-shadow .25s ease",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",  // default subtle shadow
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: `
              0 4px 12px rgba(0,0,0,0.12),
              0 8px 20px rgba(0,0,0,0.08)
            `,
          },
        }}
      >
        {infoItems.map((item) => (
          <CustomTypography key={item.label} variant="body2">
            <strong>{item.label}:</strong> {item.value}
          </CustomTypography>
        ))}
      </CustomCard>
    </Link>
  );
};

export default ProductCatalogCard;
