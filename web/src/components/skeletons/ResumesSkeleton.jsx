import Skeleton from '@/components/ui/Skeleton';

export default function ResumesSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ background: 'white', border: '1px solid #ede9fe', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Skeleton className="h-8 w-24" style={{ borderRadius: 10 }} />
              <Skeleton className="h-8 w-20" style={{ borderRadius: 10 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
