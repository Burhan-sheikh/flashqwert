import { QRCodeData } from '../types/qrcode';
import { EnhancedQRCodeData, generateQRValue as generateEnhancedQRValue } from '../types/qrContentTypes';

export const generateQRValue = (qrData: QRCodeData): string => {
    if (qrData.type === 'static') {
        return (qrData as any).url || '';
    } else if (qrData.type === 'dynamic') {
        const dynamicQR = qrData as any;
        return `${window.location.origin}/r/${dynamicQR.shortId}`;
    }
    return '';
};

export const generateEnhancedQRValue = (qrData: EnhancedQRCodeData): string => {
    if (qrData.qrType === 'static') {
        return generateEnhancedQRValue(qrData.content);
    } else {
        return `${window.location.origin}/e/${qrData.shortId}`;
    }
};