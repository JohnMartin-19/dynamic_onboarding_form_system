import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Building2, 
  TrendingUp, 
  Shield,
  Users
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string, userType: 'admin' | 'client') => void;
  onSwitchToSignup: () => void;
  onAdminPortal: () => void;
}

export function LoginPage({ onLogin, onSwitchToSignup, onAdminPortal }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, determine user type based on email
    const userType = email.includes('admin') ? 'admin' : 'client';
    
    onLogin(email, password, userType);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-gray via-light-green to-light-orange relative overflow-hidden">
      {/* Admin Portal Button - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <Button 
          onClick={onAdminPortal}
          variant="outline"
          className="bg-white/90 backdrop-blur-sm border-primary-green text-primary-green hover:bg-primary-green hover:text-white transition-all duration-300"
        >
          <Users className="w-4 h-4 mr-2" />
          Admin Portal
        </Button>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-green rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary-orange rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-primary-green rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl w-full items-center">
          
          {/* Left Side - Hero Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-primary-green rounded-xl">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-text-dark">
                  FinanceFlow
                </h1>
              </div>
              
              <h2 className="text-3xl font-bold text-text-dark leading-tight">
                Streamline Your Financial
                <span className="text-primary-green"> Onboarding Process</span>
              </h2>
              
              <p className="text-lg text-text-gray leading-relaxed">
                Secure, efficient, and compliant financial services platform. 
                Handle KYC, loan applications, and investment declarations with ease.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-light-green rounded-lg">
                  <Shield className="w-5 h-5 text-primary-green" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-dark">Bank-Grade Security</h4>
                  <p className="text-sm text-text-gray">End-to-end encryption</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-light-orange rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary-orange" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-dark">Real-time Processing</h4>
                  <p className="text-sm text-text-gray">Instant form submission</p>
                </div>
              </div>
            </div>

            {/* Financial Image */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white/50">
                <img
                  src="https://images.unsplash.com/photo-1733503747506-773e56e4078f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5hbmNpYWwlMjB0ZWNobm9sb2d5JTIwb2ZmaWNlJTIwbW9kZXJufGVufDF8fHx8MTc1ODYzMjc5OXww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Modern financial technology office"
                  className="w-full h-64 object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary-green/20 to-transparent rounded-2xl"></div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md p-8 financial-shadow-lg bg-white/95 backdrop-blur-sm border-0">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-text-dark">Welcome Back</h3>
                  <p className="text-text-gray mt-2">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-green w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="financial-input pl-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-green w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="financial-input pl-11 pr-11"
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
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="btn-primary w-full h-12"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border-gray"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-text-gray">New to FinanceFlow?</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={onSwitchToSignup}
                    className="w-full border-primary-green text-primary-green hover:bg-light-green"
                  >
                    Create Account
                  </Button>
                </div>

                <div className="text-center">
                  <button className="text-sm text-primary-green hover:text-dark-green underline">
                    Forgot your password?
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}