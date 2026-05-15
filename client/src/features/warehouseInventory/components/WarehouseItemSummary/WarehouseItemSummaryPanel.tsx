import { type FC, useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import {
  CustomTypography,
  ErrorMessage,
  Loading
} from '@components/index';
import {
  WarehousePackagingSummaryCard,
  WarehouseProductSummaryCard,
} from '@features/warehouseInventory/components/WarehouseItemSummary/index';
import type {
  WarehousePackagingSummary,
  WarehouseProductSummary,
} from '@features/warehouseInventory';
import type { BatchEntityType } from '@shared-types/batch';

interface Props {
  products: WarehouseProductSummary[];
  packagingMaterials: WarehousePackagingSummary[];
  loading?: boolean;
  error?: string | null;
}

/**
 * Item-level summary panel for a warehouse with two tab sections:
 * Products (with expandable SKU breakdowns) and Packaging Materials.
 *
 * Renders a skeleton while loading and hides itself when both lists are
 * empty. Search and status filtering are scaffolded but not yet wired to
 * filtering logic — current implementation passes raw lists through.
 */
const WarehouseItemSummaryPanel: FC<Props> = ({
  products,
  packagingMaterials,
  loading = false,
  error = null,
}) => {
  const [activeTab, setActiveTab] = useState<BatchEntityType>('product');

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (loading) {
    return <Loading variant="dotted" />;
  }

  const hasProducts = products.length > 0;
  const hasPackaging = packagingMaterials.length > 0;
  if (!hasProducts && !hasPackaging) return null;

  return (
    <Box sx={{ mt: 4 }}>
      <CustomTypography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Item Summary
      </CustomTypography>
      
      <Tabs
        value={activeTab}
        onChange={(_, value: BatchEntityType) => setActiveTab(value)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab label={`Products (${products.length})`} value="product" />
        <Tab
          label={`Packaging (${packagingMaterials.length})`}
          value="packaging_material"
        />
      </Tabs>
      
      {/* ── Column headers ──────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1,
          gap: 3,
          borderBottom: 1,
          borderColor: 'divider',
          fontWeight: 600,
          fontSize: '0.75rem',
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        <Box sx={{ flex: 1 }}>Name</Box>
        
        <Box sx={{ minWidth: 80, textAlign: 'right' }}>
          Total
        </Box>
        
        <Box sx={{ minWidth: 80, textAlign: 'right' }}>
          Reserved
        </Box>
        
        <Box sx={{ minWidth: 80, textAlign: 'right' }}>
          Available
        </Box>
        
        <Box sx={{ minWidth: 75 }} />
        
        <Box sx={{ minWidth: 200 }}>Earliest Expiry</Box>
      </Box>
      
      {/* ── Tab content ─────────────────────────────────────────── */}
      <Box sx={{ mt: 1 }}>
        {activeTab === 'product' &&
          products.map((product) => (
            <WarehouseProductSummaryCard
              key={product.productId}
              product={product}
            />
          ))}
        
        {activeTab === 'packaging_material' &&
          packagingMaterials.map((material) => (
            <WarehousePackagingSummaryCard
              key={material.packagingMaterialId}
              material={material}
            />
          ))}
      </Box>
    </Box>
  );
};

export default WarehouseItemSummaryPanel;
