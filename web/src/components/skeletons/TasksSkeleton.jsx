import Skeleton from '@/components/ui/Skeleton';

const COLUMNS = 3;
const CARDS_PER_COL = 4;

export default function TasksSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {Array.from({ length: COLUMNS }).map((_, col) => (
        <div key={col} style={{ background: '#F8F9FA', border: '1px solid #E5E7EB', borderRadius: 14, padding: '16px 14px' }}>
          <Skeleton className="h-4 w-24 mb-4" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: CARDS_PER_COL }).map((_, card) => (
              <div key={card} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 14px' }}>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3 mb-3" />
                <div style={{ display: 'flex', gap: 6 }}>
                  <Skeleton className="h-4 w-14" style={{ borderRadius: 20 }} />
                  <Skeleton className="h-4 w-10" style={{ borderRadius: 20 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
