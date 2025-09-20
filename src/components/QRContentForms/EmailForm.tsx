import React from 'react';
import { EmailContent } from '../../types/qrContentTypes';
import { Mail, AlertCircle } from 'lucide-react';

interface EmailFormProps {
  content: EmailContent;
  onChange: (content: EmailContent) => void;
  errors?: { [key: string]: string };
}

const EmailForm: React.FC<EmailFormProps> = ({ content, onChange, errors = {} }) => {
  const handleChange = (field: keyof EmailContent, value: string) => {
    onChange({ ...content, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Mail className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Email Message</h3>
          <p className="text-sm text-gray-600">Create a pre-filled email</p>
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
            placeholder="Contact Us"
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
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={content.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="contact@example.com"
            className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 transition-colors ${
              errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <input
            type="text"
            value={content.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            placeholder="Inquiry about your services"
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Body
          </label>
          <textarea
            value={content.body}
            onChange={(e) => handleChange('body', e.target.value)}
            placeholder="Hello, I would like to..."
            rows={4}
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default EmailForm;