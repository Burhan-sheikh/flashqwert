import React from 'react';
import { PhoneContent } from '../../types/qrContentTypes';
import { Phone, AlertCircle } from 'lucide-react';

interface PhoneFormProps {
  content: PhoneContent;
  onChange: (content: PhoneContent) => void;
  errors?: { [key: string]: string };
}

const PhoneForm: React.FC<PhoneFormProps> = ({ content, onChange, errors = {} }) => {
  const handleChange = (field: keyof PhoneContent, value: string) => {
    onChange({ ...content, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Phone className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Phone Number</h3>
          <p className="text-sm text-gray-600">Create a QR code for direct calling</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={content.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Call Support"
            className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-green-500 transition-colors ${
              errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={content.phoneNumber}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-green-500 transition-colors ${
              errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
          {errors.phoneNumber && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.phoneNumber}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Include country code for international numbers (e.g., +1 for US)
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhoneForm;