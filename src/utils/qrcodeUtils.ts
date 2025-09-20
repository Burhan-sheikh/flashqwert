import { QRCodeData } from '../types/qrcode';

export const generateQRValue = (qrData: QRCodeData): string => {
    if (qrData.type === 'static') {
        return (qrData as any).url || '';
    } else if (qrData.type === 'dynamic') {
        const dynamicQR = qrData as any;
        return `${window.location.origin}/r/${dynamicQR.shortId}`;
    }
    return '';
};