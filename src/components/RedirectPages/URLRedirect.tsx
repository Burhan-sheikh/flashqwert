import React, { useEffect } from 'react';
import { URLContent } from '../../types/qrContentTypes';
import { ExternalLink, Globe } from 'lucide-react';

interface URLRedirectProps {
  content: URLContent;
  qrData: any;
  onContinue: () => void;
}

const URLRedirect: React.FC<URLRedirectProps> = ({ content, qrData, onContinue }) => {
  useEffect(() => {
    // Auto-redirect for URL type if no countdown
    if (!qrData.countdownEnabled) {
      onContinue();
    }
  }, [qrData.countdownEnabled, onContinue]);

  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Globe className="w-10 h-10 text-blue-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{content.title}</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-700 mb-2">You will be redirected to:</p>
        <p className="font-mono text-blue-800 break-all">{content.url}</p>
      </div>

      <button
        onClick={onContinue}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        <ExternalLink className="w-5 h-5" />
        Continue to Website
      </button>
    </div>
  );
};

export default URLRedirect;