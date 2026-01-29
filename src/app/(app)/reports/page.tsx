import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Analyze your CRM data to gain business insights."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Leads by Source</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Chart will be displayed here.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Export Orders by Stage</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Chart will be displayed here.</p>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
