import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode'; // Add this line for logo rendering
import { QRCodeData } from '../types/qrcode';
import { Trash2, XCircle } from 'lucide-react';
import QRCodeDownloader from './QRCodeDownloader';
import { motion, AnimatePresence } from 'framer-motion';
import BulkRemoveModal from './BulkRemoveModal';

// Util: Generate QR thumbnail as dataURL with logo support
async function renderQRCodeThumbnail({
    value,
    size = 48,
    errorCorrectionLevel = 'M',
    bgColor = '#ffffff',
    fgColor = '#000000',
    logoDataUrl,
}: {
    value: string;
    size?: number;
    errorCorrectionLevel?: string;
    bgColor?: string;
    fgColor?: string;
    logoDataUrl?: string;
}): Promise<string> {
    // Setup canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return "";

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Draw QR code
    await QRCode.toCanvas(canvas, value, {
        errorCorrectionLevel,
        width: size,
        height: size,
        color: {
            dark: fgColor,
            light: bgColor,
        },
        margin: 0,
    });

    // Draw optional logo
    if (logoDataUrl) {
        return new Promise((resolve) => {
            const logoImg = new window.Image();
            logoImg.crossOrigin = "anonymous";
            logoImg.onload = () => {
                // 30% size, centered, optional circular mask
                const logoSize = size * 0.3;
                const logoX = (size - logoSize) / 2;
                const logoY = (size - logoSize) / 2;
                const logoRadius = logoSize / 2;
                const logoPadding = logoSize * 0.13;

                // Draw white background (circle)
                ctx.save();
                ctx.beginPath();
                ctx.arc(logoX + logoRadius, logoY + logoRadius, logoRadius + logoPadding, 0, 2 * Math.PI);
                ctx.fillStyle = "white";
                ctx.fill();
                // Clip to inner logo circle
                ctx.beginPath();
                ctx.arc(logoX + logoRadius, logoY + logoRadius, logoRadius, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
                ctx.restore();
                resolve(canvas.toDataURL('image/png'));
            };
            logoImg.onerror = () => resolve(canvas.toDataURL('image/png'));
            logoImg.src = logoDataUrl;
        });
    } else {
        return canvas.toDataURL('image/png');
    }
}

interface QRCodeListCollectionProps {
    qrCodes: QRCodeData[];
    onViewQRCode: (qrCode: QRCodeData) => void;
    onDeleteQRCode: (qrCodeIds: string | string[]) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
    onRefresh: () => void;
    isLoading?: boolean;
    collectionId?: string; // Made optional for backward compatibility
}

const QRCodeListCollection: React.FC<QRCodeListCollectionProps> = ({
    qrCodes,
    onViewQRCode,
    onDeleteQRCode,
    showToast,
    onRefresh,
    isLoading = false,
    collectionId
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState<string | null>(null);
    const [selectedQrCodes, setSelectedQrCodes] = useState<string[]>([]);
    const [isBulkRemoveModalOpen, setIsBulkRemoveModalOpen] = useState(false);
    const [qrCodeToRemove, setQrCodeToRemove] = useState<string | null>(null);
    const [isRemoveConfirmationOpen, setIsRemoveConfirmationOpen] = useState(false);
    const [qrThumbnails, setQrThumbnails] = useState<{ [id: string]: string }>({});

    // Generate thumbnails (logo-aware) for each QR code
    useEffect(() => {
        let isMounted = true;
        async function generateThumbnails() {
            const entries = await Promise.all(
                qrCodes.map(async (qrCode) => {
                    const dataUrl = await renderQRCodeThumbnail({
                        value: qrCode.url, // or generateQRValue if you use more than URL
                        size: 48,
                        errorCorrectionLevel: qrCode.errorCorrectionLevel || 'M',
                        bgColor: qrCode.backgroundColor || "#ffffff",
                        fgColor: qrCode.color || "#000000",
                        logoDataUrl: qrCode.logoDataUrl,
                    });
                    return [qrCode.id, dataUrl];
                })
            );
            if (isMounted) {
                setQrThumbnails(Object.fromEntries(entries));
            }
        }
        generateThumbnails();
        return () => { isMounted = false };
    }, [qrCodes]);

    const handleCheckboxChange = (qrCodeId: string) => {
        setSelectedQrCodes(prevSelected =>
            prevSelected.includes(qrCodeId)
                ? prevSelected.filter(id => id !== qrCodeId)
                : [...prevSelected, qrCodeId]
        );
    };

    const handleSelectAll = () => {
        const isAllSelected = qrCodes.length > 0 && selectedQrCodes.length === qrCodes.length;
        setSelectedQrCodes(isAllSelected ? [] : qrCodes.map(qrCode => qrCode.id));
    };

    const handleConfirmBulkRemove = async () => {
        try {
            await onDeleteQRCode(selectedQrCodes);
            setSelectedQrCodes([]);
            setIsBulkRemoveModalOpen(false);
            showToast('QR code(s) removed from collection successfully!', 'success');
            onRefresh();
        } catch (error: any) {
            showToast(`Failed to remove QR code(s): ${error.message}`, 'error');
        }
    };

    const confirmRemoveQrCode = (qrCodeId: string) => {
        setQrCodeToRemove(qrCodeId);
        setIsRemoveConfirmationOpen(true);
        setIsMenuOpen(null);
    };

    const cancelRemoveQrCode = () => {
        setQrCodeToRemove(null);
        setIsRemoveConfirmationOpen(false);
    };

    const handleIndividualRemoveQrCode = async () => {
        if (!qrCodeToRemove) return;
        try {
            await onDeleteQRCode(qrCodeToRemove);
            showToast('QR code removed from collection successfully!', 'success');
            onRefresh();
        } catch (error: any) {
            showToast(`Failed to remove QR code: ${error.message}`, 'error');
        } finally {
            setIsRemoveConfirmationOpen(false);
            setQrCodeToRemove(null);
        }
    };

    useEffect(() => { setSelectedQrCodes([]); }, [qrCodes]);

    if (isLoading) {
        return <div className="py-4 text-center text-gray-500">Loading QR codes...</div>;
    }

    const isAllSelected = qrCodes.length > 0 && selectedQrCodes.length === qrCodes.length;

    return (
        <div className="flex flex-col h-full">
            <AnimatePresence>
                {isRemoveConfirmationOpen && qrCodeToRemove && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                        initial="hidden" animate="visible" exit="exit"
                        variants={{
                            hidden: { opacity: 0, scale: 0.9 },
                            visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeInOut" } },
                            exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15, ease: "easeInOut" } }
                        }}
                        onClick={cancelRemoveQrCode}
                    >
                        <motion.div
                            className="relative bg-white rounded-2xl shadow-lg max-w-md w-full mx-4 p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={cancelRemoveQrCode} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none" aria-label="Close">
                                <XCircle className="h-5 w-5" />
                            </button>
                            <div className="text-center">
                                <div className="flex items-center justify-center rounded-full bg-red-100 p-3 mx-auto mb-4">
                                    <Trash2 className="h-8 w-8 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Remove QR Code?</h3>
                                <p className="text-sm text-gray-600 mb-4">Are you sure you want to remove this QR code from this collection?</p>
                            </div>
                            <div className="flex justify-center space-x-4">
                                <button onClick={cancelRemoveQrCode} className="py-2 px-5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 focus:outline-none text-sm">Cancel</button>
                                <button onClick={handleIndividualRemoveQrCode} className="py-2 px-5 bg-red-600 text-white rounded-xl shadow-md hover:bg-red-700 focus:outline-none text-sm">Confirm Remove</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div>
                {qrCodes.length > 0 && (
                    <div className="mb-4 flex justify-between items-center">
                        <label className="inline-flex items-center">
                            <input type="checkbox" className="form-checkbox h-3 w-3 text-green-500 rounded" checked={isAllSelected} onChange={handleSelectAll} />
                            <span className="ml-2 text-gray-700 text-xs">Select All</span>
                        </label>
                        {selectedQrCodes.length > 0 && (
                            <button onClick={() => setIsBulkRemoveModalOpen(true)} className="flex items-center py-1 px-3 rounded-lg bg-red-500 hover:bg-red-700 text-white font-medium text-xs">
                                <Trash2 className="h-4 w-4 mr-1" /> Remove
                            </button>
                        )}
                    </div>
                )}
                <ul className="divide-y divide-gray-200 overflow-y-auto max-h-[70vh] flex-grow">
                    {qrCodes.length === 0 ? (
                        <li className="py-4 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <p className="text-sm">No QR codes found in this collection.</p>
                            </div>
                        </li>
                    ) : (
                        qrCodes.map((qrCode) => (
                            <li key={qrCode.id} className="py-4 flex items-center justify-between relative">
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox h-4 w-4 text-green-500 rounded"
                                        value={qrCode.id}
                                        checked={selectedQrCodes.includes(qrCode.id)}
                                        onChange={() => handleCheckboxChange(qrCode.id)}
                                    />
                                    <button onClick={() => onViewQRCode(qrCode)} className="w-12 h-12 relative flex items-center justify-center bg-gray-100 rounded-md">
                                        {qrThumbnails[qrCode.id] ? (
                                            <img src={qrThumbnails[qrCode.id]} alt="QR Thumbnail" className="w-12 h-12 object-contain" />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-200 animate-pulse rounded-md" />
                                        )}
                                    </button>
                                    <div onClick={() => onViewQRCode(qrCode)} style={{ cursor: 'pointer' }}>
                                        <p className="text-sm font-medium text-gray-900">{qrCode.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <QRCodeDownloader qrCodeData={qrCode} />
                                    <button onClick={() => confirmRemoveQrCode(qrCode.id)} className="p-2 rounded-md text-gray-500 hover:text-red-500">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
            {qrCodes.length > 0 && (
                <div className="absolute bottom-0 left-0 w-full bg-gray-100 border-t border-gray-200 py-2 px-4 text-center text-gray-700 text-sm rounded-b-3xl">
                    All QR codes for this collection are shown.
                </div>
            )}
            <BulkRemoveModal
                isOpen={isBulkRemoveModalOpen}
                onClose={() => setIsBulkRemoveModalOpen(false)}
                onConfirm={handleConfirmBulkRemove}
                selectedCount={selectedQrCodes.length}
            />
        </div>
    );
};

export default QRCodeListCollection;
