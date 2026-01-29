import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function CompaniesPage() {
  return (
    <>
      <PageHeader
        title="Companies"
        description="Manage your database of client and partner companies."
      >
        <Button>
          <PlusCircle />
          New Company
        </Button>
      </PageHeader>
      <div className="border rounded-lg p-4">
        <p className="text-muted-foreground">Company data table will be displayed here.</p>
      </div>
    </>
  );
}
