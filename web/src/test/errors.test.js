import { describe, it, expect } from 'vitest';
import { friendlyError } from '@/lib/errors';

describe('friendlyError', () => {
  it('maps Invalid credentials from response body', () => {
    const err = { response: { data: { error: 'Invalid credentials' } } };
    expect(friendlyError(err)).toBe('Incorrect email or password.');
  });

  it('maps Email already registered', () => {
    const err = { response: { data: { error: 'Email already registered' } } };
    expect(friendlyError(err)).toBe('An account with this email already exists.');
  });

  it('maps Username already taken', () => {
    const err = { response: { data: { error: 'Username already taken' } } };
    expect(friendlyError(err)).toBe('This username is not available.');
  });

  it('maps User not found', () => {
    const err = { response: { data: { error: 'User not found' } } };
    expect(friendlyError(err)).toBe('No account found with that email address.');
  });

  it('maps Account not verified', () => {
    const err = { response: { data: { error: 'Account not verified' } } };
    expect(friendlyError(err)).toBe('Please verify your email before signing in.');
  });

  it('maps Token expired', () => {
    const err = { response: { data: { error: 'Token expired' } } };
    expect(friendlyError(err)).toBe('Your session has expired. Please sign in again.');
  });

  it('maps Incorrect password', () => {
    const err = { response: { data: { error: 'Incorrect password' } } };
    expect(friendlyError(err)).toBe('The current password you entered is incorrect.');
  });

  it('maps Internal server error', () => {
    const err = { response: { data: { error: 'Internal server error' } } };
    expect(friendlyError(err)).toBe('Something went wrong on our end. Please try again.');
  });

  it('falls back to default message for unmapped error', () => {
    const err = { response: { data: { error: 'Some unknown error' } } };
    expect(friendlyError(err)).toBe('Something went wrong. Please try again.');
  });

  it('falls back to err.message when no response body', () => {
    const err = { message: 'Network Error' };
    expect(friendlyError(err)).toBe('Something went wrong. Please try again.');
  });

  it('uses custom fallback parameter', () => {
    const err = { message: 'Random error' };
    expect(friendlyError(err, 'Custom message')).toBe('Custom message');
  });

  it('handles null error gracefully', () => {
    expect(friendlyError(null)).toBe('Something went wrong. Please try again.');
  });

  it('handles undefined error gracefully', () => {
    expect(friendlyError(undefined)).toBe('Something went wrong. Please try again.');
  });

  it('handles plain Error object', () => {
    const err = new Error('Some unknown error');
    expect(friendlyError(err)).toBe('Something went wrong. Please try again.');
  });

  it('maps Google sign-in password error', () => {
    const err = {
      response: {
        data: {
          error: 'Account uses Google sign-in — use forgot-password to set a password',
        },
      },
    };
    expect(friendlyError(err)).toBe(
      'This account uses Google sign-in. Use "Forgot password" to set a password.'
    );
  });
});
