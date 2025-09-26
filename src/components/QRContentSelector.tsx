import React from 'react';
import { motion } from 'framer-motion';
import { QRContentType, CONTENT_TYPE_CONFIG } from '../types/qrContentTypes';
import { CircleAlert as AlertCircle, Grid3X3, Layers3 } from 'lucide-react';

interface QRContentSelectorProps {
  selectedType: QRContentType;
  onTypeChange: (type: QRContentType) => void;
  className?: string;
  qrType?: 'static' | 'dynamic';
}

const QRContentSelector: React.FC<QRContentSelectorProps> = ({
  selectedType,
  onTypeChange,
  className = '',
  qrType = 'dynamic'
}) => {
  // Filter content types based on QR type
  const getAvailableTypes = () => {
    if (qrType === 'static') {
      return { web: ['url'] };
    }
    
    return {
      web: ['url'],
      content: ['text'],
      contact: ['vcard', 'email', 'phone', 'sms'],
      network: ['wifi'],
      calendar: ['event'],
      location: ['geolocation']
    };
  };

  const categories = getAvailableTypes();

  const categoryLabels = {
    web: 'Web & Links',
    content: 'Content & Text',
    contact: 'Contact & Communication',
    network: 'Network & Connectivity',
    calendar: 'Calendar & Events',
    location: 'Location & Maps'
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Grid3X3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Content Types</h2>
            <p className="text-sm text-gray-600">Choose what your QR code will contain</p>
          </div>
        </div>
        
        {qrType === 'static' && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">Static QR Code Mode</p>
              <p className="text-sm text-amber-700">Only URL/Website content type is available for static QR codes</p>
            </div>
          </div>
        )}
      </div>

      {/* Content Types Grid */}
      <div className="space-y-8">
        {Object.entries(categories).map(([category, types]) => (
          <div key={category} className="space-y-4">
            {/* Category Header */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Layers3 className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
                <p className="text-sm text-gray-500">{types.length} type{types.length > 1 ? 's' : ''} available</p>
              </div>
            </div>
            
            {/* Content Type Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {types.map((type) => {
                const config = CONTENT_TYPE_CONFIG[type as QRContentType];
                const isSelected = selectedType === type;
                
                return (
                  <motion.button
                    key={type}
                    onClick={() => onTypeChange(type as QRContentType)}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Background Pattern */}
                    <div className={`absolute inset-0 opacity-5 ${
                      isSelected ? 'bg-blue-500' : 'bg-gray-400 group-hover:bg-blue-500'
                    }`}>
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                        backgroundSize: '20px 20px'
                      }} />
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 transition-colors ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }`}>
                        <span className="text-2xl">{config.icon}</span>
                      </div>
                      
                      {/* Title */}
                      <h4 className={`font-bold text-lg mb-2 transition-colors ${
                        isSelected ? 'text-blue-900' : 'text-gray-900 group-hover:text-blue-900'
                      }`}>
                        {config.label}
                      </h4>
                      
                      {/* Description */}
                      <p className={`text-sm leading-relaxed transition-colors ${
                        isSelected ? 'text-blue-700' : 'text-gray-600 group-hover:text-blue-700'
                      }`}>
                        {config.description}
                      </p>
                      
                      {/* Features Badge */}
                      <div className="mt-4 pt-3 border-t border-gray-200/50">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                        }`}>
                          Professional Tool
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Layers3 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Professional Features</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Each content type is optimized for professional use with advanced customization options, 
              security features, and seamless integration capabilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRContentSelector;