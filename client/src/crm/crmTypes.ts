export interface CRMRecord {
  id: string;
  type: 'client' | 'lead' | 'project' | 'invoice' | 'proposal' | 'subscription' | 'task' | 'ticket' | 'journey' | 'deliverable' | 'onboarding' | 'contract' | 'service' | 'update';
  name: string;
  clientId: string | null;
  status: string;
  value: number; // in pence / cents (£1 = 100 pence)
  payload: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CRMService {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number; // pence
  unit: string;
  recommended?: boolean;
}

export type AgencyService = CRMService;

export interface CRMSummary {
  totalClients: number;
  activeProjects: number;
  pipelineValuePence: number;
  monthlyRecurringPence: number;
  openTasks: number;
}

export function money(pence = 0): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  }).format(pence / 100);
}

export const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  active: { bg: 'rgba(69,227,201, 0.12)', color: 'var(--teal-ink)', border: 'rgba(69,227,201, 0.3)' },
  won: { bg: 'rgba(69,227,201, 0.15)', color: 'var(--teal-ink)', border: 'rgba(69,227,201, 0.4)' },
  paid: { bg: 'rgba(69,227,201, 0.15)', color: 'var(--teal-ink)', border: 'rgba(69,227,201, 0.4)' },
  complete: { bg: 'rgba(69,227,201, 0.12)', color: 'var(--teal-ink)', border: 'rgba(69,227,201, 0.3)' },
  
  proposal: { bg: 'rgba(139,124,255, 0.12)', color: 'var(--purple-ink)', border: 'rgba(139,124,255, 0.3)' },
  negotiation: { bg: 'rgba(245, 158, 11, 0.12)', color: 'var(--amber-ink)', border: 'rgba(245, 158, 11, 0.3)' },
  discovery: { bg: 'rgba(59, 130, 246, 0.12)', color: 'var(--info-ink)', border: 'rgba(59, 130, 246, 0.3)' },
  
  design: { bg: 'rgba(217, 70, 239, 0.12)', color: '#e879f9', border: 'rgba(217, 70, 239, 0.3)' },
  development: { bg: 'rgba(6, 182, 212, 0.12)', color: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' },
  'in-progress': { bg: 'rgba(6, 182, 212, 0.12)', color: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' },
  
  draft: { bg: 'rgba(var(--w), 0.05)', color: 'var(--text-muted)', border: 'rgba(var(--w), 0.1)' },
  open: { bg: 'rgba(59, 130, 246, 0.12)', color: 'var(--info-ink)', border: 'rgba(59, 130, 246, 0.3)' },
  lost: { bg: 'rgba(239, 68, 68, 0.12)', color: 'var(--red-ink)', border: 'rgba(239, 68, 68, 0.3)' },
};

export type StaffRole = 'super_admin' | 'admin' | 'staff';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  title: string;
  department: string;
  status: 'active' | 'suspended';
  avatar?: string;
  phone?: string;
  assignedDealsCount?: number;
  assignedProjectsCount?: number;
  assignedTasksCount?: number;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface StaffActivity {
  id: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffRole: StaffRole;
  action: string;
  description: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
