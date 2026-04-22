import Skeleton from '@/components/ui/Skeleton';

export default function FlashcardSetsSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, padding: '20px' }}>
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-full mb-4" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton className="h-4 w-16" style={{ borderRadius: 20 }} />
            <Skeleton className="h-7 w-20" style={{ borderRadius: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
