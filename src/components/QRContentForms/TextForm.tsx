import React from 'react';
import { TextContent } from '../../types/qrContentTypes';
import { FileText, AlertCircle } from 'lucide-react';

interface TextFormProps {
  content: TextContent;
  onChange: (content: TextContent) => void;
  errors?: { [key: string]: string };
}

const TextForm: React.FC<TextFormProps> = ({ content, onChange, errors = {} }) => {
  const handleChange = (field: keyof TextContent, value: string) => {
    onChange({ ...content, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Plain Text</h3>
          <p className="text-sm text-gray-600">Share any text message or information</p>
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
            placeholder="My Text Message"
            className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-gray-500 transition-colors ${
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
            Text Content <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content.content}
            onChange={(e) => handleChange('content', e.target.value)}
            placeholder="Enter your text message here..."
            rows={6}
            className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-gray-500 transition-colors resize-none ${
              errors.content ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.content}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {content.content.length} characters
          </p>
        </div>
      </div>
    </div>
  );
};

export default TextForm;