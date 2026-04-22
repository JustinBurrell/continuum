import Skeleton from '@/components/ui/Skeleton';

export default function ActivitySkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px' }}>
          <Skeleton circle className="h-9 w-9" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <Skeleton className="h-3 w-3/4 mb-2" />
            <Skeleton className="h-2 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
