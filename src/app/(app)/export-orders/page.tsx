import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function ExportOrdersPage() {
  return (
    <>
      <PageHeader
        title="Export Orders"
        description="Track and manage all your export orders from confirmation to delivery."
      >
        <Button>
          <PlusCircle />
          New Export Order
        </Button>
      </PageHeader>
      <div className="border rounded-lg p-4">
        <p className="text-muted-foreground">Export order data table will be displayed here.</p>
      </div>
    </>
  );
}
