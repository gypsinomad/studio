import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function ContactsPage() {
  return (
    <>
      <PageHeader
        title="Contacts"
        description="Keep track of all your business contacts."
      >
        <Button>
          <PlusCircle />
          New Contact
        </Button>
      </PageHeader>
      <div className="border rounded-lg p-4">
        <p className="text-muted-foreground">Contact data table will be displayed here.</p>
      </div>
    </>
  );
}
