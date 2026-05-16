import type { FC, ReactNode } from 'react';
import Skeleton from '@mui/material/Skeleton';

interface Props {
  /** Whether the current user is permitted to see the gated content. */
  canView: boolean;
  /** Whether the underlying data is currently loading. */
  loading: boolean;
  /** Error from the data fetch, if any. */
  error: string | null | undefined;
  /** Optional skeleton height. Defaults to 120. */
  skeletonHeight?: number;
  /** The gated section(s). Rendered only when canView and !loading and !error. */
  children: ReactNode;
}

/**
 * Common gating wrapper for permission-and-loading-aware dashboard
 * sections. Renders nothing when the user lacks permission or the
 * fetch has errored, renders a skeleton while loading, and renders
 * its children once the data is ready.
 *
 * Centralizes the loading/permission/error ladder so individual
 * section components can stay pure and the role pages stay declarative.
 */
const DashboardSectionGate: FC<Props> = ({
  canView,
  loading,
  error,
  skeletonHeight = 120,
  children,
}) => {
  if (!canView) return null;
  if (error) return null;
  if (loading) {
    return (
      <Skeleton
        variant="rectangular"
        height={skeletonHeight}
        sx={{ borderRadius: 2 }}
      />
    );
  }
  return <>{children}</>;
};

export default DashboardSectionGate;
