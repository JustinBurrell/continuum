import Skeleton from '@/components/ui/Skeleton';

const COLUMNS = 4;
const CARDS_PER_COL = 3;

export default function ApplicationsSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {Array.from({ length: COLUMNS }).map((_, col) => (
        <div key={col} style={{ background: '#faf9ff', border: '1px solid #ede9fe', borderRadius: 14, padding: '14px 12px' }}>
          <Skeleton className="h-4 w-20 mb-4" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: CARDS_PER_COL }).map((_, card) => (
              <div key={card} style={{ background: 'white', border: '1px solid #ede9fe', borderRadius: 10, padding: '12px' }}>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3 mb-3" />
                <Skeleton className="h-4 w-16" style={{ borderRadius: 20 }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
