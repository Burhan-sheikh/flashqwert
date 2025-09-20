import React from 'react';
import { VCardContent } from '../../types/qrContentTypes';
import { User, Building, Mail, Phone, Globe, MapPin, Download } from 'lucide-react';

interface VCardRedirectProps {
  content: VCardContent;
  qrData: any;
  onContinue: () => void;
}

const VCardRedirect: React.FC<VCardRedirectProps> = ({ content, qrData, onContinue }) => {
  const generateVCardFile = () => {
    let vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${content.fullName}\n`;
    if (content.organization) vcard += `ORG:${content.organization}\n`;
    if (content.jobTitle) vcard += `TITLE:${content.jobTitle}\n`;
    content.phones.forEach(phone => {
      if (phone) vcard += `TEL:${phone}\n`;
    });
    content.emails.forEach(email => {
      if (email) vcard += `EMAIL:${email}\n`;
    });
    if (content.website) vcard += `URL:${content.website}\n`;
    if (content.address) vcard += `ADR:${content.address}\n`;
    if (content.notes) vcard += `NOTE:${content.notes}\n`;
    vcard += 'END:VCARD';

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${content.fullName.replace(/\s+/g, '_')}.vcf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <User className="w-10 h-10 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{content.title}</h2>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 space-y-4 text-left max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-gray-900">{content.fullName}</p>
            {content.jobTitle && <p className="text-sm text-gray-600">{content.jobTitle}</p>}
          </div>
        </div>

        {content.organization && (
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-green-600" />
            <p className="text-gray-700">{content.organization}</p>
          </div>
        )}

        {content.phones.filter(p => p).map((phone, index) => (
          <div key={index} className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-green-600" />
            <a href={`tel:${phone}`} className="text-blue-600 hover:underline">{phone}</a>
          </div>
        ))}

        {content.emails.filter(e => e).map((email, index) => (
          <div key={index} className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-green-600" />
            <a href={`mailto:${email}`} className="text-blue-600 hover:underline">{email}</a>
          </div>
        ))}

        {content.website && (
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-green-600" />
            <a href={content.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {content.website}
            </a>
          </div>
        )}

        {content.address && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
            <p className="text-gray-700">{content.address}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={generateVCardFile}
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Download className="w-5 h-5" />
          Save Contact
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

export default VCardRedirect;