import React from 'react';
import { motion } from 'framer-motion';
import { QRContentType, CONTENT_TYPE_CONFIG } from '../types/qrContentTypes';
import { AlertCircle } from 'lucide-react';

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
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-3">Choose Content Type</h3>
        <p className="text-gray-600">Select what type of information your QR code will contain</p>
        
        {qrType === 'static' && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-center gap-2 text-blue-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Static QR codes only support URL/Website content</span>
            </div>
          </div>
        )}
      </div>

      {Object.entries(categories).map(([category, types]) => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">
            {categoryLabels[category as keyof typeof categoryLabels]}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {types.map((type) => {
              const config = CONTENT_TYPE_CONFIG[type as QRContentType];
              const isSelected = selectedType === type;
              
              return (
                <motion.button
                  key={type}
                  onClick={() => onTypeChange(type as QRContentType)}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left shadow-sm hover:shadow-lg ${
                    isSelected
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{config.icon}</span>
                    <span className={`font-medium ${
                      isSelected ? 'text-blue-900 text-lg' : 'text-gray-900 text-lg'
                    }`}>
                      {config.label}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${
                    isSelected ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {config.description}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QRContentSelector;