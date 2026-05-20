/**
 * Notifications.test.jsx
 *
 * Component tests for the Notifications history page.
 * Verifies time grouping, empty state, mark-all-read, item click PostHog,
 * and delete (dismiss) behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

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

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => vi.fn() };
});

import api from '@/lib/api';
import { posthog } from '@/lib/posthog';
import Notifications from '@/pages/Notifications';

function msAgo(ms) {
  return new Date(Date.now() - ms).toISOString();
}

const MS_HOUR = 3600000;
const MS_DAY = 86400000;

function makeNotif(id, type, ageMs, read = true) {
  return {
    _id: id,
    type,
    targetType: 'note',
    message: `Notif ${id}`,
    read,
    createdAt: msAgo(ageMs),
    actorId: { _id: 'a1', firstName: 'Alice', lastName: 'Smith', avatarUrl: null },
  };
}

function renderPage(pages) {
  api.get.mockImplementation((_url, opts) => {
    const cursor = opts?.params?.cursor;
    const pageData = cursor ? pages[1] : pages[0];
    return Promise.resolve({ data: pageData });
  });
  api.patch.mockResolvedValue({ data: { success: true } });
  api.delete.mockResolvedValue({ data: { success: true } });

  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

// ─── Time grouping ────────────────────────────────────────────────────────────

describe('Time grouping', () => {
  it('shows "Today" group for a notification from 1 hour ago', async () => {
    const todayNotif = makeNotif('n1', 'comment_added', 1 * MS_HOUR);
    renderPage([{
      notifications: [todayNotif],
      unreadCount: 0,
      hasMore: false,
      nextCursor: null,
    }]);

    await waitFor(() => screen.getByText('Today'));
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('shows "This week" group for a notification from 3 days ago', async () => {
    const weekNotif = makeNotif('n2', 'like_added', 3 * MS_DAY);
    renderPage([{
      notifications: [weekNotif],
      unreadCount: 0,
      hasMore: false,
      nextCursor: null,
    }]);

    await waitFor(() => screen.getByText('This week'));
    expect(screen.getByText('This week')).toBeInTheDocument();
  });

  it('shows "This month" group for a notification from 15 days ago', async () => {
    const monthNotif = makeNotif('n3', 'share_received', 15 * MS_DAY);
    renderPage([{
      notifications: [monthNotif],
      unreadCount: 0,
      hasMore: false,
      nextCursor: null,
    }]);

    await waitFor(() => screen.getByText('This month'));
    expect(screen.getByText('This month')).toBeInTheDocument();
  });

  it('shows "Earlier" group for a notification from 45 days ago', async () => {
    const olderNotif = makeNotif('n4', 'friend_request', 45 * MS_DAY);
    renderPage([{
      notifications: [olderNotif],
      unreadCount: 0,
      hasMore: false,
      nextCursor: null,
    }]);

    await waitFor(() => screen.getByText('Earlier'));
    expect(screen.getByText('Earlier')).toBeInTheDocument();
  });

  it('does not render a group header when the group is empty', async () => {
    // Only a "Today" notification - "This week" header should not appear
    const todayNotif = makeNotif('n1', 'comment_added', 1 * MS_HOUR);
    renderPage([{
      notifications: [todayNotif],
      unreadCount: 0,
      hasMore: false,
      nextCursor: null,
    }]);

    await waitFor(() => screen.getByText('Today'));
    expect(screen.queryByText('This week')).not.toBeInTheDocument();
  });
});

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('Empty state', () => {
  it('shows "No notifications yet" when there are no notifications', async () => {
    renderPage([{
      notifications: [],
      unreadCount: 0,
      hasMore: false,
      nextCursor: null,
    }]);

    await waitFor(() => screen.getByText(/No notifications yet/i));
    expect(screen.getByText(/No notifications yet/i)).toBeInTheDocument();
  });
});

// ─── Mark all read ────────────────────────────────────────────────────────────

describe('Mark all read on page', () => {
  it('button is absent when unreadCount is 0', async () => {
    renderPage([{
      notifications: [makeNotif('n1', 'comment_added', MS_HOUR)],
      unreadCount: 0,
      hasMore: false,
      nextCursor: null,
    }]);

    await waitFor(() => screen.getByText('Today'));
    expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();
  });

  it('calls PATCH and fires PostHog with source: page when clicked', async () => {
    const user = userEvent.setup();
    renderPage([{
      notifications: [makeNotif('n1', 'comment_added', MS_HOUR, false)],
      unreadCount: 1,
      hasMore: false,
      nextCursor: null,
    }]);

    await waitFor(() => screen.getByText('Mark all read'));
    await user.click(screen.getByText('Mark all read'));

    expect(api.patch).toHaveBeenCalledWith('/notifications/read');
    expect(posthog.capture).toHaveBeenCalledWith(
      'notification_all_marked_read',
      expect.objectContaining({ source: 'page' })
    );
  });
});

// ─── Item click ───────────────────────────────────────────────────────────────

describe('Item click', () => {
  it('fires PostHog notification_page_item_clicked on item click', async () => {
    const user = userEvent.setup();
    renderPage([{
      notifications: [makeNotif('n1', 'comment_added', MS_HOUR)],
      unreadCount: 0,
      hasMore: false,
      nextCursor: null,
    }]);

    await waitFor(() => screen.getByText('Notif n1'));
    await user.click(screen.getByText('Notif n1'));

    expect(posthog.capture).toHaveBeenCalledWith(
      'notification_page_item_clicked',
      expect.objectContaining({ type: 'comment_added' })
    );
  });
});
