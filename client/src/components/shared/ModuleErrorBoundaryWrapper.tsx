import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ModuleErrorBoundaryProps } from '@components/shared/ModuleErrorBoundary';
import { ModuleErrorBoundary } from '@components/index';

/**
 * ModuleErrorBoundaryWrapper
 *
 * Thin functional wrapper around `ModuleErrorBoundary` that injects
 * a React Router `navigate` function.
 *
 * Responsibilities:
 * - Bridge router-specific APIs into a class-based error boundary
 * - Preserve `ModuleErrorBoundary` as a pure, router-agnostic component
 *
 * Design rationale:
 * - Class components cannot use hooks such as `useNavigate`
 * - Routing concerns must not leak into the boundary implementation
 * - This wrapper keeps navigation logic declarative and composable
 *
 * Characteristics:
 * - No side effects
 * - No state
 * - Safe to reuse across modules and routes
 *
 * Usage:
 * - Wrap feature modules that require localized error recovery
 * - Prefer over directly coupling navigation logic into error boundaries
 */
const ModuleErrorBoundaryWrapper: FC<
  Omit<ModuleErrorBoundaryProps, 'navigate'>
> = (props) => {
  const navigate = useNavigate();
  return <ModuleErrorBoundary {...props} navigate={navigate} />;
};

export default ModuleErrorBoundaryWrapper;
