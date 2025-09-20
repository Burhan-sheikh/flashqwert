import React from 'react';
import { QRContent, QRContentType } from '../../types/qrContentTypes';
import URLForm from './URLForm';
import EventForm from './EventForm';
import VCardForm from './VCardForm';
import WiFiForm from './WiFiForm';
import TextForm from './TextForm';
import EmailForm from './EmailForm';
import PhoneForm from './PhoneForm';
import SMSForm from './SMSForm';
import GeolocationForm from './GeolocationForm';

interface QRContentFormProps {
  contentType: QRContentType;
  content: QRContent;
  onChange: (content: QRContent) => void;
  errors?: { [key: string]: string };
}

const QRContentForm: React.FC<QRContentFormProps> = ({
  contentType,
  content,
  onChange,
  errors = {}
}) => {
  switch (contentType) {
    case 'url':
      return (
        <URLForm
          content={content as any}
          onChange={onChange as any}
          errors={errors}
        />
      );
    case 'event':
      return (
        <EventForm
          content={content as any}
          onChange={onChange as any}
          errors={errors}
        />
      );
    case 'vcard':
      return (
        <VCardForm
          content={content as any}
          onChange={onChange as any}
          errors={errors}
        />
      );
    case 'wifi':
      return (
        <WiFiForm
          content={content as any}
          onChange={onChange as any}
          errors={errors}
        />
      );
    case 'text':
      return (
        <TextForm
          content={content as any}
          onChange={onChange as any}
          errors={errors}
        />
      );
    case 'email':
      return (
        <EmailForm
          content={content as any}
          onChange={onChange as any}
          errors={errors}
        />
      );
    case 'phone':
      return (
        <PhoneForm
          content={content as any}
          onChange={onChange as any}
          errors={errors}
        />
      );
    case 'sms':
      return (
        <SMSForm
          content={content as any}
          onChange={onChange as any}
          errors={errors}
        />
      );
    case 'geolocation':
      return (
        <GeolocationForm
          content={content as any}
          onChange={onChange as any}
          errors={errors}
        />
      );
    default:
      return <div>Unsupported content type</div>;
  }
};

export default QRContentForm;