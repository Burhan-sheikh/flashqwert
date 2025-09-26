 // DualHeader.tsx
 import React from 'react';
 import { Link, useLocation } from 'react-router-dom';
 import { QrCode, Layers } from 'lucide-react';
 import HeroSection from './HeroSection';
 import { useAuth } from '../context/AuthContext';

 interface DualHeaderProps {
  children: React.ReactNode;
 }

 const DualHeader: React.FC<DualHeaderProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Hide dual header on login and signup pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
  return null;
  }

  const isGeneratePage = location.pathname === '/generate';
  const isGeneratorPage = location.pathname === '/generator' || 
                          location.pathname === '/static-code' || 
                          location.pathname === '/dynamic-code' || 
                          location.pathname === '/generate' || 
                          location.pathname === '/bulk-generator';
  const isHomePage = location.pathname === '/';
  const shouldShowHero = isHomePage && !user;

  return (
  <div>
  

  <div className="bg-white border-b border-gray-200 shadow-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <div className="flex h-12">
  <Link
  to="/generator"
  className={`flex-1 flex items-center justify-center text-sm font-medium transition-all duration-200 ${isGeneratorPage
  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-b-2 border-blue-600'
  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
  }`}
  >
  <QrCode className="w-4 h-4 mr-2" />
  QR Generator
  </Link>
  </div>
  </div>
  </div>
  {children}  {/* Render the content passed as children */}
   {shouldShowHero && <HeroSection />}
  </div>
  );
 };

 export default DualHeader;
