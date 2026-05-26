import { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Activity as ActivityIcon, Search } from 'lucide-react';
import api from '@/lib/api';
import { posthog } from '@/lib/posthog';
import Button from '@/components/ui/Button';
import ActivitySkeleton from '@/components/skeletons/ActivitySkeleton';
import ActivityFeedItem from '@/components/ui/ActivityFeedItem';

const PAGE_SIZE = 20;

export default function Activity() {
  const [actSearch, setActSearch] = useState('');
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();
  const searchDebounceRef = useRef(null);
  const viewedRef = useRef(false);

  useEffect(() => {
    api.put('/activity/mark-seen').then(() => {
      const now = new Date().toISOString();
      updateUser({ lastViewedActivityAt: now });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    }).catch(() => {});
  }, []);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['activity', { actSearch }],
    queryFn: ({ pageParam }) =>
      api.get('/activity', {
        params: {
          limit: PAGE_SIZE,
          ...(pageParam ? { cursor: pageParam } : {}),
          ...(actSearch ? { search: actSearch } : {}),
        },
      }).then(r => r.data),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const activities = data?.pages.flatMap(p => p.feed) ?? [];

  // Fire feed_viewed once after first successful load
  useEffect(() => {
    if (!isLoading && data && !viewedRef.current) {
      viewedRef.current = true;
      posthog.capture('activity_feed_viewed', { total_items: activities.length });
    }
  }, [isLoading, data]);

  // Debounced search tracking
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setActSearch(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (value.trim()) {
      searchDebounceRef.current = setTimeout(() => {
        posthog.capture('activity_searched', { query: value.trim(), results: activities.length });
      }, 1000);
    }
  };

  function handleLoadMore() {
    fetchNextPage();
    posthog.capture('activity_load_more', { loaded_so_far: activities.length });
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.625rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Activity
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
          {activities.length > 0 ? `${activities.length} item${activities.length === 1 ? '' : 's'} loaded` : 'Track what\'s happening'}
        </p>
      </div>

      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
        <input
          style={{
            width: '100%',
            paddingLeft: 36,
            paddingRight: 14,
            paddingTop: 9,
            paddingBottom: 9,
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            fontSize: '0.875rem',
            color: '#111827',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          placeholder="Search activity by name or content..."
          value={actSearch}
          onChange={handleSearchChange}
        />
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 16,
        boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '0 20px' }}>
          {isLoading ? (
            <ActivitySkeleton />
          ) : activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(107,33,168,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <ActivityIcon size={24} style={{ color: '#6b21a8' }} />
              </div>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                No activity yet. Start creating notes, tasks, and more.
              </p>
            </div>
          ) : (
            activities.map((item, idx) => (
              <ActivityFeedItem key={item._id} item={item} isLast={idx === activities.length - 1} />
            ))
          )}
        </div>

        {hasNextPage && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
            <Button variant="outline" size="sm" onClick={handleLoadMore} loading={isFetchingNextPage}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
