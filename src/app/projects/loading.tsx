import { StudentLayout } from '@/components/layout/StudentLayout';
import { ProjectsGridSkeleton } from '@/components/ui/PageSkeletons';

export default function Loading() {
  return (
    <StudentLayout>
      <ProjectsGridSkeleton cards={6} />
    </StudentLayout>
  );
}
