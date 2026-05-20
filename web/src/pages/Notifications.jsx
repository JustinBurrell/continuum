import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { posthog } from '@/lib/posthog';
import { formatRelative } from '@/lib/utils';
import AppAvatar from '@/components/ui/AppAvatar';
import { resolveNav } from '@/components/ui/NotificationBell';
import {
    useNotificationsFeed,
    useMarkAllRead,
    useMarkOneRead,
    useDeleteNotification,
} from '@/hooks/useNotifications';

// ============================================================
// NOTIFICATIONS PAGE
// Instagram-style full notification history.
// Groups notifications by: Today / This week / This month / Earlier
// Infinite scroll via IntersectionObserver on a sentinel div.
// ============================================================

const MS_DAY = 86400000;

function getGroup(createdAt) {
    const age = Date.now() - new Date(createdAt).getTime();
    if (age < MS_DAY) return 'Today';
    if (age < 7 * MS_DAY) return 'This week';
    if (age < 30 * MS_DAY) return 'This month';
    return 'Earlier';
}

const GROUP_ORDER = ['Today', 'This week', 'This month', 'Earlier'];

function groupNotifications(notifications) {
    const map = {};
    for (const n of notifications) {
        const g = getGroup(n.createdAt);
        if (!map[g]) map[g] = [];
        map[g].push(n);
    }
    return GROUP_ORDER.filter(g => map[g]?.length).map(g => ({ label: g, items: map[g] }));
}


export default function Notifications() {
    const navigate = useNavigate();
    const sentinelRef = useRef(null);

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useNotificationsFeed();

    const { mutate: markAll } = useMarkAllRead();
    const { mutate: markOne } = useMarkOneRead();
    const { mutate: deleteNotif } = useDeleteNotification();

    // Flatten all pages into one list
    const allNotifications = data?.pages.flatMap(p => p.notifications || []) || [];
    const unreadCount = data?.pages[0]?.unreadCount || 0;
    const groups = groupNotifications(allNotifications);

    // Fire page view PostHog event on mount
    useEffect(() => {
        posthog.capture('notification_page_viewed', { unreadCount });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // IntersectionObserver for infinite scroll sentinel
    useEffect(() => {
        if (!sentinelRef.current || !hasNextPage) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetchingNextPage) {
                    fetchNextPage();
                    posthog.capture('notification_load_more');
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    function handleItemClick(notif) {
        markOne(notif._id);
        posthog.capture('notification_page_item_clicked', { type: notif.type, targetType: notif.targetType });
        const { to, state } = resolveNav(notif);
        navigate(to, state ? { state } : undefined);
    }

    function handleMarkAll() {
        markAll({ source: 'page' });
        posthog.capture('notification_all_marked_read', { source: 'page', count: unreadCount });
    }

    function handleDelete(notif, e) {
        e.stopPropagation();
        deleteNotif({ id: notif._id, type: notif.type });
    }

    return (
        <div>
            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.625rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Notifications
                </h1>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAll}
                        style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#6b21a8',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '6px 10px',
                            borderRadius: 6,
                        }}
                    >
                        Mark all read
                    </button>
                )}
            </div>

            {/* Loading state */}
            {isLoading && (
                <p style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingTop: 48 }}>
                    Loading...
                </p>
            )}

            {/* Empty state */}
            {!isLoading && allNotifications.length === 0 && (
                <div style={{ textAlign: 'center', paddingTop: 64 }}>
                    <p style={{ fontSize: 15, color: '#6B7280', margin: 0 }}>No notifications yet</p>
                    <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>
                        Activity from your friends will appear here.
                    </p>
                </div>
            )}

            {/* Grouped notifications */}
            {groups.map(group => (
                <section key={group.label} style={{ marginBottom: 28 }}>
                    <p style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#9CA3AF',
                        marginBottom: 8,
                        padding: '0 4px',
                    }}>
                        {group.label}
                    </p>
                    <div style={{
                        background: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: 10,
                        overflow: 'hidden',
                    }}>
                        {group.items.map((notif, i) => (
                            <PageNotifItem
                                key={notif._id}
                                notif={notif}
                                isLast={i === group.items.length - 1}
                                onClick={() => handleItemClick(notif)}
                                onDelete={(e) => handleDelete(notif, e)}
                            />
                        ))}
                    </div>
                </section>
            ))}

            {/* Infinite scroll sentinel */}
            {hasNextPage && (
                <div ref={sentinelRef} style={{ height: 1 }} />
            )}
            {isFetchingNextPage && (
                <p style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingTop: 12 }}>
                    Loading more...
                </p>
            )}
        </div>
    );
}

function PageNotifItem({ notif, isLast, onClick, onDelete }) {
    const actor = notif.actorId;
    const actorName = actor
        ? `${actor.firstName || ''} ${actor.lastName || ''}`.trim()
        : 'Someone';

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={e => e.key === 'Enter' && onClick()}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 16px',
                background: notif.read ? 'transparent' : 'rgba(107,33,168,0.04)',
                borderLeft: notif.read ? '3px solid transparent' : '3px solid #6b21a8',
                borderBottom: isLast ? 'none' : '1px solid #F3F4F6',
                cursor: 'pointer',
                transition: 'background 0.1s',
                position: 'relative',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(107,33,168,0.06)';
                const del = e.currentTarget.querySelector('[data-delete]');
                if (del) del.style.opacity = '1';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(107,33,168,0.04)';
                const del = e.currentTarget.querySelector('[data-delete]');
                if (del) del.style.opacity = '0';
            }}
        >
            {/* Avatar — links to actor profile, stops row click */}
            <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0, marginTop: 1 }}>
                <Link to="/users/view" state={{ id: actor?._id }}>
                    <AppAvatar name={actorName} src={actor?.avatarUrl} size="sm" />
                </Link>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Actor name — clickable, stops row click */}
                {actor && (
                    <span
                        onClick={e => e.stopPropagation()}
                        style={{ display: 'block', marginBottom: 2 }}
                    >
                        <Link
                            to="/users/view"
                            state={{ id: actor._id }}
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#6b21a8',
                                textDecoration: 'none',
                            }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >
                            {actorName}
                        </Link>
                    </span>
                )}
                <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.4 }}>
                    {notif.message}
                </p>
                {notif.metadata?.commentPreview && (
                    <p style={{
                        fontSize: 12,
                        color: '#6B7280',
                        fontStyle: 'italic',
                        margin: '3px 0 0',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                    }}>
                        "{notif.metadata.commentPreview}"
                    </p>
                )}
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '3px 0 0' }}>
                    {formatRelative(notif.createdAt)}
                </p>
            </div>

            <button
                data-delete="true"
                onClick={onDelete}
                aria-label="Dismiss notification"
                style={{
                    opacity: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: 'none',
                    background: '#F3F4F6',
                    cursor: 'pointer',
                    color: '#6B7280',
                    flexShrink: 0,
                    transition: 'opacity 0.15s, background 0.1s',
                    marginTop: 1,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                onMouseLeave={e => e.currentTarget.style.background = '#F3F4F6'}
            >
                <X size={12} />
            </button>
        </div>
    );
}
