import  { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Eye, 
  Check, 
  X,  
  Search,
  Calendar,
  User,
  FileText,
  Download
} from 'lucide-react';
import { type FormSubmission } from '../../types/forms';
import { Label } from './ui/label';

interface SubmissionManagerProps {
  submissions: FormSubmission[];
  onUpdateSubmission: (id: string, updates: Partial<FormSubmission>) => void;
}

export function SubmissionManager({ submissions, onUpdateSubmission }: SubmissionManagerProps) {
  const [, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reviewNotes, setReviewNotes] = useState('');

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.formName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  const handleApprove = (submission: FormSubmission) => {
    onUpdateSubmission(submission.id, {
      status: 'approved',
      reviewedAt: new Date(),
      reviewNotes: reviewNotes || 'Application approved'
    });
    setSelectedSubmission(null);
    setReviewNotes('');
  };

  const handleReject = (submission: FormSubmission) => {
    if (!reviewNotes.trim()) {
      alert('Please provide review notes for rejection');
      return;
    }
    
    onUpdateSubmission(submission.id, {
      status: 'rejected',
      reviewedAt: new Date(),
      reviewNotes
    });
    setSelectedSubmission(null);
    setReviewNotes('');
  };

  const handleMarkForReview = (submission: FormSubmission) => {
    onUpdateSubmission(submission.id, {
      status: 'review',
      reviewNotes: reviewNotes || 'Marked for additional review'
    });
    setSelectedSubmission(null);
    setReviewNotes('');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2>Submission Management</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-gray w-4 h-4" />
            <Input
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="review">In Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="financial-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-gray">Total</p>
              <p className="text-2xl font-semibold text-text-dark">{submissions.length}</p>
            </div>
            <FileText className="w-8 h-8 text-text-gray" />
          </div>
        </Card>
        <Card className="financial-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-gray">Pending</p>
              <p className="text-2xl font-semibold text-warning">
                {submissions.filter(s => s.status === 'pending').length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-warning" />
          </div>
        </Card>
        <Card className="financial-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-gray">Approved</p>
              <p className="text-2xl font-semibold text-success">
                {submissions.filter(s => s.status === 'approved').length}
              </p>
            </div>
            <Check className="w-8 h-8 text-success" />
          </div>
        </Card>
        <Card className="financial-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-gray">Rejected</p>
              <p className="text-2xl font-semibold text-error">
                {submissions.filter(s => s.status === 'rejected').length}
              </p>
            </div>
            <X className="w-8 h-8 text-error" />
          </div>
        </Card>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.map((submission) => (
          <Card key={submission.id} className="financial-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-primary-green" />
                  <div>
                    <h4 className="font-medium text-text-dark">{submission.clientName}</h4>
                    <p className="text-sm text-text-gray">{submission.clientEmail}</p>
                  </div>
                </div>
                
                <div className="hidden md:block">
                  <h4 className="font-medium text-text-dark">{submission.formName}</h4>
                  <p className="text-sm text-text-gray">
                    Submitted {formatDate(submission.submittedAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Badge className={`status-tag ${getStatusColor(submission.status)}`}>
                  {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                </Badge>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setReviewNotes(submission.reviewNotes || '');
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center justify-between">
                        <span>Review Submission</span>
                        <Badge className={`status-tag ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </Badge>
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Client Information */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-gray rounded-lg">
                        <div>
                          <Label className="text-sm font-medium text-text-gray">Client Name</Label>
                          <p className="text-text-dark">{submission.clientName}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-text-gray">Email</Label>
                          <p className="text-text-dark">{submission.clientEmail}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-text-gray">Form</Label>
                          <p className="text-text-dark">{submission.formName}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-text-gray">Submitted</Label>
                          <p className="text-text-dark">{formatDate(submission.submittedAt)}</p>
                        </div>
                      </div>

                      {/* Submission Data */}
                      <div>
                        <h4 className="font-medium mb-3">Submitted Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(submission.data).map(([key, value]) => (
                            <div key={key} className="p-3 bg-neutral-gray rounded">
                              <Label className="text-sm font-medium text-text-gray">
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Label>
                              <p className="text-text-dark mt-1">
                                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Files */}
                      {Object.keys(submission.files).length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Uploaded Files</h4>
                          <div className="space-y-2">
                            {Object.entries(submission.files).map(([fieldName, fileList]) => (
                              <div key={fieldName} className="p-3 bg-neutral-gray rounded">
                                <Label className="text-sm font-medium text-text-gray">
                                  {fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Label>
                                <div className="mt-2 space-y-1">
                                  {fileList.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                      <span className="text-sm text-text-dark">{file.name}</span>
                                      <Button variant="ghost" size="sm">
                                        <Download className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Review Notes */}
                      <div>
                        <Label htmlFor="review-notes">Review Notes</Label>
                        <Textarea
                          id="review-notes"
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Add notes about this submission..."
                          rows={3}
                        />
                      </div>

                      {/* Actions */}
                      {submission.status !== 'approved' && submission.status !== 'rejected' && (
                        <div className="flex justify-end space-x-2 pt-4 border-t border-gray">
                          <Button
                            variant="outline"
                            onClick={() => handleMarkForReview(submission)}
                            className="btn-secondary"
                          >
                            Mark for Review
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleReject(submission)}
                            className="text-error border-error hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            onClick={() => handleApprove(submission)}
                            className="btn-primary"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        </div>
                      )}

                      {/* Review History */}
                      {submission.reviewedAt && (
                        <div className="p-4 bg-light-green rounded-lg">
                          <h5 className="font-medium text-primary-green mb-2">Review History</h5>
                          <p className="text-sm text-text-gray">
                            Reviewed on {formatDate(submission.reviewedAt)}
                          </p>
                          {submission.reviewNotes && (
                            <p className="text-sm text-text-dark mt-1">{submission.reviewNotes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredSubmissions.length === 0 && (
        <Card className="financial-card text-center py-12">
          <FileText className="w-12 h-12 text-text-gray mx-auto mb-4" />
          <h3 className="mb-2">No Submissions Found</h3>
          <p className="text-text-gray">
            {searchTerm || statusFilter !== 'all' 
              ? 'No submissions match your current filters.' 
              : 'No submissions have been received yet.'
            }
          </p>
        </Card>
      )}
    </div>
  );
}