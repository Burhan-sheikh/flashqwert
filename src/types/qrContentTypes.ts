// QR Content Types and Interfaces
export type QRContentType = 
  | 'url' 
  | 'event' 
  | 'vcard' 
  | 'wifi' 
  | 'text' 
  | 'email' 
  | 'phone' 
  | 'sms' 
  | 'geolocation';

export interface BaseQRContent {
  type: QRContentType;
  title: string;
}

export interface URLContent extends BaseQRContent {
  type: 'url';
  url: string;
}

export interface EventContent extends BaseQRContent {
  type: 'event';
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  reminder: boolean;
}

export interface VCardContent extends BaseQRContent {
  type: 'vcard';
  fullName: string;
  organization: string;
  jobTitle: string;
  phones: string[];
  emails: string[];
  website: string;
  address: string;
  notes: string;
}

export interface WiFiContent extends BaseQRContent {
  type: 'wifi';
  ssid: string;
  password: string;
  encryption: 'WEP' | 'WPA' | 'WPA2' | 'None';
  hidden: boolean;
}

export interface TextContent extends BaseQRContent {
  type: 'text';
  content: string;
}

export interface EmailContent extends BaseQRContent {
  type: 'email';
  email: string;
  subject: string;
  body: string;
}

export interface PhoneContent extends BaseQRContent {
  type: 'phone';
  phoneNumber: string;
}

export interface SMSContent extends BaseQRContent {
  type: 'sms';
  phoneNumber: string;
  message: string;
}

export interface GeolocationContent extends BaseQRContent {
  type: 'geolocation';
  latitude: number;
  longitude: number;
  label: string;
}

export type QRContent = 
  | URLContent 
  | EventContent 
  | VCardContent 
  | WiFiContent 
  | TextContent 
  | EmailContent 
  | PhoneContent 
  | SMSContent 
  | GeolocationContent;

// Enhanced QR Code Data with content types
export interface EnhancedQRCodeData {
  id: string;
  name: string;
  qrType: 'static' | 'dynamic';
  contentType: QRContentType;
  content: QRContent;
  
  // Design options
  foregroundColor: string;
  backgroundColor: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  cornerStyle: 'square' | 'rounded' | 'circle';
  patternStyle: 'square' | 'rounded' | 'circle';
  
  // Branding
  logoDataUrl?: string;
  logoSize: number; // percentage
  
  // Dynamic QR specific
  shortId?: string;
  visits?: number;
  lastVisitedAt?: string;
  
  // Dynamic features
  passwordEnabled?: boolean;
  password?: string;
  scheduleEnabled?: boolean;
  scheduleStart?: string;
  scheduleEnd?: string;
  dailyStartTime?: string;
  dailyEndTime?: string;
  countdownEnabled?: boolean;
  countdownDuration?: number; // seconds
  
  // Metadata
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

// Content type configurations
export const CONTENT_TYPE_CONFIG = {
  url: {
    label: 'Website / URL',
    icon: '🌐',
    description: 'Link to any website or online resource',
    category: 'web'
  },
  event: {
    label: 'Event',
    icon: '📅',
    description: 'Calendar event with date, time, and location',
    category: 'calendar'
  },
  vcard: {
    label: 'Contact Info',
    icon: '👤',
    description: 'Business card with contact details',
    category: 'contact'
  },
  wifi: {
    label: 'Wi-Fi',
    icon: '📶',
    description: 'Wi-Fi network credentials for easy connection',
    category: 'network'
  },
  text: {
    label: 'Text',
    icon: '📝',
    description: 'Plain text message or information',
    category: 'content'
  },
  email: {
    label: 'Email',
    icon: '✉️',
    description: 'Pre-filled email with recipient and subject',
    category: 'contact'
  },
  phone: {
    label: 'Phone',
    icon: '📞',
    description: 'Phone number for direct calling',
    category: 'contact'
  },
  sms: {
    label: 'SMS',
    icon: '💬',
    description: 'Pre-filled text message',
    category: 'contact'
  },
  geolocation: {
    label: 'Location',
    icon: '📍',
    description: 'Geographic coordinates and location info',
    category: 'location'
  }
} as const;

// Helper functions
export const generateQRValue = (content: QRContent): string => {
  switch (content.type) {
    case 'url':
      return content.url;
    
    case 'event':
      // Generate iCalendar format
      const startDateTime = content.allDay 
        ? content.startDate.replace(/-/g, '')
        : `${content.startDate.replace(/-/g, '')}T${content.startTime.replace(/:/g, '')}00`;
      const endDateTime = content.allDay 
        ? content.endDate.replace(/-/g, '')
        : `${content.endDate.replace(/-/g, '')}T${content.endTime.replace(/:/g, '')}00`;
      
      return `BEGIN:VEVENT\nSUMMARY:${content.title}\nDESCRIPTION:${content.description}\nLOCATION:${content.location}\nDTSTART:${startDateTime}\nDTEND:${endDateTime}\nEND:VEVENT`;
    
    case 'vcard':
      // Generate vCard format
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
      return vcard;
    
    case 'wifi':
      // Generate Wi-Fi format
      const security = content.encryption === 'None' ? 'nopass' : content.encryption;
      return `WIFI:T:${security};S:${content.ssid};P:${content.password};H:${content.hidden ? 'true' : 'false'};;`;
    
    case 'text':
      return content.content;
    
    case 'email':
      return `mailto:${content.email}?subject=${encodeURIComponent(content.subject)}&body=${encodeURIComponent(content.body)}`;
    
    case 'phone':
      return `tel:${content.phoneNumber}`;
    
    case 'sms':
      return `sms:${content.phoneNumber}?body=${encodeURIComponent(content.message)}`;
    
    case 'geolocation':
      return `geo:${content.latitude},${content.longitude}?q=${content.latitude},${content.longitude}(${encodeURIComponent(content.label)})`;
    
    default:
      return '';
  }
};

export const createEmptyContent = (type: QRContentType): QRContent => {
  const base = { type, title: '' };
  
  switch (type) {
    case 'url':
      return { ...base, type: 'url', url: '' };
    case 'event':
      return { 
        ...base, 
        type: 'event', 
        description: '', 
        location: '', 
        startDate: '', 
        startTime: '', 
        endDate: '', 
        endTime: '', 
        allDay: false, 
        reminder: false 
      };
    case 'vcard':
      return { 
        ...base, 
        type: 'vcard', 
        fullName: '', 
        organization: '', 
        jobTitle: '', 
        phones: [''], 
        emails: [''], 
        website: '', 
        address: '', 
        notes: '' 
      };
    case 'wifi':
      return { 
        ...base, 
        type: 'wifi', 
        ssid: '', 
        password: '', 
        encryption: 'WPA2', 
        hidden: false 
      };
    case 'text':
      return { ...base, type: 'text', content: '' };
    case 'email':
      return { ...base, type: 'email', email: '', subject: '', body: '' };
    case 'phone':
      return { ...base, type: 'phone', phoneNumber: '' };
    case 'sms':
      return { ...base, type: 'sms', phoneNumber: '', message: '' };
    case 'geolocation':
      return { ...base, type: 'geolocation', latitude: 0, longitude: 0, label: '' };
    default:
      return { ...base, type: 'url', url: '' } as URLContent;
  }
};