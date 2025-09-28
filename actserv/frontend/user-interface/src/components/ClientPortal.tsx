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
import { type Form, type FormSubmission, type FormField } from '../../types/forms'; 

// --- 1. API Interfaces (Assuming they remain the same) ---
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

interface ApiSubmissionResponse { 
    id: number; 
    form: { id: number, name: string };
    user: { id: number, email: string, first_name: string };
    data: string; // Changed to string to reflect the raw API response
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

// --- 2. API Endpoints (Assuming they remain the same) ---
const FORMS_API_URL = 'http://127.0.0.1:8001/form/api/v1/forms/';
const SUBMISSIONS_API_URL = 'http://127.0.0.1:8001/form/api/v1/submissions/'; 
const MY_SUBMISSIONS_API_URL = 'http://127.0.0.1:8001/form/api/v1/my_submissions/';

// --- 3. Component Start ---
export function ClientPortal({ onLogout, clientName, clientEmail, accessToken }: ClientPortalProps) {
    const [activeTab, setActiveTab] = useState('available');
    const [forms, setForms] = useState<Form[]>([]); 
    const [submissions, setSubmissions] = useState<FormSubmission[]>([]); 
    const [selectedForm, setSelectedForm] = useState<Form | null>(null);
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState<string | null>(null); 
    
    // State for Alert visibility
    const [showSuccessAlert, setShowSuccessAlert] = useState(false); 
    
    const clientSubmissions = submissions; 

    // --- Utility Function to get Headers ---
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

    // --- Data Fetching Logic (Forms) ---
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
                category: apiForm.name, 
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
    }, []);
    
    // --- Data Fetching Logic (Submissions - REVISED) ---
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
            // ⭐ CRITICAL FIX: Parse the JSON string inside the 'data' field
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
                data: parsedData, // ⭐ Use the PARSED object here
                status: apiSubmission.status,
                submittedAt: new Date(apiSubmission.submitted_at),
                files: {} 
            }
        });

        setSubmissions(remappedSubmissions);
    }, [clientName]);

    // --- Combined Fetch Effect ---
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
    // --- End Data Fetching Logic ---


    const handleStartForm = (form: Form) => {
        setSelectedForm(form);
    };

    /**
     * Handles form submission, shows success alert, updates form state, and keeps the user on the current tab.
     */
    const handleSubmitForm = async (formId: string, data: Record<string, any>, files: Record<string, File[]>) => {
        const form = forms.find(f => f.id === formId);
        if (!form) return;

        // Start loading spinner immediately
        setLoading(true);
        try {
            const currentAccessToken = localStorage.getItem('access_token'); 
            if (!currentAccessToken) {
                throw new Error("Authentication failed: Access token not found in storage.");
            }
            
            const formData = new FormData();
            formData.append('form_id', formId);
            formData.append('data', JSON.stringify(data)); 
            
            // Handle file appending
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

            // --- SUCCESS LOGIC: Alert & Inactivate Form ---
            
            // 1. Show the MUI Alert
            setShowSuccessAlert(true);
            
            // 2. Clear the form component view
            setSelectedForm(null);
            
            // 3. CRITICAL: Await the submission fetch to ensure state update before re-render
            const headers = getAuthHeaders();
            if (headers) {
                await fetchSubmissions(headers); 
            }
            
            // 4. Hide alert after 5 seconds
            setTimeout(() => {
                setShowSuccessAlert(false); 
            }, 5000);
            
            // 5. Stop loading *only* after submissions state is updated, guaranteeing re-render with disabled button
            setLoading(false); 
            
        } catch (err) {
            console.error('Submission Error:', err);
            // Stop loading on error and display standard alert
            setLoading(false); 
            alert(`Failed to submit form: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };
    
    // --- Utility functions for status icon/color ---
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


    // RENDER THE FORM SUBMISSION COMPONENT
    if (selectedForm) {
        return (
            <FormSubmissionComponent
                form={selectedForm}
                onSubmit={handleSubmitForm}
                onCancel={() => setSelectedForm(null)}
            />
        );
    }

    // --- MAIN CLIENT PORTAL RENDER ---
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