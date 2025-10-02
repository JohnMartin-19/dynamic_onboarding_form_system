import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FormSubmissionComponent } from './FormSubmissionComponent';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
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

// Define the narrow union type for form field types
type FormFieldType = "number" | "text" | "checkbox" | "date" | "file" | "dropdown";

export interface FormField {
    id: string;
    label: string;
    name: string;
    type: FormFieldType; 
    options: string[];
    isRequired: boolean;
    order: number;
   
    isConditional: boolean;
    conditionalField: { id: number; name: string } | null; // ID and Name of the controlling field
    conditionalOperator: 'equal_to' | 'greater_than' | 'less_than' | 'not_equal_to' | null;
    conditionalValue: string | null;
   
}

export interface Form {
    id: string;
    name: string;
    description: string;
    version: number;
    category:'kyc' | 'loan' | 'investment' | 'general';
    // Assuming status remains 'active' | 'inactive' based on your mapping: apiForm.is_active ? 'active' : 'inactive'
    status: 'active' | 'inactive';
    fields: FormField[];
    createdAt: Date; 
    updatedAt: Date; 
    submissionCount: number; 
}
// ... (FormSubmission and API interfaces remain the same) ...

export interface FormSubmission {
    id: string;
    formId: string;
    formName: string;
    clientName: string;
    clientEmail: string;
    data: Record<string, any>;
    status: 'pending' | 'review' | 'approved' | 'rejected';
    submittedAt: Date;
    files: Record<string, any>;
}

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
  submissionCount: number; 
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
  is_conditional: boolean;
  conditional_field: { id: number; name: string } | null; // From MinimalFieldSerializer
  conditional_operator: string | null;
  conditional_value: string | null;
 
}


interface ApiSubmissionResponse { 
    id: number; 
    form: { id: number, name: string };
    user: { id: number, email: string, first_name: string };
    data: string;
    status: 'pending' | 'review' | 'approved' | 'rejected'; 
    submitted_at: string; 
    updated_at: string;
    documents: any[]; 
}

interface BackendResponseWrapper {
    message: string;
    data: any; 
}

interface ClientPortalProps {
    onLogout: () => void;
    clientName: string;
    clientEmail: string;
    accessToken: string; 
}


const FORMS_API_URL = 'http://127.0.0.1:8001/form/api/v1/forms/';
const SUBMISSIONS_API_URL = 'http://127.0.0.1:8001/form/api/v1/submissions/'; 
const MY_SUBMISSIONS_API_URL = 'http://127.0.0.1:8001/form/api/v1/my_submissions/';

// ⭐ New utility function to cast the API field type string to the narrow union type
const safeCastFieldType = (type: string): FormFieldType => {
    const validTypes: FormFieldType[] = ["number", "text", "checkbox", "date", "file", "dropdown"];
    
    if ((validTypes as string[]).includes(type.toLowerCase())) {
        return type.toLowerCase() as FormFieldType;
    }
    
    console.warn(`Unknown field type received: ${type}. Defaulting to 'text'.`);
    return 'text'; 
};

export function ClientPortal({ onLogout, clientName,  accessToken }: ClientPortalProps) {
    const [activeTab, setActiveTab] = useState('available');
    const [forms, setForms] = useState<Form[]>([]); 
    const [submissions, setSubmissions] = useState<FormSubmission[]>([]); 
    const [selectedForm, setSelectedForm] = useState<Form | null>(null);
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState<string | null>(null); 
    const [clientUsername, setClientUsername] = useState('Client User'); 
    
    const mapFormNameToCategory = (formName: string): 'kyc' | 'loan' | 'investment' | 'general' => {
        const lowerName = formName.toLowerCase();
    
        if (lowerName.includes('loan')) return 'loan';
        if (lowerName.includes('kyc')) return 'kyc';
        if (lowerName.includes('invest')) return 'investment';

        return 'general';
    };
    
    const [showSuccessAlert, setShowSuccessAlert] = useState(false); 

    const [loggingOut, setLoggingOut] = useState(false);
    
    const clientSubmissions = submissions; 
    
    useEffect(() => {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
         //decoding the JWT to extract the payload(at index 1)
          const payloadBase64 = token.split(".")[1]; 
          const decodedPayload = JSON.parse(atob(payloadBase64));

          if (decodedPayload.username) {
            
            setClientUsername(decodedPayload.username); 
          } else if (decodedPayload.first_name) {
            setClientUsername(decodedPayload.first_name); 
          }
  
          if (decodedPayload.tenant_id) {
            localStorage.setItem('tenant_id', decodedPayload.tenant_id)  
          }
        } catch (e) {
          console.error("Failed to decode JWT token", e);
        }
      }
  }, []);

    const getAuthHeaders = useCallback(() => {
        const currentAccessToken = localStorage.getItem('access_token');
        if (!currentAccessToken) {
            setError("Authentication required. Please log in again.");
            return null;
        }
        return {
            'Authorization': `Bearer ${currentAccessToken}`, 
        };
    }, []);

    const fetchForms = useCallback(async (headers: Record<string, string>) => {
        const formsResponse = await fetch(FORMS_API_URL, { headers });
        if (!formsResponse.ok) {
            throw new Error(`Failed to fetch forms: ${formsResponse.statusText}`);
        }
        const formsData: { data: ApiFormResponse[] } = await formsResponse.json();

        const remappedForms: Form[] = formsData.data
            .filter(f => f.is_active) 
            .map(apiForm => ({
                id: String(apiForm.id),
                name: apiForm.name,
                description: apiForm.description,
                version: apiForm.version,
                category: mapFormNameToCategory(apiForm.name) ,
                status: apiForm.is_active ? 'active' : 'inactive',
                createdAt:new Date(apiForm.created_at), 
                updatedAt: new Date(apiForm.updated_at), 
                submissionCount: apiForm.submissionCount, 
                fields: apiForm.form_fields.map(apiField => {
                    const fieldName = apiField.name;
                    return ({
                        id: String(apiField.id),
                        label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, ' '),
                        name: fieldName,
                        // ⭐ FIX 3: Use the casting function for 'type'
                        type: safeCastFieldType(apiField.type), 
                        options: apiField.options,
                        // This property name now matches the interface in this file
                        isRequired: apiField.is_required, 
                        order: apiField.order,
                        isConditional: apiField.is_conditional,
                        conditionalField: apiField.conditional_field,
                        conditionalOperator: apiField.conditional_operator as FormField['conditionalOperator'],
                        conditionalValue: apiField.conditional_value,
                    }) as FormField; // The casting to unknown is no longer needed if types are correct
                }),
            }));
        setForms(remappedForms);
    }, []);

    const fetchSubmissions = useCallback(async (headers: Record<string, string>) => {
        const submissionsResponse = await fetch(MY_SUBMISSIONS_API_URL, { headers });
        
        if (!submissionsResponse.ok) {
            const errorDetails = await submissionsResponse.text();
            console.error("Submission fetch failed with status:", submissionsResponse.status, "Details:", errorDetails);
            throw new Error(`Failed to fetch submissions: ${submissionsResponse.status} ${submissionsResponse.statusText}`);
        }
        
        const fullApiResponse: BackendResponseWrapper = await submissionsResponse.json();
        const apiData = fullApiResponse.data;
        const submissionArray: ApiSubmissionResponse[] = (apiData && Array.isArray(apiData)) ? apiData : [];
        
        const remappedSubmissions: FormSubmission[] = submissionArray.map(apiSubmission => {
            let parsedData: Record<string, any> = {};
            try {
                parsedData = JSON.parse(apiSubmission.data);
            } catch (e) {
                console.error("Failed to parse submission data JSON string:", apiSubmission.data, e);
            }

            return {
                id: String(apiSubmission.id),
                formId: String(apiSubmission.form.id),
                formName: apiSubmission.form.name,
                clientName: apiSubmission.user.first_name || clientName, 
                clientEmail: apiSubmission.user.email,
                data: parsedData, 
                status: apiSubmission.status,
                submittedAt: new Date(apiSubmission.submitted_at),
                files: {} 
            }
        });

        setSubmissions(remappedSubmissions);
    }, [clientName]);

  
    useEffect(() => {
        const combinedFetch = async () => {
            setLoading(true);
            setError(null);
            
            const headers = getAuthHeaders();
            if (!headers) {
                setLoading(false);
                return;
            }

            try {
                await Promise.all([
                    fetchForms(headers), 
                    fetchSubmissions(headers) 
                ]);
            } catch (err) {
                console.error('Combined Fetch Error:', err);
                setError(`Failed to load portal data. ${err instanceof Error ? err.message : 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        };

        combinedFetch();
    }, [getAuthHeaders, fetchForms, fetchSubmissions, accessToken]); 
 

    const handleStartForm = (form: Form) => {
        setSelectedForm(form);
    };

    const handleSubmitForm = async (formId: string, data: Record<string, any>, files: Record<string, File[]>) => {
        const form = forms.find(f => f.id === formId);
        if (!form) return;

        setLoading(true);
        try {
            const currentAccessToken = localStorage.getItem('access_token'); 
            if (!currentAccessToken) {
                throw new Error("Authentication failed: Access token not found in storage.");
            }
            
            const formData = new FormData();
            formData.append('form_id', formId);
            formData.append('data', JSON.stringify(data)); 

            for (const fieldName in files) {
                if (files.hasOwnProperty(fieldName)) {
                    files[fieldName].forEach((file: File) => {
                        formData.append(fieldName, file); 
                    });
                }
            }
            
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

            setShowSuccessAlert(true);
            setSelectedForm(null);
            
            // await the submission fetch to ensure state update before re-render
            const headers = getAuthHeaders();
            if (headers) {
                await fetchSubmissions(headers); 
            }
            setTimeout(() => {
                setShowSuccessAlert(false); 
            }, 5000);

            setLoading(false); 
            
        } catch (err) {
            console.error('Submission Error:', err);
            setLoading(false); 
            alert(`Failed to submit form: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleLogout = () => {
        setLoggingOut(true);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token'); 
        setTimeout(() => {
            setLoggingOut(false);
            onLogout();
        }, 5000);
    };

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
// ... (rest of the component JSX remains the same) ...

    if (loggingOut) {
        return (
            <div className="fixed inset-0 bg-white/90 z-[100] flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-green animate-spin mb-4" />
                <h2 className="text-xl font-semibold text-text-dark">Logging you out...</h2>
                <p className="text-text-gray">Please wait while your session is securely terminated.</p>
            </div>
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
                                <p className='text-sm text-text-gray'>Welcome back, {clientUsername} </p>
                            </div>
                        </div>
                        
                        <Button variant="ghost" size="sm" onClick={handleLogout}> {/* Use new handler */}
                            <LogOut className="w-5 h-5 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>
            
            {/* Success Alert Placement */}
            {showSuccessAlert && (
                <div className="fixed top-20 right-4 z-50 w-full max-w-sm">
                    <Alert severity="success">
                        <AlertTitle>Success</AlertTitle>
                        Form has been submitted successfully.
                    </Alert>
                </div>
            )}


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
                                        // This check uses the updated 'clientSubmissions' state
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
                                                    // Button is DISABLED if form is already submitted
                                                    disabled={alreadySubmitted} 
                                                    className={alreadySubmitted ? 'btn-secondary' : 'btn-primary'}
                                                    size="sm"
                                                >
                                                    {alreadySubmitted ? (
                                                        <>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View Submission
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
                                            </div>
                                        </div>
                                        
                                        <div className="text-right">
                                            <Badge className={`status-tag ${getStatusColor(submission.status)}`}>
                                                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Submission Details */}
                                    <div className="mt-4 pt-4 border-t border-gray">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Iterate over the now-parsed 'submission.data' object */}
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

                        {clientSubmissions.length === 0 && !loading && !error && (
                            <Card className="financial-card text-center py-12">
                                <Clock className="w-12 h-12 text-text-gray mx-auto mb-4" />
                                <h3 className="mb-2">No Submissions Yet</h3>
                                <p className="text-text-gray mb-4">You haven't submitted any forms yet.</p>
                                <Button onClick={() => setActiveTab('available')} className="btn-primary">
                                    Browse Available Forms
                                </Button>
                            </Card>
                        )}
                        
                        {loading && activeTab === 'submissions' && (
                            <Card className="financial-card text-center py-12">
                                <Loader2 className="w-8 h-8 text-primary-green mx-auto mb-4 animate-spin" />
                                <p className="text-text-gray">Loading your submissions...</p>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}