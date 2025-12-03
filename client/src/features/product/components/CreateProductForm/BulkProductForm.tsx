import { type FC, useMemo } from 'react';
import MultiItemForm, {
  type MultiItemFieldConfig,
} from '@components/common/MultiItemForm';
import type { CreateProductInput } from '@features/product/state/productTypes';
import { makeSeriesBrandCategoryField } from '@features/product/utils/productFieldFactory';

export interface BulkProductFormProps {
  defaultValues?: Partial<CreateProductInput>[];
  onSubmit: (products: CreateProductInput[]) => void;
  loading?: boolean;
}

const BulkProductForm: FC<BulkProductFormProps> = ({
  defaultValues = [{}],
  onSubmit,
  loading,
}) => {
  /**
   * Bulk product field configuration.
   * Uses `MultiItemFieldConfig` just like BulkAddressForm.
   */
  const fields = useMemo<MultiItemFieldConfig[]>(
    () => [
      {
        id: 'name',
        label: 'Product Name',
        type: 'text',
        required: true,
        group: 'basic',
      },
      makeSeriesBrandCategoryField('series', {
        required: false,
        group: 'basic',
      }),
      makeSeriesBrandCategoryField('brand', {
        required: true,
        group: 'basic',
      }),
      makeSeriesBrandCategoryField('category', {
        required: true,
        group: 'basic',
      }),
      {
        id: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        group: 'description',
      },
    ],
    []
  );

  return (
    <MultiItemForm
      fields={fields}
      loading={loading}
      defaultValues={defaultValues}
      onSubmit={(formRows) => {
        const parsed = formRows.map((row) => ({
          name: row.name,
          series: row.series ?? null,
          brand: row.brand,
          category: row.category,
          description: row.description ?? null,
        })) as CreateProductInput[];

        onSubmit(parsed);
      }}
      validation={() =>
        Object.fromEntries(
          fields.filter((f) => f.validation).map((f) => [f.id, f.validation!])
        )
      }
      getItemTitle={(index, item) =>
        item.name ? `Product: ${item.name}` : `Product #${index + 1}`
      }
    />
  );
};

export default BulkProductForm;
