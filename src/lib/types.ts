
export type UserRole = 'admin' | 'salesExecutive';

export interface User {
  id?: string; // id is the doc id, which is the same as authUid
  authUid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: any; // Date or Firestore Timestamp
  avatarUrl?: string;
  companyIds: string[];
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'quoted' | 'converted' | 'lost';

export interface Lead {
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  source: string;
  productInterest: string;
  destinationCountry: string;
  incotermsPreference: string;
  status: LeadStatus;
  assignedUserId: string;
  createdAt: any; // Date or Firestore Timestamp
  lastContactAt?: any;
  nextFollowUpAt?: any;
  tags?: string[];
  exportOrderId?: string;
  rawPayload?: any;
}

export type ExportOrderStage = 'leadReceived' | 'quotationSent' | 'orderConfirmed' | 'exportDocumentation' | 'shipmentReady' | 'shippedDelivered' | 'cancelled' | 'lostNoResponse';

export interface ExportOrder {
  id: string;
  title: string;
  stage: ExportOrderStage;
  companyId: string;
  contactId: string;
  productType: string;
  destinationCountry: string;
  incoterms: string;
  hsCode: string;
  quantity: number;
  unitPrice: number;
  paymentTerms: string;
  containerType: string;
  portOfLoading: string;
  expectedShipmentDate: any; // Date or Firestore Timestamp
  fssaiLicenseNumber?: string;
  icegateStatus?: string;
  certificateRequirements?: string[];
  assignedUserId: string;
  createdAt: any; // Date or Firestore Timestamp
  aiValidation?: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  address?: string;
  createdAt: any; // Date or Firestore Timestamp
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyId: string;
  jobTitle?: string;
  createdAt: any; // Date or Firestore Timestamp
}

export type TaskStatus = 'open' | 'inProgress' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate: any; // Date or Firestore Timestamp
  relatedLeadId?: string;
  relatedOrderId?: string;
  assigneeId: string;
  createdAt: any; // Date or Firestore Timestamp
}

export type DocumentType = 'invoice' | 'packingList' | 'billOfLading' | 'COO' | 'certificate' | 'other';
export type DocumentStatus = 'pending' | 'uploaded' | 'verified';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  orderId?: string;
  leadId?: string;
  fileUrl: string; 
  status: DocumentStatus;
  expiryDate?: any; // Date or Firestore Timestamp
  uploadedBy: string;
  uploadedAt: any; // Date or Firestore Timestamp
}

export interface Product {
    id: string;
    name: string;
    description?: string;
    hsCode: string;
    basePrice: number;
    imageUrl?: string;
}

export interface Note {
    id: string;
    content: string;
    relatedEntityType: 'Lead' | 'Contact' | 'ExportOrder';
    relatedEntityId: string;
    createdBy: string;
    createdAt: any;
}


export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
  adminOnly?: boolean;
}

// AI Settings and Usage
export type AIMode = 'off' | 'safe' | 'unrestricted';

export interface AISettings {
  aiMode: AIMode;
  monthlyAiBudgetInr: number;
  maxDailyAiCalls: number;
}

export interface AIUsageStats {
  monthKey: string; // e.g., "2024-07"
  totalCallsMonth: number;
  estimatedSpendThisMonthInr: number;
  dailyCalls: { [day: string]: number }; // e.g., { "01": 10, "25": 50 }
  lastUpdatedAt: any; // Date or Firestore Timestamp
}

export type AIGuardResult<T> = {
  aiUsed: boolean;
  aiReason: 'ok' | 'aiDisabled' | 'budgetOrQuotaExceeded' | 'error';
  aiData: T | null;
}

export interface DashboardStats {
    totalLeads: number;
    activeExportOrders: number;
    leadsByStatus: Record<LeadStatus, number>;
    exportOrdersByStage: Record<ExportOrderStage, number>;
    lastUpdatedAt: any; // Date or Firestore Timestamp
}
