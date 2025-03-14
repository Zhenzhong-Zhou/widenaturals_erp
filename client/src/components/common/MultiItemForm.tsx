import { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid2';
import Add from '@mui/icons-material/Add';
import Delete from '@mui/icons-material/Delete';
import { v4 as uuidv4 } from 'uuid';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { CustomButton, BaseInput, Dropdown } from '@components/index';

interface FieldConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'custom';
  options?: { value: string; label: string }[];
  component?: (props: {
    value: any;
    onChange: (value: string) => void;
  }) => ReactNode;
  conditional?: (data: Record<string, any>) => boolean;
  validation?: (value: any) => string | undefined;
}

interface MultiItemFormProps {
  fields: FieldConfig[];
  onSubmit: (formData: Record<string, any>[]) => void;
  defaultValues?: Record<string, any>[];
  validation?: (
    watch: (name: string) => any
  ) => Record<string, (value: any) => string | undefined>;
}

const MultiItemForm: FC<MultiItemFormProps> = ({
  fields,
  onSubmit,
  defaultValues = [{}],
  validation,
}) => {
  const { control, handleSubmit, watch } = useForm<{
    items: Record<string, any>[];
  }>({
    defaultValues: { items: defaultValues },
  });

  const {
    fields: fieldArray,
    append,
    remove,
  } = useFieldArray({ control, name: 'items', keyName: 'id' });

  const handleRemove = (id: string) => {
    const index = fieldArray.findIndex((item) => item.id === id);
    if (index !== -1) {
      remove(index); // Remove the correct item using its index
    }
  };

  const handleFormSubmit = (data: { items: Record<string, any>[] }) => {
    onSubmit(data.items);
  };

  const validationRules = validation ? validation(watch) : {};

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleFormSubmit)}
      sx={{
        maxWidth: '95vw',
        margin: 'auto',
      }}
    >
      {/* Parent Grid for multiple items (renders items in a row) */}
      <Grid
        container
        rowSpacing={2}
        columnSpacing={{ xs: 1, sm: 2, md: 3, lg: 5 }}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr', // 1 column for extra small screens
            sm: 'repeat(2, 1fr)', // 2 columns for small screens
            md: 'repeat(3, 1fr)', // 3 columns for medium screens
            lg: 'repeat(5, 1fr)',
          },
          gap: '16px',
          margin: 'auto',
        }}
      >
        {fieldArray.map((field, index) => {
          const currentData = watch(`items.${index}`);

          return (
            <Grid
              key={field.id}
              sx={{
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {/* Item Header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px',
                }}
              >
                <strong>Item {index + 1}</strong>
                {fieldArray.length > 1 && (
                  <IconButton
                    onClick={() => handleRemove(field.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>

              {/* Form Fields (Stacked in Vertical Layout Inside Each Form) */}
              <Grid container direction="column" spacing={2}>
                {fields.map((field) => {
                  if (field.conditional && !field.conditional(currentData))
                    return null;

                  return (
                    <Grid size={12} key={field.id}>
                      <Controller
                        name={`items.${index}.${field.id}` as const}
                        control={control}
                        defaultValue={defaultValues[index]?.[field.id] || ''}
                        render={({ field: { onChange, value } }) => {
                          const errorMessage = validationRules[field.id]
                            ? validationRules[field.id](value)
                            : undefined;

                          if (field.type === 'custom' && field.component) {
                            const CustomComponent = field.component;
                            return (
                              <CustomComponent
                                value={value}
                                onChange={onChange}
                              />
                            );
                          }

                          if (field.type === 'select') {
                            return (
                              <Dropdown
                                label={field.label}
                                options={field.options || []}
                                value={value}
                                onChange={onChange}
                                sx={{ width: '250px' }}
                              />
                            );
                          }

                          return (
                            <BaseInput
                              label={field.label}
                              type={field.type}
                              value={value || ''}
                              onChange={onChange}
                              fullWidth
                              sx={{ width: '250px' }}
                              error={!!errorMessage}
                              helperText={errorMessage}
                            />
                          );
                        }}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          );
        })}
      </Grid>

      {/* Buttons for adding and submitting */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'flex-start',
          marginTop: 2,
        }}
      >
        <CustomButton
          type="button"
          variant="outlined"
          onClick={() => append({ id: uuidv4() })}
        >
          <Add /> Add Another
        </CustomButton>

        <CustomButton type="submit" variant="contained" color="primary">
          Submit All
        </CustomButton>
      </Box>
    </Box>
  );
};

export default MultiItemForm;
