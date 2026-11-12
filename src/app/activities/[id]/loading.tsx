import { StudentLayout } from '@/components/layout/StudentLayout';
import { DetailPageSkeleton } from '@/components/ui/PageSkeletons';

export default function Loading() {
  return (
    <StudentLayout>
      <DetailPageSkeleton />
    </StudentLayout>
  );
}
