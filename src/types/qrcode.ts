// src/types/qrcode.ts
export type QRCodeType = 'static' | 'dynamic';

export interface BaseQRCodeData {
  id: string;
  name: string;
  type: QRCodeType; // static | dynamic
  color: string;
  backgroundColor: string;
  size: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  includeMargin: boolean;
  containerBackgroundColor: string;
  logoDataUrl?: string;
  userId: string;
  createdAt: string;
  order?: number;
}

// Static QR → simple direct URL
export interface StaticQRCodeData extends BaseQRCodeData {
  type: 'static';
  url: string;
}

// Dynamic QR → redirect + analytics
export interface DynamicQRCodeData extends BaseQRCodeData {
  type: 'dynamic';
  targetUrl: string;
  shortId: string; // generated short identifier for redirect
  tags?: string[];
  description?: string;
  featuredImageUrl?: string;
  visits?: number;
  lastVisitedAt?: string;
  // Advanced features
  scheduleEnabled?: boolean;
  scheduleStart?: string; // ISO date string
  scheduleEnd?: string; // ISO date string
  dailyStartTime?: string; // HH:MM format
  dailyEndTime?: string; // HH:MM format
  scanLimitEnabled?: boolean;
  maxScans?: number;
  passwordEnabled?: boolean;
  password?: string;
  redirectPageEnabled?: boolean; // Auto-enabled for password/schedule/limits
}

// Union type
export type QRCodeData = StaticQRCodeData | DynamicQRCodeData;

// Type guards
export const isStaticQR = (qr: QRCodeData): qr is StaticQRCodeData => {
  return qr.type === 'static';
};

export const isDynamicQR = (qr: QRCodeData): qr is DynamicQRCodeData => {
  return qr.type === 'dynamic';
};

// Helper to get the actual URL for QR generation
export const getQRValue = (qr: QRCodeData): string => {
  if (isStaticQR(qr)) {
    return qr.url;
  } else {
    // For dynamic QRs, return the redirect URL using shortId as the path
    return `${window.location.origin}/r/${qr.shortId}`;
  }
};
