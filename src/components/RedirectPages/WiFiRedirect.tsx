import React, { useState } from 'react';
import { WiFiContent } from '../../types/qrContentTypes';
import { Wifi, Lock, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react';

interface WiFiRedirectProps {
  content: WiFiContent;
  qrData: any;
  onContinue: () => void;
}

const WiFiRedirect: React.FC<WiFiRedirectProps> = ({ content, qrData, onContinue }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getSecurityIcon = () => {
    switch (content.encryption) {
      case 'WPA2':
      case 'WPA':
        return <Lock className="w-5 h-5 text-green-600" />;
      case 'WEP':
        return <Lock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Wifi className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSecurityColor = () => {
    switch (content.encryption) {
      case 'WPA2':
      case 'WPA':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'WEP':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Wifi className="w-10 h-10 text-blue-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.title}</h2>
      <p className="text-gray-600 mb-6">Wi-Fi Network Credentials</p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 space-y-4 max-w-md mx-auto">
        {/* Network Name */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
          <div className="flex items-center gap-3">
            <Wifi className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-700">Network Name</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-900">{content.ssid}</span>
            <button
              onClick={() => copyToClipboard(content.ssid, 'ssid')}
              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
            >
              {copied === 'ssid' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Security Type */}
        <div className={`flex items-center justify-between p-3 rounded-lg border ${getSecurityColor()}`}>
          <div className="flex items-center gap-3">
            {getSecurityIcon()}
            <span className="font-medium">Security</span>
          </div>
          <span className="font-medium">{content.encryption}</span>
        </div>

        {/* Password */}
        {content.encryption !== 'None' && (
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Password</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-900">
                {showPassword ? content.password : '•'.repeat(content.password.length)}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => copyToClipboard(content.password, 'password')}
                className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
              >
                {copied === 'password' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {content.hidden && (
          <div className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-2">
            This is a hidden network - you may need to manually add it in your Wi-Fi settings
          </div>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Use the credentials above to connect to the Wi-Fi network
        </p>
        
        <button
          onClick={onContinue}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default WiFiRedirect;