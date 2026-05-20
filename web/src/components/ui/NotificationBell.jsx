import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { posthog } from '@/lib/posthog';
import { formatRelative } from '@/lib/utils';
import AppAvatar from '@/components/ui/AppAvatar';
import {
    useNotificationsBell,
    useMarkAllRead,
    useMarkOneRead,
} from '@/hooks/useNotifications';

// Returns { to, state } for react-router navigate() — points to the exact resource.
// comment_reply and like_added target a Comment doc; fall back to /activity since
// we don't have the parent resource ID without a separate fetch.
function resolveNav(notif) {
    const { type, targetType, targetId } = notif;
    if (type === 'new_message') {
        return { to: '/messages', state: { conversationId: targetId } };
    }
    if (type === 'friend_request' || type === 'friend_accepted') {
        return { to: '/friends', state: null };
    }
    if (type === 'task_assigned') {
        return { to: '/tasks', state: { openTaskId: targetId } };
    }
    if (type === 'share_received') {
        if (targetType === 'note')        return { to: '/notes/view',     state: { id: targetId } };
        if (targetType === 'flashcardSet') return { to: '/flashcards/view', state: { id: targetId } };
        if (targetType === 'task')         return { to: '/tasks',           state: { openTaskId: targetId } };
    }
    if (type === 'comment_added') {
        if (targetType === 'note')        return { to: '/notes/view',     state: { id: targetId } };
        if (targetType === 'flashcardSet') return { to: '/flashcards/view', state: { id: targetId } };
        if (targetType === 'task')         return { to: '/tasks',           state: { openTaskId: targetId } };
    }
    // comment_reply / like_added have targetType: 'comment' — best we can do is /activity
    return { to: '/activity', state: null };
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);
    const navigate = useNavigate();

    const { data, isLoading } = useNotificationsBell();
    const { mutate: markAll } = useMarkAllRead();
    const { mutate: markOne } = useMarkOneRead();

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;

    // Close on outside click
    useEffect(() => {
        function handleMouseDown(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        function handleKey(e) {
            if (e.key === 'Escape') setOpen(false);
        }
        if (open) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open]);

    function handleToggle() {
        const next = !open;
        setOpen(next);
        if (next) posthog.capture('notification_bell_opened', { unreadCount });
    }

    function handleItemClick(notif) {
        markOne(notif._id);
        posthog.capture('notification_bell_item_clicked', { type: notif.type, targetType: notif.targetType });
        const { to, state } = resolveNav(notif);
        navigate(to, state ? { state } : undefined);
        setOpen(false);
    }

    function handleMarkAll() {
        markAll({ source: 'bell' });
        posthog.capture('notification_all_marked_read', { source: 'bell', count: unreadCount });
    }

    function handleSeeAll() {
        posthog.capture('notification_see_all_clicked');
        navigate('/notifications');
        setOpen(false);
    }

    const badgeLabel = unreadCount > 9 ? '9+' : unreadCount;

    return (
        // position: relative so the dropdown can use position: absolute from this anchor
        <div ref={wrapperRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {/* Bell button */}
            <button
                onClick={handleToggle}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: 'none',
                    background: open ? 'rgba(107,33,168,0.08)' : 'transparent',
                    cursor: 'pointer',
                    color: '#9CA3AF',
                    transition: 'background 0.15s, color 0.15s',
                    flexShrink: 0,
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(107,33,168,0.08)';
                    e.currentTarget.style.color = '#6b21a8';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = open ? 'rgba(107,33,168,0.08)' : 'transparent';
                    e.currentTarget.style.color = '#9CA3AF';
                }}
            >
                <Bell size={16} strokeWidth={1.75} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        minWidth: 14,
                        height: 14,
                        padding: '0 3px',
                        borderRadius: 7,
                        background: '#dc2626',
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 700,
                        lineHeight: '14px',
                        textAlign: 'center',
                        pointerEvents: 'none',
                    }}>
                        {badgeLabel}
                    </span>
                )}
            </button>

            {/* Dropdown — positioned absolutely from the wrapper so it works
                in both the sidebar header and any other context */}
            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 360,
                    maxHeight: 480,
                    overflowY: 'auto',
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px 10px',
                        borderBottom: '1px solid #F3F4F6',
                        flexShrink: 0,
                    }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                            Notifications
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAll}
                                style={{
                                    fontSize: 12,
                                    color: '#6b21a8',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    fontWeight: 500,
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {isLoading ? (
                            <p style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                                Loading...
                            </p>
                        ) : notifications.length === 0 ? (
                            <p style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                                You are all caught up
                            </p>
                        ) : (
                            notifications.map(notif => (
                                <NotifItem
                                    key={notif._id}
                                    notif={notif}
                                    onClick={() => handleItemClick(notif)}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <button
                        onClick={handleSeeAll}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderTop: '1px solid #F3F4F6',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#6b21a8',
                            textAlign: 'center',
                            flexShrink: 0,
                        }}
                    >
                        See all notifications
                    </button>
                </div>
            )}
        </div>
    );
}

function NotifItem({ notif, onClick }) {
    const actor = notif.actorId;
    const actorName = actor
        ? `${actor.firstName || ''} ${actor.lastName || ''}`.trim()
        : 'Someone';

    return (
        // div instead of button so <Link> for the actor name is valid HTML
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={e => e.key === 'Enter' && onClick()}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                width: '100%',
                padding: '10px 16px',
                background: notif.read ? 'transparent' : 'rgba(107,33,168,0.04)',
                borderLeft: notif.read ? '3px solid transparent' : '3px solid #6b21a8',
                cursor: 'pointer',
                transition: 'background 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,33,168,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(107,33,168,0.04)'}
        >
            {/* Avatar — links to actor profile */}
            <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
                <Link to="/users/view" state={{ id: actor?._id }}>
                    <AppAvatar
                        name={actorName}
                        src={actor?.avatarUrl}
                        size="sm"
                    />
                </Link>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Actor name — clickable link to profile */}
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
                <p style={{
                    fontSize: 13,
                    color: '#374151',
                    margin: 0,
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                }}>
                    {notif.message}
                </p>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '3px 0 0', lineHeight: 1.3 }}>
                    {formatRelative(notif.createdAt)}
                </p>
            </div>
        </div>
    );
}
