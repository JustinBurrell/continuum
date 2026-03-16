import { useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, AtSign } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';

function fullName(u) {
  return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'Unknown';
}

export default function UserProfile() {
  const { state } = useLocation();
  const id = state?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => api.get(`/users/${id}`).then(r => r.data),
  });

  const profile = data?.user;

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto space-y-4 pt-4">
        <Skeleton className="h-6 w-32" />
        <Card className="flex items-center gap-5 p-6">
          <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="text-secondary">User not found.</p>
        <Link to="/friends" className="text-primary text-sm hover:underline mt-2 block">
          Back to Friends
        </Link>
      </div>
    );
  }

  const name = fullName(profile);

  return (
    <div className="max-w-xl mx-auto">
      {/* Back */}
      <Link to="/friends" className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-foreground mb-6 no-underline">
        <ArrowLeft size={15} /> Back
      </Link>

      {/* Profile card */}
      <Card className="p-6 mb-4">
        <div className="flex items-center gap-5">
          <Avatar name={name} src={profile.avatarUrl} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">{name}</h1>
            <p className="text-sm text-secondary flex items-center gap-1 mt-0.5">
              <AtSign size={13} />{profile.username}
            </p>
            {profile.createdAt && (
              <p className="text-xs text-secondary flex items-center gap-1 mt-1">
                <Calendar size={12} /> Joined {formatDate(profile.createdAt)}
              </p>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-foreground/80 leading-relaxed mt-5 pt-5 border-t border-border">
            {profile.bio}
          </p>
        )}
      </Card>
    </div>
  );
}
