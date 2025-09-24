import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FormBuilder } from './FormBuilder';
import { SubmissionManager } from './SubmissionManager';
import { NotificationCenter } from './NotificationCenter';
import { 
  FileText, 
  Users, 
  Settings, 
  Bell, 
  Plus, 
  LogOut,
  BarChart3,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { mockForms, mockSubmissions, mockNotifications } from '../../utils/mockData';
import { type Form, type FormSubmission, type Notification } from '../../types/forms';

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [forms, setForms] = useState<Form[]>(mockForms);
  const [submissions, setSubmissions] = useState<FormSubmission[]>(mockSubmissions);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState<Form | null>(null);

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
  const totalSubmissions = submissions.length;
  const activeForms = forms.filter(f => f.status === 'active').length;

  const handleCreateForm = () => {
    setEditingForm(null);
    setShowFormBuilder(true);
  };

  const handleEditForm = (form: Form) => {
    setEditingForm(form);
    setShowFormBuilder(true);
  };

  const handleSaveForm = (formData: Partial<Form>) => {
    if (editingForm) {
      // Update existing form
      setForms(prev => prev.map(f => 
        f.id === editingForm.id 
          ? { ...f, ...formData, updatedAt: new Date() }
          : f
      ));
    } else {
      // Create new form
      const newForm: Form = {
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
        submissionCount: 0,
        status: 'draft',
        ...formData as Form
      };
      setForms(prev => [...prev, newForm]);
    }
    setShowFormBuilder(false);
    setEditingForm(null);
  };

  const handleDeleteForm = (formId: string) => {
    setForms(prev => prev.filter(f => f.id !== formId));
  };

  if (showFormBuilder) {
    return (
      <FormBuilder
        form={editingForm}
        onSave={handleSaveForm}
        onCancel={() => {
          setShowFormBuilder(false);
          setEditingForm(null);
        }}
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
              <BarChart3 className="w-8 h-8 text-primary-green" />
              <h1 className="text-xl font-semibold">Financial Services Admin</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => setActiveTab('notifications')}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-primary-orange text-white min-w-[20px] h-5 flex items-center justify-center text-xs">
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>
              
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="financial-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-gray">Active Forms</p>
                    <p className="text-2xl font-semibold text-text-dark">{activeForms}</p>
                  </div>
                  <FileText className="w-8 h-8 text-primary-green" />
                </div>
              </Card>

              <Card className="financial-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-gray">Total Submissions</p>
                    <p className="text-2xl font-semibold text-text-dark">{totalSubmissions}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary-orange" />
                </div>
              </Card>

              <Card className="financial-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-gray">Pending Review</p>
                    <p className="text-2xl font-semibold text-text-dark">{pendingSubmissions}</p>
                  </div>
                  <Clock className="w-8 h-8 text-warning" />
                </div>
              </Card>

              <Card className="financial-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-gray">Notifications</p>
                    <p className="text-2xl font-semibold text-text-dark">{unreadNotifications}</p>
                  </div>
                  <Bell className="w-8 h-8 text-error" />
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="financial-card">
              <h3 className="mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {submissions.slice(0, 5).map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 bg-neutral-gray rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        submission.status === 'pending' ? 'bg-warning' :
                        submission.status === 'approved' ? 'bg-success' :
                        submission.status === 'review' ? 'bg-info' : 'bg-error'
                      }`} />
                      <div>
                        <p className="font-medium text-text-dark">{submission.clientName}</p>
                        <p className="text-sm text-text-gray">{submission.formName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`status-tag ${
                        submission.status === 'pending' ? 'status-warning' :
                        submission.status === 'approved' ? 'status-success' : 'status-warning'
                      }`}>
                        {submission.status}
                      </Badge>
                      <p className="text-xs text-text-gray mt-1">
                        {submission.submittedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="forms" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2>Form Management</h2>
              <Button onClick={handleCreateForm} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create New Form
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form) => (
                <Card key={form.id} className="financial-card">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className={`status-tag ${
                      form.status === 'active' ? 'status-success' :
                      form.status === 'draft' ? 'status-warning' : 'status-error'
                    }`}>
                      {form.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {form.category}
                    </Badge>
                  </div>

                  <h3 className="mb-2">{form.name}</h3>
                  <p className="text-sm text-text-gray mb-4">{form.description}</p>

                  <div className="flex items-center justify-between text-sm text-text-gray mb-4">
                    <span>{form.fields.length} fields</span>
                    <span>{form.submissionCount} submissions</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditForm(form)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteForm(form.id)}
                      className="text-error border-error hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="submissions">
            <SubmissionManager 
              submissions={submissions}
              onUpdateSubmission={(id, updates) => {
                setSubmissions(prev => prev.map(s => 
                  s.id === id ? { ...s, ...updates } : s
                ));
              }}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationCenter 
              notifications={notifications}
              onMarkAsRead={(id) => {
                setNotifications(prev => prev.map(n => 
                  n.id === id ? { ...n, read: true } : n
                ));
              }}
              onMarkAllAsRead={() => {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}