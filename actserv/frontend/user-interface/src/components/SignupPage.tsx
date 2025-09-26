import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  ArrowLeft,
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  User, 
  Building2,
  Phone,
  CheckCircle,
  AlertTriangle 
} from 'lucide-react';

interface SignupPageProps {
  onSignup: (userData: any) => void;
  onSwitchToLogin: () => void;
}

// 1. Define the API endpoint
const API_URL = 'http://127.0.0.1:8001/auth/api/v1/register/';

export function SignupPage({ onSignup, onSwitchToLogin }: SignupPageProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null); // State for general API errors

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setApiError(null); // Clear general API error
  };

  const validateForm = () => {
    // ... (Your existing validation logic)
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email'; // More robust email check
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!agreeToTerms) newErrors.terms = 'You must agree to the terms and conditions';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError(null); // Clear any previous API errors

    // 2. Map frontend fields to match Django serializer fields (if necessary)
    const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phone, // Ensure this matches your serializer field
        company_name: formData.company, // Ensure this matches your serializer field
        role: formData.role,
        password: formData.password,
        confirm_password: formData.confirmPassword // Needed for validation in the serializer/view
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
            // Success: HTTP 201 Created
            onSignup(data); // Pass successful data to the parent handler
            // Optionally redirect to login or show a success message
            onSwitchToLogin(); 
        } else {
            // API Error: HTTP 400, 403, 500, etc.
            if (response.status === 400 && data.data) {
                // Handle Django REST Framework validation errors
                const apiValidationErrors: Record<string, string> = {};
                // Flatten DRF errors into the format expected by newErrors state
                for (const key in data.data) {
                    // Map Django field names back to frontend field names
                    let frontendKey = key.replace(/_(\w)/g, (_, c) => c.toUpperCase());
                    
                    // Specific mapping for phone_number and company_name/role
                    if (key === 'phone_number') frontendKey = 'phone';
                    if (key === 'company_name') frontendKey = 'company';
                    
                    // Use the first error message for simplicity
                    apiValidationErrors[frontendKey] = Array.isArray(data.data[key]) 
                        ? data.data[key][0] 
                        : data.data[key];
                }
                setErrors(prev => ({ ...prev, ...apiValidationErrors }));
            } else if (data.message) {
                // Handle general API messages (e.g., "Failed to create user")
                 setApiError(data.message);
            } else {
                // Fallback for unexpected errors
                setApiError('An unknown error occurred during registration.');
            }
        }
    } catch (error) {
        // Network or fetch-related error
        console.error('Registration API Error:', error);
        setApiError('Could not connect to the server. Please check your network.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-gray via-light-green to-light-orange relative overflow-hidden">
      {/* ... (Background Elements and Container remain the same) ... */}

      <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card className="p-8 financial-shadow-lg bg-white/95 backdrop-blur-sm border-0">
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="p-2 bg-primary-green rounded-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-text-dark">ActServ</h1>
                </div>
                <h2 className="text-3xl font-bold text-text-dark">Create Your Account</h2>
                <p className="text-text-gray mt-2">Join thousands of businesses streamlining their financial processes</p>
              </div>
              
              {/* General API Error Display */}
              {apiError && (
                <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span className="font-medium">API Error:</span> {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* ... (Your existing form fields, updated to use correct error keys) ... */}
                
                {/* ... (Personal Information block) ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-green w-5 h-5" />
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => updateFormData('firstName', e.target.value)}
                        placeholder="Enter your first name"
                        className={`financial-input pl-11 ${errors.firstName ? 'border-error' : ''}`}
                        required
                      />
                    </div>
                    {errors.firstName && <p className="text-xs text-error">{errors.firstName}</p>}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-green w-5 h-5" />
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => updateFormData('lastName', e.target.value)}
                        placeholder="Enter your last name"
                        className={`financial-input pl-11 ${errors.lastName ? 'border-error' : ''}`}
                        required
                      />
                    </div>
                    {errors.lastName && <p className="text-xs text-error">{errors.lastName}</p>}
                  </div>
                </div>

                {/* ... (Contact Information block) ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-green w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        placeholder="Enter your email"
                        className={`financial-input pl-11 ${errors.email ? 'border-error' : ''}`}
                        required
                      />
                    </div>
                    {errors.email && <p className="text-xs text-error">{errors.email}</p>}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-green w-5 h-5" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        placeholder="Enter your phone number"
                        className={`financial-input pl-11 ${errors.phone ? 'border-error' : ''}`}
                        required
                      />
                    </div>
                    {/* Note: error key for phone number in Django is often 'phone_number' */}
                    {errors.phone && <p className="text-xs text-error">{errors.phone}</p>}
                  </div>
                </div>

                {/* ... (Business Information block) ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company */}
                  <div className="space-y-2">
                    <Label htmlFor="company">Company (Optional)</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-green w-5 h-5" />
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => updateFormData('company', e.target.value)}
                        placeholder="Enter your company name"
                        className={`financial-input pl-11 ${errors.company ? 'border-error' : ''}`}
                      />
                    </div>
                     {errors.company && <p className="text-xs text-error">{errors.company}</p>}
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value: string) => updateFormData('role', value)}>
                      <SelectTrigger className={`financial-input ${errors.role ? 'border-error' : ''}`}>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual Client</SelectItem>
                        <SelectItem value="business_owner">Business Owner</SelectItem>
                        <SelectItem value="financial_advisor">Financial Advisor</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                     {errors.role && <p className="text-xs text-error">{errors.role}</p>}
                  </div>
                </div>

                {/* ... (Password Fields block) ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-green w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        placeholder="Create a password"
                        className={`financial-input pl-11 pr-11 ${errors.password ? 'border-error' : ''}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-gray hover:text-primary-green transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-error">{errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-green w-5 h-5" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                        placeholder="Confirm your password"
                        className={`financial-input pl-11 pr-11 ${errors.confirmPassword ? 'border-error' : ''}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-gray hover:text-primary-green transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-error">{errors.confirmPassword}</p>}
                  </div>
                </div>
                
                {/* Terms and Conditions (kept for completeness) */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(Boolean(checked))}
                    className={`${errors.terms ? 'border-error' : ''}`}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal text-text-gray">
                    I agree to the <a href="#" className="text-primary-green hover:underline">Terms and Conditions</a>
                  </Label>
                </div>
                {errors.terms && <p className="text-xs text-error">{errors.terms}</p>}
                
                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn-primary w-full h-12"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>

              {/* Back to Login */}
              {/* ... (Remains the same) ... */}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}