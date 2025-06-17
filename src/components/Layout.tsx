import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Smartphone, Users, Settings, LogOut, Sun, Moon, MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const isAdmin = user && location.pathname.startsWith('/admin');

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-gray-200 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-yellow-900 transition-colors duration-300">
      {isAdmin && (
        <nav className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border-b border-yellow-100 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link to="/\" className="flex items-center space-x-2">
                  <Smartphone className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">
                    MCCI Testers
                  </span>
                </Link>
                <div className="hidden md:flex space-x-6">
                  <Link
                    to="/admin"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                      location.pathname === '/admin'
                        ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                        : 'text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>Testers</span>
                  </Link>
                  <Link
                    to="/admin/invitations"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                      location.pathname === '/admin/invitations'
                        ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                        : 'text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Invitations</span>
                  </Link>
                  <Link
                    to="/admin/feedback"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                      location.pathname === '/admin/feedback'
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Feedback</span>
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-md transition-all"
                  aria-label="Toggle theme"
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
      
      {!isAdmin && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleTheme}
            className="p-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border border-yellow-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-full transition-all shadow-lg"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      )}
      
      <main className={isAdmin ? 'pt-0' : ''}>{children}</main>
    </div>
  );
}