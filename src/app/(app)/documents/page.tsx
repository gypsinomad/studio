import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="Documents"
        description="Manage all documents related to your leads and orders."
      >
        <Button variant="outline">
          <Upload />
          Upload Document
        </Button>
      </PageHeader>
      <div className="border rounded-lg p-4">
        <p className="text-muted-foreground">Document data table will be displayed here.</p>
      </div>
    </>
  );
}
