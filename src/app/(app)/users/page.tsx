import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function UsersPage() {
  return (
    <>
      <PageHeader
        title="User Management"
        description="View and manage user roles and access."
      >
        <Button>
          <PlusCircle />
          Invite User
        </Button>
      </PageHeader>
      <div className="border rounded-lg p-4">
        <p className="text-muted-foreground">User data table will be displayed here.</p>
      </div>
    </>
  );
}
