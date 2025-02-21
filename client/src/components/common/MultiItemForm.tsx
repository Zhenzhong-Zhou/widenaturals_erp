import { FC, ReactNode } from 'react';
import { Box, IconButton } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { CustomButton, BaseInput, Dropdown } from '@components/index';

interface FieldConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'custom';
  options?: { value: string; label: string }[];
  component?: (props: { value: any; onChange: (value: string) => void }) => ReactNode;
  conditional?: (data: Record<string, any>) => boolean;
}

interface MultiItemFormProps {
  fields: FieldConfig[];
  onSubmit: (formData: Record<string, any>[]) => void;
  defaultValues?: Record<string, any>[];
}

const MultiItemForm: FC<MultiItemFormProps> = ({ fields, onSubmit, defaultValues = [{}] }) => {
  const { control, handleSubmit, watch } = useForm<{ items: Record<string, any>[] }>({
    defaultValues: { items: defaultValues },
  });
  
  const { fields: fieldArray, append, remove } = useFieldArray({ control, name: 'items' });
  
  const handleFormSubmit = (data: { items: Record<string, any>[] }) => {
    onSubmit(data.items);
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
      {fieldArray.map((_, index) => {
        const currentData = watch(`items.${index}`);
        
        return (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {fields.map((field) => {
              if (field.conditional && !field.conditional(currentData)) return null;
              
              return (
                <Controller
                  key={field.id}
                  name={`items.${index}.${field.id}` as const}
                  control={control}
                  defaultValue={defaultValues[index]?.[field.id] || ''}
                  render={({ field: { onChange, value } }) => {
                    if (field.type === 'custom' && field.component) {
                      const CustomComponent = field.component;
                      return <CustomComponent value={value} onChange={onChange} />;
                    }
                    
                    if (field.type === 'select') {
                      return (
                        <Dropdown
                          label={field.label}
                          options={field.options || []}
                          value={value}
                          onChange={onChange}
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
                        sx={{ minWidth: '150px', flexGrow: 1 }}
                      />
                    );
                  }}
                />
              );
            })}
            <IconButton onClick={() => remove(index)} color="error">
              <Delete />
            </IconButton>
          </Box>
        );
      })}
      
      <CustomButton type="button" variant="outlined" onClick={() => append({})}>
        <Add /> Add Another
      </CustomButton>
      
      <CustomButton type="submit" variant="contained" color="primary">
        Submit All
      </CustomButton>
    </Box>
  );
};

export default MultiItemForm;
