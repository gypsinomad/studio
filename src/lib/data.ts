import type { User, Lead, ExportOrder, Company, Contact, Task, Document, UserRole } from './types';

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


export const MOCK_LEADS: Lead[] = [
  {
    id: 'lead-01',
    fullName: 'David Miller',
    companyName: 'UK Spice Imports',
    email: 'david.m@ukspice.co.uk',
    phone: '+44 20 7946 0958',
    source: 'Facebook Lead Ads',
    productInterest: 'Turmeric Powder',
    destinationCountry: 'United Kingdom',
    incotermsPreference: 'CIF',
    status: 'new',
    assignedUserId: 'sales-exec-01',
    createdAt: new Date(now.setDate(now.getDate() - 2)),
    nextFollowUpAt: new Date(now.setDate(now.getDate() + 1)),
  },
  {
    id: 'lead-02',
    fullName: 'Yuki Tanaka',
    companyName: 'Tokyo Foods Co.',
    email: 'y.tanaka@tokyofoods.jp',
    phone: '+81 3-1234-5678',
    source: 'Website Inquiry',
    productInterest: 'Cardamom',
    destinationCountry: 'Japan',
    incotermsPreference: 'FOB',
    status: 'contacted',
    assignedUserId: 'sales-exec-02',
    createdAt: new Date(now.setDate(now.getDate() - 5)),
    lastContactAt: new Date(now.setDate(now.getDate() - 1)),
  },
    {
    id: 'lead-03',
    fullName: 'Fatima Al-Sayed',
    companyName: 'Middle East Grocers',
    email: 'fatima.as@megroc.com',
    phone: '+971 4 123 4567',
    source: 'Trade Show',
    productInterest: 'Black Pepper',
    destinationCountry: 'UAE',
    incotermsPreference: 'CIF',
    status: 'qualified',
    assignedUserId: 'sales-exec-01',
    createdAt: new Date(now.setDate(now.getDate() - 10)),
  },
  {
    id: 'lead-04',
    fullName: 'Carlos Rodriguez',
    companyName: 'Latin American Spices',
    email: 'carlos.r@laspices.com',
    phone: '+52 55 1234 5678',
    source: 'Referral',
    productInterest: 'Cumin Seeds',
    destinationCountry: 'Mexico',
    incotermsPreference: 'FOB',
    status: 'converted',
    assignedUserId: 'sales-exec-02',
    createdAt: new Date(now.setDate(now.getDate() - 20)),
    exportOrderId: 'eo-01',
  },
];


export const MOCK_EXPORT_ORDERS: ExportOrder[] = [
  {
    id: 'eo-01',
    title: 'Cumin Seeds to Mexico',
    stage: 'shippedDelivered',
    companyId: 'comp-03',
    contactId: 'cont-03',
    productType: 'Cumin Seeds',
    destinationCountry: 'Mexico',
    incoterms: 'FOB',
    hsCode: '0909.31.00',
    quantity: 18000,
    unitPrice: 2.5,
    paymentTerms: '50% Advance, 50% on BL',
    containerType: '20ft',
    portOfLoading: 'Mundra, India',
    expectedShipmentDate: new Date(now.setDate(now.getDate() - 10)),
    assignedUserId: 'sales-exec-02',
    createdAt: new Date(now.setDate(now.getDate() - 20)),
    aiValidation: 'HS code seems correct for Cumin seeds. Standard certificate of origin and phytosanitary certificate will be required for Mexico. No other major compliance flags.'
  },
  {
    id: 'eo-02',
    title: 'Red Chilli to Germany',
    stage: 'orderConfirmed',
    companyId: 'comp-02',
    contactId: 'cont-02',
    productType: 'Dried Red Chilli',
    destinationCountry: 'Germany',
    incoterms: 'CIF Hamburg',
    hsCode: '0904.22.19',
    quantity: 15000,
    unitPrice: 3.1,
    paymentTerms: '100% LC at Sight',
    containerType: '20ft',
    portOfLoading: 'Chennai, India',
    expectedShipmentDate: new Date(now.setDate(now.getDate() + 15)),
    assignedUserId: 'sales-exec-01',
    createdAt: new Date(now.setDate(now.getDate() - 3)),
  },
];


export const MOCK_TASKS: Task[] = [
    {
        id: 'task-01',
        title: 'Follow up with David Miller',
        status: 'open',
        dueDate: new Date(now.setDate(now.getDate() + 1)),
        relatedLeadId: 'lead-01',
        assigneeId: 'sales-exec-01',
        createdAt: new Date(now.setDate(now.getDate() - 2)),
        description: 'Initial follow-up call after Facebook lead submission.'
    },
    {
        id: 'task-02',
        title: 'Prepare Quotation for Tokyo Foods',
        status: 'inProgress',
        dueDate: new Date(now.setDate(now.getDate() + 3)),
        relatedLeadId: 'lead-02',
        assigneeId: 'sales-exec-02',
        createdAt: new Date(now.setDate(now.getDate() - 1)),
    },
    {
        id: 'task-03',
        title: 'Arrange for Phytosanitary Certificate',
        status: 'open',
        dueDate: new Date(now.setDate(now.getDate() + 10)),
        relatedOrderId: 'eo-02',
        assigneeId: 'admin-user-01',
        createdAt: new Date(now.setDate(now.getDate() - 3)),
        description: 'Certificate needed for Red Chilli shipment to Germany.'
    },
];

export const MOCK_DOCUMENTS: Document[] = [
    {
        id: 'doc-01',
        name: 'Commercial Invoice - EO-01',
        type: 'invoice',
        orderId: 'eo-01',
        fileUrl: '#',
        status: 'verified',
        uploadedBy: 'sales-exec-02',
        uploadedAt: new Date(now.setDate(now.getDate() - 12)),
    },
    {
        id: 'doc-02',
        name: 'Bill of Lading - EO-01',
        type: 'billOfLading',
        orderId: 'eo-01',
        fileUrl: '#',
        status: 'uploaded',
        uploadedBy: 'sales-exec-02',
        uploadedAt: new Date(now.setDate(now.getDate() - 11)),
    },
    {
        id: 'doc-03',
        name: 'Packing List - EO-02',
        type: 'packingList',
        orderId: 'eo-02',
        fileUrl: '#',
        status: 'pending',
        uploadedBy: 'sales-exec-01',
        uploadedAt: new Date(now.setDate(now.getDate() - 1)),
    }
]

// Mock data fetching functions
export const getLeads = async () => MOCK_LEADS;
export const getExportOrders = async () => MOCK_EXPORT_ORDERS;
export const getCompanies = async () => MOCK_COMPANIES;
export const getContacts = async () => MOCK_CONTACTS;
export const getTasks = async () => MOCK_TASKS;
export const getUsers = async () => MOCK_USERS;
export const getDocuments = async () => MOCK_DOCUMENTS;

export const getDashboardData = async () => {
    const leadsByStatus = MOCK_LEADS.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const ordersByStage = MOCK_EXPORT_ORDERS.reduce((acc, order) => {
        acc[order.stage] = (acc[order.stage] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    return {
        totalLeads: MOCK_LEADS.length,
        activeExportOrders: MOCK_EXPORT_ORDERS.filter(o => !['shippedDelivered', 'cancelled', 'lostNoResponse'].includes(o.stage)).length,
        leadsByStatus: Object.entries(leadsByStatus).map(([name, value]) => ({ name, value })),
        exportOrdersByStage: Object.entries(ordersByStage).map(([name, value]) => ({ name, value })),
    }
}