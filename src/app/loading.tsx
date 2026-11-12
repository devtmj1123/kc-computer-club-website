import { StudentLayout } from '@/components/layout/StudentLayout';
import { HomeSkeleton } from '@/components/ui/PageSkeletons';

export default function Loading() {
  return (
    <StudentLayout>
      <HomeSkeleton />
    </StudentLayout>
  );
}
