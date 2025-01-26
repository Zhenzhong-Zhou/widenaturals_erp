// import { useAppSelector } from '../store/storeHooks';
// import { selectIsAuthenticated, selectUserRole } from '../features/auth/state/authSelectors';
//
// /**
//  * Custom hook for checking user authorization based on roles.
//  * @param requiredRoles - A string or array of strings representing the roles allowed to access.
//  * @returns An object containing `isAuthorized` and `userRole`.
//  */
// const useAuthorization = (requiredRoles?: string | string[]) => {
//   const isAuthenticated = useAppSelector(selectIsAuthenticated);
//   const userRole = useAppSelector(selectUserRole);
//
//   if (typeof userRole === 'string') {
//     const isAuthorized =
//       isAuthenticated &&
//       (!requiredRoles ||
//         (Array.isArray(requiredRoles)
//           ? requiredRoles.includes(userRole)
//           : userRole === requiredRoles));
//   }
//
//   return { isAuthorized, userRole };
// };
//
// export default useAuthorization;
