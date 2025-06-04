import { useNavigate } from 'react-router-dom';
import type { FC } from 'react';
import ModuleErrorBoundary, {
  type ModuleErrorBoundaryProps,
} from '@components/shared/ModuleErrorBoundary';

const ModuleErrorBoundaryWrapper: FC<
  Omit<ModuleErrorBoundaryProps, 'navigate'>
> = (props) => {
  const navigate = useNavigate();
  return <ModuleErrorBoundary {...props} navigate={navigate} />;
};

export default ModuleErrorBoundaryWrapper;
