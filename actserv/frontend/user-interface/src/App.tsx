import React, { useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { ClientPortal } from './components/ClientPortal';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { Button } from './components/ui/button';
import { Users, UserCheck } from 'lucide-react';

type AuthState = 'login' | 'signup' | 'roleSelection';
type UserType = 'admin' | 'client';

interface User {
  email: string;
  userType: UserType;
  name?: string;
}

interface SignupData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('login');
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (email: string, password: string, userType: UserType) => {
    // In a real app, this would make an API call to authenticate
    setUser({ email, userType, name: email.split('@')[0] });
  };

  const handleSignup = (userData: SignupData) => {
    // In a real app, this would make an API call to create the account
    const userType: UserType = userData.email.includes('admin') ? 'admin' : 'client';
    setUser({ 
      email: userData.email, 
      userType,
      name: `${userData.firstName} ${userData.lastName}`
    });
  };

  const handleLogout = () => {
    setUser(null);
    setAuthState('login');
  };

  const handleAdminPortal = () => {
    setAuthState('roleSelection');
  };

  // Show role selection (original portal selection)
  if (authState === 'roleSelection') {
    return (
      <div className="min-h-screen bg-neutral-gray flex items-center justify-center">
        <div className="financial-card max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="mb-2">Financial Services Onboarding</h1>
            <p>Select your role to continue</p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={() => setUser({ email: 'admin@demo.com', userType: 'admin' })}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Admin Portal
            </Button>
            
            <Button 
              onClick={() => setUser({ email: 'client@demo.com', userType: 'client' })}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <UserCheck className="w-5 h-5" />
              Client Portal
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-light-green rounded-lg">
            <p className="text-sm text-primary-green">
              <strong>Demo Platform:</strong> This is a flexible onboarding system for financial services. 
              Admins can create custom forms, while clients can submit KYC, loan applications, and investment declarations.
            </p>
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => setAuthState('login')}
              className="text-text-gray hover:text-primary-green"
            >
              ← Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show authenticated user interface
  if (user) {
    return (
      <div className="min-h-screen bg-neutral-gray">
        {user.userType === 'admin' ? (
          <AdminDashboard onLogout={handleLogout} />
        ) : (
          <ClientPortal onLogout={handleLogout} />
        )}
      </div>
    );
  }

  // Show authentication pages
  if (authState === 'signup') {
    return (
      <SignupPage
        onSignup={handleSignup}
        onSwitchToLogin={() => setAuthState('login')}
      />
    );
  }

  // Default: Show login page
  return (
    <LoginPage
      onLogin={handleLogin}
      onSwitchToSignup={() => setAuthState('signup')}
      onAdminPortal={handleAdminPortal}
    />
  );
}