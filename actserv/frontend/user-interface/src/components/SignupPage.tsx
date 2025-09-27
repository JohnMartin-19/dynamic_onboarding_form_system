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
  User, // Used for username
  Building2,
  Phone,
  CheckCircle,
  AlertTriangle,
  Loader2 
} from 'lucide-react';

interface SignupPageProps {
  onSignup: (userData: any) => void;
  onSwitchToLogin: () => void;
}

const API_URL = 'http://127.0.0.1:8001/auth/api/v1/register/';

export function SignupPage({ onSignup, onSwitchToLogin }: SignupPageProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    // --- CHANGE 1: Add username field to state ---
    username: '', 
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
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false); 

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setApiError(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    // --- CHANGE 2: Add username validation ---
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (formData.username.trim().length < 3) newErrors.username = 'Username must be at least 3 characters';
    
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
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
    setApiError(null);
    setIsSuccess(false);

    // --- CHANGE 3: Include username in the API payload ---
    const payload = {
        username: formData.username, // New field for the API
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phone,
        company_name: formData.company,
        role: formData.role,
        password: formData.password,
        confirm_password: formData.confirmPassword
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
            
            onSignup(data); 

            setIsSuccess(true); 
            
            // Set 5-second timeout for redirect to the LOGIN page
            setTimeout(() => {
                onSwitchToLogin(); 
            }, 5000); 

        } else {
            
            if (response.status === 400 && data.data) {
                const apiValidationErrors: Record<string, string> = {};
                for (const key in data.data) {
                    let frontendKey = key.toLowerCase();
                    if (key === 'phone_number') frontendKey = 'phone';
                    if (key === 'company_name') frontendKey = 'company';
                    // --- Handle username error key from API ---
                    if (key === 'username') frontendKey = 'username';
                    
                    apiValidationErrors[frontendKey] = Array.isArray(data.data[key]) 
                        ? data.data[key][0] 
                        : data.data[key];
                }
                setErrors(prev => ({ ...prev, ...apiValidationErrors }));
            } else if (data.message) {
                 setApiError(data.message);
            } else {
                setApiError('An unknown error occurred during registration.');
            }
        }
    } catch (error) {
        console.error('Registration API Error:', error);
        setApiError('Could not connect to the server. Please check your network.');
    } finally {
        if (!isSuccess) {
            setIsLoading(false);
        }
    }
  };

  // --- RENDER SUCCESS CARD (no changes) ---
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-gray via-light-green to-light-orange">
        <Card className="p-10 financial-shadow-lg max-w-sm w-full text-center">
          <CheckCircle className="w-16 h-16 text-primary-green mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-text-dark mb-3">Registration Successful!</h2>
          <p className="text-text-gray mb-6">Your account has been created. You will be redirected to the login page shortly.</p>
          <div className="flex justify-center items-center text-primary-green">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Redirecting in 5 seconds...
          </div>
          <Button 
            onClick={onSwitchToLogin} 
            className="btn-primary w-full mt-4"
          >
            Go to Login Now
          </Button>
        </Card>
      </div>
    );
  }

  // --- RENDER REGISTRATION FORM ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-gray via-light-green to-light-orange relative overflow-hidden">
      <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card className="p-8 financial-shadow-lg bg-white/95 backdrop-blur-sm border-0">
            <div className="space-y-6"> {/* Changed space-y-8 to 6 for better spacing */}
              {/* Header (no changes) */}
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
              
              {/* General API Error Display (no changes) */}
              {apiError && (
                <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span className="font-medium">API Error:</span> {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-green w-5 h-5" />
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => updateFormData('firstName', e.target.value)}
                        placeholder="First name"
                        className={`financial-input pl-11 ${errors.firstName ? 'border-error' : ''}`}
                        required
                      />
                    </div>
                    {errors.firstName && <p className="text-xs text-error">{errors.firstName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-green w-5 h-5" />
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => updateFormData('lastName', e.target.value)}
                        placeholder="Last name"
                        className={`financial-input pl-11 ${errors.lastName ? 'border-error' : ''}`}
                        required
                      />
                    </div>
                    {errors.lastName && <p className="text-xs text-error">{errors.lastName}</p>}
                  </div>

                  {/* --- CHANGE 4: Username Input Field (New) --- */}
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-green w-5 h-5" />
                      <Input
                        id="username"
                        type="text"
                        value={formData.username}
                        onChange={(e) => updateFormData('username', e.target.value)}
                        placeholder="Choose a username"
                        className={`financial-input pl-11 ${errors.username ? 'border-error' : ''}`}
                        required
                      />
                    </div>
                    {errors.username && <p className="text-xs text-error">{errors.username}</p>}
                  </div>
                </div>


                {/* Contact Information (Same structure, but adjusted layout for new username field) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {errors.phone && <p className="text-xs text-error">{errors.phone}</p>}
                  </div>
                </div>

                {/* Business Information (no changes) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Password Fields (no changes) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                {/* Terms and Conditions & Submit Button (no changes) */}
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

              {/* Back to Login (no changes) */}
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-gray"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-text-gray">Already have an account?</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={onSwitchToLogin}
                  className="w-full border-primary-green text-primary-green hover:bg-light-green"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>

            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}