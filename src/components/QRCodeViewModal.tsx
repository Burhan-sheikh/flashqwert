import React, { useState, useCallback, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { getQRValue } from '../types/qrcode';

interface QRCodeViewModalProps {
    qrCodeData: {
        url?: string;
        targetUrl?: string;
        type?: 'static' | 'dynamic';
        shortId?: string;
        visits?: number;
        tags?: string[];
        hint?: string;
        description?: string;
        name: string;
        createdAt: string;
        errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
        backgroundColor: string;
        color: string;
        logoDataUrl: string | null;
        containerBackgroundColor: string;
    } | null;
    onClose: () => void;
    loading: boolean;
    error: string | null;
}

const QRCodeViewModal: React.FC<QRCodeViewModalProps> = ({ qrCodeData, onClose, loading, error }) => {
    const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const generateQRCodeCanvas = useCallback(async (qrCodeData: any, width: number, height: number) => {
        const side = Math.min(width, height);
        const canvas = document.createElement('canvas');
        canvas.width = side;
        canvas.height = side;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error("Could not create image. Please try again.");
        }

        const padding = Math.max(5, side * 0.02);

        ctx.fillStyle = qrCodeData.containerBackgroundColor || '#FFFFFF';
        ctx.fillRect(0, 0, side, side);

        const qrCodeSize = side - 2 * padding;
        const qrCanvas = document.createElement('canvas');
        qrCanvas.width = qrCodeSize;
        qrCanvas.height = qrCodeSize;

        const qrValue = getQRValue(qrCodeData);
        if (!qrValue) {
            throw new Error("No URL available for QR generation");
        }

        try {
            await QRCode.toCanvas(qrCanvas, qrValue, {
                errorCorrectionLevel: qrCodeData.errorCorrectionLevel,
                width: qrCodeSize,
                height: qrCodeSize,
                margin: 0,
                color: {
                    dark: qrCodeData.color,
                    light: qrCodeData.backgroundColor || '#FFFFFF'
                }
            });
        } catch (err) {
            console.error("QR Code generation error:", err);
            throw new Error("Failed to generate QR Code.");
        }

        const x = (side - qrCodeSize) / 2;
        const y = (side - qrCodeSize) / 2;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(qrCanvas, x, y, qrCodeSize, qrCodeSize);

        if (qrCodeData.logoDataUrl) {
            const logo = new Image();
            logo.crossOrigin = "anonymous";

            await new Promise<void>((resolve, reject) => {
                logo.onload = () => {
                    const logoSize = qrCodeSize * 0.2;
                    const logoX = (side - logoSize) / 2;
                    const logoY = (side - logoSize) / 2;

                    const logoPadding = logoSize * 0.1;
                    const circleRadius = logoSize / 2;

                    ctx.beginPath();
                    ctx.arc(logoX + circleRadius, logoY + circleRadius, circleRadius + logoPadding, 0, 2 * Math.PI);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(logoX + circleRadius, logoY + circleRadius, circleRadius, 0, 2 * Math.PI);
                    ctx.closePath();
                    ctx.clip();

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

                    resolve();
                };
                logo.onerror = (err) => {
                    console.error("Logo load error:", err);
                    reject(err);
                };
                logo.src = qrCodeData.logoDataUrl;
            });
        }

        return canvas.toDataURL('image/png');
    }, []);

    useEffect(() => {
        if (qrCodeData) {
            const generateQrCode = async () => {
                try {
                    const image = await generateQRCodeCanvas(qrCodeData, 256, 256);
                    setQrCodeImage(image);
                } catch (error) {
                    console.error("Error generating QR code:", error);
                }
            };
            generateQrCode();
        }
    }, [qrCodeData, generateQRCodeCanvas]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    if (!qrCodeData) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 pt-[80px]" onClick={onClose}>
            <div ref={modalRef} className="relative rounded-3xl shadow-2xl w-full max-w-[calc(85%)] max-h-[calc(75vh)] flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-white border border-gray-200" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none rounded-full p-2 transition-colors duration-200 z-30"
                    aria-label="Close"
                >
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex items-center justify-center gap-3 mt-6 relative z-10">
                    <div className="bg-blue-100 rounded-2xl py-2 px-4">
                        <h3 className="text-lg font-semibold text-blue-800 text-center break-words">{qrCodeData.name}</h3>
                    </div>
                </div>

                <div className="absolute inset-0 bg-cover bg-center filter blur-md opacity-40 rounded-3xl"
                    style={{ backgroundImage: `url("https://source.unsplash.com/random/800x600")` }}>
                </div>

                <div className="relative z-20 p-4 flex justify-center items-center mt-2">
                    <div className="bg-white rounded-2xl shadow-lg p-3 relative">
                        {loading ? (
                            <div className="text-center">Loading QR Code...</div>
                        ) : error ? (
                            <div className="text-center text-red-500">Error: {error}</div>
                        ) : qrCodeImage ? (
                            <img src={qrCodeImage} alt="QR Code" style={{ maxWidth: '200px', maxHeight: '200px' }} />
                        ) : (
                            <div className="text-center">Failed to generate QR Code.</div>
                        )}
                    </div>
                </div>

                <div className="p-4 text-center text-gray-500 text-xs">
                    Created on {formatDate(qrCodeData.createdAt)}
                    {qrCodeData.type === 'dynamic' && qrCodeData.visits !== undefined && (
                        <span className="block mt-1">
                            {qrCodeData.visits} visit{qrCodeData.visits !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRCodeViewModal;
