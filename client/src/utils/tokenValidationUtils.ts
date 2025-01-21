import { jwtDecode } from 'jwt-decode';
import { AppError, ErrorType } from '@utils/AppError.tsx';

/**
 * Validates if the given access token is still valid based on its expiration time.
 *
 * @param accessToken - The JWT access token.
 * @returns {boolean} - Returns true if the token is valid, otherwise false.
 */
export const isTokenValid = (accessToken: string): boolean => {
  try {
    // Decode the token to extract the expiration time
    const decoded = jwtDecode<{ exp: number }>(accessToken);
    
    // Ensure the `exp` field exists and is a number
    if (!decoded.exp) {
      throw new AppError('Invalid token: Missing or invalid expiration', 400, {
        type: ErrorType.ValidationError,
      });
    }
    
    // Compare expiration time with the current time
    return decoded.exp * 1000 > Date.now();
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};
