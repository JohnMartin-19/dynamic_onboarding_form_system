import { useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { ClientPortal } from './components/ClientPortal';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { Button } from './components/ui/button';
import { Users, UserCheck } from 'lucide-react';
import '../styles/globals.css'

type AuthState = 'login' | 'signup' | 'adminLogin' | 'roleSelection';
type UserType = 'admin' | 'client';

interface User {
  email: string;
  userType: UserType;
  name?: string;
}

interface SignupDataResponse {
  message: string;
  data: {
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    company_name: string | null;
    role: string;
  }
}


const getInitialUser = (): User | null => {
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    try {
      return JSON.parse(storedUser) as User;
    } catch (e) {
     
      localStorage.removeItem('currentUser');
      return null;
    }
  }
  return null;
};


const saveUserToLocalStorage = (userData: User) => {
  localStorage.setItem('currentUser', JSON.stringify(userData));
};


export default function App() {
  const [authState, setAuthState] = useState<AuthState>('login');
  

  const [user, setUser] = useState<User | null>(getInitialUser); 

  const handleLogin = (
    email: string,
    _password: string,
    userType?: UserType
  ) => {
    const finalType: UserType = userType ?? "client"; 
   
    const derivedName = email.includes('@') ? email.split('@')[0] : 'Client User';
    
    const userData: User = { email, userType: finalType, name: derivedName };
    setUser(userData);
    saveUserToLocalStorage(userData); 
  };
  

  const handleAdminLogin = (email: string, _password: string) => {
    const derivedName = email.includes('@') ? email.split('@')[0] : 'Admin User';
    
    const userData: User = { email, userType: 'admin', name: derivedName };
    setUser(userData);
    saveUserToLocalStorage(userData); 
  };

  const handleSignup = (responseData: SignupDataResponse) => {
   
    const email = responseData?.data?.email;
    const firstName = responseData?.data?.first_name;
    const lastName = responseData?.data?.last_name;

    if (!email || !firstName || !lastName) {
        console.error("Signup response data is incomplete:", responseData);
        return; 
    }
    
   
    
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser'); 
    setAuthState('login');
  };

  const handleAdminPortal = () => {
    setAuthState('adminLogin');
  };

 
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
              onClick={() => {
                const adminData: User = { email: 'admin@demo.com', userType: 'admin', name: 'Admin Demo' };
                setUser(adminData);
                saveUserToLocalStorage(adminData);
              }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Admin Portal
            </Button>
            
            <Button 
              onClick={() => {
                const clientData: User = { email: 'client@demo.com', userType: 'client', name: 'Client Demo' };
                setUser(clientData);
                saveUserToLocalStorage(clientData);
              }}
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

  if (user) {
    const displayName = user.name || user.email.split('@')[0] || 'Unknown User';

    return (
      <div className="min-h-screen bg-neutral-gray">
        {user.userType === 'admin' ? (
          <AdminDashboard onLogout={handleLogout} />
        ) : (
          <ClientPortal 
              onLogout={handleLogout}
              clientName={displayName}
              clientEmail={user.email} 
              accessToken={''}          />
        )}
      </div>
    );
  }

  
  if (authState === 'adminLogin') {
    return (
      <LoginPage
        onLogin={(email, password) => handleAdminLogin(email, password)}
        onSwitchToSignup={() => setAuthState('signup')}
        isAdminMode={true}
        onBackToLogin={() => setAuthState('login')}
      />
    );
  }

 
  if (authState === 'signup') {
    return (
      <SignupPage
        onSignup={handleSignup}
        onSwitchToLogin={() => setAuthState('login')}
      />
    );
  }

 
  return (
    <LoginPage
      onLogin={handleLogin}
      onSwitchToSignup={() => setAuthState('signup')}
      // onAdminPortal={handleAdminPortal}
    />
  );
}