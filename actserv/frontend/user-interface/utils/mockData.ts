import { type Form, type FormSubmission, type Notification } from '../types/forms';

// Mock forms data
export const mockForms: Form[] = [
  {
    id: '1',
    name: 'KYC Verification',
    description: 'Know Your Customer verification form for new accounts',
    category: 'kyc',
    status: 'active',
    submissionCount: 15,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    fields: [
      {
        id: 'full_name',
        name: 'full_name',
        label: 'Full Legal Name',
        type: 'text',
        required: true,
        placeholder: 'Enter your full legal name'
      },
      {
        id: 'date_of_birth',
        name: 'date_of_birth',
        label: 'Date of Birth',
        type: 'date',
        required: true
      },
      {
        id: 'id_document',
        name: 'id_document',
        label: 'Government ID Document',
        type: 'file',
        required: true,
        validation: {
          fileTypes: ['pdf', 'jpg', 'png'],
          maxFileSize: 5
        }
      },
      {
        id: 'annual_income',
        name: 'annual_income',
        label: 'Annual Income',
        type: 'number',
        required: true,
        validation: {
          min: 0
        }
      },
      {
        id: 'employment_status',
        name: 'employment_status',
        label: 'Employment Status',
        type: 'dropdown',
        required: true,
        options: ['Employed', 'Self-Employed', 'Unemployed', 'Retired', 'Student']
      }
    ]
  },
  {
    id: '2',
    name: 'Personal Loan Application',
    description: 'Application form for personal loans up to $50,000',
    category: 'loan',
    status: 'active',
    submissionCount: 8,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
    fields: [
      {
        id: 'loan_amount',
        name: 'loan_amount',
        label: 'Loan Amount Requested',
        type: 'number',
        required: true,
        validation: {
          min: 1000,
          max: 50000
        }
      },
      {
        id: 'loan_purpose',
        name: 'loan_purpose',
        label: 'Purpose of Loan',
        type: 'dropdown',
        required: true,
        options: ['Home Improvement', 'Debt Consolidation', 'Medical Expenses', 'Education', 'Other']
      },
      {
        id: 'monthly_income',
        name: 'monthly_income',
        label: 'Monthly Income',
        type: 'number',
        required: true,
        validation: {
          min: 0
        }
      },
      {
        id: 'income_proof',
        name: 'income_proof',
        label: 'Income Verification Documents',
        type: 'file',
        required: false,
        validation: {
          fileTypes: ['pdf', 'doc', 'docx'],
          maxFileSize: 10
        },
        conditionalLogic: {
          dependsOn: 'loan_amount',
          condition: 'greater_than',
          value: 10000
        }
      },
      {
        id: 'credit_check_consent',
        name: 'credit_check_consent',
        label: 'I consent to a credit check',
        type: 'checkbox',
        required: true
      }
    ]
  },
  {
    id: '3',
    name: 'Investment Profile',
    description: 'Risk assessment and investment preferences',
    category: 'investment',
    status: 'active',
    submissionCount: 12,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-02-05'),
    fields: [
      {
        id: 'investment_experience',
        name: 'investment_experience',
        label: 'Investment Experience Level',
        type: 'dropdown',
        required: true,
        options: ['Beginner', 'Intermediate', 'Advanced', 'Professional']
      },
      {
        id: 'risk_tolerance',
        name: 'risk_tolerance',
        label: 'Risk Tolerance',
        type: 'dropdown',
        required: true,
        options: ['Conservative', 'Moderate', 'Aggressive', 'Very Aggressive']
      },
      {
        id: 'investment_goals',
        name: 'investment_goals',
        label: 'Primary Investment Goals',
        type: 'dropdown',
        required: true,
        options: ['Retirement', 'Wealth Building', 'Income Generation', 'Capital Preservation', 'Education Funding']
      },
      {
        id: 'time_horizon',
        name: 'time_horizon',
        label: 'Investment Time Horizon',
        type: 'dropdown',
        required: true,
        options: ['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', 'More than 10 years']
      },
      {
        id: 'initial_investment',
        name: 'initial_investment',
        label: 'Initial Investment Amount',
        type: 'number',
        required: true,
        validation: {
          min: 100
        }
      }
    ]
  }
];

// Mock submissions data
export const mockSubmissions: FormSubmission[] = [
  {
    id: 'sub1',
    formId: '1',
    formName: 'KYC Verification',
    clientName: 'John Smith',
    clientEmail: 'john.smith@email.com',
    status: 'pending',
    submittedAt: new Date('2024-02-15T10:30:00'),
    data: {
      full_name: 'John Smith',
      date_of_birth: '1985-03-15',
      annual_income: 65000,
      employment_status: 'Employed'
    },
    files: {}
  },
  {
    id: 'sub2',
    formId: '2',
    formName: 'Personal Loan Application',
    clientName: 'Sarah Johnson',
    clientEmail: 'sarah.j@email.com',
    status: 'review',
    submittedAt: new Date('2024-02-14T14:20:00'),
    data: {
      loan_amount: 15000,
      loan_purpose: 'Home Improvement',
      monthly_income: 4500,
      credit_check_consent: true
    },
    files: {}
  },
  {
    id: 'sub3',
    formId: '3',
    formName: 'Investment Profile',
    clientName: 'Michael Brown',
    clientEmail: 'mike.brown@email.com',
    status: 'approved',
    submittedAt: new Date('2024-02-13T09:15:00'),
    reviewedAt: new Date('2024-02-14T11:00:00'),
    data: {
      investment_experience: 'Intermediate',
      risk_tolerance: 'Moderate',
      investment_goals: 'Retirement',
      time_horizon: '5-10 years',
      initial_investment: 25000
    },
    files: {}
  }
];

// Mock notifications data
export const mockNotifications: Notification[] = [
  {
    id: 'notif1',
    type: 'form_submission',
    title: 'New KYC Submission',
    message: 'John Smith has submitted a KYC verification form',
    read: false,
    createdAt: new Date('2024-02-15T10:30:00'),
    data: { submissionId: 'sub1' }
  },
  {
    id: 'notif2',
    type: 'form_submission',
    title: 'New Loan Application',
    message: 'Sarah Johnson has submitted a personal loan application',
    read: true,
    createdAt: new Date('2024-02-14T14:20:00'),
    data: { submissionId: 'sub2' }
  },
  {
    id: 'notif3',
    type: 'system',
    title: 'Form Updated',
    message: 'Investment Profile form has been updated with new fields',
    read: true,
    createdAt: new Date('2024-02-10T16:45:00')
  }
];

// Mock notification service (simulates async backend)
export const notificationService = {
  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    };
    
    // In a real app, this would send to admin dashboard
    console.log('📧 Notification sent:', newNotification);
    return newNotification;
  }
};