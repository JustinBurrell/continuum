import Skeleton from '@/components/ui/Skeleton';

export default function DashboardSkeleton() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: '20px 20px' }}>
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-7 w-12 mb-2" />
            <Skeleton className="h-2 w-16" />
          </div>
        ))}
      </div>
      {/* Two content blocks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: '22px 24px' }}>
            <Skeleton className="h-4 w-32 mb-5" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Skeleton circle className="h-8 w-8" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-2 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
