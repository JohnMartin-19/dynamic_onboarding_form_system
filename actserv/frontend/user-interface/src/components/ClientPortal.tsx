import { useState, useEffect, useCallback } from 'react';
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
  Plus,
  Loader2 
} from 'lucide-react';
import { type Form, type FormSubmission, type FormField } from '../../types/forms'; 

// 1. Define the structure of the incoming API response for type safety
interface ApiFormResponse {
  id: number;
  name: string;
  description: string;
  version: number;
  is_active: boolean;
  created_by: any; 
  created_at: string;
  updated_at: string;
  form_fields: ApiFormFieldResponse[];
}

interface ApiFormFieldResponse {
  id: number;
  form: { id: number; name: string; version: number };
  name: string;
  type: string;
  options: Record<string, any>;
  is_required: boolean; 
  order: number;
  created_at: string;
}

interface ClientPortalProps {
  onLogout: () => void;
  clientName: string;
  clientEmail: string;
  // NOTE: accessToken prop is now primarily used to trigger re-renders, 
  // but the token is READ directly from localStorage in the functions.
  accessToken: string; 
}

// 2. Define the API endpoints
const FORMS_API_URL = 'http://127.0.0.1:8001/form/api/v1/forms/';
const SUBMISSIONS_API_URL = 'http://127.0.0.1:8001/form/api/v1/submissions/'; 

export function ClientPortal({ onLogout, clientName, clientEmail, accessToken }: ClientPortalProps) {
  const [activeTab, setActiveTab] = useState('available');
  const [forms, setForms] = useState<Form[]>([]); 
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]); 
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null); 
  
  // 🛑 Removed all direct variable definitions reading localStorage to prevent stale tokens.

  const clientSubmissions = submissions.filter(s => s.clientEmail === clientEmail);

  // --- Data Fetching Logic (useEffect) ---
  const fetchFormsAndSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ Read token directly from storage to ensure it's fresh
      const currentAccessToken = localStorage.getItem('access_token');
      
      if (!currentAccessToken) {
        setLoading(false);
        setError("Authentication required. Please log in again.");
        return;
      }
      
      // Setup authorization headers
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentAccessToken}`, 
      };

      // 1. Fetch Forms
      const formsResponse = await fetch(FORMS_API_URL, { headers });
      if (!formsResponse.ok) {
        throw new Error(`Failed to fetch forms: ${formsResponse.statusText}`);
      }
      const formsData: { data: ApiFormResponse[] } = await formsResponse.json();

      // 2. Map API structure to Frontend 'Form' type
      const remappedForms: Form[] = formsData.data
        .filter(f => f.is_active) 
        .map(apiForm => ({
          id: String(apiForm.id),
          name: apiForm.name,
          description: apiForm.description,
          version: apiForm.version,
          category: 'General', 
          status: apiForm.is_active ? 'active' : 'inactive',
          
          fields: apiForm.form_fields.map(apiField => {
            const fieldName = apiField.name;
            
            return ({
              id: String(apiField.id),
              label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, ' '),
              name: fieldName,
              type: apiField.type,
              options: apiField.options,
              isRequired: apiField.is_required,
              order: apiField.order,
            }) as unknown as FormField; 
          }),
        }));
      
      setForms(remappedForms);
      
    } catch (err) {
      console.error('API Fetch Error:', err);
      setError('Failed to load forms. Please ensure you are logged in and the server is running.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]); // Keep accessToken in dependency array to refetch on login state change

  useEffect(() => {
    fetchFormsAndSubmissions();
  }, [fetchFormsAndSubmissions]);
  // --- End Data Fetching Logic ---


  const handleStartForm = (form: Form) => {
    setSelectedForm(form);
  };

  // --- Form Submission Logic ---
  const handleSubmitForm = async (formId: string, data: Record<string, any>, files: Record<string, File[]>) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    setLoading(true);
    try {
      
      const currentAccessToken = localStorage.getItem('access_token'); 
        
      if (!currentAccessToken) {
          throw new Error("Authentication failed: Access token not found in storage.");
      }
        
      // Use FormData for submission (required for files, but good practice for forms)
      const formData = new FormData();
      formData.append('form_id', formId);
      formData.append('client_email', clientEmail);
      formData.append('client_name', clientName);
      formData.append('data', JSON.stringify(data)); 
      
      // NOTE: File handling logic would go here
      
      const submissionResponse = await fetch(SUBMISSIONS_API_URL, {
        method: 'POST',
        headers: {
          
          'Authorization': `Bearer ${currentAccessToken}`, 
          
        },
        body: formData,
      });

      if (!submissionResponse.ok) {
         const errorText = await submissionResponse.text();
         throw new Error(`Submission failed: ${submissionResponse.status} - ${errorText}`);
      }
      
      // Simulate local update after successful submission
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
      
    } catch (err) {
      console.error('Submission Error:', err);
      alert(`Failed to submit form: ${err instanceof Error ? err.message : 'Unknown error'}`); 
    } finally {
      setLoading(false);
    }
  };
  // --- End Form Submission Logic ---
  
  // ... (getStatusIcon and getStatusColor helper functions) ...
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-warning" />;
      case 'review': return <Eye className="w-5 h-5 text-info" />;
      case 'approved': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-error" />;
      default: return <Clock className="w-5 h-5 text-text-gray" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'status-warning';
      case 'review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'status-success';
      case 'rejected': return 'status-error';
      default: return 'bg-gray-100 text-gray-800';
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
                <p className='text-sm text-text-gray'>Welcome back, {clientName}</p>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="w-5 h-5 mr-2" />
              Logout
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
            
            {/* --- Loading/Error State --- */}
            {loading && (
              <Card className="financial-card text-center py-12">
                <Loader2 className="w-8 h-8 text-primary-green mx-auto mb-4 animate-spin" />
                <p className="text-text-gray">Loading available forms...</p>
              </Card>
            )}
            
            {error && !loading && (
              <Card className="financial-card text-center py-12 bg-red-50 border-red-300">
                <XCircle className="w-12 h-12 text-error mx-auto mb-4" />
                <h3 className="mb-2 text-error">API Error</h3>
                <p className="text-error">{error}</p>
              </Card>
            )}
            
            {/* --- Forms List --- */}
            {!loading && !error && (
              <>
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
              </>
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
                          Submitted on {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString()}
                        </p>
                        {submission.reviewedAt && (
                          <p className="text-sm text-text-gray">
                            Reviewed on {new Date(submission.reviewedAt).toLocaleDateString()}
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