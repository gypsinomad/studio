export type UserRole = 'admin' | 'salesExecutive';

export interface User {
  authUid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  avatarUrl?: string;
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
  createdAt: Date;
  lastContactAt?: Date;
  nextFollowUpAt?: Date;
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
  expectedShipmentDate: Date;
  fssaiLicenseNumber?: string;
  icegateStatus?: string;
  certificateRequirements?: string[];
  assignedUserId: string;
  createdAt: Date;
  aiValidation?: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  address?: string;
  createdAt: Date;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyId: string;
  createdAt: Date;
}

export type TaskStatus = 'open' | 'inProgress' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate: Date;
  relatedLeadId?: string;
  relatedOrderId?: string;
  assigneeId: string;
  createdAt: Date;
}

export type DocumentType = 'invoice' | 'packingList' | 'billOfLading' | 'COO' | 'certificate' | 'other';
export type DocumentStatus = 'pending' | 'uploaded' | 'verified';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  orderId?: string;
  leadId?: string;
  fileUrl: string; // Placeholder
  status: DocumentStatus;
  expiryDate?: Date;
  uploadedBy: string;
  uploadedAt: Date;
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
  lastUpdatedAt: Date;
}

export type AIGuardResult<T> = {
  aiUsed: boolean;
  aiReason: 'ok' | 'aiDisabled' | 'budgetOrQuotaExceeded' | 'error';
  aiData: T | null;
}
