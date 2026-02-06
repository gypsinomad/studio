'use client';
import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Company, Contact, ExportOrder } from '@/lib/types';
import { ContactsTable } from '../../contacts/components/contacts-table';
import { ExportOrdersTable } from '../../export-orders/components/export-orders-table';

function CompanyDetailsCard({ company }: { company: Company }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Company Details</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                <div className="space-y-1">
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{company.name}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-muted-foreground">Country</p>
                    <p className="font-medium">{company.country}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-muted-foreground">Website</p>
                    <a href={company.website} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">{company.website}</a>
                </div>
                 <div className="space-y-1">
                    <p className="text-muted-foreground">Industry</p>
                    <p className="font-medium">{company.industryType || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">{company.relationshipStatus || 'N/A'}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-muted-foreground">Default Payment Terms</p>
                    <p className="font-medium">{company.paymentTerms || 'N/A'}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function CompanyDetailPage() {
    const router = useRouter();
    const params = useParams();
    const companyId = params.companyId as string;
    const firestore = useFirestore();

    const companyRef = useMemoFirebase(() => (firestore && companyId ? doc(firestore, 'companies', companyId) : null), [firestore, companyId]);
    const { data: company, isLoading: isLoadingCompany } = useDoc<Company>(companyRef);
    
    const contactsQuery = useMemoFirebase(() => (firestore && companyId ? query(collection(firestore, 'contacts'), where('companyId', '==', companyId)) : null), [firestore, companyId]);
    const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

    const ordersQuery = useMemoFirebase(() => (firestore && companyId ? query(collection(firestore, 'exportOrders'), where('companyId', '==', companyId)) : null), [firestore, companyId]);
    const { data: orders, isLoading: isLoadingOrders } = useCollection<ExportOrder>(ordersQuery);

    const isLoading = isLoadingCompany || isLoadingContacts || isLoadingOrders;

    return (
        <>
            <PageHeader
                title={company?.name || 'Loading Customer...'}
                description="View customer details, contacts, and order history."
            >
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Customers
                </Button>
            </PageHeader>
            <div className="space-y-6">
                {isLoadingCompany ? <Skeleton className="h-48 w-full" /> : (company ? <CompanyDetailsCard company={company} /> : <p>Customer not found.</p>)}

                <Card>
                    <CardHeader>
                        <CardTitle>Contacts</CardTitle>
                        <CardDescription>Contacts associated with this customer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingContacts ? <Skeleton className="h-24 w-full" /> : (contacts ? <ContactsTable data={contacts} onDelete={() => {}} /> : <p>No contacts found for this customer.</p>)}
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Export Orders</CardTitle>
                        <CardDescription>Order history for this customer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {isLoadingOrders ? <Skeleton className="h-24 w-full" /> : (orders ? <ExportOrdersTable data={orders} onDelete={() => {}} /> : <p>No orders found for this customer.</p>)}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
