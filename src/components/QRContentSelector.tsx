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
  const getAvailableTypes = () => {
    if (qrType === 'static') return { web: ['url'] };

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
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Grid3X3 className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Content Types</h2>
            <p className="text-xs text-gray-500">Choose what your QR will contain</p>
          </div>
        </div>

        {qrType === 'static' && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4.5 h-4.5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-800">Static QR Code Mode</p>
              <p className="text-xs text-amber-700">Only URL is available for static QR codes</p>
            </div>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {Object.entries(categories).map(([category, types]) => (
          <div key={category} className="space-y-3">
            {/* Category Title */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center">
                <Layers3 className="w-3.5 h-3.5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
                <p className="text-xs text-gray-500">
                  {types.length} type{types.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {types.map((type) => {
                const config = CONTENT_TYPE_CONFIG[type as QRContentType];
                const isSelected = selectedType === type;

                return (
                  <motion.button
                    key={type}
                    onClick={() => onTypeChange(type as QRContentType)}
                    whileHover={{ y: -1, scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    className={`group relative p-4 rounded-xl border transition-all text-left overflow-hidden
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                      }`}
                  >
                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    {/* Content */}
                    <div className="relative z-10">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3
                        ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'}
                      `}>
                        <span className="text-lg">{config.icon}</span>
                      </div>
                      <h4 className={`font-semibold text-sm mb-1 ${isSelected ? 'text-blue-900' : 'text-gray-900 group-hover:text-blue-900'}`}>
                        {config.label}
                      </h4>
                      <p className={`text-xs leading-relaxed ${isSelected ? 'text-blue-700' : 'text-gray-600 group-hover:text-blue-700'}`}>
                        {config.description}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center">
            <Layers3 className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-0.5">Professional Features</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Each content type is optimized for advanced customization, security, and smooth integrations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRContentSelector;
