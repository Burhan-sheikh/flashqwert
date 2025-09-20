import React from 'react';
import { QRContent, QRContentType } from '../../types/qrContentTypes';
import URLRedirect from './URLRedirect';
import EventRedirect from './EventRedirect';
import VCardRedirect from './VCardRedirect';
import WiFiRedirect from './WiFiRedirect';
import TextRedirect from './TextRedirect';

interface RedirectPageProps {
  contentType: QRContentType;
  content: QRContent;
  qrData: any;
  onContinue: () => void;
}

const RedirectPage: React.FC<RedirectPageProps> = ({
  contentType,
  content,
  qrData,
  onContinue
}) => {
  switch (contentType) {
    case 'url':
      return (
        <URLRedirect
          content={content as any}
          qrData={qrData}
          onContinue={onContinue}
        />
      );
    case 'event':
      return (
        <EventRedirect
          content={content as any}
          qrData={qrData}
          onContinue={onContinue}
        />
      );
    case 'vcard':
      return (
        <VCardRedirect
          content={content as any}
          qrData={qrData}
          onContinue={onContinue}
        />
      );
    case 'wifi':
      return (
        <WiFiRedirect
          content={content as any}
          qrData={qrData}
          onContinue={onContinue}
        />
      );
    case 'text':
      return (
        <TextRedirect
          content={content as any}
          qrData={qrData}
          onContinue={onContinue}
        />
      );
    case 'email':
      // For email, phone, SMS, geolocation - direct action
      if (content.type === 'email') {
        const emailContent = content as any;
        window.location.href = `mailto:${emailContent.email}?subject=${encodeURIComponent(emailContent.subject)}&body=${encodeURIComponent(emailContent.body)}`;
      }
      return null;
    case 'phone':
      if (content.type === 'phone') {
        const phoneContent = content as any;
        window.location.href = `tel:${phoneContent.phoneNumber}`;
      }
      return null;
    case 'sms':
      if (content.type === 'sms') {
        const smsContent = content as any;
        window.location.href = `sms:${smsContent.phoneNumber}?body=${encodeURIComponent(smsContent.message)}`;
      }
      return null;
    case 'geolocation':
      if (content.type === 'geolocation') {
        const geoContent = content as any;
        window.location.href = `geo:${geoContent.latitude},${geoContent.longitude}?q=${geoContent.latitude},${geoContent.longitude}(${encodeURIComponent(geoContent.label)})`;
      }
      return null;
    default:
      return <div>Unsupported content type</div>;
  }
};

export default RedirectPage;