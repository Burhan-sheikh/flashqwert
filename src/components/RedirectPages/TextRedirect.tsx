import React from 'react';
import { TextContent } from '../../types/qrContentTypes';
import { FileText, Copy, CheckCircle } from 'lucide-react';

interface TextRedirectProps {
  content: TextContent;
  qrData: any;
  onContinue: () => void;
}

const TextRedirect: React.FC<TextRedirectProps> = ({ content, qrData, onContinue }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <FileText className="w-10 h-10 text-gray-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{content.title}</h2>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 max-w-2xl mx-auto">
        <div className="text-left">
          <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed font-sans">
            {content.content}
          </pre>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={copyToClipboard}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? 'Copied!' : 'Copy Text'}
        </button>
        
        <button
          onClick={onContinue}
          className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default TextRedirect;