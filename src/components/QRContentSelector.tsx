import React from 'react';
import { motion } from 'framer-motion';
import { QRContentType, CONTENT_TYPE_CONFIG } from '../types/qrContentTypes';

interface QRContentSelectorProps {
  selectedType: QRContentType;
  onTypeChange: (type: QRContentType) => void;
  className?: string;
}

const QRContentSelector: React.FC<QRContentSelectorProps> = ({
  selectedType,
  onTypeChange,
  className = ''
}) => {
  const categories = {
    web: ['url'],
    contact: ['vcard', 'email', 'phone', 'sms'],
    calendar: ['event'],
    network: ['wifi'],
    content: ['text'],
    location: ['geolocation']
  };

  const categoryLabels = {
    web: 'Web & Links',
    contact: 'Contact & Communication',
    calendar: 'Calendar & Events',
    network: 'Network & Connectivity',
    content: 'Content & Text',
    location: 'Location & Maps'
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Content Type</h3>
        <p className="text-sm text-gray-600">Select what type of information your QR code will contain</p>
      </div>

      {Object.entries(categories).map(([category, types]) => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
            {categoryLabels[category as keyof typeof categoryLabels]}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {types.map((type) => {
              const config = CONTENT_TYPE_CONFIG[type as QRContentType];
              const isSelected = selectedType === type;
              
              return (
                <motion.button
                  key={type}
                  onClick={() => onTypeChange(type as QRContentType)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{config.icon}</span>
                    <span className={`font-medium ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {config.label}
                    </span>
                  </div>
                  <p className={`text-xs ${
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