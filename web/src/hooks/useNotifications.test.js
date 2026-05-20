/**
 * useNotifications.test.js
 *
 * Unit tests for the useNotifications hook family.
 * API calls are mocked via vi.mock so no server is required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the api module before importing hooks
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/posthog', () => ({
  posthog: { capture: vi.fn() },
}));

import api from '@/lib/api';
import {
  useNotificationsBell,
  useMarkAllRead,
  useMarkOneRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const SAMPLE_NOTIFS = [
  { _id: 'n1', type: 'comment_added', targetType: 'note', message: 'Alice commented on your note', read: false, createdAt: new Date().toISOString() },
  { _id: 'n2', type: 'like_added', targetType: 'comment', message: 'Bob liked your comment', read: true, createdAt: new Date().toISOString() },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({ data: { notifications: SAMPLE_NOTIFS, unreadCount: 1, hasMore: false, nextCursor: null } });
  api.patch.mockResolvedValue({ data: { success: true } });
  api.delete.mockResolvedValue({ data: { success: true } });
});

// ─── useNotificationsBell ─────────────────────────────────────────────────────

describe('useNotificationsBell', () => {
  it('returns notifications from the API', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useNotificationsBell(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data.notifications).toHaveLength(2);
    expect(result.current.data.unreadCount).toBe(1);
  });

  it('calls GET /notifications with limit=10', async () => {
    const wrapper = makeWrapper();
    renderHook(() => useNotificationsBell(), { wrapper });

    await waitFor(() => expect(api.get).toHaveBeenCalledWith(
      '/notifications',
      expect.objectContaining({ params: { limit: 10 } })
    ));
  });
});

// ─── useMarkAllRead ───────────────────────────────────────────────────────────

describe('useMarkAllRead', () => {
  it('calls PATCH /notifications/read on mutate', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useMarkAllRead(), { wrapper });

    act(() => result.current.mutate({ source: 'bell' }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/notifications/read'));
  });
});

// ─── useMarkOneRead ───────────────────────────────────────────────────────────

describe('useMarkOneRead', () => {
  it('calls PATCH /notifications/:id/read with the correct id', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useMarkOneRead(), { wrapper });

    act(() => result.current.mutate('n1'));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/notifications/n1/read'));
  });
});

// ─── useDeleteNotification ────────────────────────────────────────────────────

describe('useDeleteNotification', () => {
  it('calls DELETE /notifications/:id with the correct id', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useDeleteNotification(), { wrapper });

    act(() => result.current.mutate({ id: 'n1', type: 'comment_added' }));

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/notifications/n1'));
  });
});
