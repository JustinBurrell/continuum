// Maps known backend error strings to user-facing messages.
// This prevents raw Mongoose validation messages, stack traces, or internal
// implementation details from ever being shown to the user.
const ERROR_MAP = {
  // Auth
  'Invalid credentials': 'Incorrect email or password.',
  'Email already registered': 'An account with this email already exists.',
  'Username already taken': 'This username is not available.',
  'Email is required': 'Please enter your email address.',
  'Password is required': 'Please enter your password.',
  'User not found': 'No account found with that email address.',
  'Account not verified': 'Please verify your email before signing in.',
  'Token expired': 'Your session has expired. Please sign in again.',
  'Invalid token': 'Your session is invalid. Please sign in again.',
  'Please verify your email before resetting your password. Check your inbox for the verification email.':
    'Please verify your email first. Check your inbox for the verification link.',
  // Account
  'Account uses Google sign-in — use forgot-password to set a password':
    'This account uses Google sign-in. Use "Forgot password" to set a password.',
  'Incorrect password': 'The current password you entered is incorrect.',
  'No password set — use Forgot Password to create one first':
    'No password is set on this account. Use "Forgot password" to create one.',
  // Generic server errors that should never reach users
  'Internal server error': 'Something went wrong on our end. Please try again.',
  'Internal Server Error': 'Something went wrong on our end. Please try again.',
};

/**
 * Returns a friendly, user-facing error message.
 * Falls back to `fallback` for unmapped error strings.
 *
 * @param {unknown} err - The caught error (axios error or plain Error)
 * @param {string}  [fallback] - Message shown when the error is unmapped
 */
export function friendlyError(err, fallback = 'Something went wrong. Please try again.') {
  const msg = err?.response?.data?.error || err?.message || '';
  return ERROR_MAP[msg] || fallback;
}
