export const getDisplayName = ({
  customerNames,
  customerDropdownOptions,
  selectedCustomerId,
}: {
  customerNames?: string[];
  customerDropdownOptions?: { label: string; value: string }[];
  selectedCustomerId?: string | null;
}): string => {
  if (customerNames?.length === 1) {
    return customerNames[0]!;
  }

  if (customerNames?.length) {
    return customerNames.join(', ');
  }

  const selectedOption = customerDropdownOptions?.find(
    (opt) => opt.value === selectedCustomerId
  );

  return selectedOption?.label ?? 'N/A';
};
