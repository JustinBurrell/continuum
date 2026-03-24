import Skeleton from '@/components/ui/Skeleton';

export default function FriendsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', border: '1px solid #ede9fe', borderRadius: 12, padding: '12px 16px' }}>
          <Skeleton circle className="h-10 w-10" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <Skeleton className="h-3 w-32 mb-2" />
            <Skeleton className="h-2 w-20" />
          </div>
          <Skeleton className="h-7 w-20" style={{ borderRadius: 10, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}
