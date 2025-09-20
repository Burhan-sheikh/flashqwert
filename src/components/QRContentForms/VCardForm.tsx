import React from 'react';
import { VCardContent } from '../../types/qrContentTypes';
import { User, Building, Mail, Phone, Globe, MapPin, FileText, Plus, X, AlertCircle } from 'lucide-react';

interface VCardFormProps {
  content: VCardContent;
  onChange: (content: VCardContent) => void;
  errors?: { [key: string]: string };
}

const VCardForm: React.FC<VCardFormProps> = ({ content, onChange, errors = {} }) => {
  const handleChange = (field: keyof VCardContent, value: string | string[]) => {
    onChange({ ...content, [field]: value });
  };

  const addPhone = () => {
    handleChange('phones', [...content.phones, '']);
  };

  const removePhone = (index: number) => {
    const newPhones = content.phones.filter((_, i) => i !== index);
    handleChange('phones', newPhones.length > 0 ? newPhones : ['']);
  };

  const updatePhone = (index: number, value: string) => {
    const newPhones = [...content.phones];
    newPhones[index] = value;
    handleChange('phones', newPhones);
  };

  const addEmail = () => {
    handleChange('emails', [...content.emails, '']);
  };

  const removeEmail = (index: number) => {
    const newEmails = content.emails.filter((_, i) => i !== index);
    handleChange('emails', newEmails.length > 0 ? newEmails : ['']);
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...content.emails];
    newEmails[index] = value;
    handleChange('emails', newEmails);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <User className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
          <p className="text-sm text-gray-600">Create a digital business card</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={content.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Business Card"
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
            <User className="w-4 h-4 inline mr-1" />
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={content.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="John Doe"
            className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-green-500 transition-colors ${
              errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building className="w-4 h-4 inline mr-1" />
            Organization
          </label>
          <input
            type="text"
            value={content.organization}
            onChange={(e) => handleChange('organization', e.target.value)}
            placeholder="Company Name"
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-green-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Title
          </label>
          <input
            type="text"
            value={content.jobTitle}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            placeholder="Software Engineer"
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-green-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Globe className="w-4 h-4 inline mr-1" />
            Website
          </label>
          <input
            type="url"
            value={content.website}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-green-500 transition-colors"
          />
        </div>

        {/* Phone Numbers */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-1" />
            Phone Numbers
          </label>
          <div className="space-y-2">
            {content.phones.map((phone, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => updatePhone(index, e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="flex-1 rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-green-500 transition-colors"
                />
                {content.phones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePhone(index)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addPhone}
              className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Phone Number
            </button>
          </div>
        </div>

        {/* Email Addresses */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            Email Addresses
          </label>
          <div className="space-y-2">
            {content.emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => updateEmail(index, e.target.value)}
                  placeholder="john@example.com"
                  className="flex-1 rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-green-500 transition-colors"
                />
                {content.emails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmail(index)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addEmail}
              className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Email Address
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Address
          </label>
          <textarea
            value={content.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="123 Main Street, City, State, ZIP"
            rows={2}
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-green-500 transition-colors resize-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Notes
          </label>
          <textarea
            value={content.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Additional information"
            rows={2}
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-green-500 transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default VCardForm;