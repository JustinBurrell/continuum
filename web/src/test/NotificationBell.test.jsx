/**
 * NotificationBell.test.jsx
 *
 * Component tests for the NotificationBell dropdown.
 * Verifies badge rendering, open/close behavior, item click navigation,
 * mark-all-read, and PostHog event firing.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'u1', firstName: 'Test', lastName: 'User' } }),
}));

import api from '@/lib/api';
import { posthog } from '@/lib/posthog';
import NotificationBell from '@/components/ui/NotificationBell';

const UNREAD_NOTIF = {
  _id: 'n1',
  type: 'comment_added',
  targetType: 'note',
  message: 'Alice commented on your note',
  read: false,
  createdAt: new Date().toISOString(),
  actorId: { _id: 'a1', firstName: 'Alice', lastName: 'Smith', avatarUrl: null },
};

const READ_NOTIF = {
  _id: 'n2',
  type: 'new_message',
  targetType: 'conversation',
  message: 'Bob sent you a message',
  read: true,
  createdAt: new Date().toISOString(),
  actorId: { _id: 'b1', firstName: 'Bob', lastName: 'Jones', avatarUrl: null },
};

function renderBell(notifs = [], unreadCount = 0) {
  api.get.mockResolvedValue({
    data: { notifications: notifs, unreadCount, hasMore: false, nextCursor: null },
  });
  api.patch.mockResolvedValue({ data: { success: true } });

  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

// ─── Badge rendering ──────────────────────────────────────────────────────────

describe('Badge rendering', () => {
  it('shows no badge when unreadCount is 0', async () => {
    renderBell([], 0);
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    // Badge span should not be in the document
    expect(screen.queryByText(/^\d+$|^9\+$/)).not.toBeInTheDocument();
  });

  it('shows the correct unread count when > 0', async () => {
    renderBell([UNREAD_NOTIF], 1);
    await waitFor(() => screen.getByText('1'));
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows "9+" when unreadCount > 9', async () => {
    renderBell([UNREAD_NOTIF], 10);
    await waitFor(() => screen.getByText('9+'));
    expect(screen.getByText('9+')).toBeInTheDocument();
  });
});

// ─── Dropdown open/close ──────────────────────────────────────────────────────

describe('Dropdown open/close', () => {
  it('dropdown is hidden initially', async () => {
    renderBell();
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('opens on bell click and fires PostHog event', async () => {
    const user = userEvent.setup();
    renderBell([UNREAD_NOTIF], 1);
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /Notifications/i }));

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(posthog.capture).toHaveBeenCalledWith('notification_bell_opened', expect.any(Object));
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    renderBell([UNREAD_NOTIF], 1);
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /Notifications/i }));
    expect(screen.getByText('Notifications')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });
});

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('Empty state', () => {
  it('shows "You are all caught up" when no notifications', async () => {
    const user = userEvent.setup();
    renderBell([], 0);
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /Notifications/i }));

    expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
  });
});

// ─── Notification items ───────────────────────────────────────────────────────

describe('Notification items', () => {
  it('renders notification message text', async () => {
    const user = userEvent.setup();
    renderBell([UNREAD_NOTIF, READ_NOTIF], 1);
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /Notifications/i }));

    expect(screen.getByText('Alice commented on your note')).toBeInTheDocument();
    expect(screen.getByText('Bob sent you a message')).toBeInTheDocument();
  });
});

// ─── Mark one read ────────────────────────────────────────────────────────────

describe('Mark one read', () => {
  it('calls PATCH and fires PostHog on item click', async () => {
    const user = userEvent.setup();
    renderBell([UNREAD_NOTIF], 1);
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /Notifications/i }));

    const item = screen.getByText('Alice commented on your note');
    await user.click(item);

    expect(api.patch).toHaveBeenCalledWith('/notifications/n1/read');
    expect(posthog.capture).toHaveBeenCalledWith(
      'notification_bell_item_clicked',
      expect.objectContaining({ type: 'comment_added' })
    );
  });
});

// ─── Mark all read ────────────────────────────────────────────────────────────

describe('Mark all read', () => {
  it('mark-all button is absent when unreadCount is 0', async () => {
    const user = userEvent.setup();
    renderBell([READ_NOTIF], 0);
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /Notifications/i }));

    expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();
  });

  it('mark-all button is visible and calls PATCH when unread > 0', async () => {
    const user = userEvent.setup();
    renderBell([UNREAD_NOTIF], 1);
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /Notifications/i }));

    const btn = screen.getByText('Mark all read');
    expect(btn).toBeInTheDocument();

    await user.click(btn);

    expect(api.patch).toHaveBeenCalledWith('/notifications/read');
    expect(posthog.capture).toHaveBeenCalledWith(
      'notification_all_marked_read',
      expect.objectContaining({ source: 'bell' })
    );
  });
});
