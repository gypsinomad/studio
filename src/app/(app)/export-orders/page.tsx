import { PageHeader } from '@/components/page-header';
import { ExportOrderForm } from './components/export-order-form';

export default function ExportOrdersPage() {
  return (
    <>
      <PageHeader
        title="New Export Order"
        description="Create a new export order and run AI compliance checks."
      />
      <ExportOrderForm />
    </>
  );
}
