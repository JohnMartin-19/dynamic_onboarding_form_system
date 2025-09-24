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
  CheckCircle
} from 'lucide-react';

interface SignupPageProps {
  onSignup: (userData: any) => void;
  onSwitchToLogin: () => void;
}

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

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Please enter a valid email';
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
    
    // Simulate signup delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onSignup(formData);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-gray via-light-green to-light-orange relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-green rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary-orange rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-primary-green rounded-full blur-2xl"></div>
      </div>

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
                  <h1 className="text-2xl font-bold text-text-dark">FinanceFlow</h1>
                </div>
                <h2 className="text-3xl font-bold text-text-dark">Create Your Account</h2>
                <p className="text-text-gray mt-2">Join thousands of businesses streamlining their financial processes</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Contact Information */}
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

                {/* Business Information */}
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
                        className="financial-input pl-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value: string) => updateFormData('role', value)}>
                      <SelectTrigger className="financial-input">
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
                  </div>
                </div>

                {/* Password Fields */}
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

                {/* Terms and Conditions */}
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={agreeToTerms}
                      onCheckedChange={setAgreeToTerms}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <p className="text-sm text-text-dark">
                        I agree to the{' '}
                        <button type="button" className="text-primary-green hover:text-dark-green underline">
                          Terms and Conditions
                        </button>{' '}
                        and{' '}
                        <button type="button" className="text-primary-green hover:text-dark-green underline">
                          Privacy Policy
                        </button>
                      </p>
                    </div>
                  </div>
                  {errors.terms && <p className="text-xs text-error">{errors.terms}</p>}
                </div>

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