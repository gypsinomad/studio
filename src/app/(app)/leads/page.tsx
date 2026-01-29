import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function LeadsPage() {
  return (
    <>
      <PageHeader
        title="Leads"
        description="Manage all your potential customers and track their progress."
      >
        <Button>
          <PlusCircle />
          New Lead
        </Button>
      </PageHeader>
      <div className="border rounded-lg p-4">
        <p className="text-muted-foreground">Lead data table will be displayed here.</p>
      </div>
    </>
  );
}
