import Skeleton from '@/components/ui/Skeleton';

export default function ConversationSkeleton() {
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Inbox list */}
      <div style={{ width: 260, borderRight: '1px solid #ede9fe', padding: '16px 12px', flexShrink: 0 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Skeleton circle className="h-9 w-9" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <Skeleton className="h-3 w-28 mb-2" />
              <Skeleton className="h-2 w-20" />
            </div>
          </div>
        ))}
      </div>
      {/* Message area */}
      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[false, true, false, true, false].map((right, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: right ? 'flex-end' : 'flex-start' }}>
            <Skeleton
              className={right ? 'h-10 w-48' : 'h-10 w-56'}
              style={{ borderRadius: 14 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
