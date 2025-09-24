import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  Send, 
  Upload,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { type Form, type FormField } from '../../types/forms';

interface FormSubmissionComponentProps {
  form: Form;
  onSubmit: (formId: string, data: Record<string, any>, files: Record<string, File[]>) => void;
  onCancel: () => void;
}

export function FormSubmissionComponent({ form, onSubmit, onCancel }: FormSubmissionComponentProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleFileChange = (fieldName: string, selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const field = form.fields.find(f => f.name === fieldName);
    const newFiles = Array.from(selectedFiles);
    
    // Validate file types
    if (field?.validation?.fileTypes) {
      const allowedTypes = field.validation.fileTypes;
      const invalidFiles = newFiles.filter(file => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        return !allowedTypes.includes(extension || '');
      });
      
      if (invalidFiles.length > 0) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
        }));
        return;
      }
    }
    
    // Validate file size
    if (field?.validation?.maxFileSize) {
      const maxSize = field.validation.maxFileSize * 1024 * 1024; // Convert MB to bytes
      const oversizedFiles = newFiles.filter(file => file.size > maxSize);
      
      if (oversizedFiles.length > 0) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: `File too large. Maximum size: ${field.validation?.maxFileSize}MB`
        }));
        return;
      }
    }
    
    setFiles(prev => ({ ...prev, [fieldName]: newFiles }));
    setErrors(prev => ({ ...prev, [fieldName]: '' }));
  };

  const removeFile = (fieldName: string, fileIndex: number) => {
    setFiles(prev => ({
      ...prev,
      [fieldName]: prev[fieldName]?.filter((_, index) => index !== fileIndex) || []
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    form.fields.forEach(field => {
      if (field.required) {
        const value = formData[field.name];
        const fieldFiles = files[field.name];
        
        if (field.type === 'file') {
          if (!fieldFiles || fieldFiles.length === 0) {
            newErrors[field.name] = 'This field is required';
          }
        } else if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field.name] = 'This field is required';
        }
      }
      
      // Validate conditional logic
      if (field.conditionalLogic) {
        const dependentValue = formData[field.conditionalLogic.dependsOn];
        let shouldShow = false;
        
        switch (field.conditionalLogic.condition) {
          case 'equals':
            shouldShow = dependentValue === field.conditionalLogic.value;
            break;
          case 'greater_than':
            shouldShow = Number(dependentValue) > Number(field.conditionalLogic.value);
            break;
          case 'less_than':
            shouldShow = Number(dependentValue) < Number(field.conditionalLogic.value);
            break;
        }
        
        if (shouldShow && field.required) {
          const value = formData[field.name];
          const fieldFiles = files[field.name];
          
          if (field.type === 'file') {
            if (!fieldFiles || fieldFiles.length === 0) {
              newErrors[field.name] = 'This field is required';
            }
          } else if (!value || (typeof value === 'string' && value.trim() === '')) {
            newErrors[field.name] = 'This field is required';
          }
        }
      }
      
      // Validate number ranges
      if (field.type === 'number' && formData[field.name] !== undefined) {
        const numValue = Number(formData[field.name]);
        if (field.validation?.min !== undefined && numValue < field.validation.min) {
          newErrors[field.name] = `Minimum value is ${field.validation.min}`;
        }
        if (field.validation?.max !== undefined && numValue > field.validation.max) {
          newErrors[field.name] = `Maximum value is ${field.validation.max}`;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate submission delay
      onSubmit(form.id, formData, files);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shouldShowField = (field: FormField): boolean => {
    if (!field.conditionalLogic) return true;
    
    const dependentValue = formData[field.conditionalLogic.dependsOn];
    
    switch (field.conditionalLogic.condition) {
      case 'equals':
        return dependentValue === field.conditionalLogic.value;
      case 'greater_than':
        return Number(dependentValue) > Number(field.conditionalLogic.value);
      case 'less_than':
        return Number(dependentValue) < Number(field.conditionalLogic.value);
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-gray">
      {/* Header */}
      <header className="bg-white border-b border-gray shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onCancel}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{form.name}</h1>
                <p className="text-sm text-text-gray">Complete all required fields</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <Card className="financial-card">
            {/* Form Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2>{form.name}</h2>
                <Badge variant="outline" className="capitalize">
                  {form.category}
                </Badge>
              </div>
              <p className="text-text-gray">{form.description}</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {form.fields.map((field) => {
                if (!shouldShowField(field)) return null;
                
                const hasError = !!errors[field.name];
                
                return (
                  <div key={field.id} className="space-y-2">
                    <Label className="flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-error">*</span>}
                    </Label>
                    
                    {field.type === 'text' && (
                      <Input
                        value={formData[field.name] || ''}
                        onChange={(e) => updateFormData(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className={hasError ? 'border-error' : ''}
                      />
                    )}
                    
                    {field.type === 'number' && (
                      <Input
                        type="number"
                        value={formData[field.name] || ''}
                        onChange={(e) => updateFormData(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        min={field.validation?.min}
                        max={field.validation?.max}
                        className={hasError ? 'border-error' : ''}
                      />
                    )}
                    
                    {field.type === 'date' && (
                      <Input
                        type="date"
                        value={formData[field.name] || ''}
                        onChange={(e) => updateFormData(field.name, e.target.value)}
                        className={hasError ? 'border-error' : ''}
                      />
                    )}
                    
                    {field.type === 'dropdown' && (
                      <Select
                        value={formData[field.name] || ''}
                        onValueChange={(value:any) => updateFormData(field.name, value)}
                      >
                        <SelectTrigger className={hasError ? 'border-error' : ''}>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option, i) => (
                            <SelectItem key={i} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {field.type === 'checkbox' && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData[field.name] || false}
                          onCheckedChange={(checked: any) => updateFormData(field.name, checked)}
                        />
                        <Label>{field.label}</Label>
                      </div>
                    )}
                    
                    {field.type === 'file' && (
                      <div>
                        <div className="border-2 border-dashed border-gray rounded-lg p-6 text-center hover:border-primary-green transition-colors">
                          <input
                            type="file"
                            multiple
                            onChange={(e) => handleFileChange(field.name, e.target.files)}
                            className="hidden"
                            id={`file-${field.id}`}
                            accept={field.validation?.fileTypes?.map(type => `.${type}`).join(',')}
                          />
                          <label htmlFor={`file-${field.id}`} className="cursor-pointer">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-text-gray" />
                            <p className="text-text-dark">Click to upload or drag and drop</p>
                            {field.validation?.fileTypes && (
                              <p className="text-sm text-text-gray mt-1">
                                Allowed: {field.validation.fileTypes.join(', ')}
                              </p>
                            )}
                            {field.validation?.maxFileSize && (
                              <p className="text-sm text-text-gray">
                                Max size: {field.validation.maxFileSize}MB
                              </p>
                            )}
                          </label>
                        </div>
                        
                        {/* Display uploaded files */}
                        {files[field.name] && files[field.name].length > 0 && (
                          <div className="mt-3 space-y-2">
                            {files[field.name].map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-neutral-gray rounded">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-primary-green" />
                                  <span className="text-sm text-text-dark">{file.name}</span>
                                  <span className="text-xs text-text-gray">
                                    ({(file.size / 1024 / 1024).toFixed(1)}MB)
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(field.name, index)}
                                  className="text-error hover:text-error"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Error message */}
                    {hasError && (
                      <div className="flex items-center gap-1 text-error text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors[field.name]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit Button */}
            <div className="mt-8 pt-6 border-t border-gray">
              <div className="flex justify-between items-center">
                <p className="text-sm text-text-gray">
                  * Required fields must be completed
                </p>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Form
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}