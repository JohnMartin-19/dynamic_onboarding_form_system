import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FormSubmissionComponent } from './FormSubmissionComponent';
import { 
  FileText, 
  LogOut, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Plus
} from 'lucide-react';
import { mockForms, mockSubmissions } from '../../utils/mockData';
import { type Form, type FormSubmission } from '../../types/forms';

interface ClientPortalProps {
  onLogout: () => void;
}

export function ClientPortal({ onLogout }: ClientPortalProps) {
  const [activeTab, setActiveTab] = useState('available');
  const [forms] = useState<Form[]>(mockForms.filter(f => f.status === 'active'));
  const [submissions, setSubmissions] = useState<FormSubmission[]>(mockSubmissions);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [clientName] = useState('John Doe'); // In real app, this would come from auth
  const [clientEmail] = useState('john.doe@example.com');

  const clientSubmissions = submissions.filter(s => s.clientEmail === clientEmail);

  const handleStartForm = (form: Form) => {
    setSelectedForm(form);
  };

  const handleSubmitForm = async (formId: string, data: Record<string, any>, files: Record<string, File[]>) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    const newSubmission: FormSubmission = {
      id: Math.random().toString(36).substr(2, 9),
      formId,
      formName: form.name,
      clientName,
      clientEmail,
      data,
      files,
      status: 'pending',
      submittedAt: new Date()
    };

    setSubmissions(prev => [...prev, newSubmission]);
    setSelectedForm(null);
    setActiveTab('submissions');

    // Simulate notification to admin
    console.log('📨 Form submitted, notifying admin...', newSubmission);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-warning" />;
      case 'review':
        return <Eye className="w-5 h-5 text-info" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-error" />;
      default:
        return <Clock className="w-5 h-5 text-text-gray" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-warning';
      case 'review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'status-success';
      case 'rejected':
        return 'status-error';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedForm) {
    return (
      <FormSubmissionComponent
        form={selectedForm}
        onSubmit={handleSubmitForm}
        onCancel={() => setSelectedForm(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-gray">
      {/* Header */}
      <header className="bg-white border-b border-gray shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <FileText className="w-8 h-8 text-primary-green" />
              <div>
                <h1 className="text-xl font-semibold">Client Portal</h1>
                <p className="text-sm text-text-gray">Welcome, {clientName}</p>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
            <TabsTrigger value="available">Available Forms</TabsTrigger>
            <TabsTrigger value="submissions">My Submissions</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2>Available Forms</h2>
              <p className="text-text-gray">{forms.length} forms available</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form) => {
                const alreadySubmitted = clientSubmissions.some(s => s.formId === form.id);
                
                return (
                  <Card key={form.id} className="financial-card">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="outline" className="text-xs capitalize">
                        {form.category}
                      </Badge>
                      {alreadySubmitted && (
                        <Badge className="status-success text-xs">
                          Submitted
                        </Badge>
                      )}
                    </div>

                    <h3 className="mb-2">{form.name}</h3>
                    <p className="text-sm text-text-gray mb-4">{form.description}</p>

                    <div className="flex items-center justify-between text-sm text-text-gray mb-4">
                      <span>{form.fields.length} fields</span>
                      <span>~{Math.ceil(form.fields.length * 1.5)} min</span>
                    </div>

                    <Button 
                      onClick={() => handleStartForm(form)}
                      disabled={alreadySubmitted}
                      className={alreadySubmitted ? 'btn-secondary' : 'btn-primary'}
                      size="sm"
                    >
                      {alreadySubmitted ? (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          View Form
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Start Application
                        </>
                      )}
                    </Button>
                  </Card>
                );
              })}
            </div>

            {forms.length === 0 && (
              <Card className="financial-card text-center py-12">
                <FileText className="w-12 h-12 text-text-gray mx-auto mb-4" />
                <h3 className="mb-2">No Forms Available</h3>
                <p className="text-text-gray">There are currently no active forms available for submission.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2>My Submissions</h2>
              <p className="text-text-gray">{clientSubmissions.length} submissions</p>
            </div>

            <div className="space-y-4">
              {clientSubmissions.map((submission) => (
                <Card key={submission.id} className="financial-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(submission.status)}
                      <div>
                        <h4 className="font-medium text-text-dark">{submission.formName}</h4>
                        <p className="text-sm text-text-gray">
                          Submitted on {submission.submittedAt.toLocaleDateString()} at {submission.submittedAt.toLocaleTimeString()}
                        </p>
                        {submission.reviewedAt && (
                          <p className="text-sm text-text-gray">
                            Reviewed on {submission.reviewedAt.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={`status-tag ${getStatusColor(submission.status)}`}>
                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </Badge>
                      {submission.reviewNotes && (
                        <p className="text-xs text-text-gray mt-1 max-w-xs">
                          {submission.reviewNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submission Details */}
                  <div className="mt-4 pt-4 border-t border-gray">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(submission.data).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="text-text-gray">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                          <span className="ml-2 text-text-dark">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {clientSubmissions.length === 0 && (
              <Card className="financial-card text-center py-12">
                <Clock className="w-12 h-12 text-text-gray mx-auto mb-4" />
                <h3 className="mb-2">No Submissions Yet</h3>
                <p className="text-text-gray mb-4">You haven't submitted any forms yet.</p>
                <Button onClick={() => setActiveTab('available')} className="btn-primary">
                  Browse Available Forms
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}