import React from 'react';
import { SMSContent } from '../../types/qrContentTypes';
import { MessageSquare, AlertCircle } from 'lucide-react';

interface SMSFormProps {
  content: SMSContent;
  onChange: (content: SMSContent) => void;
  errors?: { [key: string]: string };
}

const SMSForm: React.FC<SMSFormProps> = ({ content, onChange, errors = {} }) => {
  const handleChange = (field: keyof SMSContent, value: string) => {
    onChange({ ...content, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">SMS Message</h3>
          <p className="text-sm text-gray-600">Create a pre-filled text message</p>
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
            placeholder="Send SMS"
            className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-purple-500 transition-colors ${
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
            className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-purple-500 transition-colors ${
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={content.message}
            onChange={(e) => handleChange('message', e.target.value)}
            placeholder="Hello! I'm interested in..."
            rows={4}
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-purple-500 transition-colors resize-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            {content.message.length} characters
          </p>
        </div>
      </div>
    </div>
  );
};

export default SMSForm;