import Skeleton from '@/components/ui/Skeleton';

export default function NotesListSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ background: 'white', border: '1px solid #ede9fe', borderRadius: 14, padding: '18px 20px' }}>
          <Skeleton className="h-4 w-4/5 mb-3" />
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-3 w-3/4 mb-4" />
          <div style={{ display: 'flex', gap: 6 }}>
            <Skeleton className="h-5 w-14" style={{ borderRadius: 20 }} />
            <Skeleton className="h-5 w-12" style={{ borderRadius: 20 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
