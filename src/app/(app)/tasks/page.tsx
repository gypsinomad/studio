import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function TasksPage() {
  return (
    <>
      <PageHeader
        title="Tasks"
        description="Organize your work and track important to-dos."
      >
        <Button>
          <PlusCircle />
          New Task
        </Button>
      </PageHeader>
      <div className="border rounded-lg p-4">
        <p className="text-muted-foreground">Task data table will be displayed here.</p>
      </div>
    </>
  );
}
