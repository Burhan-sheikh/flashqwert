import React from 'react';
import { URLContent } from '../../types/qrContentTypes';
import { Globe, AlertCircle } from 'lucide-react';

interface URLFormProps {
  content: URLContent;
  onChange: (content: URLContent) => void;
  errors?: { [key: string]: string };
}

const URLForm: React.FC<URLFormProps> = ({ content, onChange, errors = {} }) => {
  const handleChange = (field: keyof URLContent, value: string) => {
    onChange({ ...content, [field]: value });
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Globe className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Website / URL</h3>
          <p className="text-sm text-gray-600">Create a QR code that links to any website</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={content.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="My Website"
            className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 transition-colors ${
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
            URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={content.url}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://example.com"
            className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 transition-colors ${
              errors.url ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.url}
            </p>
          )}
          {content.url && !isValidUrl(content.url) && (
            <p className="mt-1 text-sm text-orange-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Please enter a valid URL starting with http:// or https://
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default URLForm;