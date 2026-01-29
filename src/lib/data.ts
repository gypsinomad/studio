import type { User, Lead, ExportOrder, Company, Contact, Task, Document, UserRole } from './types';
import { adminDb } from '@/firebase/admin';
import { unstable_noStore as noStore } from 'next/cache';

const now = new Date();

export const MOCK_USERS: User[] = [
  {
    authUid: 'admin-user-01',
    email: 'admin@spiceroute.com',
    displayName: 'Admin User',
    role: 'admin',
    isActive: true,
    createdAt: new Date(now.setDate(now.getDate() - 30)),
    avatarUrl: 'https://picsum.photos/seed/admin-avatar/40/40'
  },
  {
    authUid: 'sales-exec-01',
    email: 'sales1@spiceroute.com',
    displayName: 'Raj Patel',
    role: 'salesExecutive',
    isActive: true,
    createdAt: new Date(now.setDate(now.getDate() - 15)),
    avatarUrl: 'https://picsum.photos/seed/sales1-avatar/40/40'
  },
  {
    authUid: 'sales-exec-02',
    email: 'sales2@spiceroute.com',
    displayName: 'Priya Singh',
    role: 'salesExecutive',
    isActive: false,
    createdAt: new Date(now.setDate(now.getDate() - 5)),
    avatarUrl: 'https://picsum.photos/seed/sales2-avatar/40/40'
  },
];

export const MOCK_COMPANIES: Company[] = [
  { id: 'comp-01', name: 'Global Spice Traders', industry: 'Food & Beverage', website: 'https://globalspice.com', address: 'Dubai, UAE', createdAt: new Date() },
  { id: 'comp-02', name: 'Euro Foods GmbH', industry: 'Import/Export', website: 'https://eurofoods.de', address: 'Hamburg, Germany', createdAt: new Date() },
  { id: 'comp-03', name: 'American Grocery Inc.', industry: 'Retail', website: 'https://amerigrocer.com', address: 'New York, USA', createdAt: new Date() },
];

export const MOCK_CONTACTS: Contact[] = [
  { id: 'cont-01', name: 'Mr. Ahmed', email: 'ahmed@globalspice.com', companyId: 'comp-01', createdAt: new Date() },
  { id: 'cont-02', name: 'Ms. Schmidt', email: 'schmidt@eurofoods.de', companyId: 'comp-02', createdAt: new Date() },
  { id: 'cont-03', name: 'Mr. John Smith', email: 'john.s@amerigrocer.com', companyId: 'comp-03', createdAt: new Date() },
];


// Mock data fetching functions
export const getCompanies = async () => MOCK_COMPANIES;
export const getContacts = async () => MOCK_CONTACTS;
export const getUsers = async () => MOCK_USERS;


const getDefaultDashboardData = () => ({
    totalLeads: 0,
    activeExportOrders: 0,
    leadsByStatus: [],
    exportOrdersByStage: [],
});

export const getDashboardData = async () => {
    noStore();
    if (!adminDb) {
        console.warn("Firebase Admin is not available. Using empty dashboard data.");
        return getDefaultDashboardData();
    }

    try {
        const [leadsSnapshot, ordersSnapshot] = await Promise.all([
            adminDb.collection('leads').get(),
            adminDb.collection('exportOrders').get()
        ]);

        const leads = leadsSnapshot.docs.map(doc => doc.data() as Lead);
        const orders = ordersSnapshot.docs.map(doc => doc.data() as ExportOrder);

        const leadsByStatus = leads.reduce((acc, lead) => {
            acc[lead.status] = (acc[lead.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const ordersByStage = orders.reduce((acc, order) => {
            acc[order.stage] = (acc[order.stage] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const activeExportOrders = orders.filter(o => !['shippedDelivered', 'cancelled', 'lostNoResponse'].includes(o.stage)).length;

        return {
            totalLeads: leads.length,
            activeExportOrders,
            leadsByStatus: Object.entries(leadsByStatus).map(([name, value]) => ({ name, value })),
            exportOrdersByStage: Object.entries(ordersByStage).map(([name, value]) => ({ name, value })),
        }
    } catch (error) {
        console.error("Error fetching dashboard data from Firestore:", error instanceof Error ? error.message : error);
        return getDefaultDashboardData();
    }
}
