import React from 'react';
import { WiFiContent } from '../../types/qrContentTypes';
import { Wifi, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface WiFiFormProps {
  content: WiFiContent;
  onChange: (content: WiFiContent) => void;
  errors?: { [key: string]: string };
}

const WiFiForm: React.FC<WiFiFormProps> = ({ content, onChange, errors = {} }) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleChange = (field: keyof WiFiContent, value: string | boolean) => {
    onChange({ ...content, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Wifi className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Wi-Fi Network</h3>
          <p className="text-sm text-gray-600">Share Wi-Fi credentials for easy connection</p>
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
            placeholder="Office Wi-Fi"
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
            Network Name (SSID) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={content.ssid}
            onChange={(e) => handleChange('ssid', e.target.value)}
            placeholder="MyWiFiNetwork"
            className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 transition-colors ${
              errors.ssid ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
          {errors.ssid && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.ssid}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Security Type
          </label>
          <select
            value={content.encryption}
            onChange={(e) => handleChange('encryption', e.target.value as WiFiContent['encryption'])}
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="WPA2">WPA2 (Recommended)</option>
            <option value="WPA">WPA</option>
            <option value="WEP">WEP (Legacy)</option>
            <option value="None">None (Open Network)</option>
          </select>
        </div>

        {content.encryption !== 'None' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              Password {content.encryption !== 'None' && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={content.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Network password"
                className={`w-full rounded-lg border p-3 pr-12 focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                required={content.encryption !== 'None'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.password}
              </p>
            )}
          </div>
        )}

        <div className="md:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={content.hidden}
              onChange={(e) => handleChange('hidden', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Hidden Network</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Check this if the network doesn't broadcast its name
          </p>
        </div>
      </div>
    </div>
  );
};

export default WiFiForm;