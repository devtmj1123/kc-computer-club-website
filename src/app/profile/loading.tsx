import { StudentLayout } from '@/components/layout/StudentLayout';
import { ProfilePageSkeleton } from '@/components/ui/PageSkeletons';

export default function Loading() {
  return (
    <StudentLayout>
      <ProfilePageSkeleton />
    </StudentLayout>
  );
}
