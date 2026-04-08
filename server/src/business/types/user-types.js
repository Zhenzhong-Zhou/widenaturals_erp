/**
 * Payload for creating a new user. Passed to createUserService.
 *
 * @typedef {{
 *   email:        string,
 *   password:     string,
 *   roleId:       string,
 *   firstname?:   string,
 *   lastname?:    string,
 *   phoneNumber?: string | null,
 *   jobTitle?:    string,
 *   note?:        string,
 *   statusDate?:  Date | string,
 * }} CreateUserPayload
 */
