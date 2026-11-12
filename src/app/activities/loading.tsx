import { StudentLayout } from '@/components/layout/StudentLayout';
import { ListPageSkeleton } from '@/components/ui/PageSkeletons';

export default function Loading() {
  return (
    <StudentLayout>
      <ListPageSkeleton rows={4} variant="activity" />
    </StudentLayout>
  );
}
