export interface FormField {
    id: string;
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'file';
    required: boolean;
    placeholder?: string;
    options?: string[]; // For dropdown
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      fileTypes?: string[];
      maxFileSize?: number; // in MB
    };
    conditionalLogic?: {
      dependsOn: string; // field id
      condition: 'equals' | 'greater_than' | 'less_than';
      value: string | number;
    };
  }
  
  export interface Form {
    id: string;
    name: string;
    description: string;
    category: 'kyc' | 'loan' | 'investment' | 'general';
    status: 'draft' | 'active' | 'archived';
    fields: FormField[];
    createdAt: Date;
    updatedAt: Date;
    submissionCount: number;
  }
  
  export interface FormSubmission {
    id: string;
    formId: string;
    formName: string;
    clientName: string;
    clientEmail: string;
    data: Record<string, any>;
    files: Record<string, File[]>;
    status: 'pending' | 'review' | 'approved' | 'rejected';
    submittedAt: Date;
    reviewedAt?: Date;
    reviewNotes?: string;
  }
  
  export interface Notification {
    id: string;
    type: 'form_submission' | 'form_approved' | 'form_rejected' | 'system';
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
    data?: any;
  }
  
  export interface ValidationRule {
    field: string;
    rule: string;
    message: string;
    condition?: {
      dependsOn: string;
      operator: string;
      value: any;
    };
  }