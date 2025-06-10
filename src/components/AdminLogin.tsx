import React, { useState } from 'react';
import { Shield, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { validateEmail, validateRequired } from '../utils/validation';

interface FormErrors {
  email: string;
  password: string;
}

export function AdminLogin() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({ email: '', password: '' });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const validateField = (name: string, value: string) => {
    let validation;
    
    switch (name) {
      case 'email':
        validation = validateEmail(value);
        break;
      case 'password':
        validation = validateRequired(value, 'Password');
        break;
      default:
        validation = { isValid: true, message: '' };
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: validation.message
    }));
    
    return validation.isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateForm = () => {
    const emailValid = validateField('email', credentials.email);
    const passwordValid = validateField('password', credentials.password);
    return emailValid && passwordValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({ email: true, password: true });
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError('');

    const { error: signInError } = await signIn(credentials.email, credentials.password);
    
    if (signInError) {
      setError('Invalid credentials. Please try again.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 dark:from-yellow-400 dark:to-orange-500 rounded-2xl mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent mb-4">
            Admin Access
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Sign in to manage beta testers and send them invites</p>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-yellow-100 dark:border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={credentials.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                  errors.email && touched.email
                    ? 'border-red-300 dark:border-red-600 focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                    : 'border-gray-200 dark:border-gray-600 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 dark:focus:ring-yellow-900/30'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                placeholder="Enter your email"
              />
              {errors.email && touched.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                  errors.password && touched.password
                    ? 'border-red-300 dark:border-red-600 focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                    : 'border-gray-200 dark:border-gray-600 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 dark:focus:ring-yellow-900/30'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                placeholder="Enter your password"
              />
              {errors.password && touched.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="transition-all w-full bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-500 dark:to-orange-500 text-white font-semibold py-4 px-6 rounded-lg hover:from-yellow-700 hover:to-orange-700 dark:hover:from-yellow-600 dark:hover:to-orange-600 focus:ring-4 focus:ring-yellow-200 dark:focus:ring-yellow-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}