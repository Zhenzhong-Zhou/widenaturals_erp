import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';

interface Props {
  slug: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string | null;
}

const PricingTypeMetadataSection = ({
  slug,
  status,
  createdBy,
  createdAt,
  updatedBy,
  updatedAt,
}: Props) => (
  <Box mt={2}>
    <CustomTypography variant="body1">
      <strong>Slug:</strong> {slug}
    </CustomTypography>
    <CustomTypography variant="body1">
      <strong>Status:</strong> {status}
    </CustomTypography>
    <CustomTypography variant="body1">
      <strong>Created By:</strong> {createdBy}
    </CustomTypography>
    <CustomTypography variant="body1">
      <strong>Created At:</strong> {new Date(createdAt).toLocaleString()}
    </CustomTypography>
    <CustomTypography variant="body1">
      <strong>Updated By:</strong> {updatedBy}
    </CustomTypography>
    <CustomTypography variant="body1">
      <strong>Updated At:</strong>{' '}
      {updatedAt ? new Date(updatedAt).toLocaleString() : '—'}
    </CustomTypography>
  </Box>
);

export default PricingTypeMetadataSection;
