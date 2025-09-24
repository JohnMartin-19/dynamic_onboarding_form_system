import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  GripVertical,
  Type,
  Hash,
  Calendar,
  ChevronDown,
  CheckSquare,
  Upload
} from 'lucide-react';
import { Form, FormField } from '../types/forms';

interface FormBuilderProps {
  form: Form | null;
  onSave: (form: Partial<Form>) => void;
  onCancel: () => void;
}

const fieldTypeIcons = {
  text: Type,
  number: Hash,
  date: Calendar,
  dropdown: ChevronDown,
  checkbox: CheckSquare,
  file: Upload
};


export function FormBuilder({ form, onSave, onCancel }: FormBuilderProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general' as 'kyc' | 'loan' | 'investment' | 'general',
    status: 'draft' as 'draft' | 'active' | 'archived'
  });
  
  const [fields, setFields] = useState<FormField[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (form) {
      setFormData({
        name: form.name,
        description: form.description,
        category: form.category,
        status: form.status
      });
      setFields(form.fields);
    }
  }, [form]);

  const addField = () => {
    const newField: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      name: `field_${fields.length + 1}`,
      label: `New Field ${fields.length + 1}`,
      type: 'text',
      required: false,
      placeholder: ''
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields(prev => prev.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    ));
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };


  const handleSave = () => {
    const formToSave: Partial<Form> = {
      ...formData,
      fields: fields.map(field => ({
        ...field,
        name: field.name || field.label.toLowerCase().replace(/\s+/g, '_')
      }))
    };
    onSave(formToSave);
  };

  const addFieldOption = (fieldIndex: number) => {
    const field = fields[fieldIndex];
    const options = field.options || [];
    updateField(fieldIndex, {
      options: [...options, `Option ${options.length + 1}`]
    });
  };

  const updateFieldOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const field = fields[fieldIndex];
    const options = [...(field.options || [])];
    options[optionIndex] = value;
    updateField(fieldIndex, { options });
  };

  const removeFieldOption = (fieldIndex: number, optionIndex: number) => {
    const field = fields[fieldIndex];
    const options = field.options?.filter((_, i) => i !== optionIndex) || [];
    updateField(fieldIndex, { options });
  };

  if (previewMode) {
    return (
      <div className="min-h-screen bg-neutral-gray">
        <header className="bg-white border-b border-gray shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => setPreviewMode(false)}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-semibold">Form Preview</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="financial-card">
            <div className="mb-6">
              <h2 className="mb-2">{formData.name || 'Untitled Form'}</h2>
              <p className="text-text-gray">{formData.description}</p>
              <Badge variant="outline" className="mt-2">
                {formData.category}
              </Badge>
            </div>

            <div className="space-y-6">
              {fields.map((field) => {
                const IconComponent = fieldTypeIcons[field.type];
                
                return (
                  <div key={field.id} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      {field.label}
                      {field.required && <span className="text-error">*</span>}
                    </Label>
                    
                    {field.type === 'text' && (
                      <Input placeholder={field.placeholder} disabled />
                    )}
                    
                    {field.type === 'number' && (
                      <Input type="number" placeholder={field.placeholder} disabled />
                    )}
                    
                    {field.type === 'date' && (
                      <Input type="date" disabled />
                    )}
                    
                    {field.type === 'dropdown' && (
                      <Select disabled>
                        <SelectTrigger>
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
                        <Checkbox disabled />
                        <Label>{field.label}</Label>
                      </div>
                    )}
                    
                    {field.type === 'file' && (
                      <div className="border-2 border-dashed border-gray rounded-lg p-4 text-center text-text-gray">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p>Click to upload or drag and drop</p>
                        {field.validation?.fileTypes && (
                          <p className="text-xs">
                            Allowed: {field.validation.fileTypes.join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-gray">
              <Button className="btn-primary" disabled>
                Submit Form
              </Button>
            </div>
          </Card>
        </div>
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
              <Button variant="ghost" onClick={onCancel}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold">
                {form ? 'Edit Form' : 'Create New Form'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setPreviewMode(true)}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSave} className="btn-primary">
                <Save className="w-4 h-4 mr-2" />
                Save Form
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Settings */}
          <div className="lg:col-span-1">
            <Card className="financial-card sticky top-8">
              <h3 className="mb-4">Form Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="form-name">Form Name</Label>
                  <Input
                    id="form-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter form name"
                  />
                </div>

                <div>
                  <Label htmlFor="form-description">Description</Label>
                  <Textarea
                    id="form-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this form is for"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="form-category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kyc">KYC</SelectItem>
                      <SelectItem value="loan">Loan</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="form-status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>

          {/* Form Fields */}
          <div className="lg:col-span-2">
            <Card className="financial-card">
              <div className="flex justify-between items-center mb-6">
                <h3>Form Fields</h3>
                <Button onClick={addField} className="btn-secondary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>

              <div className="space-y-6">
                {fields.map((field, index) => {
                  const IconComponent = fieldTypeIcons[field.type];
                  
                  return (
                    <Card key={field.id} className="p-4 border border-gray">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-text-gray cursor-move" />
                          <IconComponent className="w-4 h-4 text-primary-green" />
                          <span className="font-medium">
                            {field.label || `Field ${index + 1}`}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(index)}
                          className="text-error hover:text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Field Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            placeholder="Enter field label"
                          />
                        </div>

                        <div>
                          <Label>Field Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value: any) => updateField(index, { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="dropdown">Dropdown</SelectItem>
                              <SelectItem value="checkbox">Checkbox</SelectItem>
                              <SelectItem value="file">File Upload</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {(field.type === 'text' || field.type === 'number') && (
                          <div>
                            <Label>Placeholder</Label>
                            <Input
                              value={field.placeholder || ''}
                              onChange={(e) => updateField(index, { placeholder: e.target.value })}
                              placeholder="Enter placeholder text"
                            />
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.required}
                            onCheckedChange={(checked) => updateField(index, { required: !!checked })}
                          />
                          <Label>Required field</Label>
                        </div>
                      </div>

                      {/* Dropdown Options */}
                      {field.type === 'dropdown' && (
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <Label>Options</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addFieldOption(index)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Option
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {field.options?.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => updateFieldOption(index, optionIndex, e.target.value)}
                                  placeholder={`Option ${optionIndex + 1}`}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFieldOption(index, optionIndex)}
                                  className="text-error"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )) || []}
                          </div>
                        </div>
                      )}

                      {/* File Upload Settings */}
                      {field.type === 'file' && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <Label>Allowed File Types (comma separated)</Label>
                            <Input
                              value={field.validation?.fileTypes?.join(', ') || ''}
                              onChange={(e) => updateField(index, {
                                validation: {
                                  ...field.validation,
                                  fileTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                }
                              })}
                              placeholder="pdf, jpg, png, doc"
                            />
                          </div>
                          <div>
                            <Label>Max File Size (MB)</Label>
                            <Input
                              type="number"
                              value={field.validation?.maxFileSize || ''}
                              onChange={(e) => updateField(index, {
                                validation: {
                                  ...field.validation,
                                  maxFileSize: parseInt(e.target.value) || undefined
                                }
                              })}
                              placeholder="5"
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}

                {fields.length === 0 && (
                  <div className="text-center py-12 text-text-gray">
                    <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No fields added yet. Click "Add Field" to get started.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}