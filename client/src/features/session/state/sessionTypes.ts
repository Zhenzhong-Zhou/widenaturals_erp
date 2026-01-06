import {
  ApiSuccessResponse,
  AsyncState,
} from '@shared-types/api';

/* =========================================================
 * LOGIN
 * ======================================================= */

/**
 * Data payload returned after a successful login.
 *
 * This object is wrapped inside the standard API success
 * response envelope and contains authentication-related
 * information required by the client to establish a session.
 */
export interface LoginResponseData {
  /**
   * Short-lived JWT access token used to authenticate
   * subsequent API requests.
   *
   * This token is stored in Redux state and attached
   * dynamically to outgoing requests via Axios interceptors.
   */
  accessToken: string;
  
  /**
   * CSRF token required for all state-changing requests
   * following authentication.
   *
   * This value is issued alongside the access token and
   * must be included in all non-idempotent requests.
   */
  csrfToken: string;
  
  /**
   * ISO 8601 timestamp of the user's previous successful login.
   *
   * This value is `null` when the user logs in for the first time.
   * It is intended for informational display only.
   */
  lastLogin: string | null;
}

/**
 * API response returned by the login endpoint on success.
 *
 * This follows the standard `ApiSuccessResponse<T>` contract,
 * where `T` represents the authentication payload.
 */
export type LoginApiResponse =
  ApiSuccessResponse<LoginResponseData>;

/**
 * Request body expected by the login endpoint.
 *
 * Contains user-provided credentials used to authenticate
 * and establish a new session.
 */
export interface LoginRequestBody {
  /**
   * User email address used for authentication.
   */
  email: string;
  
  /**
   * Plaintext password provided by the user.
   *
   * This value is never persisted, logged, or returned
   * by the server.
   */
  password: string;
}

/**
 * Redux state shape for login-related async operations.
 *
 * - `data` contains authentication payload on success
 * - `loading` reflects an in-flight login request
 * - `error` contains a user-safe error message, if any
 */
export type LoginState =
  AsyncState<LoginResponseData | null>;

/* =========================================================
 * TOKEN REFRESH
 * ======================================================= */

/**
 * Data payload returned after a successful token refresh.
 *
 * Refreshing a session issues a new access token while
 * preserving the existing authentication context.
 */
export interface RefreshTokenResponseData {
  /**
   * Newly issued short-lived JWT access token.
   */
  accessToken: string;
}

/**
 * API response returned by the token refresh endpoint on success.
 *
 * This follows the standard `ApiSuccessResponse<T>` contract,
 * where `T` represents the refreshed authentication payload.
 */
export type RefreshTokenApiResponse =
  ApiSuccessResponse<RefreshTokenResponseData>;

/* =========================================================
 * LOGOUT
 * ======================================================= */

/**
 * Data payload returned after a successful logout.
 *
 * Logout is a destructive operation and does not
 * return any domain-specific data.
 */
export type LogoutResponseData = null;

/**
 * API response returned by the logout endpoint on success.
 *
 * This follows the standard `ApiSuccessResponse<T>` contract
 * with a `null` data payload.
 *
 * Client-side session cleanup is handled independently
 * of this response.
 */
export type LogoutApiResponse =
  ApiSuccessResponse<LogoutResponseData>;
